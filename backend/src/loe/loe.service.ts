import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { LoeStatus, Prisma } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { REALTIME_TOPICS, RealtimeService } from '../realtime/realtime.service';
import { DayEntryInput } from './dto/loe.input';
import { calculateUtilizationPercent, getMonthDate, getWorkingDates, isWeekendDate } from './loe.utils';
import { validateNoWeekendEntry, validateSubmissionCoverage } from './loe.validation';

@Injectable()
export class LoeService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private notificationsService: NotificationsService,
    private realtimeService: RealtimeService,
  ) {}

  private async publishLoeEvent(sheet: {
    id: string;
    userId: string;
    reviewerId?: string | null;
    year: number;
    month: number;
  }) {
    await this.realtimeService.publish({
      topic: REALTIME_TOPICS.LOE,
      entityId: sheet.id,
      userId: sheet.userId,
      reviewerId: sheet.reviewerId,
      year: sheet.year,
      month: sheet.month,
    });
  }

  private async ensureFixedCategoriesExist() {
    await Promise.all([
      this.prisma.fixedCategory.upsert({
        where: { code: 'TIME_OFF' },
        update: { name: 'Time-Off', isActive: true },
        create: { name: 'Time-Off', code: 'TIME_OFF', isActive: true },
      }),
      this.prisma.fixedCategory.upsert({
        where: { code: 'BENCH' },
        update: { name: 'Open to New Projects', isActive: true },
        create: { name: 'Open to New Projects', code: 'BENCH', isActive: true },
      }),
      this.prisma.fixedCategory.upsert({
        where: { code: 'OTHER' },
        update: { name: 'Other', isActive: true },
        create: { name: 'Other', code: 'OTHER', isActive: true },
      }),
    ]);
  }

  private async assertSheetAccess(
    actor: { id: string; role?: string | null },
    targetUserId: string,
  ) {
    if (actor.id === targetUserId || actor.role === 'ADMIN') {
      return;
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { reviewerId: true },
    });

    if (!targetUser || targetUser.reviewerId !== actor.id) {
      throw new ForbiddenException('You can only view your own sheets or sheets assigned to you for review');
    }
  }

  private async getLatestReopenComment(loeSheetId: string) {
    const log = await this.prisma.auditLog.findFirst({
      where: {
        entity: 'LoeSheet',
        entityId: loeSheetId,
        action: 'LOE_REOPENED',
      },
      orderBy: { createdAt: 'desc' },
    });

    const meta = (log?.meta || {}) as Record<string, unknown>;
    return typeof meta.comment === 'string' ? meta.comment : null;
  }

  async ensureSheet(userId: string, year: number, month: number) {
    try {
      return await this.prisma.loeSheet.upsert({
        where: { userId_year_month: { userId, year, month } },
        update: {},
        create: { userId, year, month },
        include: {
          user: true,
          entries: { include: { project: true, fixedCategory: true } },
        },
      });
    } catch (error) {
      // Concurrent requests can race on first-sheet creation for the same month.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const existing = await this.prisma.loeSheet.findUnique({
          where: { userId_year_month: { userId, year, month } },
          include: {
            user: true,
            entries: { include: { project: true, fixedCategory: true } },
          },
        });

        if (existing) {
          return existing;
        }
      }

      throw error;
    }
  }

  async getSheetForUser(
    actor: { id: string; role?: string | null },
    userId: string,
    year: number,
    month: number,
    includeRelations = false,
  ) {
    await this.assertSheetAccess(actor, userId);
    const sheet = await this.ensureSheet(userId, year, month);
    const totalHours = await this.getTotalHours(sheet.id);
    if (!includeRelations) {
      return {
        ...sheet,
        utilizationPercent: await this.getUtilizationPercent(sheet.id, year, month),
        totalHours,
        reopenComment: await this.getLatestReopenComment(sheet.id),
      };
    }
    const full = await this.prisma.loeSheet.findUnique({
      where: { id: sheet.id },
      include: {
        user: true,
        reviewer: true,
        entries: { include: { project: true, fixedCategory: true } },
      },
    });
    return {
      ...full,
      utilizationPercent: await this.getUtilizationPercent(sheet.id, year, month),
      totalHours,
      reopenComment: await this.getLatestReopenComment(sheet.id),
    };
  }

  async loeSheets(actor: { id: string; role?: string | null }, userId: string, status?: LoeStatus) {
    await this.assertSheetAccess(actor, userId);
    const now = new Date();
    await this.ensureSheet(userId, now.getFullYear(), now.getMonth() + 1);

    const sheets = await this.prisma.loeSheet.findMany({
      where: { userId, status: status || undefined },
      include: { user: true, entries: true },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    return Promise.all(
      sheets.map(async (sheet) => ({
        ...sheet,
        utilizationPercent: await this.getUtilizationPercent(sheet.id, sheet.year, sheet.month),
        totalHours: await this.getTotalHours(sheet.id),
        reopenComment: await this.getLatestReopenComment(sheet.id),
      })),
    );
  }

  async pendingReviewSheets(reviewerId: string) {
    return this.reviewSheets(reviewerId, [LoeStatus.SUBMITTED]);
  }

  async reviewSheets(reviewerId: string, statuses?: LoeStatus[]) {
    const sheets = await this.prisma.loeSheet.findMany({
      where: {
        reviewerId,
        status: statuses?.length ? { in: statuses } : undefined,
      },
      include: { user: true, reviewer: true, entries: true },
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { submittedAt: 'desc' }],
    });

    return Promise.all(
      sheets.map(async (sheet) => ({
        id: sheet.id,
        year: sheet.year,
        month: sheet.month,
        user: sheet.user,
        reviewer: sheet.reviewer,
        status: sheet.status,
        isDelayed: sheet.isDelayed,
        totalHours: sheet.entries.reduce((sum, entry) => sum + Number(entry.hours), 0),
        utilizationPercent: await this.getUtilizationPercent(sheet.id, sheet.year, sheet.month),
        submittedAt: sheet.submittedAt,
        approvedAt: sheet.approvedAt,
      })),
    );
  }

  async dayEntries(userId: string, year: number, month: number, day: number) {
    const sheet = await this.ensureSheet(userId, year, month);
    const date = getMonthDate(year, month, day);
    return this.prisma.loeEntry.findMany({
      where: { loeSheetId: sheet.id, date },
      include: { project: true, fixedCategory: true },
    });
  }

  fixedCategories() {
    return this.ensureFixedCategoriesExist().then(() =>
      this.prisma.fixedCategory.findMany({
      where: { isActive: true },
      }).then((categories) => {
        const order = ['TIME_OFF', 'BENCH', 'OTHER'];
        return categories.sort((a, b) => {
          const aIndex = order.indexOf(a.code);
          const bIndex = order.indexOf(b.code);
          const aRank = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
          const bRank = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;
          return aRank - bRank || a.name.localeCompare(b.name);
        });
      }),
    );
  }

  private async assertEditable(userId: string, year: number, month: number) {
    const sheet = await this.ensureSheet(userId, year, month);
    if (sheet.status === LoeStatus.SUBMITTED || sheet.status === LoeStatus.APPROVED) {
      throw new ForbiddenException('Cannot edit a submitted or approved sheet');
    }
    return sheet;
  }

  private async validateEntries(userId: string, year: number, month: number, entries: DayEntryInput[]) {
    await this.ensureFixedCategoriesExist();
    const [allocations, fixedCategories] = await Promise.all([
      this.prisma.allocation.findMany({
        where: {
          userId,
          isActive: true,
        },
      }),
      this.prisma.fixedCategory.findMany({ where: { isActive: true } }),
    ]);

    for (const entry of entries) {
      if (entry.hours < 0) {
        throw new BadRequestException('Hours must be >= 0');
      }
      if (!entry.projectId && !entry.fixedCategoryId) {
        throw new BadRequestException('Each entry must reference a project or fixed category');
      }
      if (entry.projectId && !allocations.some((allocation) => allocation.projectId === entry.projectId)) {
        throw new BadRequestException('Cannot log hours for unallocated project');
      }
      if (entry.fixedCategoryId && !fixedCategories.some((category) => category.id === entry.fixedCategoryId)) {
        throw new BadRequestException('Invalid fixed category');
      }
    }
  }

  async saveDayEntries(userId: string, year: number, month: number, day: number, entries: DayEntryInput[]) {
    validateNoWeekendEntry(year, month, day);
    await this.validateEntries(userId, year, month, entries);
    const sheet = await this.assertEditable(userId, year, month);
    const date = getMonthDate(year, month, day);
    const filtered = entries.filter((entry) => entry.hours > 0);

    await this.prisma.$transaction([
      this.prisma.loeEntry.deleteMany({ where: { loeSheetId: sheet.id, date } }),
      ...filtered.map((entry) =>
        this.prisma.loeEntry.create({
          data: {
            loeSheetId: sheet.id,
            date,
            projectId: entry.projectId,
            fixedCategoryId: entry.fixedCategoryId,
            hours: new Prisma.Decimal(entry.hours),
            note: entry.note || null,
          },
        }),
      ),
    ]);

    const updatedSheet = await this.getSheetForUser({ id: userId }, userId, year, month, true);
    await this.publishLoeEvent(updatedSheet);
    return updatedSheet;
  }

  async submitLoe(userId: string, loeSheetId: string) {
    const sheet = await this.prisma.loeSheet.findUnique({
      where: { id: loeSheetId },
      include: { user: true, entries: true },
    });
    if (!sheet || sheet.userId !== userId) {
      throw new ForbiddenException('Sheet not found');
    }
    if (sheet.status === LoeStatus.APPROVED) {
      throw new ForbiddenException('Approved sheets cannot change');
    }

    const grouped = new Map<string, number>();
    for (const entry of sheet.entries) {
      const key = new Date(entry.date).toISOString().slice(0, 10);
      grouped.set(key, (grouped.get(key) || 0) + Number(entry.hours));
    }
    validateSubmissionCoverage(sheet.year, sheet.month, grouped);

    const updated = await this.prisma.loeSheet.update({
      where: { id: loeSheetId },
      data: {
        status: LoeStatus.SUBMITTED,
        submittedAt: new Date(),
        approvedAt: null,
        reviewerId: sheet.user.reviewerId,
      },
      include: { user: true, entries: { include: { project: true, fixedCategory: true } } },
    });

    if (sheet.user.reviewerId) {
      const reviewer = await this.prisma.user.findUnique({ where: { id: sheet.user.reviewerId } });
      if (reviewer?.email) {
        await this.emailService.sendMail(
          reviewer.email,
          `[LOE Tracker] ${sheet.user.name} submitted LOE for ${new Date(sheet.year, sheet.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
          `<p>${sheet.user.name} submitted LOE for ${sheet.month}/${sheet.year}.</p>`,
        );
      }
      await this.notificationsService.createNotification({
        recipientId: sheet.user.reviewerId,
        title: `${sheet.user.name} submitted LOE`,
        message: `${sheet.user.name} submitted ${new Date(sheet.year, sheet.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} for review.`,
        type: 'LOE_SUBMITTED',
        link: `/review-loe/${sheet.year}/${sheet.month}?userId=${sheet.userId}`,
      });
    }

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'LOE_SUBMITTED',
        entity: 'LoeSheet',
        entityId: loeSheetId,
      },
    });

    const result = {
      ...updated,
      utilizationPercent: await this.getUtilizationPercent(updated.id, updated.year, updated.month),
      totalHours: await this.getTotalHours(updated.id),
    };
    await this.publishLoeEvent(result);
    return result;
  }

  async approveLoe(actorId: string, loeSheetId: string) {
    const sheet = await this.prisma.loeSheet.findUnique({ where: { id: loeSheetId } });
    if (!sheet || sheet.reviewerId !== actorId) {
      throw new ForbiddenException('Only assigned reviewer can approve');
    }
    if (sheet.status === LoeStatus.APPROVED) {
      return this.getSheetById(loeSheetId);
    }
    const updated = await this.prisma.loeSheet.update({
      where: { id: loeSheetId },
      data: { status: LoeStatus.APPROVED, approvedAt: new Date() },
      include: { user: true, entries: { include: { project: true, fixedCategory: true } } },
    });
    await this.notificationsService.createNotification({
      recipientId: updated.userId,
      title: 'LOE approved',
      message: `Your ${new Date(updated.year, updated.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} LOE was approved.`,
      type: 'LOE_APPROVED',
      link: `/loe/${updated.year}/${updated.month}`,
    });
    const result = {
      ...updated,
      utilizationPercent: await this.getUtilizationPercent(updated.id, updated.year, updated.month),
      totalHours: await this.getTotalHours(updated.id),
    };
    await this.publishLoeEvent(result);
    return result;
  }

  async reopenLoe(actorId: string, loeSheetId: string, comment: string) {
    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      throw new BadRequestException('Re-open comment is required');
    }

    const sheet = await this.prisma.loeSheet.findUnique({ where: { id: loeSheetId } });
    if (!sheet || sheet.reviewerId !== actorId) {
      throw new ForbiddenException('Only assigned reviewer can re-open');
    }
    if (sheet.status === LoeStatus.DRAFT) {
      throw new ForbiddenException('Draft sheets cannot be reopened');
    }
    const updated = await this.prisma.loeSheet.update({
      where: { id: loeSheetId },
      data: { status: LoeStatus.REOPENED, approvedAt: null },
      include: { user: true, entries: { include: { project: true, fixedCategory: true } } },
    });
    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'LOE_REOPENED',
        entity: 'LoeSheet',
        entityId: loeSheetId,
        meta: {
          comment: trimmedComment,
        },
      },
    });
    await this.notificationsService.createNotification({
      recipientId: updated.userId,
      title: 'LOE reopened',
      message: `Your ${new Date(updated.year, updated.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} LOE was reopened for changes. Comment: ${trimmedComment}`,
      type: 'LOE_REOPENED',
      link: `/loe/${updated.year}/${updated.month}`,
    });
    const result = {
      ...updated,
      utilizationPercent: await this.getUtilizationPercent(updated.id, updated.year, updated.month),
      totalHours: await this.getTotalHours(updated.id),
      reopenComment: trimmedComment,
    };
    await this.publishLoeEvent(result);
    return result;
  }

  async adminOverview(filters: {
    year: number;
    month: number;
    country?: string;
    city?: string;
    status?: LoeStatus;
    overUtilized?: boolean;
  }) {
    const sheets = await this.prisma.loeSheet.findMany({
      where: {
        year: filters.year,
        month: filters.month,
        status: filters.status || undefined,
        user: {
          country: filters.country || undefined,
          city: filters.city || undefined,
        },
      },
      include: { user: true, entries: true },
      orderBy: { updatedAt: 'desc' },
    });

    const mapped = await Promise.all(
      sheets.map(async (sheet) => {
        const totalHours = sheet.entries.reduce((sum, entry) => sum + Number(entry.hours), 0);
        const utilizationPercent = calculateUtilizationPercent(
          totalHours,
          getWorkingDates(sheet.year, sheet.month).length,
        );
        return {
          id: sheet.id,
          year: sheet.year,
          month: sheet.month,
          user: sheet.user,
          reviewer: null,
          status: sheet.status,
          isDelayed: sheet.isDelayed,
          totalHours,
          utilizationPercent,
          submittedAt: sheet.submittedAt,
          approvedAt: sheet.approvedAt,
        };
      }),
    );

    return filters.overUtilized ? mapped.filter((item) => item.utilizationPercent >= 120) : mapped;
  }

  async getSheetById(id: string) {
    const sheet = await this.prisma.loeSheet.findUnique({
      where: { id },
      include: { user: true, entries: { include: { project: true, fixedCategory: true } } },
    });
    return {
      ...sheet,
      utilizationPercent: await this.getUtilizationPercent(sheet.id, sheet.year, sheet.month),
      totalHours: await this.getTotalHours(sheet.id),
      reopenComment: await this.getLatestReopenComment(sheet.id),
    };
  }

  async getUtilizationPercent(loeSheetId: string, year: number, month: number) {
    const entries = await this.prisma.loeEntry.findMany({ where: { loeSheetId } });
    const total = entries.reduce((sum, entry) => sum + Number(entry.hours), 0);
    return calculateUtilizationPercent(total, getWorkingDates(year, month).length);
  }

  async getTotalHours(loeSheetId: string) {
    const entries = await this.prisma.loeEntry.findMany({ where: { loeSheetId } });
    return Number(entries.reduce((sum, entry) => sum + Number(entry.hours), 0).toFixed(2));
  }

  async sendReminderEmails(now = new Date()) {
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const users = await this.prisma.user.findMany({ where: { isActive: true } });

    for (const user of users) {
      const sheet = await this.prisma.loeSheet.findUnique({
        where: { userId_year_month: { userId: user.id, year, month } },
      });
      if (!sheet || sheet.status === LoeStatus.DRAFT || sheet.status === LoeStatus.REOPENED) {
        await this.emailService.sendMail(
          user.email,
          `[LOE Tracker] Reminder: Please submit your LOE for ${monthName}`,
          `<p>Hello ${user.name}, please submit your LOE for ${monthName} by month end.</p>`,
        );
        await this.prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'LOE_REMINDER_SENT',
            entity: 'LoeSheet',
            entityId: sheet?.id || `${user.id}-${year}-${month}`,
          },
        });
      }
    }
  }

  async markDelayedSheets(now = new Date()) {
    const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const year = previousMonthDate.getFullYear();
    const month = previousMonthDate.getMonth() + 1;
    const users = await this.prisma.user.findMany({ where: { isActive: true } });

    for (const user of users) {
      const sheet = await this.prisma.loeSheet.upsert({
        where: { userId_year_month: { userId: user.id, year, month } },
        update: {},
        create: { userId: user.id, year, month },
      });

      if (sheet.status !== LoeStatus.SUBMITTED && sheet.status !== LoeStatus.APPROVED && !sheet.isDelayed) {
        await this.prisma.loeSheet.update({
          where: { id: sheet.id },
          data: { isDelayed: true, markedDelayedAt: now },
        });
        await this.prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'LOE_MARKED_DELAYED',
            entity: 'LoeSheet',
            entityId: sheet.id,
          },
        });
      }
    }
  }
}

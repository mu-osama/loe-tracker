import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import { REALTIME_TOPICS, RealtimeService } from '../realtime/realtime.service';
import { CreateAllocationInput, UpdateAllocationInput } from './dto/allocation.input';

@Injectable()
export class AllocationsService {
  constructor(
    private prisma: PrismaService,
    private realtimeService: RealtimeService,
  ) {}

  private pickCanonicalAllocation<T extends { userId: string; projectId: string; isActive: boolean; createdAt: Date }>(
    current: T | undefined,
    candidate: T,
  ) {
    if (!current) {
      return candidate;
    }

    if (candidate.isActive && !current.isActive) {
      return candidate;
    }

    if (candidate.isActive === current.isActive && candidate.createdAt > current.createdAt) {
      return candidate;
    }

    return current;
  }

  private dedupeAllocations<T extends { id: string; userId: string; projectId: string; isActive: boolean; createdAt: Date }>(
    rows: T[],
  ) {
    const map = new Map<string, T>();

    for (const row of rows) {
      const key = `${row.userId}:${row.projectId}`;
      map.set(key, this.pickCanonicalAllocation(map.get(key), row));
    }

    return Array.from(map.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async allocations(userId?: string) {
    const rows = await this.prisma.allocation.findMany({
      where: { userId: userId || undefined },
      include: { user: true, project: true, assignedBy: true },
      orderBy: { createdAt: 'desc' },
    });

    return this.dedupeAllocations(rows);
  }

  async createAllocation(input: CreateAllocationInput, assignedById: string) {
    const existingAllocations = await this.prisma.allocation.findMany({
      where: {
        userId: input.userId,
        projectId: input.projectId,
      },
      include: { user: true, project: true, assignedBy: true },
      orderBy: { createdAt: 'desc' },
    });

    const canonical = this.dedupeAllocations(existingAllocations)[0];

    if (canonical?.isActive) {
      throw new BadRequestException(
        'This project is already assigned to the selected user. Edit the existing allocation instead.',
      );
    }

    let allocation;

    try {
      allocation = canonical
        ? await this.prisma.allocation.update({
            where: { id: canonical.id },
            data: {
              percentage: new Prisma.Decimal(input.percentage),
              isActive: true,
              assignedById,
            },
            include: { user: true, project: true, assignedBy: true },
          })
        : await this.prisma.allocation.create({
            data: {
              userId: input.userId,
              projectId: input.projectId,
              percentage: new Prisma.Decimal(input.percentage),
              assignedById,
            },
            include: { user: true, project: true, assignedBy: true },
          });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException(
          'This project is already assigned to the selected user. Edit the existing allocation instead.',
        );
      }

      throw error;
    }

    await this.realtimeService.publish({
      topic: REALTIME_TOPICS.ALLOCATION,
      entityId: allocation.id,
      userId: allocation.userId,
    });
    return allocation;
  }

  async updateAllocation(id: string, input: UpdateAllocationInput, assignedById?: string) {
    const allocation = await this.prisma.allocation.update({
      where: { id },
      data: {
        ...(input.percentage !== undefined ? { percentage: new Prisma.Decimal(input.percentage) } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...(input.isActive === true && assignedById ? { assignedById } : {}),
      },
      include: { user: true, project: true, assignedBy: true },
    });

    if (allocation.isActive) {
      await this.prisma.allocation.updateMany({
        where: {
          userId: allocation.userId,
          projectId: allocation.projectId,
          isActive: true,
          id: { not: allocation.id },
        },
        data: { isActive: false },
      });
    }

    await this.realtimeService.publish({
      topic: REALTIME_TOPICS.ALLOCATION,
      entityId: allocation.id,
      userId: allocation.userId,
    });
    return allocation;
  }

  async deactivateAllocation(id: string) {
    const allocation = await this.prisma.allocation.update({
      where: { id },
      data: { isActive: false },
      include: { user: true, project: true, assignedBy: true },
    });

    await this.prisma.allocation.updateMany({
      where: {
        userId: allocation.userId,
        projectId: allocation.projectId,
        isActive: true,
      },
      data: { isActive: false },
    });

    await this.realtimeService.publish({
      topic: REALTIME_TOPICS.ALLOCATION,
      entityId: allocation.id,
      userId: allocation.userId,
    });
    return allocation;
  }
}

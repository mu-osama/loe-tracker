import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { REALTIME_TOPICS, RealtimeService } from '../realtime/realtime.service';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private realtimeService: RealtimeService,
  ) {}

  async notifications(recipientId: string, limit = 20) {
    const rows = await this.prisma.auditLog.findMany({
      where: {
        userId: recipientId,
        action: 'IN_APP_NOTIFICATION',
        entity: 'Notification',
      },
      orderBy: { createdAt: 'desc' },
    });

    const items = rows.map((row) => {
      const meta = (row.meta || {}) as Record<string, unknown>;
      return {
        id: row.id,
        recipientId: row.userId,
        title: String(meta.title || 'Notification'),
        message: String(meta.message || ''),
        link: (meta.link as string | null | undefined) || null,
        type: String(meta.type || 'SYSTEM'),
        isRead: Boolean(meta.isRead),
        createdAt: row.createdAt,
      };
    });

    return {
      items: items.slice(0, limit),
      unreadCount: items.filter((item) => !item.isRead).length,
    };
  }

  async createNotification(input: {
    recipientId: string;
    title: string;
    message: string;
    type: string;
    link?: string | null;
  }) {
    const notification = await this.prisma.auditLog.create({
      data: {
        userId: input.recipientId,
        action: 'IN_APP_NOTIFICATION',
        entity: 'Notification',
        entityId: `notification:${Date.now()}`,
        meta: {
          title: input.title,
          message: input.message,
          type: input.type,
          link: input.link || null,
          isRead: false,
        },
      },
    });

    await this.realtimeService.publish({
      topic: REALTIME_TOPICS.NOTIFICATION,
      entityId: notification.id,
      userId: notification.userId,
      title: input.title,
      message: input.message,
      link: input.link || null,
    });

    return {
      id: notification.id,
      recipientId: notification.userId,
      title: input.title,
      message: input.message,
      link: input.link || null,
      type: input.type,
      isRead: false,
      createdAt: notification.createdAt,
    };
  }

  async markAsRead(recipientId: string, notificationId: string) {
    const notification = await this.prisma.auditLog.findUnique({
      where: { id: notificationId },
    });
    if (!notification || notification.userId !== recipientId || notification.action !== 'IN_APP_NOTIFICATION') {
      throw new ForbiddenException('Notification not found');
    }
    const meta = (notification.meta || {}) as Record<string, unknown>;
    const updated = await this.prisma.auditLog.update({
      where: { id: notificationId },
      data: {
        meta: {
          ...meta,
          isRead: true,
        },
      },
    });
    const updatedMeta = (updated.meta || {}) as Record<string, unknown>;
    return {
      id: updated.id,
      recipientId: updated.userId,
      title: String(updatedMeta.title || 'Notification'),
      message: String(updatedMeta.message || ''),
      link: (updatedMeta.link as string | null | undefined) || null,
      type: String(updatedMeta.type || 'SYSTEM'),
      isRead: Boolean(updatedMeta.isRead),
      createdAt: updated.createdAt,
    };
  }

  async markAllAsRead(recipientId: string) {
    const notifications = await this.prisma.auditLog.findMany({
      where: {
        userId: recipientId,
        action: 'IN_APP_NOTIFICATION',
        entity: 'Notification',
      },
    });
    await Promise.all(
      notifications
        .filter((row) => row.action === 'IN_APP_NOTIFICATION' && row.entity === 'Notification')
        .map((row) =>
          this.prisma.auditLog.update({
            where: { id: row.id },
            data: {
              meta: {
                ...((row.meta || {}) as Record<string, unknown>),
                isRead: true,
              },
            },
          }),
        ),
    );
    return true;
  }
}

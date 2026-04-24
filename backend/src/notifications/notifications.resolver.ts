import { UseGuards } from '@nestjs/common';
import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { NotificationFeedType, NotificationType } from './notifications.types';
import { NotificationsService } from './notifications.service';

@Resolver(() => NotificationType)
@UseGuards(GqlAuthGuard)
export class NotificationsResolver {
  constructor(private notificationsService: NotificationsService) {}

  @Query(() => NotificationFeedType)
  notifications(
    @CurrentUser() user,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ) {
    return this.notificationsService.notifications(user.id, limit);
  }

  @Mutation(() => NotificationType)
  markNotificationRead(
    @CurrentUser() user,
    @Args('notificationId', { type: () => ID }) notificationId: string,
  ) {
    return this.notificationsService.markAsRead(user.id, notificationId);
  }

  @Mutation(() => Boolean)
  markAllNotificationsRead(@CurrentUser() user) {
    return this.notificationsService.markAllAsRead(user.id);
  }
}

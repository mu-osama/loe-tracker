import { UseGuards } from '@nestjs/common';
import { Args, ID, Int, Resolver, Subscription } from '@nestjs/graphql';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { REALTIME_EVENT_NAME, RealtimeService } from './realtime.service';
import { RealtimeEventType } from './realtime.types';

@Resolver(() => RealtimeEventType)
@UseGuards(GqlAuthGuard)
export class RealtimeResolver {
  constructor(private readonly realtimeService: RealtimeService) {}

  @Subscription(() => RealtimeEventType, {
    name: REALTIME_EVENT_NAME,
    filter: (
      payload: Record<string, RealtimeEventType>,
      variables: {
        topics?: string[];
        userId?: string;
        reviewerId?: string;
        year?: number;
        month?: number;
      },
    ) => {
      const event = payload[REALTIME_EVENT_NAME];

      if (variables.topics?.length && !variables.topics.includes(event.topic)) {
        return false;
      }
      if (variables.userId && event.userId !== variables.userId) {
        return false;
      }
      if (variables.reviewerId && event.reviewerId !== variables.reviewerId) {
        return false;
      }
      if (variables.year && event.year !== variables.year) {
        return false;
      }
      if (variables.month && event.month !== variables.month) {
        return false;
      }

      return true;
    },
  })
  realtimeEvent(
    @Args('topics', { type: () => [String], nullable: true }) _topics?: string[],
    @Args('userId', { type: () => ID, nullable: true }) _userId?: string,
    @Args('reviewerId', { type: () => ID, nullable: true }) _reviewerId?: string,
    @Args('year', { type: () => Int, nullable: true }) _year?: number,
    @Args('month', { type: () => Int, nullable: true }) _month?: number,
  ) {
    return this.realtimeService.asyncIterator();
  }
}

import { Injectable } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { RealtimeEventType } from './realtime.types';

export const REALTIME_EVENT_NAME = 'realtimeEvent';

export const REALTIME_TOPICS = {
  USER: 'USER',
  PROJECT: 'PROJECT',
  ALLOCATION: 'ALLOCATION',
  LOE: 'LOE',
  NOTIFICATION: 'NOTIFICATION',
} as const;

@Injectable()
export class RealtimeService {
  private readonly pubSub = new PubSub();

  async publish(event: RealtimeEventType) {
    await this.pubSub.publish(REALTIME_EVENT_NAME, {
      [REALTIME_EVENT_NAME]: event,
    });
  }

  asyncIterator() {
    return this.pubSub.asyncIterableIterator(REALTIME_EVENT_NAME);
  }
}

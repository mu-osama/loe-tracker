import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class NotificationType {
  @Field(() => ID)
  id: string;

  @Field()
  recipientId: string;

  @Field()
  title: string;

  @Field()
  message: string;

  @Field({ nullable: true })
  link?: string | null;

  @Field()
  type: string;

  @Field()
  isRead: boolean;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class NotificationFeedType {
  @Field(() => [NotificationType])
  items: NotificationType[];

  @Field(() => Int)
  unreadCount: number;
}

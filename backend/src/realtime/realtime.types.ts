import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class RealtimeEventType {
  @Field()
  topic: string;

  @Field(() => ID)
  entityId: string;

  @Field(() => ID, { nullable: true })
  userId?: string | null;

  @Field(() => ID, { nullable: true })
  reviewerId?: string | null;

  @Field(() => Int, { nullable: true })
  year?: number | null;

  @Field(() => Int, { nullable: true })
  month?: number | null;

  @Field({ nullable: true })
  title?: string | null;

  @Field({ nullable: true })
  message?: string | null;

  @Field({ nullable: true })
  link?: string | null;
}

import { Field, Float, ID, InputType, Int, registerEnumType } from '@nestjs/graphql';
import { LoeStatus } from '@prisma/client';

registerEnumType(LoeStatus, { name: 'LoeStatus' });

@InputType()
export class LoeEntryInput {
  @Field(() => ID, { nullable: true })
  projectId?: string;

  @Field(() => ID, { nullable: true })
  fixedCategoryId?: string;

  @Field(() => Float)
  hours: number;

  @Field({ nullable: true })
  note?: string;
}

@InputType()
export class DayEntryInput {
  @Field(() => ID, { nullable: true })
  projectId?: string;

  @Field(() => ID, { nullable: true })
  fixedCategoryId?: string;

  @Field(() => Float)
  hours: number;

  @Field({ nullable: true })
  note?: string;
}

@InputType()
export class AdminOverviewFilterInput {
  @Field(() => Int)
  year: number;

  @Field(() => Int)
  month: number;

  @Field({ nullable: true })
  country?: string;

  @Field({ nullable: true })
  city?: string;

  @Field(() => LoeStatus, { nullable: true })
  status?: LoeStatus;

  @Field({ nullable: true })
  overUtilized?: boolean;
}

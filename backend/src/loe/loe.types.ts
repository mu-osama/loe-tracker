import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { LoeStatus } from '@prisma/client';
import { ProjectType } from '../projects/projects.types';
import { UserType } from '../auth/auth.types';

@ObjectType()
export class FixedCategoryType {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  code: string;

  @Field()
  isActive: boolean;
}

@ObjectType()
export class LoeEntryType {
  @Field(() => ID)
  id: string;

  @Field()
  loeSheetId: string;

  @Field()
  date: Date;

  @Field(() => ProjectType, { nullable: true })
  project?: ProjectType | null;

  @Field(() => FixedCategoryType, { nullable: true })
  fixedCategory?: FixedCategoryType | null;

  @Field(() => Float)
  hours: number;

  @Field({ nullable: true })
  note?: string | null;
}

@ObjectType()
export class LoeSheetType {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field(() => UserType, { nullable: true })
  user?: UserType;

  @Field(() => Int)
  year: number;

  @Field(() => Int)
  month: number;

  @Field(() => LoeStatus)
  status: LoeStatus;

  @Field()
  isDelayed: boolean;

  @Field({ nullable: true })
  markedDelayedAt?: Date | null;

  @Field({ nullable: true })
  submittedAt?: Date | null;

  @Field({ nullable: true })
  approvedAt?: Date | null;

  @Field({ nullable: true })
  reviewerId?: string | null;

  @Field(() => UserType, { nullable: true })
  reviewer?: UserType | null;

  @Field({ nullable: true })
  reopenComment?: string | null;

  @Field(() => [LoeEntryType], { nullable: true })
  entries?: LoeEntryType[];

  @Field(() => Float)
  utilizationPercent: number;

  @Field(() => Float)
  totalHours: number;
}

@ObjectType()
export class LoeSheetSummaryType {
  @Field(() => ID)
  id: string;

  @Field(() => Int)
  year: number;

  @Field(() => Int)
  month: number;

  @Field(() => UserType)
  user: UserType;

  @Field(() => UserType, { nullable: true })
  reviewer?: UserType | null;

  @Field(() => LoeStatus)
  status: LoeStatus;

  @Field()
  isDelayed: boolean;

  @Field(() => Float)
  totalHours: number;

  @Field(() => Float)
  utilizationPercent: number;

  @Field({ nullable: true })
  submittedAt?: Date | null;

  @Field({ nullable: true })
  approvedAt?: Date | null;
}

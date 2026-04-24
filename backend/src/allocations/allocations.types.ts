import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Float } from '@nestjs/graphql';
import { ProjectType } from '../projects/projects.types';
import { UserType } from '../auth/auth.types';

@ObjectType()
export class AllocationType {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => ID)
  projectId: string;

  @Field(() => Float)
  percentage: number;

  @Field()
  isActive: boolean;

  @Field()
  createdAt: Date;

  @Field(() => UserType, { nullable: true })
  user?: UserType;

  @Field(() => ProjectType, { nullable: true })
  project?: ProjectType;

  @Field(() => ID, { nullable: true })
  assignedById?: string | null;

  @Field(() => UserType, { nullable: true })
  assignedBy?: UserType;
}

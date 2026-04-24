import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Department, Role } from '@prisma/client';

registerEnumType(Role, { name: 'Role' });
registerEnumType(Department, { name: 'Department' });

@ObjectType()
export class UserType {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field()
  name: string;

  @Field(() => Role)
  role: Role;

  @Field({ nullable: true })
  position?: string | null;

  @Field(() => Department, { nullable: true })
  department?: Department | null;

  @Field({ nullable: true })
  reviewerId?: string | null;

  @Field({ nullable: true })
  country?: string | null;

  @Field({ nullable: true })
  city?: string | null;

  @Field()
  isActive: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class AuthPayload {
  @Field()
  token: string;

  @Field(() => UserType)
  user: UserType;
}

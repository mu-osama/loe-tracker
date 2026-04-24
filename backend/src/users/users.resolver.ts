import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { UserType } from '../auth/auth.types';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CreateUserInput, UpdateUserInput, UserFilterInput } from './dto/user.input';
import { UsersService } from './users.service';

@Resolver(() => UserType)
@UseGuards(GqlAuthGuard, RolesGuard)
export class UsersResolver {
  constructor(private usersService: UsersService) {}

  @Query(() => [UserType])
  users(@Args('filter', { nullable: true }) filter?: UserFilterInput) {
    return this.usersService.users(filter);
  }

  @Query(() => UserType, { nullable: true })
  user(@Args('id', { type: () => ID }) id: string) {
    return this.usersService.user(id);
  }

  @Roles(Role.ADMIN)
  @Mutation(() => UserType)
  createUser(@Args('input') input: CreateUserInput) {
    return this.usersService.createUser(input);
  }

  @Roles(Role.ADMIN)
  @Mutation(() => UserType)
  updateUser(@Args('id', { type: () => ID }) id: string, @Args('input') input: UpdateUserInput) {
    return this.usersService.updateUser(id, input);
  }

  @Roles(Role.ADMIN)
  @Mutation(() => UserType)
  deactivateUser(@Args('id', { type: () => ID }) id: string) {
    return this.usersService.deactivateUser(id);
  }
}


import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { UserType } from '../auth/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AllocationType } from './allocations.types';
import { AllocationsService } from './allocations.service';
import { CreateAllocationInput, UpdateAllocationInput } from './dto/allocation.input';

@Resolver(() => AllocationType)
@UseGuards(GqlAuthGuard, RolesGuard)
export class AllocationsResolver {
  constructor(private allocationsService: AllocationsService) {}

  @Query(() => [AllocationType])
  allocations(@Args('userId', { type: () => ID, nullable: true }) userId?: string) {
    return this.allocationsService.allocations(userId);
  }

  @Roles(Role.ADMIN)
  @Mutation(() => AllocationType)
  createAllocation(@Args('input') input: CreateAllocationInput, @CurrentUser() currentUser: UserType) {
    return this.allocationsService.createAllocation(input, currentUser.id);
  }

  @Roles(Role.ADMIN)
  @Mutation(() => AllocationType)
  updateAllocation(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateAllocationInput,
    @CurrentUser() currentUser: UserType,
  ) {
    return this.allocationsService.updateAllocation(id, input, currentUser.id);
  }

  @Roles(Role.ADMIN)
  @Mutation(() => AllocationType)
  deactivateAllocation(@Args('id', { type: () => ID }) id: string) {
    return this.allocationsService.deactivateAllocation(id);
  }
}

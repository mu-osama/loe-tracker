import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateProjectInput, UpdateProjectInput } from './dto/project.input';
import { ProjectType } from './projects.types';
import { ProjectsService } from './projects.service';

@Resolver(() => ProjectType)
@UseGuards(GqlAuthGuard, RolesGuard)
export class ProjectsResolver {
  constructor(private projectsService: ProjectsService) {}

  @Query(() => [ProjectType])
  projects(@Args('includeInactive', { nullable: true }) includeInactive?: boolean) {
    return this.projectsService.projects(includeInactive);
  }

  @Roles(Role.ADMIN)
  @Mutation(() => ProjectType)
  createProject(@Args('input') input: CreateProjectInput) {
    return this.projectsService.createProject(input);
  }

  @Roles(Role.ADMIN)
  @Mutation(() => ProjectType)
  updateProject(@Args('id', { type: () => ID }) id: string, @Args('input') input: UpdateProjectInput) {
    return this.projectsService.updateProject(id, input);
  }

  @Roles(Role.ADMIN)
  @Mutation(() => ProjectType)
  deactivateProject(@Args('id', { type: () => ID }) id: string) {
    return this.projectsService.deactivateProject(id);
  }
}


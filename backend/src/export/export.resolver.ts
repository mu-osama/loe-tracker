import { UseGuards } from '@nestjs/common';
import { Args, ID, Int, Query, Resolver } from '@nestjs/graphql';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ExportService } from './export.service';

@Resolver()
@UseGuards(GqlAuthGuard)
export class ExportResolver {
  constructor(private exportService: ExportService) {}

  @Query(() => String)
  exportLoeCsv(
    @CurrentUser() user,
    @Args('userId', { type: () => ID }) userId: string,
    @Args('year', { type: () => Int }) year: number,
    @Args('month', { type: () => Int }) month: number,
  ) {
    return this.exportService.exportUserMonthCsv(user, userId, year, month);
  }
}

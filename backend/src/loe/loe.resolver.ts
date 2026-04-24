import { UseGuards } from '@nestjs/common';
import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { LoeStatus } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { DayEntryInput } from './dto/loe.input';
import { FixedCategoryType, LoeEntryType, LoeSheetSummaryType, LoeSheetType } from './loe.types';
import { LoeService } from './loe.service';

@Resolver(() => LoeSheetType)
@UseGuards(GqlAuthGuard)
export class LoeResolver {
  constructor(private loeService: LoeService) {}

  @Query(() => LoeSheetType)
  loeSheet(
    @CurrentUser() user,
    @Args('year', { type: () => Int }) year: number,
    @Args('month', { type: () => Int }) month: number,
    @Args('userId', { type: () => ID, nullable: true }) userId?: string,
  ) {
    return this.loeService.getSheetForUser(user, userId || user.id, year, month, true);
  }

  @Query(() => [LoeSheetType])
  loeSheets(
    @CurrentUser() user,
    @Args('userId', { type: () => ID, nullable: true }) userId?: string,
    @Args('status', { type: () => LoeStatus, nullable: true }) status?: LoeStatus,
  ) {
    return this.loeService.loeSheets(user, userId || user.id, status);
  }

  @Query(() => [LoeSheetSummaryType])
  pendingReviewSheets(@CurrentUser() user) {
    return this.loeService.pendingReviewSheets(user.id);
  }

  @Query(() => [LoeSheetSummaryType])
  reviewSheets(@CurrentUser() user) {
    return this.loeService.reviewSheets(user.id);
  }

  @Query(() => [LoeEntryType])
  dayEntries(
    @CurrentUser() user,
    @Args('year', { type: () => Int }) year: number,
    @Args('month', { type: () => Int }) month: number,
    @Args('day', { type: () => Int }) day: number,
  ) {
    return this.loeService.dayEntries(user.id, year, month, day);
  }

  @Query(() => [FixedCategoryType])
  fixedCategories() {
    return this.loeService.fixedCategories();
  }

  @Mutation(() => LoeSheetType)
  saveDayEntries(
    @CurrentUser() user,
    @Args('year', { type: () => Int }) year: number,
    @Args('month', { type: () => Int }) month: number,
    @Args('day', { type: () => Int }) day: number,
    @Args({ name: 'entries', type: () => [DayEntryInput] }) entries: DayEntryInput[],
  ) {
    return this.loeService.saveDayEntries(user.id, year, month, day, entries);
  }

  @Mutation(() => LoeSheetType)
  submitLoe(@CurrentUser() user, @Args('loeSheetId', { type: () => ID }) loeSheetId: string) {
    return this.loeService.submitLoe(user.id, loeSheetId);
  }

  @Mutation(() => LoeSheetType)
  approveLoe(@CurrentUser() user, @Args('loeSheetId', { type: () => ID }) loeSheetId: string) {
    return this.loeService.approveLoe(user.id, loeSheetId);
  }

  @Mutation(() => LoeSheetType)
  reopenLoe(
    @CurrentUser() user,
    @Args('loeSheetId', { type: () => ID }) loeSheetId: string,
    @Args('comment') comment: string,
  ) {
    return this.loeService.reopenLoe(user.id, loeSheetId, comment);
  }

  @Query(() => [LoeSheetSummaryType])
  adminLoeOverview(
    @Args('year', { type: () => Int }) year: number,
    @Args('month', { type: () => Int }) month: number,
    @Args('country', { nullable: true }) country?: string,
    @Args('city', { nullable: true }) city?: string,
    @Args('status', { type: () => LoeStatus, nullable: true }) status?: LoeStatus,
    @Args('overUtilized', { nullable: true }) overUtilized?: boolean,
  ) {
    return this.loeService.adminOverview({ year, month, country, city, status, overUtilized });
  }
}

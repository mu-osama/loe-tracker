import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { GqlAuthGuard } from './gql-auth.guard';
import { LoginInput } from './dto/login.input';
import { AuthPayload, UserType } from './auth.types';
import { AuthService } from './auth.service';

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => AuthPayload)
  async login(@Args('email') email: string, @Args('password') password: string, @Context() context) {
    return this.authService.login(email, password, context.res);
  }

  @Mutation(() => Boolean)
  async logout(@Context() context) {
    return this.authService.logout(context.res);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => UserType)
  async me(@CurrentUser() user) {
    return this.authService.me(user.id);
  }
}


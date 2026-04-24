import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator((_: unknown, context: ExecutionContext) => {
  const gqlCtx = GqlExecutionContext.create(context);
  return gqlCtx.getContext().req.user;
});


import { createParamDecorator, ExecutionContext } from "@nestjs/common";

// Extracts the authenticated user object from the HTTP request context.
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

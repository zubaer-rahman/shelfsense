import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

// Ensures incoming requests carry a valid and active JWT bearer token.
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: unknown, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException("Authentication token required or expired");
    }
    return user;
  }
}

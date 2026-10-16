import { SetMetadata } from "@nestjs/common";
import { Role } from "@prisma/client";

export const ROLES_KEY = "roles";

// Sets authorized roles metadata on endpoints or controllers.
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

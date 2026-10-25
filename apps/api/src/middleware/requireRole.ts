import { NextFunction, Request, Response } from "express";
import { ApiError } from "@/utils/ApiError";
import { ROLE_ORDER, type UserRole } from "@rentledger/shared";

/**
 * Middleware factory that requires the authenticated user to have a role that is
 * at least as privileged as `minimumRole`.
 *
 * Role order (most → least access): LANDLORD → MANAGER → TENANT_VIEWER
 *
 * Usage:
 *   router.get("/admin-only", authenticate, requireRole("LANDLORD"), handler)
 *   router.get("/managers-and-up", authenticate, requireRole("MANAGER"), handler)
 *
 * IMPORTANT: always place `authenticate` before `requireRole` so req.landlord is
 * populated. The role comes only from the JWT claim — never from the request body.
 */
export function requireRole(minimumRole: UserRole) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const actor = req.landlord;
    if (!actor) {
      // authenticate middleware should have run first
      return next(ApiError.unauthorized("Authentication required"));
    }

    const actorOrder = ROLE_ORDER[actor.role];
    const requiredOrder = ROLE_ORDER[minimumRole];

    // Lower order number = more access; actor must have access level <= required
    if (actorOrder > requiredOrder) {
      return next(
        ApiError.forbidden(
          `This action requires the ${minimumRole} role or higher. Your role is ${actor.role}.`
        )
      );
    }

    return next();
  };
}

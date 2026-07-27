import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodEffects, ZodError } from "zod";
import { ApiError } from "@/utils/ApiError";

type RequestPart = "body" | "query" | "params";

export function validate(schema: AnyZodObject | ZodEffects<AnyZodObject>, part: RequestPart = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req[part] = schema.parse(req[part]);
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: Record<string, string[]> = {};
        for (const issue of err.issues) {
          const key = issue.path.join(".") || part;
          errors[key] = [...(errors[key] ?? []), issue.message];
        }
        return next(ApiError.badRequest("Validation failed", errors));
      }
      return next(err);
    }
  };
}

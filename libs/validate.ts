import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

/**
 * Middleware factory: validates req.body against a Zod schema.
 * - Returns 400 with field-level errors on failure.
 * - Replaces req.body with the parsed (safe, stripped) data on success.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        error: "Validation failed",
        details: result.error.flatten().fieldErrors,
      });
      return;
    }

    // Replace body with Zod-parsed data (strips unknown keys, applies transforms)
    req.body = result.data;
    next();
  };
}

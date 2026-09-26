import { BadRequestException, InternalServerException } from "@/lib";
import type { Request, Response, NextFunction } from "express";
import * as v from "valibot";

export function validateData<
  TSchema extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>,
>(schema: TSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = v.parse(schema, req.body);
      next();
    } catch (error) {
      if (v.isValiError(error)) {
        const errorMessages = error.issues.map((issue) => {
          const dotPath = v.getDotPath(issue);
          return dotPath ? `${dotPath} is ${issue.message}` : issue.message;
        });

        console.log("errorMessages:", errorMessages);
        throw new BadRequestException({
          message: errorMessages.join("\n"),
        });
      } else {
        throw new InternalServerException();
      }
    }
  };
}

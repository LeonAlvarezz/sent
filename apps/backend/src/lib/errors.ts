export class AppException extends Error {
  public status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "AppException";
    this.status = status;
  }
}

export class BadRequestException extends AppException {
  constructor(options?: { message?: string } | string) {
    const msg = typeof options === "string" ? options : options?.message || "Bad Request";
    super(msg, 400);
    this.name = "BadRequestException";
  }
}

export class NotFoundException extends AppException {
  constructor(options?: { message?: string } | string) {
    const msg = typeof options === "string" ? options : options?.message || "Not Found";
    super(msg, 404);
    this.name = "NotFoundException";
  }
}

export class UnauthorizedException extends AppException {
  constructor(options?: { message?: string } | string) {
    const msg = typeof options === "string" ? options : options?.message || "Unauthorized";
    super(msg, 401);
    this.name = "UnauthorizedException";
  }
}

export class ForbiddenException extends AppException {
  constructor(options?: { message?: string } | string) {
    const msg = typeof options === "string" ? options : options?.message || "Forbidden";
    super(msg, 403);
    this.name = "ForbiddenException";
  }
}

export class InternalServerException extends AppException {
  constructor(options?: { message?: string } | string) {
    const msg = typeof options === "string" ? options : options?.message || "Internal Server Error";
    super(msg, 500);
    this.name = "InternalServerException";
  }
}

export const DefaultErrorMessage = "An unexpected error occurred";

import type { ErrorRequestHandler, RequestHandler } from "express";
import { HttpError } from "../utils/http-error";

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: "Not found" });
};

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  req,
  res,
  _next,
) => {
  if (res.headersSent) {
    return;
  }

  if (error instanceof HttpError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  const candidateStatus =
    typeof error === "object" && error !== null
      ? "statusCode" in error
        ? error.statusCode
        : "status" in error
          ? error.status
          : undefined
      : undefined;
  const statusCode =
    typeof candidateStatus === "number" &&
    candidateStatus >= 400 &&
    candidateStatus < 500
      ? candidateStatus
      : 500;

  if (statusCode >= 500) {
    req.log.error({ err: error, statusCode }, "API request failed");
  } else {
    req.log.warn({ statusCode }, "API request rejected");
  }
  res.status(statusCode).json({
    error: statusCode >= 500 ? "Internal server error" : "Request rejected",
  });
};

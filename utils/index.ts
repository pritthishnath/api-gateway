import { Response } from "express";

export function jsonError(
  res: Response,
  status: number,
  msg?: string,
  data?: object
) {
  return res.status(status).json({
    error: true,
    msg: typeof msg === "string" ? msg : "Server error!",
    errorData: data !== undefined ? data : {},
  });
}

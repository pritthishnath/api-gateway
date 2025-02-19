import { Context } from "elysia";

export function jsonError(
  context: Context,
  status: number,
  msg?: string,
  data: object = {}
) {
  context.set.status = status;
  return {
    error: true,
    msg: typeof msg === "string" ? msg : "Server error!",
    errorData: data,
  };
}

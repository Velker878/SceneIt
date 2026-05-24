/**
 * Utility helpers for working with caught errors.
 *
 * TypeScript types caught errors as `unknown` since TS 4.0.
 * These helpers let you safely access .message and .code without
 * casting to `any`, keeping type safety intact everywhere.
 */

/** Extract a human-readable message from any thrown value */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Unknown error";
}

/** Extract the error code (e.g. 'ECONNABORTED', 'ENOTFOUND') from Axios/Node errors */
export function getErrorCode(err: unknown): string | undefined {
  if (err && typeof err === "object" && "code" in err) {
    return (err as { code?: string }).code;
  }
  return undefined;
}

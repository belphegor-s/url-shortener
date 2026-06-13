import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

/** Structured JSON error body returned everywhere for consistency. */
export interface ApiError {
	error: string;
	code: string;
}

/** Send a structured error response. */
export const fail = (c: Context, status: ContentfulStatusCode, code: string, error: string) =>
	c.json<ApiError>({ error, code }, status);

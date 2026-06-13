import { customAlphabet } from 'nanoid';

/** 7 chars over a 36-char alphabet = 36^7 ≈ 78B keyspace. */
export const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 7);

/** Path segments that double as routes — a custom id must never shadow them. */
const RESERVED = new Set(['create', 'analytics', '']);

/** Allowed custom-id charset + length bounds. */
const CUSTOM_ID_RE = /^[a-zA-Z0-9_-]{1,64}$/;

/** Returns true when a user-supplied custom id is structurally valid and not reserved. */
export const isValidCustomId = (id: string): boolean => CUSTOM_ID_RE.test(id) && !RESERVED.has(id.toLowerCase());

/**
 * Normalizes API responses that may return either a plain array (legacy)
 * or a paginated object { items, total } (new format).
 * Keeps the frontend working while the backend migrates.
 */
export function normalizePaged<T>(
  response: { items: T[]; total: number } | T[],
): { items: T[]; total: number } {
  if (Array.isArray(response)) {
    return { items: response, total: response.length };
  }
  return { items: response.items ?? [], total: response.total ?? 0 };
}

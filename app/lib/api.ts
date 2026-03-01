/** Proquote API base URL (backend). */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export function getQuoteUrl(): string {
  return `${API_BASE}/quote`;
}

export function getQuoteEventsUrl(requestId: string): string {
  return `${API_BASE}/quote/${requestId}/events`;
}

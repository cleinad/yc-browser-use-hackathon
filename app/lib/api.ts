/** Proquote API base URL (backend). */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export function getQuoteUrl(): string {
  return `${API_BASE}/quote`;
}

export function getQuoteEventsUrl(requestId: string): string {
  return `${API_BASE}/quote/${requestId}/events`;
}

export function getTicketAnalyzeUrl(): string {
  return `${API_BASE}/ticket/analyze-image`;
}

export function getTicketContractorsUrl(): string {
  return `${API_BASE}/ticket/find-contractors`;
}

export function getTicketContractorsEventsUrl(requestId: string): string {
  return `${API_BASE}/ticket/find-contractors/${requestId}/events`;
}

export function getTicketSendQuotesUrl(): string {
  return `${API_BASE}/ticket/send-quotes`;
}

export function getTicketSendQuotesEventsUrl(requestId: string): string {
  return `${API_BASE}/ticket/send-quotes/${requestId}/events`;
}

export function getTicketFindSuppliesUrl(): string {
  return `${API_BASE}/ticket/find-supplies`;
}

export function getTicketFindSuppliesEventsUrl(requestId: string): string {
  return `${API_BASE}/ticket/find-supplies/${requestId}/events`;
}

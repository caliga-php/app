// React Query hooks over the WISECP Admin API. Lists use useInfiniteQuery and
// walk meta.next_page. Writes carry an Idempotency-Key and invalidate caches.

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { apiRequest, idempotencyKey } from "./client";
import { ApiError } from "./errors";
import type {
  ClientDetail,
  ClientListItem,
  ClientsStats,
  ClientSummary,
  Currency,
  Department,
  InvoiceListItem,
  InvoiceStats,
  OrderListItem,
  Priority,
  ServiceListItem,
  TicketDetail,
  TicketListItem,
  TicketMessage,
  TicketNote,
  TicketStats,
  TicketStatusDef,
} from "./types";

const PAGE_LIMIT = 25;

// Do not retry on auth / validation / rate-limit; a retry cannot help and 401
// retries can get the IP parked.
const NO_RETRY_CODES = new Set([
  "invalid_token",
  "missing_token",
  "audience_mismatch",
  "insufficient_scope",
  "demo_mode",
  "ip_not_allowed",
  "not_found",
  "validation_failed",
  "rate_limited",
  "too_many_auth_failures",
  "no_connection",
]);

function retry(count: number, error: unknown): boolean {
  if (error instanceof ApiError && NO_RETRY_CODES.has(error.code)) return false;
  return count < 2;
}

interface ListPage<T> {
  items: T[];
  nextPage: number;
}

function listQueryFn<T>(path: string, extra?: Record<string, string | undefined>) {
  return async ({ pageParam = 1 }: { pageParam?: number }): Promise<ListPage<T>> => {
    const res = await apiRequest<T[]>(path, { query: { page: pageParam, limit: PAGE_LIMIT, ...extra } });
    const next = Number(res.meta?.next_page ?? 0);
    return { items: res.data ?? [], nextPage: next };
  };
}

function infiniteOptions<T>() {
  return {
    initialPageParam: 1,
    getNextPageParam: (last: ListPage<T>) => (last.nextPage && last.nextPage > 0 ? last.nextPage : undefined),
    retry,
  };
}

export function flattenPages<T>(query: { data?: { pages: ListPage<T>[] } }): T[] {
  return query.data?.pages.flatMap((p) => p.items) ?? [];
}

/* ------------------------------ Dashboard ------------------------------ */

export function useClientsStats() {
  return useQuery({
    queryKey: ["clients-stats"],
    queryFn: async () => (await apiRequest<ClientsStats>("/clients/stats")).data,
    retry,
  });
}

export function useInvoiceStats() {
  return useQuery({
    queryKey: ["invoice-stats"],
    queryFn: async () => (await apiRequest<InvoiceStats>("/invoices/stats")).data,
    retry,
  });
}

export function useTicketStats() {
  return useQuery({
    queryKey: ["ticket-stats"],
    queryFn: async () => (await apiRequest<TicketStats>("/tickets/stats")).data,
    retry,
  });
}

export function useOrdersCount() {
  return useQuery({
    queryKey: ["orders-count"],
    queryFn: async () => {
      const res = await apiRequest<OrderListItem[]>("/orders", { query: { page: 1, limit: 1 } });
      return Number(res.meta?.total ?? 0);
    },
    retry,
  });
}

/* ------------------------------ Clients ------------------------------ */

export function useClients(keyword?: string, status?: string) {
  return useInfiniteQuery({
    queryKey: ["clients", keyword ?? "", status ?? ""],
    queryFn: listQueryFn<ClientListItem>("/clients", { keyword: keyword || undefined, status: status || undefined }),
    ...infiniteOptions<ClientListItem>(),
  });
}

export function useClient(id: number | string) {
  return useQuery({
    queryKey: ["client", String(id)],
    queryFn: async () => (await apiRequest<ClientDetail>(`/clients/${id}`)).data,
    retry,
    enabled: !!id,
  });
}

export function useClientSummary(id: number | string) {
  return useQuery({
    queryKey: ["client-summary", String(id)],
    queryFn: async () => (await apiRequest<ClientSummary>(`/clients/${id}/summary`)).data,
    retry,
    enabled: !!id,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) =>
      (await apiRequest<ClientDetail>("/clients", { method: "POST", body, idempotencyKey: idempotencyKey() })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["clients-stats"] });
    },
  });
}

export function useUpdateClient(id: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) =>
      (await apiRequest<ClientDetail>(`/clients/${id}`, { method: "PUT", body, idempotencyKey: idempotencyKey() }))
        .data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client", String(id)] });
      qc.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function useSetClientBlock(id: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (blocked: boolean) =>
      (
        await apiRequest(`/clients/${id}/block`, {
          method: "POST",
          body: { blocked },
          idempotencyKey: idempotencyKey(),
        })
      ).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client", String(id)] });
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["clients-stats"] });
    },
  });
}

/* ------------------------------ Orders ------------------------------ */

export function useOrders(status?: string) {
  return useInfiniteQuery({
    queryKey: ["orders", status ?? ""],
    queryFn: listQueryFn<OrderListItem>("/orders", { status: status || undefined }),
    ...infiniteOptions<OrderListItem>(),
  });
}

export function useOrder(id: number | string) {
  return useQuery({
    queryKey: ["order", String(id)],
    queryFn: async () => (await apiRequest<any>(`/orders/${id}`)).data,
    retry,
    enabled: !!id,
  });
}

/* ------------------------------ Invoices ------------------------------ */

export function useInvoices(status?: string) {
  return useInfiniteQuery({
    queryKey: ["invoices", status ?? ""],
    queryFn: listQueryFn<InvoiceListItem>("/invoices", { status: status || undefined }),
    ...infiniteOptions<InvoiceListItem>(),
  });
}

export function useInvoice(id: number | string) {
  return useQuery({
    queryKey: ["invoice", String(id)],
    queryFn: async () => (await apiRequest<any>(`/invoices/${id}`)).data,
    retry,
    enabled: !!id,
  });
}

/* ------------------------------ Services ------------------------------ */

export function useServices(clientId?: number | string) {
  return useInfiniteQuery({
    queryKey: ["services", String(clientId ?? "")],
    queryFn: listQueryFn<ServiceListItem>("/services", clientId ? { client_id: String(clientId) } : undefined),
    ...infiniteOptions<ServiceListItem>(),
  });
}

/* ------------------------------ Reference ------------------------------ */

export function useCurrencies() {
  return useQuery({
    queryKey: ["currencies"],
    queryFn: async () => (await apiRequest<Currency[]>("/reference/currencies")).data,
    staleTime: 1000 * 60 * 60,
    retry,
  });
}

// Returns a formatter mapping currency_id -> code for formatMoney.
export function useCurrencyCode(): (id?: number | null) => string | undefined {
  const { data } = useCurrencies();
  const map = new Map<number, string>();
  (data ?? []).forEach((c) => map.set(c.id, c.code));
  return (id?: number | null) => (id != null ? map.get(id) : undefined);
}

/* ------------------------------ Tickets ------------------------------ */

export function useTickets(status?: string, department?: string) {
  return useInfiniteQuery({
    queryKey: ["tickets", status ?? "", department ?? ""],
    queryFn: listQueryFn<TicketListItem>("/tickets", {
      status: status || undefined,
      department_id: department || undefined,
    }),
    ...infiniteOptions<TicketListItem>(),
  });
}

export function useTicket(id: number | string) {
  return useQuery({
    queryKey: ["ticket", String(id)],
    queryFn: async () => (await apiRequest<TicketDetail>(`/tickets/${id}`)).data,
    retry,
    enabled: !!id,
  });
}

export function useTicketMessages(id: number | string) {
  return useQuery({
    queryKey: ["ticket-messages", String(id)],
    queryFn: async () => (await apiRequest<TicketMessage[]>(`/tickets/${id}/messages`)).data,
    retry,
    enabled: !!id,
  });
}

export function useTicketNotes(id: number | string) {
  return useQuery({
    queryKey: ["ticket-notes", String(id)],
    queryFn: async () => (await apiRequest<TicketNote[]>(`/tickets/${id}/notes`)).data,
    retry,
    enabled: !!id,
  });
}

export function useTicketDepartments() {
  return useQuery({
    queryKey: ["ticket-departments"],
    queryFn: async () => (await apiRequest<Department[]>("/tickets/departments")).data,
    staleTime: 1000 * 60 * 30,
    retry,
  });
}

export function useTicketStatusDefs() {
  return useQuery({
    queryKey: ["ticket-status-defs"],
    queryFn: async () => (await apiRequest<TicketStatusDef[]>("/tickets/statuses")).data,
    staleTime: 1000 * 60 * 30,
    retry,
  });
}

export function useTicketPriorities() {
  return useQuery({
    queryKey: ["ticket-priorities"],
    queryFn: async () => (await apiRequest<Priority[]>("/tickets/priorities")).data,
    staleTime: 1000 * 60 * 30,
    retry,
  });
}

export function useReplyTicket(id: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { message: string; hidden?: boolean }) =>
      (await apiRequest(`/tickets/${id}/messages`, { method: "POST", body, idempotencyKey: idempotencyKey() })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ticket-messages", String(id)] });
      qc.invalidateQueries({ queryKey: ["ticket", String(id)] });
      qc.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
}

export function useAddTicketNote(id: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (message: string) =>
      (await apiRequest(`/tickets/${id}/notes`, { method: "POST", body: { message }, idempotencyKey: idempotencyKey() })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ticket-notes", String(id)] });
    },
  });
}

export function useUpdateTicket(id: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) =>
      (await apiRequest(`/tickets/${id}`, { method: "PUT", body, idempotencyKey: idempotencyKey() })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ticket", String(id)] });
      qc.invalidateQueries({ queryKey: ["tickets"] });
      qc.invalidateQueries({ queryKey: ["ticket-stats"] });
    },
  });
}

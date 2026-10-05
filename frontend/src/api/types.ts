// Response shapes (verified live against vexa.net.tr). v1 is frozen but may add
// fields, so keep these tolerant: optional everywhere the field may be absent.

export interface ClientRef {
  id: number;
  full_name: string;
  company_name?: string;
  email?: string;
}

export interface ClientListItem {
  id: number;
  full_name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  status: string;
  language?: string;
  country_code?: string;
  currency_code?: string;
  group?: { id: number; name: string | null };
  email_verified?: boolean;
  phone_verified?: boolean;
  active_services?: number;
  created_at?: string;
  last_login_at?: string;
}

export interface ClientDetail extends ClientListItem {
  name?: string;
  surname?: string;
  country_id?: number;
  currency_id?: number;
  group_id?: number;
  balance?: number;
}

export interface ClientSummary {
  user_id: number;
  full_name: string;
  company_name?: string;
  created_at?: string;
  total_revenue?: number;
  revenue_currency?: number;
  paid_invoices?: number;
  active_services?: number;
  inactive_services?: number;
  total_tickets?: number;
  recent_tickets?: number;
  badges?: Record<string, boolean | string>;
  trust_score?: {
    total: number;
    label: string;
    services?: number;
    revenue?: number;
    age?: number;
    tickets?: number;
  };
}

export interface ClientsStats {
  active: number;
  blocked: number;
  new: number;
  blacklisted: number;
  active_services: number;
  unpaid_invoices: number;
  credit_balance: number;
  credit_balance_formatted?: string;
  growth_rate?: number;
  total: number;
}

export interface OrderListItem {
  id: number;
  order_number: number | string;
  status: string;
  amount: number;
  currency_id?: number;
  payment_method?: string | null;
  invoice_id?: number;
  invoice_status?: string;
  item_count?: number;
  created_at?: string;
  client?: ClientRef;
}

export interface InvoiceListItem {
  id: number;
  number: string;
  status: string;
  currency_id?: number;
  subtotal?: number;
  tax?: number;
  total: number;
  formalized?: boolean;
  payment_method?: string | null;
  created_at?: string;
  due_date?: string;
  paid_at?: string | null;
  refund_date?: string | null;
  client?: ClientRef;
}

export interface InvoiceStats {
  type: string;
  period: string;
  amount: number;
  count: number;
  currency_id?: number;
}

export interface ServiceListItem {
  id: number;
  name: string;
  type?: string;
  domain?: string | null;
  status: string;
  amount: number;
  currency_id?: number;
  cycle?: string;
  qty?: number;
  client?: ClientRef;
  due_at?: string;
  renewal_at?: string;
}

export interface TicketStats {
  open: number;
  process: number;
  pending: number;
  answered: number;
  resolved: number;
  total: number;
  resolution_rate?: number;
}

export interface Currency {
  id: number;
  code: string;
  name: string;
  is_default?: boolean;
}

export interface TicketListItem {
  id: number;
  reference: string;
  subject: string;
  status: string;
  priority: number;
  department?: { id: number; name: string };
  client?: ClientRef;
  assigned_id?: number;
  admin_unread?: boolean;
  user_unread?: boolean;
  created_at?: string;
  last_reply_at?: string;
  last_reply?: { message: string; is_admin: boolean; name: string; time: string };
}

export interface TicketDetail extends TicketListItem {
  locked?: boolean;
  lang?: string;
  assigned?: { id: number; full_name: string; email?: string } | null;
  service?: unknown;
  custom_fields?: unknown[];
  stats?: Record<string, number | string>;
}

export interface TicketMessage {
  id: number;
  author_id?: number;
  author_name: string;
  is_admin: boolean;
  message: string;
  hidden?: boolean;
  created_at?: string;
  attachments?: { id: number; name?: string }[];
}

export interface TicketNote {
  id: number;
  message?: string;
  note?: string;
  author_name?: string;
  created_at?: string;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
}

export interface TicketStatusDef {
  id?: number;
  key: string;
  name: string;
  type?: string;
  badge?: string;
}

export interface Priority {
  value: number;
  label: string;
}

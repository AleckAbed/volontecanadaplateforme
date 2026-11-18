/**
 * S6 — Factures clients, encaissement Stripe Connect, abonnement du cabinet.
 */
import { authFetch as rawAuthFetch, publicFetch as rawPublicFetch } from '@/lib/api-client';

const authFetch = rawAuthFetch as (...args: Parameters<typeof rawAuthFetch>) => Promise<any>;
const publicFetch = rawPublicFetch as (...args: Parameters<typeof rawPublicFetch>) => Promise<any>;

export const formatMoney = (cents: number) =>
  (cents / 100).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' });

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'void';

export const INVOICE_STATUS: Record<InvoiceStatus, { label: string; className: string }> = {
  draft: { label: 'Brouillon', className: 'bg-gray-100 text-gray-700' },
  sent: { label: 'Envoyée', className: 'bg-blue-50 text-blue-700' },
  paid: { label: 'Payée', className: 'bg-emerald-50 text-emerald-700' },
  void: { label: 'Annulée', className: 'bg-red-50 text-red-700' },
};

export const PAYMENT_METHODS = [
  { value: 'transfer', label: 'Virement Interac' },
  { value: 'cash', label: 'Comptant' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'card', label: 'Carte (en ligne)' },
  { value: 'other', label: 'Autre' },
];

export interface InvoiceSummary {
  id: number;
  number: string;
  status: InvoiceStatus;
  client: { id: number; name: string } | null;
  total_cents: number;
  issued_at: string | null;
  due_date: string | null;
  paid_at: string | null;
  is_overdue: boolean;
  url?: string;
}

export interface InvoiceDetail extends InvoiceSummary {
  currency: string;
  tax_province: string | null;
  subtotal_cents: number;
  tax_lines: { name: string; rate: number; amount_cents: number }[];
  tax_cents: number;
  notes: string | null;
  payment_method: string | null;
  payment_method_label: string | null;
  dossier: { id: number; name: string } | null;
  client: { id: number; name: string; email: string; address: string | null } | null;
  lines: { description: string; quantity: number; unit_price_cents: number; taxable: boolean; amount_cents: number }[];
  cabinet: { name: string; province: string | null; phone: string | null; gst_number: string | null; qst_number: string | null } | null;
  public_url: string;
  online_payment_available?: boolean;
  can_pay_online?: boolean;
}

export interface InvoiceLineInput {
  description: string;
  quantity: number;
  unit_price: number;
  taxable: boolean;
}

export interface InvoiceInput {
  client_id: number;
  dossier_id?: number | null;
  due_date?: string | null;
  notes?: string | null;
  lines: InvoiceLineInput[];
}

export const invoicesService = {
  async list(status?: string): Promise<{ invoices: InvoiceSummary[]; totals: { outstanding_cents: number; paid_this_month_cents: number } }> {
    const res = await authFetch(`/admin/invoices${status ? `?status=${status}` : ''}`);
    return res.data;
  },
  async get(id: number): Promise<InvoiceDetail> {
    const res = await authFetch(`/admin/invoices/${id}`);
    return res.data;
  },
  async create(input: InvoiceInput): Promise<{ id: number; message: string }> {
    const res = await authFetch('/admin/invoices', { method: 'POST', body: JSON.stringify(input) });
    return { id: res.data.id, message: res.message };
  },
  async send(id: number): Promise<string> {
    return (await authFetch(`/admin/invoices/${id}/send`, { method: 'POST' })).message;
  },
  async markPaid(id: number, method: string, reference?: string): Promise<string> {
    return (await authFetch(`/admin/invoices/${id}/mark-paid`, { method: 'POST', body: JSON.stringify({ method, reference }) })).message;
  },
  async void(id: number): Promise<string> {
    return (await authFetch(`/admin/invoices/${id}/void`, { method: 'POST' })).message;
  },
  async clientOptions(): Promise<{ id: number; name: string }[]> {
    const res = await authFetch('/admin/module-clients?per_page=500');
    const rows: any[] = res.data?.data ?? res.data ?? [];
    return rows.map((c) => ({ id: c.id, name: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || c.email }));
  },
};

export const publicInvoiceService = {
  async get(token: string): Promise<InvoiceDetail> {
    return (await publicFetch(`/invoices/public/${encodeURIComponent(token)}`)).data;
  },
  async checkout(token: string): Promise<string> {
    return (await publicFetch(`/invoices/public/${encodeURIComponent(token)}/checkout`, { method: 'POST' })).data.url;
  },
  async forClient(): Promise<InvoiceSummary[]> {
    return (await authFetch('/client/invoices')).data;
  },
};

export interface BillingInfo {
  stripe_configured: boolean;
  subscription: {
    status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
    is_active: boolean;
    trial_ends_at: string | null;
    trial_days_left: number | null;
    current_period_end: string | null;
    seats_used: number;
    subscribed_seats: number | null;
    has_customer: boolean;
  };
  payments: { connected: boolean; charges_enabled: boolean };
  taxes: { province: string | null; gst_number: string | null; qst_number: string | null };
}

export const billingService = {
  async get(): Promise<BillingInfo> {
    return (await authFetch('/admin/billing')).data;
  },
  async subscribe(): Promise<string> {
    return (await authFetch('/admin/billing/subscribe', { method: 'POST' })).data.url;
  },
  async portal(): Promise<string> {
    return (await authFetch('/admin/billing/portal', { method: 'POST' })).data.url;
  },
  async connect(): Promise<string> {
    return (await authFetch('/admin/billing/connect', { method: 'POST' })).data.url;
  },
  async refreshConnect(): Promise<{ charges_enabled: boolean }> {
    return (await authFetch('/admin/billing/connect/refresh', { method: 'POST' })).data;
  },
  async saveTaxes(payload: { province?: string | null; gst_number?: string | null; qst_number?: string | null }): Promise<string> {
    return (await authFetch('/admin/billing/taxes', { method: 'PUT', body: JSON.stringify(payload) })).message;
  },
};

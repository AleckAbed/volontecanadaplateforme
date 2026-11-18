/**
 * S7 — Réservation en ligne, Google Agenda, mandat de représentation.
 */
import { authFetch as rawAuthFetch, publicFetch as rawPublicFetch } from '@/lib/api-client';
import type { CabinetBranding } from '@/services/cabinet-profile';

const authFetch = rawAuthFetch as (...args: Parameters<typeof rawAuthFetch>) => Promise<any>;
const publicFetch = rawPublicFetch as (...args: Parameters<typeof rawPublicFetch>) => Promise<any>;

export const formatPrice = (amount: number) =>
  amount <= 0 ? 'Gratuit' : amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' });

/** « America/Toronto » → « Toronto ». */
export const tzCity = (tz: string) => (tz.split('/').pop() ?? tz).replace(/_/g, ' ');

export const WEEKDAYS = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 7, label: 'Dimanche' },
];

export type MeetingMode = 'video' | 'phone' | 'in_person';

export const APPOINTMENT_STATUS: Record<string, { label: string; className: string }> = {
  confirmed: { label: 'Confirmé', className: 'bg-emerald-50 text-emerald-700' },
  pending_payment: { label: 'Paiement en attente', className: 'bg-amber-50 text-amber-700' },
  cancelled: { label: 'Annulé', className: 'bg-red-50 text-red-700' },
  expired: { label: 'Expiré', className: 'bg-gray-100 text-gray-600' },
};

export const MANDATE_STATUS: Record<string, { label: string; className: string }> = {
  sent: { label: 'En attente de signature', className: 'bg-amber-50 text-amber-700' },
  signed: { label: 'Signé', className: 'bg-emerald-50 text-emerald-700' },
  void: { label: 'Annulé', className: 'bg-gray-100 text-gray-600' },
};

export interface BookingServiceItem {
  id: number;
  host_admin_id: number;
  host: string | null;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  taxable: boolean;
  meeting_mode: MeetingMode;
  location: string | null;
  send_mandate: boolean;
  is_active: boolean;
  sort_order: number;
}

export type BookingServiceInput = Omit<BookingServiceItem, 'id' | 'host'>;

export interface BookingSettings {
  booking_enabled: boolean;
  booking_intro: string | null;
  timezone: string;
  mandate_text: string | null;
  default_mandate_text: string;
  public_url: string;
  slug: string;
}

export interface BookingOverview {
  settings: BookingSettings;
  can_manage: boolean;
  services: BookingServiceItem[];
  staff: { id: number; name: string; email: string }[];
  meeting_modes: { value: MeetingMode; label: string }[];
  google: { available: boolean; connected: boolean; email: string | null };
}

export interface AvailabilityRuleItem {
  weekday: number;
  start_time: string;
  end_time: string;
}

export interface AdminAppointment {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  notes: string | null;
  service: string | null;
  host: string | null;
  host_admin_id: number;
  client_id: number | null;
  invoice_id: number | null;
  starts_at: string;
  ends_at: string;
  local_label: string;
  status: string;
  meeting_mode: MeetingMode;
  meeting_url: string | null;
  in_google: boolean;
}

export const bookingAdminService = {
  async overview(): Promise<BookingOverview> {
    return (await authFetch('/admin/booking')).data;
  },
  async saveSettings(input: Pick<BookingSettings, 'booking_enabled' | 'booking_intro' | 'timezone' | 'mandate_text'>): Promise<BookingSettings> {
    return (await authFetch('/admin/booking/settings', { method: 'PUT', body: JSON.stringify(input) })).data;
  },
  async createService(input: BookingServiceInput): Promise<BookingServiceItem> {
    return (await authFetch('/admin/booking/services', { method: 'POST', body: JSON.stringify(input) })).data;
  },
  async updateService(id: number, input: BookingServiceInput): Promise<BookingServiceItem> {
    return (await authFetch(`/admin/booking/services/${id}`, { method: 'PUT', body: JSON.stringify(input) })).data;
  },
  async deleteService(id: number): Promise<string> {
    return (await authFetch(`/admin/booking/services/${id}`, { method: 'DELETE' })).message;
  },
  async availability(adminId?: number): Promise<AvailabilityRuleItem[]> {
    return (await authFetch(`/admin/booking/availability${adminId ? `?admin_id=${adminId}` : ''}`)).data.rules;
  },
  async saveAvailability(rules: AvailabilityRuleItem[], adminId?: number): Promise<AvailabilityRuleItem[]> {
    return (await authFetch('/admin/booking/availability', { method: 'PUT', body: JSON.stringify({ rules, admin_id: adminId }) })).data.rules;
  },
  async appointments(scope: 'upcoming' | 'past', mine: boolean): Promise<AdminAppointment[]> {
    return (await authFetch(`/admin/booking/appointments?scope=${scope}${mine ? '&mine=1' : ''}`)).data;
  },
  async cancel(id: number): Promise<string> {
    return (await authFetch(`/admin/booking/appointments/${id}/cancel`, { method: 'POST' })).message;
  },
  async googleConnect(): Promise<string> {
    return (await authFetch('/admin/google/connect', { method: 'POST' })).data.url;
  },
  async googleDisconnect(): Promise<string> {
    return (await authFetch('/admin/google/disconnect', { method: 'POST' })).message;
  },
};

export interface PublicBookingPage {
  cabinet: { name: string; intro: string | null; timezone: string; branding?: CabinetBranding };
  services: {
    id: number;
    name: string;
    description: string | null;
    duration_minutes: number;
    price: number;
    taxable: boolean;
    meeting_mode: MeetingMode;
    meeting_mode_label: string;
    location: string | null;
    host: string | null;
  }[];
}

export interface SlotsResponse {
  from: string;
  to: string;
  timezone: string;
  max_date: string;
  slots: { start: string; date: string; time: string }[];
}

export interface PublicAppointment {
  cabinet: string | null;
  branding?: CabinetBranding | null;
  booking_url: string | null;
  service: string | null;
  name: string;
  status: string;
  starts_at: string;
  local_label: string;
  timezone: string;
  duration_minutes: number;
  meeting_mode: MeetingMode;
  meeting_mode_label: string;
  meeting_url: string | null;
  location: string | null;
  invoice: { status: string; total: number; url: string } | null;
  can_cancel: boolean;
  cancel_notice_hours: number;
}

export const publicBookingService = {
  async page(slug: string): Promise<PublicBookingPage> {
    return (await publicFetch(`/booking/${encodeURIComponent(slug)}`)).data;
  },
  async slots(slug: string, serviceId: number, from: string, days = 7): Promise<SlotsResponse> {
    return (await publicFetch(`/booking/${encodeURIComponent(slug)}/slots?service_id=${serviceId}&from=${from}&days=${days}`)).data;
  },
  async book(slug: string, input: { service_id: number; start: string; name: string; email: string; phone?: string; notes?: string; consent: boolean }): Promise<{ token: string; status: string; checkout_url: string | null }> {
    return (await publicFetch(`/booking/${encodeURIComponent(slug)}/appointments`, { method: 'POST', body: JSON.stringify(input) })).data;
  },
  async appointment(token: string): Promise<PublicAppointment> {
    return (await publicFetch(`/appointments/public/${encodeURIComponent(token)}`)).data;
  },
  async cancel(token: string): Promise<string> {
    return (await publicFetch(`/appointments/public/${encodeURIComponent(token)}/cancel`, { method: 'POST' })).message;
  },
};

export interface MandateItem {
  id: number;
  title: string;
  status: 'sent' | 'signed' | 'void';
  dossier: string | null;
  appointment_id: number | null;
  sent_at: string | null;
  signed_at: string | null;
  signed_name: string | null;
  signed_ip: string | null;
  signed_user_agent: string | null;
  body: string;
  body_hash: string;
  url: string;
}

export interface PublicMandate {
  cabinet: string | null;
  branding?: CabinetBranding | null;
  client_name: string;
  title: string;
  body: string;
  body_hash: string;
  status: 'sent' | 'signed' | 'void';
  signed_name: string | null;
  signed_at: string | null;
}

export const mandateService = {
  async list(clientId: number): Promise<MandateItem[]> {
    return (await authFetch(`/admin/mandates?client_id=${clientId}`)).data;
  },
  async preview(clientId: number, dossierId?: number | null): Promise<{ title: string; body: string }> {
    return (await authFetch(`/admin/mandates/preview?client_id=${clientId}${dossierId ? `&dossier_id=${dossierId}` : ''}`)).data;
  },
  async send(clientId: number, dossierId?: number | null): Promise<string> {
    return (await authFetch('/admin/mandates', { method: 'POST', body: JSON.stringify({ client_id: clientId, dossier_id: dossierId || null }) })).message;
  },
  async void(id: number): Promise<void> {
    await authFetch(`/admin/mandates/${id}/void`, { method: 'POST' });
  },
  async publicGet(token: string): Promise<PublicMandate> {
    return (await publicFetch(`/mandates/public/${encodeURIComponent(token)}`)).data;
  },
  async sign(token: string, signedName: string, consent: boolean): Promise<PublicMandate> {
    return (await publicFetch(`/mandates/public/${encodeURIComponent(token)}/sign`, { method: 'POST', body: JSON.stringify({ signed_name: signedName, consent }) })).data;
  },
};

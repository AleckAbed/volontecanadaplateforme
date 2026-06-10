import MaintenanceScreen from '@/app/shared/maintenance-screen';

/**
 * Top-level catch-all for unmatched routes (404).
 * Renders the themed maintenance UI with the "not found" message.
 */
export default function NotFound() {
  return <MaintenanceScreen reason="not-found" />;
}

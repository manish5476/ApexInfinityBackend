import { AppShell } from '@/components/layout/app-shell';
import { EmptyState } from '@/components/ui/state';

export default function DashboardPage() { return <AppShell><h1>Overview</h1><EmptyState title="Your workspace is ready" body="Dashboard APIs are not connected yet, so no business figures are shown." /></AppShell>; }

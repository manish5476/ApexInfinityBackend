'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { EmptyState, LoadingState } from '@/components/ui/state';
import { useAuth } from '@/providers/auth-provider';

export default function DashboardPage() { const { status } = useAuth(); const router = useRouter(); useEffect(() => { if (status === 'anonymous') router.replace('/login'); }, [status, router]); if (status !== 'authenticated') return <LoadingState />; return <AppShell><h1>Overview</h1><EmptyState title="Your workspace is ready" body="Dashboard APIs are not connected yet, so no business figures are shown." /></AppShell>; }

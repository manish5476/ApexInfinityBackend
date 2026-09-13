'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LoadingState } from '@/components/ui/state';
import { useAuth } from '@/providers/auth-provider';

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { status } = useAuth(); const pathname = usePathname(); const router = useRouter();
  useEffect(() => { if (status === 'anonymous') router.replace(`/login?next=${encodeURIComponent(pathname)}`); }, [pathname, router, status]);
  if (status !== 'authenticated') return <LoadingState />;
  return <>{children}</>;
}

import { ProtectedLayout } from '@/components/layout/protected-layout';
export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) { return <ProtectedLayout>{children}</ProtectedLayout>; }

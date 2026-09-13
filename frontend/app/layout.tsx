import type { Metadata } from 'next';
import '@/styles/globals.css';
import { AppProviders } from '@/providers/app-providers';

export const metadata: Metadata = { title: 'Apex Infinity', description: 'Apex Infinity business platform' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><AppProviders>{children}</AppProviders></body></html>; }

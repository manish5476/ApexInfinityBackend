'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset(): void }) {
  useEffect(() => { console.error('Route error', { message: error.message, digest: error.digest }); }, [error]);
  return <main><h1>Something went wrong</h1><p>We could not complete that request. Please try again.</p><Button onClick={reset}>Try again</Button></main>;
}

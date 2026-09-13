'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/auth-provider';
import { userMessage } from '@/lib/api/errors';

export default function LoginPage() {
  const router = useRouter(); const { login } = useAuth(); const [error, setError] = useState<string>(); const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setPending(true); setError(undefined); const data = new FormData(event.currentTarget); try { await login({ email: String(data.get('email')), password: String(data.get('password')), uniqueShopId: String(data.get('uniqueShopId') || '') || undefined }); router.replace('/dashboard'); } catch (cause) { setError(userMessage(cause)); } finally { setPending(false); } }
  return <main><h1>Sign in to Apex Infinity</h1><form onSubmit={submit}><label>Email<input required name="email" type="email" autoComplete="email" /></label><label>Password<input required name="password" type="password" autoComplete="current-password" /></label><label>Shop ID (if required)<input name="uniqueShopId" /></label>{error && <p role="alert">{error}</p>}<Button disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</Button></form></main>;
}

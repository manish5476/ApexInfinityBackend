import { CookieOptions } from 'express';

export function getRefreshCookieOptions(isProduction: boolean): CookieOptions {
  return {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    maxAge: 90 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  };
}

export function extractBearerToken(authorizationHeader?: string): string | undefined {
  if (!authorizationHeader?.startsWith('Bearer ')) {
    return undefined;
  }
  return authorizationHeader.split(' ')[1];
}

import { Request, Response } from 'express';

export const REFRESH_COOKIE_NAME = 'refreshToken';

function cookieBase(isProduction: boolean) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
  };
}

export function setRefreshTokenCookie(res: Response, token: string, isProduction: boolean): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    ...cookieBase(isProduction),
    maxAge: 90 * 24 * 60 * 60 * 1000,
  });
}

export function clearRefreshTokenCookie(res: Response, isProduction: boolean): void {
  res.clearCookie(REFRESH_COOKIE_NAME, cookieBase(isProduction));
}

export function readRefreshToken(req: Request): string | undefined {
  const fromCookie = req.cookies?.[REFRESH_COOKIE_NAME];
  if (typeof fromCookie === 'string' && fromCookie.length > 0) {
    return fromCookie;
  }
  const fromBody = (req.body as { refreshToken?: string } | undefined)?.refreshToken;
  return fromBody || undefined;
}

export function extractAccessToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return undefined;
}

export function deviceFromRequest(req: Request): {
  browser?: string;
  os?: string;
  deviceType?: string;
  ipAddress?: string;
} {
  const ua = req.headers['user-agent'] || '';
  return {
    browser: ua ? ua.slice(0, 180) : undefined,
    deviceType: /mobile|android|iphone/i.test(ua) ? 'mobile' : 'desktop',
    ipAddress: req.ip,
  };
}

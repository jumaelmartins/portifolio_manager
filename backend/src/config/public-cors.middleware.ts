import type { NextFunction, Request, Response } from 'express';

/**
 * Opens CORS for the read-only public API (`/public/*`) so external sites can
 * consume portfolio data from the browser. Public data is public by design;
 * `*` cannot combine with credentials, and these routes use no cookies/auth.
 * Registered BEFORE the global (credentialed, origin-locked) `enableCors` so
 * it wins for `/public` paths and answers their preflight.
 */
export function publicCors(req: Request, res: Response, next: NextFunction) {
  if (req.path === '/public' || req.path.startsWith('/public/')) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
  }
  next();
}

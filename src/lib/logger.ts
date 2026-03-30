import pino from 'pino';
import { NextRequest } from 'next/server';

// Avoid pino-pretty's worker-thread transport in Next.js dev (Turbopack cannot
// resolve the thread-stream worker path and crashes with a jest-worker error).
// Plain JSON output is used instead; pipe through `npx pino-pretty` if needed.
const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
});

export function getRequestLogger(req: NextRequest) {
  const requestId = req.headers.get('x-request-id');
  return requestId ? logger.child({ requestId }) : logger;
}

export default logger;
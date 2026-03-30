import pino from 'pino';
import { NextRequest } from 'next/server';

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  ...(process.env.NODE_ENV !== 'production'
    ? { transport: { target: 'pino-pretty', options: { colorize: true, sync: true } } }
    : {}),
});

export function getRequestLogger(req: NextRequest) {
  const requestId = req.headers.get('x-request-id');
  return requestId ? logger.child({ requestId }) : logger;
}

export default logger;
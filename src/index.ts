import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { studyGuideRouter } from './modules/job/router'
import { errorMessage, logger } from './utils/logger'

const app = new Hono()

app.use('*', async (c, next) => {
  const startedAt = Date.now();
  await next();
  logger.info('HTTP request completed', {
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    durationMs: Date.now() - startedAt,
  });
});

app.onError((error, c) => {
  logger.error('HTTP request failed', {
    method: c.req.method,
    path: c.req.path,
    error: errorMessage(error),
  });
  return c.json({ message: 'Internal server error' }, 500);
});

app.route('/study-guides', studyGuideRouter)

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log('HTTP server started', { port: info.port })
})

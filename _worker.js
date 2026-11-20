/**
 * Cloudflare Pages Advanced Mode Worker
 * Routes /api/* requests to the CodeSphere backend engine (src/worker.js)
 * and falls through to env.ASSETS for all static frontend assets.
 */
import worker from './src/worker.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      return worker.fetch(request, env, ctx);
    }
    return env.ASSETS.fetch(request);
  }
};

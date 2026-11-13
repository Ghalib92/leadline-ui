import { setupServer } from 'msw/node';

/**
 * The fake backend for tests. No default handlers: each test declares the
 * requests it expects with `server.use(...)` on the browser path
 * (`*\/api/organizations/:id/...`), answering with the captured backend
 * fixtures in `lib/schema/__fixtures__/backend/`.
 */
export const server = setupServer();

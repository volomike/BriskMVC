import { loadConfig } from './briskmvc/config.js';
import { createElysia } from './briskmvc/elysia.js';
import { setupStatic } from './briskmvc/static.js';
import { setupFavicon } from './briskmvc/favicon.js';
import { loadRoutes } from './briskmvc/router.js';
import { startServer } from './briskmvc/listen.js';

async function main(BASEPATH) {
  const config = loadConfig({ BASEPATH });
  const elysia = createElysia({ BASEPATH });
  setupStatic(elysia, { BASEPATH });
  setupFavicon(elysia, { BASEPATH });
  loadRoutes(elysia, { BASEPATH });
  startServer(elysia, { BASEPATH, config });
}

try {
  await main(import.meta.dir);
} catch (err) {
  console.error('BOOT ERROR:', err);
}

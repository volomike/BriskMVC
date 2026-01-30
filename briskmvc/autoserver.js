import fs from 'fs';
import path from 'path';

export async function runAutoserver({ BASEPATH, config }) {
  try {
    const autoServerPath = path.join(BASEPATH, 'controllers', 'autoserver.js');
    if (fs.existsSync(autoServerPath)) {
      const mod = await import(autoServerPath + `?t=${Date.now()}`);
      if (mod?.default) {
        await mod.default({ config, BASEPATH });
      }
    }
  } catch (err) {
    console.error('AUTOSERVER ERROR:', err);
  }
}


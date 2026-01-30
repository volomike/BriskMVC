import fs from 'fs';
import path from 'path';

const cache = new Map();

async function loadModel(name, { BASEPATH }) {
  if (cache.has(name)) return cache.get(name);

  const MODELS_DIR = path.join(BASEPATH, 'models');
  const file = path.join(MODELS_DIR, `${name}.js`);

  if (!fs.existsSync(file)) {
    throw new Error(`Model not found: ${name} at ${file}`);
  }

  const mod = await import(file + `?t=${Date.now()}`);
  const instance = mod.default || mod;
  cache.set(name, instance);
  return instance;
}

export function createModels({ BASEPATH }) {
  return new Proxy(
    {},
    {
      get(_t, prop) {
        if (typeof prop !== 'string') return undefined;

        return new Proxy(
          {},
          {
            get(_inner, method) {
              return async (...args) => {
                const model = await loadModel(prop, { BASEPATH });
                const fn = model[method];
                if (typeof fn !== 'function') {
                  throw new Error(`Method ${String(method)} not found on model ${prop}`);
                }
                return fn.apply(model, args);
              };
            }
          }
        );
      }
    }
  );
}


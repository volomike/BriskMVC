// briskmvc/context.js (revised)

import path from 'path';
import fs from 'fs';
import { loadConfig } from './config.js';
import { createModels } from './models.js';
import { renderViewAuto } from './view.js';

const sessionStore = new Map();

function computeBaseUrl(request) {
  const h = request.headers;
  const xfProto = h.get('x-forwarded-proto');
  const xfHost = h.get('x-forwarded-host');
  const xfPort = h.get('x-forwarded-port');

  if (xfProto && xfHost) {
    const port = xfPort && !['80', '443'].includes(xfPort) ? `:${xfPort}` : '';
    return `${xfProto}://${xfHost}${port}`;
  }

  const url = new URL(request.url);
  const isDefault =
    (url.protocol === 'http:' && url.port === '80') ||
    (url.protocol === 'https:' && url.port === '443') ||
    url.port === '';
  const port = isDefault ? '' : `:${url.port}`;
  return `${url.protocol}//${url.hostname}${port}`;
}

async function runAutoRequest(w, VIEW, BASEPATH) {
  try {
    const autoRequestPath = path.join(BASEPATH, 'controllers', '_autorequest.js');
    if (!fs.existsSync(autoRequestPath)) return;
    const mod = await import(autoRequestPath + `?t=${Date.now()}`);
    if (mod?.default) await mod.default({ w, VIEW });
  } catch (err) {
    console.error('AUTOREQUEST ERROR:', err);
  }
}

export async function buildContext(request, headers, controllerPath, bodyFromCtx = null, options = {}) {
  const { BASEPATH } = options;
  if (!BASEPATH) throw new Error('BASEPATH is required in buildContext options');

  const v = {};

  const BASEURL = computeBaseUrl(request);
  const url = new URL(request.url);
  const getParams = Object.fromEntries(url.searchParams.entries());

  const cookies = Object.fromEntries(
    (request.headers.get('cookie') || '')
      .split(';')
      .map(c => c.trim().split('='))
      .filter(([k]) => k)
      .map(([k, v]) => [k, decodeURIComponent(v || '')])
  );

  let sid = cookies.sid || crypto.randomUUID();
  const isNewSession = !sessionStore.has(sid);
  if (isNewSession) sessionStore.set(sid, {});
  const session = sessionStore.get(sid);

  headers.append(
    'Set-Cookie',
    `sid=${sid}; Path=/; HttpOnly; SameSite=Lax`
  );

  let post = {};
  let posttype = null;
  let rawBody = null;
  let files = {};

  const method = request.method.toLowerCase();

  if (['post', 'put', 'patch'].includes(method)) {
    if (bodyFromCtx != null) {
      post = bodyFromCtx;
      posttype = 'json';
    } else {
      post = {};
      posttype = 'unknown';
    }
  }

  v.BASEURL = BASEURL;
  v.BASEPATH = BASEPATH;
  v.RANDOMID = (Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2)).substring(0, 16);
  v.SESSIONID = sid;

  const mtemp = createModels({ BASEPATH });

///////////////////////////////////////////////////////////////////////////////////
// The "w" (web) object -- key component of the BriskMVC framework
///////////////////////////////////////////////////////////////////////////////////

  const w = {
    req: request,
    res: headers,

    m: mtemp,
    models: mtemp,

    config: loadConfig({ BASEPATH }),

    v,
    view: v,

    get: getParams,
    post,
    posttype,
    rawBody,
    files,

    html: str => new Response(str, { headers }),
    json: obj => new Response(JSON.stringify(obj), { headers }),

    header: (name, value) => headers.set(name, value),
    addHeader: (name, value) => headers.append(name, value),
    getHeader: name => headers.get(name),

    cookie: (name, value, opts = {}) => {
      const defaults = {
        path: '/',
        domain: '.' + new URL(request.url).hostname,
        httpOnly: true,
        sameSite: 'Lax',
        secure: false,
        maxAge: 60 * 60 * 24 * 365
      };
      const final = { ...defaults, ...opts };
      const cookie =
        `${name}=${encodeURIComponent(value)}; ` +
        Object.entries(final)
          .map(([k, v]) => {
            if (v === true) return k;
            if (v === false || v == null) return '';
            return `${k}=${v}`;
          })
          .filter(Boolean)
          .join('; ');
      headers.append('Set-Cookie', cookie);
    },

    sessionCookie: (name, value, opts = {}) => {
      const defaults = {
        path: '/',
        domain: '.' + new URL(request.url).hostname,
        httpOnly: true,
        sameSite: 'Lax',
        secure: false
      };
      const final = { ...defaults, ...opts };
      const cookie =
        `${name}=${encodeURIComponent(value)}; ` +
        Object.entries(final)
          .map(([k, v]) => {
            if (v === true) return k;
            if (v === false || v == null) return '';
            return `${k}=${v}`;
          })
          .filter(Boolean)
          .join('; ');
      headers.append('Set-Cookie', cookie);
    },

    session,

    doRedirect: (url, status = 302) =>
      new Response('', {
        status,
        headers: { Location: url }
      }),

    // IMPORTANT: no async keyword — return the Promise directly
    renderView: (overrideView = null) =>
      renderViewAuto(controllerPath, { VIEW: v }, overrideView, headers, { BASEPATH })
  };

///////////////////////////////////////////////////////////////////////////////////
// End of "w" assignment
///////////////////////////////////////////////////////////////////////////////////

  globalThis.w = w;
  globalThis.VIEW = v;

  globalThis.die = function (msg, obj = null) {
    let dump = '';
    if (obj !== null) {
      try {
        dump = '\n\nDUMP:\n' + JSON.stringify(obj, null, 2);
      } catch {
        dump = '\n\nDUMP: [unserializable object]';
      }
    }
    const err = new Error(msg + dump);
    err.name = 'DUMP';
    throw err;
  };

  // Run on every request
  await runAutoRequest(w, v, BASEPATH);

  return { w, VIEW: v };
}

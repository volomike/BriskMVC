// briskmvc/context.js (revised with Elysia native reactive cookies + wrapper)

import path from 'path';
import fs from 'fs';
import { loadConfig } from './config.js';
import { models, createModels } from './models.js';
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

function parseCookies(header) {
	if (!header) return {};
	return Object.fromEntries(
		header
			.split(';')
			.map(c => c.trim().split('='))
			.filter(([k]) => k)
			.map(([k, v]) => [k, decodeURIComponent(v || '')])
	);
}

function getRootDomain(sUrl) {
	try {
		const { hostname } = new URL(sUrl);
		const aoMatch = hostname.match(/(?:^|\.)([\w-]+\.(?:\w{2,}|\w{2}\.\w{2}))$/);
		if (aoMatch) {
			return aoMatch[1].toLowerCase();
		}
	} catch (e) {}
	return undefined;
}

export async function buildContext(request, headers, controllerPath, bodyFromCtx = null, options = {}, cookieObj = {}) {
	const { BASEPATH } = options;
	if (!BASEPATH) throw new Error('BASEPATH is required in buildContext options');

	const v = {};

	const BASEURL = computeBaseUrl(request).split('http://').join('https://');
	const url = new URL(request.url);
	const getParams = Object.fromEntries(url.searchParams.entries());

	const incomingCookies = parseCookies(request.headers.get('cookie'));

	let sid = incomingCookies.sid || crypto.randomUUID();
	const isNewSession = !sessionStore.has(sid);
	if (isNewSession) sessionStore.set(sid, {});
	const session = sessionStore.get(sid);

	// Always ensure sid is set (new or refresh)
	headers.append('Set-Cookie', `sid=${sid}; Path=/; HttpOnly; SameSite=Lax`);

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

	function xtimeid() {
		const b = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
		const EPOCH_MS = 1735689600000;

		const timeOriginMs = performance.timeOrigin;
		const uptimeNs = Bun.nanoseconds();
		const nowNsApprox = timeOriginMs * 1_000_000 + uptimeNs;
		const epochNs = EPOCH_MS * 1_000_000;
		const deltaNs = Math.floor(nowNsApprox - epochNs);

		let s = "";
		let n = deltaNs;

		if (n <= 0) {
			s = "0";
		} else {
			while (n > 0) {
				s = b[Math.floor(n % 62)] + s;
				n = Math.floor(n / 62);
			}
		}

		return s.padStart(10, "0");
	}

	await createModels({ BASEPATH });
	const mtemp = models;

	v.BASEURL = BASEURL;
	v.BASEPATH = BASEPATH;
	v.RANDOMID = (Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2)).substring(0, 16);
	v.TIMEID = xtimeid();
	v.SESSIONID = sid;

	// ────────────────────────────────────────────────
	// Elysia reactive cookie wrapper (your desired API)
	// ────────────────────────────────────────────────
	const createCookieAccessor = (cookieObj) => (name, value, opts = {}) => {
		const cookie = cookieObj[name];

		// Getter: w.cookie('key')
		if (value === undefined) {
			return cookie?.value;
		}
		
		const sDerivedDomain = '.' + getRootDomain(BASEURL);
		const isHTTPS = BASEURL.startsWith('https://');
		
//console.log('sDerivedDomain',sDerivedDomain);
//console.log('isHTTPS',isHTTPS);

		// Setter: w.cookie('key', val, { ... })
		cookie.set({
			value,
			path: '/',
			sameSite: 'Lax',
			httpOnly: true,
			secure: isHTTPS,
			maxAge: 100 * 365 * 24 * 60 * 60, // 100 years "permanent" cookie by default
			domain: sDerivedDomain,
			...opts
		});

		return w; // chainable, like your original
	};

	// ────────────────────────────────────────────────
	// The "w" (web) object
	// ────────────────────────────────────────────────
	const w = {
		req: request,
		res: headers,

		m: mtemp,
		models: mtemp,
		
		basepath: BASEPATH,
		baseurl: BASEURL,

		config: loadConfig({ BASEPATH }),

		v,
		view: v,

		get: getParams,
		post,
		posttype,
		rawBody,
		files,

		html: str => new Response(str, { headers }),

		json: obj => {
			headers.set('Content-Type', 'application/json');
			return obj;
			//return new Response(JSON.stringify(obj), { headers });
			//return new Response(obj, { headers });
		},

		header: (name, value) => headers.set(name, value),
		addHeader: (name, value) => headers.append(name, value),
		getHeader: name => headers.get(name),

		// ─── Your requested cookie API ───────────────────────
		cookie: createCookieAccessor(cookieObj),

		session,

		doRedirect: (url, status = 302) =>
			new Response('', {
				status,
				headers: { Location: url }
			}),

		renderView: (overrideView = null) =>
			renderViewAuto(controllerPath, { VIEW: v }, overrideView, headers, { BASEPATH })
	};

	// IMPORTANT: Expose the real reactive cookie too, in case you want to use .value / .remove() later
	w.nativeCookie = request.cookie;

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

	await runAutoRequest(w, v, BASEPATH);

	return { w, VIEW: v };
}


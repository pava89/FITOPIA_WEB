/* FITOPÍA · Cliente de la API
 * Si la página se abre desde el servidor Node.js, habla con /api/v1 por HTTP.
 * Si se abre con doble clic (file://) o sin servidor, usa el mismo núcleo dentro
 * del navegador ("modo demo") y guarda en localStorage.
 */
(function () {
  'use strict';

  // ---------- SHA-256, HMAC y PBKDF2 en JavaScript puro (solo para el modo demo) ----------
  const K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2]);
  function sha256(msg) {
    const l = msg.length;
    const padLen = Math.ceil((l + 9) / 64) * 64;
    const buf = new Uint8Array(padLen);
    buf.set(msg); buf[l] = 0x80;
    const dv = new DataView(buf.buffer);
    const bits = l * 8;
    dv.setUint32(padLen - 4, bits >>> 0);
    dv.setUint32(padLen - 8, Math.floor(bits / 0x100000000));
    let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a, h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
    const w = new Uint32Array(64);
    for (let off = 0; off < padLen; off += 64) {
      for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4);
      for (let i = 16; i < 64; i++) {
        const x = w[i - 15], y = w[i - 2];
        const s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
        const s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
      for (let i = 0; i < 64; i++) {
        const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
        const ch = (e & f) ^ (~e & g);
        const t1 = (h + S1 + ch + K[i] + w[i]) | 0;
        const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + maj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
      h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
    }
    const out = new Uint8Array(32), odv = new DataView(out.buffer);
    [h0, h1, h2, h3, h4, h5, h6, h7].forEach((v, i) => odv.setUint32(i * 4, v >>> 0));
    return out;
  }
  function hmacSha256(key, msg) {
    if (key.length > 64) key = sha256(key);
    const k = new Uint8Array(64); k.set(key);
    const ip = new Uint8Array(64 + msg.length), op = new Uint8Array(96);
    for (let i = 0; i < 64; i++) { ip[i] = k[i] ^ 0x36; op[i] = k[i] ^ 0x5c; }
    ip.set(msg, 64);
    op.set(sha256(ip), 64);
    return sha256(op);
  }
  function pbkdf2(pw, salt, iter) {
    const s = new Uint8Array(salt.length + 4); s.set(salt); s[salt.length + 3] = 1;
    let u = hmacSha256(pw, s); const t = u.slice();
    for (let i = 1; i < iter; i++) { u = hmacSha256(pw, u); for (let j = 0; j < 32; j++) t[j] ^= u[j]; }
    return t;
  }
  const enc = new TextEncoder();
  const hex = (b) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  function randomHex(n) {
    const a = new Uint8Array(n);
    if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(a);
    else for (let i = 0; i < n; i++) a[i] = Math.floor(Math.random() * 256);
    return hex(a);
  }

  // ---------- almacenamiento seguro (localStorage puede estar bloqueado) ----------
  const memoria = {};
  const LS = {
    get(k) { try { const v = window.localStorage.getItem(k); return v === null ? (k in memoria ? memoria[k] : null) : v; } catch (e) { return k in memoria ? memoria[k] : null; } },
    set(k, v) { memoria[k] = v; try { window.localStorage.setItem(k, v); } catch (e) { /* sin persistencia */ } },
    del(k) { delete memoria[k]; try { window.localStorage.removeItem(k); } catch (e) { /* nada */ } }
  };

  let modo = null;
  let local = null;

  async function iniciarLocal() {
    let secreto = LS.get('fitopia_demo_secreto');
    if (!secreto) { secreto = randomHex(32); LS.set('fitopia_demo_secreto', secreto); }
    const store = {
      load() { const t = LS.get('fitopia_demo_db'); return t ? JSON.parse(t) : null; },
      save(db) { LS.set('fitopia_demo_db', JSON.stringify(db)); }
    };
    const deps = {
      now: () => Date.now(),
      randomHex,
      secret: secreto,
      modo: 'demo',
      motor: 'JavaScript en el navegador',
      almacenamiento: 'localStorage del navegador',
      auditoriaDestino: 'localStorage del navegador',
      hashPassword: async (pw) => { const sal = randomHex(16); return 'pbkdf2$3000$' + sal + '$' + hex(pbkdf2(enc.encode(String(pw)), enc.encode(sal), 3000)); },
      verifyPassword: async (pw, guardado) => {
        const [alg, it, sal, h] = String(guardado || '').split('$');
        if (alg !== 'pbkdf2') return false;
        return hex(pbkdf2(enc.encode(String(pw)), enc.encode(sal), +it)) === h;
      },
      hmac: async (clave, datos) => hmacSha256(enc.encode(clave), enc.encode(datos))
    };
    local = window.FitopiaCore.createApp({ store, deps });
    await local.init();
  }

  async function init() {
    if (/^https?:$/.test(location.protocol)) {
      try {
        const r = await fetch('api/v1/health', { headers: { Accept: 'application/json' }, cache: 'no-store' });
        if (r.ok) {
          const j = await r.json();
          if (j && j.servicio === 'fitopia') { modo = 'servidor'; return j; }
        }
      } catch (e) { /* no hay servidor: modo demo */ }
    }
    await iniciarLocal();
    modo = 'demo';
    return (await local.handle({ method: 'GET', path: '/api/v1/health' })).body;
  }

  const claveToken = () => 'fitopia_token_' + modo;

  async function llamar(method, ruta, cuerpo, opciones) {
    opciones = opciones || {};
    const token = LS.get(claveToken());
    let status, data;
    if (modo === 'servidor') {
      const h = { Accept: 'application/json' };
      if (cuerpo !== undefined) h['Content-Type'] = 'application/json';
      if (token) h.Authorization = 'Bearer ' + token;
      let r;
      try {
        r = await fetch('api/v1' + ruta, { method, headers: h, body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined, cache: 'no-store' });
      } catch (e) {
        const err = new Error('No hay conexión con el servidor. Revisa que la ventana negra de FITOPÍA siga abierta.');
        err.status = 0; err.data = {}; throw err;
      }
      status = r.status;
      if (opciones.texto && r.ok) data = await r.text();
      else data = await r.json().catch(() => ({}));
    } else {
      const [p, qs] = ruta.split('?');
      const query = {};
      new URLSearchParams(qs || '').forEach((v, k) => { query[k] = v; });
      const res = await local.handle({ method, path: '/api/v1' + p, query, body: cuerpo === undefined ? {} : JSON.parse(JSON.stringify(cuerpo)), token, ip: 'navegador (demo)' });
      status = res.status;
      data = typeof res.body === 'string' ? res.body : JSON.parse(JSON.stringify(res.body === undefined ? null : res.body));
    }
    if (status >= 400) {
      const err = new Error((data && data.error) || 'Ocurrió un error inesperado');
      err.status = status; err.data = data || {};
      throw err;
    }
    return data;
  }

  window.Api = {
    init,
    get: (ruta, o) => llamar('GET', ruta, undefined, o),
    post: (ruta, cuerpo) => llamar('POST', ruta, cuerpo || {}),
    put: (ruta, cuerpo) => llamar('PUT', ruta, cuerpo || {}),
    del: (ruta) => llamar('DELETE', ruta, {}),
    get modo() { return modo; },
    token: { get: () => LS.get(claveToken()), set: (t) => LS.set(claveToken(), t), borrar: () => LS.del(claveToken()) },
    guardar: LS,
    async reiniciarDemo() { if (local) { await local.reiniciar(); } },
    _test: { sha256, hmacSha256, pbkdf2, hex }
  };
})();

#!/usr/bin/env node
/*
 * FITOPÍA · Servidor local
 * --------------------------------------------------------------
 * Node.js puro, sin dependencias: no hace falta "npm install".
 *   node server.js            → inicia en http://localhost:3000
 *   node server.js --abrir    → además abre el navegador
 *   node server.js --reiniciar → borra los datos y vuelve a los de ejemplo
 *
 * Arquitectura (igual a la del SRS, versión local):
 *   Navegador (SPA)  ──HTTP/JSON──►  API REST /api/v1 (este servidor)  ──►  data/db.json
 *   - data/db.json          hace las veces de MySQL en Amazon RDS (datos transaccionales)
 *   - data/auditoria.jsonl  hace las veces de DynamoDB (logs y auditoría, RS 07)
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const { exec } = require('child_process');
const Core = require('./public/js/core.js');

const RAIZ = __dirname;
const PUBLICO = path.join(RAIZ, 'public');
const DATOS = path.join(RAIZ, 'data');
const DB_FILE = path.join(DATOS, 'db.json');
const AUDIT_FILE = path.join(DATOS, 'auditoria.jsonl');
const SECRET_FILE = path.join(DATOS, 'secret.key');
const PUERTO_BASE = parseInt(process.env.PORT, 10) || 3000;
const ABRIR = process.argv.includes('--abrir');
const REINICIAR = process.argv.includes('--reiniciar');
const EN_RED = process.argv.includes('--red'); // permite abrirla desde el celular en la misma red Wi-Fi
const LIMITE_CUERPO = 1024 * 1024;

fs.mkdirSync(DATOS, { recursive: true });
if (REINICIAR) {
  for (const f of [DB_FILE, AUDIT_FILE]) { try { fs.unlinkSync(f); } catch (e) { /* no existía */ } }
}
let SECRETO;
try { SECRETO = fs.readFileSync(SECRET_FILE, 'utf8').trim(); } catch (e) { SECRETO = ''; }
if (SECRETO.length < 32) { SECRETO = crypto.randomBytes(32).toString('hex'); fs.writeFileSync(SECRET_FILE, SECRETO); }

// ---------- persistencia ----------
const store = {
  load() {
    try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch (e) { return null; }
  },
  save(db) {
    const contenido = JSON.stringify(db);
    const tmp = DB_FILE + '.tmp';
    try { fs.writeFileSync(tmp, contenido); fs.renameSync(tmp, DB_FILE); }
    catch (e) { fs.writeFileSync(DB_FILE, contenido); }
  },
  appendAudit(entrada) {
    try { fs.appendFileSync(AUDIT_FILE, JSON.stringify(entrada) + '\n'); } catch (e) { console.error('No se pudo escribir la auditoría', e.message); }
  },
  readAudit(n) {
    try {
      const lineas = fs.readFileSync(AUDIT_FILE, 'utf8').split('\n').filter(Boolean);
      return lineas.slice(-n).reverse().map((l) => { try { return JSON.parse(l); } catch (e) { return null; } }).filter(Boolean);
    } catch (e) { return []; }
  }
};

// ---------- criptografía (RS 02 y RS 03) ----------
const deps = {
  now: () => Date.now(),
  randomHex: (n) => crypto.randomBytes(n).toString('hex'),
  secret: SECRETO,
  modo: 'servidor',
  motor: 'Node.js ' + process.version,
  almacenamiento: 'data/db.json (en producción: MySQL en Amazon RDS)',
  auditoriaDestino: 'data/auditoria.jsonl (en producción: Amazon DynamoDB)',
  // scrypt: función de hash lenta y con sal, de la misma familia que bcrypt/Argon2
  hashPassword: (pw) => new Promise((resolve, reject) => {
    const sal = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(String(pw), sal, 32, (err, clave) => (err ? reject(err) : resolve('scrypt$' + sal + '$' + clave.toString('hex'))));
  }),
  verifyPassword: (pw, guardado) => new Promise((resolve) => {
    const [alg, sal, hash] = String(guardado || '').split('$');
    if (alg !== 'scrypt' || !sal || !hash) return resolve(false);
    crypto.scrypt(String(pw), sal, 32, (err, clave) => {
      if (err) return resolve(false);
      const esperado = Buffer.from(hash, 'hex');
      resolve(esperado.length === clave.length && crypto.timingSafeEqual(esperado, clave));
    });
  }),
  hmac: (clave, datos) => new Uint8Array(crypto.createHmac('sha256', clave).update(datos).digest())
};

const app = Core.createApp({ store, deps });

// ---------- archivos estáticos ----------
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain; charset=utf-8'
};
const SEGURIDAD = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
};

function enviar(res, status, cuerpo, cabeceras) {
  res.writeHead(status, Object.assign({}, SEGURIDAD, cabeceras || {}));
  res.end(cuerpo);
}

function servirEstatico(req, res, ruta) {
  let rel = decodeURIComponent(ruta.split('?')[0]);
  if (rel === '/' || rel === '') rel = '/index.html';
  const archivo = path.normalize(path.join(PUBLICO, rel));
  if (!archivo.startsWith(PUBLICO)) return enviar(res, 403, 'Prohibido', { 'Content-Type': 'text/plain; charset=utf-8' });
  fs.readFile(archivo, (err, datos) => {
    if (err) {
      if (!path.extname(rel)) { // rutas de la SPA sin extensión → index.html
        return fs.readFile(path.join(PUBLICO, 'index.html'), (e2, html) => enviar(res, e2 ? 404 : 200, e2 ? 'No encontrado' : html, { 'Content-Type': TIPOS['.html'] }));
      }
      return enviar(res, 404, 'No encontrado', { 'Content-Type': 'text/plain; charset=utf-8' });
    }
    enviar(res, 200, datos, { 'Content-Type': TIPOS[path.extname(archivo).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  });
}

function leerCuerpo(req) {
  return new Promise((resolve, reject) => {
    let tam = 0; const partes = [];
    req.on('data', (c) => {
      tam += c.length;
      if (tam > LIMITE_CUERPO) { reject(Object.assign(new Error('La solicitud es demasiado grande'), { status: 413 })); req.destroy(); return; }
      partes.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(partes).toString('utf8')));
    req.on('error', reject);
  });
}

async function atenderApi(req, res, url) {
  const inicio = Date.now();
  let cuerpo = {};
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const tipo = String(req.headers['content-type'] || '');
    try {
      const crudo = await leerCuerpo(req);
      if (crudo) {
        // Solo JSON: un formulario de otro sitio no puede enviar application/json sin permiso (defensa CSRF)
        if (!tipo.includes('application/json')) return responderJson(res, 415, { error: 'Usa Content-Type: application/json' });
        cuerpo = JSON.parse(crudo);
      }
    } catch (e) {
      return responderJson(res, e.status || 400, { error: e.status ? e.message : 'El cuerpo no es un JSON válido' });
    }
  }
  const auth = String(req.headers.authorization || '');
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : null;
  let ip = req.socket.remoteAddress || '-';
  if (ip === '::1' || ip === '::ffff:127.0.0.1') ip = '127.0.0.1';
  const r = await app.handle({ method: req.method, path: url.pathname, query: Object.fromEntries(url.searchParams), body: cuerpo, token, ip });
  if (typeof r.body === 'string') enviar(res, r.status, r.body, Object.assign({ 'Cache-Control': 'no-store' }, r.headers));
  else responderJson(res, r.status, r.body);
  const ms = Date.now() - inicio;
  const color = r.status >= 500 ? '\x1b[31m' : r.status >= 400 ? '\x1b[33m' : '\x1b[32m';
  console.log(`  ${color}${r.status}\x1b[0m ${req.method.padEnd(6)} ${url.pathname}${url.search} \x1b[90m${ms} ms\x1b[0m`);
}

function responderJson(res, status, obj) {
  enviar(res, status, JSON.stringify(obj), { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
}

const servidor = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/')) {
    atenderApi(req, res, url).catch((e) => { console.error(e); responderJson(res, 500, { error: 'Error interno del servidor' }); });
  } else if (req.method === 'GET' || req.method === 'HEAD') {
    servirEstatico(req, res, url.pathname);
  } else {
    enviar(res, 405, 'Método no permitido', { 'Content-Type': 'text/plain; charset=utf-8' });
  }
});

function abrirNavegador(url) {
  const cmd = process.platform === 'win32' ? `start "" "${url}"` : process.platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`;
  exec(cmd, () => {});
}

function escuchar(puerto, intentos) {
  servidor.once('error', (err) => {
    if (err.code === 'EADDRINUSE' && intentos > 0) {
      console.log(`  El puerto ${puerto} está ocupado, probando con ${puerto + 1}...`);
      escuchar(puerto + 1, intentos - 1);
    } else {
      console.error('  No se pudo iniciar el servidor:', err.message);
      process.exit(1);
    }
  });
  servidor.listen(puerto, EN_RED ? '0.0.0.0' : '127.0.0.1', () => {
    const url = `http://localhost:${puerto}`;
    console.log('');
    console.log('  \x1b[1m\x1b[38;5;208mFITOPÍA\x1b[0m está funcionando en \x1b[1m' + url + '\x1b[0m');
    if (EN_RED) {
      Object.values(os.networkInterfaces()).flat().filter((i) => i && i.family === 'IPv4' && !i.internal)
        .forEach((i) => console.log('  Desde el celular (misma Wi-Fi): \x1b[1mhttp://' + i.address + ':' + puerto + '\x1b[0m'));
    }
    console.log('');
    console.log('  Cuentas de prueba:');
    console.log('    Cliente        cliente@fitopia.co   Cliente123*');
    console.log('    Administrador  admin@fitopia.co     Admin123*');
    console.log('    Técnico        tecnico@fitopia.co   Tecnico123*');
    console.log('');
    console.log('  Tarjeta aprobada 4242 4242 4242 4242 · rechazada 4000 0000 0000 0002');
    console.log('  Datos: data/db.json · Auditoría: data/auditoria.jsonl');
    console.log('  Para detener el servidor cierra esta ventana o presiona Ctrl + C.');
    console.log('');
    if (ABRIR) abrirNavegador(url);
  });
}

app.init().then(() => escuchar(PUERTO_BASE, 10)).catch((e) => {
  console.error('  Error al iniciar FITOPÍA:', e);
  process.exit(1);
});

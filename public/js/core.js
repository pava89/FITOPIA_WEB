/*!
 * FITOPÍA · Núcleo de la API REST /api/v1
 * --------------------------------------------------------------
 * Este archivo es el "backend" de la plataforma. Se ejecuta igual:
 *   - en el servidor Node.js (server.js), guardando en data/db.json
 *   - en el navegador (modo demo), guardando en localStorage
 *
 * Trazabilidad con el SRS IEEE-830 v2.0:
 *   RS 02  contraseñas con hash; los datos de pago nunca se guardan (solo token)
 *   RS 03  tokens JWT con expiración programada
 *   RS 04  panel de administrador solo para el rol Administrador
 *   RS 05  operaciones críticas con autenticación activa y validación adicional
 *   RS 06  bloqueo por fuerza bruta en el login
 *   RS 07  registro de auditoría de eventos críticos
 *   RES 04 compra todo o nada (pedido + inventario + pago, o se revierte todo)
 *   RF-ADD-03 descuento en tienda para suscriptores · RF-ADD-05/06 suscripciones
 *   RN-P 3 tarifa de suscripción garantizada · RN-E 2 moderación de la comunidad
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FitopiaCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const VERSION = '1.0.0';
  const DB_VERSION = 3;
  const TOKEN_HORAS = 2;
  const ENVIO_GRATIS_DESDE = 160000;
  const MAX_INTENTOS = 5;
  const BLOQUEO_MIN = 5;
  const DIA = 86400000;

  const CATEGORIAS = [
    { id: 'maquinaria', nombre: 'Maquinaria', desc: 'Cardio, fuerza y estaciones para entrenar en casa', arte: 'caminadora', color: '#E8743B' },
    { id: 'ropa', nombre: 'Ropa fitness', desc: 'Camisetas, leggins, shorts y buzos', arte: 'camiseta', color: '#7F77DD' },
    { id: 'suplementos', nombre: 'Suplementos', desc: 'Proteína, creatina, vitaminas y más', arte: 'tarro', color: '#1D9E75' },
    { id: 'accesorios', nombre: 'Accesorios', desc: 'Bandas, termos, guantes y colchonetas', arte: 'bandas', color: '#378ADD' }
  ];
  const ENVIOS = {
    estandar: { id: 'estandar', nombre: 'Estándar', precio: 12900, dias: [3, 5] },
    express: { id: 'express', nombre: 'Express', precio: 24900, dias: [1, 2] }
  };
  const CUPONES = {
    FITO10: { codigo: 'FITO10', tipo: 'porcentaje', valor: 10, desc: '10% de descuento en productos' },
    ENVIOGRATIS: { codigo: 'ENVIOGRATIS', tipo: 'envio', desc: 'Envío estándar gratis' }
  };
  const PERIODOS = {
    mensual: { id: 'mensual', nombre: 'Mensual', meses: 1, desc: 0 },
    trimestral: { id: 'trimestral', nombre: 'Trimestral', meses: 3, desc: 10 },
    semestral: { id: 'semestral', nombre: 'Semestral', meses: 6, desc: 15 }
  };
  const PLANES = [
    { id: 'basico', nombre: 'Básico', precio: 49900, color: '#1D9E75', icono: 'hoja', nivel: 1, descTienda: 0, envioGratis: false, ejerciciosDia: 4,
      lema: 'Empieza a moverte con constancia',
      beneficios: ['Rutinas generales de 3 a 5 días', 'Seguimiento semanal de progreso', 'Comunidad, retos e insignias', 'Mensaje motivacional cada semana'] },
    { id: 'avanzado', nombre: 'Avanzado', precio: 89900, color: '#E8743B', icono: 'llama', nivel: 2, descTienda: 10, envioGratis: false, ejerciciosDia: 5, destacado: true,
      lema: 'Entrena con un plan hecho para ti',
      beneficios: ['Todo lo del plan Básico', 'Rutina según tu objetivo y experiencia', 'Gráfico de peso y progreso', 'Guías de nutrición', '10% de descuento en la tienda'] },
    { id: 'elite', nombre: 'Élite', precio: 149900, color: '#14213D', icono: 'corona', nivel: 3, descTienda: 20, envioGratis: true, ejerciciosDia: 6,
      lema: 'La experiencia FITOPÍA completa',
      beneficios: ['Todo lo del plan Avanzado', 'Rutinas en video exclusivas', 'Plan nutricional completo', 'Eventos y talleres premium', '20% de descuento en la tienda', 'Envío estándar gratis siempre'] }
  ];
  const OBJETIVOS = { 'ganar-musculo': 'Ganar músculo', 'perder-peso': 'Perder peso', 'resistencia': 'Mejorar resistencia' };
  const EXPERIENCIAS = { principiante: 'Principiante', intermedio: 'Intermedio', avanzado: 'Avanzado' };
  const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const DIAS_ENTRENO = { 3: [1, 3, 5], 4: [1, 2, 4, 5], 5: [1, 2, 3, 4, 5] };
  const EJERCICIOS = {
    'ganar-musculo': [['Sentadilla con barra', '4 × 8'], ['Press de banca', '4 × 8'], ['Remo con mancuerna', '4 × 10'], ['Press militar', '3 × 10'],
      ['Peso muerto rumano', '3 × 10'], ['Dominadas asistidas', '3 × 8'], ['Curl de bíceps', '3 × 12'], ['Fondos de tríceps', '3 × 12'],
      ['Zancadas con mancuernas', '3 × 12'], ['Elevaciones laterales', '3 × 15'], ['Hip thrust', '4 × 10'], ['Plancha', '3 × 45 s']],
    'perder-peso': [['Caminadora en intervalos', '20 min'], ['Burpees', '4 × 12'], ['Sentadilla con salto', '4 × 15'], ['Kettlebell swing', '4 × 15'],
      ['Mountain climbers', '3 × 30 s'], ['Cuerda de saltar', '5 × 1 min'], ['Zancadas alternas', '3 × 20'], ['Plancha lateral', '3 × 30 s'],
      ['Bicicleta estática', '15 min'], ['Flexiones de pecho', '3 × 12'], ['Jumping jacks', '3 × 40'], ['Abdominales bicicleta', '3 × 20']],
    'resistencia': [['Bicicleta en zona 2', '30 min'], ['Circuito funcional', '3 rondas'], ['Remo con banda', '4 × 15'], ['Step-ups al banco', '3 × 12'],
      ['Trote suave', '25 min'], ['Sentadilla goblet', '3 × 15'], ['Plancha con toque de hombro', '3 × 20'], ['Cuerda de saltar', '6 × 1 min'],
      ['Peso muerto con kettlebell', '3 × 12'], ['Farmer walk', '4 × 30 m'], ['Burpees', '3 × 10'], ['Estiramiento activo', '10 min']]
  };
  const MENSAJES = [
    'La constancia le gana al talento cuando el talento no es constante.',
    'No tienes que ser extremo, solo constante.',
    'Cada repetición cuenta. Hoy también.',
    'Tu único rival es quien eras la semana pasada.',
    'Descansar también es entrenar: duerme bien esta semana.',
    'Pequeños pasos todos los días construyen grandes cambios.',
    'Hidrátate, come bien y vuelve mañana más fuerte.',
    'El progreso se mide en semanas, no en días.'
  ];
  const ARTES = ['caminadora', 'bicicleta', 'banco', 'rack', 'mancuernas', 'homegym', 'kettlebell', 'camiseta', 'leggins', 'short', 'buzo', 'top',
    'tarro', 'frasco', 'bandas', 'termo', 'guantes', 'colchoneta', 'cuerda', 'rodillo'];
  const ESTADOS_PEDIDO = ['Pagado', 'En preparación', 'Enviado', 'Entregado', 'Cancelado'];
  const PALABRAS_BLOQUEADAS = ['idiota', 'estupido', 'estúpido', 'imbecil', 'imbécil', 'gonorrea', 'malparido', 'hijueputa'];

  class ApiError extends Error {
    constructor(status, message, extra) { super(message); this.status = status; this.extra = extra || {}; }
  }

  // ---------- utilidades ----------
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const norm = (s) => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const round = Math.round;
  const sum = (arr, f) => arr.reduce((a, x) => a + (f ? f(x) : x), 0);
  const texto = (v, max) => String(v == null ? '' : v).trim().slice(0, max || 500);
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

  function b64url(bytes) {
    let out = '', i = 0;
    for (; i + 2 < bytes.length; i += 3) {
      const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
      out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + B64[(n >> 6) & 63] + B64[n & 63];
    }
    const rest = bytes.length - i;
    if (rest === 1) { const n = bytes[i] << 16; out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63]; }
    if (rest === 2) { const n = (bytes[i] << 16) | (bytes[i + 1] << 8); out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + B64[(n >> 6) & 63]; }
    return out;
  }
  function unb64url(s) {
    const out = []; let buf = 0, bits = 0;
    for (const ch of s) {
      const v = B64.indexOf(ch); if (v < 0) throw new Error('base64 inválido');
      buf = (buf << 6) | v; bits += 6;
      if (bits >= 8) { bits -= 8; out.push((buf >> bits) & 255); buf &= (1 << bits) - 1; }
    }
    return new Uint8Array(out);
  }
  function luhn(num) {
    let s = 0, alt = false;
    for (let i = num.length - 1; i >= 0; i--) { let n = +num[i]; if (alt) { n *= 2; if (n > 9) n -= 9; } s += n; alt = !alt; }
    return s % 10 === 0;
  }
  function problemasPassword(pw) {
    const p = String(pw || ''), out = [];
    if (p.length < 8) out.push('mínimo 8 caracteres');
    if (!/[A-ZÁÉÍÓÚÑ]/.test(p)) out.push('una mayúscula');
    if (!/[0-9]/.test(p)) out.push('un número');
    return out;
  }
  function lunesDe(ts) { const d = new Date(ts); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); }
  function isoDia(ts) { const d = new Date(ts); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function sumarDiasHabiles(ts, n) {
    const d = new Date(ts); let c = 0;
    while (c < n) { d.setDate(d.getDate() + 1); const w = d.getDay(); if (w !== 0 && w !== 6) c++; }
    return d.getTime();
  }
  function rng(seed) { // generador determinista para los datos de ejemplo
    let a = seed >>> 0;
    return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function enmascararCorreo(e) { const [u, d] = String(e).split('@'); return (u || '').slice(0, 2) + '•••@' + (d || ''); }
  function marcaTarjeta(n) {
    if (/^4/.test(n)) return 'Visa';
    if (/^(5[1-5]|2[2-7])/.test(n)) return 'Mastercard';
    if (/^3[47]/.test(n)) return 'Amex';
    return 'Tarjeta';
  }

  // ================================================================
  function createApp(opts) {
    const store = opts.store;
    const deps = opts.deps;
    let db = null;
    const inicio = deps.now();
    const routes = [];

    const ahora = () => deps.now();
    const nuevoId = (pref, clave) => pref + (++db.seq[clave]);
    const planPorId = (id) => PLANES.find((p) => p.id === id);
    const subActiva = (userId) => db.subs.find((s) => s.userId === userId && s.estado === 'activa');
    const usuarioPorId = (id) => db.users.find((u) => u.id === id);

    // ---------- JWT (RS 03) ----------
    async function firmarToken(payload) {
      const h = b64url(enc.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
      const p = b64url(enc.encode(JSON.stringify(payload)));
      const firma = await deps.hmac(deps.secret, h + '.' + p);
      return h + '.' + p + '.' + b64url(firma);
    }
    async function verificarToken(token) {
      const partes = String(token || '').split('.');
      if (partes.length !== 3) return null;
      const esperada = b64url(await deps.hmac(deps.secret, partes[0] + '.' + partes[1]));
      if (esperada.length !== partes[2].length) return null;
      let dif = 0; for (let i = 0; i < esperada.length; i++) dif |= esperada.charCodeAt(i) ^ partes[2].charCodeAt(i);
      if (dif !== 0) return null;
      let payload;
      try { payload = JSON.parse(dec.decode(unb64url(partes[1]))); } catch (e) { return null; }
      if (!payload.exp || payload.exp * 1000 < ahora()) return null;
      return payload;
    }

    // ---------- auditoría (RS 07) ----------
    function auditar(evento, user, ip, resultado, detalle) {
      const e = {
        fecha: new Date(ahora()).toISOString(),
        usuario: user ? user.email : 'anónimo',
        rol: user ? (user.rol || '-') : '-',
        ip: ip || '-', evento, resultado, detalle: detalle || ''
      };
      if (store.appendAudit) store.appendAudit(e);
      else { db.audit.unshift(e); if (db.audit.length > 500) db.audit.length = 500; }
    }

    // ---------- vistas públicas de los datos ----------
    function publicSub(s) {
      if (!s) return null;
      const plan = planPorId(s.planId);
      return { id: s.id, planId: s.planId, plan: plan.nombre, color: plan.color, icono: plan.icono, periodo: s.periodo, periodoNombre: PERIODOS[s.periodo].nombre,
        precio: s.precio, inicio: s.inicio, proximoCobro: s.proximoCobro, renovacionAuto: s.renovacionAuto, estado: s.estado,
        metodo: s.metodo, personalizacion: s.personalizacion, descTienda: plan.descTienda, envioGratis: plan.envioGratis };
    }
    function publicUser(u) {
      return { id: u.id, nombre: u.nombre, email: u.email, rol: u.rol, estado: u.estado, telefono: u.telefono, direccion: u.direccion, ciudad: u.ciudad,
        avatarColor: u.avatarColor, notif: u.notif, insignias: u.insignias || [], creado: u.creado, suscripcion: publicSub(subActiva(u.id)) };
    }
    function ratingDe(pid) {
      const rs = db.reviews.filter((r) => r.productoId === pid);
      return { promedio: rs.length ? Math.round((sum(rs, (r) => r.rating) / rs.length) * 10) / 10 : 0, total: rs.length };
    }
    function stockTotal(p) { return p.tallas ? sum(Object.values(p.tallas)) : p.stock; }
    function publicProduct(p) {
      const r = ratingDe(p.id);
      return { id: p.id, nombre: p.nombre, cat: p.cat, tipo: p.tipo, marca: p.marca, precio: p.precio, precioAntes: p.precioAntes || null,
        stock: stockTotal(p), tallas: p.tallas || null, presentaciones: p.presentaciones || null, arte: p.arte, color: p.color,
        desc: p.desc, specs: p.specs, nuevo: (ahora() - p.creado) < 21 * DIA, vendidos: p.vendidos, rating: r.promedio, resenas: r.total, activo: p.activo };
    }
    function publicOrder(o) {
      const u = usuarioPorId(o.userId);
      return Object.assign(clone(o), { cliente: u ? u.nombre : '—', correo: u ? u.email : '' });
    }

    // ---------- cotización del carrito ----------
    function cotizar(items, opciones, user) {
      if (!Array.isArray(items) || !items.length) throw new ApiError(400, 'Tu carrito está vacío');
      if (items.length > 40) throw new ApiError(400, 'Demasiados productos en el carrito');
      opciones = opciones || {};
      const lineas = items.map((it) => {
        const p = db.products.find((x) => x.id === it.productoId && x.activo);
        if (!p) throw new ApiError(404, 'Un producto de tu carrito ya no está disponible', { productoId: it.productoId });
        const cantidad = Math.max(1, Math.min(20, parseInt(it.cantidad, 10) || 1));
        let precio = p.precio, variante = '', presentacion = null, talla = null;
        if (p.presentaciones) {
          const pr = p.presentaciones.find((x) => x.id === it.presentacion) || p.presentaciones[0];
          precio = pr.precio; variante = pr.etiqueta; presentacion = pr.id;
        }
        if (p.tallas) {
          if (!it.talla || !(it.talla in p.tallas)) throw new ApiError(400, 'Elige una talla para ' + p.nombre);
          talla = it.talla; variante = 'Talla ' + it.talla;
        }
        const disponible = talla ? p.tallas[talla] : p.stock;
        return { productoId: p.id, nombre: p.nombre, arte: p.arte, color: p.color, cat: p.cat, talla, presentacion, variante,
          precio, cantidad, total: precio * cantidad, disponible };
      });
      const subtotal = sum(lineas, (l) => l.total);
      const sub = user ? subActiva(user.id) : null;
      const plan = sub ? planPorId(sub.planId) : null;
      const descSuscriptor = plan && plan.descTienda ? round(subtotal * plan.descTienda / 100) : 0;
      let cupon = null, cuponError = null;
      if (opciones.cupon) {
        cupon = CUPONES[String(opciones.cupon).toUpperCase().trim()] || null;
        if (!cupon) cuponError = 'Ese código no existe o ya venció';
      }
      const descCupon = cupon && cupon.tipo === 'porcentaje' ? round((subtotal - descSuscriptor) * cupon.valor / 100) : 0;
      const base = subtotal - descSuscriptor - descCupon;
      const envioSel = ENVIOS[opciones.envio] || ENVIOS.estandar;
      let envio = envioSel.precio, gratisMotivo = null;
      if (envioSel.id === 'estandar') {
        if (plan && plan.envioGratis) gratisMotivo = 'Beneficio del plan Élite';
        else if (cupon && cupon.tipo === 'envio') gratisMotivo = 'Cupón ENVIOGRATIS';
        else if (base >= ENVIO_GRATIS_DESDE) gratisMotivo = 'Compra desde $160.000';
        if (gratisMotivo) envio = 0;
      }
      const total = base + envio;
      return {
        lineas, subtotal, descSuscriptor, planSuscriptor: plan ? plan.nombre : null, descCupon,
        cupon: cupon ? { codigo: cupon.codigo, desc: cupon.desc } : null, cuponError,
        envio: { id: envioSel.id, nombre: envioSel.nombre, precio: envio, original: envioSel.precio, gratisMotivo,
          llegaDesde: sumarDiasHabiles(ahora(), envioSel.dias[0]), llegaHasta: sumarDiasHabiles(ahora(), envioSel.dias[1]) },
        faltaEnvioGratis: gratisMotivo || envioSel.id !== 'estandar' ? 0 : Math.max(0, ENVIO_GRATIS_DESDE - base),
        total, ivaIncluido: round(total - total / 1.19)
      };
    }

    // ---------- pasarela de pagos simulada (Wompi / PayPal sandbox) ----------
    function validarPago(pago) {
      const e = {};
      if (!pago || !['tarjeta', 'nequi', 'pse', 'paypal'].includes(pago.metodo)) throw new ApiError(400, 'Elige un método de pago', { campos: { metodo: 'Elige un método de pago' } });
      if (pago.metodo === 'tarjeta') {
        const num = String(pago.numero || '').replace(/\D/g, '');
        if (num.length < 13 || num.length > 19 || !luhn(num)) e.numero = 'Número de tarjeta inválido';
        if (texto(pago.titular).length < 3) e.titular = 'Escribe el nombre como aparece en la tarjeta';
        const m = /^(\d{2})\s*\/\s*(\d{2})$/.exec(String(pago.vence || ''));
        if (!m || +m[1] < 1 || +m[1] > 12) e.vence = 'Usa el formato MM/AA';
        else {
          const fin = new Date(2000 + +m[2], +m[1], 1).getTime();
          if (fin <= ahora()) e.vence = 'La tarjeta está vencida';
        }
        if (!/^\d{3,4}$/.test(String(pago.cvv || ''))) e.cvv = 'CVV de 3 o 4 dígitos';
      } else if (pago.metodo === 'nequi') {
        if (!/^3\d{9}$/.test(String(pago.celular || '').replace(/\D/g, ''))) e.celular = 'Celular de 10 dígitos que empiece por 3';
      } else if (pago.metodo === 'pse') {
        if (!texto(pago.banco)) e.banco = 'Elige tu banco';
      } else if (pago.metodo === 'paypal') {
        if (!EMAIL_RE.test(String(pago.email || ''))) e.email = 'Correo de PayPal inválido';
      }
      if (Object.keys(e).length) throw new ApiError(400, 'Revisa los datos de pago', { campos: e });
    }
    function procesarPago(pago, monto) {
      const m = pago.metodo;
      const pasarela = m === 'paypal' ? 'PayPal' : 'Wompi';
      const referencia = (m === 'paypal' ? 'PP-' : 'WMP-') + deps.randomHex(3).toUpperCase() + String(ahora()).slice(-5);
      let detalle = '', rechazo = null;
      if (m === 'tarjeta') {
        const num = String(pago.numero).replace(/\D/g, '');
        detalle = marcaTarjeta(num) + ' •••• ' + num.slice(-4);
        if (num.endsWith('0002')) rechazo = 'La entidad rechazó la tarjeta: fondos insuficientes';
      } else if (m === 'nequi') {
        const cel = String(pago.celular).replace(/\D/g, '');
        detalle = 'Nequi •••• ' + cel.slice(-4);
        if (cel.endsWith('0002')) rechazo = 'El pago fue rechazado desde la app Nequi';
      } else if (m === 'pse') detalle = 'PSE · ' + texto(pago.banco, 40);
      else detalle = 'PayPal · ' + enmascararCorreo(pago.email);
      // Solo se conserva el token y la referencia (RS 02). Nunca el número, el CVV ni la clave.
      return { aprobado: !rechazo, mensaje: rechazo || 'Pago aprobado', pasarela, metodo: m, detalle, referencia,
        token: rechazo ? null : 'tok_sandbox_' + deps.randomHex(8), monto };
    }
    function registrarPago(tipo, user, cobro, refId) {
      db.payments.push({ id: nuevoId('pay', 'pay'), tipo, refId, userId: user.id, monto: cobro.monto, metodo: cobro.metodo, pasarela: cobro.pasarela,
        detalle: cobro.detalle, referencia: cobro.referencia, token: cobro.token, estado: cobro.aprobado ? 'aprobado' : 'rechazado', fecha: ahora() });
    }
    function validarDireccion(d) {
      d = d || {}; const e = {};
      if (texto(d.nombre).length < 3) e.nombre = 'Escribe el nombre de quien recibe';
      if (texto(d.direccion).length < 6) e.direccion = 'Escribe una dirección completa';
      if (texto(d.ciudad).length < 3) e.ciudad = 'Escribe la ciudad';
      if (!/^3\d{9}$/.test(String(d.telefono || '').replace(/\D/g, ''))) e.telefono = 'Celular de 10 dígitos';
      if (Object.keys(e).length) throw new ApiError(400, 'Revisa los datos de envío', { campos: e });
      return { nombre: texto(d.nombre, 80), direccion: texto(d.direccion, 120), ciudad: texto(d.ciudad, 60),
        telefono: String(d.telefono).replace(/\D/g, ''), notas: texto(d.notas, 160) };
    }

    // ---------- compra todo o nada (RES 04) ----------
    function crearPedido(ctx, user) {
      const b = ctx.body;
      const direccion = validarDireccion(b.direccion);
      const q = cotizar(b.items, { cupon: b.cupon, envio: b.envio }, user);
      if (q.cuponError) throw new ApiError(400, q.cuponError);
      validarPago(b.pago);
      const necesita = {};
      q.lineas.forEach((l) => { const k = l.productoId + '|' + (l.talla || ''); necesita[k] = (necesita[k] || 0) + l.cantidad; });
      Object.keys(necesita).forEach((k) => {
        const [pid, talla] = k.split('|'); const p = db.products.find((x) => x.id === pid);
        const hay = talla ? p.tallas[talla] : p.stock;
        if (hay < necesita[k]) throw new ApiError(409, hay > 0 ? `Solo quedan ${hay} unidades de ${p.nombre}${talla ? ' en talla ' + talla : ''}` : `${p.nombre}${talla ? ' talla ' + talla : ''} está agotado`);
      });

      const respaldo = clone(db); // punto de restauración de la transacción
      const pasos = [];
      try {
        const pedido = { id: 'FTP-' + (++db.seq.o), userId: user.id, fecha: ahora(), estado: 'Pendiente de pago',
          lineas: q.lineas.map((l) => ({ productoId: l.productoId, nombre: l.nombre, arte: l.arte, color: l.color, variante: l.variante, talla: l.talla, presentacion: l.presentacion, precio: l.precio, cantidad: l.cantidad, total: l.total })),
          subtotal: q.subtotal, descSuscriptor: q.descSuscriptor, descCupon: q.descCupon, cupon: q.cupon ? q.cupon.codigo : null,
          envio: { id: q.envio.id, nombre: q.envio.nombre, precio: q.envio.precio, llegaDesde: q.envio.llegaDesde, llegaHasta: q.envio.llegaHasta },
          total: q.total, ivaIncluido: q.ivaIncluido, direccion, historial: [] };
        db.orders.push(pedido);
        pasos.push('Pedido ' + pedido.id + ' registrado');

        Object.keys(necesita).forEach((k) => {
          const [pid, talla] = k.split('|'); const p = db.products.find((x) => x.id === pid);
          if (talla) { p.tallas[talla] -= necesita[k]; if (p.tallas[talla] < 0) throw new ApiError(409, 'Inventario insuficiente'); }
          else { p.stock -= necesita[k]; if (p.stock < 0) throw new ApiError(409, 'Inventario insuficiente'); }
        });
        pasos.push('Inventario descontado');

        const cobro = procesarPago(b.pago, q.total);
        if (!cobro.aprobado) {
          throw new ApiError(402, cobro.mensaje, { pago: { detalle: cobro.detalle, pasarela: cobro.pasarela, referencia: cobro.referencia }, pasos: pasos.concat(['Pago rechazado por ' + cobro.pasarela]) });
        }
        pasos.push('Pago aprobado por ' + cobro.pasarela);
        pedido.estado = 'Pagado';
        pedido.pago = { pasarela: cobro.pasarela, metodo: cobro.metodo, detalle: cobro.detalle, referencia: cobro.referencia, token: cobro.token };
        pedido.historial.push({ estado: 'Pagado', fecha: ahora() });
        registrarPago('pedido', user, cobro, pedido.id);
        q.lineas.forEach((l) => { const p = db.products.find((x) => x.id === l.productoId); p.vendidos += l.cantidad; });
        pasos.push('Pedido confirmado');
        auditar('compra', user, ctx.ip, 'aprobado', pedido.id + ' por $' + q.total.toLocaleString('es-CO') + ' · ' + cobro.detalle);
        return { pedido: publicOrder(pedido), transaccion: { estado: 'confirmada', pasos } };
      } catch (err) {
        db = respaldo; // se revierte TODO: pedido, inventario y cobro
        auditar('compra', user, ctx.ip, 'revertida', err.message);
        if (err instanceof ApiError) {
          err.extra.transaccion = { estado: 'revertida', pasos: (err.extra.pasos || pasos).concat(['Transacción revertida: no se cobró nada y el inventario quedó intacto']) };
        }
        throw err;
      }
    }

    // ---------- Planes Fit ----------
    function precioPlan(plan, periodo) {
      const per = PERIODOS[periodo];
      return round(plan.precio * per.meses * (100 - per.desc) / 100 / 100) * 100;
    }
    function ajustarSeries(series, exp) {
      const m = /^(\d+) × (.+)$/.exec(series);
      if (!m) return series;
      let n = +m[1];
      if (exp === 'principiante' && n > 3) n -= 1;
      if (exp === 'avanzado' && n < 5) n += 1;
      return n + ' × ' + m[2];
    }
    function miPlan(user) {
      const sub = subActiva(user.id);
      if (!sub) throw new ApiError(404, 'No tienes una suscripción activa', { sinSuscripcion: true });
      const plan = planPorId(sub.planId);
      const per = sub.personalizacion || { objetivo: 'ganar-musculo', experiencia: 'principiante', frecuencia: 3 };
      const lib = EJERCICIOS[per.objetivo] || EJERCICIOS['ganar-musculo'];
      const dias = DIAS_ENTRENO[per.frecuencia] || DIAS_ENTRENO[3];
      const semana = isoDia(lunesDe(ahora()));
      const prog = db.progreso[user.id] || (db.progreso[user.id] = { hechos: {}, pesos: [] });
      const n = plan.ejerciciosDia;
      const rutina = dias.map((dow, i) => {
        const ejercicios = [];
        for (let k = 0; k < n; k++) {
          const [nombre, series] = lib[(i * n + k) % lib.length];
          ejercicios.push({ idx: k, nombre, series: ajustarSeries(series, per.experiencia), hecho: !!prog.hechos[semana + '|' + dow + '|' + k] });
        }
        const hechos = ejercicios.filter((e) => e.hecho).length;
        return { dow, dia: DIAS_SEMANA[dow], ejercicios, hechos, pct: round(hechos * 100 / n) };
      });
      const hoy = new Date(ahora()).getDay();
      const proximo = rutina.find((d) => d.dow > hoy) || rutina[0];
      const semanaNum = Math.max(0, Math.floor((ahora() - sub.inicio) / (7 * DIA)));
      return {
        suscripcion: publicSub(sub), plan, semana, hoy, hoyNombre: DIAS_SEMANA[hoy],
        personalizacion: { objetivo: OBJETIVOS[per.objetivo], experiencia: EXPERIENCIAS[per.experiencia], frecuencia: per.frecuencia },
        rutina, rutinaHoy: rutina.find((d) => d.dow === hoy) || null, proximoDia: proximo.dia,
        mensaje: MENSAJES[semanaNum % MENSAJES.length], semanaPlan: semanaNum + 1,
        pesos: prog.pesos.slice(-12),
        resumen: { hechos: sum(rutina, (d) => d.hechos), total: rutina.length * n, diasCompletos: rutina.filter((d) => d.pct === 100).length, dias: rutina.length }
      };
    }

    // ---------- enrutador ----------
    function ruta(method, pattern, fn, o) {
      o = o || {};
      routes.push({ method, parts: pattern.split('/').filter(Boolean), fn, auth: !!(o.auth || o.roles), roles: o.roles || null });
    }
    function coincide(parts, segs) {
      if (parts.length !== segs.length) return null;
      const params = {};
      for (let i = 0; i < parts.length; i++) {
        if (parts[i][0] === ':') params[parts[i].slice(1)] = decodeURIComponent(segs[i]);
        else if (parts[i] !== segs[i]) return null;
      }
      return params;
    }
    async function usuarioDeToken(token) {
      if (!token) return null;
      const payload = await verificarToken(token);
      if (!payload) return null;
      const u = usuarioPorId(payload.sub);
      if (!u || u.estado !== 'activo') return null;
      return u;
    }

    async function handle(req) {
      const method = String(req.method || 'GET').toUpperCase();
      const path = String(req.path || '/');
      const muta = method !== 'GET';
      try {
        if (!path.startsWith('/api/v1/') && path !== '/api/v1') throw new ApiError(404, 'Ruta no encontrada');
        const segs = path.slice('/api/v1'.length).split('/').filter(Boolean);
        let candidata = null, params = null, metodoErrado = false;
        for (const r of routes) {
          const p = coincide(r.parts, segs);
          if (!p) continue;
          if (r.method !== method) { metodoErrado = true; continue; }
          candidata = r; params = p; break;
        }
        if (!candidata) throw new ApiError(metodoErrado ? 405 : 404, metodoErrado ? 'Método no permitido' : 'Ruta no encontrada');
        const user = await usuarioDeToken(req.token);
        if (candidata.auth && !user) throw new ApiError(401, req.token ? 'Tu sesión expiró. Inicia sesión de nuevo.' : 'Inicia sesión para continuar');
        if (candidata.roles && !candidata.roles.includes(user.rol)) {
          auditar('acceso denegado', user, req.ip, 'bloqueado', method + ' ' + path);
          throw new ApiError(403, 'No tienes permisos para esta sección');
        }
        const ctx = { params, query: req.query || {}, body: (req.body && typeof req.body === 'object') ? req.body : {}, ip: req.ip || '-' };
        const res = await candidata.fn(ctx, user);
        if (res && res.__raw) return { status: res.status || 200, body: res.body, headers: res.headers || {} };
        return { status: method === 'POST' && res && res.__creado ? 201 : 200, body: res && res.__creado ? res.data : res };
      } catch (err) {
        if (err instanceof ApiError) return { status: err.status, body: Object.assign({ error: err.message }, err.extra) };
        if (typeof console !== 'undefined') console.error(err);
        return { status: 500, body: { error: 'Error interno del servidor' } };
      } finally {
        if (muta && db) { try { await store.save(db); } catch (e) { if (typeof console !== 'undefined') console.error('No se pudo guardar', e); } }
      }
    }

    // =============== RUTAS /api/v1 ===============
    ruta('GET', '/health', () => ({ servicio: 'fitopia', version: VERSION, modo: deps.modo, motor: deps.motor, almacenamiento: deps.almacenamiento, hora: ahora() }));
    ruta('GET', '/meta', () => ({ categorias: CATEGORIAS, envios: ENVIOS, envioGratisDesde: ENVIO_GRATIS_DESDE, planes: PLANES, periodos: PERIODOS,
      objetivos: OBJETIVOS, experiencias: EXPERIENCIAS, artes: ARTES, estadosPedido: ESTADOS_PEDIDO,
      cuponesDemo: Object.values(CUPONES).map((c) => ({ codigo: c.codigo, desc: c.desc })) }));

    // ---- Autenticación ----
    ruta('POST', '/auth/register', async (ctx) => {
      const b = ctx.body, e = {};
      const nombre = texto(b.nombre, 60), email = norm(b.email);
      if (nombre.length < 3) e.nombre = 'Escribe tu nombre completo';
      if (!EMAIL_RE.test(email)) e.email = 'Correo inválido';
      else if (db.users.some((u) => u.email === email)) e.email = 'Ya existe una cuenta con ese correo';
      const prob = problemasPassword(b.password);
      if (prob.length) e.password = 'La contraseña necesita ' + prob.join(', ');
      if (b.confirmacion !== undefined && b.confirmacion !== b.password) e.confirmacion = 'Las contraseñas no coinciden';
      if (!b.aceptaDatos) e.aceptaDatos = 'Debes aceptar la política de tratamiento de datos (Ley 1581 de 2012)';
      if (Object.keys(e).length) throw new ApiError(400, 'Revisa los datos del formulario', { campos: e });
      const colores = ['#E8743B', '#1D9E75', '#378ADD', '#7F77DD', '#D4537E', '#14213D'];
      const u = { id: nuevoId('u', 'u'), nombre, email, rol: 'cliente', estado: 'activo', hash: await deps.hashPassword(b.password), creado: ahora(),
        telefono: '', direccion: '', ciudad: '', avatarColor: colores[db.users.length % colores.length], insignias: [],
        notif: { pedidos: true, promociones: false, comunidad: true } };
      db.users.push(u);
      auditar('registro', u, ctx.ip, 'exitoso', 'Nueva cuenta de cliente');
      return { __creado: true, data: { mensaje: 'Cuenta creada', usuario: publicUser(u) } };
    });

    ruta('POST', '/auth/login', async (ctx) => {
      const email = norm(ctx.body.email), pw = String(ctx.body.password || '');
      if (!email || !pw) throw new ApiError(400, 'Ingresa tu correo y tu contraseña');
      const reg = db.intentos[email];
      if (reg && reg.bloqueadoHasta > ahora()) {
        const min = Math.ceil((reg.bloqueadoHasta - ahora()) / 60000);
        auditar('login', { email, rol: '-' }, ctx.ip, 'bloqueado', 'Cuenta bloqueada temporalmente por intentos fallidos');
        throw new ApiError(429, `Demasiados intentos fallidos. Intenta de nuevo en ${min} min.`, { bloqueado: true });
      }
      const u = db.users.find((x) => x.email === email);
      const ok = u ? await deps.verifyPassword(pw, u.hash) : false;
      if (!ok) {
        const r = (reg && ahora() - reg.primero < 15 * 60000) ? reg : { fallidos: 0, primero: ahora(), bloqueadoHasta: 0 };
        r.fallidos += 1;
        if (r.fallidos >= MAX_INTENTOS) { r.bloqueadoHasta = ahora() + BLOQUEO_MIN * 60000; r.fallidos = 0; r.primero = ahora(); }
        db.intentos[email] = r;
        auditar('login', { email, rol: u ? u.rol : '-' }, ctx.ip, 'fallido', 'Credenciales incorrectas');
        const restantes = r.bloqueadoHasta > ahora() ? 0 : MAX_INTENTOS - r.fallidos;
        throw new ApiError(401, restantes === 0 ? `Correo o contraseña incorrectos. Bloqueamos el acceso por ${BLOQUEO_MIN} minutos.` : 'Correo o contraseña incorrectos', { intentosRestantes: restantes });
      }
      if (u.estado !== 'activo') {
        auditar('login', u, ctx.ip, 'bloqueado', 'Cuenta suspendida');
        throw new ApiError(403, 'Tu cuenta está suspendida. Escríbenos a soporte.');
      }
      delete db.intentos[email];
      const iat = Math.floor(ahora() / 1000);
      const token = await firmarToken({ sub: u.id, rol: u.rol, nombre: u.nombre, iat, exp: iat + TOKEN_HORAS * 3600 });
      auditar('login', u, ctx.ip, 'exitoso', '');
      return { token, expiraEn: TOKEN_HORAS * 3600, usuario: publicUser(u) };
    });

    ruta('POST', '/auth/forgot', (ctx) => {
      const email = norm(ctx.body.email);
      if (!EMAIL_RE.test(email)) throw new ApiError(400, 'Escribe un correo válido', { campos: { email: 'Correo inválido' } });
      const u = db.users.find((x) => x.email === email);
      auditar('recuperar contraseña', u || { email, rol: '-' }, ctx.ip, u ? 'correo enviado' : 'correo no registrado', 'Amazon SES (simulado)');
      // Respuesta idéntica exista o no la cuenta, para no revelar qué correos están registrados.
      return { mensaje: 'Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña.' };
    });

    ruta('GET', '/auth/me', (ctx, user) => publicUser(user), { auth: true });

    ruta('PUT', '/auth/me', (ctx, user) => {
      const b = ctx.body, e = {};
      if (b.nombre !== undefined && texto(b.nombre).length < 3) e.nombre = 'Nombre demasiado corto';
      if (b.telefono && !/^3\d{9}$/.test(String(b.telefono).replace(/\D/g, ''))) e.telefono = 'Celular de 10 dígitos';
      if (Object.keys(e).length) throw new ApiError(400, 'Revisa tus datos', { campos: e });
      if (b.nombre !== undefined) user.nombre = texto(b.nombre, 60);
      if (b.telefono !== undefined) user.telefono = String(b.telefono).replace(/\D/g, '');
      if (b.direccion !== undefined) user.direccion = texto(b.direccion, 120);
      if (b.ciudad !== undefined) user.ciudad = texto(b.ciudad, 60);
      if (b.avatarColor && /^#[0-9a-fA-F]{6}$/.test(b.avatarColor)) user.avatarColor = b.avatarColor;
      if (b.notif && typeof b.notif === 'object') ['pedidos', 'promociones', 'comunidad'].forEach((k) => { if (k in b.notif) user.notif[k] = !!b.notif[k]; });
      auditar('actualización de datos', user, ctx.ip, 'exitoso', Object.keys(b).join(', '));
      return publicUser(user);
    }, { auth: true });

    ruta('PUT', '/auth/password', async (ctx, user) => {
      const b = ctx.body;
      // RS 05: operación crítica → exige sesión activa y la contraseña actual como validación adicional.
      if (!(await deps.verifyPassword(String(b.actual || ''), user.hash))) {
        auditar('cambio de contraseña', user, ctx.ip, 'fallido', 'Contraseña actual incorrecta');
        throw new ApiError(400, 'La contraseña actual no es correcta', { campos: { actual: 'Contraseña actual incorrecta' } });
      }
      const prob = problemasPassword(b.nueva);
      if (prob.length) throw new ApiError(400, 'La nueva contraseña necesita ' + prob.join(', '), { campos: { nueva: 'Necesita ' + prob.join(', ') } });
      user.hash = await deps.hashPassword(b.nueva);
      auditar('cambio de contraseña', user, ctx.ip, 'exitoso', '');
      return { mensaje: 'Contraseña actualizada' };
    }, { auth: true });

    // ---- Productos ----
    ruta('GET', '/products', (ctx) => {
      const q = ctx.query;
      let lista = db.products.filter((p) => p.activo);
      if (q.cat) lista = lista.filter((p) => p.cat === q.cat);
      if (q.oferta) lista = lista.filter((p) => p.precioAntes);
      if (q.q) {
        const t = norm(q.q).split(/\s+/).filter(Boolean);
        lista = lista.filter((p) => { const h = norm(p.nombre + ' ' + p.marca + ' ' + p.tipo + ' ' + p.cat + ' ' + p.desc); return t.every((w) => h.includes(w)); });
      }
      const facetas = {
        tipos: [...new Set(lista.map((p) => p.tipo))].sort(),
        marcas: [...new Set(lista.map((p) => p.marca))].sort(),
        tallas: lista.some((p) => p.tallas) ? ['S', 'M', 'L', 'XL'] : [],
        precioMin: lista.length ? Math.min(...lista.map((p) => p.precio)) : 0,
        precioMax: lista.length ? Math.max(...lista.map((p) => p.precio)) : 0
      };
      if (q.tipo) { const ts = String(q.tipo).split(','); lista = lista.filter((p) => ts.includes(p.tipo)); }
      if (q.marca) { const ms = String(q.marca).split(','); lista = lista.filter((p) => ms.includes(p.marca)); }
      if (q.talla) lista = lista.filter((p) => p.tallas && p.tallas[q.talla] > 0);
      if (q.min) lista = lista.filter((p) => p.precio >= +q.min);
      if (q.max) lista = lista.filter((p) => p.precio <= +q.max);
      if (q.disponible) lista = lista.filter((p) => stockTotal(p) > 0);
      let items = lista.map(publicProduct);
      const orden = q.orden || 'relevancia';
      const cmp = {
        'precio-asc': (a, b) => a.precio - b.precio,
        'precio-desc': (a, b) => b.precio - a.precio,
        'nuevos': (a, b) => (b.nuevo - a.nuevo) || (b.vendidos - a.vendidos),
        'vendidos': (a, b) => b.vendidos - a.vendidos,
        'rating': (a, b) => (b.rating - a.rating) || (b.resenas - a.resenas),
        'relevancia': (a, b) => ((b.stock > 0) - (a.stock > 0)) || (b.vendidos - a.vendidos)
      }[orden] || ((a, b) => b.vendidos - a.vendidos);
      items.sort(cmp);
      const total = items.length;
      const porPagina = Math.min(48, Math.max(1, parseInt(q.limite, 10) || 12));
      const pagina = Math.max(1, parseInt(q.pagina, 10) || 1);
      items = items.slice((pagina - 1) * porPagina, pagina * porPagina);
      return { items, total, pagina, paginas: Math.max(1, Math.ceil(total / porPagina)), facetas };
    });

    ruta('GET', '/products/suggest', (ctx) => {
      const t = norm(ctx.query.q);
      if (t.length < 2) return { sugerencias: [] };
      const cats = CATEGORIAS.filter((c) => norm(c.nombre).includes(t)).map((c) => ({ tipo: 'categoria', id: c.id, nombre: c.nombre }));
      const prods = db.products.filter((p) => p.activo && norm(p.nombre + ' ' + p.marca + ' ' + p.tipo).includes(t))
        .sort((a, b) => b.vendidos - a.vendidos)
        .map((p) => ({ tipo: 'producto', id: p.id, nombre: p.nombre, precio: p.precio, arte: p.arte, color: p.color }));
      return { sugerencias: cats.concat(prods).slice(0, 6) };
    });

    ruta('GET', '/products/:id', (ctx, user) => {
      const p = db.products.find((x) => x.id === ctx.params.id && x.activo);
      if (!p) throw new ApiError(404, 'Producto no encontrado');
      const rs = db.reviews.filter((r) => r.productoId === p.id);
      const dist = [5, 4, 3, 2, 1].map((n) => ({ estrellas: n, total: rs.filter((r) => r.rating === n).length }));
      // "Otros usuarios también compraron": coocurrencia real en los pedidos
      const conteo = {};
      db.orders.filter((o) => o.estado !== 'Cancelado' && o.lineas.some((l) => l.productoId === p.id))
        .forEach((o) => o.lineas.forEach((l) => { if (l.productoId !== p.id) conteo[l.productoId] = (conteo[l.productoId] || 0) + l.cantidad; }));
      const complemento = { maquinaria: 'accesorios', ropa: 'accesorios', suplementos: 'accesorios', accesorios: 'ropa' }[p.cat];
      let tambien = Object.keys(conteo).sort((a, b) => conteo[b] - conteo[a]).map((id) => db.products.find((x) => x.id === id && x.activo)).filter(Boolean);
      db.products.filter((x) => x.activo && x.cat === complemento && !tambien.includes(x)).sort((a, b) => b.vendidos - a.vendidos)
        .forEach((x) => { if (tambien.length < 4) tambien.push(x); });
      const relacionados = db.products.filter((x) => x.activo && x.cat === p.cat && x.id !== p.id).sort((a, b) => (b.tipo === p.tipo) - (a.tipo === p.tipo) || b.vendidos - a.vendidos);
      return {
        producto: publicProduct(p),
        resenas: rs.sort((a, b) => b.fecha - a.fecha).map((r) => Object.assign({}, r, { meParece: user ? (r.utilDe || []).includes(user.id) : false, utilDe: undefined, util: (r.utilDe || []).length })),
        distribucion: dist,
        tambienCompraron: tambien.slice(0, 4).map(publicProduct),
        relacionados: relacionados.slice(0, 8).map(publicProduct),
        miResena: user ? rs.find((r) => r.userId === user.id) || null : null
      };
    });

    ruta('POST', '/products/:id/reviews', (ctx, user) => {
      const p = db.products.find((x) => x.id === ctx.params.id && x.activo);
      if (!p) throw new ApiError(404, 'Producto no encontrado');
      const rating = parseInt(ctx.body.rating, 10);
      const comentario = texto(ctx.body.comentario, 400);
      if (!(rating >= 1 && rating <= 5)) throw new ApiError(400, 'Elige de 1 a 5 estrellas', { campos: { rating: 'Elige de 1 a 5 estrellas' } });
      if (comentario.length < 4) throw new ApiError(400, 'Escribe un comentario corto', { campos: { comentario: 'Escribe al menos unas palabras' } });
      if (PALABRAS_BLOQUEADAS.some((w) => norm(comentario).includes(norm(w)))) throw new ApiError(400, 'Tu reseña no cumple las normas de la comunidad (RN-E 2)');
      let r = db.reviews.find((x) => x.productoId === p.id && x.userId === user.id);
      const compro = db.orders.some((o) => o.userId === user.id && o.estado !== 'Cancelado' && o.lineas.some((l) => l.productoId === p.id));
      if (r) { r.rating = rating; r.comentario = comentario; r.fecha = ahora(); r.compraVerificada = compro; }
      else { r = { id: nuevoId('r', 'r'), productoId: p.id, userId: user.id, autor: user.nombre, rating, comentario, fecha: ahora(), utilDe: [], compraVerificada: compro }; db.reviews.push(r); }
      return { __creado: true, data: { mensaje: 'Gracias por tu reseña', rating: ratingDe(p.id) } };
    }, { auth: true });

    ruta('POST', '/products/:id/reviews/:rid/util', (ctx, user) => {
      const r = db.reviews.find((x) => x.id === ctx.params.rid && x.productoId === ctx.params.id);
      if (!r) throw new ApiError(404, 'Reseña no encontrada');
      r.utilDe = r.utilDe || [];
      const i = r.utilDe.indexOf(user.id);
      if (i >= 0) r.utilDe.splice(i, 1); else r.utilDe.push(user.id);
      return { util: r.utilDe.length, meParece: i < 0 };
    }, { auth: true });

    // ---- Carrito y pedidos ----
    ruta('POST', '/orders/quote', (ctx, user) => cotizar(ctx.body.items, { cupon: ctx.body.cupon, envio: ctx.body.envio }, user));
    ruta('POST', '/orders', (ctx, user) => ({ __creado: true, data: crearPedido(ctx, user) }), { auth: true });
    ruta('GET', '/orders', (ctx, user) => db.orders.filter((o) => o.userId === user.id).sort((a, b) => b.fecha - a.fecha).map(publicOrder), { auth: true });
    ruta('GET', '/orders/:id', (ctx, user) => {
      const o = db.orders.find((x) => x.id === ctx.params.id);
      if (!o || (o.userId !== user.id && user.rol !== 'admin')) throw new ApiError(404, 'Pedido no encontrado');
      return publicOrder(o);
    }, { auth: true });

    // ---- Planes Fit y suscripciones ----
    ruta('GET', '/fitness/planes', () => ({ planes: PLANES.map((p) => Object.assign({}, p, { precios: Object.keys(PERIODOS).reduce((a, k) => { a[k] = precioPlan(p, k); return a; }, {}) })), periodos: PERIODOS, objetivos: OBJETIVOS, experiencias: EXPERIENCIAS }));
    ruta('GET', '/fitness/suscripcion', (ctx, user) => ({ suscripcion: publicSub(subActiva(user.id)) }), { auth: true });

    ruta('POST', '/fitness/suscripcion', (ctx, user) => {
      const b = ctx.body;
      const plan = planPorId(b.planId);
      if (!plan) throw new ApiError(400, 'Elige un plan');
      if (!PERIODOS[b.periodo]) throw new ApiError(400, 'Elige un periodo de pago');
      if (subActiva(user.id)) throw new ApiError(409, 'Ya tienes una suscripción activa. Puedes cambiar de plan desde Mi cuenta.');
      const per = b.personalizacion || {};
      if (!OBJETIVOS[per.objetivo] || !EXPERIENCIAS[per.experiencia] || !DIAS_ENTRENO[per.frecuencia]) throw new ApiError(400, 'Completa la personalización del plan');
      validarPago(b.pago);
      const monto = precioPlan(plan, b.periodo);
      const cobro = procesarPago(b.pago, monto);
      if (!cobro.aprobado) {
        registrarPago('suscripcion', user, cobro, plan.id);
        auditar('suscripción', user, ctx.ip, 'rechazado', plan.nombre + ' · ' + cobro.detalle);
        throw new ApiError(402, cobro.mensaje, { pago: { detalle: cobro.detalle, pasarela: cobro.pasarela } });
      }
      const s = { id: nuevoId('s', 's'), userId: user.id, planId: plan.id, periodo: b.periodo, precio: monto, inicio: ahora(),
        proximoCobro: ahora() + PERIODOS[b.periodo].meses * 30 * DIA, renovacionAuto: true, estado: 'activa',
        metodo: cobro.detalle, token: cobro.token,
        personalizacion: { objetivo: per.objetivo, experiencia: per.experiencia, frecuencia: +per.frecuencia } };
      db.subs.push(s);
      registrarPago('suscripcion', user, cobro, s.id);
      auditar('suscripción', user, ctx.ip, 'aprobado', plan.nombre + ' ' + PERIODOS[b.periodo].nombre + ' · ' + cobro.detalle);
      return { __creado: true, data: { suscripcion: publicSub(s), pago: { detalle: cobro.detalle, referencia: cobro.referencia, pasarela: cobro.pasarela } } };
    }, { auth: true });

    ruta('PUT', '/fitness/suscripcion', (ctx, user) => {
      const s = subActiva(user.id);
      if (!s) throw new ApiError(404, 'No tienes una suscripción activa');
      const accion = ctx.body.accion;
      if (accion === 'cambiar') {
        const plan = planPorId(ctx.body.planId);
        if (!plan) throw new ApiError(400, 'Plan inválido');
        if (plan.id === s.planId) throw new ApiError(400, 'Ya estás en ese plan');
        const antes = planPorId(s.planId).nombre;
        s.planId = plan.id; s.precio = precioPlan(plan, s.periodo);
        auditar('cambio de plan', user, ctx.ip, 'exitoso', antes + ' → ' + plan.nombre);
      } else if (accion === 'cancelar') {
        s.renovacionAuto = false;
        auditar('cancelar renovación', user, ctx.ip, 'exitoso', planPorId(s.planId).nombre);
      } else if (accion === 'reactivar') {
        s.renovacionAuto = true;
        auditar('reactivar renovación', user, ctx.ip, 'exitoso', planPorId(s.planId).nombre);
      } else if (accion === 'personalizar') {
        const per = ctx.body.personalizacion || {};
        if (!OBJETIVOS[per.objetivo] || !EXPERIENCIAS[per.experiencia] || !DIAS_ENTRENO[per.frecuencia]) throw new ApiError(400, 'Personalización inválida');
        s.personalizacion = { objetivo: per.objetivo, experiencia: per.experiencia, frecuencia: +per.frecuencia };
      } else throw new ApiError(400, 'Acción no válida');
      return { suscripcion: publicSub(s) };
    }, { auth: true });

    ruta('GET', '/fitness/mi-plan', (ctx, user) => miPlan(user), { auth: true });

    ruta('POST', '/fitness/progreso', (ctx, user) => {
      const data = miPlan(user);
      const prog = db.progreso[user.id];
      const b = ctx.body;
      if (b.tipo === 'ejercicio') {
        const dia = data.rutina.find((d) => d.dow === +b.dow);
        if (!dia || !dia.ejercicios[+b.idx]) throw new ApiError(400, 'Ejercicio inválido');
        const k = data.semana + '|' + (+b.dow) + '|' + (+b.idx);
        if (b.hecho) prog.hechos[k] = ahora(); else delete prog.hechos[k];
      } else if (b.tipo === 'peso') {
        const v = Math.round(parseFloat(String(b.valor).replace(',', '.')) * 10) / 10;
        if (!(v >= 30 && v <= 300)) throw new ApiError(400, 'Escribe un peso entre 30 y 300 kg');
        const hoy = isoDia(ahora());
        const ult = prog.pesos[prog.pesos.length - 1];
        if (ult && isoDia(ult.fecha) === hoy) ult.valor = v; else prog.pesos.push({ fecha: ahora(), valor: v });
        if (prog.pesos.length > 52) prog.pesos.shift();
      } else throw new ApiError(400, 'Tipo de progreso inválido');
      return miPlan(user);
    }, { auth: true });

    // ---- Comunidad ----
    function publicPost(p, user) {
      return { id: p.id, autor: p.autor, autorId: p.userId, avatarColor: (usuarioPorId(p.userId) || {}).avatarColor || '#14213D', texto: p.texto, tipo: p.tipo, fondo: p.fondo,
        fecha: p.fecha, likes: p.likes.length, meGusta: user ? p.likes.includes(user.id) : false,
        puedeBorrar: !!user && (user.id === p.userId || user.rol === 'admin'), reportado: user ? p.reportes.includes(user.id) : false,
        comentarios: p.comentarios.map((c) => ({ id: c.id, autor: c.autor, texto: c.texto, fecha: c.fecha, likes: c.likes.length, meGusta: user ? c.likes.includes(user.id) : false })) };
    }
    function moderar(t) {
      if (PALABRAS_BLOQUEADAS.some((w) => norm(t).includes(norm(w)))) throw new ApiError(400, 'Tu mensaje no cumple las normas de la comunidad (RN-E 2)');
    }
    function postPorId(id) {
      const p = db.posts.find((x) => x.id === id && !x.oculto);
      if (!p) throw new ApiError(404, 'Publicación no encontrada');
      return p;
    }
    ruta('GET', '/community/posts', (ctx, user) => {
      return db.posts.filter((p) => !p.oculto).sort((a, b) => b.fecha - a.fecha).map((p) => publicPost(p, user));
    });
    ruta('POST', '/community/posts', (ctx, user) => {
      const t = texto(ctx.body.texto, 500);
      if (t.length < 3) throw new ApiError(400, 'Escribe algo para publicar', { campos: { texto: 'Escribe al menos 3 caracteres' } });
      moderar(t);
      const tipo = ['logro', 'tip', 'pregunta'].includes(ctx.body.tipo) ? ctx.body.tipo : 'logro';
      const fondo = ['llama', 'corona', 'hoja', 'pesa'].includes(ctx.body.fondo) ? ctx.body.fondo : null;
      const p = { id: nuevoId('c', 'c'), userId: user.id, autor: user.nombre, texto: t, tipo, fondo: tipo === 'logro' ? (fondo || 'llama') : null, fecha: ahora(), likes: [], comentarios: [], reportes: [], oculto: false };
      db.posts.push(p);
      return { __creado: true, data: publicPost(p, user) };
    }, { auth: true });
    ruta('DELETE', '/community/posts/:id', (ctx, user) => {
      const p = postPorId(ctx.params.id);
      if (p.userId !== user.id && user.rol !== 'admin') throw new ApiError(403, 'Solo puedes borrar tus publicaciones');
      db.posts = db.posts.filter((x) => x !== p);
      if (user.rol === 'admin' && p.userId !== user.id) auditar('moderación', user, ctx.ip, 'publicación eliminada', p.id + ' de ' + p.autor);
      return { ok: true };
    }, { auth: true });
    ruta('POST', '/community/posts/:id/like', (ctx, user) => {
      const p = postPorId(ctx.params.id);
      const i = p.likes.indexOf(user.id);
      if (i >= 0) p.likes.splice(i, 1); else p.likes.push(user.id);
      return publicPost(p, user);
    }, { auth: true });
    ruta('POST', '/community/posts/:id/comments', (ctx, user) => {
      const p = postPorId(ctx.params.id);
      const t = texto(ctx.body.texto, 300);
      if (t.length < 2) throw new ApiError(400, 'Escribe un comentario');
      moderar(t);
      p.comentarios.push({ id: nuevoId('k', 'c'), userId: user.id, autor: user.nombre, texto: t, fecha: ahora(), likes: [] });
      return publicPost(p, user);
    }, { auth: true });
    ruta('POST', '/community/posts/:id/comments/:cid/like', (ctx, user) => {
      const p = postPorId(ctx.params.id);
      const c = p.comentarios.find((x) => x.id === ctx.params.cid);
      if (!c) throw new ApiError(404, 'Comentario no encontrado');
      const i = c.likes.indexOf(user.id);
      if (i >= 0) c.likes.splice(i, 1); else c.likes.push(user.id);
      return publicPost(p, user);
    }, { auth: true });
    ruta('POST', '/community/posts/:id/report', (ctx, user) => {
      const p = postPorId(ctx.params.id);
      if (!p.reportes.includes(user.id)) p.reportes.push(user.id);
      if (p.reportes.length >= 3) { p.oculto = true; auditar('moderación', user, ctx.ip, 'publicación oculta', p.id + ' alcanzó 3 reportes'); }
      return { ok: true, oculto: p.oculto, mensaje: p.oculto ? 'La publicación quedó oculta para revisión' : 'Gracias, el equipo revisará el reporte' };
    }, { auth: true });

    function publicReto(r, user) {
      const yo = user ? r.participantes[user.id] : null;
      return { id: r.id, titulo: r.titulo, desc: r.desc, dias: r.dias, insignia: r.insignia, icono: r.icono, color: r.color,
        participantes: Object.keys(r.participantes).length, completados: Object.values(r.participantes).filter((x) => x.completado).length,
        yo: yo ? { avance: yo.avance, completado: yo.completado, hoyRegistrado: yo.ultimoDia === isoDia(ahora()) } : null };
    }
    ruta('GET', '/community/retos', (ctx, user) => {
      return db.retos.map((r) => publicReto(r, user));
    });
    ruta('POST', '/community/retos/:id/unirse', (ctx, user) => {
      const r = db.retos.find((x) => x.id === ctx.params.id);
      if (!r) throw new ApiError(404, 'Reto no encontrado');
      if (!r.participantes[user.id]) r.participantes[user.id] = { avance: 0, completado: false, ultimoDia: null };
      return publicReto(r, user);
    }, { auth: true });
    ruta('POST', '/community/retos/:id/avance', (ctx, user) => {
      const r = db.retos.find((x) => x.id === ctx.params.id);
      if (!r) throw new ApiError(404, 'Reto no encontrado');
      const yo = r.participantes[user.id];
      if (!yo) throw new ApiError(400, 'Primero únete al reto');
      if (yo.completado) throw new ApiError(400, 'Ya completaste este reto');
      const hoy = isoDia(ahora());
      if (yo.ultimoDia === hoy) throw new ApiError(409, 'Ya registraste el avance de hoy. Vuelve mañana.');
      yo.avance += 1; yo.ultimoDia = hoy;
      let insignia = null;
      if (yo.avance >= r.dias) {
        yo.completado = true; insignia = r.insignia;
        user.insignias = user.insignias || [];
        if (!user.insignias.some((x) => x.reto === r.id)) user.insignias.push({ reto: r.id, nombre: r.insignia, icono: r.icono, color: r.color, fecha: ahora() });
      }
      return Object.assign(publicReto(r, user), { insigniaGanada: insignia });
    }, { auth: true });

    ruta('GET', '/community/eventos', (ctx, user) => {
      return db.eventos.slice().sort((a, b) => a.fecha - b.fecha).map((e) => ({ id: e.id, titulo: e.titulo, tipo: e.tipo, fecha: e.fecha, duracion: e.duracion,
        anfitrion: e.anfitrion, cupos: e.cupos, inscritos: e.asistentes.length, premium: e.premium, asistire: user ? e.asistentes.includes(user.id) : false }));
    });
    ruta('POST', '/community/eventos/:id/asistir', (ctx, user) => {
      const e = db.eventos.find((x) => x.id === ctx.params.id);
      if (!e) throw new ApiError(404, 'Evento no encontrado');
      const i = e.asistentes.indexOf(user.id);
      if (i >= 0) { e.asistentes.splice(i, 1); return { asistire: false, inscritos: e.asistentes.length, mensaje: 'Cancelaste tu asistencia' }; }
      if (e.premium) { const s = subActiva(user.id); if (!s || s.planId !== 'elite') throw new ApiError(403, 'Este evento es exclusivo del plan Élite'); }
      if (e.asistentes.length >= e.cupos) throw new ApiError(409, 'No quedan cupos para este evento');
      e.asistentes.push(user.id);
      return { asistire: true, inscritos: e.asistentes.length, mensaje: '¡Listo! Te esperamos en ' + e.titulo };
    }, { auth: true });

    // ---- Soporte ----
    ruta('POST', '/soporte', (ctx, user) => {
      const asunto = texto(ctx.body.asunto, 100), descripcion = texto(ctx.body.descripcion, 1000);
      const e = {};
      if (asunto.length < 4) e.asunto = 'Escribe un asunto';
      if (descripcion.length < 10) e.descripcion = 'Cuéntanos un poco más (mínimo 10 caracteres)';
      if (Object.keys(e).length) throw new ApiError(400, 'Revisa el formulario', { campos: e });
      const t = { id: 'SOP-' + (++db.seq.t + 100), userId: user.id, asunto, descripcion, fecha: ahora(), estado: 'Abierto' };
      db.tickets.push(t);
      auditar('soporte', user, ctx.ip, 'ticket creado', t.id);
      return { __creado: true, data: { ticket: t, mensaje: 'Recibimos tu solicitud. Te respondemos en máximo 24 horas (RN-C 1).' } };
    }, { auth: true });

    // ---- Administración (RS 04) ----
    ruta('GET', '/admin/stats', () => {
      const pagos = db.payments.filter((p) => p.estado === 'aprobado');
      const dias = [];
      for (let i = 6; i >= 0; i--) {
        const ts = ahora() - i * DIA, d = isoDia(ts);
        const del = pagos.filter((p) => isoDia(p.fecha) === d);
        dias.push({ dia: d, etiqueta: DIAS_SEMANA[new Date(ts).getDay()].slice(0, 3), tienda: sum(del.filter((p) => p.tipo === 'pedido'), (p) => p.monto), suscripciones: sum(del.filter((p) => p.tipo === 'suscripcion'), (p) => p.monto) });
      }
      const vendidos = {};
      db.orders.filter((o) => o.estado !== 'Cancelado').forEach((o) => o.lineas.forEach((l) => { vendidos[l.productoId] = (vendidos[l.productoId] || 0) + l.cantidad; }));
      const top = Object.keys(vendidos).sort((a, b) => vendidos[b] - vendidos[a]).slice(0, 5).map((id) => { const p = db.products.find((x) => x.id === id); return { id, nombre: p ? p.nombre : id, unidades: vendidos[id], arte: p && p.arte, color: p && p.color }; });
      const porCategoria = CATEGORIAS.map((c) => ({ id: c.id, nombre: c.nombre, total: sum(db.orders.filter((o) => o.estado !== 'Cancelado'), (o) => sum(o.lineas.filter((l) => { const p = db.products.find((x) => x.id === l.productoId); return p && p.cat === c.id; }), (l) => l.total)) }));
      const stockBajo = db.products.filter((p) => p.activo).map((p) => ({ id: p.id, nombre: p.nombre, stock: stockTotal(p), tallasAgotadas: p.tallas ? Object.keys(p.tallas).filter((t) => p.tallas[t] === 0) : [] }))
        .filter((p) => p.stock <= 3 || p.tallasAgotadas.length).sort((a, b) => a.stock - b.stock);
      const activas = db.subs.filter((s) => s.estado === 'activa');
      return {
        ventasTotales: sum(pagos, (p) => p.monto), ventasTienda: sum(pagos.filter((p) => p.tipo === 'pedido'), (p) => p.monto),
        ventasSuscripciones: sum(pagos.filter((p) => p.tipo === 'suscripcion'), (p) => p.monto),
        pedidos: db.orders.length, pedidosPendientes: db.orders.filter((o) => o.estado === 'Pagado' || o.estado === 'En preparación').length,
        usuarios: db.users.filter((u) => u.rol === 'cliente').length, usuariosNuevos: db.users.filter((u) => u.rol === 'cliente' && ahora() - u.creado < 30 * DIA).length,
        suscripcionesActivas: activas.length, porPlan: PLANES.map((p) => ({ id: p.id, nombre: p.nombre, color: p.color, total: activas.filter((s) => s.planId === p.id).length })),
        ultimos7: dias, top, porCategoria, stockBajo,
        pagosRechazados: db.payments.filter((p) => p.estado === 'rechazado').length
      };
    }, { roles: ['admin'] });

    ruta('GET', '/admin/products', () => db.products.slice().sort((a, b) => a.cat.localeCompare(b.cat) || a.nombre.localeCompare(b.nombre)).map(publicProduct), { roles: ['admin'] });

    function datosProducto(b, existente) {
      const e = {};
      const nombre = texto(b.nombre, 80);
      if (nombre.length < 3) e.nombre = 'Nombre demasiado corto';
      if (!CATEGORIAS.some((c) => c.id === b.cat)) e.cat = 'Elige una categoría';
      const precio = parseInt(String(b.precio).replace(/\D/g, ''), 10);
      if (!(precio >= 1000)) e.precio = 'Precio mínimo $1.000';
      const precioAntes = b.precioAntes ? parseInt(String(b.precioAntes).replace(/\D/g, ''), 10) : null;
      if (precioAntes && precioAntes <= precio) e.precioAntes = 'El precio anterior debe ser mayor al actual';
      if (texto(b.tipo).length < 2) e.tipo = 'Escribe el tipo (ej. cardio, proteína)';
      if (texto(b.marca).length < 2) e.marca = 'Escribe la marca';
      if (texto(b.desc, 600).length < 10) e.desc = 'Escribe una descripción (mínimo 10 caracteres)';
      let tallas = null, stock = parseInt(b.stock, 10);
      if (b.cat === 'ropa') {
        tallas = {};
        ['S', 'M', 'L', 'XL'].forEach((t) => { const v = parseInt((b.tallas || {})[t], 10); tallas[t] = v >= 0 ? v : 0; });
        stock = sum(Object.values(tallas));
      } else if (!(stock >= 0)) e.stock = 'Stock inválido';
      if (Object.keys(e).length) throw new ApiError(400, 'Revisa el formulario del producto', { campos: e });
      const datos = { nombre, cat: b.cat, tipo: texto(b.tipo, 40).toLowerCase(), marca: texto(b.marca, 40), precio, precioAntes: precioAntes || null,
        desc: texto(b.desc, 600), arte: ARTES.includes(b.arte) ? b.arte : (existente ? existente.arte : 'tarro'),
        color: /^#[0-9a-fA-F]{6}$/.test(b.color || '') ? b.color : (existente ? existente.color : '#E8743B') };
      if (tallas) { datos.tallas = tallas; datos.stock = stock; } else { datos.stock = stock; }
      return datos;
    }
    ruta('POST', '/admin/products', (ctx, user) => {
      const d = datosProducto(ctx.body);
      const p = Object.assign({ id: 'p' + (++db.seq.p), specs: {}, vendidos: 0, creado: ahora(), activo: true }, d);
      if (p.cat === 'suplementos') p.presentaciones = [{ id: 'unica', etiqueta: 'Presentación única', precio: p.precio }];
      db.products.push(p);
      auditar('producto creado', user, ctx.ip, 'exitoso', p.nombre);
      return { __creado: true, data: publicProduct(p) };
    }, { roles: ['admin'] });
    ruta('PUT', '/admin/products/:id', (ctx, user) => {
      const p = db.products.find((x) => x.id === ctx.params.id);
      if (!p) throw new ApiError(404, 'Producto no encontrado');
      const d = datosProducto(Object.assign({}, p, ctx.body), p);
      if (p.presentaciones && d.precio !== p.precio) {
        const f = d.precio / p.presentaciones[0].precio;
        p.presentaciones.forEach((x) => { x.precio = round(x.precio * f / 100) * 100; });
        d.precio = p.presentaciones[0].precio;
      }
      if (!d.tallas) delete p.tallas;
      Object.assign(p, d);
      if (ctx.body.activo !== undefined) p.activo = !!ctx.body.activo;
      auditar('producto editado', user, ctx.ip, 'exitoso', p.nombre);
      return publicProduct(p);
    }, { roles: ['admin'] });
    ruta('DELETE', '/admin/products/:id', (ctx, user) => {
      const p = db.products.find((x) => x.id === ctx.params.id);
      if (!p) throw new ApiError(404, 'Producto no encontrado');
      p.activo = false; // borrado lógico: los pedidos antiguos conservan su referencia
      auditar('producto eliminado', user, ctx.ip, 'exitoso', p.nombre);
      return { ok: true };
    }, { roles: ['admin'] });

    ruta('GET', '/admin/orders', () => db.orders.slice().sort((a, b) => b.fecha - a.fecha).map(publicOrder), { roles: ['admin'] });
    ruta('PUT', '/admin/orders/:id', (ctx, user) => {
      const o = db.orders.find((x) => x.id === ctx.params.id);
      if (!o) throw new ApiError(404, 'Pedido no encontrado');
      if (!ESTADOS_PEDIDO.includes(ctx.body.estado)) throw new ApiError(400, 'Estado inválido');
      o.estado = ctx.body.estado; o.historial.push({ estado: o.estado, fecha: ahora() });
      auditar('estado de pedido', user, ctx.ip, 'exitoso', o.id + ' → ' + o.estado);
      return publicOrder(o);
    }, { roles: ['admin'] });

    ruta('GET', '/admin/users', () => db.users.map((u) => Object.assign(publicUser(u), {
      pedidos: db.orders.filter((o) => o.userId === u.id).length,
      gastado: sum(db.payments.filter((p) => p.userId === u.id && p.estado === 'aprobado'), (p) => p.monto)
    })), { roles: ['admin'] });
    ruta('PUT', '/admin/users/:id', (ctx, user) => {
      const u = usuarioPorId(ctx.params.id);
      if (!u) throw new ApiError(404, 'Usuario no encontrado');
      if (u.id === user.id) throw new ApiError(400, 'No puedes modificar tu propia cuenta desde aquí');
      const b = ctx.body;
      if (b.estado !== undefined) {
        if (!['activo', 'suspendido'].includes(b.estado)) throw new ApiError(400, 'Estado inválido');
        u.estado = b.estado; auditar(b.estado === 'activo' ? 'cuenta reactivada' : 'cuenta suspendida', user, ctx.ip, 'exitoso', u.email);
      }
      if (b.rol !== undefined) {
        if (!['cliente', 'admin', 'tecnico'].includes(b.rol)) throw new ApiError(400, 'Rol inválido');
        const antes = u.rol; u.rol = b.rol; auditar('cambio de rol', user, ctx.ip, 'exitoso', u.email + ': ' + antes + ' → ' + b.rol);
      }
      return publicUser(u);
    }, { roles: ['admin'] });

    function listaPagos() {
      return db.payments.slice().sort((a, b) => b.fecha - a.fecha).map((p) => {
        const u = usuarioPorId(p.userId) || {};
        return { id: p.id, fecha: p.fecha, tipo: p.tipo, refId: p.refId, usuario: u.nombre || '—', correo: u.email || '', monto: p.monto,
          metodo: p.detalle, pasarela: p.pasarela, referencia: p.referencia, token: p.token ? p.token.slice(0, 16) + '…' : '—', estado: p.estado };
      });
    }
    ruta('GET', '/admin/pagos', () => listaPagos(), { roles: ['admin'] });
    ruta('GET', '/admin/pagos/export', (ctx, user) => {
      const filas = [['Fecha', 'Tipo', 'Referencia FITOPÍA', 'Cliente', 'Correo', 'Método', 'Pasarela', 'Referencia pasarela', 'Monto (COP)', 'Estado']];
      listaPagos().forEach((p) => filas.push([new Date(p.fecha).toLocaleString('es-CO'), p.tipo === 'pedido' ? 'Pedido' : 'Suscripción', p.refId, p.usuario, p.correo, p.metodo, p.pasarela, p.referencia, p.monto, p.estado]));
      const csv = '﻿' + filas.map((f) => f.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(';')).join('\r\n');
      auditar('exportar reporte', user, ctx.ip, 'exitoso', 'Pagos y suscripciones (' + (filas.length - 1) + ' registros)');
      return { __raw: true, status: 200, body: csv, headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="pagos-fitopia.csv"' } };
    }, { roles: ['admin'] });

    ruta('GET', '/admin/auditoria', async () => {
      const lista = store.readAudit ? await store.readAudit(300) : db.audit.slice(0, 300);
      return lista;
    }, { roles: ['admin', 'tecnico'] });
    ruta('GET', '/admin/sistema', () => ({
      modo: deps.modo, motor: deps.motor, version: VERSION, almacenamiento: deps.almacenamiento, auditoria: deps.auditoriaDestino,
      activoDesde: inicio, registros: { usuarios: db.users.length, productos: db.products.length, pedidos: db.orders.length, pagos: db.payments.length,
        suscripciones: db.subs.length, publicaciones: db.posts.length, reseñas: db.reviews.length, tickets: db.tickets.length },
      tickets: db.tickets.slice().sort((a, b) => b.fecha - a.fecha).slice(0, 20).map((t) => Object.assign({}, t, { usuario: (usuarioPorId(t.userId) || {}).email }))
    }), { roles: ['admin', 'tecnico'] });

    // =============== datos de ejemplo ===============
    async function sembrar() {
      const now = ahora();
      db = { version: DB_VERSION, creado: now, seq: { u: 0, o: 1040, c: 0, r: 0, t: 0, s: 0, pay: 0, p: 100 }, users: [], products: [], reviews: [], orders: [],
        payments: [], subs: [], progreso: {}, posts: [], retos: [], eventos: [], tickets: [], audit: [], intentos: {} };
      const R = rng(2026);
      const colores = ['#E8743B', '#1D9E75', '#378ADD', '#7F77DD', '#D4537E', '#14213D'];
      const crear = async (nombre, email, rol, pw, extra) => {
        const u = Object.assign({ id: nuevoId('u', 'u'), nombre, email, rol, estado: 'activo', hash: await deps.hashPassword(pw), creado: now - Math.floor(10 + R() * 120) * DIA,
          telefono: '', direccion: '', ciudad: 'Manizales', avatarColor: colores[db.users.length % colores.length], insignias: [],
          notif: { pedidos: true, promociones: true, comunidad: true } }, extra || {});
        db.users.push(u); return u;
      };
      await crear('Admin FITOPÍA', 'admin@fitopia.co', 'admin', 'Admin123*', { avatarColor: '#14213D' });
      await crear('Soporte Técnico', 'tecnico@fitopia.co', 'tecnico', 'Tecnico123*', { avatarColor: '#5F5E5A' });
      const miguel = await crear('Miguel Pava', 'cliente@fitopia.co', 'cliente', 'Cliente123*', { telefono: '3001234567', direccion: 'Cra. 23 # 65-10, barrio Palermo', ciudad: 'Manizales', avatarColor: '#E8743B' });
      const otros = [];
      for (const [n, e] of [['Laura Gómez', 'laura@correo.co'], ['Andrés Rincón', 'andres@correo.co'], ['Valentina Ruiz', 'valentina@correo.co'], ['Camilo Torres', 'camilo@correo.co'], ['Sofía Marín', 'sofia@correo.co']]) {
        otros.push(await crear(n, e, 'cliente', 'Cliente123*', { telefono: '31' + String(10000000 + Math.floor(R() * 89999999)), direccion: 'Calle ' + (10 + Math.floor(R() * 80)) + ' # ' + (5 + Math.floor(R() * 40)) + '-' + (10 + Math.floor(R() * 80)), ciudad: ['Manizales', 'Pereira', 'Bogotá', 'Medellín', 'Cali'][otros.length] }));
      }
      const [laura, andres, valentina, camilo, sofia] = otros;

      const P = (id, nombre, cat, tipo, marca, precio, precioAntes, stock, arte, color, desc, specs, extra) => {
        db.products.push(Object.assign({ id, nombre, cat, tipo, marca, precio, precioAntes, stock, arte, color, desc, specs, vendidos: 0,
          creado: now - Math.floor(25 + R() * 150) * DIA, activo: true }, extra || {}));
      };
      const nuevo = (d) => ({ creado: now - d * DIA });
      // Maquinaria
      P('caminadora-t500', 'Caminadora plegable T-500', 'maquinaria', 'cardio', 'IronCore', 2890000, 3290000, 6, 'caminadora', '#E8743B',
        'Caminadora plegable con motor de 3 HP, 12 programas de entrenamiento y banda amortiguada que cuida tus rodillas. Se pliega en segundos para ahorrar espacio.',
        { 'Motor': '3 HP continuo', 'Velocidad': '1 a 16 km/h', 'Inclinación': '12 niveles', 'Peso máximo de usuario': '130 kg', 'Dimensiones': '170 × 75 × 135 cm', 'Peso del equipo': '68 kg', 'Garantía': '2 años' });
      P('spin-pro', 'Bicicleta estática Spin Pro', 'maquinaria', 'cardio', 'IronCore', 1450000, null, 9, 'bicicleta', '#E24B4A',
        'Bicicleta de spinning con volante de inercia de 18 kg, resistencia magnética silenciosa y monitor de pulso, distancia y calorías.',
        { 'Volante de inercia': '18 kg', 'Resistencia': 'Magnética, 32 niveles', 'Peso máximo de usuario': '120 kg', 'Dimensiones': '110 × 55 × 120 cm', 'Peso del equipo': '42 kg', 'Garantía': '1 año' }, nuevo(6));
      P('banco-ajustable', 'Banco multiposición ajustable', 'maquinaria', 'fuerza', 'FitPro', 690000, null, 14, 'banco', '#378ADD',
        'Banco con respaldo de 7 posiciones (declinado a 90°) y asiento ajustable. Tapizado antideslizante y estructura de acero reforzado.',
        { 'Posiciones del respaldo': '7', 'Peso máximo': '300 kg', 'Dimensiones': '130 × 60 × 45 cm', 'Peso del equipo': '19 kg', 'Garantía': '2 años' });
      P('rack-power', 'Rack de sentadillas Power', 'maquinaria', 'fuerza', 'IronCore', 2350000, null, 3, 'rack', '#E8743B',
        'Rack de potencia con barras de seguridad, barra de dominadas y soportes regulables. Ideal para sentadilla, press de banca y peso muerto.',
        { 'Peso máximo': '350 kg', 'Altura': '215 cm', 'Dimensiones de la base': '140 × 120 cm', 'Material': 'Acero calibre 11', 'Garantía': '5 años' });
      P('mancuernas-24', 'Mancuernas ajustables 24 kg (par)', 'maquinaria', 'fuerza', 'FitPro', 890000, 990000, 11, 'mancuernas', '#14213D',
        'Par de mancuernas que reemplaza 15 pares: ajusta de 2,5 a 24 kg con un giro del selector. Incluye bases de almacenamiento.',
        { 'Rango de peso': '2,5 a 24 kg por mancuerna', 'Incrementos': '15 niveles', 'Dimensiones': '40 × 20 × 23 cm', 'Garantía': '2 años' });
      P('home-gym-x9', 'Estación multifuncional Home Gym X9', 'maquinaria', 'multifuncional', 'IronCore', 4200000, null, 2, 'homegym', '#1D9E75',
        'Estación con torre de poleas, press de pecho, polea alta y baja, y extensión de piernas. Más de 40 ejercicios en una sola máquina.',
        { 'Pila de pesas': '90 kg', 'Ejercicios': 'Más de 40', 'Dimensiones': '200 × 110 × 210 cm', 'Peso del equipo': '160 kg', 'Garantía': '3 años' }, nuevo(3));
      P('kettlebell-16', 'Kettlebell de hierro fundido 16 kg', 'maquinaria', 'fuerza', 'FitPro', 185000, null, 25, 'kettlebell', '#14213D',
        'Kettlebell de una sola pieza con agarre texturizado y base plana. Perfecta para swings, sentadillas goblet y entrenamiento funcional.',
        { 'Peso': '16 kg', 'Material': 'Hierro fundido con pintura en polvo', 'Diámetro': '21 cm', 'Garantía': '5 años' });
      // Ropa
      P('camiseta-dryfit', 'Camiseta Dry-Fit Pro', 'ropa', 'camisetas', 'Bodyline', 79900, null, 0, 'camiseta', '#E8743B',
        'Camiseta de secado rápido con tejido transpirable y costuras planas que no rozan. Hecha para entrenamientos intensos.',
        { 'Material': '88% poliéster, 12% elastano', 'Ajuste': 'Regular', 'Cuidado': 'Lavar en frío, no planchar' }, { tallas: { S: 6, M: 10, L: 8, XL: 0 } });
      P('leggins-compresion', 'Leggins de compresión High-Rise', 'ropa', 'leggins', 'Bodyline', 119900, 139900, 0, 'leggins', '#7F77DD',
        'Leggins de tiro alto con compresión media y tela opaca que no se transparenta en sentadillas. Bolsillo lateral para el celular.',
        { 'Material': '75% nylon, 25% spandex', 'Compresión': 'Media', 'Tiro': 'Alto', 'Bolsillos': '2 laterales' }, { tallas: { S: 5, M: 7, L: 4, XL: 2 } });
      P('short-2en1', 'Short de entrenamiento 2 en 1', 'ropa', 'shorts', 'FITOPÍA', 89900, null, 0, 'short', '#14213D',
        'Short con licra interna y bolsillo con cremallera. Ligero, elástico y perfecto para correr o entrenar fuerza.',
        { 'Material': '100% poliéster reciclado', 'Largo': '7 pulgadas', 'Forro': 'Licra interna' }, { tallas: { S: 4, M: 9, L: 6, XL: 5 } });
      P('hoodie-fitopia', 'Buzo hoodie FITOPÍA', 'ropa', 'buzos', 'FITOPÍA', 149900, null, 0, 'buzo', '#5F5E5A',
        'Buzo con capota en algodón perchado, puños elásticos y bolsillo canguro. El favorito para antes y después del gimnasio.',
        { 'Material': '80% algodón, 20% poliéster', 'Ajuste': 'Relajado', 'Detalles': 'Logo bordado' }, Object.assign({ tallas: { S: 3, M: 5, L: 5, XL: 3 } }, nuevo(9)));
      P('top-soporte', 'Top deportivo soporte medio', 'ropa', 'tops', 'Bodyline', 69900, null, 0, 'top', '#D4537E',
        'Top con soporte medio, copas removibles y espalda cruzada para mayor libertad de movimiento.',
        { 'Material': '82% poliamida, 18% elastano', 'Soporte': 'Medio', 'Copas': 'Removibles' }, { tallas: { S: 6, M: 6, L: 3, XL: 0 } });
      P('camiseta-oversize', 'Camiseta oversize algodón', 'ropa', 'camisetas', 'FITOPÍA', 64900, 74900, 0, 'camiseta', '#1D9E75',
        'Camiseta de corte amplio en algodón peinado de alto gramaje. Cómoda para entrenar o para el día a día.',
        { 'Material': '100% algodón peinado', 'Ajuste': 'Oversize', 'Gramaje': '220 g/m²' }, { tallas: { S: 8, M: 12, L: 10, XL: 6 } });
      // Suplementos
      const pres = (lista) => ({ presentaciones: lista.map(([id, etiqueta, precio]) => ({ id, etiqueta, precio })) });
      P('whey-isolate', 'Proteína Whey Isolate vainilla', 'suplementos', 'proteína', 'NutriMax', 89900, null, 40, 'tarro', '#E8743B',
        'Proteína aislada de suero con 27 g de proteína por porción, baja en grasa y sin azúcar añadida. Se disuelve fácil y sin grumos.',
        { 'Porción': '30 g', 'Proteína': '27 g', 'Calorías': '110 kcal', 'Carbohidratos': '1 g', 'Grasas': '0,5 g', 'Sabor': 'Vainilla' }, pres([['500g', '500 g', 89900], ['1kg', '1 kg', 159900], ['2kg', '2 kg', 289900]]));
      P('creatina-mono', 'Creatina monohidratada micronizada', 'suplementos', 'creatina', 'NutriMax', 59900, null, 55, 'tarro', '#378ADD',
        'Creatina 100% pura micronizada para mejorar fuerza y potencia. Sin sabor: mézclala con tu bebida favorita.',
        { 'Porción': '5 g', 'Creatina monohidratada': '5 g', 'Calorías': '0 kcal', 'Sabor': 'Sin sabor' }, pres([['250g', '250 g', 59900], ['500g', '500 g', 99900], ['1kg', '1 kg', 179900]]));
      P('multi-daily', 'Multivitamínico Daily', 'suplementos', 'vitaminas', 'VitaPlus', 49900, null, 60, 'frasco', '#1D9E75',
        'Fórmula con 23 vitaminas y minerales para apoyar tu energía e inmunidad en días de entrenamiento.',
        { 'Porción': '1 cápsula', 'Vitamina C': '500 mg', 'Vitamina D3': '1000 UI', 'Zinc': '15 mg', 'Magnesio': '100 mg' }, pres([['60caps', '60 cápsulas', 49900], ['120caps', '120 cápsulas', 89900]]));
      P('pre-explosive', 'Pre-entreno Explosive frutos rojos', 'suplementos', 'pre-entreno', 'NutriMax', 109900, 124900, 18, 'tarro', '#E24B4A',
        'Pre-entreno con cafeína, beta-alanina y citrulina para más energía y bombeo. Sabor frutos rojos.',
        { 'Porción': '10 g', 'Cafeína': '200 mg', 'Beta-alanina': '3,2 g', 'Citrulina': '6 g', 'Sabor': 'Frutos rojos' }, Object.assign(pres([['300g', '300 g', 109900], ['600g', '600 g', 189900]]), nuevo(5)));
      P('bcaa-recovery', 'BCAA Recovery 2:1:1 limón', 'suplementos', 'aminoácidos', 'VitaPlus', 69900, null, 26, 'tarro', '#EF9F27',
        'Aminoácidos de cadena ramificada en proporción 2:1:1 con electrolitos para recuperarte mejor después de entrenar.',
        { 'Porción': '7 g', 'Leucina': '2,5 g', 'Isoleucina': '1,25 g', 'Valina': '1,25 g', 'Sabor': 'Limón' }, pres([['250g', '250 g', 69900], ['500g', '500 g', 119900]]));
      P('proteina-vegana', 'Proteína vegana chocolate', 'suplementos', 'proteína', 'GreenFit', 99900, null, 14, 'tarro', '#7F77DD',
        'Mezcla de proteína de arveja y arroz con 24 g de proteína por porción. Sin lactosa, sin gluten y con sabor a chocolate.',
        { 'Porción': '33 g', 'Proteína': '24 g', 'Calorías': '130 kcal', 'Fibra': '2 g', 'Sabor': 'Chocolate' }, pres([['500g', '500 g', 99900], ['1kg', '1 kg', 179900]]));
      // Accesorios
      P('bandas-x5', 'Kit de bandas de resistencia ×5', 'accesorios', 'bandas', 'FitPro', 69900, null, 30, 'bandas', '#1D9E75',
        'Cinco bandas de látex natural con distintas resistencias, de extra suave a extra fuerte. Incluye bolsa de transporte.',
        { 'Resistencias': '5 a 40 kg', 'Material': 'Látex natural', 'Incluye': 'Bolsa y guía de ejercicios' });
      P('termo-1l', 'Termo de acero inoxidable 1 L', 'accesorios', 'termos', 'FITOPÍA', 54900, null, 40, 'termo', '#378ADD',
        'Termo de doble pared que mantiene tus bebidas frías por 24 horas. Tapa con boquilla antiderrame.',
        { 'Capacidad': '1 L', 'Material': 'Acero inoxidable 18/8', 'Frío': '24 horas', 'Caliente': '12 horas' }, nuevo(11));
      P('guantes-grip', 'Guantes de entrenamiento Grip', 'accesorios', 'guantes', 'Bodyline', 49900, 59900, 18, 'guantes', '#14213D',
        'Guantes con palma acolchada y muñequera ajustable para proteger tus manos en el levantamiento de pesas.',
        { 'Material': 'Cuero sintético y malla', 'Muñequera': 'Ajustable con velcro', 'Tallas': 'Única ajustable' });
      P('colchoneta-tpe', 'Colchoneta de yoga TPE 6 mm', 'accesorios', 'colchonetas', 'FitPro', 89900, null, 22, 'colchoneta', '#7F77DD',
        'Colchoneta antideslizante de doble cara, liviana y fácil de limpiar. Ideal para yoga, pilates y estiramientos.',
        { 'Grosor': '6 mm', 'Medidas': '183 × 61 cm', 'Material': 'TPE ecológico', 'Peso': '0,9 kg' });
      P('cuerda-speed', 'Cuerda de saltar Speed', 'accesorios', 'cuerdas', 'FitPro', 39900, null, 35, 'cuerda', '#E8743B',
        'Cuerda de acero recubierto con rodamientos para giros rápidos. Longitud ajustable.',
        { 'Cable': 'Acero recubierto de PVC', 'Longitud': 'Ajustable hasta 3 m', 'Mangos': 'Aluminio con rodamientos' });
      P('foam-roller', 'Rodillo de espuma Foam Roller', 'accesorios', 'recuperación', 'Bodyline', 74900, null, 0, 'rodillo', '#E24B4A',
        'Rodillo de espuma de alta densidad con textura para masaje miofascial y recuperación muscular.',
        { 'Medidas': '33 × 14 cm', 'Densidad': 'Alta', 'Peso máximo': '150 kg' });
      db.products.forEach((p) => { if (p.tallas) p.stock = sum(Object.values(p.tallas)); });

      // Suscripciones de ejemplo
      const suscribir = (u, planId, periodo, diasAtras, per) => {
        const plan = planPorId(planId), monto = precioPlan(plan, periodo), fecha = now - diasAtras * DIA;
        const s = { id: nuevoId('s', 's'), userId: u.id, planId, periodo, precio: monto, inicio: fecha, proximoCobro: fecha + PERIODOS[periodo].meses * 30 * DIA,
          renovacionAuto: true, estado: 'activa', metodo: 'Visa •••• 4242', token: 'tok_sandbox_' + deps.randomHex(8), personalizacion: per };
        db.subs.push(s);
        db.payments.push({ id: nuevoId('pay', 'pay'), tipo: 'suscripcion', refId: s.id, userId: u.id, monto, metodo: 'tarjeta', pasarela: 'Wompi', detalle: 'Visa •••• 4242',
          referencia: 'WMP-' + deps.randomHex(3).toUpperCase() + String(fecha).slice(-5), token: s.token, estado: 'aprobado', fecha });
      };
      suscribir(miguel, 'avanzado', 'mensual', 18, { objetivo: 'ganar-musculo', experiencia: 'intermedio', frecuencia: 4 });
      suscribir(laura, 'elite', 'trimestral', 40, { objetivo: 'resistencia', experiencia: 'avanzado', frecuencia: 5 });
      suscribir(andres, 'basico', 'mensual', 5, { objetivo: 'perder-peso', experiencia: 'principiante', frecuencia: 3 });
      suscribir(valentina, 'avanzado', 'semestral', 2, { objetivo: 'perder-peso', experiencia: 'intermedio', frecuencia: 4 });

      // Pedidos de ejemplo (se calculan con la misma cotización real)
      const pedido = (u, items, diasAtras, estado, metodo) => {
        const q = cotizar(items, { envio: 'estandar' }, u);
        const fecha = now - diasAtras * DIA - Math.floor(R() * 8) * 3600000;
        const o = { id: 'FTP-' + (++db.seq.o), userId: u.id, fecha, estado,
          lineas: q.lineas.map((l) => ({ productoId: l.productoId, nombre: l.nombre, arte: l.arte, color: l.color, variante: l.variante, talla: l.talla, presentacion: l.presentacion, precio: l.precio, cantidad: l.cantidad, total: l.total })),
          subtotal: q.subtotal, descSuscriptor: q.descSuscriptor, descCupon: 0, cupon: null,
          envio: { id: 'estandar', nombre: 'Estándar', precio: q.envio.precio, llegaDesde: sumarDiasHabiles(fecha, 3), llegaHasta: sumarDiasHabiles(fecha, 5) },
          total: q.total, ivaIncluido: q.ivaIncluido,
          direccion: { nombre: u.nombre, direccion: u.direccion, ciudad: u.ciudad, telefono: u.telefono || '3000000000', notas: '' },
          pago: { pasarela: metodo === 'paypal' ? 'PayPal' : 'Wompi', metodo, detalle: { tarjeta: 'Visa •••• 4242', nequi: 'Nequi •••• 4567', pse: 'PSE · Bancolombia', paypal: 'PayPal · ' + enmascararCorreo(u.email) }[metodo],
            referencia: (metodo === 'paypal' ? 'PP-' : 'WMP-') + deps.randomHex(3).toUpperCase() + String(fecha).slice(-5), token: 'tok_sandbox_' + deps.randomHex(8) },
          historial: [{ estado: 'Pagado', fecha }] };
        if (estado !== 'Pagado') o.historial.push({ estado, fecha: fecha + DIA });
        db.orders.push(o);
        db.payments.push({ id: nuevoId('pay', 'pay'), tipo: 'pedido', refId: o.id, userId: u.id, monto: o.total, metodo, pasarela: o.pago.pasarela, detalle: o.pago.detalle,
          referencia: o.pago.referencia, token: o.pago.token, estado: 'aprobado', fecha });
        q.lineas.forEach((l) => { db.products.find((p) => p.id === l.productoId).vendidos += l.cantidad; });
      };
      pedido(miguel, [{ productoId: 'whey-isolate', cantidad: 1, presentacion: '1kg' }, { productoId: 'creatina-mono', cantidad: 1, presentacion: '500g' }, { productoId: 'termo-1l', cantidad: 1 }], 12, 'Entregado', 'nequi');
      pedido(miguel, [{ productoId: 'mancuernas-24', cantidad: 1 }, { productoId: 'guantes-grip', cantidad: 1 }], 4, 'Enviado', 'tarjeta');
      pedido(laura, [{ productoId: 'leggins-compresion', cantidad: 2, talla: 'S' }, { productoId: 'top-soporte', cantidad: 1, talla: 'S' }, { productoId: 'colchoneta-tpe', cantidad: 1 }], 9, 'Entregado', 'paypal');
      pedido(andres, [{ productoId: 'caminadora-t500', cantidad: 1 }, { productoId: 'termo-1l', cantidad: 1 }], 8, 'Entregado', 'pse');
      pedido(valentina, [{ productoId: 'proteina-vegana', cantidad: 2, presentacion: '1kg' }, { productoId: 'bandas-x5', cantidad: 1 }], 6, 'Enviado', 'tarjeta');
      pedido(camilo, [{ productoId: 'rack-power', cantidad: 1 }, { productoId: 'creatina-mono', cantidad: 1, presentacion: '1kg' }], 5, 'En preparación', 'pse');
      pedido(sofia, [{ productoId: 'camiseta-dryfit', cantidad: 2, talla: 'M' }, { productoId: 'short-2en1', cantidad: 1, talla: 'M' }], 4, 'Enviado', 'nequi');
      pedido(laura, [{ productoId: 'whey-isolate', cantidad: 1, presentacion: '2kg' }, { productoId: 'creatina-mono', cantidad: 1, presentacion: '250g' }], 3, 'Pagado', 'tarjeta');
      pedido(camilo, [{ productoId: 'kettlebell-16', cantidad: 2 }, { productoId: 'cuerda-speed', cantidad: 1 }, { productoId: 'guantes-grip', cantidad: 1 }], 2, 'Pagado', 'tarjeta');
      pedido(andres, [{ productoId: 'spin-pro', cantidad: 1 }, { productoId: 'bandas-x5', cantidad: 1 }], 1, 'En preparación', 'nequi');
      pedido(sofia, [{ productoId: 'hoodie-fitopia', cantidad: 1, talla: 'S' }, { productoId: 'multi-daily', cantidad: 1, presentacion: '120caps' }], 1, 'Pagado', 'paypal');
      pedido(valentina, [{ productoId: 'banco-ajustable', cantidad: 1 }, { productoId: 'mancuernas-24', cantidad: 1 }], 0, 'Pagado', 'tarjeta');
      pedido(laura, [{ productoId: 'pre-explosive', cantidad: 1, presentacion: '300g' }, { productoId: 'bcaa-recovery', cantidad: 1, presentacion: '250g' }], 0, 'Pagado', 'nequi');
      pedido(camilo, [{ productoId: 'whey-isolate', cantidad: 1, presentacion: '1kg' }, { productoId: 'camiseta-oversize', cantidad: 1, talla: 'L' }], 7, 'Entregado', 'tarjeta');
      db.products.forEach((p) => { p.vendidos += Math.floor(R() * 40) + (p.cat === 'suplementos' ? 30 : 5); });

      // Reseñas de ejemplo
      const frases = {
        maquinaria: ['Excelente calidad, muy estable incluso con peso alto.', 'Llegó bien empacada y fue fácil de armar.', 'Vale cada peso, la uso casi todos los días.', 'Buena, aunque hace algo de ruido a máxima intensidad.', 'Perfecta para entrenar en casa sin ir al gimnasio.'],
        ropa: ['La tela es muy cómoda y respira bien.', 'La talla es exacta a la tabla de medidas.', 'No se transparenta, excelente para sentadillas.', 'El color es igual al de la foto.', 'Buena calidad para el precio.'],
        suplementos: ['Buen sabor y se disuelve sin grumos.', 'Noté resultados en pocas semanas.', 'Sabor suave, nada empalagoso.', 'Buena relación calidad-precio.', 'Lo recomiendo, me cae muy bien.'],
        accesorios: ['Muy útil y resistente.', 'Justo lo que necesitaba para entrenar.', 'Buen material, se siente durable.', 'Práctico para llevar al gimnasio.', 'Cumple perfectamente lo que promete.']
      };
      const autores = [laura, andres, valentina, camilo, sofia, miguel];
      db.products.forEach((p, i) => {
        const n = 2 + Math.floor(R() * 4);
        for (let k = 0; k < n; k++) {
          const u = autores[(i + k) % autores.length];
          const rating = R() < 0.65 ? 5 : (R() < 0.7 ? 4 : 3);
          db.reviews.push({ id: nuevoId('r', 'r'), productoId: p.id, userId: u.id, autor: u.nombre, rating, comentario: frases[p.cat][(i + k * 2) % 5],
            fecha: now - Math.floor(1 + R() * 60) * DIA, utilDe: autores.filter(() => R() < 0.3).map((x) => x.id),
            compraVerificada: db.orders.some((o) => o.userId === u.id && o.lineas.some((l) => l.productoId === p.id)) });
        }
      });

      // Progreso de Miguel en su plan
      const semana = isoDia(lunesDe(now));
      db.progreso[miguel.id] = { hechos: {}, pesos: [78.4, 78.0, 77.6, 77.5, 77.1, 76.8, 76.5].map((v, i, a) => ({ fecha: now - (a.length - 1 - i) * 7 * DIA, valor: v })) };
      const hoy = new Date(now).getDay();
      DIAS_ENTRENO[4].filter((d) => d < hoy || (hoy === 0)).forEach((d) => { for (let k = 0; k < 5; k++) if (R() < 0.85) db.progreso[miguel.id].hechos[semana + '|' + d + '|' + k] = now; });

      // Comunidad
      const post = (u, tipo, txt, horas, fondo, likes, comentarios) => {
        db.posts.push({ id: nuevoId('c', 'c'), userId: u.id, autor: u.nombre, texto: txt, tipo, fondo: fondo || null, fecha: now - horas * 3600000,
          likes: likes.map((x) => x.id), comentarios: (comentarios || []).map(([cu, ct, ch]) => ({ id: nuevoId('k', 'c'), userId: cu.id, autor: cu.nombre, texto: ct, fecha: now - ch * 3600000, likes: [] })), reportes: [], oculto: false });
      };
      post(camilo, 'logro', 'Nuevo récord personal: 100 kg en sentadilla. Hace seis meses no pasaba de 60. La constancia sí funciona.', 70, 'pesa', [laura, andres, sofia, miguel], [[andres, '¡Brutal, Camilo! ¿Qué rutina estás siguiendo?', 66], [camilo, 'La del plan Avanzado, 4 días a la semana.', 64]]);
      post(valentina, 'pregunta', '¿Alguien ha probado la proteína vegana de chocolate? ¿Qué tal sabe con leche de almendras?', 30, null, [sofia], [[sofia, 'Yo la tomo así y queda muy bien, nada arenosa.', 28]]);
      post(andres, 'tip', 'Tip para los que entrenan temprano: dejen la ropa y el termo listos desde la noche anterior. Así no hay excusa a las 5 a. m.', 20, null, [laura, valentina, camilo]);
      post(miguel, 'tip', 'Para los que empiezan: primero la técnica y después el peso. Grábense en video para revisar la postura.', 9, null, [camilo, sofia]);
      post(laura, 'logro', 'Completé la primera semana del reto de 30 días de abdominales. Empecé con 20 y hoy hice 45 seguidas.', 3, 'llama', [miguel, valentina, andres], [[valentina, '¡Vamos, Laura! Me uno al reto.', 2]]);

      db.retos = [
        { id: 'abdominales-30', titulo: '30 días de abdominales', desc: 'Una rutina corta de abdomen cada día durante 30 días.', dias: 30, insignia: 'Núcleo de acero', icono: 'llama', color: '#E8743B',
          participantes: { [laura.id]: { avance: 7, completado: false, ultimoDia: null }, [miguel.id]: { avance: 12, completado: false, ultimoDia: null }, [valentina.id]: { avance: 1, completado: false, ultimoDia: null } } },
        { id: 'pasos-14', titulo: '10.000 pasos por 14 días', desc: 'Camina al menos 10.000 pasos diarios durante dos semanas.', dias: 14, insignia: 'Caminante incansable', icono: 'ruta', color: '#1D9E75',
          participantes: { [camilo.id]: { avance: 14, completado: true, ultimoDia: null }, [sofia.id]: { avance: 5, completado: false, ultimoDia: null } } },
        { id: 'agua-7', titulo: '2 litros de agua por 7 días', desc: 'Toma al menos 2 litros de agua cada día durante una semana.', dias: 7, insignia: 'Hidratación total', icono: 'gota', color: '#378ADD',
          participantes: { [andres.id]: { avance: 3, completado: false, ultimoDia: null } } }
      ];
      camilo.insignias.push({ reto: 'pasos-14', nombre: 'Caminante incansable', icono: 'ruta', color: '#1D9E75', fecha: now - 4 * DIA });
      const evento = (titulo, tipo, dias, hora, duracion, anfitrion, cupos, asistentes, premium) => {
        const d = new Date(now + dias * DIA); d.setHours(hora, 0, 0, 0);
        db.eventos.push({ id: 'e' + (db.eventos.length + 1), titulo, tipo, fecha: d.getTime(), duracion, anfitrion, cupos, asistentes: asistentes.map((x) => x.id), premium: !!premium });
      };
      evento('Nutrición para ganar masa muscular', 'Webinar', 2, 19, '60 min', 'Nutricionista invitada', 100, [miguel, laura, valentina]);
      evento('Clase en vivo: HIIT de 30 minutos', 'Clase', 4, 7, '30 min', 'Coach FITOPÍA', 40, [andres, sofia]);
      evento('Taller de técnica de sentadilla', 'Taller', 7, 18, '90 min', 'Coach FITOPÍA', 15, [camilo], true);
      evento('Cómo evitar lesiones al entrenar', 'Webinar', 10, 19, '45 min', 'Fisioterapeuta invitado', 100, []);
      evento('Yoga para la recuperación', 'Clase', 13, 8, '50 min', 'Instructora invitada', 30, [laura]);
      return db;
    }

    async function init() {
      let cargada = null;
      try { cargada = await store.load(); } catch (e) { cargada = null; }
      if (cargada && cargada.version === DB_VERSION) db = cargada;
      else { await sembrar(); await store.save(db); }
      return api;
    }
    async function reiniciar() { await sembrar(); await store.save(db); }

    const api = { init, handle, reiniciar, get db() { return db; } };
    return api;
  }

  return { createApp, VERSION, ApiError, b64url, problemasPassword };
});

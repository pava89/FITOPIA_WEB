/* FITOPÍA · Base de la interfaz (SPA): estado, encabezado, pie, enrutador y componentes comunes */
(function () {
  'use strict';

  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const cop = (n) => '$' + Math.round(n || 0).toLocaleString('es-CO');
  const ic = (n, c) => window.Arte.icono(n, c);
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const cap = (s) => { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); };
  const fecha = (ts, o) => new Date(ts).toLocaleDateString('es-CO', o || { day: 'numeric', month: 'short', year: 'numeric' });
  const fechaHora = (ts) => new Date(ts).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  const iniciales = (n) => String(n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('');
  function hace(ts) {
    const s = (Date.now() - ts) / 1000;
    if (s < 60) return 'hace un momento';
    if (s < 3600) return 'hace ' + Math.floor(s / 60) + ' min';
    if (s < 86400) return 'hace ' + Math.floor(s / 3600) + ' h';
    if (s < 7 * 86400) { const d = Math.floor(s / 86400); return 'hace ' + d + (d === 1 ? ' día' : ' días'); }
    return fecha(ts);
  }
  const titulo = (t) => { document.title = t ? t + ' · FITOPÍA' : 'FITOPÍA · Tienda fitness y Planes Fit'; };

  // ---------- estado ----------
  const S = { user: null, meta: null, health: null, carrito: [], cupon: '', envio: 'estandar', prods: {}, timers: [] };

  // ---------- carrito (se guarda en el navegador) ----------
  function cargarCarrito() { try { const c = JSON.parse(window.Api.guardar.get('fitopia_carrito') || '[]'); return Array.isArray(c) ? c : []; } catch (e) { return []; } }
  const claveItem = (it) => it.productoId + '|' + (it.talla || '') + '|' + (it.presentacion || '');
  function guardarCarrito(saltar) { window.Api.guardar.set('fitopia_carrito', JSON.stringify(S.carrito)); pintarContador(saltar !== false); }
  function agregarAlCarrito(it) {
    const k = claveItem(it);
    const ex = S.carrito.find((x) => claveItem(x) === k);
    if (ex) ex.cantidad = Math.min(20, ex.cantidad + (it.cantidad || 1));
    else S.carrito.push({ productoId: it.productoId, cantidad: it.cantidad || 1, talla: it.talla || null, presentacion: it.presentacion || null });
    guardarCarrito(true);
  }
  const cantidadCarrito = () => S.carrito.reduce((a, x) => a + x.cantidad, 0);
  function pintarContador(saltar) {
    const el = $('#contador-carrito'); if (!el) return;
    const n = cantidadCarrito();
    el.textContent = n > 99 ? '99+' : n;
    el.style.display = n ? '' : 'none';
    if (saltar) { el.classList.remove('salto'); void el.offsetWidth; el.classList.add('salto'); }
  }

  // ---------- avisos (toasts) y ventanas (modales) ----------
  function toast(msg, tipo, accion) {
    const el = document.createElement('div');
    el.className = 'toast toast--' + (tipo || 'ok');
    el.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
    el.innerHTML = ic(tipo === 'error' ? 'alerta' : tipo === 'info' ? 'info' : 'check') + '<span>' + esc(msg) + '</span>' + (accion ? `<a href="${esc(accion.href)}">${esc(accion.texto)}</a>` : '');
    $('#toasts').appendChild(el);
    setTimeout(() => { el.classList.add('sale'); setTimeout(() => el.remove(), 300); }, tipo === 'error' ? 5200 : 3600);
  }
  function modal(html, o) {
    o = o || {};
    const fondo = document.createElement('div');
    fondo.className = 'modal-fondo';
    fondo.innerHTML = `<div class="modal ${o.ancho ? 'modal--ancho' : ''}" role="dialog" aria-modal="true" aria-label="${esc(o.etiqueta || 'Ventana')}">` +
      `<button class="icon-btn modal__cerrar" data-cerrar aria-label="Cerrar">${ic('x')}</button>${html}</div>`;
    const alTeclado = (e) => { if (e.key === 'Escape') cerrar(); };
    function cerrar() { fondo.remove(); document.removeEventListener('keydown', alTeclado); if (o.alCerrar) o.alCerrar(); }
    fondo.addEventListener('click', (e) => { if (e.target === fondo || e.target.closest('[data-cerrar]')) cerrar(); });
    document.addEventListener('keydown', alTeclado);
    $('#modales').appendChild(fondo);
    setTimeout(() => { const f = fondo.querySelector('[autofocus], .modal input, .modal .btn'); if (f) f.focus(); }, 30);
    return { el: fondo.querySelector('.modal'), cerrar };
  }
  function confirmar(texto, opciones) {
    opciones = opciones || {};
    return new Promise((resolve) => {
      let r = false;
      const m = modal(`<h3>${esc(opciones.titulo || '¿Estás seguro?')}</h3><p class="muted">${esc(texto)}</p>
        <div class="fila" style="justify-content:flex-end;margin-top:18px"><button class="btn btn--sec" data-cerrar>Cancelar</button>
        <button class="btn ${opciones.peligro ? 'btn--peligro' : 'btn--pri'}" data-si>${esc(opciones.boton || 'Confirmar')}</button></div>`, { alCerrar: () => resolve(r) });
      m.el.querySelector('[data-si]').addEventListener('click', () => { r = true; m.cerrar(); });
    });
  }

  // ---------- piezas reutilizables ----------
  function etiquetaArte(p) {
    const n = norm(p.nombre);
    if (p.arte === 'kettlebell') return (n.match(/(\d+)\s*kg/) || [])[1] || '16';
    if (n.includes('vegana')) return 'VEG';
    if (n.includes('whey')) return 'WHEY';
    if (n.includes('creatina')) return 'CREA';
    if (n.includes('pre-entreno')) return 'PRE';
    if (n.includes('bcaa')) return 'BCAA';
    if (p.arte === 'frasco') return 'MULTI';
    if (p.arte === 'tarro') return (p.tipo || 'FIT').slice(0, 4).toUpperCase();
    return '';
  }
  const artePara = (p, vista) => window.Arte.producto(p.arte, p.color, vista || 0, etiquetaArte(p));
  function estrellas(r, n, grande) {
    const v = Math.max(0, Math.min(5, r || 0));
    return `<span class="estrellas-fila"><span class="estrellas ${grande ? 'estrellas--lg' : ''}" style="--p:${v / 5 * 100}%" role="img" aria-label="${String(v).replace('.', ',')} de 5 estrellas"></span>` +
      (n !== undefined ? `<span>${v.toFixed(1).replace('.', ',')} (${n})</span>` : '') + '</span>';
  }
  function tarjetaProducto(p) {
    S.prods[p.id] = p;
    const desc = p.precioAntes ? Math.round((1 - p.precio / p.precioAntes) * 100) : 0;
    const agotado = p.stock <= 0;
    let boton;
    if (agotado) boton = '<button class="btn btn--sm" disabled>Agotado</button>';
    else if (p.tallas) boton = `<a class="btn btn--pri btn--sm" href="#/producto/${esc(p.id)}">Elegir talla</a>`;
    else boton = `<button class="btn btn--pri btn--sm" data-agregar="${esc(p.id)}">${ic('carrito')} Agregar</button>`;
    return `<article class="card-prod">
      <a href="#/producto/${esc(p.id)}" class="card-prod__img" aria-label="${esc(p.nombre)}">${artePara(p)}
        <div class="badges">${agotado ? '<span class="badge badge--gris">Agotado</span>' : ''}${desc ? `<span class="badge badge--oferta">-${desc}%</span>` : ''}${p.nuevo ? '<span class="badge badge--nuevo">Nuevo</span>' : ''}</div></a>
      <div class="card-prod__body">
        <span class="card-prod__marca">${esc(p.marca)}</span>
        <a href="#/producto/${esc(p.id)}" class="card-prod__nombre">${esc(p.nombre)}</a>
        ${estrellas(p.rating, p.resenas)}
        <div class="precio">${p.presentaciones && p.presentaciones.length > 1 ? '<small>Desde</small>' : ''}<strong>${cop(p.precio)}</strong>${p.precioAntes ? `<s>${cop(p.precioAntes)}</s>` : ''}</div>
        <div class="card-prod__acciones"><a class="btn btn--sec btn--sm" href="#/producto/${esc(p.id)}">Ver producto</a>${boton}</div>
      </div></article>`;
  }
  function carrusel(id, titulo, subtitulo, items, extra) {
    if (!items.length) return '';
    return `<section class="seccion ${extra || ''}"><div class="contenedor">
      <div class="titulo-seccion"><div><h2>${titulo}</h2>${subtitulo ? `<p>${subtitulo}</p>` : ''}</div>
      <div class="carrusel__btns"><button class="icon-btn" data-carrusel="${id}" data-dir="-1" aria-label="Anterior">${ic('izq')}</button>
      <button class="icon-btn" data-carrusel="${id}" data-dir="1" aria-label="Siguiente">${ic('der')}</button></div></div>
      <div class="carrusel"><div class="carrusel__pista" id="${id}">${items.map(tarjetaProducto).join('')}</div></div></div></section>`;
  }
  const vacioHtml = (icono, tituloTxt, texto, accion) => `<div class="vacio"><div class="vacio__icono">${ic(icono)}</div><h2>${esc(tituloTxt)}</h2><p class="muted">${esc(texto)}</p>${accion || ''}</div>`;
  const errorHtml = (e) => `<div class="contenedor">${vacioHtml('alerta', e && e.status === 404 ? 'No encontramos esta página' : 'Algo salió mal', (e && e.message) || 'Intenta de nuevo en un momento.', '<a class="btn btn--pri" href="#/">Volver al inicio</a>')}</div>`;

  // ---------- formularios ----------
  function marcarErrores(root, campos) {
    limpiarErrores(root);
    Object.keys(campos || {}).forEach((k) => {
      const inp = root.querySelector(`[name="${k}"]`);
      const c = inp && inp.closest('.campo');
      if (!c) return;
      c.classList.add('invalido');
      inp.setAttribute('aria-invalid', 'true');
      c.insertAdjacentHTML('beforeend', `<span class="error-msg">${ic('alerta')}${esc(campos[k])}</span>`);
    });
    const primero = root.querySelector('.campo.invalido input, .campo.invalido select, .campo.invalido textarea');
    if (primero) primero.focus();
  }
  function limpiarCampo(c) {
    c.classList.remove('invalido');
    const m = c.querySelector('.error-msg'); if (m) m.remove();
    const i = c.querySelector('[aria-invalid]'); if (i) i.removeAttribute('aria-invalid');
  }
  function limpiarErrores(root) { $$('.campo.invalido', root).forEach(limpiarCampo); }
  function errorEnCampo(inp, msg) {
    const c = inp.closest('.campo'); if (!c) return;
    limpiarCampo(c);
    if (msg) { c.classList.add('invalido'); inp.setAttribute('aria-invalid', 'true'); c.insertAdjacentHTML('beforeend', `<span class="error-msg">${ic('alerta')}${esc(msg)}</span>`); }
    else if (inp.value) c.classList.add('valido');
  }
  // RU 04: validación instantánea al salir de cada campo
  function validarAlSalir(root, reglas) {
    root.addEventListener('focusout', (e) => {
      const f = reglas[e.target.name];
      if (f && e.target.value !== '') errorEnCampo(e.target, f(e.target.value, root));
    });
    root.addEventListener('input', (e) => { const c = e.target.closest('.campo'); if (c && c.classList.contains('invalido')) limpiarCampo(c); });
  }
  async function conCarga(btn, fn, texto) {
    const html = btn.innerHTML;
    btn.disabled = true; btn.classList.add('cargando');
    btn.innerHTML = '<span class="spinner"></span> ' + esc(texto || 'Procesando…');
    try { return await fn(); }
    finally { if (btn.isConnected) { btn.disabled = false; btn.classList.remove('cargando'); btn.innerHTML = html; } }
  }
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  function campo(nombre, etiqueta, opciones) {
    opciones = opciones || {};
    const id = 'f-' + nombre + '-' + Math.random().toString(36).slice(2, 7);
    const attrs = Object.entries(opciones.attrs || {}).map(([k, v]) => `${k}="${esc(v)}"`).join(' ');
    let control;
    if (opciones.tipo === 'select') control = `<select id="${id}" name="${nombre}" ${attrs}>${opciones.opciones.map((o) => `<option value="${esc(o[0])}" ${String(o[0]) === String(opciones.valor) ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select>`;
    else if (opciones.tipo === 'textarea') control = `<textarea id="${id}" name="${nombre}" ${attrs}>${esc(opciones.valor || '')}</textarea>`;
    else control = `<input id="${id}" name="${nombre}" type="${opciones.tipo || 'text'}" value="${esc(opciones.valor == null ? '' : opciones.valor)}" ${attrs}>`;
    return `<div class="campo ${opciones.clase || ''}"><label for="${id}">${esc(etiqueta)}</label>${control}${opciones.ayuda ? `<span class="ayuda">${esc(opciones.ayuda)}</span>` : ''}</div>`;
  }

  // ---------- pago (compartido por checkout y suscripciones) ----------
  const METODOS = [
    ['tarjeta', 'tarjeta', 'Tarjeta', 'Crédito o débito'],
    ['nequi', 'celular', 'Nequi', 'Desde tu app'],
    ['pse', 'banco', 'PSE', 'Débito bancario'],
    ['paypal', 'billetera', 'PayPal', 'Internacional']
  ];
  const BANCOS = ['Bancolombia', 'Banco de Bogotá', 'Davivienda', 'BBVA Colombia', 'Banco de Occidente', 'Banco Caja Social', 'Scotiabank Colpatria', 'Banco Popular'];
  function formularioPago(metodo) {
    return `<div class="metodos" role="radiogroup" aria-label="Método de pago">${METODOS.map(([id, icono, nombre, sub]) =>
      `<button type="button" class="metodo ${id === metodo ? 'activo' : ''}" data-metodo="${id}" role="radio" aria-checked="${id === metodo}">${ic(icono)}${nombre}<small>${sub}</small></button>`).join('')}</div>
      <div data-campos-pago style="margin-top:16px">${camposPago(metodo)}</div>
      <div class="nota nota--azul" style="margin-top:14px">${ic('candado')}<div><strong>Pago seguro.</strong> Tus datos van directo a la pasarela (Wompi o PayPal). FITOPÍA solo guarda un token de la transacción, nunca el número de tu tarjeta (RS 02 · PCI DSS).</div></div>`;
  }
  function camposPago(m) {
    if (m === 'tarjeta') return `<div class="form-grid">
      ${campo('numero', 'Número de la tarjeta', { clase: 'completo', attrs: { inputmode: 'numeric', autocomplete: 'cc-number', placeholder: '4242 4242 4242 4242', maxlength: 23 } })}
      ${campo('titular', 'Nombre del titular', { clase: 'completo', attrs: { autocomplete: 'cc-name', placeholder: 'Como aparece en la tarjeta' } })}
      ${campo('vence', 'Vencimiento', { attrs: { inputmode: 'numeric', autocomplete: 'cc-exp', placeholder: 'MM/AA', maxlength: 5 } })}
      ${campo('cvv', 'CVV', { tipo: 'password', attrs: { inputmode: 'numeric', autocomplete: 'cc-csc', placeholder: '123', maxlength: 4 } })}
      <div class="datos-prueba completo">${ic('info')} <strong>Datos de prueba (sandbox):</strong> aprobada <code data-rellenar="numero" data-valor="4242 4242 4242 4242">4242 4242 4242 4242</code> · rechazada <code data-rellenar="numero" data-valor="4000 0000 0000 0002">4000 0000 0000 0002</code> · vence <code data-rellenar="vence" data-valor="12/29">12/29</code> · CVV <code data-rellenar="cvv" data-valor="123">123</code></div></div>`;
    if (m === 'nequi') return `<div class="form-grid">${campo('celular', 'Celular registrado en Nequi', { clase: 'completo', attrs: { inputmode: 'numeric', placeholder: '300 123 4567', maxlength: 12 }, ayuda: 'Te llegará una notificación a la app para aprobar el pago.' })}
      <div class="datos-prueba completo">${ic('info')} <strong>Prueba:</strong> aprobado <code data-rellenar="celular" data-valor="3001234567">3001234567</code> · rechazado <code data-rellenar="celular" data-valor="3000000002">3000000002</code></div></div>`;
    if (m === 'pse') return `<div class="form-grid">${campo('banco', 'Banco', { tipo: 'select', opciones: [['', 'Elige tu banco']].concat(BANCOS.map((b) => [b, b])) })}
      ${campo('persona', 'Tipo de persona', { tipo: 'select', opciones: [['natural', 'Persona natural'], ['juridica', 'Persona jurídica']] })}</div>`;
    return `<div class="form-grid">${campo('email', 'Correo de tu cuenta PayPal', { tipo: 'email', clase: 'completo', attrs: { placeholder: 'tucorreo@ejemplo.com', autocomplete: 'email' } })}</div>`;
  }
  const REGLAS_PAGO = {
    numero: (v) => { const n = v.replace(/\D/g, ''); return n.length < 13 || !luhn(n) ? 'Número de tarjeta inválido' : ''; },
    titular: (v) => (v.trim().length < 3 ? 'Escribe el nombre del titular' : ''),
    vence: (v) => { const m = /^(\d{2})\/(\d{2})$/.exec(v); if (!m || +m[1] < 1 || +m[1] > 12) return 'Usa el formato MM/AA'; return new Date(2000 + +m[2], +m[1], 1) <= new Date() ? 'La tarjeta está vencida' : ''; },
    cvv: (v) => (/^\d{3,4}$/.test(v) ? '' : 'CVV de 3 o 4 dígitos'),
    celular: (v) => (/^3\d{9}$/.test(v.replace(/\D/g, '')) ? '' : 'Celular de 10 dígitos que empiece por 3'),
    banco: (v) => (v ? '' : 'Elige tu banco'),
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Correo inválido')
  };
  function luhn(n) { let s = 0, alt = false; for (let i = n.length - 1; i >= 0; i--) { let d = +n[i]; if (alt) { d *= 2; if (d > 9) d -= 9; } s += d; alt = !alt; } return s % 10 === 0; }
  function conectarPago(root, alCambiar) {
    let metodo = (root.querySelector('.metodo.activo') || {}).dataset ? root.querySelector('.metodo.activo').dataset.metodo : 'tarjeta';
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-metodo]');
      if (b) {
        metodo = b.dataset.metodo;
        $$('.metodo', root).forEach((x) => { x.classList.toggle('activo', x === b); x.setAttribute('aria-checked', x === b); });
        root.querySelector('[data-campos-pago]').innerHTML = camposPago(metodo);
        if (alCambiar) alCambiar(metodo);
      }
      const r = e.target.closest('[data-rellenar]');
      if (r) { const i = root.querySelector(`[name="${r.dataset.rellenar}"]`); if (i) { i.value = r.dataset.valor; i.dispatchEvent(new Event('input', { bubbles: true })); errorEnCampo(i, ''); } }
    });
    root.addEventListener('input', (e) => {
      const t = e.target;
      if (t.name === 'numero') { const d = t.value.replace(/\D/g, '').slice(0, 19); t.value = d.replace(/(.{4})/g, '$1 ').trim(); }
      if (t.name === 'vence') { let d = t.value.replace(/\D/g, '').slice(0, 4); if (d.length > 2) d = d.slice(0, 2) + '/' + d.slice(2); t.value = d; }
      if (t.name === 'cvv') t.value = t.value.replace(/\D/g, '').slice(0, 4);
    });
    validarAlSalir(root, REGLAS_PAGO);
    return { get metodo() { return metodo; } };
  }
  function leerPago(root, metodo) {
    const v = (n) => { const i = root.querySelector(`[name="${n}"]`); return i ? i.value : ''; };
    if (metodo === 'tarjeta') return { metodo, numero: v('numero'), titular: v('titular'), vence: v('vence'), cvv: v('cvv') };
    if (metodo === 'nequi') return { metodo, celular: v('celular') };
    if (metodo === 'pse') return { metodo, banco: v('banco'), persona: v('persona') };
    return { metodo, email: v('email') };
  }
  function validarPagoCliente(root, metodo) {
    const campos = { tarjeta: ['numero', 'titular', 'vence', 'cvv'], nequi: ['celular'], pse: ['banco'], paypal: ['email'] }[metodo] || [];
    const errores = {};
    campos.forEach((c) => { const i = root.querySelector(`[name="${c}"]`); const m = REGLAS_PAGO[c](i ? i.value : ''); if (m) errores[c] = m; });
    return errores;
  }

  // ---------- encabezado ----------
  const SUBCATS = {
    maquinaria: ['cardio', 'fuerza', 'multifuncional'],
    ropa: ['camisetas', 'leggins', 'shorts', 'buzos', 'tops'],
    suplementos: ['proteína', 'creatina', 'vitaminas', 'pre-entreno', 'aminoácidos'],
    accesorios: ['bandas', 'termos', 'guantes', 'colchonetas', 'cuerdas', 'recuperación']
  };
  const marcaLogo = () => '<span class="logo__marca"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 20V4h11v3.6h-7v3.1h6v3.5h-6V20z" fill="#fff"/></svg></span>';
  const buscadorHtml = (id) => `${ic('buscar')}<input type="search" id="buscar-${id}" placeholder="Busca proteína, mancuernas, leggins…" aria-label="Buscar productos" autocomplete="off" data-buscador role="combobox" aria-expanded="false" aria-autocomplete="list"><div class="sugerencias oculto" role="listbox"></div>`;
  function pintarHeader() {
    const u = S.user;
    const panel = u && (u.rol === 'admin' || u.rol === 'tecnico');
    $('#topbar').innerHTML = `<div class="contenedor"><div class="topbar__fila">
      <button class="icon-btn solo-movil" data-abrir-cajon aria-label="Abrir menú">${ic('menu')}</button>
      <a href="#/" class="logo" aria-label="FITOPÍA, ir al inicio">${marcaLogo()}<span>FITO<b>PÍA</b></span></a>
      <nav class="nav" aria-label="Navegación principal">
        <div class="nav__item"><a class="nav__link" href="#/tienda" data-nav="tienda">Tienda ${ic('abajo')}</a>
          <div class="mega">${S.meta.categorias.map((c) => `<div><h4>${esc(c.nombre)}</h4><a class="mega__todo" href="#/tienda/${c.id}">Ver todo</a>${SUBCATS[c.id].map((t) => `<a href="#/tienda/${c.id}?tipo=${encodeURIComponent(t)}">${esc(cap(t))}</a>`).join('')}</div>`).join('')}</div></div>
        <a class="nav__link" href="#/planes" data-nav="planes">Planes Fit</a>
        <a class="nav__link" href="#/comunidad" data-nav="comunidad">Comunidad</a>
        ${u && u.suscripcion ? '<a class="nav__link" href="#/mi-plan" data-nav="mi-plan">Mi plan</a>' : ''}
        ${panel ? `<a class="nav__link" href="#/admin" data-nav="admin">${u.rol === 'admin' ? 'Panel admin' : 'Panel técnico'}</a>` : ''}
      </nav>
      <div class="buscador buscador--escritorio">${buscadorHtml('d')}</div>
      <div class="acciones-top">
        ${u ? `<div style="position:relative"><button class="icon-btn" data-menu-usuario aria-haspopup="true" aria-expanded="false" aria-label="Tu cuenta: ${esc(u.nombre)}" title="${esc(u.nombre)}"><span class="avatar" style="background:${esc(u.avatarColor)};width:34px;height:34px">${esc(iniciales(u.nombre))}</span></button></div>`
    : `<a class="icon-btn" href="#/login" aria-label="Iniciar sesión" title="Iniciar sesión">${ic('usuario')}</a>`}
        <a class="icon-btn" href="#/carrito" aria-label="Ver carrito" title="Carrito">${ic('carrito')}<span class="contador" id="contador-carrito"></span></a>
      </div></div>
      <div class="buscador buscador--movil">${buscadorHtml('m')}</div></div>`;
    pintarContador(false);
    conectarBuscadores();
  }
  function menuUsuario(boton) {
    cerrarMenus();
    const u = S.user;
    const div = document.createElement('div');
    div.className = 'menu-usuario'; div.setAttribute('role', 'menu');
    const rol = { cliente: 'Cliente', admin: 'Administrador', tecnico: 'Personal técnico' }[u.rol];
    div.innerHTML = `<div class="menu-usuario__cab"><strong>${esc(u.nombre)}</strong><br><small class="muted">${esc(u.email)} · ${rol}</small></div>
      <a href="#/cuenta" role="menuitem">${ic('usuario')} Mi perfil</a>
      <a href="#/cuenta/pedidos" role="menuitem">${ic('recibo')} Mis pedidos</a>
      ${u.suscripcion ? `<a href="#/mi-plan" role="menuitem">${ic('pesa')} Mi plan ${esc(u.suscripcion.plan)}</a>` : `<a href="#/planes" role="menuitem">${ic('pesa')} Planes Fit</a>`}
      ${u.rol === 'admin' ? `<a href="#/admin" role="menuitem">${ic('grafico')} Panel de administración</a>` : ''}
      ${u.rol === 'tecnico' ? `<a href="#/admin/auditoria" role="menuitem">${ic('servidor')} Panel técnico</a>` : ''}
      <button data-cerrar-sesion role="menuitem">${ic('salir')} Cerrar sesión</button>`;
    boton.parentElement.appendChild(div);
    boton.setAttribute('aria-expanded', 'true');
  }
  function cerrarMenus() {
    $$('.menu-usuario').forEach((m) => m.remove());
    $$('[data-menu-usuario]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
  }
  function abrirCajon() {
    const c = document.createElement('div');
    c.className = 'cajon';
    const u = S.user;
    c.innerHTML = `<div class="cajon__panel" role="dialog" aria-label="Menú">
      <div class="entre" style="margin-bottom:10px"><a href="#/" class="logo">${marcaLogo()}<span>FITO<b>PÍA</b></span></a><button class="icon-btn" data-cerrar aria-label="Cerrar menú">${ic('x')}</button></div>
      <a href="#/">${ic('casa')} Inicio</a>
      <h4>Tienda</h4>${S.meta.categorias.map((cat) => `<a href="#/tienda/${cat.id}">${ic('tienda')} ${esc(cat.nombre)}</a>`).join('')}
      <a href="#/tienda?oferta=1">${ic('etiqueta')} Ofertas</a>
      <h4>FITOPÍA</h4><a href="#/planes">${ic('pesa')} Planes Fit</a><a href="#/comunidad">${ic('usuarios')} Comunidad</a>
      ${u && u.suscripcion ? `<a href="#/mi-plan">${ic('pulso')} Mi plan</a>` : ''}
      <h4>Tu cuenta</h4>${u ? `<a href="#/cuenta">${ic('usuario')} Mi perfil</a><a href="#/cuenta/pedidos">${ic('recibo')} Mis pedidos</a>${u.rol !== 'cliente' ? `<a href="#/admin">${ic('grafico')} Panel</a>` : ''}<a href="#/" data-cerrar-sesion>${ic('salir')} Cerrar sesión</a>` : `<a href="#/login">${ic('usuario')} Iniciar sesión</a><a href="#/registro">${ic('mas')} Crear cuenta</a>`}
      </div>`;
    c.addEventListener('click', (e) => { if (e.target === c || e.target.closest('[data-cerrar]') || e.target.closest('a')) c.remove(); });
    document.body.appendChild(c);
  }

  // ---------- buscador con autocompletado (máx. 6 sugerencias) ----------
  function conectarBuscadores() {
    $$('[data-buscador]').forEach((inp) => {
      const caja = inp.parentElement.querySelector('.sugerencias');
      let t = null, items = [], sel = -1;
      const cerrar = () => { caja.classList.add('oculto'); inp.setAttribute('aria-expanded', 'false'); sel = -1; };
      const pintar = () => {
        caja.innerHTML = items.length ? items.map((s, i) => `<div class="sugerencia ${i === sel ? 'activa' : ''}" data-i="${i}" role="option" aria-selected="${i === sel}">
          ${s.tipo === 'producto' ? `<div class="mini">${window.Arte.producto(s.arte, s.color, 0, etiquetaArte(s))}</div><div><strong>${esc(s.nombre)}</strong><small>${cop(s.precio)}</small></div>`
    : `<div class="mini" style="display:grid;place-items:center;background:var(--crema)">${ic('tienda')}</div><div><strong>${esc(s.nombre)}</strong><small>Ver categoría</small></div>`}</div>`).join('')
          : '<div class="sugerencia muted">Sin coincidencias. Presiona Enter para buscar.</div>';
        caja.classList.remove('oculto'); inp.setAttribute('aria-expanded', 'true');
      };
      const ir = (s) => { cerrar(); inp.value = ''; inp.blur(); location.hash = s.tipo === 'producto' ? '#/producto/' + s.id : '#/tienda/' + s.id; };
      inp.addEventListener('input', () => {
        clearTimeout(t);
        const q = inp.value.trim();
        if (q.length < 2) { cerrar(); return; }
        t = setTimeout(async () => { try { items = (await window.Api.get('/products/suggest?q=' + encodeURIComponent(q))).sugerencias; sel = -1; if (document.activeElement === inp) pintar(); } catch (e) { cerrar(); } }, 160);
      });
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' && items.length) { e.preventDefault(); sel = (sel + 1) % items.length; pintar(); }
        else if (e.key === 'ArrowUp' && items.length) { e.preventDefault(); sel = (sel - 1 + items.length) % items.length; pintar(); }
        else if (e.key === 'Enter') {
          e.preventDefault();
          if (sel >= 0 && items[sel]) ir(items[sel]);
          else if (inp.value.trim()) { const q = inp.value.trim(); cerrar(); inp.value = ''; inp.blur(); location.hash = '#/tienda?q=' + encodeURIComponent(q); }
        } else if (e.key === 'Escape') cerrar();
      });
      caja.addEventListener('mousedown', (e) => { const d = e.target.closest('[data-i]'); if (d) { e.preventDefault(); ir(items[+d.dataset.i]); } });
      inp.addEventListener('blur', () => setTimeout(cerrar, 150));
    });
  }

  // ---------- pie de página ----------
  function pintarPie() {
    const demo = window.Api.modo === 'demo';
    $('#pie').innerHTML = `<div class="contenedor"><div class="pie__grid">
      <div><a href="#/" class="logo">${marcaLogo()}<span>FITO<b>PÍA</b></span></a>
        <p>Compra equipos y suplementos, entrena con un plan hecho para ti y motívate con la comunidad. Todo en un solo lugar.</p>
        <div class="pagos-logos"><span>Wompi</span><span>Nequi</span><span>PSE</span><span>Visa · Mastercard</span><span>PayPal</span></div></div>
      <div><h4>Tienda</h4>${S.meta.categorias.map((c) => `<a href="#/tienda/${c.id}">${esc(c.nombre)}</a>`).join('')}<a href="#/tienda?oferta=1">Ofertas</a></div>
      <div><h4>FITOPÍA</h4><a href="#/planes">Planes Fit</a><a href="#/comunidad">Comunidad</a><a href="#/comunidad?tab=retos">Retos e insignias</a><a href="#/comunidad?tab=eventos">Eventos</a><a href="#/cuenta/soporte">Soporte</a></div>
      <div><h4>Confianza</h4><a href="#/info/seguridad">Pagos seguros (PCI DSS)</a><a href="#/info/datos">Tratamiento de datos (Ley 1581)</a><a href="#/info/soporte">Respuesta en máximo 24 horas</a><a href="#/info/arquitectura">Cómo está construida</a></div>
    </div>
    <div class="pie__base"><span>© 2026 FITOPÍA · Prototipo académico de Ingeniería del Software 2026-2 · Universidad de Manizales</span>
      <span class="fila"><span class="modo-chip ${demo ? 'modo-chip--demo' : ''}" title="${esc(S.health.motor)}"><i></i>${demo ? 'Modo demo · datos en tu navegador' : 'Conectado a la API REST · ' + esc(S.health.motor)}</span>
      ${demo ? '<button class="enlace" data-reiniciar-demo style="color:#FFB68F;font-size:.82rem">Reiniciar datos</button>' : ''}</span></div></div>`;
  }

  // ---------- sesión ----------
  async function cargarSesion() {
    if (!window.Api.token.get()) { S.user = null; return; }
    try { S.user = await window.Api.get('/auth/me'); } catch (e) { window.Api.token.borrar(); S.user = null; }
  }
  function iniciarSesion(token, usuario) { window.Api.token.set(token); S.user = usuario; pintarHeader(); }
  function cerrarSesion() { window.Api.token.borrar(); S.user = null; pintarHeader(); toast('Cerraste sesión. ¡Vuelve pronto!'); location.hash = '#/'; }
  async function refrescarUsuario() { if (window.Api.token.get()) { try { S.user = await window.Api.get('/auth/me'); } catch (e) { /* sin cambios */ } } pintarHeader(); }
  function sesionExpirada() {
    window.Api.token.borrar(); S.user = null; pintarHeader();
    toast('Tu sesión expiró. Inicia sesión de nuevo.', 'error');
    location.hash = '#/login?volver=' + encodeURIComponent(location.hash.slice(1));
  }
  function requiereSesion() {
    if (S.user) return true;
    location.hash = '#/login?volver=' + encodeURIComponent(location.hash.slice(1) || '/');
    return false;
  }
  // Envoltura para llamadas desde las vistas: si la sesión expiró, redirige al login
  function manejarError(e, root) {
    if (e && e.status === 401 && window.Api.token.get()) { sesionExpirada(); return true; }
    if (e && e.data && e.data.campos && root) { marcarErrores(root, e.data.campos); toast(e.message, 'error'); return true; }
    toast((e && e.message) || 'Ocurrió un error', 'error');
    return false;
  }

  // ---------- enrutador ----------
  const rutas = {};
  let rutaAnterior = null, renderId = 0;
  function registrar(nombre, fn) { rutas[nombre] = fn; }
  async function render() {
    const mio = ++renderId;
    S.timers.forEach((t) => clearInterval(t)); S.timers = [];
    cerrarMenus();
    const h = location.hash.replace(/^#\/?/, '');
    const [r, qs] = h.split('?');
    const segs = r.split('/').filter(Boolean).map((s) => { try { return decodeURIComponent(s); } catch (e) { return s; } });
    const q = {}; new URLSearchParams(qs || '').forEach((v, k) => { q[k] = v; });
    const base = segs[0] || '';
    const fn = rutas[base] || rutas.__404;
    const main = $('#main');
    const misma = rutaAnterior === r;
    if (!misma) main.innerHTML = '<div class="cargando"><span class="spinner" role="status" aria-label="Cargando"></span></div>';
    const vista = document.createElement('div');
    vista.className = 'vista';
    let despues = null;
    try { despues = await fn(vista, segs.slice(1), q); }
    catch (e) {
      if (mio !== renderId) return;
      if (e && e.status === 401 && window.Api.token.get()) { sesionExpirada(); return; }
      vista.innerHTML = errorHtml(e);
    }
    if (mio !== renderId) return;
    main.replaceChildren(vista);
    if (typeof despues === 'function') despues();
    if (!misma) { window.scrollTo(0, 0); main.focus({ preventScroll: true }); }
    rutaAnterior = r;
    $$('[data-nav]').forEach((a) => a.classList.toggle('activo', a.dataset.nav === base));
  }
  function recargar() { render(); }

  // ---------- eventos globales ----------
  function conectarGlobales() {
    document.addEventListener('click', (e) => {
      const ag = e.target.closest('[data-agregar]');
      if (ag) {
        const p = S.prods[ag.dataset.agregar];
        if (!p) return;
        agregarAlCarrito({ productoId: p.id, cantidad: 1, presentacion: p.presentaciones ? p.presentaciones[0].id : null });
        const html = ag.innerHTML;
        ag.classList.add('ok'); ag.innerHTML = ic('check') + ' Agregado';
        setTimeout(() => { if (ag.isConnected) { ag.classList.remove('ok'); ag.innerHTML = html; } }, 1400);
        toast(p.nombre + ' se agregó al carrito', 'ok', { href: '#/carrito', texto: 'Ver carrito' });
        return;
      }
      const mu = e.target.closest('[data-menu-usuario]');
      if (mu) { e.stopPropagation(); if (mu.getAttribute('aria-expanded') === 'true') cerrarMenus(); else menuUsuario(mu); return; }
      if (e.target.closest('[data-cerrar-sesion]')) { e.preventDefault(); cerrarSesion(); return; }
      if (e.target.closest('[data-abrir-cajon]')) { abrirCajon(); return; }
      const car = e.target.closest('[data-carrusel]');
      if (car) { const pista = document.getElementById(car.dataset.carrusel); if (pista) pista.scrollBy({ left: +car.dataset.dir * pista.clientWidth * 0.9, behavior: 'smooth' }); return; }
      if (e.target.closest('[data-reiniciar-demo]')) {
        confirmar('Se borrarán los pedidos, cuentas y cambios hechos en esta demo, y volverán los datos de ejemplo.', { titulo: 'Reiniciar la demo', boton: 'Reiniciar', peligro: true })
          .then(async (ok) => { if (!ok) return; await window.Api.reiniciarDemo(); window.Api.token.borrar(); S.user = null; S.carrito = []; guardarCarrito(false); pintarHeader(); toast('Datos de la demo reiniciados'); location.hash = '#/'; recargar(); });
        return;
      }
      if (!e.target.closest('.menu-usuario')) cerrarMenus();
    });
  }

  async function arrancar() {
    try {
      S.health = await window.Api.init();
      S.meta = await window.Api.get('/meta');
    } catch (e) {
      $('#main').innerHTML = errorHtml(e);
      return;
    }
    S.carrito = cargarCarrito();
    await cargarSesion();
    pintarHeader();
    pintarPie();
    conectarGlobales();
    window.addEventListener('hashchange', render);
    render();
  }

  window.FIT = {
    $, $$, esc, cop, ic, norm, cap, fecha, fechaHora, hace, iniciales, titulo, esperar,
    S, toast, modal, confirmar, registrar, render, recargar,
    tarjetaProducto, carrusel, estrellas, artePara, etiquetaArte, vacioHtml, errorHtml,
    agregarAlCarrito, guardarCarrito, claveItem, cantidadCarrito,
    marcarErrores, limpiarErrores, errorEnCampo, validarAlSalir, conCarga, campo,
    formularioPago, conectarPago, leerPago, validarPagoCliente,
    pintarHeader, iniciarSesion, cerrarSesion, refrescarUsuario, requiereSesion, sesionExpirada, manejarError, arrancar
  };
})();

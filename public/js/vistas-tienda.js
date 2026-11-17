/* FITOPÍA · Vistas de la tienda: inicio, catálogo, producto, carrito y pago */
(function () {
  'use strict';
  const F = window.FIT, Api = window.Api;
  const { $, $$, esc, cop, ic, S } = F;

  const sumarHabiles = (n) => { const d = new Date(); let c = 0; while (c < n) { d.setDate(d.getDate() + 1); if (d.getDay() % 6 !== 0) c++; } return d; };
  const diaCorto = (d) => new Date(d).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });

  // ======================= INICIO (Épica 2) =======================
  const SLIDES = [
    { eyebrow: 'Maquinaria', titulo: 'Entrena en casa <em>como en el gym</em>', texto: 'Caminadoras, racks y mancuernas con hasta 12% de descuento y envío a todo el país.',
      cta: ['Ver maquinaria', '#/tienda/maquinaria'], cta2: ['Ver ofertas', '#/tienda?oferta=1'], arte: [['caminadora', '#E8743B'], ['mancuernas', '#378ADD']] },
    { eyebrow: 'Planes Fit', titulo: 'Tu plan, <em>tu ritmo</em>', texto: 'Rutinas personalizadas según tu objetivo y tu experiencia, desde $49.900 al mes. Cancela cuando quieras.',
      cta: ['Conocer los planes', '#/planes'], cta2: ['Ver la comunidad', '#/comunidad'], arte: [['kettlebell', '#E8743B', '16'], ['colchoneta', '#7F77DD']] },
    { eyebrow: 'Suplementos', titulo: 'Recupérate <em>mejor</em>', texto: 'Proteína, creatina y vitaminas de marcas confiables. Envío gratis en compras desde $160.000.',
      cta: ['Ver suplementos', '#/tienda/suplementos'], cta2: ['Más vendidos', '#/tienda?orden=vendidos'], arte: [['tarro', '#1D9E75', 'WHEY'], ['frasco', '#E8743B', 'MULTI']] },
    { eyebrow: 'Comunidad', titulo: 'Entrena <em>acompañado</em>', texto: 'Retos semanales, insignias y eventos en vivo con coaches invitados. Tu motivación, en grupo.',
      cta: ['Unirme a la comunidad', '#/comunidad'], cta2: ['Ver retos', '#/comunidad?tab=retos'], arte: [['bandas', '#1D9E75'], ['termo', '#378ADD']] }
  ];

  F.registrar('', async (v) => {
    F.titulo('');
    const [vendidos, nuevos, ofertas, posts, planes] = await Promise.all([
      Api.get('/products?orden=vendidos&limite=8'), Api.get('/products?orden=nuevos&limite=8'),
      Api.get('/products?oferta=1&limite=8'), Api.get('/community/posts'), Api.get('/fitness/planes')
    ]);
    const cats = S.meta.categorias.map((c) => `<a class="cat" href="#/tienda/${c.id}"><div class="cat__img">${window.Arte.producto(c.arte, c.color, 0, c.arte === 'tarro' ? 'WHEY' : '')}</div>
      <div class="cat__txt"><strong>${esc(c.nombre)} ${ic('der')}</strong><small>${esc(c.desc)}</small></div></a>`).join('') +
      `<a class="cat" href="#/planes"><div class="cat__img">${window.Arte.producto('kettlebell', '#7F77DD', 0, 'FIT')}</div><div class="cat__txt"><strong>Planes Fit ${ic('der')}</strong><small>Básico, Avanzado y Élite</small></div></a>`;
    v.innerHTML = `
      <section class="hero" aria-roledescription="carrusel" aria-label="Promociones destacadas" tabindex="0">
        <div class="contenedor hero__slides">${SLIDES.map((s, i) => `
          <div class="slide ${i === 0 ? 'activa' : ''}" aria-roledescription="diapositiva" aria-label="${i + 1} de ${SLIDES.length}" ${i ? 'aria-hidden="true"' : ''}>
            <div class="slide__texto"><span class="eyebrow" style="color:#FFB68F">${s.eyebrow}</span><h1>${s.titulo}</h1><p>${s.texto}</p>
              <div class="fila"><a class="btn btn--pri btn--lg" href="${s.cta[1]}">${s.cta[0]} ${ic('der')}</a><a class="btn btn--lg" style="background:transparent;color:#fff;border-color:rgba(255,255,255,.35)" href="${s.cta2[1]}">${s.cta2[0]}</a></div></div>
            <div class="slide__arte"><div class="burbuja b1">${window.Arte.producto(s.arte[0][0], s.arte[0][1], 0, s.arte[0][2])}</div><div class="burbuja b2">${window.Arte.producto(s.arte[1][0], s.arte[1][1], 1, s.arte[1][2])}</div></div>
          </div>`).join('')}</div>
        <div class="hero__ctrl"><button class="icon-btn" data-slide="-1" aria-label="Promoción anterior">${ic('izq')}</button>
          <div class="puntos">${SLIDES.map((s, i) => `<button data-ir-slide="${i}" class="${i === 0 ? 'activo' : ''}" aria-label="Ir a la promoción ${i + 1}"></button>`).join('')}</div>
          <button class="icon-btn" data-slide="1" aria-label="Siguiente promoción">${ic('der')}</button></div>
      </section>
      <div class="contenedor" style="margin-top:22px"><div class="ventajas">
        <div class="ventaja">${ic('camion')}<div><strong>Envío gratis</strong><small>Desde $160.000 a todo el país</small></div></div>
        <div class="ventaja">${ic('escudo')}<div><strong>Pagos seguros</strong><small>Wompi, Nequi, PSE y PayPal</small></div></div>
        <div class="ventaja">${ic('pesa')}<div><strong>Planes Fit</strong><small>Rutinas hechas para ti</small></div></div>
        <div class="ventaja">${ic('soporte')}<div><strong>Soporte en 24 h</strong><small>Te respondemos rápido</small></div></div>
      </div></div>
      <section class="seccion"><div class="contenedor"><div class="titulo-seccion"><div><span class="eyebrow">Categorías</span><h2>¿Qué quieres entrenar hoy?</h2></div><a class="enlace" href="#/tienda">Ver toda la tienda →</a></div><div class="cats">${cats}</div></div></section>
      ${F.carrusel('c-vendidos', 'Más vendidos', 'Lo que más compra la comunidad FITOPÍA', vendidos.items, 'seccion--blanca')}
      <section class="seccion"><div class="contenedor"><div class="titulo-seccion"><div><span class="eyebrow">Planes Fit</span><h2>Entrena con un plan hecho para ti</h2><p>Además, los suscriptores tienen descuento en toda la tienda.</p></div><a class="btn btn--osc" href="#/planes">Comparar planes</a></div>
        <div class="planes">${planes.planes.map((p) => `<div class="plan ${p.destacado ? 'plan--destacado' : ''}" style="--c:${p.color};--cbg:${window.Arte.mezclar(p.color, 0.86)}">${p.destacado ? '<span class="cinta">Popular</span>' : ''}
          <div class="plan__icono">${ic(p.icono)}</div><h3>Plan ${esc(p.nombre)}</h3><p class="muted" style="margin:0">${esc(p.lema)}</p>
          <div class="plan__precio">${cop(p.precio)}<small> /mes</small></div><ul>${p.beneficios.slice(0, 3).map((b) => `<li>${ic('check')}${esc(b)}</li>`).join('')}</ul>
          <div class="plan__acciones"><a class="btn ${p.destacado ? 'btn--pri' : 'btn--sec'}" href="#/planes">Ver plan ${esc(p.nombre)}</a></div></div>`).join('')}</div></div></section>
      ${F.carrusel('c-nuevos', 'Nuevos en la tienda', 'Recién llegados para tu entrenamiento', nuevos.items, 'seccion--blanca')}
      ${F.carrusel('c-ofertas', 'Ofertas', 'Precios especiales por tiempo limitado', ofertas.items)}
      <section class="seccion seccion--blanca"><div class="contenedor"><div class="titulo-seccion"><div><span class="eyebrow">Comunidad</span><h2>Lo que está pasando en FITOPÍA</h2></div><a class="btn btn--sec" href="#/comunidad">Ir a la comunidad</a></div>
        <div class="grid-prod">${posts.slice(0, 3).map((p) => `<a class="post" href="#/comunidad" style="display:block"><div class="post__cab"><span class="avatar" style="background:${esc(p.avatarColor)}">${esc(F.iniciales(p.autor))}</span><div><strong>${esc(p.autor)}</strong><br><small>${F.hace(p.fecha)}</small></div><span class="tipo-post tipo-post--${p.tipo}">${p.tipo}</span></div>
          <p style="margin:0">${esc(p.texto)}</p><div class="fila muted" style="margin-top:10px;font-size:.86rem">${ic('corazon')} ${p.likes} · ${ic('chat')} ${p.comentarios.length}</div></a>`).join('')}</div></div></section>`;

    // Carrusel principal: autoplay, controles y teclado (historia 2.1.1)
    let actual = 0;
    const slides = $$('.slide', v), puntos = $$('[data-ir-slide]', v);
    const ir = (i) => {
      actual = (i + slides.length) % slides.length;
      slides.forEach((s, k) => { s.classList.toggle('activa', k === actual); s.setAttribute('aria-hidden', k === actual ? 'false' : 'true'); });
      puntos.forEach((p, k) => p.classList.toggle('activo', k === actual));
    };
    let pausa = false;
    const hero = $('.hero', v);
    hero.addEventListener('mouseenter', () => { pausa = true; });
    hero.addEventListener('mouseleave', () => { pausa = false; });
    hero.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') ir(actual + 1); if (e.key === 'ArrowLeft') ir(actual - 1); });
    hero.addEventListener('click', (e) => {
      const b = e.target.closest('[data-slide]'); if (b) ir(actual + +b.dataset.slide);
      const p = e.target.closest('[data-ir-slide]'); if (p) ir(+p.dataset.irSlide);
    });
    S.timers.push(setInterval(() => { if (!pausa && !document.hidden) ir(actual + 1); }, 6000));
  });

  // ======================= CATÁLOGO (Épicas 3 a 6) =======================
  F.registrar('tienda', async (v, segs, q) => {
    const cat = segs[0] || '';
    const info = S.meta.categorias.find((c) => c.id === cat);
    const params = new URLSearchParams();
    if (cat) params.set('cat', cat);
    ['q', 'tipo', 'marca', 'talla', 'min', 'max', 'orden', 'pagina', 'oferta', 'disponible'].forEach((k) => { if (q[k]) params.set(k, q[k]); });
    params.set('limite', '12');
    const r = await Api.get('/products?' + params.toString());
    const tituloTxt = q.q ? `Resultados para “${q.q}”` : info ? info.nombre : q.oferta ? 'Ofertas' : 'Toda la tienda';
    F.titulo(tituloTxt);
    const sel = (k) => (q[k] ? q[k].split(',') : []);
    const tipos = sel('tipo'), marcas = sel('marca');
    const hayFiltros = ['tipo', 'marca', 'talla', 'min', 'max', 'disponible'].some((k) => q[k]);
    const enlace = (cambios) => {
      const nq = Object.assign({}, q, cambios);
      Object.keys(nq).forEach((k) => { if (nq[k] === '' || nq[k] == null) delete nq[k]; });
      const qs = new URLSearchParams(nq).toString();
      return '#/tienda' + (cat ? '/' + cat : '') + (qs ? '?' + qs : '');
    };
    const pags = [];
    for (let i = 1; i <= r.paginas; i++) pags.push(i === r.pagina ? `<span class="activa" aria-current="page">${i}</span>` : `<a href="${enlace({ pagina: i })}">${i}</a>`);
    v.innerHTML = `<div class="contenedor">
      <nav class="migas" aria-label="Ruta"><a href="#/">Inicio</a><span aria-hidden="true">/</span>${info ? `<a href="#/tienda">Tienda</a><span aria-hidden="true">/</span><span>${esc(info.nombre)}</span>` : '<span>Tienda</span>'}</nav>
      <div style="margin:6px 0 20px"><h1>${esc(tituloTxt)}</h1><p class="muted" style="margin:0">${info ? esc(info.desc) : q.q ? 'Buscamos en nombres, marcas y descripciones.' : 'Maquinaria, ropa, suplementos y accesorios para tu entrenamiento.'}</p></div>
      ${!cat ? `<div class="chips" style="margin-bottom:18px"><a class="chip ${!cat ? 'activo' : ''}" href="#/tienda${q.q ? '?q=' + encodeURIComponent(q.q) : ''}">Todo</a>${S.meta.categorias.map((c) => `<a class="chip" href="#/tienda/${c.id}${q.q ? '?q=' + encodeURIComponent(q.q) : ''}">${esc(c.nombre)}</a>`).join('')}</div>` : ''}
      <div class="tienda">
        <aside class="filtros" aria-label="Filtros">
          <div class="entre" style="margin-bottom:6px"><strong class="fila" style="gap:6px">${ic('filtro')} Filtros</strong>${hayFiltros ? `<a class="enlace" style="font-size:.85rem" href="${enlace({ tipo: '', marca: '', talla: '', min: '', max: '', disponible: '', pagina: '' })}">Limpiar</a>` : ''}</div>
          ${r.facetas.tipos.length > 1 || tipos.length ? `<div class="filtro"><h4>Tipo</h4>${r.facetas.tipos.map((t) => `<label class="check"><input type="checkbox" data-filtro="tipo" value="${esc(t)}" ${tipos.includes(t) ? 'checked' : ''}> ${esc(F.cap(t))}</label>`).join('')}</div>` : ''}
          ${r.facetas.marcas.length > 1 || marcas.length ? `<div class="filtro"><h4>Marca</h4>${r.facetas.marcas.map((m) => `<label class="check"><input type="checkbox" data-filtro="marca" value="${esc(m)}" ${marcas.includes(m) ? 'checked' : ''}> ${esc(m)}</label>`).join('')}</div>` : ''}
          ${r.facetas.tallas.length ? `<div class="filtro"><h4>Talla</h4><div class="chips">${r.facetas.tallas.map((t) => `<a class="chip ${q.talla === t ? 'activo' : ''}" href="${enlace({ talla: q.talla === t ? '' : t, pagina: '' })}">${t}</a>`).join('')}</div></div>` : ''}
          <div class="filtro"><h4>Precio (COP)</h4><form class="rango" data-precio><input class="input" name="min" inputmode="numeric" placeholder="Mínimo" value="${esc(q.min || '')}" aria-label="Precio mínimo"><input class="input" name="max" inputmode="numeric" placeholder="Máximo" value="${esc(q.max || '')}" aria-label="Precio máximo"><button class="btn btn--sec btn--sm" style="grid-column:1/-1">Aplicar</button></form></div>
          <div class="filtro"><label class="check"><input type="checkbox" data-disponible ${q.disponible ? 'checked' : ''}> Solo disponibles</label></div>
        </aside>
        <div>
          <div class="barra-tienda"><span class="muted">${r.total} ${r.total === 1 ? 'producto' : 'productos'}</span>
            <label class="fila" style="font-size:.92rem;font-weight:600">Ordenar por <select class="input" style="width:auto;padding:8px 12px" data-orden>
              ${[['relevancia', 'Relevancia'], ['vendidos', 'Más vendidos'], ['nuevos', 'Más nuevos'], ['precio-asc', 'Menor precio'], ['precio-desc', 'Mayor precio'], ['rating', 'Mejor calificados']].map(([k, t]) => `<option value="${k}" ${(q.orden || 'relevancia') === k ? 'selected' : ''}>${t}</option>`).join('')}</select></label></div>
          ${r.items.length ? `<div class="grid-prod grid-prod--3">${r.items.map(F.tarjetaProducto).join('')}</div>`
    : F.vacioHtml('buscar', 'No encontramos productos', 'Prueba con otra palabra o quita algunos filtros.', `<a class="btn btn--pri" href="#/tienda">Ver toda la tienda</a>`)}
          ${r.paginas > 1 ? `<nav class="paginacion" aria-label="Paginación">${pags.join('')}</nav>` : ''}
        </div></div></div>`;
    v.addEventListener('change', (e) => {
      const t = e.target;
      if (t.dataset.filtro) {
        const vals = $$(`[data-filtro="${t.dataset.filtro}"]:checked`, v).map((x) => x.value);
        location.hash = enlace({ [t.dataset.filtro]: vals.join(','), pagina: '' });
      }
      if (t.matches('[data-orden]')) location.hash = enlace({ orden: t.value === 'relevancia' ? '' : t.value, pagina: '' });
      if (t.matches('[data-disponible]')) location.hash = enlace({ disponible: t.checked ? '1' : '', pagina: '' });
    });
    v.addEventListener('submit', (e) => {
      if (!e.target.matches('[data-precio]')) return;
      e.preventDefault();
      const f = e.target, n = (x) => String(x || '').replace(/\D/g, '');
      location.hash = enlace({ min: n(f.min.value), max: n(f.max.value), pagina: '' });
    });
  });

  // ======================= PRODUCTO =======================
  F.registrar('producto', async (v, segs) => {
    const d = await Api.get('/products/' + encodeURIComponent(segs[0] || ''));
    const p = d.producto;
    S.prods[p.id] = p;
    d.tambienCompraron.concat(d.relacionados).forEach((x) => { S.prods[x.id] = x; });
    F.titulo(p.nombre);
    const cat = S.meta.categorias.find((c) => c.id === p.cat);
    const st = { vista: 0, talla: null, pres: p.presentaciones ? p.presentaciones[0].id : null, cantidad: 1, orden: 'recientes', rating: 0 };
    const precioActual = () => (p.presentaciones ? p.presentaciones.find((x) => x.id === st.pres).precio : p.precio);
    const disponible = () => (p.tallas ? (st.talla ? p.tallas[st.talla] : Object.values(p.tallas).reduce((a, b) => a + b, 0)) : p.stock);
    const sub = S.user && S.user.suscripcion;
    const esSuple = p.cat === 'suplementos';

    function htmlStock() {
      const n = disponible();
      if (n <= 0) return `<span class="stock stock--no">${p.tallas && st.talla ? 'Talla ' + st.talla + ' agotada' : 'Agotado'}</span>`;
      if (n <= 3) return `<span class="stock stock--poco">¡Últimas ${n} unidades!</span>`;
      return `<span class="stock stock--ok">Disponible${p.tallas && st.talla ? ' en talla ' + st.talla : ''}</span>`;
    }
    function htmlCompra() {
      const precio = precioActual();
      const desc = p.precioAntes && !p.presentaciones ? Math.round((1 - p.precio / p.precioAntes) * 100) : 0;
      const n = disponible();
      return `<div class="precio"><strong>${cop(precio)}</strong>${p.precioAntes && !p.presentaciones ? `<s>${cop(p.precioAntes)}</s><span class="badge badge--oferta">-${desc}%</span>` : ''}</div>
        <small class="muted">IVA incluido</small>
        ${sub && sub.descTienda ? `<div class="nota nota--naranja" style="margin-top:12px">${ic('corona')}<div>Con tu plan <strong>${esc(sub.plan)}</strong> lo pagas a <strong>${cop(precio * (100 - sub.descTienda) / 100)}</strong> (−${sub.descTienda}%). El descuento se aplica en el carrito.</div></div>` : ''}
        <div style="margin-top:14px">${htmlStock()}</div>
        ${p.tallas ? `<div class="selector"><h4><span>Talla ${st.talla ? '· ' + st.talla : ''}</span><span class="tenue" style="font-weight:500">Tabla: S (36-38) · M (38-40) · L (40-42) · XL (42-44)</span></h4>
          <div class="chips" role="radiogroup" aria-label="Talla">${Object.keys(p.tallas).map((t) => `<button type="button" class="chip ${st.talla === t ? 'activo' : ''}" data-talla="${t}" ${p.tallas[t] <= 0 ? 'disabled title="Agotada"' : ''} role="radio" aria-checked="${st.talla === t}">${t}</button>`).join('')}</div>
          <div data-error-talla></div></div>` : ''}
        ${p.presentaciones && p.presentaciones.length > 1 ? `<div class="selector"><h4>Presentación</h4><div class="chips" role="radiogroup" aria-label="Presentación">${p.presentaciones.map((x) => `<button type="button" class="chip ${st.pres === x.id ? 'activo' : ''}" data-pres="${x.id}" role="radio" aria-checked="${st.pres === x.id}">${esc(x.etiqueta)} · ${cop(x.precio)}</button>`).join('')}</div></div>` : ''}
        <div class="selector"><h4>Cantidad</h4><div class="cantidad"><button type="button" data-cant="-1" aria-label="Menos">${ic('menos')}</button><span aria-live="polite">${st.cantidad}</span><button type="button" data-cant="1" aria-label="Más">${ic('mas')}</button></div></div>
        <div class="comprar"><button class="btn btn--pri btn--lg" data-agregar-prod ${n <= 0 && (!p.tallas || st.talla) ? 'disabled' : ''}>${ic('carrito')} Agregar al carrito</button>
          <button class="btn btn--osc btn--lg" data-comprar-ya ${n <= 0 && (!p.tallas || st.talla) ? 'disabled' : ''}>Comprar ahora</button></div>
        <div class="pila">
          <div class="nota">${ic('camion')}<div><strong>Llega entre el ${diaCorto(sumarHabiles(S.meta.envios.estandar.dias[0]))} y el ${diaCorto(sumarHabiles(S.meta.envios.estandar.dias[1]))}</strong> con envío estándar. Envío gratis desde ${cop(S.meta.envioGratisDesde)}${sub && sub.envioGratis ? ' (y siempre con tu plan Élite)' : ''}.</div></div>
          <div class="nota">${ic('escudo')}<div><strong>Compra protegida.</strong> Si el pago falla, no se descuenta inventario ni se cobra nada.</div></div>
        </div>`;
    }
    function htmlResenas() {
      const lista = d.resenas.slice().sort((a, b) => (st.orden === 'mejor' ? b.rating - a.rating || b.fecha - a.fecha : st.orden === 'utiles' ? b.util - a.util || b.fecha - a.fecha : b.fecha - a.fecha));
      const total = d.resenas.length;
      const prom = total ? d.resenas.reduce((a, r) => a + r.rating, 0) / total : 0;
      return `<div class="resenas"><div><div class="tarjeta tarjeta--plana resumen-rating"><div class="grande">${prom.toFixed(1).replace('.', ',')}</div>${F.estrellas(prom, undefined, true)}<p class="muted" style="margin:6px 0 14px">${total} ${total === 1 ? 'reseña' : 'reseñas'}</p>
        ${d.distribucion.map((x) => `<div class="dist"><span>${x.estrellas} ★</span><div class="dist__barra"><span style="width:${total ? x.total / total * 100 : 0}%"></span></div><span>${total ? Math.round(x.total / total * 100) : 0}%</span></div>`).join('')}</div>
        <div class="tarjeta tarjeta--plana" style="margin-top:14px">${S.user ? `<form data-resena class="pila" novalidate><h3 style="margin:0">${d.miResena ? 'Edita tu reseña' : 'Escribe una reseña'}</h3>
          <div class="campo"><span style="font-size:.88rem;font-weight:650">Tu calificación</span><div class="estrellas-input" role="radiogroup" aria-label="Calificación">${[5, 4, 3, 2, 1].map((n) => `<input type="radio" name="rating" id="r${n}" value="${n}" ${(d.miResena ? d.miResena.rating : st.rating) === n ? 'checked' : ''}><label for="r${n}" title="${n} estrellas">★</label>`).join('')}</div></div>
          ${F.campo('comentario', 'Comentario', { tipo: 'textarea', valor: d.miResena ? d.miResena.comentario : '', attrs: { maxlength: 400, placeholder: esSuple ? 'Cuéntanos del sabor, la efectividad y la calidad' : p.cat === 'accesorios' ? 'Cuéntanos de su durabilidad, comodidad y utilidad' : '¿Qué te pareció el producto?' } })}
          <button class="btn btn--pri">Publicar reseña</button></form>` : `<p style="margin:0">¿Ya lo usaste? <a class="enlace" href="#/login?volver=${encodeURIComponent('/producto/' + p.id)}">Inicia sesión</a> para dejar tu reseña.</p>`}</div></div>
        <div><div class="entre" style="margin-bottom:6px"><h3 style="margin:0">Opiniones de clientes</h3><label class="fila" style="font-size:.9rem">Ordenar <select class="input" style="width:auto;padding:7px 10px" data-orden-res>
          <option value="recientes" ${st.orden === 'recientes' ? 'selected' : ''}>Más recientes</option><option value="mejor" ${st.orden === 'mejor' ? 'selected' : ''}>Mejor puntuadas</option><option value="utiles" ${st.orden === 'utiles' ? 'selected' : ''}>Más útiles</option></select></label></div>
          ${lista.length ? lista.map((r) => `<div class="resena"><div class="entre"><div class="fila"><span class="avatar" style="width:34px;height:34px;font-size:.8rem;background:var(--navy)">${esc(F.iniciales(r.autor))}</span><div><strong>${esc(r.autor)}</strong><br><small class="tenue">${F.fecha(r.fecha)}</small></div></div>${F.estrellas(r.rating)}</div>
            ${r.compraVerificada ? `<span class="verificada" style="margin-top:6px">${ic('check')} Compra verificada</span>` : ''}<p style="margin:8px 0">${esc(r.comentario)}</p>
            <button class="btn btn--fant btn--sm" data-util="${r.id}" ${!S.user ? 'disabled title="Inicia sesión para votar"' : ''}>${ic('check')} ${r.meParece ? 'Te pareció útil' : '¿Te fue útil?'} (${r.util})</button></div>`).join('') : '<p class="muted">Todavía no hay reseñas. ¡Sé el primero!</p>'}
        </div></div>`;
    }
    const filas = Object.entries(p.specs || {});
    v.innerHTML = `<div class="contenedor">
      <nav class="migas" aria-label="Ruta"><a href="#/">Inicio</a><span aria-hidden="true">/</span><a href="#/tienda/${p.cat}">${esc(cat ? cat.nombre : p.cat)}</a><span aria-hidden="true">/</span><a href="#/tienda/${p.cat}?tipo=${encodeURIComponent(p.tipo)}">${esc(F.cap(p.tipo))}</a><span aria-hidden="true">/</span><span>${esc(p.nombre)}</span></nav>
      <div class="producto">
        <div class="galeria"><div class="galeria__principal" data-zoom title="Pasa el cursor para acercar">${F.artePara(p, 0)}</div>
          <div class="galeria__miniaturas">${['Frontal', 'Lateral', 'Detalle'].map((n, i) => `<button class="${i === 0 ? 'activa' : ''}" data-vista="${i}" aria-label="Vista ${n}">${F.artePara(p, i)}</button>`).join('')}</div></div>
        <div class="info-prod"><span class="card-prod__marca">${esc(p.marca)} · ${esc(F.cap(p.tipo))}</span><h1>${esc(p.nombre)}</h1>
          <a href="#resenas" data-ir-resenas>${F.estrellas(p.rating, p.resenas)}</a>
          <div data-compra style="margin-top:10px">${htmlCompra()}</div></div>
      </div>
      <div class="dos-col" style="grid-template-columns:1fr 1fr;padding-bottom:10px">
        <section class="tarjeta tarjeta--plana"><h3>Descripción</h3><p class="muted" style="margin:0">${esc(p.desc)}</p></section>
        <section class="tarjeta tarjeta--plana"><h3>${esSuple ? 'Tabla nutricional' : 'Especificaciones técnicas'}</h3>${filas.length ? `<table class="specs"><tbody>${filas.map(([k, val]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(val)}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">Sin especificaciones registradas.</p>'}</section>
      </div></div>
      ${d.tambienCompraron.length ? `<section class="seccion"><div class="contenedor"><div class="titulo-seccion"><div><h2>Otros usuarios también compraron</h2><p>Complementa tu entrenamiento</p></div></div><div class="grid-prod">${d.tambienCompraron.map(F.tarjetaProducto).join('')}</div></div></section>` : ''}
      ${F.carrusel('c-relacionados', 'Productos relacionados', p.tallas ? 'Prendas similares por estilo' : 'De la misma categoría', d.relacionados, 'seccion--blanca')}
      <section class="seccion" id="resenas"><div class="contenedor"><h2>Reseñas</h2><div data-resenas>${htmlResenas()}</div></div></section>`;

    const zona = $('[data-compra]', v);
    const repintar = () => { zona.innerHTML = htmlCompra(); };
    const principal = $('[data-zoom]', v);
    principal.addEventListener('mousemove', (e) => {
      const r = principal.getBoundingClientRect();
      const svg = principal.querySelector('svg');
      svg.style.transformOrigin = ((e.clientX - r.left) / r.width * 100) + '% ' + ((e.clientY - r.top) / r.height * 100) + '%';
      principal.classList.add('zoom');
    });
    principal.addEventListener('mouseleave', () => principal.classList.remove('zoom'));

    function agregar() {
      if (p.tallas && !st.talla) {
        const box = $('[data-error-talla]', v);
        box.innerHTML = `<p class="alerta alerta--error shake" style="margin-top:8px">${ic('alerta')} Elige una talla para continuar</p>`;
        return false;
      }
      if (disponible() < st.cantidad) { F.toast('Solo hay ' + disponible() + ' unidades disponibles', 'error'); return false; }
      F.agregarAlCarrito({ productoId: p.id, cantidad: st.cantidad, talla: st.talla, presentacion: st.pres });
      return true;
    }
    v.addEventListener('click', async (e) => {
      const t = e.target;
      const vb = t.closest('[data-vista]');
      if (vb) { st.vista = +vb.dataset.vista; principal.innerHTML = F.artePara(p, st.vista); $$('[data-vista]', v).forEach((x) => x.classList.toggle('activa', x === vb)); return; }
      const tb = t.closest('[data-talla]');
      if (tb && !tb.disabled) { st.talla = tb.dataset.talla; st.cantidad = Math.min(st.cantidad, Math.max(1, disponible())); repintar(); return; }
      const pb = t.closest('[data-pres]');
      if (pb) { st.pres = pb.dataset.pres; repintar(); return; }
      const cb = t.closest('[data-cant]');
      if (cb) { st.cantidad = Math.max(1, Math.min(Math.min(20, Math.max(1, disponible())), st.cantidad + +cb.dataset.cant)); repintar(); return; }
      const ab = t.closest('[data-agregar-prod]');
      if (ab) {
        if (agregar()) {
          ab.classList.add('ok'); ab.innerHTML = ic('check') + ' ¡Agregado!';
          F.toast(p.nombre + ' se agregó al carrito', 'ok', { href: '#/carrito', texto: 'Ver carrito' });
          setTimeout(() => { if (ab.isConnected) repintar(); }, 1300);
        }
        return;
      }
      if (t.closest('[data-comprar-ya]')) { if (agregar()) location.hash = '#/carrito'; return; }
      if (t.closest('[data-ir-resenas]')) { e.preventDefault(); $('#resenas', v).scrollIntoView({ behavior: 'smooth' }); return; }
      const ub = t.closest('[data-util]');
      if (ub && S.user) {
        try { const r = await Api.post(`/products/${encodeURIComponent(p.id)}/reviews/${ub.dataset.util}/util`); const rv = d.resenas.find((x) => x.id === ub.dataset.util); rv.util = r.util; rv.meParece = r.meParece; $('[data-resenas]', v).innerHTML = htmlResenas(); }
        catch (err) { F.manejarError(err); }
      }
    });
    v.addEventListener('change', (e) => { if (e.target.matches('[data-orden-res]')) { st.orden = e.target.value; $('[data-resenas]', v).innerHTML = htmlResenas(); } });
    v.addEventListener('submit', async (e) => {
      if (!e.target.matches('[data-resena]')) return;
      e.preventDefault();
      const f = e.target;
      const rating = (f.querySelector('[name="rating"]:checked') || {}).value;
      try {
        await F.conCarga(f.querySelector('.btn'), () => Api.post(`/products/${encodeURIComponent(p.id)}/reviews`, { rating, comentario: f.comentario.value }), 'Publicando…');
        F.toast('¡Gracias por tu reseña!');
        F.recargar();
      } catch (err) { if (!rating) F.toast('Elige de 1 a 5 estrellas', 'error'); else F.manejarError(err, f); }
    });
  });

  // ======================= CARRITO (Épica 8) =======================
  F.registrar('carrito', async (v) => {
    F.titulo('Carrito');
    if (!S.carrito.length) {
      v.innerHTML = `<div class="contenedor">${F.vacioHtml('carrito', 'Tu carrito está vacío', 'Explora la tienda y agrega lo que necesitas para entrenar.', '<a class="btn btn--pri btn--lg" href="#/tienda">Ir a la tienda</a>')}</div>`;
      return;
    }
    let q = null, errorCupon = '';
    async function cotizar() {
      try { q = await Api.post('/orders/quote', { items: S.carrito, cupon: S.cupon, envio: S.envio }); }
      catch (e) {
        if (e.data && e.data.productoId) { S.carrito = S.carrito.filter((x) => x.productoId !== e.data.productoId); F.guardarCarrito(false); F.toast(e.message, 'error'); if (S.carrito.length) return cotizar(); }
        throw e;
      }
      if (q.cuponError) { errorCupon = q.cuponError; S.cupon = ''; q = await Api.post('/orders/quote', { items: S.carrito, envio: S.envio }); }
    }
    await cotizar();
    function pintar() {
      if (!S.carrito.length) { F.recargar(); return; }
      const faltante = q.lineas.filter((l) => l.cantidad > l.disponible);
      const pct = Math.min(100, Math.round((1 - q.faltaEnvioGratis / S.meta.envioGratisDesde) * 100));
      v.innerHTML = `<div class="contenedor"><nav class="migas"><a href="#/">Inicio</a><span aria-hidden="true">/</span><span>Carrito</span></nav>
        <h1>Tu carrito <span class="tenue" style="font-weight:600">(${F.cantidadCarrito()})</span></h1>
        <div class="dos-col"><div class="tarjeta">
          ${q.lineas.map((l, i) => `<div class="item-carrito"><a class="mini" href="#/producto/${esc(l.productoId)}">${window.Arte.producto(l.arte, l.color, 0, F.etiquetaArte(l))}</a>
            <div><a href="#/producto/${esc(l.productoId)}"><strong>${esc(l.nombre)}</strong></a><br><small class="muted">${esc(l.variante || '')}${l.variante ? ' · ' : ''}${cop(l.precio)} c/u</small>
              ${l.cantidad > l.disponible ? `<p class="alerta alerta--error" style="margin:8px 0 0;padding:7px 10px;font-size:.84rem">${ic('alerta')} ${l.disponible > 0 ? 'Solo quedan ' + l.disponible : 'Agotado'}</p>` : ''}</div>
            <div class="derecha"><strong>${cop(l.total)}</strong><div class="fila" style="gap:6px"><div class="cantidad cantidad--sm"><button data-cant="-1" data-i="${i}" aria-label="Menos">${ic('menos')}</button><span>${l.cantidad}</span><button data-cant="1" data-i="${i}" aria-label="Más">${ic('mas')}</button></div>
              <button class="icon-btn" data-quitar="${i}" aria-label="Quitar ${esc(l.nombre)}" title="Quitar">${ic('basura')}</button></div></div></div>`).join('')}
        </div>
        <aside class="tarjeta resumen"><h3>Resumen de compra</h3>
          ${q.faltaEnvioGratis > 0 ? `<div class="nota nota--naranja" style="margin-bottom:12px;display:block"><div class="fila" style="gap:8px;margin-bottom:8px">${ic('camion')} <span>Te faltan <strong>${cop(q.faltaEnvioGratis)}</strong> para el envío gratis</span></div><div class="barra-progreso"><span style="width:${pct}%"></span></div></div>`
    : q.envio.gratisMotivo ? `<div class="nota nota--verde" style="margin-bottom:12px">${ic('camion')}<div><strong>¡Tienes envío gratis!</strong> ${esc(q.envio.gratisMotivo)}</div></div>` : ''}
          <div class="linea-resumen"><span>Subtotal</span><span>${cop(q.subtotal)}</span></div>
          ${q.descSuscriptor ? `<div class="linea-resumen"><span>Descuento plan ${esc(q.planSuscriptor)}</span><span class="desc">−${cop(q.descSuscriptor)}</span></div>` : ''}
          ${q.descCupon ? `<div class="linea-resumen"><span>Cupón ${esc(q.cupon.codigo)}</span><span class="desc">−${cop(q.descCupon)}</span></div>` : ''}
          <div class="linea-resumen"><span>Envío ${esc(q.envio.nombre.toLowerCase())}</span><span>${q.envio.precio ? cop(q.envio.precio) : '<span class="desc">Gratis</span>'}</span></div>
          <div class="linea-resumen total"><span>Total</span><span>${cop(q.total)}</span></div>
          <small class="tenue">Incluye IVA (19%) por ${cop(q.ivaIncluido)}</small>
          <h4 style="margin:18px 0 4px;font-size:.9rem">Tipo de envío</h4>
          ${Object.values(S.meta.envios).map((e) => `<label class="opcion-envio"><input type="radio" name="envio" value="${e.id}" ${S.envio === e.id ? 'checked' : ''}><span class="grow"><strong>${esc(e.nombre)}</strong><br><small class="muted">Llega entre el ${diaCorto(sumarHabiles(e.dias[0]))} y el ${diaCorto(sumarHabiles(e.dias[1]))}</small></span><strong>${q.envio.id === e.id ? (q.envio.precio ? cop(q.envio.precio) : 'Gratis') : cop(e.precio)}</strong></label>`).join('')}
          <h4 style="margin:18px 0 6px;font-size:.9rem">Código de descuento</h4>
          ${q.cupon ? `<div class="alerta alerta--ok">${ic('etiqueta')}<span style="flex:1">${esc(q.cupon.codigo)} · ${esc(q.cupon.desc)}</span><button class="enlace" data-quitar-cupon>Quitar</button></div>`
    : `<form class="fila" data-cupon style="flex-wrap:nowrap"><div class="campo ${errorCupon ? 'invalido' : ''}" style="flex:1"><input name="cupon" placeholder="Ej. FITO10" aria-label="Código de descuento" style="text-transform:uppercase"></div><button class="btn btn--sec">Aplicar</button></form>
            ${errorCupon ? `<p class="alerta alerta--error" style="margin:8px 0 0">${ic('alerta')} ${esc(errorCupon)}</p>` : ''}<small class="tenue">Prueba: ${S.meta.cuponesDemo.map((c) => `<b>${esc(c.codigo)}</b>`).join(' o ')}</small>`}
          ${faltante.length ? `<p class="alerta alerta--error" style="margin-top:16px">${ic('alerta')} Ajusta las cantidades marcadas para continuar.</p>` : ''}
          <a class="btn btn--pri btn--lg btn--bloque" style="margin-top:18px" href="${S.user ? '#/checkout' : '#/login?volver=%2Fcheckout'}" ${faltante.length ? 'aria-disabled="true" data-bloqueado' : ''}>${ic('candado')} Finalizar compra</a>
          ${!S.user ? '<p class="tenue centro" style="margin:8px 0 0;font-size:.84rem">Te pediremos iniciar sesión para continuar.</p>' : ''}
          <a class="btn btn--fant btn--bloque" style="margin-top:6px" href="#/tienda">Seguir comprando</a>
        </aside></div></div>`;
    }
    pintar();
    async function actualizar() { errorCupon = ''; await cotizar(); pintar(); }
    v.addEventListener('click', async (e) => {
      const c = e.target.closest('[data-cant]');
      if (c) { const it = S.carrito[+c.dataset.i]; it.cantidad = Math.max(1, Math.min(20, it.cantidad + +c.dataset.cant)); F.guardarCarrito(false); await actualizar(); return; }
      const qb = e.target.closest('[data-quitar]');
      if (qb) { const l = q.lineas[+qb.dataset.quitar]; S.carrito.splice(+qb.dataset.quitar, 1); F.guardarCarrito(false); F.toast(l.nombre + ' se quitó del carrito', 'info'); if (S.carrito.length) await actualizar(); else F.recargar(); return; }
      if (e.target.closest('[data-quitar-cupon]')) { S.cupon = ''; await actualizar(); return; }
      if (e.target.closest('[data-bloqueado]')) { e.preventDefault(); F.toast('Hay productos sin suficiente stock', 'error'); }
    });
    v.addEventListener('change', async (e) => { if (e.target.name === 'envio') { S.envio = e.target.value; await actualizar(); } });
    v.addEventListener('submit', async (e) => {
      if (!e.target.matches('[data-cupon]')) return;
      e.preventDefault();
      const val = e.target.cupon.value.trim().toUpperCase();
      if (!val) return;
      S.cupon = val; errorCupon = '';
      await cotizar(); pintar();
      if (q.cupon) F.toast('Cupón ' + q.cupon.codigo + ' aplicado');
    });
  });

  // ======================= PAGO (Épica 9) =======================
  F.registrar('checkout', async (v) => {
    F.titulo('Finalizar compra');
    if (!F.requiereSesion()) return;
    if (!S.carrito.length) { location.hash = '#/carrito'; return; }
    const q = await Api.post('/orders/quote', { items: S.carrito, cupon: S.cupon, envio: S.envio });
    const u = S.user;
    v.innerHTML = `<div class="contenedor"><nav class="migas"><a href="#/">Inicio</a><span aria-hidden="true">/</span><a href="#/carrito">Carrito</a><span aria-hidden="true">/</span><span>Pago</span></nav>
      <div data-formulario><h1>Finalizar compra</h1>
      <div class="dos-col"><form class="pila" novalidate data-checkout>
        <section class="tarjeta"><div class="paso-titulo"><span class="num">1</span><h3>Datos de envío</h3></div>
          <div class="form-grid">
            ${F.campo('nombre', 'Nombre de quien recibe', { valor: u.nombre, attrs: { autocomplete: 'name' } })}
            ${F.campo('telefono', 'Celular', { valor: u.telefono, attrs: { inputmode: 'numeric', autocomplete: 'tel', placeholder: '300 123 4567', maxlength: 12 } })}
            ${F.campo('direccion', 'Dirección', { clase: 'completo', valor: u.direccion, attrs: { autocomplete: 'street-address', placeholder: 'Calle, número, barrio, apartamento' } })}
            ${F.campo('ciudad', 'Ciudad', { valor: u.ciudad, attrs: { autocomplete: 'address-level2' } })}
            ${F.campo('notas', 'Indicaciones (opcional)', { attrs: { placeholder: 'Ej. dejar en portería' } })}
            <label class="casilla completo"><input type="checkbox" name="guardar" ${u.direccion ? '' : 'checked'}> Guardar estos datos en mi perfil</label>
          </div></section>
        <section class="tarjeta"><div class="paso-titulo"><span class="num">2</span><h3>Método de pago</h3></div>${F.formularioPago('tarjeta')}</section>
      </form>
      <aside class="tarjeta resumen"><h3>Tu pedido</h3>
        ${q.lineas.map((l) => `<div class="fila" style="flex-wrap:nowrap;padding:8px 0;border-bottom:1px solid var(--borde)"><div style="width:52px;height:52px;border-radius:10px;overflow:hidden;flex:none">${window.Arte.producto(l.arte, l.color, 0, F.etiquetaArte(l))}</div><div style="flex:1;font-size:.9rem"><strong>${esc(l.nombre)}</strong><br><small class="muted">${esc(l.variante || '')} ×${l.cantidad}</small></div><strong style="font-size:.92rem">${cop(l.total)}</strong></div>`).join('')}
        <div style="margin-top:10px"><div class="linea-resumen"><span>Subtotal</span><span>${cop(q.subtotal)}</span></div>
        ${q.descSuscriptor ? `<div class="linea-resumen"><span>Descuento plan ${esc(q.planSuscriptor)}</span><span class="desc">−${cop(q.descSuscriptor)}</span></div>` : ''}
        ${q.descCupon ? `<div class="linea-resumen"><span>Cupón ${esc(q.cupon.codigo)}</span><span class="desc">−${cop(q.descCupon)}</span></div>` : ''}
        <div class="linea-resumen"><span>Envío ${esc(q.envio.nombre.toLowerCase())}</span><span>${q.envio.precio ? cop(q.envio.precio) : '<span class="desc">Gratis</span>'}</span></div>
        <div class="linea-resumen total"><span>Total</span><span>${cop(q.total)}</span></div><small class="tenue">IVA incluido: ${cop(q.ivaIncluido)}</small></div>
        <button class="btn btn--pri btn--lg btn--bloque" style="margin-top:18px" data-pagar>${ic('candado')} Pagar ${cop(q.total)}</button>
        <p class="tenue centro" style="font-size:.8rem;margin:10px 0 0">Al pagar aceptas los términos y la política de tratamiento de datos (Ley 1581 de 2012).</p>
      </aside></div></div>
      <div data-resultado></div></div>`;
    const form = $('[data-checkout]', v);
    const pago = F.conectarPago(form);
    const REGLAS = {
      nombre: (x) => (x.trim().length < 3 ? 'Escribe el nombre de quien recibe' : ''),
      telefono: (x) => (/^3\d{9}$/.test(x.replace(/\D/g, '')) ? '' : 'Celular de 10 dígitos'),
      direccion: (x) => (x.trim().length < 6 ? 'Escribe una dirección completa' : ''),
      ciudad: (x) => (x.trim().length < 3 ? 'Escribe la ciudad' : '')
    };
    F.validarAlSalir(form, REGLAS);
    const res = $('[data-resultado]', v), formulario = $('[data-formulario]', v);

    function mostrarResultado(html) { formulario.classList.add('oculto'); res.innerHTML = html; window.scrollTo({ top: 0 }); }
    function pasosHtml(pasos, ok) {
      return `<ul class="pasos-tx">${pasos.map((p) => {
        const mal = /rechaz/i.test(p), rev = /revert/i.test(p);
        return `<li class="${mal ? 'mal' : rev ? 'revertido' : ok ? 'ok' : ''}">${ic(mal ? 'x' : rev ? 'refrescar' : 'check')}${esc(p)}</li>`;
      }).join('')}</ul>`;
    }
    res.addEventListener('click', (e) => { if (e.target.closest('[data-reintentar]')) { res.innerHTML = ''; formulario.classList.remove('oculto'); window.scrollTo({ top: 0 }); } });

    $('[data-pagar]', v).addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      const errores = {};
      Object.keys(REGLAS).forEach((k) => { const m = REGLAS[k](form[k].value); if (m) errores[k] = m; });
      Object.assign(errores, F.validarPagoCliente(form, pago.metodo));
      if (Object.keys(errores).length) {
        F.marcarErrores(form, errores);
        btn.classList.remove('shake'); void btn.offsetWidth; btn.classList.add('shake');
        F.toast('Revisa los campos marcados en rojo', 'error');
        return;
      }
      const direccion = { nombre: form.nombre.value, telefono: form.telefono.value, direccion: form.direccion.value, ciudad: form.ciudad.value, notas: form.notas.value };
      try {
        const r = await F.conCarga(btn, async () => {
          await F.esperar(900); // tiempo de respuesta simulado de la pasarela
          return Api.post('/orders', { items: S.carrito, envio: S.envio, cupon: S.cupon, direccion, pago: F.leerPago(form, pago.metodo) });
        }, 'Procesando el pago…');
        if (form.guardar.checked) { try { await Api.put('/auth/me', { telefono: direccion.telefono, direccion: direccion.direccion, ciudad: direccion.ciudad }); await F.refrescarUsuario(); } catch (err) { /* no bloquea la compra */ } }
        S.carrito = []; S.cupon = ''; F.guardarCarrito(false);
        const o = r.pedido;
        mostrarResultado(`<div class="resultado resultado--ok"><div class="resultado__icono">${ic('check')}</div><h1>¡Pago aprobado!</h1>
          <p class="muted">Tu pedido <strong>${esc(o.id)}</strong> por <strong>${cop(o.total)}</strong> quedó confirmado. Te enviamos el recibo a ${esc(S.user.email)}.</p>
          <div class="fila" style="justify-content:center;margin:6px 0 4px"><span class="pill">${ic('tarjeta')} ${esc(o.pago.detalle)}</span><span class="pill">Ref. ${esc(o.pago.referencia)}</span><span class="pill pill--verde">${ic('camion')} Llega entre el ${diaCorto(o.envio.llegaDesde)} y el ${diaCorto(o.envio.llegaHasta)}</span></div>
          <h3 style="margin-top:20px">Así se procesó tu compra</h3>${pasosHtml(r.transaccion.pasos, true)}
          <div class="fila" style="justify-content:center;margin-top:20px"><a class="btn btn--pri" href="#/pedido/${esc(o.id)}">Ver mi pedido</a><a class="btn btn--sec" href="#/tienda">Seguir comprando</a></div></div>`);
      } catch (err) {
        if (err.status === 402) {
          mostrarResultado(`<div class="resultado resultado--error"><div class="resultado__icono">${ic('x')}</div><h1>El pago fue rechazado</h1>
            <p class="muted"><strong>${esc(err.message)}</strong>${err.data.pago ? ' (' + esc(err.data.pago.detalle) + ')' : ''}.</p>
            <div class="nota nota--azul" style="text-align:left;margin:10px auto;max-width:470px">${ic('escudo')}<div><strong>No se realizó ningún cobro.</strong> La compra es “todo o nada” (RES 04): como el pago falló, el sistema revirtió el pedido y devolvió el inventario.</div></div>
            ${err.data.transaccion ? pasosHtml(err.data.transaccion.pasos, false) : ''}
            <p class="muted">Revisa los datos, usa otra tarjeta o prueba con Nequi, PSE o PayPal.</p>
            <div class="fila" style="justify-content:center;margin-top:10px"><button class="btn btn--pri" data-reintentar>Intentar de nuevo</button><a class="btn btn--sec" href="#/carrito">Volver al carrito</a></div></div>`);
        } else if (err.status === 409) {
          F.toast(err.message, 'error', { href: '#/carrito', texto: 'Ir al carrito' });
        } else F.manejarError(err, form);
      }
    });
  });

  // ======================= 404 =======================
  F.registrar('__404', async (v) => {
    F.titulo('Página no encontrada');
    v.innerHTML = `<div class="contenedor">${F.vacioHtml('buscar', 'No encontramos esta página', 'Puede que el enlace esté mal escrito o que la página ya no exista.', '<a class="btn btn--pri" href="#/">Volver al inicio</a>')}</div>`;
  });
})();

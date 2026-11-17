/* FITOPÍA · Panel del administrador (Épica 10) y del personal técnico (RS 04 · RS 07) */
(function () {
  'use strict';
  const F = window.FIT, Api = window.Api;
  const { $, $$, esc, cop, ic, S } = F;
  const ESTADO_PILL = { 'Pagado': 'pill--azul', 'En preparación': 'pill--naranja', 'Enviado': 'pill--naranja', 'Entregado': 'pill--verde', 'Cancelado': 'pill--rojo' };
  const pillResultado = (r) => {
    const t = String(r || '').toLowerCase();
    const c = /exitoso|aprobado|enviado|creado|reactivada|eliminada/.test(t) ? 'pill--verde' : /fallido|rechaz|bloque|revertida|denegado|suspendida|oculta/.test(t) ? 'pill--rojo' : '';
    return `<span class="pill ${c}">${esc(r)}</span>`;
  };

  F.registrar('admin', async (v, segs) => {
    F.titulo('Panel de administración');
    if (!F.requiereSesion()) return;
    const u = S.user;
    if (u.rol !== 'admin' && u.rol !== 'tecnico') {
      v.innerHTML = `<div class="contenedor">${F.vacioHtml('candado', 'No tienes permisos para esta sección', 'El panel de administración es solo para el rol Administrador (RS 04). El servidor también rechaza estas peticiones con el código 403.', '<a class="btn btn--pri" href="#/">Volver al inicio</a>')}</div>`;
      return;
    }
    const esAdmin = u.rol === 'admin';
    const TABS = esAdmin
      ? [['resumen', 'grafico', 'Resumen'], ['productos', 'caja', 'Productos'], ['pedidos', 'recibo', 'Pedidos'], ['usuarios', 'usuarios', 'Usuarios'], ['pagos', 'tarjeta', 'Pagos y suscripciones'], ['auditoria', 'escudo', 'Auditoría'], ['sistema', 'servidor', 'Sistema']]
      : [['auditoria', 'escudo', 'Auditoría'], ['sistema', 'servidor', 'Sistema']];
    let tab = segs[0] || TABS[0][0];
    if (!TABS.some((t) => t[0] === tab)) tab = TABS[0][0];
    let cont = '';
    let datos = null;

    if (tab === 'resumen') {
      const s = datos = await Api.get('/admin/stats');
      const max = Math.max(1, ...s.ultimos7.map((d) => d.tienda + d.suscripciones));
      const maxCat = Math.max(1, ...s.porCategoria.map((c) => c.total));
      cont = `<div class="entre"><div><h1 style="margin:0">Resumen</h1><p class="muted">Así va FITOPÍA hoy, ${new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}.</p></div><a class="btn btn--sec" href="#/admin/productos">${ic('mas')} Nuevo producto</a></div>
        <div class="kpis" style="margin:10px 0 18px">
          <div class="kpi"><small>${ic('grafico')} Ventas totales</small><strong>${cop(s.ventasTotales)}</strong><span>Tienda ${cop(s.ventasTienda)} · planes ${cop(s.ventasSuscripciones)}</span></div>
          <div class="kpi"><small>${ic('recibo')} Pedidos</small><strong>${s.pedidos}</strong><span>${s.pedidosPendientes} por despachar</span></div>
          <div class="kpi"><small>${ic('usuarios')} Clientes</small><strong>${s.usuarios}</strong><span>${s.usuariosNuevos} nuevos en 30 días</span></div>
          <div class="kpi"><small>${ic('pesa')} Suscripciones activas</small><strong>${s.suscripcionesActivas}</strong><span>${s.porPlan.map((p) => p.total + ' ' + p.nombre).join(' · ')}</span></div></div>
        <div class="dos-col" style="grid-template-columns:1.4fr 1fr;padding-bottom:0">
          <section class="tarjeta"><div class="entre"><h3 style="margin:0">Ventas de los últimos 7 días</h3><div class="leyenda"><span><i style="background:var(--naranja)"></i>Tienda</span><span><i style="background:var(--navy)"></i>Suscripciones</span></div></div>
            <div class="barras" role="img" aria-label="Ventas diarias de la última semana">${s.ultimos7.map((d) => { const tot = d.tienda + d.suscripciones; return `<div class="barra" title="${d.dia}: ${cop(tot)}"><small style="color:var(--navy)">${tot ? '$' + (tot / 1e6).toFixed(1).replace('.', ',') + ' M' : '—'}</small>
              <div class="barra__col" style="height:${Math.max(2, tot / max * 100)}%"><span style="height:${tot ? d.tienda / tot * 100 : 0}%;background:var(--naranja)"></span><span style="height:${tot ? d.suscripciones / tot * 100 : 0}%;background:var(--navy)"></span></div><small>${F.cap(d.etiqueta)}</small></div>`; }).join('')}</div></section>
          <section class="tarjeta"><h3>Más vendidos</h3>${s.top.map((p, i) => `<div class="fila" style="flex-wrap:nowrap;padding:7px 0;border-bottom:1px solid var(--borde)"><strong style="width:18px;color:var(--texto-3)">${i + 1}</strong><div style="width:40px;height:40px;border-radius:9px;overflow:hidden;flex:none">${window.Arte.producto(p.arte, p.color, 0, F.etiquetaArte(p))}</div><span style="flex:1;font-size:.92rem">${esc(p.nombre)}</span><span class="pill">${p.unidades} u.</span></div>`).join('')}</section></div>
        <div class="dos-col" style="grid-template-columns:1fr 1fr;margin-top:18px">
          <section class="tarjeta"><h3>Ventas por categoría</h3>${s.porCategoria.map((c) => `<div style="margin:10px 0"><div class="entre" style="font-size:.9rem"><span>${esc(c.nombre)}</span><strong>${cop(c.total)}</strong></div><div class="barra-progreso" style="margin-top:6px"><span style="width:${c.total / maxCat * 100}%"></span></div></div>`).join('')}</section>
          <section class="tarjeta"><div class="entre"><h3 style="margin:0">Alertas de inventario</h3><span class="pill pill--rojo">${s.stockBajo.length}</span></div>
            ${s.stockBajo.length ? s.stockBajo.map((p) => `<div class="entre" style="padding:9px 0;border-bottom:1px solid var(--borde);font-size:.92rem"><span>${esc(p.nombre)}${p.tallasAgotadas.length ? `<br><small class="muted">Tallas agotadas: ${p.tallasAgotadas.join(', ')}</small>` : ''}</span><span class="pill ${p.stock === 0 ? 'pill--rojo' : 'pill--naranja'}">${p.stock === 0 ? 'Agotado' : p.stock + ' u.'}</span></div>`).join('') : '<p class="muted">Todo el inventario está en niveles normales.</p>'}
            ${s.pagosRechazados ? `<p class="nota" style="margin-top:12px">${ic('alerta')}<span>${s.pagosRechazados} pagos rechazados. Revisa <a class="enlace" href="#/admin/pagos">Pagos</a>.</span></p>` : ''}</section></div>`;
    } else if (tab === 'productos') {
      datos = await Api.get('/admin/products');
      cont = `<div class="entre"><h1 style="margin:0">Productos</h1><button class="btn btn--pri" data-nuevo>${ic('mas')} Nuevo producto</button></div>
        <div class="fila" style="margin:16px 0"><input class="input" style="max-width:320px" placeholder="Buscar por nombre o marca" data-filtro-texto aria-label="Buscar productos">
          <select class="input" style="width:auto" data-filtro-cat aria-label="Filtrar por categoría"><option value="">Todas las categorías</option>${S.meta.categorias.map((c) => `<option value="${c.id}">${esc(c.nombre)}</option>`).join('')}</select>
          <span class="muted" data-conteo></span></div>
        <div class="tabla-wrap"><table class="tabla"><thead><tr><th></th><th>Producto</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Vendidos</th><th>Estado</th><th></th></tr></thead><tbody data-filas></tbody></table></div>`;
    } else if (tab === 'pedidos') {
      datos = await Api.get('/admin/orders');
      cont = `<h1>Pedidos</h1><p class="muted">Actualiza el estado para que el cliente vea el avance de su entrega.</p>
        <div class="tabla-wrap"><table class="tabla"><thead><tr><th>Pedido</th><th>Fecha</th><th>Cliente</th><th>Productos</th><th>Total</th><th>Pago</th><th>Estado</th></tr></thead><tbody>
        ${datos.map((o) => `<tr><td><a class="enlace" href="#/pedido/${esc(o.id)}">${esc(o.id)}</a></td><td>${F.fechaHora(o.fecha)}</td><td>${esc(o.cliente)}<br><small class="muted">${esc(o.direccion.ciudad)}</small></td><td>${o.lineas.reduce((a, l) => a + l.cantidad, 0)} u.</td><td><strong>${cop(o.total)}</strong></td><td><small>${esc(o.pago ? o.pago.detalle : '—')}</small></td>
          <td><select data-estado="${esc(o.id)}" aria-label="Estado del pedido ${esc(o.id)}">${S.meta.estadosPedido.map((e) => `<option ${e === o.estado ? 'selected' : ''}>${e}</option>`).join('')}</select></td></tr>`).join('')}</tbody></table></div>`;
    } else if (tab === 'usuarios') {
      datos = await Api.get('/admin/users');
      cont = `<h1>Usuarios</h1><p class="muted">${datos.length} cuentas registradas. Los cambios de rol y las suspensiones quedan en la auditoría (RS 07).</p>
        <div class="tabla-wrap"><table class="tabla"><thead><tr><th>Usuario</th><th>Rol</th><th>Plan</th><th>Pedidos</th><th>Total gastado</th><th>Estado</th><th></th></tr></thead><tbody>
        ${datos.map((x) => { const yo = x.id === u.id; return `<tr><td><div class="fila" style="flex-wrap:nowrap"><span class="avatar" style="background:${esc(x.avatarColor)};width:34px;height:34px;font-size:.8rem">${esc(F.iniciales(x.nombre))}</span><div><strong>${esc(x.nombre)}</strong>${yo ? ' <span class="pill">Tú</span>' : ''}<br><small class="muted">${esc(x.email)}</small></div></div></td>
          <td><select data-rol="${x.id}" ${yo ? 'disabled' : ''} aria-label="Rol de ${esc(x.nombre)}">${[['cliente', 'Cliente'], ['admin', 'Administrador'], ['tecnico', 'Técnico']].map(([k, t]) => `<option value="${k}" ${x.rol === k ? 'selected' : ''}>${t}</option>`).join('')}</select></td>
          <td>${x.suscripcion ? `<span class="pill" style="background:${window.Arte.mezclar(x.suscripcion.color, 0.85)};color:var(--navy)">${esc(x.suscripcion.plan)}</span>` : '<span class="tenue">—</span>'}</td><td>${x.pedidos}</td><td>${cop(x.gastado)}</td>
          <td><span class="pill ${x.estado === 'activo' ? 'pill--verde' : 'pill--rojo'}">${x.estado}</span></td>
          <td>${yo ? '' : x.estado === 'activo' ? `<button class="btn btn--peligro btn--sm" data-suspender="${x.id}">Suspender</button>` : `<button class="btn btn--sec btn--sm" data-reactivar="${x.id}">Reactivar</button>`}</td></tr>`; }).join('')}</tbody></table></div>`;
    } else if (tab === 'pagos') {
      datos = await Api.get('/admin/pagos');
      const ok = datos.filter((p) => p.estado === 'aprobado');
      cont = `<div class="entre"><div><h1 style="margin:0">Pagos y suscripciones</h1><p class="muted">Historial de transacciones de Wompi y PayPal. FITOPÍA solo guarda tokens, nunca datos de tarjetas (RS 02).</p></div>
          <div class="fila"><button class="btn btn--osc" data-exportar>${ic('descarga')} Exportar a Excel (CSV)</button><button class="btn btn--sec" data-imprimir>${ic('recibo')} Exportar a PDF</button></div></div>
        <div class="kpis" style="grid-template-columns:repeat(3,1fr);margin:12px 0 18px"><div class="kpi"><small>Aprobado</small><strong>${cop(ok.reduce((a, p) => a + p.monto, 0))}</strong><span>${ok.length} transacciones</span></div>
          <div class="kpi"><small>Suscripciones</small><strong>${datos.filter((p) => p.tipo === 'suscripcion' && p.estado === 'aprobado').length}</strong><span>Cobros de planes</span></div>
          <div class="kpi"><small>Rechazados</small><strong>${datos.filter((p) => p.estado === 'rechazado').length}</strong><span>Sin cobro al cliente</span></div></div>
        <div class="tabla-wrap imprimible"><table class="tabla"><thead><tr><th>Fecha</th><th>Tipo</th><th>Cliente</th><th>Método</th><th>Referencia</th><th>Token</th><th>Monto</th><th>Estado</th></tr></thead><tbody>
        ${datos.map((p) => `<tr><td>${F.fechaHora(p.fecha)}</td><td>${p.tipo === 'pedido' ? `<a class="enlace" href="#/pedido/${esc(p.refId)}">Pedido ${esc(p.refId)}</a>` : 'Suscripción'}</td><td>${esc(p.usuario)}</td><td><small>${esc(p.metodo)}</small><br><small class="muted">${esc(p.pasarela)}</small></td><td class="mono">${esc(p.referencia)}</td><td class="mono">${esc(p.token)}</td><td><strong>${cop(p.monto)}</strong></td><td>${pillResultado(p.estado)}</td></tr>`).join('')}</tbody></table></div>`;
    } else if (tab === 'auditoria') {
      datos = await Api.get('/admin/auditoria');
      cont = `<div class="entre"><div><h1 style="margin:0">Auditoría</h1><p class="muted">Eventos críticos con fecha, usuario, IP y resultado, sin datos sensibles (RS 07). ${Api.modo === 'servidor' ? 'Se guardan en <span class="mono">data/auditoria.jsonl</span> (en producción: DynamoDB).' : 'En modo demo se guardan en el navegador.'}</p></div>
        <button class="btn btn--sec" data-refrescar>${ic('refrescar')} Actualizar</button></div>
        <div class="fila" style="margin:14px 0"><input class="input" style="max-width:340px" placeholder="Filtrar por usuario, evento o resultado" data-filtro-aud aria-label="Filtrar auditoría"><span class="muted" data-conteo-aud></span></div>
        <div class="tabla-wrap"><table class="tabla"><thead><tr><th>Fecha</th><th>Usuario</th><th>Rol</th><th>IP</th><th>Evento</th><th>Resultado</th><th>Detalle</th></tr></thead><tbody data-filas-aud></tbody></table></div>`;
    } else if (tab === 'sistema') {
      const s = datos = await Api.get('/admin/sistema');
      cont = `<h1>Estado del sistema</h1><div class="kpis" style="margin:10px 0 18px">
          <div class="kpi"><small>${ic('servidor')} Modo</small><strong style="font-size:1.2rem">${s.modo === 'servidor' ? 'Servidor local' : 'Demo en navegador'}</strong><span>${esc(s.motor)}</span></div>
          <div class="kpi"><small>${ic('pulso')} Activo desde</small><strong style="font-size:1.2rem">${F.fechaHora(s.activoDesde)}</strong><span>Versión ${esc(s.version)}</span></div>
          <div class="kpi"><small>${ic('caja')} Datos</small><strong style="font-size:1rem">${esc(s.almacenamiento)}</strong></div>
          <div class="kpi"><small>${ic('escudo')} Auditoría</small><strong style="font-size:1rem">${esc(s.auditoria)}</strong></div></div>
        <div class="dos-col" style="grid-template-columns:1fr 1fr"><section class="tarjeta"><h3>Registros</h3><table class="specs"><tbody>${Object.entries(s.registros).map(([k, n]) => `<tr><th>${esc(F.cap(k))}</th><td>${n}</td></tr>`).join('')}</tbody></table></section>
          <section class="tarjeta"><h3>Solicitudes de soporte</h3>${s.tickets.length ? s.tickets.map((t) => `<div style="padding:9px 0;border-bottom:1px solid var(--borde)"><div class="entre"><strong>${esc(t.id)} · ${esc(t.asunto)}</strong><span class="pill pill--naranja">${esc(t.estado)}</span></div><small class="muted">${esc(t.usuario || '')} · ${F.hace(t.fecha)}</small><p style="margin:4px 0 0;font-size:.9rem">${esc(t.descripcion)}</p></div>`).join('') : '<p class="muted">No hay solicitudes abiertas.</p>'}</section></div>
        <section class="tarjeta" style="margin-top:18px"><h3>Mantenimiento</h3>${s.modo === 'servidor' ? '<p class="muted" style="margin:0">Para volver a los datos de ejemplo cierra el servidor y ejecuta <span class="mono">REINICIAR-DATOS.bat</span> (o <span class="mono">node server.js --reiniciar</span>).</p>' : '<button class="btn btn--peligro" data-reiniciar-demo>Reiniciar datos de la demo</button>'}</section>`;
    }

    v.innerHTML = `<div class="contenedor"><div class="panel"><nav class="lateral" aria-label="Panel">
      <div class="lateral__cab"><span class="avatar" style="background:${esc(u.avatarColor)}">${esc(F.iniciales(u.nombre))}</span><div><strong>${esc(u.nombre)}</strong><small>${esAdmin ? 'Administrador' : 'Personal técnico'}</small></div></div>
      ${TABS.map(([id, i, t]) => `<a href="#/admin/${id}" class="${tab === id ? 'activo' : ''}">${ic(i)} ${t}</a>`).join('')}<a href="#/">${ic('tienda')} Ver la tienda</a></nav><div>${cont}</div></div></div>`;

    // ---------- Productos ----------
    if (tab === 'productos') {
      const filas = $('[data-filas]', v), txt = $('[data-filtro-texto]', v), catSel = $('[data-filtro-cat]', v);
      const pintarFilas = () => {
        const t = F.norm(txt.value), c = catSel.value;
        const lista = datos.filter((p) => (!c || p.cat === c) && (!t || F.norm(p.nombre + ' ' + p.marca + ' ' + p.tipo).includes(t)));
        $('[data-conteo]', v).textContent = lista.length + ' productos';
        filas.innerHTML = lista.map((p) => `<tr style="${p.activo ? '' : 'opacity:.55'}"><td><div class="mini">${F.artePara(p)}</div></td><td><strong>${esc(p.nombre)}</strong><br><small class="muted">${esc(p.marca)} · ${esc(p.tipo)}</small></td>
          <td>${esc((S.meta.categorias.find((c2) => c2.id === p.cat) || {}).nombre || p.cat)}</td><td>${cop(p.precio)}${p.precioAntes ? `<br><small class="tenue"><s>${cop(p.precioAntes)}</s></small>` : ''}</td>
          <td><span class="pill ${p.stock === 0 ? 'pill--rojo' : p.stock <= 3 ? 'pill--naranja' : 'pill--verde'}">${p.stock}</span>${p.tallas ? `<br><small class="tenue">${Object.entries(p.tallas).map(([k, n]) => k + ':' + n).join(' ')}</small>` : ''}</td>
          <td>${p.vendidos}</td><td>${p.activo ? '<span class="pill pill--verde">Activo</span>' : '<span class="pill">Eliminado</span>'}</td>
          <td><div class="fila" style="gap:4px;flex-wrap:nowrap"><button class="icon-btn" data-editar="${esc(p.id)}" aria-label="Editar ${esc(p.nombre)}" title="Editar">${ic('editar')}</button>${p.activo ? `<button class="icon-btn" data-eliminar="${esc(p.id)}" aria-label="Eliminar ${esc(p.nombre)}" title="Eliminar">${ic('basura')}</button>` : `<button class="btn btn--sec btn--sm" data-restaurar="${esc(p.id)}">Restaurar</button>`}</div></td></tr>`).join('');
      };
      pintarFilas();
      txt.addEventListener('input', pintarFilas);
      catSel.addEventListener('change', pintarFilas);
      const abrirForm = (p) => {
        const nuevo = !p;
        p = p || { nombre: '', cat: 'accesorios', tipo: '', marca: '', precio: '', precioAntes: '', stock: 10, desc: '', arte: 'bandas', color: '#E8743B' };
        const tallas = p.tallas || { S: 5, M: 5, L: 5, XL: 5 };
        const m = F.modal(`<h2>${nuevo ? 'Nuevo producto' : 'Editar producto'}</h2>
          <form class="form-grid" data-form-prod novalidate>
            <div class="completo fila" style="flex-wrap:nowrap;align-items:flex-start"><div data-vista-previa style="width:120px;height:120px;border-radius:16px;overflow:hidden;flex:none;border:1px solid var(--borde)">${F.artePara(p)}</div>
              <div style="flex:1;display:grid;gap:10px">${F.campo('arte', 'Ilustración', { tipo: 'select', valor: p.arte, opciones: S.meta.artes.map((a) => [a, F.cap(a)]) })}<div class="campo"><label>Color</label><input type="color" name="color" value="${esc(p.color)}" style="height:44px;padding:4px"></div></div></div>
            ${F.campo('nombre', 'Nombre', { clase: 'completo', valor: p.nombre })}
            ${F.campo('cat', 'Categoría', { tipo: 'select', valor: p.cat, opciones: S.meta.categorias.map((c) => [c.id, c.nombre]) })}
            ${F.campo('tipo', 'Tipo', { valor: p.tipo, attrs: { placeholder: 'Ej. cardio, proteína, bandas' } })}
            ${F.campo('marca', 'Marca', { valor: p.marca })}
            ${F.campo('precio', 'Precio (COP)', { valor: p.precio, attrs: { inputmode: 'numeric' } })}
            ${F.campo('precioAntes', 'Precio anterior (opcional, para ofertas)', { valor: p.precioAntes || '', attrs: { inputmode: 'numeric' } })}
            <div data-stock-simple class="${p.cat === 'ropa' ? 'oculto' : ''}">${F.campo('stock', 'Stock (unidades)', { valor: p.stock, attrs: { inputmode: 'numeric' } })}</div>
            <div data-stock-tallas class="completo ${p.cat === 'ropa' ? '' : 'oculto'}"><label style="font-size:.88rem;font-weight:650">Stock por talla</label><div class="fila" style="margin-top:6px">${['S', 'M', 'L', 'XL'].map((t) => `<label class="fila" style="gap:6px">${t} <input class="input" style="width:70px" name="talla-${t}" inputmode="numeric" value="${tallas[t] || 0}"></label>`).join('')}</div></div>
            ${F.campo('desc', 'Descripción', { tipo: 'textarea', clase: 'completo', valor: p.desc })}
            <div class="completo fila" style="justify-content:flex-end"><button type="button" class="btn btn--sec" data-cerrar>Cancelar</button><button class="btn btn--pri">${nuevo ? 'Crear producto' : 'Guardar cambios'}</button></div>
          </form>`, { ancho: true, etiqueta: nuevo ? 'Nuevo producto' : 'Editar producto' });
        const f = m.el.querySelector('[data-form-prod]');
        const previa = () => { m.el.querySelector('[data-vista-previa]').innerHTML = window.Arte.producto(f.arte.value, f.color.value, 0, F.etiquetaArte({ nombre: f.nombre.value, arte: f.arte.value, tipo: f.tipo.value })); };
        f.addEventListener('input', (e) => { if (['arte', 'color', 'nombre'].includes(e.target.name)) previa(); });
        f.addEventListener('change', (e) => {
          if (e.target.name === 'arte') previa();
          if (e.target.name === 'cat') { m.el.querySelector('[data-stock-simple]').classList.toggle('oculto', f.cat.value === 'ropa'); m.el.querySelector('[data-stock-tallas]').classList.toggle('oculto', f.cat.value !== 'ropa'); }
        });
        f.addEventListener('submit', async (e) => {
          e.preventDefault();
          const cuerpo = { nombre: f.nombre.value, cat: f.cat.value, tipo: f.tipo.value, marca: f.marca.value, precio: f.precio.value, precioAntes: f.precioAntes.value, stock: f.stock.value, desc: f.desc.value, arte: f.arte.value, color: f.color.value,
            tallas: { S: f['talla-S'].value, M: f['talla-M'].value, L: f['talla-L'].value, XL: f['talla-XL'].value } };
          try {
            await F.conCarga(f.querySelector('.btn--pri'), () => (nuevo ? Api.post('/admin/products', cuerpo) : Api.put('/admin/products/' + encodeURIComponent(p.id), cuerpo)), 'Guardando…');
            m.cerrar(); F.toast(nuevo ? 'Producto creado' : 'Producto actualizado'); F.recargar();
          } catch (err) { F.manejarError(err, f); }
        });
      };
      v.addEventListener('click', async (e) => {
        if (e.target.closest('[data-nuevo]')) return abrirForm(null);
        const ed = e.target.closest('[data-editar]');
        if (ed) return abrirForm(datos.find((p) => p.id === ed.dataset.editar));
        const el = e.target.closest('[data-eliminar]');
        if (el) {
          const p = datos.find((x) => x.id === el.dataset.eliminar);
          if (!(await F.confirmar(`“${p.nombre}” dejará de aparecer en la tienda. Los pedidos anteriores conservan su información.`, { titulo: 'Eliminar producto', boton: 'Eliminar', peligro: true }))) return;
          try { await Api.del('/admin/products/' + encodeURIComponent(p.id)); F.toast('Producto eliminado'); F.recargar(); } catch (err) { F.manejarError(err); }
        }
        const rs = e.target.closest('[data-restaurar]');
        if (rs) { try { await Api.put('/admin/products/' + encodeURIComponent(rs.dataset.restaurar), { activo: true }); F.toast('Producto restaurado'); F.recargar(); } catch (err) { F.manejarError(err); } }
      });
    }

    // ---------- Pedidos ----------
    if (tab === 'pedidos') {
      v.addEventListener('change', async (e) => {
        const s = e.target.closest('[data-estado]');
        if (!s) return;
        try { await Api.put('/admin/orders/' + encodeURIComponent(s.dataset.estado), { estado: s.value }); F.toast(`Pedido ${s.dataset.estado}: ${s.value}`); } catch (err) { F.manejarError(err); }
      });
    }

    // ---------- Usuarios ----------
    if (tab === 'usuarios') {
      v.addEventListener('change', async (e) => {
        const s = e.target.closest('[data-rol]');
        if (!s) return;
        try { await Api.put('/admin/users/' + s.dataset.rol, { rol: s.value }); F.toast('Rol actualizado'); } catch (err) { F.manejarError(err); F.recargar(); }
      });
      v.addEventListener('click', async (e) => {
        const sp = e.target.closest('[data-suspender]'), re = e.target.closest('[data-reactivar]');
        if (!sp && !re) return;
        const id = (sp || re).dataset[sp ? 'suspender' : 'reactivar'];
        const x = datos.find((y) => y.id === id);
        if (sp && !(await F.confirmar(`${x.nombre} no podrá iniciar sesión hasta que reactives su cuenta.`, { titulo: 'Suspender cuenta', boton: 'Suspender', peligro: true }))) return;
        try { await Api.put('/admin/users/' + id, { estado: sp ? 'suspendido' : 'activo' }); F.toast(sp ? 'Cuenta suspendida' : 'Cuenta reactivada', sp ? 'info' : 'ok'); F.recargar(); } catch (err) { F.manejarError(err); }
      });
    }

    // ---------- Pagos ----------
    if (tab === 'pagos') {
      v.addEventListener('click', async (e) => {
        if (e.target.closest('[data-imprimir]')) { window.print(); return; }
        if (!e.target.closest('[data-exportar]')) return;
        try {
          const csv = await Api.get('/admin/pagos/export', { texto: true });
          const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
          const a = document.createElement('a');
          a.href = url; a.download = 'pagos-fitopia-' + new Date().toISOString().slice(0, 10) + '.csv';
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 2000);
          F.toast('Reporte descargado. Ábrelo con Excel.');
        } catch (err) { F.manejarError(err); }
      });
    }

    // ---------- Auditoría ----------
    if (tab === 'auditoria') {
      const filas = $('[data-filas-aud]', v), filtro = $('[data-filtro-aud]', v);
      const pintar = () => {
        const t = F.norm(filtro.value);
        const lista = datos.filter((a) => !t || F.norm([a.usuario, a.evento, a.resultado, a.detalle, a.ip].join(' ')).includes(t));
        $('[data-conteo-aud]', v).textContent = lista.length + ' eventos';
        filas.innerHTML = lista.length ? lista.map((a) => `<tr><td style="white-space:nowrap">${F.fechaHora(new Date(a.fecha).getTime())}</td><td>${esc(a.usuario)}</td><td>${esc(a.rol)}</td><td class="mono">${esc(a.ip)}</td><td><strong>${esc(a.evento)}</strong></td><td>${pillResultado(a.resultado)}</td><td><small>${esc(a.detalle)}</small></td></tr>`).join('')
          : '<tr><td colspan="7" class="muted centro" style="padding:30px">Todavía no hay eventos. Inicia sesión, compra o cambia algo y vuelve aquí.</td></tr>';
      };
      pintar();
      filtro.addEventListener('input', pintar);
      v.addEventListener('click', async (e) => { if (e.target.closest('[data-refrescar]')) { datos = await Api.get('/admin/auditoria'); pintar(); F.toast('Auditoría actualizada', 'info'); } });
    }
  });

  // Arranque de la aplicación (este es el último archivo que se carga)
  F.arrancar();
})();

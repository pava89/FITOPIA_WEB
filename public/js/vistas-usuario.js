/* FITOPÍA · Vistas de usuario: acceso, Planes Fit, Mi plan, comunidad, cuenta e información */
(function () {
  'use strict';
  const F = window.FIT, Api = window.Api;
  const { $, $$, esc, cop, ic, S } = F;

  function visualAuth(titulo, texto) {
    const artes = [['caminadora', '#E8743B'], ['tarro', '#1D9E75', 'WHEY'], ['bandas', '#378ADD'], ['kettlebell', '#7F77DD', '16'], ['camiseta', '#E8743B'], ['mancuernas', '#1D9E75'], ['termo', '#378ADD'], ['leggins', '#D4537E'], ['bicicleta', '#E8743B']];
    return `<div class="auth__visual"><div class="fondo">${artes.map((a, i) => `<div>${window.Arte.producto(a[0], a[1], i % 2, a[2])}</div>`).join('')}</div>
      <span class="eyebrow" style="color:#FFB68F">FITOPÍA</span><h2>${titulo}</h2><p>${texto}</p></div>`;
  }
  const destinoTrasLogin = (u, volver) => (volver ? '#' + volver : u.rol === 'admin' ? '#/admin' : u.rol === 'tecnico' ? '#/admin/auditoria' : '#/');

  // ======================= LOGIN (RF 01 a RF 06) =======================
  F.registrar('login', async (v, segs, q) => {
    F.titulo('Iniciar sesión');
    if (S.user) { location.hash = destinoTrasLogin(S.user, q.volver); return; }
    v.innerHTML = `<div class="auth">${visualAuth('Tu mejor versión empieza hoy', 'Compra, entrena con tu plan y comparte tu progreso con la comunidad, desde el computador, la tablet o el celular.')}
      <div class="auth__form"><div class="auth__caja">
        <h1>Iniciar sesión</h1><p class="muted">¡Qué bueno verte de nuevo!</p>
        <form class="pila" novalidate data-login>
          <div data-error-login aria-live="assertive"></div>
          ${F.campo('email', 'Correo electrónico', { tipo: 'email', valor: q.email || '', attrs: { autocomplete: 'email', placeholder: 'tucorreo@ejemplo.com' } })}
          <div class="campo"><label for="pw-login">Contraseña</label><div class="input-icono"><input id="pw-login" name="password" type="password" autocomplete="current-password" placeholder="Tu contraseña">
            <button type="button" class="icon-btn" data-ver-pw aria-label="Mostrar contraseña">${ic('ojo')}</button></div></div>
          <button class="btn btn--pri btn--lg btn--bloque">Iniciar sesión</button>
          <div class="entre" style="font-size:.93rem"><a class="enlace" href="#/recuperar">¿Olvidaste tu contraseña?</a><a class="enlace" href="#/registro${q.volver ? '?volver=' + encodeURIComponent(q.volver) : ''}">Crear cuenta</a></div>
        </form>
        <div class="demo-cuentas"><h4>${ic('info')} Cuentas de prueba (clic para llenar)</h4><div class="fila">
          <button class="btn btn--sec btn--sm" data-demo="cliente@fitopia.co|Cliente123*">Cliente</button>
          <button class="btn btn--sec btn--sm" data-demo="admin@fitopia.co|Admin123*">Administrador</button>
          <button class="btn btn--sec btn--sm" data-demo="tecnico@fitopia.co|Tecnico123*">Técnico</button></div></div>
      </div></div></div>`;
    const f = $('[data-login]', v), caja = $('[data-error-login]', v);
    setTimeout(() => (q.email ? f.password : f.email).focus(), 50);
    const limpiar = () => { caja.innerHTML = ''; };
    f.addEventListener('input', limpiar); // el error se limpia al corregir (DeHe 1.1.3)
    v.addEventListener('click', (e) => {
      const d = e.target.closest('[data-demo]');
      if (d) { const [em, pw] = d.dataset.demo.split('|'); f.email.value = em; f.password.value = pw; limpiar(); f.querySelector('.btn--pri').focus(); }
      const ver = e.target.closest('[data-ver-pw]');
      if (ver) { const vis = f.password.type === 'password'; f.password.type = vis ? 'text' : 'password'; ver.innerHTML = ic(vis ? 'ojoOff' : 'ojo'); ver.setAttribute('aria-label', vis ? 'Ocultar contraseña' : 'Mostrar contraseña'); }
    });
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const error = (msg) => {
        caja.innerHTML = `<div class="alerta alerta--error" role="alert">${ic('alerta')}<span>${esc(msg)}</span></div>`;
        f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake');
      };
      if (!f.email.value.trim() || !f.password.value) return error('Escribe tu correo y tu contraseña');
      try {
        const r = await F.conCarga(f.querySelector('.btn--pri'), () => Api.post('/auth/login', { email: f.email.value, password: f.password.value }), 'Entrando…');
        F.iniciarSesion(r.token, r.usuario);
        F.toast('¡Hola, ' + r.usuario.nombre.split(' ')[0] + '!');
        location.hash = destinoTrasLogin(r.usuario, q.volver);
      } catch (err) {
        error(err.message + (err.data && err.data.intentosRestantes > 0 && err.data.intentosRestantes < 3 ? ` · Te quedan ${err.data.intentosRestantes} intentos` : ''));
      }
    });
  });

  // ======================= REGISTRO (historias 1.2.x) =======================
  F.registrar('registro', async (v, segs, q) => {
    F.titulo('Crear cuenta');
    if (S.user) { location.hash = '#/'; return; }
    v.innerHTML = `<div class="auth">${visualAuth('Únete a FITOPÍA', 'Crea tu cuenta gratis para comprar, suscribirte a un Plan Fit y participar en los retos de la comunidad.')}
      <div class="auth__form"><div class="auth__caja"><h1>Crear cuenta</h1><p class="muted">Es gratis y toma menos de un minuto.</p>
        <form class="pila" novalidate data-registro>
          ${F.campo('nombre', 'Nombre completo', { attrs: { autocomplete: 'name', placeholder: 'Ej. Laura Gómez' } })}
          ${F.campo('email', 'Correo electrónico', { tipo: 'email', attrs: { autocomplete: 'email', placeholder: 'tucorreo@ejemplo.com' } })}
          <div class="campo"><label for="pw-reg">Contraseña</label><div class="input-icono"><input id="pw-reg" name="password" type="password" autocomplete="new-password" placeholder="Crea una contraseña segura">
            <button type="button" class="icon-btn" data-ver-pw aria-label="Mostrar contraseña">${ic('ojo')}</button></div>
            <ul class="checklist" data-checklist aria-live="polite"></ul></div>
          ${F.campo('confirmacion', 'Confirma la contraseña', { tipo: 'password', attrs: { autocomplete: 'new-password', placeholder: 'Repite la contraseña' } })}
          <label class="casilla"><input type="checkbox" name="aceptaDatos"> <span>Acepto la <a class="enlace" href="#/info/datos" target="_blank">política de tratamiento de datos personales</a> (Ley 1581 de 2012).</span></label>
          <button class="btn btn--pri btn--lg btn--bloque" data-crear disabled>Crear cuenta</button>
          <p class="centro muted" style="font-size:.93rem;margin:0">¿Ya tienes cuenta? <a class="enlace" href="#/login">Inicia sesión</a></p>
        </form></div></div></div>`;
    const f = $('[data-registro]', v), lista = $('[data-checklist]', v), btn = $('[data-crear]', v);
    const reglas = () => {
      const p = f.password.value;
      return [['mínimo 8 caracteres', p.length >= 8], ['una mayúscula', /[A-ZÁÉÍÓÚÑ]/.test(p)], ['un número', /[0-9]/.test(p)], ['las contraseñas coinciden', p && p === f.confirmacion.value]];
    };
    function revisar() {
      const r = reglas();
      lista.innerHTML = r.map(([t, ok]) => `<li class="${ok ? 'cumple' : ''}">${ic(ok ? 'check' : 'x')} ${t}</li>`).join('');
      const valido = f.nombre.value.trim().length >= 3 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.value.trim()) && r.every((x) => x[1]) && f.aceptaDatos.checked;
      btn.disabled = !valido; // historia 1.2.1: deshabilitado hasta validar
    }
    revisar();
    f.addEventListener('input', revisar);
    f.addEventListener('change', revisar);
    F.validarAlSalir(f, {
      nombre: (x) => (x.trim().length < 3 ? 'Escribe tu nombre completo' : ''),
      email: (x) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(x.trim()) ? '' : 'Escribe un correo válido'),
      confirmacion: (x) => (x !== f.password.value ? 'Las contraseñas no coinciden' : '')
    });
    v.addEventListener('click', (e) => {
      const ver = e.target.closest('[data-ver-pw]');
      if (ver) { const vis = f.password.type === 'password'; f.password.type = vis ? 'text' : 'password'; ver.innerHTML = ic(vis ? 'ojoOff' : 'ojo'); }
    });
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (btn.disabled) return;
      try {
        await F.conCarga(btn, () => Api.post('/auth/register', { nombre: f.nombre.value, email: f.email.value, password: f.password.value, confirmacion: f.confirmacion.value, aceptaDatos: f.aceptaDatos.checked }), 'Creando tu cuenta…');
        const email = f.email.value.trim().toLowerCase();
        const m = F.modal(`<div class="centro"><div class="resultado__icono" style="background:var(--verde)">${ic('check')}</div><h2>Cuenta creada</h2>
          <p class="muted">Tu cuenta quedó lista. Inicia sesión con <strong>${esc(email)}</strong> para empezar.</p>
          <button class="btn btn--pri btn--lg" data-ir-login>Ir a iniciar sesión</button></div>`, { etiqueta: 'Cuenta creada' });
        m.el.querySelector('[data-ir-login]').addEventListener('click', () => { m.cerrar(); location.hash = '#/login?email=' + encodeURIComponent(email) + (q.volver ? '&volver=' + encodeURIComponent(q.volver) : ''); });
      } catch (err) { F.manejarError(err, f); }
    });
  });

  // ======================= RECUPERAR CONTRASEÑA (1.3.x) =======================
  F.registrar('recuperar', async (v) => {
    F.titulo('Recuperar contraseña');
    v.innerHTML = `<div class="contenedor" style="max-width:520px;padding-top:50px;padding-bottom:50px"><div class="tarjeta">
      <div class="vacio__icono" style="margin:0 0 14px">${ic('candado')}</div><h1 style="font-size:1.7rem">¿Olvidaste tu contraseña?</h1>
      <p class="muted">Escribe el correo de tu cuenta y te enviaremos un enlace para crear una nueva.</p>
      <div data-banner></div>
      <form class="pila" novalidate data-recuperar>${F.campo('email', 'Correo electrónico', { tipo: 'email', attrs: { placeholder: 'tucorreo@ejemplo.com', autocomplete: 'email' } })}
        <button class="btn btn--pri btn--bloque">Enviar enlace</button></form>
      <p class="centro" style="margin:16px 0 0"><a class="enlace" href="#/login">Volver a iniciar sesión</a></p></div></div>`;
    const f = $('[data-recuperar]', v);
    F.validarAlSalir(f, { email: (x) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(x.trim()) ? '' : 'Escribe un correo válido') });
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.value.trim())) { F.marcarErrores(f, { email: 'Escribe un correo válido' }); return; }
      try {
        const r = await F.conCarga(f.querySelector('.btn'), () => Api.post('/auth/forgot', { email: f.email.value }), 'Enviando…');
        $('[data-banner]', v).innerHTML = `<div class="alerta alerta--ok" role="status" style="margin-bottom:14px">${ic('correo')}<span style="flex:1"><strong>Correo enviado.</strong> ${esc(r.mensaje)}</span><button class="icon-btn" style="width:28px;height:28px" data-cerrar-banner aria-label="Cerrar">${ic('x')}</button></div>`;
        f.reset();
      } catch (err) { F.manejarError(err, f); }
    });
    v.addEventListener('click', (e) => { if (e.target.closest('[data-cerrar-banner]')) $('[data-banner]', v).innerHTML = ''; });
  });

  // ======================= PLANES FIT (Épica 7) =======================
  const FILAS_COMPARAR = [
    ['Rutina personalizada por objetivo', 'General', true, true],
    ['Días de entrenamiento por semana', '3 a 5', '3 a 5', '3 a 5'],
    ['Seguimiento semanal y checklist', true, true, true],
    ['Gráfico de peso y progreso', false, true, true],
    ['Guías de nutrición', false, true, true],
    ['Plan nutricional completo', false, false, true],
    ['Rutinas en video exclusivas', false, false, true],
    ['Eventos y talleres premium', false, false, true],
    ['Descuento en la tienda', '—', '10%', '20%'],
    ['Envío gratis', 'Desde $160.000', 'Desde $160.000', 'Siempre'],
    ['Comunidad, retos e insignias', true, true, true]
  ];
  const celda = (x) => (x === true ? `<span class="si">${ic('check')}</span>` : x === false ? `<span class="no">${ic('menos')}</span>` : esc(x));

  F.registrar('planes', async (v, segs, q) => {
    F.titulo('Planes Fit');
    const d = await Api.get('/fitness/planes');
    let periodo = d.periodos[q.periodo] ? q.periodo : 'mensual';
    function pintar() {
      const sub = S.user && S.user.suscripcion;
      const per = d.periodos[periodo];
      v.innerHTML = `<section class="seccion" style="padding-bottom:20px"><div class="contenedor centro">
        <span class="eyebrow">Planes Fit</span><h1>Entrena con un plan hecho para ti</h1>
        <p class="muted" style="max-width:620px;margin:0 auto 22px">Elige tu plan, cuéntanos tu objetivo y recibe una rutina semanal con seguimiento. Cancela la renovación cuando quieras.</p>
        <div class="segmento" role="radiogroup" aria-label="Periodo de pago">${Object.values(d.periodos).map((p) => `<button class="${p.id === periodo ? 'activo' : ''}" data-periodo="${p.id}" role="radio" aria-checked="${p.id === periodo}">${p.nombre}${p.desc ? `<span class="ahorro">−${p.desc}%</span>` : ''}</button>`).join('')}</div>
      </div></section>
      <div class="contenedor"><div class="planes">${d.planes.map((p) => {
        const total = p.precios[periodo], mes = Math.round(total / per.meses);
        const actual = sub && sub.planId === p.id;
        let boton;
        if (actual) boton = `<a class="btn btn--osc" href="#/mi-plan">${ic('check')} Tu plan actual</a>`;
        else if (sub) boton = `<button class="btn ${p.destacado ? 'btn--pri' : 'btn--sec'}" data-cambiar="${p.id}">Cambiar a ${esc(p.nombre)}</button>`;
        else boton = `<a class="btn ${p.destacado ? 'btn--pri' : 'btn--osc'}" href="#/suscribir/${p.id}?periodo=${periodo}">Suscribirme</a>`;
        return `<article class="plan ${p.destacado ? 'plan--destacado' : ''}" style="--c:${p.color};--cbg:${window.Arte.mezclar(p.color, 0.86)}">${p.destacado ? '<span class="cinta">Popular</span>' : ''}
          <div class="plan__icono">${ic(p.icono)}</div><h2 style="margin:0">Plan ${esc(p.nombre)}</h2><p class="muted" style="margin:4px 0 0">${esc(p.lema)}</p>
          <div class="plan__precio">${cop(mes)}<small> /mes</small></div>
          <small class="muted">${per.meses > 1 ? `Pagas ${cop(total)} cada ${per.meses} meses · ahorras ${per.desc}%` : 'Se cobra cada mes'}</small>
          <ul>${p.beneficios.map((b) => `<li>${ic('check')}<span>${esc(b)}</span></li>`).join('')}</ul>
          <div class="plan__acciones">${boton}<button class="btn btn--fant btn--sm" data-detalle="${p.id}">Ver detalles</button></div></article>`;
      }).join('')}</div>
      <section class="seccion"><h2 class="centro">Compara los planes</h2><div class="tabla-wrap" style="margin-top:18px"><table class="tabla-comparar"><thead><tr><th>Beneficio</th>${d.planes.map((p) => `<th>${esc(p.nombre)}</th>`).join('')}</tr></thead>
        <tbody>${FILAS_COMPARAR.map((f) => `<tr><td>${esc(f[0])}</td>${f.slice(1).map((x) => `<td>${celda(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section>
      <section class="seccion" style="padding-top:0"><div class="dos-col" style="grid-template-columns:1fr 1fr">
        <div class="tarjeta tarjeta--plana"><h3>¿Puedo cancelar cuando quiera?</h3><p class="muted" style="margin:0">Sí. Desde Mi cuenta desactivas la renovación automática y tu plan sigue activo hasta el final del periodo que pagaste.</p></div>
        <div class="tarjeta tarjeta--plana"><h3>¿El precio puede subir?</h3><p class="muted" style="margin:0">No. Mientras mantengas tu suscripción conservas la misma tarifa (regla de negocio RN-P 3). Los cobros recurrentes usan un token seguro de la pasarela.</p></div>
      </div></section></div>`;
    }
    pintar();
    v.addEventListener('click', async (e) => {
      const pb = e.target.closest('[data-periodo]');
      if (pb) { periodo = pb.dataset.periodo; pintar(); return; }
      const db = e.target.closest('[data-detalle]');
      if (db) {
        const p = d.planes.find((x) => x.id === db.dataset.detalle);
        const m = F.modal(`<div class="plan__icono" style="--c:${p.color};--cbg:${window.Arte.mezclar(p.color, 0.86)}">${ic(p.icono)}</div><h2>Plan ${esc(p.nombre)}</h2><p class="muted">${esc(p.lema)}</p>
          <table class="specs"><tbody>${Object.values(d.periodos).map((x) => `<tr><th>${x.nombre}${x.desc ? ` (−${x.desc}%)` : ''}</th><td><strong>${cop(p.precios[x.id])}</strong> ${x.meses > 1 ? `· ${cop(Math.round(p.precios[x.id] / x.meses))}/mes` : ''}</td></tr>`).join('')}
          <tr><th>Ejercicios por sesión</th><td>${p.ejerciciosDia}</td></tr><tr><th>Descuento en tienda</th><td>${p.descTienda ? p.descTienda + '%' : 'No incluye'}</td></tr><tr><th>Envío gratis</th><td>${p.envioGratis ? 'Siempre' : 'Desde $160.000'}</td></tr></tbody></table>
          <h3 style="margin-top:18px">Incluye</h3><ul class="checklist" style="font-size:.95rem">${p.beneficios.map((b) => `<li class="cumple">${ic('check')} ${esc(b)}</li>`).join('')}</ul>
          <div class="fila" style="margin-top:20px;justify-content:flex-end"><button class="btn btn--sec" data-cerrar>Cerrar</button>${!(S.user && S.user.suscripcion) ? `<a class="btn btn--pri" href="#/suscribir/${p.id}?periodo=${periodo}" data-cerrar>Suscribirme</a>` : ''}</div>`, { etiqueta: 'Detalle del plan ' + p.nombre });
        void m;
        return;
      }
      const cb = e.target.closest('[data-cambiar]');
      if (cb) {
        const p = d.planes.find((x) => x.id === cb.dataset.cambiar);
        const ok = await F.confirmar(`Tu plan cambiará a ${p.nombre}. El nuevo valor (${cop(p.precios[S.user.suscripcion.periodo])} por periodo ${S.user.suscripcion.periodoNombre.toLowerCase()}) se aplica desde tu próximo cobro.`, { titulo: 'Cambiar de plan', boton: 'Cambiar a ' + p.nombre });
        if (!ok) return;
        try { await Api.put('/fitness/suscripcion', { accion: 'cambiar', planId: p.id }); await F.refrescarUsuario(); F.toast('Ahora tienes el plan ' + p.nombre); pintar(); }
        catch (err) { F.manejarError(err); }
      }
    });
  });

  // ======================= SUSCRIBIRSE (personalización + pago) =======================
  F.registrar('suscribir', async (v, segs, q) => {
    F.titulo('Suscribirme');
    if (!F.requiereSesion()) return;
    if (S.user.suscripcion) { F.toast('Ya tienes el plan ' + S.user.suscripcion.plan + '. Puedes cambiarlo desde aquí.', 'info'); location.hash = '#/planes'; return; }
    const d = await Api.get('/fitness/planes');
    const plan = d.planes.find((p) => p.id === segs[0]);
    if (!plan) { location.hash = '#/planes'; return; }
    const st = { paso: 1, periodo: d.periodos[q.periodo] ? q.periodo : 'mensual', objetivo: null, experiencia: null, frecuencia: null };
    const PREG = [
      ['objetivo', '¿Cuál es tu objetivo?', [['ganar-musculo', 'Ganar músculo', 'Fuerza e hipertrofia'], ['perder-peso', 'Perder peso', 'Quemar grasa con intervalos'], ['resistencia', 'Mejorar resistencia', 'Cardio y circuitos']]],
      ['experiencia', '¿Cuánta experiencia tienes?', [['principiante', 'Principiante', 'Estoy empezando'], ['intermedio', 'Intermedio', 'Entreno hace meses'], ['avanzado', 'Avanzado', 'Entreno hace años']]],
      ['frecuencia', '¿Cuántos días a la semana puedes entrenar?', [['3', '3 días', 'Lunes, miércoles y viernes'], ['4', '4 días', 'Lun, mar, jue y vie'], ['5', '5 días', 'De lunes a viernes']]]
    ];
    let pagoCtl = null;
    function pintar() {
      const respondidas = PREG.filter((p) => st[p[0]]).length;
      const total = plan.precios[st.periodo];
      v.innerHTML = `<div class="contenedor" style="max-width:860px;padding:26px 20px 60px">
        <nav class="migas"><a href="#/planes">Planes Fit</a><span aria-hidden="true">/</span><span>Plan ${esc(plan.nombre)}</span></nav>
        <div class="fila" style="margin-bottom:14px"><div class="plan__icono" style="--c:${plan.color};--cbg:${window.Arte.mezclar(plan.color, 0.86)};margin:0;width:48px;height:48px">${ic(plan.icono)}</div><div><h1 style="margin:0">Plan ${esc(plan.nombre)}</h1><span class="muted">${esc(plan.lema)}</span></div></div>
        <div class="pasos-wizard"><div class="hecho">1. Personaliza</div><div class="${st.paso >= 2 ? 'hecho' : ''}">2. Pago</div><div class="${st.paso >= 3 ? 'hecho' : ''}">3. ¡Listo!</div></div>
        ${st.paso === 1 ? `<div class="tarjeta"><div class="entre"><h2 style="margin:0">Personaliza tu plan</h2><span class="muted" style="font-weight:650">${respondidas} de 3</span></div>
          <div class="barra-progreso" style="margin:12px 0 22px" role="progressbar" aria-valuenow="${respondidas}" aria-valuemin="0" aria-valuemax="3"><span style="width:${respondidas / 3 * 100}%"></span></div>
          ${PREG.map(([k, t, ops]) => `<h3>${t}</h3><div class="opciones" style="margin-bottom:22px" role="radiogroup" aria-label="${t}">${ops.map(([id, n, s]) => `<button type="button" class="opcion ${String(st[k]) === id ? 'activa' : ''}" data-op="${k}" data-val="${id}" role="radio" aria-checked="${String(st[k]) === id}"><strong>${n}</strong><small>${s}</small></button>`).join('')}</div>`).join('')}
          <div class="entre"><a class="btn btn--fant" href="#/planes">${ic('izq')} Volver</a><button class="btn btn--pri btn--lg" data-siguiente ${respondidas < 3 ? 'disabled' : ''}>Continuar al pago ${ic('der')}</button></div></div>` : ''}
        ${st.paso === 2 ? `<div class="dos-col" style="grid-template-columns:1fr 300px"><div class="tarjeta" data-form-pago><div class="paso-titulo"><span class="num">2</span><h3>Método de pago</h3></div>${F.formularioPago('tarjeta')}
            <p class="tenue" style="font-size:.84rem;margin:14px 0 0">La pasarela guarda tu medio de pago como un token para los cobros recurrentes. Puedes cancelar la renovación en cualquier momento.</p></div>
          <aside class="tarjeta resumen"><h3>Resumen</h3>
            <div class="linea-resumen"><span>Plan</span><strong>${esc(plan.nombre)}</strong></div>
            <div class="linea-resumen"><span>Periodo</span><select class="input" style="width:auto;padding:5px 8px" data-cambiar-periodo>${Object.values(d.periodos).map((x) => `<option value="${x.id}" ${x.id === st.periodo ? 'selected' : ''}>${x.nombre}</option>`).join('')}</select></div>
            <div class="linea-resumen"><span>Objetivo</span><span>${esc(PREG[0][2].find((x) => x[0] === st.objetivo)[1])}</span></div>
            <div class="linea-resumen"><span>Frecuencia</span><span>${st.frecuencia} días</span></div>
            ${d.periodos[st.periodo].desc ? `<div class="linea-resumen"><span>Ahorro</span><span class="desc">−${d.periodos[st.periodo].desc}%</span></div>` : ''}
            <div class="linea-resumen total"><span>Total hoy</span><span>${cop(total)}</span></div>
            <small class="tenue">Se renueva cada ${d.periodos[st.periodo].meses === 1 ? 'mes' : d.periodos[st.periodo].meses + ' meses'} con la misma tarifa.</small>
            <button class="btn btn--pri btn--lg btn--bloque" style="margin-top:16px" data-pagar-sub>${ic('candado')} Pagar y suscribirme</button>
            <button class="btn btn--fant btn--bloque" style="margin-top:6px" data-atras>${ic('izq')} Volver</button></aside></div>` : ''}
        ${st.paso === 3 ? `<div class="resultado resultado--ok confeti" data-confeti><div class="resultado__icono">${ic('trofeo')}</div><h1>¡Bienvenido al plan ${esc(plan.nombre)}!</h1>
          <p class="muted">Tu rutina ya está lista. ${esc(st.mensajePago || '')}</p>
          <div class="fila" style="justify-content:center"><a class="btn btn--pri btn--lg" href="#/mi-plan">Ver mi rutina de hoy</a><a class="btn btn--sec btn--lg" href="#/tienda">Ir a la tienda con mi descuento</a></div></div>` : ''}
      </div>`;
      if (st.paso === 2) pagoCtl = F.conectarPago($('[data-form-pago]', v));
      if (st.paso === 3) lanzarConfeti($('[data-confeti]', v));
    }
    pintar();
    v.addEventListener('click', async (e) => {
      const op = e.target.closest('[data-op]');
      if (op) { st[op.dataset.op] = op.dataset.val; pintar(); return; }
      if (e.target.closest('[data-siguiente]')) { st.paso = 2; pintar(); window.scrollTo({ top: 0 }); return; }
      if (e.target.closest('[data-atras]')) { st.paso = 1; pintar(); return; }
      const pb = e.target.closest('[data-pagar-sub]');
      if (pb) {
        const root = $('[data-form-pago]', v);
        const errores = F.validarPagoCliente(root, pagoCtl.metodo);
        if (Object.keys(errores).length) { F.marcarErrores(root, errores); F.toast('Revisa los datos de pago', 'error'); return; }
        try {
          const r = await F.conCarga(pb, async () => { await F.esperar(900); return Api.post('/fitness/suscripcion', { planId: plan.id, periodo: st.periodo, personalizacion: { objetivo: st.objetivo, experiencia: st.experiencia, frecuencia: +st.frecuencia }, pago: F.leerPago(root, pagoCtl.metodo) }); }, 'Procesando…');
          st.mensajePago = `Pagaste con ${r.pago.detalle} (ref. ${r.pago.referencia}).`;
          await F.refrescarUsuario();
          st.paso = 3; pintar(); window.scrollTo({ top: 0 });
        } catch (err) {
          if (err.status === 402) F.toast('Pago rechazado: ' + err.message + '. No se hizo ningún cobro.', 'error');
          else F.manejarError(err, root);
        }
      }
    });
    v.addEventListener('change', (e) => { if (e.target.matches('[data-cambiar-periodo]')) { st.periodo = e.target.value; pintar(); } });
  });

  function lanzarConfeti(el) {
    if (!el) return;
    const colores = ['#E8743B', '#1D9E75', '#378ADD', '#F2A33A', '#D4537E', '#14213D'];
    for (let i = 0; i < 36; i++) {
      const c = document.createElement('i');
      c.style.left = Math.random() * 100 + '%'; c.style.top = Math.random() * 30 + '%';
      c.style.background = colores[i % colores.length]; c.style.animationDelay = Math.random() * 0.5 + 's';
      el.appendChild(c);
      setTimeout(() => c.remove(), 2400);
    }
  }

  // ======================= MI PLAN (seguimiento) =======================
  function graficoPeso(pesos, color) {
    if (pesos.length < 2) return '<p class="muted">Registra tu peso al menos dos veces para ver tu gráfico de progreso.</p>';
    const W = 640, H = 230, px = 46, py = 26;
    const vals = pesos.map((p) => p.valor);
    const min = Math.floor(Math.min(...vals) - 1), max = Math.ceil(Math.max(...vals) + 1);
    const x = (i) => px + i * (W - px * 1.5) / (pesos.length - 1);
    const y = (val) => py + (max - val) * (H - py * 2) / (max - min);
    const pts = pesos.map((p, i) => `${x(i).toFixed(1)},${y(p.valor).toFixed(1)}`).join(' ');
    const guias = [0, 1, 2, 3].map((k) => { const val = min + (max - min) * k / 3; return `<line x1="${px}" x2="${W - px / 2}" y1="${y(val)}" y2="${y(val)}" stroke="#E4DED4"/><text x="${px - 8}" y="${y(val) + 4}" text-anchor="end" font-size="11" fill="#8A90A0">${val.toFixed(1).replace('.', ',')}</text>`; }).join('');
    const dif = (vals[vals.length - 1] - vals[0]).toFixed(1).replace('.', ',');
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolución del peso: de ${vals[0]} a ${vals[vals.length - 1]} kilogramos"><title>Evolución del peso</title>${guias}
      <polygon points="${px},${H - py} ${pts} ${x(pesos.length - 1)},${H - py}" fill="${color}" opacity=".1"/>
      <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
      ${pesos.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.valor)}" r="5" fill="#fff" stroke="${color}" stroke-width="2.5"><title>${new Date(p.fecha).toLocaleDateString('es-CO')}: ${p.valor} kg</title></circle>
        <text x="${x(i)}" y="${H - 6}" text-anchor="middle" font-size="11" fill="#8A90A0">${new Date(p.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}</text>`).join('')}
    </svg><p class="muted" style="margin:6px 0 0;font-size:.9rem">Cambio total: <strong>${dif.startsWith('-') ? dif : '+' + dif} kg</strong> desde tu primer registro.</p>`;
  }

  F.registrar('mi-plan', async (v) => {
    F.titulo('Mi plan');
    if (!F.requiereSesion()) return;
    let d;
    try { d = await Api.get('/fitness/mi-plan'); }
    catch (e) {
      if (e.data && e.data.sinSuscripcion) {
        v.innerHTML = `<div class="contenedor">${F.vacioHtml('pesa', 'Todavía no tienes un Plan Fit', 'Suscríbete para recibir tu rutina semanal personalizada, seguimiento y descuentos en la tienda.', '<a class="btn btn--pri btn--lg" href="#/planes">Ver los planes</a>')}</div>`;
        return;
      }
      throw e;
    }
    let diaSel = d.rutinaHoy ? d.hoy : d.rutina[0].dow;
    function pintar() {
      const p = d.plan, dia = d.rutina.find((x) => x.dow === diaSel) || d.rutina[0];
      const pct = d.resumen.total ? Math.round(d.resumen.hechos / d.resumen.total * 100) : 0;
      const tieneGrafico = p.nivel >= 2;
      v.innerHTML = `<div class="contenedor" style="padding:26px 20px 60px">
        <div class="cab-plan" style="--c:${p.color}"><div class="entre"><div><span class="chip-cl">${ic(p.icono)} Plan ${esc(p.nombre)} · semana ${d.semanaPlan}</span>
          <h1 style="margin:14px 0 8px">Hola, ${esc(S.user.nombre.split(' ')[0])}. ${d.rutinaHoy ? '¡Hoy toca entrenar!' : 'Hoy es día de descanso.'}</h1>
          <div class="fila" style="gap:8px"><span class="chip-cl">${esc(d.personalizacion.objetivo)}</span><span class="chip-cl">${esc(d.personalizacion.experiencia)}</span><span class="chip-cl">${d.personalizacion.frecuencia} días por semana</span></div></div>
          <div class="fila"><button class="btn" style="background:#fff;color:var(--navy);border-color:#fff" data-ver-hoy>${ic('play')} Ver rutina de hoy</button><button class="btn" style="background:transparent;color:#fff;border-color:rgba(255,255,255,.5)" data-personalizar>${ic('ajustes')} Personalizar</button></div></div>
          <p class="cita">“${esc(d.mensaje)}”</p><small style="opacity:.8">Mensaje motivacional de la semana</small></div>
        <div class="kpis" style="margin:18px 0 24px">
          <div class="kpi"><small>${ic('check')} Ejercicios esta semana</small><strong>${d.resumen.hechos} / ${d.resumen.total}</strong><div class="barra-progreso barra-progreso--verde" style="margin-top:8px"><span style="width:${pct}%"></span></div></div>
          <div class="kpi"><small>${ic('calendario')} Días completos</small><strong>${d.resumen.diasCompletos} de ${d.resumen.dias}</strong><span>Esta semana</span></div>
          <div class="kpi"><small>${ic('pulso')} Peso actual</small><strong>${d.pesos.length ? String(d.pesos[d.pesos.length - 1].valor).replace('.', ',') + ' kg' : '—'}</strong><span>${d.pesos.length ? 'Último registro ' + F.hace(d.pesos[d.pesos.length - 1].fecha) : 'Sin registros'}</span></div>
          <div class="kpi"><small>${ic('tarjeta')} Próximo cobro</small><strong style="font-size:1.25rem">${F.fecha(d.suscripcion.proximoCobro)}</strong><span>${d.suscripcion.renovacionAuto ? cop(d.suscripcion.precio) + ' · ' + esc(d.suscripcion.periodoNombre.toLowerCase()) : 'Renovación cancelada'}</span></div>
        </div>
        <div class="dos-col" style="grid-template-columns:1.2fr 1fr">
          <section class="tarjeta" id="rutina-hoy"><div class="entre"><h2 style="margin:0">${dia.dow === d.hoy ? 'Rutina de hoy' : 'Rutina del ' + esc(dia.dia.toLowerCase())}</h2><span class="pill ${dia.pct === 100 ? 'pill--verde' : 'pill--naranja'}">${dia.pct}% completado</span></div>
            ${!d.rutinaHoy && dia.dow === d.rutina[0].dow && diaSel === d.rutina[0].dow ? `<p class="nota" style="margin:12px 0 0">${ic('info')}<span>Hoy (${esc(d.hoyNombre.toLowerCase())}) es día de descanso activo. Tu próximo entrenamiento es el <strong>${esc(d.proximoDia.toLowerCase())}</strong>.</span></p>` : ''}
            <div class="barra-progreso barra-progreso--verde" style="margin:14px 0"><span style="width:${dia.pct}%"></span></div>
            <div role="list">${dia.ejercicios.map((e) => `<label class="ejercicio ${e.hecho ? 'hecho' : ''}" role="listitem"><input type="checkbox" data-ej="${e.idx}" ${e.hecho ? 'checked' : ''}><span class="nombre">${esc(e.nombre)}</span><span class="series">${esc(e.series)}</span></label>`).join('')}</div>
            <h3 style="margin-top:22px">Tu semana</h3><div class="semana">${d.rutina.map((x) => `<button class="dia ${x.dow === d.hoy ? 'hoy' : ''} ${x.dow === diaSel ? 'sel' : ''}" data-dia="${x.dow}"><strong>${esc(x.dia)}</strong><small>${x.hechos}/${x.ejercicios.length} ejercicios${x.dow === d.hoy ? ' · hoy' : ''}</small><div class="barra-progreso barra-progreso--verde" style="margin-top:8px;height:6px"><span style="width:${x.pct}%"></span></div></button>`).join('')}</div>
          </section>
          <section class="tarjeta"><h2>Progreso de peso</h2>
            ${tieneGrafico ? `<div class="grafico">${graficoPeso(d.pesos, p.color === '#14213D' ? '#E8743B' : p.color)}</div>
              <form class="fila" style="margin-top:16px;flex-wrap:nowrap" data-peso novalidate><div class="campo" style="flex:1"><input name="peso" inputmode="decimal" placeholder="Tu peso de hoy en kg (ej. 76,2)" aria-label="Peso de hoy en kilogramos"></div><button class="btn btn--osc">Registrar</button></form>`
    : `<div class="nota nota--naranja">${ic('candado')}<div><strong>Disponible desde el plan Avanzado.</strong> Mejora tu plan para ver el gráfico de peso y progreso.<br><a class="enlace" href="#/planes">Ver planes</a></div></div>`}
            <h3 style="margin-top:22px">Consejo de la semana</h3>
            <p class="muted" style="margin:0">${d.personalizacion.objetivo === 'Perder peso' ? 'Combina tus rutinas con una caminata diaria de 30 minutos y prioriza la proteína en cada comida.' : d.personalizacion.objetivo === 'Ganar músculo' ? 'Aumenta el peso poco a poco cuando completes todas las series con buena técnica. Duerme al menos 7 horas.' : 'Mantén una intensidad en la que puedas hablar con frases cortas (zona 2) y aumenta 10% el volumen cada semana.'}</p>
            ${p.nivel >= 2 ? `<a class="btn btn--sec btn--sm" style="margin-top:14px" href="#/tienda/suplementos">${ic('etiqueta')} Suplementos con tu ${p.descTienda}% de descuento</a>` : ''}
          </section></div></div>`;
    }
    pintar();
    v.addEventListener('change', async (e) => {
      const cb = e.target.closest('[data-ej]');
      if (!cb) return;
      cb.disabled = true;
      try {
        const antes = (d.rutina.find((x) => x.dow === diaSel) || {}).pct;
        d = await Api.post('/fitness/progreso', { tipo: 'ejercicio', dow: diaSel, idx: +cb.dataset.ej, hecho: cb.checked });
        const ahora = (d.rutina.find((x) => x.dow === diaSel) || {}).pct;
        pintar();
        if (ahora === 100 && antes !== 100) F.toast('¡Completaste la rutina del día! Sigue así.');
      } catch (err) { F.manejarError(err); pintar(); }
    });
    v.addEventListener('click', (e) => {
      const db = e.target.closest('[data-dia]');
      if (db) { diaSel = +db.dataset.dia; pintar(); return; }
      if (e.target.closest('[data-ver-hoy]')) { if (d.rutinaHoy) diaSel = d.hoy; pintar(); $('#rutina-hoy', v).scrollIntoView({ behavior: 'smooth' }); return; }
      if (e.target.closest('[data-personalizar]')) {
        const sub = d.suscripcion.personalizacion;
        const m = F.modal(`<h2>Personaliza tu plan</h2><p class="muted">Tu rutina se ajusta al instante.</p><form class="pila" data-form-per>
          ${F.campo('objetivo', 'Objetivo', { tipo: 'select', valor: sub.objetivo, opciones: Object.entries(S.meta.objetivos) })}
          ${F.campo('experiencia', 'Experiencia', { tipo: 'select', valor: sub.experiencia, opciones: Object.entries(S.meta.experiencias) })}
          ${F.campo('frecuencia', 'Días por semana', { tipo: 'select', valor: sub.frecuencia, opciones: [['3', '3 días'], ['4', '4 días'], ['5', '5 días']] })}
          <button class="btn btn--pri btn--bloque">Guardar cambios</button></form>`, { etiqueta: 'Personalizar plan' });
        m.el.querySelector('[data-form-per]').addEventListener('submit', async (ev) => {
          ev.preventDefault();
          const f = ev.target;
          try { await Api.put('/fitness/suscripcion', { accion: 'personalizar', personalizacion: { objetivo: f.objetivo.value, experiencia: f.experiencia.value, frecuencia: +f.frecuencia.value } }); m.cerrar(); F.toast('Tu rutina se actualizó'); d = await Api.get('/fitness/mi-plan'); diaSel = d.rutinaHoy ? d.hoy : d.rutina[0].dow; pintar(); }
          catch (err) { F.manejarError(err); }
        });
      }
    });
    v.addEventListener('submit', async (e) => {
      if (!e.target.matches('[data-peso]')) return;
      e.preventDefault();
      const val = e.target.peso.value.trim();
      if (!val) { F.marcarErrores(e.target, { peso: 'Escribe tu peso' }); return; }
      try { d = await Api.post('/fitness/progreso', { tipo: 'peso', valor: val }); pintar(); F.toast('Peso registrado'); }
      catch (err) { F.marcarErrores(e.target, { peso: err.message }); }
    });
  });

  // ======================= COMUNIDAD (Épica 12) =======================
  const FONDOS = { llama: '#E8743B', corona: '#14213D', hoja: '#1D9E75', pesa: '#7F77DD' };
  F.registrar('comunidad', async (v, segs, q) => {
    F.titulo('Comunidad');
    const tab = ['muro', 'retos', 'eventos'].includes(q.tab) ? q.tab : 'muro';
    const [posts, retos, eventos] = await Promise.all([Api.get('/community/posts'), Api.get('/community/retos'), Api.get('/community/eventos')]);
    const u = S.user;
    const lado = `<aside class="pila">
      ${u ? `<div class="tarjeta tarjeta--plana"><h3>Mis insignias</h3>${u.insignias && u.insignias.length ? `<div class="insignias">${u.insignias.map((i) => `<span class="insignia"><span style="background:${esc(i.color)}">${ic(i.icono === 'ruta' ? 'ruta' : i.icono === 'gota' ? 'gota' : 'llama')}</span>${esc(i.nombre)}</span>`).join('')}</div>` : '<p class="muted" style="margin:0">Completa un reto para ganar tu primera insignia.</p>'}</div>` : `<div class="tarjeta tarjeta--plana"><h3>Únete a la conversación</h3><p class="muted">Inicia sesión para publicar, comentar y unirte a los retos.</p><a class="btn btn--pri btn--bloque" href="#/login?volver=%2Fcomunidad">Iniciar sesión</a></div>`}
      <div class="tarjeta tarjeta--plana"><h3>Próximo evento</h3>${eventos[0] ? `<p style="margin:0"><strong>${esc(eventos[0].titulo)}</strong><br><small class="muted">${F.fechaHora(eventos[0].fecha)} · ${esc(eventos[0].tipo)}</small></p><a class="enlace" href="#/comunidad?tab=eventos">Ver calendario →</a>` : ''}</div>
      <div class="tarjeta tarjeta--plana"><h3>Normas de la comunidad</h3><p class="muted" style="margin:0;font-size:.9rem">Respeto ante todo. Los mensajes ofensivos se bloquean y las publicaciones con 3 reportes se ocultan para revisión (RN-E 2). La información de salud la revisan profesionales certificados (RN-E 1).</p></div></aside>`;
    function postHtml(p) {
      return `<article class="post" data-post="${p.id}"><div class="post__cab"><span class="avatar" style="background:${esc(p.avatarColor)}">${esc(F.iniciales(p.autor))}</span><div><strong>${esc(p.autor)}</strong><br><small>${F.hace(p.fecha)}</small></div><span class="tipo-post tipo-post--${p.tipo}">${p.tipo}</span></div>
        ${p.tipo === 'logro' && p.fondo ? `<div class="logro-card" style="background:${FONDOS[p.fondo] || '#E8743B'}">${ic(p.fondo === 'pesa' ? 'pesa' : p.fondo)}<p>${esc(p.texto)}</p></div>` : `<p style="margin:0 0 4px;white-space:pre-line">${esc(p.texto)}</p>`}
        <div class="post__acciones"><button class="${p.meGusta ? 'on' : ''}" data-like aria-pressed="${p.meGusta}">${ic('corazon')} ${p.likes} Me gusta</button><button data-abrir-com>${ic('chat')} ${p.comentarios.length} Comentar</button>
          ${p.puedeBorrar ? `<button data-borrar style="margin-left:auto">${ic('basura')} Eliminar</button>` : `<button data-reportar style="margin-left:auto" ${p.reportado ? 'disabled' : ''}>${ic('bandera')} ${p.reportado ? 'Reportado' : 'Reportar'}</button>`}</div>
        <div class="comentarios" data-comentarios ${p.comentarios.length ? '' : 'hidden'}>${p.comentarios.map((c) => `<div class="comentario"><div class="entre"><strong>${esc(c.autor)}</strong><small class="tenue">${F.hace(c.fecha)}</small></div>${esc(c.texto)}
          <div><button class="enlace" style="font-size:.8rem;color:${c.meGusta ? '#D4537E' : 'var(--texto-3)'}" data-like-com="${c.id}">${c.meGusta ? '♥' : '♡'} ${c.likes}</button></div></div>`).join('')}
          ${u ? `<form class="fila" data-comentar style="flex-wrap:nowrap"><input class="input" name="texto" placeholder="Escribe un comentario…" maxlength="300" aria-label="Comentario"><button class="btn btn--osc btn--sm">Enviar</button></form>` : ''}</div></article>`;
    }
    function retoHtml(r) {
      const yo = r.yo;
      return `<article class="reto" data-reto="${r.id}"><div class="fila"><div class="reto__icono" style="background:${esc(r.color)}">${ic(r.icono === 'ruta' ? 'ruta' : r.icono === 'gota' ? 'gota' : 'llama')}</div><div><h3 style="margin:0">${esc(r.titulo)}</h3><small class="muted">${r.participantes} participantes · ${r.completados} completaron</small></div></div>
        <p class="muted" style="margin:0">${esc(r.desc)}</p><span class="pill pill--naranja">${ic('medalla')} Insignia: ${esc(r.insignia)}</span>
        ${yo ? `<div><div class="entre" style="font-size:.88rem;font-weight:650"><span>Tu avance</span><span>${yo.avance} / ${r.dias} días</span></div><div class="barra-progreso ${yo.completado ? 'barra-progreso--verde' : ''}" style="margin-top:6px"><span style="width:${Math.min(100, yo.avance / r.dias * 100)}%"></span></div></div>
          ${yo.completado ? `<span class="alerta alerta--ok">${ic('trofeo')} ¡Reto completado! Ganaste “${esc(r.insignia)}”.</span>` : `<button class="btn btn--pri" data-avance ${yo.hoyRegistrado ? 'disabled' : ''}>${yo.hoyRegistrado ? ic('check') + ' Avance de hoy registrado' : ic('mas') + ' Registrar el avance de hoy'}</button>`}`
    : `<button class="btn btn--osc" data-unirse>${ic('usuarios')} Unirme al reto</button>`}</article>`;
    }
    function eventoHtml(e) {
      const f = new Date(e.fecha);
      const lleno = e.inscritos >= e.cupos;
      return `<article class="evento" data-evento="${e.id}"><div class="fecha-bloque"><strong>${f.getDate()}</strong><small>${f.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '')}</small></div>
        <div><div class="fila" style="gap:6px;margin-bottom:4px"><span class="pill pill--azul">${esc(e.tipo)}</span>${e.premium ? `<span class="pill pill--navy">${ic('corona')} Exclusivo Élite</span>` : ''}</div>
          <h3 style="margin:0">${esc(e.titulo)}</h3><small class="muted">${f.toLocaleDateString('es-CO', { weekday: 'long' })}, ${f.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })} · ${esc(e.duracion)} · ${esc(e.anfitrion)} · ${e.inscritos}/${e.cupos} cupos</small></div>
        <button class="btn ${e.asistire ? 'ok' : lleno ? '' : 'btn--pri'}" data-asistir ${lleno && !e.asistire ? 'disabled' : ''}>${e.asistire ? ic('check') + ' Asistiré' : lleno ? 'Sin cupos' : 'Asistiré'}</button></article>`;
    }
    v.innerHTML = `<div class="contenedor" style="padding:26px 20px 60px"><span class="eyebrow">Comunidad FITOPÍA</span><h1>Entrena acompañado</h1>
      <p class="muted" style="max-width:640px">Comparte tus logros, aprende de otros, súmate a los retos de la semana y no te pierdas los eventos en vivo.</p>
      <nav class="tabs" aria-label="Secciones de la comunidad"><a href="#/comunidad" class="${tab === 'muro' ? 'activo' : ''}">${ic('chat')} Muro</a><a href="#/comunidad?tab=retos" class="${tab === 'retos' ? 'activo' : ''}">${ic('trofeo')} Retos</a><a href="#/comunidad?tab=eventos" class="${tab === 'eventos' ? 'activo' : ''}">${ic('calendario')} Eventos</a></nav>
      <div class="feed"><div>
        ${tab === 'muro' ? `${u ? `<form class="post" data-publicar novalidate><div class="post__cab"><span class="avatar" style="background:${esc(u.avatarColor)}">${esc(F.iniciales(u.nombre))}</span><strong>¿Qué quieres compartir hoy?</strong></div>
            <div class="campo"><textarea name="texto" placeholder="Cuenta tu logro, comparte un tip o haz una pregunta…" maxlength="500" aria-label="Texto de la publicación"></textarea></div>
            <div class="entre" style="margin-top:10px"><div class="fila" style="gap:8px"><select class="input" name="tipo" style="width:auto;padding:8px 10px" aria-label="Tipo de publicación"><option value="logro">Logro</option><option value="tip">Tip</option><option value="pregunta">Pregunta</option></select>
              <span class="fila" style="gap:4px" data-fondos>${Object.entries(FONDOS).map(([k, c], i) => `<button type="button" class="icon-btn" style="width:30px;height:30px;background:${c};color:#fff;${i === 0 ? 'box-shadow:0 0 0 3px #fff,0 0 0 5px ' + c : ''}" data-fondo="${k}" aria-label="Fondo ${k}" title="Fondo de la tarjeta de logro">${ic(k === 'pesa' ? 'pesa' : k)}</button>`).join('')}</span></div>
              <button class="btn btn--pri">Publicar</button></div><input type="hidden" name="fondo" value="llama"></form>` : ''}
          <div data-lista>${posts.map(postHtml).join('') || '<p class="muted">Todavía no hay publicaciones.</p>'}</div>` : ''}
        ${tab === 'retos' ? `<div class="grid-prod" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">${retos.map(retoHtml).join('')}</div>` : ''}
        ${tab === 'eventos' ? `<div>${eventos.map(eventoHtml).join('')}</div>` : ''}
      </div>${lado}</div></div>`;

    const pedirSesion = () => { F.toast('Inicia sesión para participar', 'info'); location.hash = '#/login?volver=' + encodeURIComponent('/comunidad' + (tab !== 'muro' ? '?tab=' + tab : '')); };
    const reemplazar = (sel, html) => { const el = $(sel, v); if (el) el.outerHTML = html; };
    v.addEventListener('click', async (e) => {
      const t = e.target;
      const fb = t.closest('[data-fondo]');
      if (fb) { v.querySelector('[name="fondo"]').value = fb.dataset.fondo; $$('[data-fondo]', v).forEach((b) => { b.style.boxShadow = b === fb ? `0 0 0 3px #fff,0 0 0 5px ${FONDOS[b.dataset.fondo]}` : ''; }); return; }
      const post = t.closest('[data-post]');
      if (post) {
        const id = post.dataset.post;
        if (t.closest('[data-abrir-com]')) { const c = $('[data-comentarios]', post); c.hidden = false; const i = c.querySelector('input'); if (i) i.focus(); else pedirSesion(); return; }
        if (!u && (t.closest('[data-like]') || t.closest('[data-reportar]') || t.closest('[data-like-com]'))) return pedirSesion();
        try {
          if (t.closest('[data-like]')) { const p = await Api.post(`/community/posts/${id}/like`); reemplazar(`[data-post="${id}"]`, postHtml(p)); }
          else if (t.closest('[data-like-com]')) { const p = await Api.post(`/community/posts/${id}/comments/${t.closest('[data-like-com]').dataset.likeCom}/like`); reemplazar(`[data-post="${id}"]`, postHtml(p)); $(`[data-post="${id}"] [data-comentarios]`, v).hidden = false; }
          else if (t.closest('[data-reportar]')) { if (!(await F.confirmar('El equipo de moderación revisará esta publicación.', { titulo: 'Reportar publicación', boton: 'Reportar' }))) return; const r = await Api.post(`/community/posts/${id}/report`); F.toast(r.mensaje, 'info'); F.recargar(); }
          else if (t.closest('[data-borrar]')) { if (!(await F.confirmar('Esta acción no se puede deshacer.', { titulo: 'Eliminar publicación', boton: 'Eliminar', peligro: true }))) return; await Api.del(`/community/posts/${id}`); post.remove(); F.toast('Publicación eliminada'); }
        } catch (err) { F.manejarError(err); }
        return;
      }
      const reto = t.closest('[data-reto]');
      if (reto) {
        if (!u) return pedirSesion();
        try {
          if (t.closest('[data-unirse]')) { const r = await Api.post(`/community/retos/${reto.dataset.reto}/unirse`); reemplazar(`[data-reto="${r.id}"]`, retoHtml(r)); F.toast('¡Te uniste a ' + r.titulo + '!'); }
          if (t.closest('[data-avance]')) {
            const r = await Api.post(`/community/retos/${reto.dataset.reto}/avance`);
            reemplazar(`[data-reto="${r.id}"]`, retoHtml(r));
            if (r.insigniaGanada) {
              await F.refrescarUsuario();
              const m = F.modal(`<div class="centro confeti" data-confeti><div class="resultado__icono" style="background:${esc(r.color)}">${ic('trofeo')}</div><h2>¡Ganaste una insignia!</h2><p class="muted">Completaste “${esc(r.titulo)}” y obtuviste <strong>${esc(r.insigniaGanada)}</strong>.</p><button class="btn btn--pri" data-cerrar>¡Genial!</button></div>`, { etiqueta: 'Insignia ganada' });
              lanzarConfeti(m.el.querySelector('[data-confeti]'));
            } else F.toast('Avance registrado: día ' + r.yo.avance + ' de ' + r.dias);
          }
        } catch (err) { F.manejarError(err); }
        return;
      }
      const ev = t.closest('[data-evento]');
      if (ev && t.closest('[data-asistir]')) {
        if (!u) return pedirSesion();
        try {
          const r = await Api.post(`/community/eventos/${ev.dataset.evento}/asistir`);
          const e2 = eventos.find((x) => x.id === ev.dataset.evento); e2.asistire = r.asistire; e2.inscritos = r.inscritos;
          reemplazar(`[data-evento="${e2.id}"]`, eventoHtml(e2));
          F.toast(r.mensaje, r.asistire ? 'ok' : 'info');
        } catch (err) { F.manejarError(err); }
      }
    });
    v.addEventListener('submit', async (e) => {
      const f = e.target;
      e.preventDefault();
      if (f.matches('[data-publicar]')) {
        try { const p = await Api.post('/community/posts', { texto: f.texto.value, tipo: f.tipo.value, fondo: f.fondo.value }); $('[data-lista]', v).insertAdjacentHTML('afterbegin', postHtml(p)); f.texto.value = ''; F.toast('¡Publicado!'); }
        catch (err) { F.manejarError(err, f); }
      }
      if (f.matches('[data-comentar]')) {
        const id = f.closest('[data-post]').dataset.post;
        if (!f.texto.value.trim()) return;
        try { const p = await Api.post(`/community/posts/${id}/comments`, { texto: f.texto.value }); reemplazar(`[data-post="${id}"]`, postHtml(p)); $(`[data-post="${id}"] [data-comentarios]`, v).hidden = false; }
        catch (err) { F.manejarError(err); }
      }
    });
  });

  // ======================= MI CUENTA (Épica 11) =======================
  const ESTADO_PILL = { 'Pagado': 'pill--azul', 'En preparación': 'pill--naranja', 'Enviado': 'pill--naranja', 'Entregado': 'pill--verde', 'Cancelado': 'pill--rojo' };
  F.registrar('cuenta', async (v, segs) => {
    F.titulo('Mi cuenta');
    if (!F.requiereSesion()) return;
    await F.refrescarUsuario();
    const u = S.user;
    const tab = segs[0] || 'datos';
    const TABS = [['datos', 'usuario', 'Mis datos'], ['pedidos', 'recibo', 'Mis pedidos'], ['suscripcion', 'pesa', 'Mi suscripción'], ['notificaciones', 'campana', 'Notificaciones'], ['seguridad', 'candado', 'Seguridad'], ['soporte', 'soporte', 'Soporte']];
    let contenido = '';
    if (tab === 'datos') {
      const colores = ['#E8743B', '#1D9E75', '#378ADD', '#7F77DD', '#D4537E', '#14213D'];
      contenido = `<h1>Mis datos</h1><div class="tarjeta"><div class="fila" style="margin-bottom:20px"><span class="avatar avatar--lg" data-avatar style="background:${esc(u.avatarColor)}">${esc(F.iniciales(u.nombre))}</span>
        <div><strong>Tu avatar</strong><p class="muted" style="margin:2px 0 8px;font-size:.9rem">Usamos tu inicial. Elige el color:</p><div class="fila" style="gap:6px">${colores.map((c) => `<button type="button" class="icon-btn" style="width:30px;height:30px;background:${c};${c === u.avatarColor ? 'box-shadow:0 0 0 3px #fff,0 0 0 5px ' + c : ''}" data-color="${c}" aria-label="Color ${c}"></button>`).join('')}</div></div></div>
        <form class="form-grid" data-datos novalidate>${F.campo('nombre', 'Nombre completo', { valor: u.nombre })}${F.campo('email', 'Correo electrónico', { valor: u.email, attrs: { disabled: '' }, ayuda: 'El correo identifica tu cuenta y no se puede cambiar.' })}
          ${F.campo('telefono', 'Celular', { valor: u.telefono, attrs: { inputmode: 'numeric', placeholder: '300 123 4567' } })}${F.campo('ciudad', 'Ciudad', { valor: u.ciudad })}
          ${F.campo('direccion', 'Dirección de envío', { clase: 'completo', valor: u.direccion })}
          <div class="completo"><button class="btn btn--pri">Guardar cambios</button></div></form></div>
        <p class="tenue" style="font-size:.85rem;margin-top:12px">Cliente desde ${F.fecha(u.creado, { month: 'long', year: 'numeric' })}. Tus datos se tratan según la Ley 1581 de 2012 (Habeas Data).</p>`;
    } else if (tab === 'pedidos') {
      const pedidos = await Api.get('/orders');
      contenido = `<h1>Mis pedidos</h1>${pedidos.length ? `<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Pedido</th><th>Fecha</th><th>Productos</th><th>Total</th><th>Estado</th><th></th></tr></thead><tbody>
        ${pedidos.map((o) => `<tr><td><strong>${esc(o.id)}</strong></td><td>${F.fecha(o.fecha)}</td><td>${o.lineas.map((l) => esc(l.nombre)).slice(0, 2).join(', ')}${o.lineas.length > 2 ? ' y ' + (o.lineas.length - 2) + ' más' : ''}</td><td><strong>${cop(o.total)}</strong></td><td><span class="pill ${ESTADO_PILL[o.estado] || ''}">${esc(o.estado)}</span></td><td><a class="btn btn--sec btn--sm" href="#/pedido/${esc(o.id)}">Ver detalle</a></td></tr>`).join('')}</tbody></table></div>`
    : F.vacioHtml('recibo', 'Aún no tienes pedidos', 'Cuando compres algo, aquí verás el estado de la entrega.', '<a class="btn btn--pri" href="#/tienda">Ir a la tienda</a>')}`;
    } else if (tab === 'suscripcion') {
      const s = u.suscripcion;
      contenido = `<h1>Mi suscripción</h1>${s ? `<div class="cab-plan" style="--c:${esc(s.color)}"><span class="chip-cl">${ic(s.icono)} Plan ${esc(s.plan)}</span><h2 style="margin:12px 0 4px">${cop(s.precio)} <small style="font-weight:500;opacity:.85">/ ${esc(s.periodoNombre.toLowerCase())}</small></h2>
          <p style="margin:0;opacity:.9">${s.renovacionAuto ? 'Se renueva automáticamente el ' + F.fecha(s.proximoCobro) : 'La renovación está cancelada. Tu plan sigue activo hasta el ' + F.fecha(s.proximoCobro)}</p></div>
        <div class="tarjeta" style="margin-top:16px"><table class="specs"><tbody><tr><th>Activa desde</th><td>${F.fecha(s.inicio)}</td></tr><tr><th>Medio de pago</th><td>${esc(s.metodo)} (token seguro en la pasarela)</td></tr>
          <tr><th>Tarifa</th><td>Garantizada mientras mantengas la suscripción (RN-P 3)</td></tr><tr><th>Beneficio en tienda</th><td>${s.descTienda ? s.descTienda + '% de descuento' : 'Sin descuento'}${s.envioGratis ? ' · envío gratis siempre' : ''}</td></tr></tbody></table>
          <div class="fila" style="margin-top:18px"><a class="btn btn--osc" href="#/mi-plan">${ic('pesa')} Ir a mi plan</a><a class="btn btn--sec" href="#/planes">Cambiar de plan</a>
          ${s.renovacionAuto ? '<button class="btn btn--peligro" data-cancelar-sub>Cancelar renovación</button>' : '<button class="btn btn--pri" data-reactivar-sub>Reactivar renovación</button>'}</div></div>`
    : F.vacioHtml('pesa', 'No tienes una suscripción activa', 'Elige un Plan Fit y recibe tu rutina personalizada.', '<a class="btn btn--pri" href="#/planes">Ver planes</a>')}`;
    } else if (tab === 'notificaciones') {
      const n = u.notif;
      const alertas = [];
      if (u.suscripcion && u.suscripcion.descTienda) alertas.push(['corona', `Tienes ${u.suscripcion.descTienda}% de descuento en toda la tienda por tu plan ${u.suscripcion.plan}.`]);
      alertas.push(['etiqueta', 'Usa el cupón FITO10 y obtén 10% de descuento en tu próxima compra.']);
      alertas.push(['rayo', 'Nuevo en la tienda: estación multifuncional Home Gym X9.']);
      contenido = `<h1>Notificaciones</h1><div class="tarjeta"><h3>Correos que quieres recibir</h3>
        ${[['pedidos', 'Estado de mis pedidos', 'Confirmación, envío y entrega'], ['promociones', 'Descuentos y novedades', 'Ofertas y productos nuevos'], ['comunidad', 'Comunidad', 'Respuestas, retos y eventos']].map(([k, t, s]) => `<div class="entre" style="padding:12px 0;border-bottom:1px solid var(--borde)"><div><strong>${t}</strong><br><small class="muted">${s}</small></div><label class="switch"><input type="checkbox" data-notif="${k}" ${n[k] ? 'checked' : ''} aria-label="${t}"><span></span></label></div>`).join('')}</div>
        <div class="tarjeta" style="margin-top:16px"><h3>Alertas para ti</h3><div class="pila">${alertas.map(([i, t]) => `<div class="nota nota--naranja">${ic(i)}<span>${esc(t)}</span></div>`).join('')}</div></div>`;
    } else if (tab === 'seguridad') {
      contenido = `<h1>Seguridad</h1><div class="tarjeta"><h3>Cambiar contraseña</h3><p class="muted">Por seguridad te pedimos tu contraseña actual (RS 05).</p>
        <form class="pila" data-pw novalidate style="max-width:420px">${F.campo('actual', 'Contraseña actual', { tipo: 'password', attrs: { autocomplete: 'current-password' } })}${F.campo('nueva', 'Nueva contraseña', { tipo: 'password', attrs: { autocomplete: 'new-password' }, ayuda: 'Mínimo 8 caracteres, una mayúscula y un número.' })}${F.campo('confirma', 'Confirma la nueva contraseña', { tipo: 'password', attrs: { autocomplete: 'new-password' } })}
        <button class="btn btn--pri">Actualizar contraseña</button></form></div>
        <div class="tarjeta" style="margin-top:16px"><h3>Cómo protegemos tu cuenta</h3><ul class="checklist" style="font-size:.93rem">
          <li class="cumple">${ic('check')} Tu contraseña se guarda cifrada con un hash irreversible (RS 02).</li><li class="cumple">${ic('check')} Tu sesión usa un token JWT que expira en 2 horas (RS 03).</li>
          <li class="cumple">${ic('check')} Después de 5 intentos fallidos bloqueamos el acceso por 5 minutos (RS 06).</li><li class="cumple">${ic('check')} Toda la comunicación viaja cifrada por HTTPS en producción (RS 01).</li></ul></div>`;
    } else if (tab === 'soporte') {
      contenido = `<h1>Soporte</h1><div class="tarjeta"><p class="muted">¿Tienes un problema con un pedido, un pago o tu plan? Escríbenos: respondemos en máximo 24 horas (RN-C 1).</p><div data-ok-soporte></div>
        <form class="pila" data-soporte novalidate>${F.campo('asunto', 'Asunto', { tipo: 'select', opciones: [['', 'Elige un asunto'], ['Problema con un pedido', 'Problema con un pedido'], ['Problema con un pago', 'Problema con un pago'], ['Mi Plan Fit', 'Mi Plan Fit'], ['Mi cuenta', 'Mi cuenta'], ['Otro', 'Otro']] })}
          ${F.campo('descripcion', 'Cuéntanos qué pasó', { tipo: 'textarea', attrs: { maxlength: 1000, placeholder: 'Incluye el número de pedido si aplica (ej. FTP-1041)' } })}
          ${F.campo('adjunto', 'Adjunto (opcional)', { tipo: 'file', attrs: { accept: 'image/*,.pdf' }, ayuda: 'En esta versión de prueba el archivo no se sube; solo registramos su nombre.' })}
          <button class="btn btn--pri">Enviar solicitud</button></form></div>`;
    }
    v.innerHTML = `<div class="contenedor"><div class="panel"><nav class="lateral" aria-label="Mi cuenta"><div class="lateral__cab"><span class="avatar" style="background:${esc(u.avatarColor)}">${esc(F.iniciales(u.nombre))}</span><div><strong>${esc(u.nombre)}</strong><small>${esc(u.email)}</small></div></div>
      <a href="#/">${ic('casa')} Inicio</a>${TABS.map(([id, i, t]) => `<a href="#/cuenta/${id}" class="${tab === id ? 'activo' : ''}">${ic(i)} ${t}</a>`).join('')}<a href="#/mi-plan">${ic('pulso')} Planes Fit</a><button data-cerrar-sesion>${ic('salir')} Cerrar sesión</button></nav>
      <div>${contenido}</div></div></div>`;

    v.addEventListener('click', async (e) => {
      const c = e.target.closest('[data-color]');
      if (c) { try { await Api.put('/auth/me', { avatarColor: c.dataset.color }); await F.refrescarUsuario(); F.toast('Color actualizado'); F.recargar(); } catch (err) { F.manejarError(err); } return; }
      if (e.target.closest('[data-cancelar-sub]')) {
        if (!(await F.confirmar('Tu plan seguirá activo hasta el final del periodo pagado y no se volverá a cobrar.', { titulo: 'Cancelar renovación automática', boton: 'Cancelar renovación', peligro: true }))) return;
        try { await Api.put('/fitness/suscripcion', { accion: 'cancelar' }); F.toast('Cancelaste la renovación automática', 'info'); F.recargar(); } catch (err) { F.manejarError(err); }
      }
      if (e.target.closest('[data-reactivar-sub]')) { try { await Api.put('/fitness/suscripcion', { accion: 'reactivar' }); F.toast('Renovación reactivada'); F.recargar(); } catch (err) { F.manejarError(err); } }
    });
    v.addEventListener('change', async (e) => {
      const n = e.target.closest('[data-notif]');
      if (n) { try { await Api.put('/auth/me', { notif: { [n.dataset.notif]: n.checked } }); F.toast(n.checked ? 'Notificación activada' : 'Notificación desactivada', 'info'); } catch (err) { n.checked = !n.checked; F.manejarError(err); } }
    });
    v.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      try {
        if (f.matches('[data-datos]')) { await F.conCarga(f.querySelector('.btn'), () => Api.put('/auth/me', { nombre: f.nombre.value, telefono: f.telefono.value, ciudad: f.ciudad.value, direccion: f.direccion.value }), 'Guardando…'); await F.refrescarUsuario(); F.toast('Tus datos se guardaron'); F.recargar(); }
        if (f.matches('[data-pw]')) {
          if (f.nueva.value !== f.confirma.value) { F.marcarErrores(f, { confirma: 'Las contraseñas no coinciden' }); return; }
          await F.conCarga(f.querySelector('.btn'), () => Api.put('/auth/password', { actual: f.actual.value, nueva: f.nueva.value }), 'Actualizando…');
          f.reset(); F.toast('Contraseña actualizada');
        }
        if (f.matches('[data-soporte]')) {
          const r = await F.conCarga(f.querySelector('.btn'), () => Api.post('/soporte', { asunto: f.asunto.value, descripcion: f.descripcion.value + (f.adjunto.files[0] ? '\n[Adjunto: ' + f.adjunto.files[0].name + ']' : '') }), 'Enviando…');
          $('[data-ok-soporte]', v).innerHTML = `<div class="alerta alerta--ok" role="status" style="margin-bottom:14px">${ic('check')}<span><strong>Solicitud ${esc(r.ticket.id)} recibida.</strong> ${esc(r.mensaje)}</span></div>`;
          f.reset();
        }
      } catch (err) { F.manejarError(err, f); }
    });
  });

  // ======================= DETALLE DE PEDIDO =======================
  F.registrar('pedido', async (v, segs) => {
    if (!F.requiereSesion()) return;
    const o = await Api.get('/orders/' + encodeURIComponent(segs[0] || ''));
    F.titulo('Pedido ' + o.id);
    const pasos = ['Pagado', 'En preparación', 'Enviado', 'Entregado'];
    const idx = pasos.indexOf(o.estado);
    v.innerHTML = `<div class="contenedor" style="padding-bottom:50px"><nav class="migas"><a href="#/cuenta/pedidos">Mis pedidos</a><span aria-hidden="true">/</span><span>${esc(o.id)}</span></nav>
      <div class="entre"><div><h1 style="margin:0">Pedido ${esc(o.id)}</h1><p class="muted">Realizado el ${F.fechaHora(o.fecha)}</p></div><button class="btn btn--sec" data-recomprar>${ic('refrescar')} Volver a comprar</button></div>
      ${o.estado === 'Cancelado' ? `<p class="alerta alerta--error">${ic('alerta')} Este pedido fue cancelado.</p>` : `<div class="tarjeta" style="margin:16px 0"><ol class="timeline">${pasos.map((p, i) => `<li class="${i <= idx ? 'hecho' : ''}">${p}</li>`).join('')}</ol>
        <p class="centro muted" style="margin:16px 0 0">${o.estado === 'Entregado' ? '¡Tu pedido fue entregado!' : 'Llega entre el ' + F.fecha(o.envio.llegaDesde) + ' y el ' + F.fecha(o.envio.llegaHasta) + ' · envío ' + esc(o.envio.nombre.toLowerCase())}</p></div>`}
      <div class="dos-col"><div class="tarjeta">${o.lineas.map((l) => `<div class="item-carrito"><a class="mini" href="#/producto/${esc(l.productoId)}">${window.Arte.producto(l.arte, l.color, 0, F.etiquetaArte(l))}</a><div><strong>${esc(l.nombre)}</strong><br><small class="muted">${esc(l.variante || '')} · ${l.cantidad} × ${cop(l.precio)}</small></div><div class="derecha"><strong>${cop(l.total)}</strong></div></div>`).join('')}</div>
        <aside class="pila"><div class="tarjeta"><h3>Resumen</h3><div class="linea-resumen"><span>Subtotal</span><span>${cop(o.subtotal)}</span></div>
          ${o.descSuscriptor ? `<div class="linea-resumen"><span>Descuento suscriptor</span><span class="desc">−${cop(o.descSuscriptor)}</span></div>` : ''}${o.descCupon ? `<div class="linea-resumen"><span>Cupón ${esc(o.cupon)}</span><span class="desc">−${cop(o.descCupon)}</span></div>` : ''}
          <div class="linea-resumen"><span>Envío</span><span>${o.envio.precio ? cop(o.envio.precio) : 'Gratis'}</span></div><div class="linea-resumen total"><span>Total</span><span>${cop(o.total)}</span></div></div>
          <div class="tarjeta"><h3>Envío a</h3><p class="muted" style="margin:0">${esc(o.direccion.nombre)}<br>${esc(o.direccion.direccion)}<br>${esc(o.direccion.ciudad)} · ${esc(o.direccion.telefono)}</p></div>
          <div class="tarjeta"><h3>Pago</h3><p class="muted" style="margin:0">${esc(o.pago.detalle)} vía ${esc(o.pago.pasarela)}<br>Referencia: <span class="mono">${esc(o.pago.referencia)}</span><br>Token: <span class="mono">${esc(String(o.pago.token).slice(0, 18))}…</span></p></div></aside></div></div>`;
    v.addEventListener('click', (e) => {
      if (!e.target.closest('[data-recomprar]')) return;
      o.lineas.forEach((l) => F.agregarAlCarrito({ productoId: l.productoId, cantidad: l.cantidad, talla: l.talla, presentacion: l.presentacion }));
      F.toast('Agregamos los productos a tu carrito', 'ok', { href: '#/carrito', texto: 'Ver carrito' });
    });
  });

  // ======================= INFORMACIÓN (incluye la arquitectura del sistema) =======================
  F.registrar('info', async (v, segs) => {
    const tema = segs[0] || 'arquitectura';
    const modo = Api.modo === 'servidor';
    const T = {
      seguridad: ['Pagos seguros', `<p>FITOPÍA delega todos los datos de pago a las pasarelas <strong>Wompi</strong> (Nequi, tarjetas y PSE) y <strong>PayPal</strong>, que cumplen el estándar <strong>PCI DSS</strong>. Nosotros nunca guardamos el número de tu tarjeta ni tu CVV: solo un token y la referencia de la transacción (RS 02).</p><p>La compra es “todo o nada” (RES 04): si el pago falla, se revierte el pedido y el inventario.</p><p class="muted">En este prototipo las pasarelas funcionan en modo sandbox: no se hace ningún cobro real.</p>`],
      datos: ['Tratamiento de datos personales', `<p>En cumplimiento de la <strong>Ley 1581 de 2012 (Habeas Data)</strong>, FITOPÍA usa tus datos solo para gestionar tu cuenta, tus pedidos y tu plan. Puedes consultarlos, actualizarlos o pedir su eliminación desde Mi cuenta o escribiendo a soporte (RS 08 · RN-S 1).</p><p>Las contraseñas se guardan con hash y los eventos críticos quedan en un registro de auditoría sin datos sensibles (RS 07).</p>`],
      soporte: ['Soporte en máximo 24 horas', `<p>Respondemos todas las solicitudes en máximo 24 horas (RN-C 1) y cada caso queda trazado de principio a fin (RN-C 2). Si una caída del servicio supera las 48 horas, extendemos tu suscripción por el tiempo de inactividad (RN-C 3).</p><a class="btn btn--pri" href="#/cuenta/soporte">Escribir a soporte</a>`],
      arquitectura: ['Cómo está construida FITOPÍA', `
        <p>Este prototipo funcional implementa la arquitectura de la <strong>Fase 02 · Diseño</strong> del SRS IEEE-830 v2.0 en una versión que corre en un solo computador.</p>
        <div class="kpis" style="grid-template-columns:repeat(3,1fr);margin:18px 0">
          <div class="kpi"><small>${ic('tienda')} Capa 1 · Cliente</small><strong style="font-size:1.1rem">SPA responsive</strong><span>HTML, CSS y JavaScript. En producción: React. Funciona en PC, tablet y celular.</span></div>
          <div class="kpi"><small>${ic('servidor')} Capa 2 · Servidor</small><strong style="font-size:1.1rem">API REST /api/v1</strong><span>Node.js con JSON, JWT y enrutador propio. En producción: Express + Swagger.</span></div>
          <div class="kpi"><small>${ic('caja')} Capa 3 · Datos</small><strong style="font-size:1.1rem">db.json + auditoría</strong><span>En producción: MySQL en Amazon RDS y DynamoDB para logs.</span></div></div>
        <p class="nota ${modo ? 'nota--verde' : 'nota--naranja'}">${ic(modo ? 'servidor' : 'info')}<span>${modo ? `Ahora mismo estás conectado al servidor local (<strong>${esc(S.health.motor)}</strong>). Los datos se guardan en <span class="mono">data/db.json</span> y la auditoría en <span class="mono">data/auditoria.jsonl</span>.` : 'Ahora mismo estás en modo demo: el mismo código de la API corre dentro del navegador y guarda en localStorage. Para usar el servidor real ejecuta INICIAR-FITOPIA.bat.'}</span></p>
        <h3 style="margin-top:22px">Trazabilidad: requisito → dónde se ve</h3>
        <div class="tabla-wrap"><table class="tabla"><thead><tr><th>Requisito</th><th>Qué exige</th><th>Dónde probarlo</th></tr></thead><tbody>
          ${[['RF 01 a RF 06', 'Login con correo y contraseña, enlaces, error en rojo y animación', '<a class="enlace" href="#/login">Iniciar sesión</a> con una clave incorrecta'],
    ['RNR 01 · RNR 02', 'Home en menos de 2,5 s · API en menos de 500 ms', 'Consola del servidor: cada petición muestra su tiempo'],
    ['RS 02', 'Contraseñas con hash; pagos solo con token', 'Panel admin → Pagos (solo se ve el token)'],
    ['RS 03', 'JWT con expiración', 'La sesión expira a las 2 horas'],
    ['RS 04', 'Panel solo para el rol Administrador', 'Entra como cliente a <span class="mono">#/admin</span>: acceso denegado'],
    ['RS 05', 'Validación adicional en operaciones críticas', 'Mi cuenta → Seguridad pide la contraseña actual'],
    ['RS 06', 'Defensa contra fuerza bruta, XSS, CSRF e inyección', '5 intentos fallidos bloquean 5 minutos · todo texto se escapa · la API solo acepta JSON'],
    ['RS 07', 'Registro de auditoría', 'Panel admin o técnico → Auditoría'],
    ['RES 04', 'Compra todo o nada', 'Paga con la tarjeta 4000 0000 0000 0002: se revierte todo'],
    ['RU 02 · RU 04', 'Máximo 3 clics · validaciones instantáneas', 'Menú de categorías y formularios con bordes rojos'],
    ['RF-ADD-03/05/06', 'Descuento a suscriptores, planes y cambio de plan', '<a class="enlace" href="#/planes">Planes Fit</a> y el carrito con un suscriptor']].map((f) => `<tr><td><strong>${f[0]}</strong></td><td>${f[1]}</td><td>${f[2]}</td></tr>`).join('')}
        </tbody></table></div>
        <h3 style="margin-top:22px">Endpoints principales de la API</h3>
        <div class="tabla-wrap"><table class="tabla"><tbody>${[['POST', '/api/v1/auth/login', 'Inicia sesión y devuelve un JWT'], ['GET', '/api/v1/products', 'Catálogo con filtros, orden y paginación'], ['POST', '/api/v1/orders', 'Crea el pedido en una transacción todo o nada'], ['GET', '/api/v1/fitness/mi-plan', 'Rutina semanal y progreso del suscriptor'], ['GET', '/api/v1/community/posts', 'Muro de la comunidad'], ['GET', '/api/v1/admin/stats', 'Métricas del panel (solo administrador)']].map((e) => `<tr><td><span class="pill ${e[0] === 'GET' ? 'pill--azul' : 'pill--verde'}">${e[0]}</span></td><td class="mono">${e[1]}</td><td>${e[2]}</td></tr>`).join('')}</tbody></table></div>`]
    };
    const [t, html] = T[tema] || T.arquitectura;
    F.titulo(t);
    v.innerHTML = `<div class="contenedor" style="max-width:980px;padding:30px 20px 60px"><nav class="migas"><a href="#/">Inicio</a><span aria-hidden="true">/</span><span>${esc(t)}</span></nav><h1>${esc(t)}</h1><div class="tarjeta">${html}</div></div>`;
  });
})();

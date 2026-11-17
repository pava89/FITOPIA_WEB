/* FITOPÍA · Ilustraciones de productos e íconos (SVG hechos a mano, funcionan sin internet) */
(function () {
  'use strict';
  const OSCURO = '#14213D';
  const METAL = '#A7AFBE';

  function mezclar(hex, conBlanco) {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const m = (c) => Math.round(c + (255 - c) * conBlanco);
    return '#' + [m(r), m(g), m(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
  }

  // Cada dibujo ocupa un lienzo de 400 × 400. C = color del producto, D = azul oscuro de la marca.
  const DIBUJOS = {
    caminadora: (C, D) => `
      <path d="M58 286 Q58 258 86 258 L300 258 Q322 258 322 276 L322 280 Q322 296 304 296 L70 296 Q58 296 58 286Z" fill="${D}"/>
      <rect x="84" y="263" width="214" height="11" rx="5.5" fill="${C}"/>
      <circle cx="86" cy="304" r="10" fill="${D}"/><circle cx="296" cy="304" r="10" fill="${D}"/>
      <path d="M296 264 L262 132" stroke="${D}" stroke-width="17" stroke-linecap="round"/>
      <path d="M266 150 L206 162" stroke="${C}" stroke-width="11" stroke-linecap="round"/>
      <g transform="rotate(-14 268 116)"><rect x="228" y="94" width="82" height="44" rx="11" fill="${D}"/>
      <rect x="240" y="104" width="58" height="18" rx="5" fill="${C}" opacity=".9"/><circle cx="252" cy="130" r="3" fill="#fff" opacity=".6"/><circle cx="264" cy="130" r="3" fill="#fff" opacity=".6"/></g>`,
    bicicleta: (C, D) => `
      <path d="M96 314 L176 314 M232 314 L322 314" stroke="${D}" stroke-width="13" stroke-linecap="round"/>
      <path d="M136 314 L176 214 L282 250" stroke="${D}" stroke-width="17" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M282 250 L282 314" stroke="${D}" stroke-width="13" stroke-linecap="round"/>
      <circle cx="282" cy="250" r="50" fill="none" stroke="${D}" stroke-width="15"/><circle cx="282" cy="250" r="14" fill="${C}"/>
      <path d="M176 214 L160 150" stroke="${D}" stroke-width="14" stroke-linecap="round"/>
      <path d="M128 146 Q160 130 196 146" stroke="${C}" stroke-width="17" fill="none" stroke-linecap="round"/>
      <path d="M262 232 L246 136" stroke="${D}" stroke-width="13" stroke-linecap="round"/>
      <path d="M224 132 L270 124 Q286 124 292 142" stroke="${C}" stroke-width="12" fill="none" stroke-linecap="round"/>
      <circle cx="214" cy="258" r="15" fill="${C}"/><path d="M214 258 L232 284" stroke="${D}" stroke-width="8" stroke-linecap="round"/>`,
    banco: (C, D) => `
      <path d="M92 316 L326 316" stroke="${D}" stroke-width="13" stroke-linecap="round"/>
      <path d="M128 252 L112 316 M206 252 L222 316 M268 230 L300 316" stroke="${D}" stroke-width="12" stroke-linecap="round"/>
      <rect x="96" y="222" width="130" height="34" rx="15" fill="${D}"/>
      <g transform="rotate(-38 268 196)"><rect x="196" y="176" width="150" height="38" rx="16" fill="${C}"/></g>
      <path d="M120 230 L210 230" stroke="#fff" stroke-width="4" opacity=".25" stroke-linecap="round"/>`,
    rack: (C, D) => `
      <rect x="88" y="312" width="224" height="14" rx="6" fill="${D}"/>
      <rect x="112" y="76" width="18" height="242" rx="4" fill="${D}"/><rect x="270" y="76" width="18" height="242" rx="4" fill="${D}"/>
      <rect x="104" y="66" width="192" height="17" rx="7" fill="${D}"/>
      ${[110, 140, 200, 230, 260].map((y) => `<circle cx="121" cy="${y}" r="3" fill="#fff" opacity=".5"/><circle cx="279" cy="${y}" r="3" fill="#fff" opacity=".5"/>`).join('')}
      <rect x="98" y="246" width="204" height="10" rx="5" fill="${METAL}"/>
      <rect x="36" y="166" width="328" height="9" rx="4.5" fill="${METAL}"/>
      <rect x="54" y="128" width="22" height="86" rx="7" fill="${C}"/><rect x="78" y="140" width="15" height="62" rx="5" fill="${C}" opacity=".8"/>
      <rect x="324" y="128" width="22" height="86" rx="7" fill="${C}"/><rect x="307" y="140" width="15" height="62" rx="5" fill="${C}" opacity=".8"/>`,
    mancuernas: (C, D) => {
      const una = (tx, ty, rot, esc) => `<g transform="translate(${tx} ${ty}) rotate(${rot}) scale(${esc})">
        <rect x="-78" y="-9" width="156" height="18" rx="9" fill="${METAL}"/>
        <rect x="-70" y="-48" width="26" height="96" rx="10" fill="${D}"/><rect x="-98" y="-38" width="26" height="76" rx="10" fill="${C}"/>
        <rect x="44" y="-48" width="26" height="96" rx="10" fill="${D}"/><rect x="72" y="-38" width="26" height="76" rx="10" fill="${C}"/></g>`;
      return una(214, 170, -14, 0.88) + una(190, 262, -8, 1);
    },
    homegym: (C, D) => `
      <rect x="96" y="312" width="248" height="13" rx="6" fill="${D}"/>
      <rect x="252" y="66" width="16" height="250" rx="4" fill="${D}"/><rect x="314" y="66" width="16" height="250" rx="4" fill="${D}"/>
      <rect x="244" y="58" width="94" height="16" rx="6" fill="${D}"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="272" y="${226 + i * 10}" width="38" height="8" rx="2" fill="${C}" opacity="${0.6 + i * 0.05}"/>`).join('')}
      <rect x="288" y="80" width="5" height="146" fill="${METAL}"/>
      <circle cx="260" cy="82" r="11" fill="${C}"/><path d="M260 82 L150 128" stroke="${METAL}" stroke-width="4"/>
      <rect x="120" y="120" width="44" height="14" rx="7" fill="${D}" transform="rotate(-22 142 127)"/>
      <rect x="112" y="236" width="104" height="28" rx="11" fill="${D}"/>
      <rect x="190" y="140" width="28" height="104" rx="11" fill="${C}"/>
      <path d="M140 264 L132 312 M196 264 L204 312" stroke="${D}" stroke-width="11" stroke-linecap="round"/>`,
    kettlebell: (C, D, et) => `
      <path d="M148 178 Q146 96 200 96 Q254 96 252 178" fill="none" stroke="${D}" stroke-width="24" stroke-linecap="round"/>
      <circle cx="200" cy="244" r="88" fill="${D}"/>
      <path d="M140 318 L260 318" stroke="${D}" stroke-width="14" stroke-linecap="round"/>
      <ellipse cx="164" cy="216" rx="20" ry="36" fill="#fff" opacity=".12"/>
      <text x="200" y="262" text-anchor="middle" font-family="Inter,Segoe UI,Arial,sans-serif" font-weight="800" font-size="46" fill="${C}">${et || '16'}</text>`,
    camiseta: (C, D) => `
      <path d="M150 88 L118 100 L66 142 L100 192 L132 170 L132 322 L268 322 L268 170 L300 192 L334 142 L282 100 L250 88 Q240 126 200 126 Q160 126 150 88Z" fill="${C}"/>
      <path d="M150 88 Q160 126 200 126 Q240 126 250 88" fill="none" stroke="${D}" stroke-opacity=".28" stroke-width="7"/>
      <path d="M100 192 L132 170 M300 192 L268 170" stroke="${D}" stroke-opacity=".18" stroke-width="5"/>
      <path d="M182 200 L218 200" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".75"/>`,
    leggins: (C, D) => `
      <path d="M138 78 L262 78 L270 140 L252 334 L212 334 L203 168 L197 168 L188 334 L148 334 L130 140Z" fill="${C}"/>
      <rect x="136" y="78" width="128" height="24" rx="7" fill="${D}" opacity=".28"/>
      <path d="M140 150 L156 330 M260 150 L244 330" stroke="#fff" stroke-width="5" opacity=".35" stroke-linecap="round"/>`,
    short: (C, D) => `
      <path d="M118 108 L282 108 L304 268 L214 280 L200 204 L186 280 L96 268Z" fill="${C}"/>
      <rect x="116" y="102" width="168" height="26" rx="9" fill="${D}" opacity=".3"/>
      <path d="M196 128 L190 152 M204 128 L210 152" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
      <path d="M262 150 L276 252" stroke="#fff" stroke-width="5" opacity=".35" stroke-linecap="round"/>`,
    buzo: (C, D) => `
      <path d="M150 104 L110 118 L80 178 L68 300 L104 306 L118 198 L130 178 L130 324 L270 324 L270 178 L282 198 L296 306 L332 300 L320 178 L290 118 L250 104Z" fill="${C}"/>
      <path d="M146 108 Q146 52 200 52 Q254 52 254 108 Q232 136 200 136 Q168 136 146 108Z" fill="${D}" opacity=".35"/>
      <path d="M160 108 Q160 70 200 70 Q240 70 240 108 Q222 124 200 124 Q178 124 160 108Z" fill="${D}" opacity=".35"/>
      <path d="M156 252 L244 252 L254 300 L146 300Z" fill="${D}" opacity=".18"/>
      <path d="M190 132 L188 176 M210 132 L212 176" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/>`,
    top: (C, D) => `
      <path d="M138 104 L166 104 L200 176 L234 104 L262 104 L282 232 Q200 266 118 232Z" fill="${C}"/>
      <path d="M120 226 Q200 258 280 226 L284 256 Q200 290 116 256Z" fill="${D}" opacity=".3"/>
      <path d="M166 104 L200 176 L234 104" fill="none" stroke="${D}" stroke-opacity=".2" stroke-width="5"/>`,
    tarro: (C, D, et) => `
      <rect x="118" y="122" width="164" height="204" rx="20" fill="${C}"/>
      <rect x="108" y="92" width="184" height="46" rx="13" fill="${D}"/>
      <rect x="118" y="178" width="164" height="90" fill="#fff" opacity=".93"/>
      <text x="200" y="226" text-anchor="middle" font-family="Inter,Segoe UI,Arial,sans-serif" font-weight="800" font-size="30" fill="${D}">${et || 'FIT'}</text>
      <rect x="152" y="242" width="96" height="8" rx="4" fill="${C}"/>
      <rect x="132" y="138" width="12" height="176" rx="6" fill="#fff" opacity=".22"/>`,
    frasco: (C, D, et) => `
      <rect x="138" y="138" width="124" height="180" rx="24" fill="${C}"/>
      <rect x="150" y="100" width="100" height="48" rx="11" fill="${D}"/>
      <rect x="138" y="186" width="124" height="76" fill="#fff" opacity=".93"/>
      <text x="200" y="232" text-anchor="middle" font-family="Inter,Segoe UI,Arial,sans-serif" font-weight="800" font-size="24" fill="${D}">${et || 'MULTI'}</text>
      <rect x="286" y="276" width="54" height="24" rx="12" fill="${C}" transform="rotate(-25 313 288)"/>
      <rect x="66" y="290" width="54" height="24" rx="12" fill="${D}" transform="rotate(18 93 302)"/>`,
    bandas: (C, D) => `
      <ellipse cx="166" cy="190" rx="96" ry="46" fill="none" stroke="${C}" stroke-width="17" transform="rotate(-20 166 190)"/>
      <ellipse cx="236" cy="210" rx="94" ry="44" fill="none" stroke="${D}" stroke-width="17" transform="rotate(16 236 210)"/>
      <ellipse cx="200" cy="262" rx="100" ry="42" fill="none" stroke="#EF9F27" stroke-width="17"/>`,
    termo: (C, D) => `
      <rect x="156" y="110" width="88" height="214" rx="28" fill="${C}"/>
      <rect x="164" y="76" width="72" height="46" rx="11" fill="${D}"/>
      <rect x="186" y="58" width="28" height="24" rx="7" fill="${D}"/>
      <rect x="156" y="252" width="88" height="15" fill="${D}" opacity=".22"/>
      <rect x="170" y="132" width="11" height="112" rx="5.5" fill="#fff" opacity=".35"/>`,
    guantes: (C, D) => `
      <path d="M148 302 L148 172 Q148 152 164 152 L164 122 Q164 104 180 104 Q196 104 196 122 L196 112 Q196 94 212 94 Q228 94 228 112 L228 122 Q228 106 244 106 Q260 106 260 124 L260 204 Q280 182 298 198 Q308 210 296 224 L254 294 L254 302Z" fill="${D}"/>
      <path d="M164 152 L164 200 M196 122 L196 196 M228 122 L228 196" stroke="#fff" stroke-width="4" opacity=".18" stroke-linecap="round"/>
      <rect x="138" y="266" width="126" height="44" rx="11" fill="${C}"/>
      <rect x="180" y="208" width="52" height="40" rx="12" fill="${C}" opacity=".85"/>`,
    colchoneta: (C, D) => `
      <rect x="84" y="176" width="212" height="98" rx="49" fill="${C}"/>
      <ellipse cx="296" cy="225" rx="34" ry="49" fill="${C}"/>
      <ellipse cx="296" cy="225" rx="34" ry="49" fill="${D}" opacity=".18"/>
      <ellipse cx="296" cy="225" rx="22" ry="33" fill="none" stroke="#fff" stroke-width="4" opacity=".55"/>
      <ellipse cx="296" cy="225" rx="11" ry="17" fill="none" stroke="#fff" stroke-width="4" opacity=".55"/>
      <rect x="140" y="170" width="16" height="110" rx="4" fill="${D}"/><rect x="226" y="170" width="16" height="110" rx="4" fill="${D}"/>`,
    cuerda: (C, D) => `
      <path d="M112 196 Q118 340 200 340 Q282 340 288 196" fill="none" stroke="${C}" stroke-width="7" stroke-linecap="round"/>
      <rect x="92" y="96" width="30" height="104" rx="14" fill="${D}" transform="rotate(-14 107 148)"/>
      <rect x="278" y="96" width="30" height="104" rx="14" fill="${D}" transform="rotate(14 293 148)"/>
      <circle cx="113" cy="198" r="7" fill="${METAL}"/><circle cx="287" cy="198" r="7" fill="${METAL}"/>`,
    rodillo: (C, D) => `
      <rect x="82" y="168" width="228" height="104" rx="52" fill="${C}"/>
      <ellipse cx="310" cy="220" rx="28" ry="52" fill="${D}" opacity=".25"/>
      ${[0, 1, 2, 3, 4].map((i) => `<rect x="${118 + i * 36}" y="186" width="16" height="68" rx="8" fill="${D}" opacity=".18"/>`).join('')}`
  };

  // vista 0 = frontal, 1 = lateral (espejo), 2 = detalle (acercamiento)
  function producto(arte, color, vista, etiqueta) {
    const C = color || '#E8743B';
    const dib = DIBUJOS[arte] || DIBUJOS.tarro;
    const fondo = mezclar(C, 0.86);
    const fondo2 = mezclar(C, 0.74);
    const v = vista || 0;
    const conTexto = ['tarro', 'frasco', 'kettlebell'].includes(arte);
    const t = v === 1 ? (conTexto ? 'rotate(-9 200 210) translate(6 4)' : 'translate(400 0) scale(-1 1)') : v === 2 ? 'translate(-120 -120) scale(1.6)' : '';
    const deco = v === 1
      ? `<circle cx="70" cy="330" r="120" fill="${fondo2}" opacity=".55"/>`
      : v === 2 ? `<rect x="0" y="250" width="400" height="150" fill="${fondo2}" opacity=".45"/>`
        : `<circle cx="320" cy="80" r="110" fill="${fondo2}" opacity=".55"/><ellipse cx="200" cy="336" rx="130" ry="16" fill="${OSCURO}" opacity=".08"/>`;
    return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true" focusable="false" class="arte">` +
      `<rect width="400" height="400" fill="${fondo}"/>${deco}<g transform="${t}">${dib(C, OSCURO, etiqueta)}</g></svg>`;
  }

  // Íconos de línea de 24 × 24
  const IC = {
    buscar: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    usuario: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    carrito: '<path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2"/><circle cx="10" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    estrella: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
    corazon: '<path d="M12 20s-7-4.4-9.2-8.6C1.2 8.2 3 4.5 6.6 4.5c2 0 3.4 1.1 4.4 2.6 1-1.5 2.4-2.6 4.4-2.6 3.6 0 5.4 3.7 3.8 6.9C19 15.6 12 20 12 20z"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    camion: '<path d="M3 6h11v10H3zM14 9h4l3 3.5V16h-7"/><circle cx="7" cy="18" r="1.8"/><circle cx="17.5" cy="18" r="1.8"/>',
    escudo: '<path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
    candado: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    izq: '<path d="M15 5l-7 7 7 7"/>',
    der: '<path d="M9 5l7 7-7 7"/>',
    abajo: '<path d="M6 9l6 6 6-6"/>',
    mas: '<path d="M12 5v14M5 12h14"/>',
    menos: '<path d="M5 12h14"/>',
    basura: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    editar: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
    salir: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
    grafico: '<path d="M4 20V11M10 20V5M16 20v-6M2 20h20"/>',
    usuarios: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.5-5.5 6.5-5.5s5.5 2 6.5 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c2.3 0 4 1.5 4.7 4"/>',
    caja: '<path d="M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7M12 11v10"/>',
    recibo: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3"/>',
    calendario: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    trofeo: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5a3 3 0 0 0 3.5 4M16 6h3.5a3 3 0 0 1-3.5 4M12 13v4M8 20h8M9 17h6"/>',
    llama: '<path d="M12 21c-4 0-6.5-2.7-6.5-6.3 0-3.6 2.7-5.2 3.6-8.7 2.4 1.3 3.2 3.4 3.2 5.1 1-.8 1.7-2.2 1.8-3.4 2.2 1.8 4.4 4.3 4.4 7.2 0 3.5-2.5 6.1-6.5 6.1z"/>',
    corona: '<path d="M4 18h16M5 15l-1.5-9 5 4L12 5l3.5 5 5-4L19 15z"/>',
    hoja: '<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14zM5 19l7-7"/>',
    pesa: '<path d="M3 10v4M6.5 7.5v9M17.5 7.5v9M21 10v4M6.5 12h11"/>',
    ojo: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    ojoOff: '<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.2 6.3C3.6 8 2 12 2 12s3.6 7 10 7c1.6 0 3-.4 4.3-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    correo: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5L12 13l8.5-6.5"/>',
    campana: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0"/>',
    casa: '<path d="M3 11l9-7 9 7M5 9.5V20h5v-6h4v6h5V9.5"/>',
    ajustes: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    alerta: '<path d="M12 3.5l9.5 16.5h-19z"/><path d="M12 10v4.5M12 17.5v.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>',
    tarjeta: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h4"/>',
    celular: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/>',
    banco: '<path d="M3 9l9-5 9 5M5 10v7M9.5 10v7M14.5 10v7M19 10v7M3 20h18"/>',
    billetera: '<path d="M4 7h15a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7zM4 7l12-3v3"/><path d="M16 13.5h.01"/>',
    reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    bandera: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    descarga: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    ruta: '<path d="M7 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM9 16h6a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6"/>',
    gota: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    pulso: '<path d="M3 12h4l3-7 4 14 3-7h4"/>',
    tienda: '<path d="M4 9l1.5-5h13L20 9M4 9h16v11H4zM9 20v-6h6v6"/>',
    etiqueta: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8" r="1.5"/>',
    servidor: '<rect x="4" y="4" width="16" height="7" rx="1.5"/><rect x="4" y="13" width="16" height="7" rx="1.5"/><path d="M8 7.5h.01M8 16.5h.01"/>',
    play: '<path d="M8 5l11 7-11 7z"/>',
    filtro: '<path d="M4 5h16l-6 7.5V19l-4 2v-8.5z"/>',
    refrescar: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>',
    soporte: '<path d="M4 13v-1a8 8 0 0 1 16 0v1"/><rect x="3" y="13" width="4" height="6" rx="1.5"/><rect x="17" y="13" width="4" height="6" rx="1.5"/><path d="M19 19c0 1.5-1.5 2-4 2h-2"/>',
    medalla: '<circle cx="12" cy="15" r="5"/><path d="M8.5 11L6 3h4l2 4 2-4h4l-2.5 8"/><path d="M12 13v4M10.5 14.5l1.5-1.5"/>',
    lista: '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
    rayo: '<path d="M13 3L5 13.5h6L10 21l8-10.5h-6z"/>'
  };
  function icono(nombre, clase) {
    return `<svg class="ic ${clase || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${IC[nombre] || IC.info}</svg>`;
  }

  window.Arte = { producto, icono, mezclar };
})();

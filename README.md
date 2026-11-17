# FITOPÍA · Prototipo funcional

Tienda fitness (maquinaria, ropa, suplementos y accesorios), Planes Fit por suscripción (Básico, Avanzado y Élite) y comunidad.
Implementa la arquitectura de la **Fase 02 · Diseño** del SRS IEEE-830 v2.0 de FITOPÍA (Ingeniería del Software 2026-2).

## Cómo abrirla

| Quiero… | Haz esto |
|---|---|
| Usarla con el servidor (recomendado) | Doble clic en **INICIAR-FITOPIA.bat**. Se abre `http://localhost:3000`. **No cierres la ventana negra** mientras la usas. |
| Abrirla sin servidor | Doble clic en `public/index.html` (modo demo: el mismo código corre en el navegador y guarda ahí los datos). |
| Verla en el celular | **ABRIR-EN-CELULAR.bat** y abre en el celular la dirección que aparece (misma red Wi-Fi). |
| Volver a los datos de ejemplo | Cierra el servidor y ejecuta **REINICIAR-DATOS.bat**. |

Solo necesita Node.js 16 o superior. No hay que instalar paquetes (`npm install` no es necesario).

## Cuentas de prueba

| Rol | Correo | Contraseña |
|---|---|---|
| Cliente (con plan Avanzado) | cliente@fitopia.co | Cliente123* |
| Administrador | admin@fitopia.co | Admin123* |
| Personal técnico | tecnico@fitopia.co | Tecnico123* |

También puedes crear tu propia cuenta desde “Crear cuenta”.

## Pagos de prueba (sandbox, no se cobra nada)

- Tarjeta aprobada: `4242 4242 4242 4242` · vence `12/29` · CVV `123`
- Tarjeta rechazada: `4000 0000 0000 0002`
- Nequi aprobado `3001234567` · rechazado `3000000002`
- Cupones: `FITO10` (10%) y `ENVIOGRATIS`

## Demostración rápida para la sustentación

1. **Iniciar sesión** con una contraseña incorrecta: mensaje rojo y animación (RF 05 y RF 06).
2. **Comprar** con la tarjeta rechazada: el pedido y el inventario se revierten (RES 04, compra todo o nada). Luego paga con la aprobada.
3. **Planes Fit → Mi plan**: rutina según objetivo, experiencia y días; checklist y gráfico de peso.
4. **Panel admin → Auditoría**: cada login, compra y cambio queda registrado (RS 07).
5. Pie de página → **Cómo está construida**: arquitectura en 3 capas y tabla de trazabilidad.

## Arquitectura (3 capas)

```
Navegador (SPA HTML/CSS/JS)  ──HTTP/JSON──►  API REST /api/v1 (Node.js)  ──►  data/db.json + data/auditoria.jsonl
   en producción: React                       en producción: Express + Swagger   en producción: MySQL (RDS) + DynamoDB
```

- `server.js`: servidor HTTP, archivos estáticos, cabeceras de seguridad, hash scrypt y JWT.
- `public/js/core.js`: lógica de negocio y rutas de la API (el mismo archivo corre en el servidor y en el modo demo).
- `public/js/app.js` y `vistas-*.js`: interfaz (tienda, carrito, pago, planes, comunidad, cuenta y panel admin).
- `data/`: se crea al iniciar. Contiene la base de datos, la auditoría y la clave para firmar los tokens.

## Requisitos del SRS que se pueden probar

RF 01–06 (login) · RNR 01–02 (tiempos, se ven en la consola) · RS 02 (hash y token de pago) · RS 03 (JWT con expiración de 2 h) ·
RS 04 (panel solo para administrador) · RS 05 (contraseña actual para cambiarla) · RS 06 (bloqueo tras 5 intentos, escape de texto, solo JSON) ·
RS 07 (auditoría) · RES 04 (todo o nada) · RU 01–04 (responsive, 3 clics, validación instantánea) · RF-ADD-03/05/06 (descuentos y suscripciones) ·
RN-E 2 (moderación) · RN-P 3 (tarifa garantizada) · RN-C 1 (soporte en 24 h).

# 08 · SECURITY — Seguridad, Accesibilidad y Cumplimiento

**Proyecto:** FERRETODO
**Versión:** 1.0 (Blueprint)

> Seguridad como requisito de primera clase: en e-commerce maneja dinero, datos personales y fiscales. "Confianza desde el primer segundo" empieza por no filtrar nada.

---

## 1. Modelo de amenazas (resumen)

| Activo | Amenaza | Impacto |
|---|---|---|
| Datos de clientes (PII, fiscales) | Filtración, acceso indebido | Alto (legal + reputación) |
| Pagos / órdenes | Fraude, manipulación de precios, contracargos | Alto |
| Cuenta corriente B2B | Manipulación de saldo | Alto |
| Panel admin | Toma de control (cuenta admin) | Crítico |
| Catálogo / precios | Vandalismo, scraping agresivo | Medio |
| Disponibilidad | DoS, picos | Medio |

---

## 2. Protecciones por vector (OWASP-aligned)

### SQL Injection
- Prisma parametriza todas las queries. `$queryRaw` **solo** con `Prisma.sql` (tagged templates), nunca concatenación de strings.

### XSS
- Escape por defecto de React. Descripciones HTML de productos sanitizadas server-side (DOMPurify / sanitize-html) antes de guardar y de renderizar.
- `Content-Security-Policy` estricta (script-src con nonce), `X-Content-Type-Options: nosniff`.

### CSRF
- Cookies de sesión `httpOnly` + `Secure` + `SameSite=Strict`. Token CSRF para endpoints mutadores que usan cookie. APIs Bearer-only no aplican.

### Autenticación / sesiones
- Contraseñas con **argon2id** (o bcrypt cost≥12). Nunca en texto plano ni en logs.
- Access JWT corto (~15 min) + refresh opaco hasheado en DB, rotación + **reuse detection** (revoca familia ante reuso).
- **2FA obligatorio** para roles internos (TOTP) + códigos de recuperación.
- Bloqueo progresivo y captcha tras N intentos fallidos de login.
- Política de contraseñas + verificación de email + reset con token de un solo uso y expiración.

### Autorización
- RBAC con permisos granulares (`recurso:accion`), verificados en cada endpoint (`PermissionsGuard`).
- Comprobación de **propiedad** (un cliente solo accede a sus pedidos/presupuestos/direcciones).
- Defensa en profundidad: el front oculta, el back **siempre** valida.

### Integridad de precios y stock (anti-fraude)
- **Los precios se recalculan SIEMPRE en el servidor** (módulo `pricing`); jamás se confía en el monto enviado por el cliente.
- Stock validado dentro de la transacción (no sobreventa).
- Webhooks de pago **idempotentes** + verificación de firma; el monto pagado se concilia contra la orden.
- Cupones/promos validados server-side (vigencia, límites de uso, mínimos).

### Rate limiting / abuso
- `@nestjs/throttler` global + límites estrictos en login, registro, reset, búsqueda, checkout, webhooks.
- **Captcha** (Cloudflare Turnstile / hCaptcha) en registro, login (tras fallos), newsletter, formularios públicos.
- Protección anti-scraping del catálogo (límites + detección de patrones).

### Cabeceras y transporte
- **HTTPS** en todo (HSTS). Helmet (CSP, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy).
- CORS allowlist (solo dominios propios).
- Límite de tamaño de body y de uploads; validación de tipo/contenido de archivos.

### Secrets
- Variables de entorno validadas con zod al boot; **nunca** en el repo. Rotación periódica. `.env` en `.gitignore`.
- Tokens de proveedores (MP, Cloudinary, Resend) con permisos mínimos.

### Dependencias / supply chain
- `pnpm audit` + Dependabot/Renovate; lockfile fijo; revisión de paquetes nuevos.

---

## 3. Privacidad y datos personales

- Minimización: guardar solo lo necesario. PII cifrada en reposo (DB) y en tránsito (TLS).
- Datos fiscales (CUIT, condición IVA) protegidos como PII.
- **Logs sin PII sensible** (sin contraseñas, tokens, números completos de tarjeta — los datos de tarjeta **nunca** tocan nuestro servidor: los maneja Mercado Pago/pasarela).
- Consentimiento de cookies/analytics (GA/Pixel cargan solo tras consentimiento).
- Política de privacidad y términos publicados; mecanismo de baja de newsletter y de eliminación de cuenta.
- Alineado con la **Ley 25.326 de Protección de Datos Personales (Argentina)**.

---

## 4. Auditoría y logging

- **AuditLog** registra toda acción administrativa: quién (`userId`), qué (`action`/`entity`/`entityId`), antes/después (`before`/`after`), cuándo, desde dónde (`ip`/`userAgent`).
- Logs de aplicación estructurados (pino) con request-id; centralizados.
- Eventos de seguridad (logins fallidos, cambios de permisos, accesos admin) monitoreados con alertas.
- Retención de auditoría adecuada; logs inmutables (append-only) para acciones críticas.

---

## 5. Backups y recuperación (DR)

| Aspecto | Definición |
|---|---|
| **Frecuencia** | Backup completo diario de Postgres + WAL continuo (PITR) |
| **Retención** | 30 días (diarios) + mensual de largo plazo |
| **Cifrado** | Backups cifrados en reposo |
| **Ubicación** | Off-site / región distinta a la primaria |
| **RPO objetivo** | ≤ 1 hora (con WAL) |
| **RTO objetivo** | ≤ 4 horas |
| **Pruebas** | Restauración probada antes del launch y luego trimestral |
| **Medios** | Cloudinary con redundancia propia + export periódico de metadatos |

**Runbook de recuperación** (documentado y versionado):
1. Detectar incidente y declarar (quién decide).
2. Aislar (modo mantenimiento si corresponde).
3. Restaurar última copia válida (o PITR al punto previo al incidente).
4. Verificar integridad (conteos, pedidos recientes, cuentas corrientes).
5. Reabrir y comunicar.
6. Post-mortem sin culpa.

---

## 6. Seguridad operativa / DevSecOps

- Ramas protegidas, PRs con review, CI obligatorio (lint + test + `audit`).
- Escaneo de secretos en el pipeline (gitleaks).
- Entornos separados (dev/staging/prod) con credenciales distintas.
- Migraciones versionadas; nada de `db push` en prod.
- Principio de menor privilegio en accesos a infra (Vercel/Railway/DB).
- Plan de respuesta a incidentes con responsables y canal de comunicación.

---

## 7. Accesibilidad (WCAG 2.1 AA)

> La accesibilidad es parte de la confianza y amplía el mercado. Requisito, no extra.

- **Perceptible:** contraste AA (validado en tokens), `alt` en imágenes de producto, no depender solo del color (badges con texto).
- **Operable:** navegación completa por teclado, foco visible, touch targets ≥ 44px, sin trampas de foco, respeta `prefers-reduced-motion`.
- **Comprensible:** labels y mensajes de error claros, idioma declarado (`lang="es-AR"`), formularios con instrucciones.
- **Robusto:** HTML semántico, `aria-*` correcto (Radix/shadcn ya lo proveen), compatible con lectores de pantalla.
- **Verificación:** axe-core en CI + auditoría manual de flujos críticos (buscar, agregar al carrito, checkout, presupuesto).

---

## 8. Cumplimiento e-commerce Argentina

- **Botón de Arrepentimiento** (obligatorio, Res. 424/2020) visible y funcional.
- **Defensa del Consumidor**: información clara de precio final, formas de pago, plazos de entrega, datos del comercio.
- **Datos fiscales** del comercio visibles; preparación para facturación electrónica AFIP (Fase 3).
- Precios en pesos, IVA según corresponda (B2C con IVA incluido; B2B discriminado).

---

## 9. Checklist de seguridad pre-launch

- [ ] HTTPS + HSTS en todos los dominios.
- [ ] CSP, Helmet y cabeceras de seguridad activas.
- [ ] Rate limit + captcha en endpoints sensibles.
- [ ] 2FA activo y obligatorio para admins.
- [ ] Contraseñas con argon2id; refresh con rotación + reuse detection.
- [ ] Precios y stock validados/recalculados server-side.
- [ ] Webhooks con firma + idempotencia.
- [ ] Sanitización de inputs/HTML; validación de DTOs estricta.
- [ ] Secrets fuera del repo; escaneo de secretos en CI.
- [ ] Backups automáticos + **restauración probada**.
- [ ] Auditoría registrando acciones admin.
- [ ] Botón de Arrepentimiento + textos legales publicados.
- [ ] Consentimiento de cookies antes de cargar analytics.
- [ ] `pnpm audit` sin vulnerabilidades críticas.
- [ ] Pentest básico / revisión OWASP Top 10 antes de producción.

---

Fin de la suite de documentación. Volver al [README](../README.md) · Empezar por [00-PRD.md](./00-PRD.md).

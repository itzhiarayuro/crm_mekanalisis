# CRM Mekanálisis

CRM privado para cargar contratos Word, convertirlos a PDF y enviarlos a una persona para firma electrónica con verificación por correo.

## Funcionalidad

- Clientes y contratos en un panel privado.
- Carga DOCX con rechazo de macros y límites contra archivos maliciosos.
- Conversión a PDF con LibreOffice.
- Enlace personal de firma, lectura hasta el final, firma dibujada y OTP de seis dígitos.
- Bloqueo del enlace después de cinco OTP incorrectos.
- PDF final con página de evidencia y hashes SHA-256.
- Historial de eventos encadenado con HMAC y verificación pública.

## Configuración

1. Cree un proyecto Supabase y ejecute `supabase/migrations/001_initial.sql` en SQL Editor.
2. Copie `.env.example` a `.env.local` y complete las variables.
3. Genere la contraseña administrativa con `npm run hash-password`.
4. Para Gmail, active verificación en dos pasos y cree una contraseña de aplicación; no use la contraseña normal.
5. Ejecute `npm install && npm run dev`.

La clave `SUPABASE_SERVICE_ROLE_KEY`, la contraseña de aplicación de Gmail y los secretos nunca deben exponerse con prefijo `NEXT_PUBLIC_`.

## Despliegue Vercel

`Dockerfile.vercel` instala LibreOffice y levanta el build standalone de Next.js. Conecte este repositorio a Vercel, cargue las variables de `.env.example` y despliegue. El proyecto solicitado es `crm-mekanalisis`, con URL esperada `https://crm-mekanalisis.vercel.app` si el nombre está disponible.

## Verificación

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

El producto implementa una firma electrónica con evidencia; no sustituye una firma digital certificada ni revisión jurídica del contrato.

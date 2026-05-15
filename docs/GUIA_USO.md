# Guia de Uso e Interpretacion de Resultados

> **PROYECTO ACADEMICO**
>
> Esta herramienta fue desarrollada como proyecto de Master en Ciberseguridad con fines educativos.
> Los resultados son ORIENTATIVOS y no constituyen una auditoria de seguridad profesional.
> **No confiar ciegamente en los resultados — verificar manualmente los hallazgos criticos.**

Guia practica para utilizar la herramienta de auditoria de seguridad web y entender los resultados del analisis.

## Tabla de Contenidos

- [Como Escanear un Sitio Web](#como-escanear-un-sitio-web)
- [Interpretacion del Reporte](#interpretacion-del-reporte)
  - [Score General y Grado](#score-general-y-grado)
  - [Resultados por Header](#resultados-por-header)
  - [Cumplimiento Normativo](#cumplimiento-normativo)
  - [Recomendaciones](#recomendaciones)
- [Glosario de Headers de Seguridad](#glosario-de-headers-de-seguridad)
- [Preguntas Frecuentes](#preguntas-frecuentes)
- [Limitaciones](#limitaciones)

## Como Escanear un Sitio Web

### Via Interfaz Web

1. Asegurese de que el backend y frontend esten corriendo
2. Abra http://localhost:5173 en su navegador
3. Ingrese la URL completa incluyendo el protocolo (https://ejemplo.com)
4. Presione Enter o haga clic en "Escanear"
5. Espere unos segundos mientras se analizan los headers
6. Revise el reporte generado con las secciones de headers, TLS, DNS, archivos de seguridad, SRI, archivos sensibles, fingerprinting y recomendaciones
7. Si el certificado SSL esta expirado o proximo a expirar, aparecera un aviso destacado en la parte superior del reporte
8. Los textos largos (URLs de SRI, recomendaciones) se truncan con un click para expandir al contenido completo

### Via API (curl)

```bash
curl -X POST http://localhost:3000/api/scan \
  -H "Content-Type: application/json" \
  -d '{"url":"https://ejemplo.com"}'
```

### Via Swagger UI

1. Abra http://localhost:3000/api/docs
2. Expanda el endpoint POST /api/scan
3. Haga clic en "Try it out"
4. Ingrese la URL y ejecute

### Exportar Reporte PDF

```bash
curl -X POST http://localhost:3000/api/export \
  -H "Content-Type: application/json" \
  -d '{"url":"https://ejemplo.com","format":"pdf"}' \
  --output reporte-auditoria.pdf
```

### Exportar Reporte JSON

```bash
curl -X POST http://localhost:3000/api/export \
  -H "Content-Type: application/json" \
  -d '{"url":"https://ejemplo.com","format":"json"}' \
  --output reporte-auditoria.json
```

### Via Interfaz Web - Exportacion

Una vez generado el reporte, aparecen tres botones debajo del resumen:

- **Copiar JSON**: copia el reporte completo al portapapeles
- **Descargar JSON**: descarga el reporte como archivo .json
- **Descargar PDF**: genera un documento PDF profesional listo para usar como evidencia tecnica

## Interpretacion del Reporte

### Score General y Grado

El score numerico (0-100) y el grado alfabetico (A-F) resumen la postura de seguridad general del sitio:

| Grado | Rango | Significado |
|-------|-------|-------------|
| A | 90-100 | Excelente. La mayoria de los headers de seguridad estan presentes y correctamente configurados. |
| B | 80-89 | Buena. Algunos headers menores necesitan ajuste. |
| C | 70-79 | Aceptable. Varios headers importantes necesitan configuracion. |
| D | 60-69 | Deficiente. Faltan headers de seguridad criticos o estan mal configurados. |
| E | 50-59 | Mala. La mayoria de los headers de seguridad estan ausentes. |
| F | 0-49 | Critica. El sitio carece de protecciones esenciales. Vulnerable a multiples ataques. |

El calculo del score se basa en el promedio ponderado de 15 headers de seguridad, donde cada header tiene un peso segun su severidad (critical=25, high=15, medium=10, low=5). El puntaje maximo posible es 165 puntos.

### Resultados por Header

Cada header analizado muestra:

```
Content-Security-Policy         Estado: warning (0.4)
Severidad: critical
Hallazgo: CSP is present but contains unsafe-inline
Recomendacion: Remove unsafe directives. Consider using nonces or hashes.
```

**Barra de progreso:** Indica visualmente la calificacion de 0% a 100%.

**Severidad:** Indica la importancia del header para la seguridad:
- **critical**: Su ausencia o mala configuracion expone a vulnerabilidades graves (XSS, inyeccion)
- **high**: Riesgo significativo (clickjacking, MITM, session hijacking)
- **medium**: Riesgo moderado (fuga de informacion, MIME sniffing)
- **low**: Riesgo menor (fingerprinting, headers deprecados)

**Hallazgo:** Describe el estado actual del header y por que recibe esa calificacion.

**Recomendacion:** Accion concreta para mejorar la configuracion del header.

### Cumplimiento Normativo

El reporte incluye cuatro secciones de compliance:

Los 4 frameworks evaluados son: OWASP Top 10, NIS2 Directive, ENS (Esquema Nacional de Seguridad) e ISO 27001.

#### OWASP Top 10 (2021)

| Control | Evalua | Que significa |
|---------|--------|---------------|
| A01 - Broken Access Control | CORS, cookies | Evalua si hay controles de acceso debiles que permitan acceso no autorizado |
| A05 - Security Misconfiguration | Headers de seguridad, TLS/SSL, SPF/DKIM/DMARC, security.txt, robots.txt | Evalua si faltan headers de seguridad esenciales, TLS desactualizado, certificados expirados, registros DNS de correo ausentes, archivos de seguridad faltantes o mal configurados |
| A06 - Vulnerable Components | X-Powered-By, Server | Evalua si el sitio expone informacion sobre tecnologias que podrian tener vulnerabilidades conocidas |

#### ENS - Esquema Nacional de Seguridad (RD 311/2022)

| Control | Evalua | Que significa |
|---------|--------|---------------|
| op.acc.2 - Control de acceso | CORS, COOP, cookies | Verifica que no haya accesos cruzados sin restriccion |
| op.exp.5 - Proteccion de informacion | X-Powered-By, Server | Detecta fugas de informacion tecnologica |
| op.pl.3 - Seguridad perimetral | CSP, HSTS, XFO | Evalua las defensas del perimetro web |
| op.mon.2 - Monitorizacion | DMARC | Capacidad de deteccion de incidentes de correo |
| op.cont.2 - Continuidad | TLS cert expiry | Renovacion de certificados y continuidad del servicio |
| org.organizacion - Marco organizativo | security.txt | Publicacion de canal de divulgacion de vulnerabilidades |
| op.vuln - Gestion de vulnerabilidades | Fingerprinting, CVEs | Identificacion y parcheado de tecnologias vulnerables |

#### ISO 27001 (2022)

| Control | Evalua | Que significa |
|---------|--------|---------------|
| A.5.1 - Politicas de seguridad | security.txt | Existencia de politica de divulgacion |
| A.9.1 - Control de acceso | CORS, COOP | Restriccion de accesos cross-origin |
| A.10.1 - Controles criptograficos | HSTS, TLS | Cifrado de comunicaciones |
| A.12.6 - Gestion de vulnerabilidades | CVEs | Vulnerabilidades conocidas sin parchear |
| A.13.1 - Seguridad de redes | CSP, XFO, XCTO | Defensa perimetral de red |
| A.13.2 - Transferencia de informacion | TLS | Cifrado en transferencia de datos |
| A.16.1 - Gestion de incidentes | CSP reporting, DMARC | Mecanismos de deteccion |
| A.18.1 - Cumplimiento normativo | General | Estado de cumplimiento global |

#### NIS2 Directive (2023) - Articulo 21

| Control | Evalua | Que significa |
|---------|--------|---------------|
| Art.21(c) - Access Control | CORS, cookies, COOP | Medidas de control de acceso a sistemas y datos |
| Art.21(d) - Incident Handling | CSP reporting | Capacidad de detectar y reportar incidentes de seguridad |
| Art.21(g) - Supply Chain Security | CORP, COEP | Medidas de seguridad en la cadena de suministro |
| Art.21(i) - Cryptography | HSTS, version TLS, certificado SSL | Uso de cifrado y comunicaciones seguras. Verifica version TLS real, validez del certificado y configuracion HSTS |

Los estados de compliance son:
- **compliant**: El control se cumple satisfactoriamente
- **partially_compliant**: El control se cumple parcialmente, requiere mejoras
- **non_compliant**: El control no se cumple
- **not_applicable**: El control no aplica (ej. no hay cookies que evaluar)

### Recomendaciones

La seccion de recomendaciones lista acciones concretas ordenadas por prioridad:

```
[CRITICAL] Implementar una politica CSP estricta...
[HIGH] Agregar HSTS con max-age=31536000...
[MEDIUM] Configurar Referrer-Policy...
[LOW] Remover header X-Powered-By...
```

Se recomienda abordar las recomendaciones en orden de severidad: critical primero, luego high, medium, y finalmente low.

## Glosario de Headers de Seguridad

### TLS / SSL

La herramienta realiza una conexion TLS real con el servidor destino para verificar el estado del certificado y la version del protocolo. Esta informacion se muestra en la seccion TLS/SSL del reporte, en la misma fila que los resultados DNS.

Adicionalmente, se consultan los registros DNS de seguridad del correo electronico (SPF, DKIM, DMARC) para evaluar la proteccion contra suplantacion de dominio. Estos resultados se muestran en la seccion DNS / Email Security.

**Datos que se verifican:**

| Dato | Que significa |
|------|---------------|
| Version TLS | La version del protocolo TLS negociada (TLSv1.3, TLSv1.2, etc.). TLS 1.2 o superior es el estandar actual. TLS 1.0 y 1.1 estan deprecados y son inseguros. |
| Certificado - Sujeto | El Common Name (CN) y organizacion a la que pertenece el certificado. Debe coincidir con el dominio escaneado. |
| Certificado - Emisor | La entidad de certificacion (CA) que emitio el certificado. Las CAs reconocidas (Let's Encrypt, DigiCert, Amazon, etc.) indican un certificado valido. |
| Valido desde / hasta | Fechas de validez del certificado. |
| Expirado | Indica si el certificado esta fuera de su periodo de validez. Un certificado expirado es CRITICO. |
| Self-signed | Indica si el certificado esta auto-firmado (el emisor es el mismo que el sujeto). Los certificados autofirmados no son confiables para produccion. |
| Wildcard | Indica si el certificado usa un comodin (`*.dominio.com`). Los wildcards son funcionales pero representan un riesgo mayor si la clave privada se compromete. |
| Fingerprint | Huella digital SHA256 del certificado. Util para verificar manualmente la identidad del certificado. |
| SAN (Subject Alternative Names) | Lista de dominios adicionales para los cuales el certificado es valido. |

**Grade TLS:**

El grade TLS se calcula combinando la version del protocolo (50%) y la calidad del certificado (50%):

- TLSv1.3 = maxima puntuacion
- TLSv1.2 = buena
- TLSv1.1 = baja (deprecado)
- TLSv1.0 = cero (inseguro)
- Certificado valido y no wildcard = maxima puntuacion
- Certificado wildcard = penalizacion leve
- Certificado autofirmado = penalizacion fuerte
- Certificado expirado = cero

**Ejemplo de interpretacion:**

```
TLS version: TLSv1.2     -> bueno, version moderna
Cert issuer: Amazon CA   -> CA reconocida, confiable
Self-signed: false       -> correcto
Wildcard: true           -> funcional pero riesgo mayor
Expires in: 97 dias      -> renovacion no urgente
Grade: 0.75 (75%)        -> aceptable, mejorable
```

### /.well-known/security.txt (RFC 9116)

**Severidad:** medium
**Proposito:** Proporciona un estandar para que los investigadores de seguridad puedan reportar vulnerabilidades.

El archivo security.txt permite a los administradores publicar informacion de contacto y politicas para el reporte de vulnerabilidades de seguridad. Debe ubicarse en `/.well-known/security.txt` del dominio.

**Campos requeridos (RFC 9116):**
- `Contact:` Direccion (URL o email) para reportar vulnerabilidades
- `Expires:` Fecha y hora tras la cual la informacion deja de ser valida

**Campos recomendados:**
- `Encryption:` URL con clave publica para comunicacion cifrada
- `Policy:` URL con la politica de divulgacion de vulnerabilidades

**Evaluacion:**
- Con Contact y Expires = cumple el RFC 9116
- Solo Contact = parcialmente conforme
- Sin Contact = no cumple el estandar

### SRI (Subresource Integrity)

**Severidad:** medium
**Proposito:** Garantizar que los recursos cargados desde CDNs o terceros no hayan sido modificados.

El atributo `integrity` en etiquetas `<script>` y `<link rel="stylesheet">` permite al navegador verificar que el recurso no ha sido alterado mediante un hash criptografico.

**Evaluacion:**
- Todos los recursos externos tienen integrity = configuracion segura
- Recursos sin integrity = riesgo de compromiso via CDN o terceros
- Sin recursos externos = no aplica

### Archivos Sensibles

Escaneo pasivo de 40 rutas comunes que pueden exponer informacion critica. Incluye deteccion de falsos positivos:

| Ruta | Riesgo |
|------|--------|
| `.env` | Credenciales de base de datos, API keys |
| `.git/config` | Historial completo del repositorio |
| `phpinfo.php` | Configuracion completa del servidor |
| `web.config` / `.htaccess` | Configuracion del servidor web |
| `wp-config.php` | Credenciales de WordPress |
| `credentials.json` | Credenciales de servicios cloud |
| `Dockerfile` | Configuracion de contenedores |
| `backup/`, `logs/`, `private/` | Directorios con contenido sensible |

**Confianza del resultado:** Cada hallazgo incluye un nivel de confianza:
- **high**: respuesta con contenido no-HTML (JSON, texto plano) — exposicion real probable
- **medium**: respuesta HTML pequena — posible pagina simple
- **low**: respuesta HTML grande — probable soft 404, verificar manualmente

### Fingerprinting de Tecnologias

Identifica el stack tecnologico del sitio: CMS, framework, servidor, runtime y CDN. Cuando se detecta una version concreta, se consulta:
1. **Base de datos local** de 20 CVEs conocidos
2. **API OSV.dev** (Google Open Source Vulnerabilities) — consulta en tiempo real con millones de registros actualizados

**Tecnologias detectables (23):** WordPress, Joomla, Drupal, PHP, Express, ASP.NET, Laravel, Django, Nginx, Apache, Cloudflare, jQuery, Bootstrap, Google Analytics, **Vite, Webpack, Next.js, Nuxt.js, Ruby on Rails, Tomcat, IIS, Gunicorn, Node.js, Python**.

**Interpretacion de confianza:**
- **high**: detectado por meta generator, header explicito o patron inequivoco
- **medium**: detectado por patron de rutas o referencias
- **low**: detectado por referencia indirecta

### /robots.txt

**Severidad:** low
**Proposito:** Guiar a los crawlers sobre que rutas pueden o no acceder.

El archivo robots.txt controla el comportamiento de crawlers y bots. Aunque su proposito es legitimo, las rutas en `Disallow` pueden revelar directorios que el administrador considera sensibles.

**Evaluacion:**
- Con User-agent y Disallow = correctamente configurado
- Sin Disallow = permite todo acceso
- Rutas sensibles expuestas (admin, backup, .git, .env, config) = riesgo de informacion

### SPF (Sender Policy Framework)

**Severidad:** medium
**Protege contra:** Email spoofing, suplantacion del dominio

SPF permite a los administradores especificar que servidores estan autorizados a enviar correo desde el dominio. Se publica como un registro TXT en el DNS.

**Valor esperado:** `v=spf1 include:_spf.google.com -all`

**Evaluacion:**
- `-all` (hard fail): solo los servidores autorizados pueden enviar, el resto es rechazado
- `~all` (soft fail): los servidores no autorizados son marcados pero aceptados (monitoreo)
- `?all` (neutral): no se toma accion
- `+all` (pass): cualquier servidor puede enviar (inseguro)

### DKIM (DomainKeys Identified Mail)

**Severidad:** medium
**Protege contra:** Manipulacion de correo electronico

DKIM permite firmar digitalmente los correos para verificar que no fueron alterados en el transito. La clave publica se publica en el DNS como `{selector}._domainkey.{dominio}`.

**Valor esperado:** `v=DKIM1; k=rsa; p=<clave-publica>`

**Nota:** La herramienta prueba 6 selectores comunes (default, google, selector1, selector2, dkim, mail). Algunos proveedores usan selectores personalizados que pueden no detectarse.

### DMARC (Domain-based Message Authentication, Reporting & Conformance)

**Severidad:** medium
**Protege contra:** Email spoofing, phishing

DMARC indica a los servidores de correo como manejar los mensajes que fallan las verificaciones SPF y DKIM. Se publica como `_dmarc.{dominio}`.

**Valor esperado:** `v=DMARC1; p=reject; rua=mailto:dmarc@tudominio.com`

**Politicas:**
- `p=reject`: Rechazar correos que no pasen validacion (maxima proteccion)
- `p=quarantine`: Marcar como spam los correos que no pasen validacion
- `p=none`: No tomar accion, solo monitorear

### Content-Security-Policy (CSP)
**Severidad: critical**
**Protege contra:** XSS (Cross-Site Scripting), inyeccion de datos

El CSP controla que recursos puede cargar y ejecutar el navegador. Una politica estricta restringe scripts, estilos y otros recursos a origenes de confianza.

**Valor esperado:** Politica restrictiva con directivas default-src, script-src, object-src. Evitar unsafe-inline y unsafe-eval.

**Ejemplo seguro:**
```
Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'
```

### Strict-Transport-Security (HSTS)
**Severidad: high**
**Protege contra:** SSL stripping, ataques MITM

Fuerza al navegador a comunicarse exclusivamente via HTTPS, previniendo ataques que degradan la conexion a HTTP.

**Valor esperado:** `max-age=31536000; includeSubDomains; preload`

### X-Frame-Options (XFO)
**Severidad: high**
**Protege contra:** Clickjacking

Controla si la pagina puede ser mostrada dentro de un frame/iframe en otros sitios.

**Valor esperado:** `DENY` (no permitir frames) o `SAMEORIGIN` (permitir solo del mismo origen)

### X-Content-Type-Options
**Severidad: medium**
**Protege contra:** MIME sniffing

Evita que el navegador interprete archivos como un tipo MIME diferente al declarado por el servidor.

**Valor esperado:** `nosniff`

### Referrer-Policy
**Severidad: medium**
**Protege contra:** Fuga de informacion referente

Controla cuanta informacion de la URL de origen se envia en el header Referer al navegar a otros sitios.

**Valor esperado:** `strict-origin-when-cross-origin`

### Permissions-Policy
**Severidad: medium**
**Protege contra:** Abuso de APIs del navegador

Permite restringir el acceso a APIs sensibles como geolocalizacion, camara, microfono, notificaciones, etc.

### Cache-Control
**Severidad: medium**
**Protege contra:** Caching de datos sensibles

Controla como y por cuanto tiempo el navegador y proxies intermedios pueden cachear la respuesta.

**Valor esperado (datos sensibles):** `no-store`

### Access-Control-Allow-Origin (CORS)
**Severidad: high**
**Protege contra:** Acceso cross-origin no autorizado

Controla que origenes externos pueden acceder a los recursos del servidor via JavaScript.

**Valor esperado:** Un origen especifico o ausente (nunca wildcard `*`)

### Set-Cookie
**Severidad: high**
**Protege contra:** Session hijacking, XSS, CSRF

Las cookies deben incluir flags de seguridad:
- **Secure**: Solo se envian via HTTPS
- **HttpOnly**: No accesibles desde JavaScript
- **SameSite**: Controla el envio en peticiones cross-site

### Cross-Origin-Resource-Policy (CORP)
**Severidad: medium**
**Protege contra:** Fuga de datos cross-origin

Controla que origenes pueden cargar los recursos del sitio.

**Valor esperado:** `same-origin`

### Cross-Origin-Opener-Policy (COOP)
**Severidad: medium**
**Protege contra:** Ataques tipo Spectre, fuga de ventana

Aisla el contexto de navegacion para prevenir que ventanas cross-origin accedan a la ventana actual.

**Valor esperado:** `same-origin`

### Cross-Origin-Embedder-Policy (COEP)
**Severidad: low**
**Protege contra:** Embedding cross-origin no autorizado

Requiere que los recursos cross-origin tengan explicitamente permisos para ser cargados.

**Valor esperado:** `require-corp`

### X-Powered-By
**Severidad: low**
**Riesgo:** Fingerprinting de tecnologias

Revela que tecnologia/version esta usando el servidor (ej: Express, PHP). Debe ser removido para dificultar el fingerprinting.

### Server
**Severidad: low**
**Riesgo:** Fingerprinting del servidor

Similar a X-Powered-By pero a nivel de servidor web. Debe ser minimo o ausente.

### X-XSS-Protection
**Severidad: low** (deprecado)
**Nota:** Este header esta deprecado en navegadores modernos. La proteccion contra XSS debe realizarse via CSP.

## Preguntas Frecuentes

### Por que mi sitio obtuvo una calificacion baja?

Las calificaciones bajas generalmente se deben a:
1. Ausencia de headers de seguridad criticos (CSP, HSTS, XFO)
2. Headers presentes pero mal configurados (CORS con wildcard, CSP con unsafe-inline)
3. Headers que revelan informacion tecnologica (X-Powered-By, Server verbose)

Revise las recomendaciones del reporte para identificar que headers corregir primero.

### Que significa un grade de 1.0 en CORS o Set-Cookie cuando el header esta ausente?

En el caso de CORS y Set-Cookie, la ausencia del header se considera segura:
- Sin header CORS: el navegador no permite peticiones cross-origin (comportamiento seguro por defecto)
- Sin cookies: no hay sesiones que proteger

Si su sitio necesita CORS o cookies, el checker lo evaluara cuando el header este presente.

### La herramienta puede escanear cualquier sitio?

La herramienta puede escanear cualquier URL publica accesible via HTTP/HTTPS. Sin embargo:

- Algunos sitios bloquean peticiones automatizadas (User-Agent conocido)
- Sitios detras de Cloudflare u otros WAF pueden devolver paginas de bloqueo en lugar del contenido real
- La herramienta solo analiza headers, no ejecuta JavaScript ni analiza contenido

### Como de confiable es el analisis de compliance?

El analisis de compliance (OWASP Top 10, NIS2) se basa unicamente en los headers de seguridad HTTP. Estos frameworks son mucho mas amplios e incluyen requisitos organizativos, de procesos y tecnicos que no pueden verificarse solo con headers. El reporte de compliance debe considerarse una indicacion parcial, no una auditoria completa.

## Limitaciones

1. **Solo headers HTTP**: La herramienta no analiza contenido HTML, JavaScript, ni realiza escaneo activo
2. **Sin autenticacion**: No soporta escaneo detras de login ni sesiones autenticadas
3. **Sin analisis de contenido**: No detecta vulnerabilidades XSS o SQLi en el cuerpo de la respuesta
4. **Sin almacenamiento**: No guarda historial de escaneos, cada analisis es independiente
5. **Dependencia de red**: Los resultados dependen de la conectividad con el destino; firewalls, WAFs y CDNs pueden afectar los headers recibidos
6. **CSP basico**: El analisis de CSP verifica directivas principales pero no evalua la politica completa
7. **Scope academico**: La herramienta fue desarrollada como proyecto de master y **no debe usarse como unico instrumento de auditoria profesional**
8. **CVEs**: Combina base local (20 CVEs) con consulta en tiempo real a OSV.dev (millones de registros). La consulta a OSV.dev depende de conectividad a Internet. La ausencia de deteccion NO implica que el sitio este libre de vulnerabilidades
9. **Compliance indicativo**: El mapeo a frameworks normativos es automatico y parcial. No reemplaza una auditoria de compliance real
10. **Falsos positivos en archivos sensibles**: El escaneo de rutas como `/.env` puede generar falsos positivos. Verificar manualmente cada hallazgo
11. **Score heuristico**: La ponderacion de headers (CSP=25, HSTS=15, etc.) es una decision de diseno, no un estandar universal

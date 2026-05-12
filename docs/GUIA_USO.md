# Guia de Uso e Interpretacion de Resultados

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
6. Revise el reporte generado

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

El reporte incluye dos secciones de compliance:

#### OWASP Top 10 (2021)

| Control | Evalua | Que significa |
|---------|--------|---------------|
| A01 - Broken Access Control | CORS, cookies | Evalua si hay controles de acceso debiles que permitan acceso no autorizado |
| A05 - Security Misconfiguration | Headers de seguridad, TLS/SSL | Evalua si faltan headers de seguridad esenciales, TLS desactualizado, certificados expirados o autofirmados |
| A06 - Vulnerable Components | X-Powered-By, Server | Evalua si el sitio expone informacion sobre tecnologias que podrian tener vulnerabilidades conocidas |

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

La herramienta realiza una conexion TLS real con el servidor destino para verificar el estado del certificado y la version del protocolo. Esta informacion se muestra en la seccion TLS/SSL del reporte.

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
7. **Scope academico**: La herramienta fue desarrollada como proyecto de master y no debe usarse como unico instrumento de auditoria profesional

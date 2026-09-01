# ERP Top Consult — proyecto Java / Maven (Spring Boot)

ERP de construcción civil. El **frontend** es la misma aplicación React que ya tenías;
el **backend** en Java (Spring Boot + Maven) la sirve y guarda los datos en una base de
datos **H2** en archivo, de modo que la información persiste entre reinicios.

## Requisitos

- **JDK 17 o superior** (Java 17+).
- **Maven 3.8+** (o el Maven que trae tu IDE: IntelliJ, Eclipse, NetBeans, VS Code).

## Paso 1 — Descargar las librerías del frontend (UNA sola vez, con internet)

Para que la app funcione **sin internet**, primero descarga las librerías al proyecto.
En una terminal, dentro de la carpeta `erp-topconsult`, ejecuta:

- **Windows:**
  ```
  powershell -ExecutionPolicy Bypass -File download-libs.ps1
  ```
- **Mac / Linux:**
  ```
  bash download-libs.sh
  ```

Esto llena la carpeta `src/main/resources/static/vendor/` con React, Recharts, Lucide,
Tailwind y Babel. Es un paso único: una vez descargadas, **ya no necesitas internet**
(ni para el frontend ni para volver a compilar, salvo la primera compilación de Maven).

> Nota: la primera vez que ejecutes Maven, este descarga sus dependencias (Spring Boot, H2)
> del repositorio central y las guarda en tu equipo (`~/.m2`). Después Maven también trabaja offline.

## Paso 2 — Ejecutar

Desde la carpeta del proyecto:

```bash
mvn spring-boot:run
```

O ejecuta la clase `com.topconsult.erp.ErpApplication` desde tu IDE. Luego abre:

**http://localhost:8080**

## Generar un ejecutable (.jar)

```bash
mvn clean package
java -jar target/erp-topconsult-1.0.0.jar
```

Las librerías del `vendor/` quedan empaquetadas dentro del `.jar`, así que el ejecutable
también corre sin internet.

## Dónde se guardan los datos

- En la carpeta `./data/` (archivo `erp.mv.db`) junto al proyecto.
- Para empezar de cero: detén la app y borra la carpeta `data/`.
- Consola de la base de datos (opcional): http://localhost:8080/h2-console
  - JDBC URL: `jdbc:h2:file:./data/erp`  ·  Usuario: `sa`  ·  Sin contraseña.

## Estructura

```
erp-topconsult/
├── pom.xml
├── README.md
├── download-libs.ps1            (descarga de librerías — Windows)
├── download-libs.sh             (descarga de librerías — Mac/Linux)
└── src/main/
    ├── java/com/topconsult/erp/
    │   ├── ErpApplication.java      (arranque Spring Boot)
    │   ├── KvEntry.java             (entidad clave-valor)
    │   ├── KvRepository.java        (acceso a datos)
    │   └── StorageController.java   (API /api/storage, equivalente a window.storage)
    └── resources/
        ├── application.properties   (puerto, base de datos H2)
        └── static/
            ├── index.html           (carga librerías locales + Babel y monta la app)
            ├── app.jsx              (tu ERP React completo)
            └── vendor/              (librerías locales — se llena con download-libs)
```

## Si ves un aviso de "Faltan las librerías locales"

Significa que aún no corriste el script del Paso 1. Ejecútalo (con internet) y recarga
la página. Si alguna descarga falla, revisa que tengas `curl` (Mac/Linux) o que PowerShell
tenga acceso a internet (Windows), y vuelve a intentarlo.

## Publicar en internet (Render, gratis)

El proyecto ya está preparado para la nube:
- Usa variables de entorno `DB_URL`, `DB_USER`, `DB_PASS` (base de datos) y `PORT`.
- Incluye un `Dockerfile` que Render usa para construir y ejecutar.
- En servidor corre en modo `HEADLESS=true` (sin ventana/bandeja).

Pasos resumidos:
1. Sube esta carpeta a un repositorio en **GitHub**.
2. En **render.com** crea un **Web Service** conectado a ese repo (detecta el Dockerfile).
3. En Render, sección **Environment**, agrega las variables:
   - `DB_URL` = `jdbc:postgresql://TU_HOST_NEON/neondb?sslmode=require`
   - `DB_USER` = `neondb_owner`
   - `DB_PASS` = tu contraseña de Neon
   - `HEADLESS` = `true`
4. Deploy. Render te da una URL pública `https://...onrender.com` que todos abren en el navegador.

En tu PC (local) no necesitas variables: usa los valores por defecto (localhost).

# AcademiaPro — gestión de academias de MMA y artes marciales

App web gratuita (sin servidor), en español e inglés, para llevar una academia de MMA, BJJ, Muay Thai, Judo, etc.:

- **Academias, sedes y disciplinas**: cada sede enseña sus disciplinas; cada disciplina tiene su sistema de cinturones/niveles, grados y tiempos mínimos (plantillas IBJJF adultos e infantil, Judo, Muay Thai, Kickboxing, Karate, Taekwondo y niveles para MMA/Boxeo/Lucha), todo editable.
- **Alumnos**: foto, documento, nacimiento, contacto, acudiente, tipo de sangre, EPS, alergias, lesiones, contacto de emergencia, plan y valor, equipo (gi, bucal, guantes, vendas…) con tallas.
- **Pagos**: control de vencimientos con un *check* para marcar pagado (corre la fecha del próximo cobro), historial por mes, métodos (efectivo, Nequi, Daviplata…), recordatorios por WhatsApp y exportación CSV.
- **Grados**: historial por disciplina, tiempo desde la última promoción, quién está listo para el siguiente grado y **alertas cuando una promoción se da antes del tiempo recomendado**.
- **Ranking** por disciplina (y sede) ordenado por cinturón, grado y antigüedad, con podio y fotos.
- **Asistencia** por clase, **Tienda** (a quién ofrecer gi, bucal, etc.), cumpleaños, ingresos de 6 meses.
- **Sincronización con Google Drive** de cada usuario (carpeta privada `appDataFolder`), funciona sin conexión y se instala como app (PWA).

Publicada en GitHub Pages: https://juanandresbaronbaron.github.io/MMA/

## Cómo funciona el guardado

No hay base de datos ni servidor: los datos viven en el navegador (localStorage + IndexedDB para fotos) y, al entrar con Google, se copian al Drive de **esa** persona con el permiso `drive.appdata` (la app no puede ver otros archivos). Cada registro lleva su fecha de cambio y al sincronizar gana el más reciente, así se puede usar a la vez en el celular y el computador. Cada academia que use la app tiene sus datos en su propia cuenta de Google: costo cero.

## Configurar el inicio de sesión con Google (una sola vez)

La app viene con un ID de cliente en `js/config.js`. Para tener uno propio (recomendado, así la pantalla de permiso dice «AcademiaPro»):

1. Entra a https://console.cloud.google.com/ y crea un proyecto (p. ej. «AcademiaPro»).
2. **APIs y servicios › Biblioteca** → busca **Google Drive API** → **Habilitar**.
3. **APIs y servicios › Pantalla de consentimiento de OAuth** (Google Auth Platform › Branding): tipo **Externo**, nombre «AcademiaPro», tu correo de soporte. En *Dominios autorizados* agrega `juanandresbaronbaron.github.io`. Enlace de privacidad: `https://juanandresbaronbaron.github.io/MMA/privacy.html`.
4. **Acceso a los datos (Scopes)**: agrega `.../auth/drive.appdata`.
5. **Público**: pulsa **Publicar app** (pasar a *En producción*). Mientras esté en *Prueba* solo entran los correos que agregues como *usuarios de prueba*. `drive.appdata` no es un permiso sensible, así que no hace falta verificación de Google.
6. **Clientes › Crear cliente** → tipo **Aplicación web**. *Orígenes de JavaScript autorizados*: `https://juanandresbaronbaron.github.io` (y `http://localhost:8000` para pruebas). No hace falta URI de redirección.
7. Copia el ID (`xxxx.apps.googleusercontent.com`) y pégalo en `js/config.js` (o en la app: Ajustes › Avanzado › Cambiar ID de cliente).

## Probar en local

```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```

En Ajustes hay un botón «Cargar alumnos de ejemplo» para ver la app con datos.

## Estructura

- `index.html`, `css/app.css`, `sw.js` (sin conexión), `manifest.webmanifest`
- `js/store.js` datos y reglas (vencimientos, avisos de promoción), `js/sync.js` Google Drive, `js/catalog.js` sistemas de grados
- `js/forms.js` formularios, `js/ui.js` componentes (cinturones SVG, modales), `js/views/*` pantallas

Al cambiar archivos, sube `VERSION` en `sw.js` para que los celulares reciban la versión nueva.

## Idiomas

Español (base) e inglés. Los textos se escriben en español dentro de `t("…")` (`js/i18n.js`) y la traducción va en `js/i18n/en-<archivo>.js`, con el texto en español como clave. Los nombres que escribe el usuario no se traducen; los nombres por defecto del catálogo (cinturones, planes, equipo, disciplinas) sí.

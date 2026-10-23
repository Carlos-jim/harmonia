# Servidor Navidrome (Docker)

Este directorio contiene la configuración oficial de **Navidrome** para que puedas levantar tu propio servidor de música local o en la nube en menos de 1 minuto.

## Inicio Rápido

1. **Copia tus archivos de música:**
   Copia tus álbumes o pistas de audio (`.mp3`, `.flac`, `.m4a`, etc.) dentro de la carpeta:
   ```bash
   docker/music/
   ```

2. **Inicia el contenedor:**
   ```bash
   cd docker
   docker compose up -d
   ```

3. **Crea tu cuenta de administrador:**
   Abre tu navegador en [http://localhost:4533](http://localhost:4533).
   Te pedirá crear el usuario y contraseña del primer administrador (ej. usuario: `admin`, contraseña: `tu_password`).

4. **Conecta tu aplicación Harmonia:**
   Abre la app de escritorio, haz clic en **Servidor** (arriba a la derecha) e ingresa:
   * **URL:** `http://localhost:4533`
   * **Usuario:** `admin`
   * **Contraseña:** `tu_password`

¡Y listo! Tu aplicación cargará automáticamente todas tus canciones, álbumes y portadas al instante.

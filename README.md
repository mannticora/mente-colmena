# Mente Colmena — Archivo NEXO

MVP de un juego cooperativo de misterio en tiempo real. Los jugadores entran a una sala con un código, reciben fragmentos distintos de información y colaboran para resolver una secuencia de tres módulos.

## Stack

- Frontend: React, TypeScript, Vite.
- Multiplayer: Node.js, TypeScript, Colyseus.
- UI icons: Lucide React.
- No requiere base de datos ni API de IA para la partida básica.

## Requisitos

- Node.js 20 o superior recomendado.
- npm 10 o superior.

## Ejecutar en local

Desde la raíz del proyecto:

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`. El servidor de salas escucha en `http://localhost:2567`.

En la pantalla inicial, crea una sala en una ventana y entra desde una segunda ventana/navegador usando el código mostrado.

## Variables de entorno

Frontend opcional (`client/.env.local`):

```env
VITE_GAME_SERVER_URL=http://localhost:2567
```

Servidor (`server/.env` o variables del entorno de despliegue):

```env
PORT=2567
CLIENT_ORIGIN=*
```

Para producción, limita `CLIENT_ORIGIN` al dominio real del frontend y configura HTTPS/WSS mediante el proveedor de hosting.

## GitHub

```bash
git init
git add .
git commit -m "feat: initial Mente Colmena multiplayer MVP"
git branch -M main
git remote add origin https://github.com/mannticora/mente-colmena.git
git push -u origin main
```

Si ya existe un repositorio Git, no repitas `git init` ni `git remote add` sin comprobar primero `git status` y `git remote -v`.

## Estado actual y limitaciones conocidas

Esta es la primera base de código, no una versión verificada en producción. Antes de presentarla como funcional hay que instalar dependencias, ejecutar el build y probar dos sesiones independientes. Las pistas privadas se envían a cada cliente; el modelo de amenazas y las reglas de validación deben revisarse antes de cualquier despliegue público.

El despliegue requiere un host para el frontend estático y otro compatible con procesos Node.js/WebSocket persistentes para el servidor multijugador. GitHub Pages por sí solo no aloja el servidor Colyseus.

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

## Cómo jugar

### Objetivo

Forma un equipo de investigadores para recuperar el expediente confidencial **Archivo NEXO**. Cada jugador recibe fragmentos de evidencia diferentes. Tendrán que compartir información, resolver tres módulos y reconstruir la clave final antes de que termine el tiempo.

### Requisitos

- De 2 a 6 jugadores por sala.
- Cada jugador necesita un navegador web.
- No es necesario crear una cuenta ni instalar programas.
- Se recomienda jugar desde dispositivos diferentes para facilitar la comunicación.

### Iniciar una partida

1. Abre [Mente Colmena](https://mente-colmena.vercel.app/).
2. Escribe tu nombre de investigador.
3. Selecciona **Crear sala**.
4. Comparte el código de sala con los demás participantes.
5. Los demás jugadores deben introducir su nombre y el código para conectarse.
6. Cuando haya al menos dos investigadores, el anfitrión puede iniciar la investigación.

### Reglas del juego

- Cada partida tiene un límite de **5 minutos**.
- Cada investigador recibe pistas individuales.
- Ningún jugador tiene toda la información necesaria para resolver el caso por sí solo.
- Utiliza el canal de chat integrado para compartir tus hallazgos.
- El equipo debe resolver los tres módulos en orden.
- Una respuesta incorrecta no termina la partida: pueden volver a intentarlo.
- Al recuperar los tres módulos, deberán introducir la clave de desclasificación de tres cifras.
- Si el tiempo llega a cero, la investigación termina.

### Los tres módulos

**Módulo 01 — La señal fragmentada**

Analiza los pulsos registrados por el panel de comunicación para descubrir la primera cifra.

**Módulo 02 — El archivo espejo**

Interpreta la secuencia reflejada y determina qué símbolo permanece fijo.

**Módulo 03 — La última llave**

Utiliza los resultados anteriores y la información del expediente para calcular la última cifra.

### Desclasificación

Después de resolver los tres módulos, el equipo tendrá acceso a la fase final.

1. Comparen las respuestas obtenidas.
2. Reconstruyan la secuencia de tres cifras.
3. Introduzcan la clave en el formulario de desclasificación.
4. Si es correcta, el Archivo NEXO se desbloqueará y podrán consultar el informe original.

### Roles

- **Anfitrión:** crea la sala, inicia la investigación y puede reiniciar la partida.
- **Investigadores:** reciben pistas, comparten evidencias y colaboran para resolver los acertijos.

Si el anfitrión se desconecta, otro jugador conectado asumirá automáticamente el rol.

### Condiciones de victoria y derrota

- **Victoria:** resolver los tres módulos e introducir correctamente la clave final antes de que termine el tiempo.
- **Derrota:** agotar los cinco minutos sin completar la investigación.

Después de una partida terminada, el anfitrión puede iniciar una nueva investigación.

### Consejos

- No resuelvas los acertijos de manera aislada: comparte tus pistas.
- Lee cuidadosamente cada fragmento de evidencia.
- Contrasta la información antes de enviar una respuesta.
- Administra el tiempo y mantén la comunicación activa.

**Recuerda:** la información está fragmentada. La única forma de recuperar el Archivo NEXO es trabajar en equipo.

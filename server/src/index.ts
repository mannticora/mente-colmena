(Symbol as any).metadata ??= Symbol.for('Symbol.metadata');

import { Server, Room } from 'colyseus';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { Schema, MapSchema, ArraySchema, type } from '@colyseus/schema';
import { createServer } from 'http';

const PORT = Number(process.env.PORT || 2567);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';
const MAX_PLAYERS = 6;
const GAME_SECONDS = 300;
const ANSWERS = ['2', '1', '1'];
const CLUES: Record<number, string[]> = {
  0: [
    'PISTA A · El panel parpadeó: corto, corto, largo, corto. Solo cuentan los pulsos cortos antes del largo.',
    'PISTA B · El manual de señales define “corto” como un pulso de duración inferior a un segundo.',
    'PISTA C · No cuentes los pulsos posteriores al primer pulso largo.'
  ],
  1: [
    'PISTA A · En el reflejo del archivo aparecen tres marcas: 4 — 1 — 3.',
    'PISTA B · El operador confirma que solo el símbolo central permanece fijo al invertir el orden.',
    'PISTA C · El registro de seguridad pide la cifra que ocupa el centro, no los extremos.'
  ],
  2: [
    'PISTA A · El archivo tiene dos puertas.',
    'PISTA B · Suma las respuestas de los dos módulos anteriores.',
    'PISTA C · Resta la cantidad de puertas a la suma. El resultado es la última cifra.'
  ]
};

class PlayerState extends Schema {
  @type('string') name = '';
  @type('boolean') isHost = false;
  @type('boolean') connected = true;
}
class GameState extends Schema {
  @type('string') code = '';
  @type('string') hostId = '';
  @type('string') phase = 'lobby';
  @type('number') puzzleIndex = 0;
  @type(['number']) solved = new ArraySchema<number>();
  @type('number') timeLeft = GAME_SECONDS;
  @type('string') message = 'Esperando al equipo.';
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
}
function roomCode() { return Math.random().toString(36).slice(2, 8).toUpperCase(); }
function safeName(value: unknown) { return typeof value === 'string' ? value.trim().replace(/[<>]/g, '').slice(0, 18) : ''; }

class MenteColmenaRoom extends Room<GameState> {
  private timer?: ReturnType<typeof setInterval>;
  async onCreate(options: { name?: string }) {
    this.maxClients = MAX_PLAYERS;
    this.setState(new GameState());
    this.state.code = roomCode();
    await this.setMetadata({ code: this.state.code });
    this.onMessage('start', (client) => {
      if (client.sessionId !== this.state.hostId || this.state.phase !== 'lobby' || this.clients.length < 2) return;
      this.state.phase = 'playing'; this.state.puzzleIndex = 0; this.state.solved.splice(0); this.state.timeLeft = GAME_SECONDS;
      this.state.message = 'Investigación iniciada. Compartid vuestras pistas.';
      this.sendPrivateClues(0);
      this.startTimer();
    });
    this.onMessage('answer', (client, payload: { answer?: unknown }) => {
      if (this.state.phase !== 'playing') return;
      const answer = typeof payload?.answer === 'string' ? payload.answer.trim().toLowerCase() : '';
      if (answer !== ANSWERS[this.state.puzzleIndex]) {
        client.send('notice', { text: 'Respuesta incorrecta. Contrasta las pistas e inténtalo de nuevo.' });
        return;
      }
      const solvedIndex = this.state.puzzleIndex;
      if (!this.state.solved.includes(solvedIndex)) this.state.solved.push(solvedIndex);
      if (solvedIndex >= ANSWERS.length - 1) {
        this.state.phase = 'won'; this.state.message = 'Archivo desbloqueado.'; this.stopTimer();
        this.broadcast('notice', { text: `${this.state.players.get(client.sessionId)?.name || 'El equipo'} ha desbloqueado el archivo NEXO.` });
      } else {
        this.state.puzzleIndex += 1;
        this.state.message = `Módulo ${solvedIndex + 1} resuelto. Nuevo fragmento disponible.`;
        this.sendPrivateClues(this.state.puzzleIndex);
        this.broadcast('notice', { text: `Módulo ${solvedIndex + 1} resuelto. Avanzando al siguiente archivo.` });
      }
    });
    this.onMessage('chat', (client, payload: { text?: unknown }) => {
      if (this.state.phase === 'won' || this.state.phase === 'lost') return;
      const text = typeof payload?.text === 'string' ? payload.text.trim().replace(/[<>]/g, '').slice(0, 180) : '';
      if (!text) return;
      this.broadcast('chat', { name: this.state.players.get(client.sessionId)?.name || 'Investigador', text, time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) });
    });
    this.onMessage('restart', (client) => {
      if (client.sessionId !== this.state.hostId || !['won', 'lost'].includes(this.state.phase)) return;
      this.stopTimer(); this.state.phase = 'lobby'; this.state.puzzleIndex = 0; this.state.solved.splice(0); this.state.timeLeft = GAME_SECONDS; this.state.message = 'Nueva investigación lista.';
      this.broadcast('notice', { text: 'La sala está lista para una nueva investigación.' });
    });
  }

  onJoin(client: any, options: { name?: string }) {
    const name = safeName(options?.name) || `Investigador ${this.clients.length}`;
    const duplicate = [...this.state.players.values()].some(p => p.name.toLowerCase() === name.toLowerCase());
    if (duplicate) { client.send('notice', { text: 'Ese nombre ya está en uso. Sal y vuelve a entrar con otro apodo.' }); }
    const player = new PlayerState(); player.name = duplicate ? `${name.slice(0, 13)}-${this.clients.length}` : name; player.isHost = this.state.hostId === ''; player.connected = true;
    this.state.players.set(client.sessionId, player);
    if (!this.state.hostId) this.state.hostId = client.sessionId;
    
    this.broadcast('notice', { text: `${player.name} se ha conectado a la investigación.` });
    if (this.state.phase === 'playing') client.send('privateClue', { text: CLUES[this.state.puzzleIndex]?.[this.clients.length % 3] || CLUES[this.state.puzzleIndex]?.[0] });
  }

  onLeave(client: any) {
    const player = this.state.players.get(client.sessionId);
    if (player) this.state.players.delete(client.sessionId);
    if (client.sessionId === this.state.hostId && this.clients.length > 0) {
      const next = this.clients[0]; this.state.hostId = next.sessionId;
      this.state.players.forEach((p, id) => p.isHost = id === next.sessionId);
      this.broadcast('notice', { text: 'El anfitrión se desconectó. Se asignó un nuevo anfitrión.' });
    }
    if (this.clients.length === 0) this.stopTimer();
  }

  private sendPrivateClues(puzzleIndex: number) {
    let i = 0;
    this.clients.forEach(client => {
      const clueList = CLUES[puzzleIndex] || CLUES[0];
      client.send('privateClue', { text: clueList[i % clueList.length] }); i++;
    });
  }
  private startTimer() {
    this.stopTimer();
    this.timer = setInterval(() => {
      if (this.state.phase !== 'playing') return this.stopTimer();
      this.state.timeLeft = Math.max(0, this.state.timeLeft - 1);
      if (this.state.timeLeft <= 0) { this.state.phase = 'lost'; this.state.message = 'El tiempo se agotó.'; this.stopTimer(); this.broadcast('notice', { text: 'Tiempo agotado. La investigación ha terminado.' }); }
    }, 1000);
  }
  private stopTimer() { if (this.timer) clearInterval(this.timer); this.timer = undefined; }
  onDispose() { this.stopTimer(); }
}

const httpServer = createServer();
const gameServer = new Server({ transport: new WebSocketTransport({ server: httpServer }) });
gameServer.define('mente_colmena', MenteColmenaRoom);
httpServer.listen(PORT, () => console.log(`Mente Colmena server listening on http://localhost:${PORT}`));

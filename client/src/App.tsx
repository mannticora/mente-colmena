import { useEffect, useMemo, useState } from 'react';
import { Client, Room } from 'colyseus.js';
import { Activity, ArrowRight, AudioLines, Check, ChevronRight, CircleHelp, Copy, Cpu, DoorOpen, Fingerprint, LockKeyhole, Radio, RotateCcw, ShieldAlert, Sparkles, Users, Wifi, X } from 'lucide-react';

type Player = { sessionId: string; name: string; isHost: boolean; connected: boolean };
type Puzzle = { title: string; prompt: string; clue: string; index: number };
type Snapshot = { code: string; hostId: string; phase: 'lobby'|'playing'|'won'|'lost'; players: Player[]; puzzleIndex: number; solved: number[]; timeLeft: number; message: string; submittedBy?: string };

const API_URL = (import.meta.env.VITE_GAME_SERVER_URL as string | undefined) || 'http://localhost:2567';
const PUZZLES: Puzzle[] = [
  { title: 'La señal fragmentada', prompt: 'El registro indica: “La primera cifra es el número de pulsos cortos antes del pulso largo”. ¿Qué cifra abre el canal?', clue: 'PISTA A · El panel parpadeó: corto, corto, largo, corto. Solo cuentan los pulsos cortos antes del largo.', index: 0 },
  { title: 'El archivo espejo', prompt: 'El archivo dice: “Lee el orden desde el reflejo: 4 — 1 — 3”. El operador añade que solo el centro permanece fijo. ¿Qué cifra ocupa el centro?', clue: 'PISTA B · En el reflejo del archivo aparecen tres marcas: 4 — 1 — 3. El símbolo central no cambia al invertir el orden.', index: 1 },
  { title: 'La última llave', prompt: 'El núcleo responde: “Suma las dos cifras anteriores y resta la cantidad de puertas del archivo”. Hay dos puertas. ¿Cuál es el resultado?', clue: 'PISTA C · El archivo tiene dos puertas. Usa las respuestas de los dos módulos anteriores para calcular la última cifra.', index: 2 },
];

function makeCode() { return Math.random().toString(36).slice(2, 8).toUpperCase(); }
function App() {
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [room, setRoom] = useState<Room | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [sessionId, setSessionId] = useState('');
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState(false);
  const [privateClue, setPrivateClue] = useState('Tu fragmento aparecerá cuando comience la investigación.');
  const [chatDraft, setChatDraft] = useState('');
  const [chat, setChat] = useState<{name:string; text:string; time:string}[]>([]);
  const [view, setView] = useState<'home'|'room'>('home');

  const currentPuzzle = useMemo(() => PUZZLES[snapshot?.puzzleIndex ?? 0], [snapshot?.puzzleIndex]);
  const isHost = !!snapshot && snapshot.hostId === sessionId;

  useEffect(() => {
    if (!room) return;
    const stateHandler = (state: any) => {
      const players: Player[] = [];
      state.players?.forEach((p: any, id: string) => players.push({ sessionId: id, name: p.name, isHost: p.isHost, connected: p.connected }));
      setSnapshot({ code: state.code, hostId: state.hostId, phase: state.phase, players, puzzleIndex: state.puzzleIndex, solved: [...(state.solved || [])], timeLeft: state.timeLeft, message: state.message || '' });
    };
    room.onStateChange(stateHandler);
    room.onMessage('notice', (msg: {text:string}) => setNotice(msg.text));
    room.onMessage('privateClue', (msg: {text:string}) => setPrivateClue(msg.text));
    room.onMessage('chat', (msg: {name:string;text:string;time:string}) => setChat(prev => [...prev.slice(-39), msg]));
    room.onLeave(() => { setNotice('Se perdió la conexión con la sala.'); });
    return () => { room.removeAllListeners(); };
  }, [room]);

  async function enterRoom(mode: 'create'|'join') {
    const cleanName = name.trim().slice(0, 18);
    if (!cleanName) { setError('Escribe un nombre para entrar.'); return; }
    if (mode === 'join' && joinCode.trim().length < 4) { setError('Escribe un código de sala válido.'); return; }
    setBusy(true); setError('');
    try {
      const client = new Client(API_URL);
      const newRoom = mode === 'create'
        ? await client.create('mente_colmena', { name: cleanName })
        : await client.join('mente_colmena', {
    name: cleanName,
    code: joinCode.trim().toUpperCase()
  });
      setRoom(newRoom); setSessionId(newRoom.sessionId); setView('room'); setChat([]);
    } catch (e) {
      console.error(e);
      setError(`No se pudo conectar al servidor (${API_URL}). Comprueba que esté activo y que la URL sea correcta.`);
    } finally { setBusy(false); }
  }
  async function leaveRoom() { try { await room?.leave(); } catch {} setRoom(null); setSnapshot(null); setView('home'); setNotice(''); setChat([]); }
  function startGame() { room?.send('start'); }
  function submitAnswer(e: React.FormEvent) { e.preventDefault(); if (!answer.trim()) return; room?.send('answer', { answer: answer.trim() }); setAnswer(''); }
  function sendChat(e: React.FormEvent) { e.preventDefault(); if (!chatDraft.trim()) return; room?.send('chat', { text: chatDraft.trim().slice(0, 180) }); setChatDraft(''); }
  async function copyCode() { if (!snapshot) return; try { await navigator.clipboard.writeText(snapshot.code); setCopied(true); setTimeout(() => setCopied(false), 1400); } catch { setNotice(`Código de sala: ${snapshot.code}`); } }
  const time = `${Math.floor((snapshot?.timeLeft ?? 0)/60).toString().padStart(2,'0')}:${((snapshot?.timeLeft ?? 0)%60).toString().padStart(2,'0')}`;

  if (view === 'room' && snapshot) return <main className="app-shell room-shell">
    <header className="topbar"><a className="brand" href="#" onClick={e=>{e.preventDefault();leaveRoom();}}><span className="brand-mark"><Fingerprint size={21}/></span><span>MENTE<span className="accent">COLMENA</span><small>ARCHIVO NEXO / UNIDAD DE INVESTIGACIÓN</small></span></a><div className="top-status"><span className="live-dot"/> ENLACE ESTABLE <span className="divider-v"/> <button className="text-button" onClick={leaveRoom}><DoorOpen size={15}/> Salir</button></div></header>
    <div className="room-heading"><div><div className="eyebrow"><span className="eyebrow-line"/> SALA DE INVESTIGACIÓN</div><h1>Archivo <span className="accent">NEXO</span></h1><p className="muted">Combina las pistas. Reconstruye la secuencia. Abre el archivo.</p></div><button className="room-code" onClick={copyCode}><span>CÓDIGO DE SALA</span><strong>{snapshot.code}</strong><small><Copy size={12}/> {copied?'COPIADO':'COMPARTIR CÓDIGO'}</small></button></div>
    {notice && <div className="notice"><Activity size={15}/>{notice}<button onClick={()=>setNotice('')}><X size={14}/></button></div>}
    <div className="game-layout"><section className="main-panel">
      {snapshot.phase === 'lobby' ? <div className="lobby-state"><div className="radar"><div className="radar-ring ring-a"/><div className="radar-ring ring-b"/><div className="radar-ring ring-c"/><div className="radar-center"><Fingerprint size={34}/></div><span className="radar-ping ping-a"/><span className="radar-ping ping-b"/></div><div className="eyebrow centered"><span className="live-dot"/> ESPERANDO AL EQUIPO</div><h2>La investigación<br/>comienza <span className="accent">juntos.</span></h2><p className="muted max-copy">Cada investigador recibirá fragmentos distintos del registro. Compartirlos será la única forma de descifrar el archivo.</p>{isHost ? <button className="primary-button" disabled={snapshot.players.length < 2} onClick={startGame}>INICIAR INVESTIGACIÓN <ArrowRight size={17}/></button> : <div className="waiting-pill"><span className="pulse-dot"/> Esperando a que el anfitrión inicie...</div>}{snapshot.players.length < 2 && <p className="hint">Necesitas al menos 2 investigadores para comenzar.</p>}</div>
      : snapshot.phase === 'playing' ? <div className="puzzle-state"><div className="puzzle-topline"><span className="eyebrow">MÓDULO {String(snapshot.puzzleIndex+1).padStart(2,'0')} / 03</span><span className="timer"><Activity size={15}/>{time}</span></div><div className="progress-track"><span style={{width:`${snapshot.solved.length/3*100}%`}}/></div><div className="puzzle-icon"><LockKeyhole size={24}/><span>SEÑAL ENCRIPTADA</span></div><h2>{currentPuzzle.title}</h2><p className="puzzle-prompt">{currentPuzzle.prompt}</p><div className="private-clue"><div className="clue-head"><Fingerprint size={16}/> FRAGMENTO DE EVIDENCIA <span>PERSONAL</span></div><p>{privateClue}</p><small>Comparte esta pista con tu equipo. Cada jugador puede tener información diferente.</small></div><form className="answer-form" onSubmit={submitAnswer}><label htmlFor="answer">RESPUESTA DEL EQUIPO</label><div className="answer-row"><input id="answer" value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="Introduce la cifra..." maxLength={20}/><button className="primary-button" type="submit">ENVIAR <ChevronRight size={17}/></button></div></form><p className="hint"><CircleHelp size={14}/> Hablen entre ustedes antes de enviar una respuesta.</p></div>
      : <div className="end-state"><div className={`end-icon ${snapshot.phase==='won'?'won':''}`}>{snapshot.phase==='won'?<Check size={36}/>:<ShieldAlert size={36}/>}</div><div className="eyebrow centered">INFORME DE MISIÓN</div><h2>{snapshot.phase==='won'?'ARCHIVO DESBLOQUEADO':'SEÑAL PERDIDA'}</h2><p className="muted max-copy">{snapshot.phase==='won'?'El equipo combinó las pruebas y recuperó el archivo NEXO. La investigación ha sido completada.':'El tiempo se agotó antes de completar la secuencia. La próxima vez, compartan sus pistas desde el principio.'}</p>{isHost && <button className="primary-button" onClick={()=>room?.send('restart')}><RotateCcw size={16}/> VOLVER A INVESTIGAR</button>}{!isHost&&<div className="waiting-pill">Esperando al anfitrión para reiniciar...</div>}</div>}
    </section><aside className="side-panel"><div className="side-title"><Users size={16}/><span>INVESTIGADORES</span><b>{snapshot.players.length}/6</b></div><div className="player-list">{snapshot.players.map((p,i)=><div className="player-row" key={p.sessionId}><div className={`avatar avatar-${i%5}`}>{p.name.slice(0,1).toUpperCase()}</div><div className="player-info"><strong>{p.name}{p.sessionId===sessionId?' (tú)':''}</strong><small>{p.isHost?'ANFITRIÓN':'INVESTIGADOR'}</small></div><span className="player-online" title="Conectado"/></div>)}</div><div className="side-divider"/><div className="side-title"><Radio size={16}/><span>CANAL DEL EQUIPO</span><span className="secure-label"><LockKeyhole size={11}/> SEGURO</span></div><div className="chat-messages">{chat.length===0?<div className="chat-empty"><AudioLines size={22}/><p>Canal abierto.<br/>Comparte tus hallazgos aquí.</p></div>:chat.map((m,i)=><div className="chat-message" key={i}><div><strong>{m.name}</strong><time>{m.time}</time></div><p>{m.text}</p></div>)}</div><form className="chat-form" onSubmit={sendChat}><input value={chatDraft} onChange={e=>setChatDraft(e.target.value)} placeholder="Transmitir mensaje..." maxLength={180}/><button type="submit" aria-label="Enviar mensaje"><ArrowRight size={17}/></button></form><div className="mission-progress"><div className="side-title"><Cpu size={15}/><span>INTEGRIDAD DEL ARCHIVO</span></div><div className="mini-progress"><span style={{width:`${snapshot.solved.length/3*100}%`}}/></div><div className="mini-progress-label"><span>{snapshot.solved.length} DE 3 MÓDULOS</span><span>{Math.round(snapshot.solved.length/3*100)}%</span></div></div></aside></div>
    <footer className="app-footer"><span>MENTE COLMENA <span className="footer-dim">/ PROTOTIPO 0.1</span></span><span><Wifi size={13}/> SESIÓN MULTIJUGADOR <span className="footer-dim">· NEXO SYSTEMS</span></span></footer>
  </main>;

  return <main className="app-shell home-shell"><header className="topbar"><a className="brand" href="#"><span className="brand-mark"><Fingerprint size={21}/></span><span>MENTE<span className="accent">COLMENA</span><small>ARCHIVO NEXO / UNIDAD DE INVESTIGACIÓN</small></span></a><div className="top-status"><span className="live-dot"/> SISTEMA EN ESPERA <span className="divider-v"/> <span className="build-tag">BUILD 0.1.0</span></div></header><section className="hero"><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line"/> TRANSMISIÓN CLASIFICADA <span className="classification">NIVEL 04</span></div><h1>La verdad está<br/>en las piezas que<br/><span className="accent">nos faltan.</span></h1><p className="hero-description">Un misterio. Muchas perspectivas. Una sola mente colectiva. Entra al archivo NEXO y descubre qué ocurre cuando la información está fragmentada.</p><div className="hero-facts"><div><Users size={16}/><span>2–6 INVESTIGADORES</span></div><div><Activity size={16}/><span>TIEMPO REAL</span></div><div><LockKeyhole size={16}/><span>PISTAS PRIVADAS</span></div></div></div><div className="hero-art" aria-hidden="true"><div className="orbit orbit-1"/><div className="orbit orbit-2"/><div className="orbit orbit-3"/><div className="core-glow"/><div className="core"><Fingerprint size={86} strokeWidth={1}/><span>NEXO</span></div><div className="float-card card-left"><span className="card-label"><span className="live-dot"/> SEÑAL DETECTADA</span><strong>Fragmento <span>01</span></strong><div className="wave-bars">{Array.from({length:20},(_,i)=><i key={i} style={{height:`${10+((i*13)%29)}px`}}/>)}</div></div><div className="float-card card-right"><span className="card-label">ESTADO DEL ARCHIVO</span><strong className="accent">ENCRIPTADO</strong><div className="fake-lines"><i/><i/><i/></div></div><div className="coordinate">40° 42' 51.2" N<br/>ARCHIVE NODE 07</div></div></section><section className="entry-section"><div className="entry-heading"><div><div className="eyebrow"><span className="eyebrow-line"/> ESTABLECER CONEXIÓN</div><h2>Entra en la <span className="accent">investigación.</span></h2></div><p>Sin cuentas. Sin instalaciones.<br/>Solo necesitas a tu equipo.</p></div><div className="entry-grid"><form className="entry-card create-card" onSubmit={e=>{e.preventDefault();enterRoom('create')}}><div className="entry-card-icon"><Sparkles size={19}/></div><div className="entry-card-title"><h3>Crear una sala</h3><span className="entry-index">01 / HOST</span></div><p>Inicia una nueva investigación y comparte el código con tu equipo.</p><label htmlFor="create-name">TU NOMBRE DE INVESTIGADOR</label><input id="create-name" value={name} onChange={e=>setName(e.target.value)} placeholder="Ej. Alex" maxLength={18}/><button className="primary-button full-button" disabled={busy} type="submit">{busy?'CONECTANDO...':'CREAR SALA'} <ArrowRight size={17}/></button></form><form className="entry-card join-card" onSubmit={e=>{e.preventDefault();enterRoom('join')}}><div className="entry-card-icon muted-icon"><DoorOpen size={19}/></div><div className="entry-card-title"><h3>Unirse a una sala</h3><span className="entry-index">02 / JOIN</span></div><p>¿Tu equipo ya está conectado? Introduce el código para entrar.</p><label htmlFor="join-name">TU NOMBRE DE INVESTIGADOR</label><input id="join-name" value={name} onChange={e=>setName(e.target.value)} placeholder="Ej. Alex" maxLength={18}/><label htmlFor="join-code">CÓDIGO DE SALA</label><input id="join-code" className="code-input" value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8))} placeholder="ABC123" maxLength={12}/><button className="secondary-button full-button" disabled={busy} type="submit">{busy?'CONECTANDO...':'CONECTAR AL ARCHIVO'} <ChevronRight size={17}/></button></form></div>{error&&<div className="error-banner"><ShieldAlert size={16}/>{error}<button onClick={()=>setError('')}><X size={14}/></button></div>}</section><section className="how-section"><div className="eyebrow"><span className="eyebrow-line"/> PROTOCOLO DE INVESTIGACIÓN</div><div className="steps-grid"><div className="step"><span>01</span><h3>Recibe tu fragmento</h3><p>Cada investigador ve información que nadie más tiene.</p></div><div className="step"><span>02</span><h3>Conecta las piezas</h3><p>Comparte tus hallazgos por el canal seguro del equipo.</p></div><div className="step"><span>03</span><h3>Abre el archivo</h3><p>Combinen las pistas, resuelvan los módulos y descubran la verdad.</p></div></div></section><footer className="app-footer"><span>MENTE COLMENA <span className="footer-dim">/ PROTOTIPO 0.1</span></span><span><Wifi size={13}/> NEXO SYSTEMS <span className="footer-dim">· COOPERAR ES SOBREVIVIR</span></span></footer></main>;
}
export default App;

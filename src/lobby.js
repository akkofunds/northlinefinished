import { Peer } from 'peerjs';

const MAX_PLAYERS = 8;
const state = {
  peer:null, host:false, roomId:'', playerId:'', name:localStorage.getItem('northline-name')||`Operator-${Math.floor(1000+Math.random()*9000)}`,
  peers:new Map(), started:false, mode:'ffa', map:'yard', onStart:null, onNetwork:null, onCombat:null, selfSpawnIndex:0,
};
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function roomCode(){const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';return Array.from({length:6},()=>c[Math.floor(Math.random()*c.length)]).join('');}
function status(t,type=''){const e=$('lobby-status');if(e){e.textContent=t;e.dataset.type=type;}}
function players(){
  const a=[{id:state.playerId,name:state.name,host:state.host,spawnIndex:state.host?0:state.selfSpawnIndex,team:state.host?0:1}];
  for(const [id,p] of state.peers) if(id!==state.roomId) a.push({id,name:p.name||'Operator',host:false,spawnIndex:p.spawnIndex??1,team:p.team??(a.length%2)});
  return a.slice(0,MAX_PLAYERS);
}
function render(){
  const grid=$('player-grid');if(!grid)return;const ps=players();grid.innerHTML='';
  for(let i=0;i<MAX_PLAYERS;i++){const p=ps[i],c=document.createElement('div');c.className='player-card'+(p?' occupied':'');c.innerHTML=p?`<div class="player-avatar">${esc((p.name||'O')[0].toUpperCase())}</div><div class="player-meta"><strong>${esc(p.name)}</strong><span>${p.host?'HOST':'CONNECTED'} · ${state.mode.toUpperCase()} · SLOT ${((p.spawnIndex??i)+1)}</span></div><div class="player-dot"></div>`:`<div class="player-avatar empty">+</div><div class="player-meta"><strong>OPEN SLOT</strong><span>Waiting for operator</span></div>`;grid.appendChild(c)}
  $('player-count').textContent=`${ps.length}/${MAX_PLAYERS}`;$('start-match').disabled=!state.host||!ps.length;$('start-match').textContent=state.host?'START MATCH':'WAITING FOR HOST';
}
function sendHost(msg){if(state.host){hostMessage(null,msg);return true}const c=state.peers.get(state.roomId)?.conn;if(c?.open){c.send(msg);return true}return false}
function sendAll(msg){for(const p of state.peers.values())if(p.conn?.open)p.conn.send(msg)}
function roster(){sendAll({type:'roster',players:players(),mode:state.mode,map:state.map});render()}
function chat(name,text){const log=$('chat-log');if(log){const row=document.createElement('div');row.className='chat-line';row.innerHTML=`<span>${esc(name)}</span><b>${esc(text)}</b>`;log.appendChild(row);while(log.children.length>60)log.firstElementChild.remove();log.scrollTop=log.scrollHeight}sendAll({type:'chat',name,text})}
function hostMessage(conn,msg){
  if(!msg)return;
  if(msg.type==='hello'&&conn){const p=state.peers.get(conn.peer);if(!p)return;p.name=String(msg.name||'Operator').slice(0,18);p.mode=state.mode;p.map=state.map;roster();chat('SYSTEM',`${p.name} joined the lobby.`);return}
  if(msg.type==='chat'){const name=conn?state.peers.get(conn.peer)?.name:state.name;const text=String(msg.text||'').slice(0,180);if(text){append(name||'SYSTEM',text);sendAll({type:'chat',name:name||'SYSTEM',text})}return}
  if(msg.type==='state'&&conn){const s=msg.state;if(!s)return;const packet={type:'state',id:conn.peer,x:Number(s.x)||0,y:Number(s.y)||0,z:Number(s.z)||0,yaw:Number(s.yaw)||0,pitch:Number(s.pitch)||0};state.onNetwork?.(packet);sendAll(packet);return}
  if(msg.type==='shot'&&conn){state.onCombat?.({type:'shot',shooter:conn.peer,origin:msg.origin,dir:msg.dir});return}
}
function append(name,text){const log=$('chat-log');if(!log)return;const row=document.createElement('div');row.className='chat-line';row.innerHTML=`<span>${esc(name)}</span><b>${esc(text)}</b>`;log.appendChild(row);while(log.children.length>60)log.firstElementChild.remove();log.scrollTop=log.scrollHeight}
function addConnection(conn){
  conn.on('open',()=>{
    if(state.peers.size>=MAX_PLAYERS-1){conn.send({type:'full'});return conn.close()}
    const used=new Set([...state.peers.values()].map(p=>p.spawnIndex));let si=1;while(used.has(si)&&si<MAX_PLAYERS)si++;
    const team=si%2;state.peers.set(conn.peer,{conn,name:'Operator',spawnIndex:si,team});
    conn.send({type:'welcome',hostId:state.playerId,roomId:state.roomId,playerId:conn.peer,spawnIndex:si,team,mode:state.mode,map:state.map});
    conn.send({type:'roster',players:players(),mode:state.mode,map:state.map});roster();status(`${state.peers.size+1} operator${state.peers.size===0?'':'s'} connected`,'ok');
  });
  conn.on('data',m=>hostMessage(conn,m));
  conn.on('close',()=>{const p=state.peers.get(conn.peer);state.peers.delete(conn.peer);if(p)chat('SYSTEM',`${p.name||'Operator'} left the lobby.`);roster()});
  conn.on('error',()=>state.peers.delete(conn.peer));
}
function setupChat(){const i=$('chat-input');i.addEventListener('keydown',e=>{if(e.key!=='Enter')return;e.preventDefault();const t=i.value.trim();if(!t)return;i.value='';sendHost({type:'chat',text:t})})}
function invite(){const u=new URL(location.href);u.searchParams.set('room',state.roomId);$('invite-link').value=u.toString()}
async function copy(){try{await navigator.clipboard.writeText($('invite-link').value)}catch{const i=$('invite-link');i.select();document.execCommand('copy')}$('copy-invite').textContent='COPIED';setTimeout(()=>$('copy-invite').textContent='COPY INVITE',1000)}
function openGame(startPlayers=players()){state.started=true;$('lobby').classList.add('hidden');document.body.classList.remove('lobby-mode');const me=startPlayers.find(p=>p.id===state.playerId);state.selfSpawnIndex=me?.spawnIndex??state.selfSpawnIndex;state.mode=me?.mode||state.mode;state.map=me?.map||state.map;state.onStart?.({spawnIndex:state.selfSpawnIndex,players:startPlayers,mode:state.mode,map:state.map})}
function start(){if(!state.host||state.started)return;const ps=players();sendAll({type:'start',players:ps,mode:state.mode,map:state.map});openGame(ps)}
function quickPlay(){const id='northline-ffa-public'; const peer=new Peer(); state.peer=peer; state.host=false; state.mode='ffa'; state.map='dustline'; status('Finding an open FFA match…'); peer.on('open',pid=>{state.playerId=pid;const conn=peer.connect(id,{reliable:true});state.roomId=id;state.peers.set(id,{conn,name:'Host',spawnIndex:0,team:0});conn.on('open',()=>{conn.send({type:'hello',name:state.name,quick:true});status('Connected to public FFA.','ok');$('room-id').textContent='PUBLIC FFA';$('room-id-side').textContent='FFA';invite()});conn.on('data',m=>{if(m.type==='welcome'){state.selfSpawnIndex=m.spawnIndex??1;state.mode='ffa';state.map='dustline'} if(m.type==='roster'){state.mode='ffa';state.map='dustline';for(const p of m.players||[]){if(p.id===state.playerId){state.selfSpawnIndex=p.spawnIndex??state.selfSpawnIndex;continue}if(p.id===id){state.peers.set(id,{conn,name:p.name||'Host',spawnIndex:0,team:0});continue}state.peers.set(p.id,{conn:null,name:p.name,spawnIndex:p.spawnIndex,team:p.team})}render()} if(m.type==='chat')append(m.name||'SYSTEM',m.text||'');if(m.type==='state')state.onNetwork?.(m);if(m.type==='start')openGame(m.players||[]);if(m.type==='combat')state.onCombat?.(m);if(m.type==='full')status('Public match is full. Try Quick Play again.','error')});conn.on('close',()=>status('Public host left. Try Quick Play again.','error'))});peer.on('error',e=>{if(e.type==='unavailable-id'){peer.destroy();state.peers.clear();const hostPeer=new Peer(id);state.peer=hostPeer;state.host=true;state.roomId=id;state.playerId=id;state.selfSpawnIndex=0;hostPeer.on('open',()=>{status('You opened the public FFA lobby. Waiting for players…','ok');render();setTimeout(()=>{if(state.host&&!state.started&&state.peers.size>=1)start()},1200)});hostPeer.on('connection',addConnection);hostPeer.on('error',x=>status(`Public match error: ${x.type||'unknown'}`,'error'))}else status(`Quick Play error: ${e.type||'unknown'}`,'error')})}
function host(){state.mode='tdm';state.map=$('map-select')?.value||'dustline';const id=roomCode();const peer=new Peer(id);state.peer=peer;state.host=true;state.roomId=id;state.playerId=id;state.selfSpawnIndex=0;peer.on('open',()=>{$('room-id').textContent=id;$('room-id-side').textContent=id;invite();render();status('Room ready. Send the invite to your squad.','ok')});peer.on('connection',addConnection);peer.on('error',e=>status(`Peer error: ${e.type||'connection failed'}`,'error'))}
function join(room){room=room.trim().toUpperCase();if(!room)return status('Enter a Room ID first.','error');const peer=new Peer();state.peer=peer;state.host=false;state.roomId=room;status('Connecting to host…');peer.on('open',id=>{state.playerId=id;const conn=peer.connect(room,{reliable:true});state.peers.set(room,{conn,name:'Host',spawnIndex:0,team:0});conn.on('open',()=>{conn.send({type:'hello',name:state.name});status('Connected to host. Waiting for match start.','ok');$('room-id').textContent=room;$('room-id-side').textContent=room;invite()});conn.on('data',m=>{if(!m)return;if(m.type==='welcome'){state.selfSpawnIndex=m.spawnIndex??1;state.roomId=m.roomId||room;state.mode=m.mode||state.mode;state.map=m.map||state.map;state.peers.set(room,{conn,name:'Host',spawnIndex:0,team:0});invite()}
 if(m.type==='roster'){for(const p of m.players||[]){if(p.id===state.playerId){state.selfSpawnIndex=p.spawnIndex??state.selfSpawnIndex;continue}if(p.id===room){state.peers.set(room,{conn,name:p.name||'Host',spawnIndex:0,team:p.team??0});continue}const old=state.peers.get(p.id);state.peers.set(p.id,{conn:old?.conn||null,name:p.name,spawnIndex:p.spawnIndex,team:p.team})}state.mode=m.mode||state.mode;state.map=m.map||state.map;render()}
 if(m.type==='chat')append(m.name||'SYSTEM',m.text||'');if(m.type==='state')state.onNetwork?.(m);if(m.type==='start'){state.mode=m.mode||state.mode;state.map=m.map||state.map;openGame(m.players||[])}if(m.type==='combat')state.onCombat?.(m);if(m.type==='full')status('That room is full.','error')});conn.on('close',()=>status('Host disconnected.','error'))});peer.on('error',e=>status(`Connection error: ${e.type||'unknown'}`,'error'))}
export function sendNetwork(msg){
  if(state.host){
    if(msg?.type==='state'){const packet={type:'state',id:state.playerId,...msg.state};sendAll(packet);state.onNetwork?.(packet);return true}
    if(msg?.type==='shot'){state.onCombat?.({type:'shot',shooter:state.playerId,origin:msg.origin,dir:msg.dir});return true}
    if(msg?.type==='damage'||msg?.type==='kill'){sendAll({type:'combat',...msg});state.onCombat?.(msg);return true}
    return sendHost(msg)
  }
  return sendHost(msg)
}
export function initLobby({onStart,onNetwork,onCombat}={}){state.onStart=onStart;state.onNetwork=onNetwork;state.onCombat=onCombat;setupChat();$('player-name').value=state.name;$('player-name').onchange=()=>{state.name=$('player-name').value.trim().slice(0,18)||'Operator';localStorage.setItem('northline-name',state.name)};$('quick-play').onclick=quickPlay;$('create-room').onclick=()=>{state.name=$('player-name').value.trim().slice(0,18)||'Operator';localStorage.setItem('northline-name',state.name);$('join-panel').classList.add('hidden');$('create-panel').classList.remove('hidden');host()};$('join-room').onclick=()=>join($('room-input').value||new URL(location.href).searchParams.get('room')||'');$('room-input').onkeydown=e=>{if(e.key==='Enter')$('join-room').click()};$('copy-invite').onclick=copy;$('start-match').onclick=start;$('mode-select').onchange=e=>{if(state.host){state.mode='tdm';e.target.value='tdm';roster()}};$('map-select').onchange=e=>{if(state.host){state.map=e.target.value;roster()}};const r=new URL(location.href).searchParams.get('room');if(r)$('room-input').value=r.toUpperCase();render()}
export function getLocalName(){return state.name}
export function getLocalId(){return state.playerId}
export function isHost(){return state.host}

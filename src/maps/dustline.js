import * as THREE from 'three';
import {Batcher,boxGeo,ensureColor,addSky,addSun} from '../engine.js';

// Original desert three-lane arena inspired by classic competitive FPS readability.
// It is intentionally not a copy of Dust II: different proportions, routes and cover.
export function buildDustline(scene,world,M){
  const HX=44,HZ=34; world.setBounds(HX,HZ); const sunDir=addSun(scene,HX,HZ); addSky(scene,sunDir);
  const solids=[], B=new Batcher(24);
  const add=(w,h,d,x,y,z,mat=M.sandstone,tile=2.5,col=true)=>{B.add(boxGeo(w,h,d,x,y,z,tile,true),mat,x,z); if(col)world.addBox(x-w/2,y,z-d/2,x+w/2,y+h,z+d/2)};
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(HX*2+4,HZ*2+4).rotateX(-Math.PI/2),M.sand); ground.receiveShadow=true; scene.add(ground); solids.push(ground);
  // perimeter
  add(HX*2,6,1,0,0,-HZ,M.sandstone,2,false); add(HX*2,6,1,0,0,HZ,M.sandstone,2,false);
  add(1,6,HZ*2,-HX,0,0,M.sandstone,2,false); add(1,6,HZ*2,HX,0,0,M.sandstone,2,false);
  // Three readable lanes: Long / Mid / Tunnels, with cross-links and a central courtyard.
  // Long lane walls
  add(18,4,1,-28,0,-17,M.sandstone,1.4); add(1,4,13,-19,0,-10,M.sandstone,1.4);
  add(11,4,1,-31,0,-5,M.sandstone,1.4); add(1,4,10,-36,0,0,M.sandstone,1.4);
  // B / tunnel complex
  add(1,4,16,19,0,10,M.sandstone,1.4); add(14,4,1,27,0,19,M.sandstone,1.4);
  add(1,4,11,34,0,10,M.sandstone,1.4); add(12,4,1,27,0,3,M.sandstone,1.4);
  // central mid structures and arches
  add(12,3.2,1,-6,0,-8,M.sandstone,1.4); add(12,3.2,1,6,0,8,M.sandstone,1.4);
  add(1,3.2,9,-12,0,-3,M.sandstone,1.4); add(1,3.2,9,12,0,3,M.sandstone,1.4);
  add(6,2.6,1,0,0,-16,M.sandstone,1.2); add(6,2.6,1,0,0,16,M.sandstone,1.2);
  // raised short/catwalk style route
  add(13,1.0,4,9,0,-12,M.stone,1.5); add(4,1.0,12,17,0,-6,M.stone,1.5);
  add(13,1.0,4,-9,0,12,M.stone,1.5); add(4,1.0,12,-17,0,6,M.stone,1.5);
  // ramps into the raised routes
  const ramp=(cx,cz,len,wid,h,dx,dz)=>{const s=new THREE.Shape();s.moveTo(-len/2,0);s.lineTo(len/2,0);s.lineTo(len/2,h);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:wid,bevelEnabled:false});g.translate(0,0,-wid/2);const yaw=Math.atan2(dx,dz);g.rotateY(yaw);g.translate(cx,0,cz);B.add(g,M.stone,cx,cz);world.addRamp(cx,cz,len,wid,h,dx,dz)};
  ramp(1,-12,6,4,1,0,1); ramp(-1,12,6,4,1,0,-1);
  // site-like courtyards as TDM landmarks
  add(8,1.1,7,-29,0,15,M.stone,1.4); add(8,1.1,7,29,0,-15,M.stone,1.4);
  add(3,2.1,3,-29,1.1,15,M.wood,1); add(3,2.1,3,29,1.1,-15,M.wood,1);
  // cover crates, barrels and low walls
  const crates=[[-35,-16,2,1.4],[-31,-11,1.5,1.5],[-25,-4,2,1.2],[-18,-18,1.8,1.2],[-12,-13,1.4,1.4],[-4,-4,2,1.2],[4,4,2,1.2],[14,14,1.8,1.3],[22,9,1.5,1.5],[30,4,2,1.3],[36,15,1.7,1.4],[24,-20,2,1.2],[8,-20,1.5,1.5],[-8,20,2,1.2]];
  for(const [x,z,w,d] of crates) add(w,1.6,d,x,0,z,M.wood,1);
  const barrels=[[-22,-9],[-20,-9],[20,12],[22,12],[34,-7],[-34,8],[0,-2],[0,2],[15,-18],[-15,18]];
  for(const [x,z] of barrels){add(.72,.9,.72,x,0,z,M.barrel,1);}
  // lamps / desert dressing
  for(const [x,z] of [[-40,-27],[-40,27],[40,-27],[40,27],[-14,0],[14,0],[0,-27],[0,27]]){add(.16,6,.16,x,0,z,M.steel,1);add(.8,.1,.8,x,6,z,M.lamp,1,false)}
  for(const x of [-38,-30,-22,-14,-6,2,10,18,26,34]) add(2,.025,.12,x,0,0,M.paint,1,false);
  B.build(scene,solids);
  return {name:'Dustline',solids,sunDir,spawns:[[-39,0,-22,Math.PI/4],[-39,0,22,-Math.PI/4],[39,0,-22,3*Math.PI/4],[39,0,22,-3*Math.PI/4],[-22,0,29,0],[22,0,-29,Math.PI]]};
}

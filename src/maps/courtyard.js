import * as THREE from 'three';
import {Batcher,boxGeo,ensureColor,addSky,addSun} from '../engine.js';
export function buildCourtyard(scene,world,M){
  const HX=38,HZ=28;world.setBounds(HX,HZ);const sunDir=addSun(scene,HX,HZ);addSky(scene,sunDir);const solids=[],B=new Batcher(24);
  const add=(w,h,d,x,y,z,mat=M.sandstone,tile=2,col=true)=>{B.add(boxGeo(w,h,d,x,y,z,tile,true),mat,x,z);if(col)world.addBox(x-w/2,y,z-d/2,x+w/2,y+h,z+d/2)};
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(HX*2+4,HZ*2+4).rotateX(-Math.PI/2),M.sand);ground.receiveShadow=true;scene.add(ground);solids.push(ground);
  add(HX*2,5,1,0,0,-HZ,M.sandstone,2,false);add(HX*2,5,1,0,0,HZ,M.sandstone,2,false);add(1,5,HZ*2,-HX,0,0,M.sandstone,2,false);add(1,5,HZ*2,HX,0,0,M.sandstone,2,false);
  // four corner towers and broken inner walls
  for(const [x,z] of [[-29,-20],[-29,20],[29,-20],[29,20]]){add(5,7,5,x,0,z,M.sandstone,1);add(6,.5,6,x,7,z,M.sand,1,false)}
  add(16,4,1,-18,0,-8,M.sandstone,1);add(16,4,1,18,0,8,M.sandstone,1);add(1,4,12,-10,0,12,M.sandstone,1);add(1,4,12,10,0,-12,M.sandstone,1);
  // central fountain
  add(8,.5,8,0,0,0,M.stone,1);add(5,1.2,5,0,.5,0,M.stone,1);add(2,.5,2,0,1.7,0,M.water,1);
  // pillars / crates
  for(const [x,z] of [[-6,-17],[6,-17],[-6,17],[6,17],[-25,0],[25,0]]){add(1.5,4,1.5,x,0,z,M.sandstone,1)}
  for(const [x,z] of [[-17,-17],[-15,-17],[15,17],[17,17],[-24,8],[24,-8],[-8,8],[8,-8]])add(2,1.4,2,x,0,z,M.wood,1);
  // arch-like cover blocks
  add(10,2,3,-20,4,-8,M.sandstone,1);add(10,2,3,20,4,8,M.sandstone,1);
  B.build(scene,solids);
  return {name:'Sandstone Courtyard',solids,sunDir,spawns:[[-32,-20,0,0.45],[32,20,Math.PI,0.45],[-32,20,0,0.45],[32,-20,Math.PI,0.45]]};
}

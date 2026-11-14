import * as THREE from 'three';
import type { GameState } from '../simulation';
import { ENEMIES, FLOORS } from '../data/game';
import { assetUrl } from '../assets';

const TILE = 3.4;
const EXPLORATION_EYE_OFFSET = 1.35;
const nearest = (texture: THREE.Texture) => { texture.magFilter = THREE.NearestFilter; texture.minFilter = THREE.NearestFilter; texture.colorSpace = THREE.SRGBColorSpace; return texture; };

/** Small hand-built pixel silhouettes; deliberately shares a limited old-brass palette. */
function enemyTexture(art: string): THREE.Texture {
  if (art === 'whiteKnight') return nearest(new THREE.TextureLoader().load(assetUrl('teki.png')));
  const c = document.createElement('canvas'); c.width = 96; c.height = 112;
  const g = c.getContext('2d')!; g.imageSmoothingEnabled = false;
  const box = (x:number,y:number,w:number,h:number,color:string) => { g.fillStyle=color; g.fillRect(x,y,w,h); };
  const polygon = (points:number[],color:string) => { g.fillStyle=color; g.beginPath(); for(let i=0;i<points.length;i+=2) i ? g.lineTo(points[i],points[i+1]) : g.moveTo(points[i],points[i+1]); g.closePath(); g.fill(); };
  const gold='#b99454', light='#e7d4a0', dark='#34313b', teal='#82b7ae', red='#c86f42';
  if(art==='rat') {
    polygon([9,82,18,63,46,57,68,68,83,86,71,94,23,95],dark); box(24,62,38,21,'#746653'); box(14,55,11,17,gold); box(27,51,10,14,gold); box(18,71,4,4,red); box(20,91,9,9,light);box(63,90,10,8,light); polygon([74,85,90,74,92,55,86,77],gold);
  } else if(art==='ember'||art==='warden1') {
    polygon([48,8,63,36,60,21,80,58,73,87,52,103,23,87,16,62,34,35,32,57],red);polygon([47,30,62,60,59,81,45,93,32,77,34,61],gold);box(37,61,7,5,dark);box(54,61,7,5,dark);box(43,78,13,4,light);
    if(art==='warden1'){box(8,45,12,48,dark);box(77,45,12,48,dark);box(2,47,24,7,gold);box(71,47,24,7,gold);}
  } else if(art==='wisp'||art==='warden2') {
    polygon([48,12,67,35,65,66,80,99,50,90,24,104,31,66,28,36],teal);polygon([48,24,58,42,56,62,39,62,37,43],dark);box(40,43,5,5,light);box(53,43,5,5,light);polygon([9,47,26,41,29,76,10,82],gold);polygon([69,41,89,48,85,84,68,77],light);box(15,52,8,3,dark);box(75,58,8,3,dark);
  } else if(art==='sentinel'||art==='gargoyle') {
    if(art==='gargoyle'){polygon([39,42,3,19,8,73,32,65],dark);polygon([58,42,93,19,89,74,64,65],dark);polygon([11,27,30,49,16,61],gold);polygon([85,27,65,49,81,62],gold);}
    box(31,21,35,27,'#8b8571');box(25,49,48,39,'#655e51');box(16,50,12,36,gold);box(70,50,11,36,gold);box(30,86,15,17,dark);box(55,86,15,17,dark);box(35,31,27,8,dark);box(39,34,5,3,teal);box(53,34,5,3,teal);box(35,54,30,5,gold);
  } else {
    const king=art==='king'; polygon([48,12,65,28,64,52,78,99,50,92,20,101,32,51,31,28],dark);polygon([48,21,59,31,57,49,39,49,37,31],'#a4aaa2');box(39,33,6,4,teal);box(52,33,6,4,teal);polygon([32,52,48,65,64,52,70,91,48,101,26,92],king?gold:'#706b7c');box(15,31,4,71,gold);box(9,30,16,6,light);box(44,64,8,24,light);box(37,73,23,6,light);
    if(king){polygon([30,25,27,7,40,17,47,1,55,17,69,7,66,25],gold);box(35,20,26,6,light);box(47,16,5,5,red);}
  }
  return nearest(new THREE.CanvasTexture(c));
}

export class DungeonView {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(64, 1, .08, 60);
  world = new THREE.Group();
  enemy: THREE.Sprite | null = null;
  private enemyY=1.42;
  private textures = new Map<string, THREE.Texture>();
  private floorKey='';
  private target = new THREE.Vector3();
  private start = new THREE.Vector3();
  private yaw=0; private targetYaw=0; private startYaw=0;
  private startTime=0;
  private lost=false; private reduced=false; private last=0; private active=false;
  private light: THREE.PointLight;
  private observer: ResizeObserver;
  private frame=0;
  constructor(private host: HTMLElement, private onStatus:(text:string)=>void) {
    this.renderer = new THREE.WebGLRenderer({antialias:false, alpha:false, powerPreference:'low-power'});
    this.renderer.setPixelRatio(1); this.renderer.setClearColor('#161310');
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    host.append(this.renderer.domElement); this.renderer.domElement.setAttribute('aria-label','古都の三次元迷宮');
    this.scene.fog=new THREE.FogExp2('#211a14', .045);
    this.scene.add(new THREE.AmbientLight('#c9b899',1.25));
    const hemi=new THREE.HemisphereLight('#8e9ca3','#44301e',1.1);this.scene.add(hemi);
    this.light = new THREE.PointLight('#ffc486',30,14,1.4);this.scene.add(this.light);
    this.scene.add(this.world);
    this.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();this.lost=true;this.onStatus('描画を一時停止しています。グラフィックの復旧を待っています。');});
    this.renderer.domElement.addEventListener('webglcontextrestored',()=>{this.lost=false;this.onStatus('迷宮の描画が復旧しました。');});
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(host);this.resize();
    this.loadWall(); this.animate(0);
  }
  private wallTexture:THREE.Texture|undefined;
  private loadWall(){
    const img=new Image();img.onload=()=>{
      const c=document.createElement('canvas');c.width=84;c.height=96;
      c.getContext('2d')!.drawImage(img,78,500,84,96,0,0,84,96);
      this.wallTexture=nearest(new THREE.CanvasTexture(c)); this.wallTexture.wrapS=this.wallTexture.wrapT=THREE.RepeatWrapping;
      this.floorKey=''; if(this.lastState)this.sync(this.lastState,true);
    };img.src=assetUrl('wall.png');
  }
  private lastState:GameState|undefined;
  private resize(){const w=Math.max(1,this.host.clientWidth),h=Math.max(1,this.host.clientHeight),scale=Math.min(.64,800/w,500/h);this.renderer.setSize(Math.max(1,Math.round(w*scale)),Math.max(1,Math.round(h*scale)),false);this.camera.aspect=w/h;this.updateProjection();this.sizeEnemy();}
  private updateProjection(){this.camera.fov=this.lastState?.phase==='explore'?THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(50))/this.camera.aspect)):Math.max(64,Math.min(105,THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(27.5))/this.camera.aspect))));this.camera.updateProjectionMatrix();}
  private sizeEnemy(){if(!this.enemy)return;const projectionScale=Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2))/Math.tan(THREE.MathUtils.degToRad(32)),width=Math.min(1.3,this.camera.aspect*1.8)*projectionScale;this.enemy.scale.set(width,width*1.17,1);this.enemyY=this.camera.aspect<1?1.15:1.42;this.enemy.position.y=this.enemyY;}
  private disposeWorld(){const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();this.world.traverse(o=>{if(o instanceof THREE.Mesh){geometries.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));}});geometries.forEach(g=>g.dispose());materials.forEach(m=>{const map=(m as THREE.MeshStandardMaterial).map;if(map&&map!==this.wallTexture)map.dispose();m.dispose();});this.world.clear();}
  private build(s:GameState){
    this.disposeWorld(); const f=s.floors[s.floor], n=f.size;
    const wall=new THREE.MeshStandardMaterial({color:'#b7a48a',map:this.wallTexture,roughness:1});
    const stone=new THREE.MeshStandardMaterial({color:'#71634e',roughness:1});
    const trim=new THREE.MeshStandardMaterial({color:'#463c30',roughness:1});
    const brass=new THREE.MeshStandardMaterial({color:'#bc9650',metalness:.4,roughness:.7});
    const add=(geo:THREE.BufferGeometry,mat:THREE.Material,x:number,y:number,z:number)=>{const mesh=new THREE.Mesh(geo,mat);mesh.position.set(x,y,z);this.world.add(mesh);return mesh;};
    const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const ctx=canvas.getContext('2d')!;
    ctx.fillStyle='#544c3e';ctx.fillRect(0,0,64,64);ctx.fillStyle='#655c4c';ctx.fillRect(1,1,30,30);ctx.fillRect(33,33,30,30);ctx.strokeStyle='#39352e';ctx.lineWidth=2;ctx.strokeRect(0,0,32,32);ctx.strokeRect(32,32,32,32);
    for(let i=0;i<120;i++){ctx.fillStyle=i%2?'#776b56':'#443d34';ctx.fillRect((i*13)%64,(i*29)%64,1,1);}
    const floorTex=nearest(new THREE.CanvasTexture(canvas));floorTex.wrapS=floorTex.wrapT=THREE.RepeatWrapping;floorTex.repeat.set(n,n);
    const floorMat=new THREE.MeshStandardMaterial({map:floorTex,roughness:1});
    add(new THREE.BoxGeometry(n*TILE,.12,n*TILE),floorMat,(n-1)*TILE/2,-.08,(n-1)*TILE/2);
    add(new THREE.BoxGeometry(n*TILE,.2,n*TILE),new THREE.MeshStandardMaterial({color:'#302d28',roughness:1}),(n-1)*TILE/2,3.2,(n-1)*TILE/2);
    const wallGeo=new THREE.BoxGeometry(TILE,3.2,.18);
    const doorwayStone=new THREE.MeshStandardMaterial({color:'#625b4e',roughness:1}),doorwayPosts=new Set<string>();
    const makeOpening=(x:number,z:number,vertical:boolean)=>{
      for(const offset of [-TILE/2,TILE/2]){const px=x+(vertical?0:offset),pz=z+(vertical?offset:0),key=`${px.toFixed(3)}:${pz.toFixed(3)}`;if(!doorwayPosts.has(key)){doorwayPosts.add(key);add(new THREE.BoxGeometry(.20,3.08,.20),doorwayStone,px,1.54,pz);}}
      const lintel=add(new THREE.BoxGeometry(TILE,.12,.20),doorwayStone,x,3.02,z),sill=add(new THREE.BoxGeometry(TILE,.035,.24),doorwayStone,x,.005,z);
      if(vertical){lintel.rotation.y=Math.PI/2;sill.rotation.y=Math.PI/2;}
    };
    const makeWall=(x:number,z:number,vertical:boolean,decor:boolean)=>{
      const m=add(wallGeo,wall,x,1.6,z);if(vertical)m.rotation.y=Math.PI/2;
      const base=add(new THREE.BoxGeometry(TILE,.22,.23),trim,x,.12,z);if(vertical)base.rotation.y=Math.PI/2;
      const top=add(new THREE.BoxGeometry(TILE,.22,.26),stone,x,2.97,z);if(vertical)top.rotation.y=Math.PI/2;
      if(decor){
        const offset=vertical?.19:0, dz=vertical?0:.19;
        add(new THREE.BoxGeometry(.14,.55,.16),brass,x+offset,1.8,z+dz);
        const flame=add(new THREE.OctahedronGeometry(.13,0),new THREE.MeshBasicMaterial({color:'#ffce75'}),x+offset,2.17,z+dz);flame.scale.y=1.8;
        const glow=new THREE.PointLight('#e8a04b',3,4,2);glow.position.set(x+offset,2.2,z+dz);this.world.add(glow);
      }
    };
    f.cells.forEach((cell,i)=>{const x=(i%n)*TILE,z=Math.floor(i/n)*TILE;
      if(cell.walls&1)makeWall(x,z-TILE/2,false,i%7===0);
      if(cell.walls&8)makeWall(x-TILE/2,z,true,i%11===0);
      if(i>=n*(n-1)&&(cell.walls&4))makeWall(x,z+TILE/2,false,false);
      if(i%n===n-1&&(cell.walls&2))makeWall(x+TILE/2,z,true,false);
      if(!(cell.walls&1))makeOpening(x,z-TILE/2,false);
      if(!(cell.walls&8))makeOpening(x-TILE/2,z,true);
    });
    const coords=(id:number)=>[(id%n)*TILE,Math.floor(id/n)*TILE];
    for(const [id,up] of [[f.entrance,true],[f.exit,false]] as const){
      const [x,z]=coords(id),stairs=new THREE.Group();stairs.position.set(x,0,z);
      // Keep stairs against a closed wall, out of the arrival passage and away
      // from the camera. The old centre-cell brass uprights filled the viewport.
      const closed=[0,3,2,1].find(d=>f.cells[id].walls&(1<<d))??0;
      stairs.rotation.y=(2-closed)*Math.PI/2;
      const stairPart=(geo:THREE.BufferGeometry,mat:THREE.Material,px:number,py:number,pz:number)=>{const m=add(geo,mat,px,py,pz);this.world.remove(m);stairs.add(m);};
      for(let j=0;j<5;j++)stairPart(new THREE.BoxGeometry(1.5,.12*(j+1),.20),stone,0,.06*(j+1),.52+j*.2);
      const stairTrim=new THREE.MeshStandardMaterial({color:'#776348',metalness:.2,roughness:.85});
      for(const px of [-.88,.88])stairPart(new THREE.BoxGeometry(.09,2.18,.12),stairTrim,px,1.09,1.51);
      stairPart(new THREE.BoxGeometry(1.85,.12,.12),stairTrim,0,2.18,1.51);
      if(!up&&!f.bossDefeated)stairPart(new THREE.TorusGeometry(.43,.026,4,16),new THREE.MeshBasicMaterial({color:'#a68a59'}),0,1.48,1.43);
      this.world.add(stairs);
    }
    {const [x,z]=coords(f.chest);add(new THREE.BoxGeometry(1.1,.65,.7),new THREE.MeshStandardMaterial({color:'#6f4124'}),x,.33,z);add(new THREE.BoxGeometry(1.18,.1,.77),brass,x,f.chestOpened?.16:.68,z);add(new THREE.BoxGeometry(.17,.2,.08),brass,x,.48,z-.38);}
    {const [x,z]=coords(f.fountain);add(new THREE.CylinderGeometry(.85,.95,.38,8),stone,x,.19,z);add(new THREE.CylinderGeometry(.72,.72,.04,16),new THREE.MeshBasicMaterial({color:f.fountainUsed?'#394441':'#679f9b'}),x,.41,z);if(!f.fountainUsed){const l=new THREE.PointLight('#7bd9ce',7,4);l.position.set(x,1,z);this.world.add(l);add(new THREE.OctahedronGeometry(.2,0),new THREE.MeshBasicMaterial({color:'#b7e0cf'}),x,1.1,z);}}
  }
  sync(s:GameState,snap=false,reduced=this.reduced){
    // Resolve the previous motion at the current time before retargeting. A
    // delayed/paused animation frame must not leave the next move diagonal.
    this.advance(performance.now());
    this.lastState=s;this.reduced=reduced;this.updateProjection();
    const f=s.floors[s.floor],key=`${s.seed}:${s.floor}:${f.chestOpened}:${f.fountainUsed}:${f.bossDefeated}`;
    if(key!==this.floorKey){this.build(s);this.floorKey=key;snap=true;}
    const x=(s.position%f.size)*TILE,z=Math.floor(s.position/f.size)*TILE;
    const eyeOffset=s.phase==='explore'?EXPLORATION_EYE_OFFSET:0;
    this.start.copy(this.camera.position);this.target.set(x-[0,1,0,-1][s.direction]*eyeOffset,1.42,z-[-1,0,1,0][s.direction]*eyeOffset);this.startYaw=this.yaw;
    let desired=-s.direction*Math.PI/2;
    while(desired-this.yaw>Math.PI)desired-=Math.PI*2;while(desired-this.yaw< -Math.PI)desired+=Math.PI*2;
    this.targetYaw=desired;this.startTime=performance.now();
    if(snap||reduced){this.camera.position.copy(this.target);this.start.copy(this.target);this.yaw=this.targetYaw;this.startYaw=this.targetYaw;this.camera.rotation.set(0,this.yaw,0);}
    if(this.enemy){this.scene.remove(this.enemy);this.enemy.material.dispose();this.enemy=null;}
    if(s.battle && (s.phase==='battle'||s.phase==='defeated')){
      const art=ENEMIES[s.battle.enemyId].art;let tex=this.textures.get(art);if(!tex){tex=enemyTexture(art);this.textures.set(art,tex);}
      this.enemy=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false, fog:false}));
      const d=s.direction, dx=[0,1,0,-1][d],dz=[-1,0,1,0][d];this.enemy.position.set(x+dx*3,1.42,z+dz*3);this.sizeEnemy();this.enemy.renderOrder=5;this.scene.add(this.enemy);
    }
  }
  setActive(active:boolean){this.active=active;}
  private advance(time:number){
    const progress=this.reduced?1:THREE.MathUtils.clamp((time-this.startTime)/145,0,1),t=progress*progress*(3-2*progress);
    this.camera.position.lerpVectors(this.start,this.target,t);this.yaw=this.startYaw+(this.targetYaw-this.startYaw)*t;this.camera.rotation.set(0,this.yaw,0);
  }
  private animate=(time:number)=>{this.frame=requestAnimationFrame(this.animate);if(document.hidden||this.lost||!this.active)return;
    this.advance(time);this.light.position.copy(this.camera.position);this.light.position.y=2;
    if(this.enemy&&!this.reduced)this.enemy.position.y=this.enemyY+Math.sin(time*.0025)*.025;
    if(time-this.last>30){this.renderer.render(this.scene,this.camera);this.last=time;}
  };
  dispose(){cancelAnimationFrame(this.frame);this.observer.disconnect();this.disposeWorld();this.textures.forEach(t=>t.dispose());this.wallTexture?.dispose();this.renderer.dispose();}
}

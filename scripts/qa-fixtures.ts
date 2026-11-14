/** Representative browser QA states, reached through ordinary simulation commands. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { createGame, dispatch, accessibleNeighbors, neighbor, getStats, getActionAvailability, getAffinityMultiplier, serializeGame, type GameState, type Action, type Direction } from '../src/simulation';
import { ENEMIES, SKILLS, type SkillId } from '../src/data/game';
let s=createGame(2007,'flame');
const apply=(a:Action)=>{const r=dispatch(s,a);if(!r.ok)throw Error(r.message);s=r.state;};
const fixtures:Record<string,string>={};
const save=(name:string)=>fixtures[name]=serializeGame(s);
function fight(){for(let i=0;s.phase==='battle'&&i<200;i++){
 const b=s.battle!,stats=getStats(s);
 if(b.intent==='heavy')apply({type:'defend'});
 else if(s.player.hp<stats.maxHp*.55&&getActionAvailability(s,{type:'skill',skill:'holy'}).enabled)apply({type:'skill',skill:'holy'});
 else if(s.player.hp<stats.maxHp*.5&&s.player.inventory.potion)apply({type:'item',item:'potion'});
 else{const skill=s.player.skills.filter(id=>SKILLS[id].kind!=='heal'&&s.player.mp>=SKILLS[id].mp).sort((a,b)=>getAffinityMultiplier(b,ENEMIES[s.battle!.enemyId].affinity)-getAffinityMultiplier(a,ENEMIES[s.battle!.enemyId].affinity))[0];apply(skill?{type:'skill',skill}:{type:'attack'});}
 }if(s.phase==='defeated')throw Error('fixture autoplay defeated');}
function walk(target:number){const f=s.floors[s.floor],parent=new Map([[s.position,-1]]),q=[s.position];for(let i=0;i<q.length&&!parent.has(target);i++)for(const n of accessibleNeighbors(f,q[i]))if(!parent.has(n)){parent.set(n,q[i]);q.push(n);}const route:number[]=[];let c=target;while(c!==s.position){route.unshift(c);c=parent.get(c)!;}for(const next of route){const dir=([0,1,2,3] as Direction[]).find(d=>neighbor(s.position,d,f.size)===next)!;while(s.direction!==dir)apply({type:'turn',delta:1});apply({type:'move'});if(s.phase==='battle')fight();}}
apply({type:'enter'});save('entrance');
for(let floor=0;floor<5;floor++){
 const f=s.floors[floor];walk(f.chest);if(floor===0)save('chest');apply({type:'interact'});walk(f.fountain);if(floor===0)save('fountain');apply({type:'interact'});walk(f.exit);
 const skill=(['water','earth','fire','wind','dark'] as SkillId[])[floor];if(!s.player.skills.includes(skill)){for(const id of [...s.player.skills])if(id!=='holy')apply({type:'forget',skill:id});apply({type:'memorize',skill});}
 if(s.player.mp<7&&s.player.inventory.ether)apply({type:'item',item:'ether'});
 save(`before-boss-${floor+1}`);apply({type:'interact'});save(`boss-${floor+1}`);fight();if(floor<4)apply({type:'interact'});
}
save('ending');mkdirSync('artifacts',{recursive:true});writeFileSync('artifacts/qa-fixtures.json',JSON.stringify(fixtures,null,2));console.log(Object.keys(fixtures).join(', '));

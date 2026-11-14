/** Independent full run. All mutations are real button/keyboard input.
 * Saved state is read only. On B1, discard all unvisited walls/event locations
 * before selecting a route; frontier search sees exactly explored-map walls.
 */
const {chromium}=require('playwright-core');
const fs=require('node:fs'),assert=require('node:assert/strict');
const base=process.env.QA_URL||'http://127.0.0.1:5173/';
const report={started:new Date().toISOString(),url:base,method:'Ordinary DOM clicks/keyboard only; no test API, fixtures, save writes or seed override. B1 routes use only explored cells and their walls.',checks:[],events:[],actions:[],errors:[],httpFailures:[],requestCancellations:[]};
let page,browser;
const rawState=()=>page.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('ancient-kingdom.save.v1')).payload));
async function state(){const s=await rawState();if(s.floor===0){const f=s.floors[0];for(const c of f.cells)if(!c.explored)c.walls=null;for(const key of ['chest','fountain','exit'])if(!f.cells[f[key]].explored)f[key]=null;}return s;}
const check=s=>{report.checks.push(s);console.log(s);};
const button=a=>page.locator(`button[data-action='${JSON.stringify(a)}']:visible`).first();
async function click(a){await button(a).click();report.actions.push(a);await page.waitForTimeout(['move','turn'].includes(a.type)?155:35);}
async function shot(name){await page.waitForTimeout(180);await page.screenshot({path:`artifacts/full-${name}.png`});}
async function panel(key){await page.keyboard.press(key);await page.locator('dialog').waitFor({state:'visible'});assert(await page.evaluate(()=>document.querySelector('dialog').contains(document.activeElement)));}
async function close(){if(await page.locator('dialog').isVisible())await page.keyboard.press('Escape');}
async function skill(id){await page.locator('[data-ui="skills"]:visible').click();await click({type:'skill',skill:id});}
async function item(id){const s=await state();if(s.phase!=='battle')await panel('i');await click({type:'item',item:id});await close();}
const maxHp=s=>42+(s.player.level-1)*10,maxMp=s=>20+(s.player.level-1)*4;
async function memorize(id){let s=await state();if(s.player.skills.includes(id))return;await panel('k');for(const known of s.player.skills)if(known!=='holy')await click({type:'forget',skill:known});await click({type:'memorize',skill:id});await close();}
let reloaded=false,potion=false,ether=false,fled=false;
const mpCost={fire:3,water:3,earth:3,wind:3,dark:4};
async function fight(){
 let s=await state();if(s.phase!=='battle')return;
 const enemy=await page.locator('.enemy-info').innerText();report.events.push({kind:'battle',floor:s.floor+1,enemy,stats:s.stats});console.log(`B${s.floor+1}: battle ${s.stats.battles}, steps ${s.stats.steps}, ${s.battle.enemyId}`);
 if(!reloaded){await shot('battle-desktop');const before=await rawState();await page.reload();await page.locator('[data-ui="continue"]').click();assert.deepEqual(await rawState(),before);check('Battle saved/reloaded through title Continue');reloaded=true;}
 if(!fled&&!s.battle.boss&&s.stats.victories>0){await click({type:'flee'});fled=true;check('Normal enemy flee');return;}
 if(s.battle.enemyId==='whiteKnight'){
   await shot('white-knight-desktop');await page.setViewportSize({width:360,height:780});await shot('white-knight-mobile');assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)));await page.setViewportSize({width:1440,height:900});check('White knight full run desktop/mobile');
 }
 for(let i=0;i<180;i++){
  s=await state();if(s.phase!=='battle')break;
  // These are UI-visible HP/MP, current intent and remembered skill labels.
  const intent=await page.locator('.intent').innerText();
  if(!ether&&s.player.mp<=maxMp(s)-4&&s.player.inventory.ether){await item('ether');ether=true;}
  else if(intent.includes('大技'))await click({type:'defend'});
  else if(s.player.hp<maxHp(s)*.58&&s.player.mp>=4)await skill('holy');
  else if((s.player.hp<maxHp(s)*.5||(!potion&&s.player.hp<maxHp(s)-10))&&s.player.inventory.potion){await item('potion');potion=true;}
  else if(s.player.mp<6&&s.player.inventory.ether){await item('ether');ether=true;}
  else {const id=s.player.skills.find(id=>id!=='holy');if(id&&s.player.mp>=mpCost[id])await skill(id);else await click({type:'attack'});}
 }
 s=await state();assert.notEqual(s.phase,'defeated','UI strategy was defeated');assert.notEqual(s.phase,'battle','Battle exceeded turn bound');
}
function neighbors(f,id){const walls=f.cells[id].walls;if(walls===null)return [];return [id-f.size,id+1,id+f.size,id-1].filter((n,d)=>!(walls&(1<<d))&&n>=0&&n<f.cells.length);}
function route(f,start,predicate){const q=[start],parents=new Map([[start,null]]);for(let i=0;i<q.length;i++){const here=q[i];if(predicate(here)){const path=[];for(let n=here;parents.get(n)!==null;n=parents.get(n))path.unshift(n);return path;}for(const n of neighbors(f,here))if(!parents.has(n)){parents.set(n,here);q.push(n);}}throw Error('No route/frontier');}
async function step(next){let s=await state(),f=s.floors[s.floor];const d=[s.position-f.size,s.position+1,s.position+f.size,s.position-1].indexOf(next);assert(d>=0);while(s.direction!==d){await click({type:'turn',delta:1});s=await state();}await click({type:'move'});await fight();}
async function walk(target,feature){let s=await state();const path=route(s.floors[s.floor],s.position,n=>n===target);for(const next of path){if(feature&&next===target){s=await state();const f=s.floors[s.floor],d=[s.position-f.size,s.position+1,s.position+f.size,s.position-1].indexOf(next);while(s.direction!==d){await click({type:'turn',delta:1});s=await state();}await shot(feature);}await step(next);}}
async function recover(){const s=await state();if(s.phase!=='explore')return;if(s.player.hp<maxHp(s)*.65&&s.player.mp>=4){await panel('k');await click({type:'skill',skill:'holy'});await close();}else if(s.player.hp<maxHp(s)*.5&&s.player.inventory.potion)await item('potion');}
(async()=>{
 fs.mkdirSync('artifacts',{recursive:true});browser=await chromium.launch({headless:true,channel:'chrome'});const context=await browser.newContext({viewport:{width:1440,height:900}});page=await context.newPage();
 page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)report.httpFailures.push(`${r.status()} ${r.url()}`);});page.on('requestfailed',r=>{const reason=r.failure()?.errorText;(reason==='net::ERR_ABORTED'?report.requestCancellations:report.httpFailures).push(`${r.url()}: ${reason}`);});
 await page.goto(base);await shot('title');await page.locator('[data-ui="new"]').click();await page.locator('[data-origin="spring"]').click();check('Title → new → spring origin → camp');
 await click({type:'rest'});await memorize('water');check('Camp rest, origin affinity, forget/relearn water while preserving holy');await click({type:'enter'});await shot('entrance-desktop');
 await page.setViewportSize({width:360,height:780});await shot('entrance-mobile');assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)));await page.setViewportSize({width:780,height:360});await shot('landscape');assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)));await page.setViewportSize({width:1440,height:900});
 await panel('m');const before=await rawState();await page.keyboard.press('ArrowUp');assert.deepEqual(await rawState(),before);await shot('map');await close();await panel('i');await close();check('Map/items modal focus and movement gate; 360 portrait and 780 landscape');
 // B1 frontier BFS: unknown cells are terminals; their wall bits and events
 // are stripped in state(), so no undiscovered destination can be targeted.
 for(let i=0;i<180;i++){
  let s=await state(),f=s.floors[0];assert.equal(s.floor,0);
  const text=await page.locator('#context').innerText();
  if((text.includes('宝箱を開く')&&!f.chestOpened)||(text.includes('泉で全回復')&&!f.fountainUsed)){await shot(text.includes('宝箱')?'chest':'fountain');await click({type:'interact'});s=await state();f=s.floors[0];}
  if(f.chestOpened&&f.fountainUsed&&f.exit!==null)break;
  const path=route(f,s.position,n=>!f.cells[n].explored);for(const next of path)await step(next);
  if(i===4)await shot('corridor');if(i===12)await shot('junction');await recover();
 }
 let s=await state(),f=s.floors[0];assert(f.chestOpened&&f.fountainUsed&&f.exit!==null);check(`B1 fog-only frontier exploration: ${f.cells.filter(c=>c.explored).length}/${f.cells.length} cells; chest/fountain/guardian discovered`);
 await walk(f.exit,'stairs-approach');await recover();await shot('stairs');await click({type:'interact'});await fight();s=await state();assert.equal(s.seals,1);check('First royal seal');
 await item('thread');assert.equal((await state()).phase,'camp');await click({type:'rest'});await click({type:'upgrade'});await click({type:'buy',item:'ether'});await click({type:'buy',item:'potion'});check('Return thread → free rest → weapon upgrade → buy both medicines');
 await click({type:'enter'});s=await state();await walk(s.floors[0].exit);await click({type:'interact'});assert.equal((await state()).floor,1);await click({type:'interact'});assert.equal((await state()).floor,0);await click({type:'interact'});assert.equal((await state()).floor,1);check('Stairs down/up/down preserve cleared B1 and arrival passage');
 for(let floor=1;floor<5;floor++){
  await memorize(['water','earth','fire','wind','dark'][floor]);s=await state();f=s.floors[floor];
  await walk(f.chest);await click({type:'interact'});await walk(f.fountain,`b${floor+1}-fountain-approach`);await shot(`b${floor+1}-fountain`);await click({type:'interact'});await walk(f.exit);await recover();
  if((await state()).player.mp<8&&(await state()).player.inventory.ether)await item('ether');
  await click({type:'interact'});await fight();s=await state();report.events.push({kind:'floorCleared',floor:floor+1,stats:s.stats,level:s.player.level,seals:s.seals});check(`B${floor+1} guardian cleared; seals ${s.seals}`);if(floor<4)await click({type:'interact'});
 }
 s=await state();assert.equal(s.phase,'ending');assert.equal(s.cleared,true);assert.equal(s.seals,3);assert.equal(s.stats.treasures,5);await shot('ending-desktop');await page.setViewportSize({width:360,height:780});await shot('ending-mobile');await page.setViewportSize({width:1440,height:900});
 report.result={phase:s.phase,seed:s.seed,stats:s.stats,level:s.player.level,seals:s.seals,hp:s.player.hp,mp:s.player.mp};check('All five floors → three seals → white knight → king → ending, all 5 treasures');
 await click({type:'continue'});assert.equal((await state()).cleared,true);check('Ending Continue keeps completed adventure');
 report.medicine={potion,ether};assert(potion&&ether,'Both medicines must have been used via UI');assert.deepEqual(report.errors,[]);assert.deepEqual(report.httpFailures,[]);report.success=true;
})().catch(async e=>{report.success=false;report.error=String(e.stack||e);console.error(e);if(page){try{await shot('failure');report.lastState=await state();}catch{}}process.exitCode=1;}).finally(async()=>{report.finished=new Date().toISOString();fs.writeFileSync('artifacts/full-playthrough.json',JSON.stringify(report,null,2));if(browser)await browser.close();console.log(JSON.stringify({success:report.success,result:report.result,error:report.error,checks:report.checks.length},null,2));});

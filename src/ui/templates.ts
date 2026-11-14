import { getActionAvailability, type Action, type GameState } from '../simulation';
export const escapeHtml=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function actionButton(state:GameState,action:Action,label:string,className=''){
 const {enabled,reason}=getActionAvailability(state,action),key=JSON.stringify(action);
 return `<button class="${className}" data-action="${escapeHtml(key)}" data-focus="${escapeHtml(key)}" ${enabled?'':`disabled title="${escapeHtml(reason)}"`} aria-label="${escapeHtml(label.replace(/<[^>]*>/g,' '))}${!enabled?' — '+escapeHtml(reason):''}">${label}</button>${!enabled&&['buy','upgrade','memorize','forget','skill','item','flee'].includes(action.type)?`<span class="action-reason">${escapeHtml(reason)}</span>`:''}`;
}
export function mapMarkup(s:GameState){const f=s.floors[s.floor],n=f.size,size=360/n;
 let svg=`<svg class="dungeon-map" viewBox="-8 -8 376 376" role="img" aria-label="B${s.floor+1}の探索済み地図。現在地は${s.position%n+1}列${Math.floor(s.position/n)+1}行。"><rect x="-8" y="-8" width="376" height="376" fill="#191914"/>`;
 f.cells.forEach((c,i)=>{if(!c.explored)return;const x=i%n*size,y=Math.floor(i/n)*size;svg+=`<rect x="${x+1}" y="${y+1}" width="${size-2}" height="${size-2}" fill="${i===s.position?'#4b665e':'#34382f'}"/>`;
 const walls=[[x,y,x+size,y],[x+size,y,x+size,y+size],[x,y+size,x+size,y+size],[x,y,x,y+size]];walls.forEach(([x1,y1,x2,y2],d)=>{if(c.walls&(1<<d))svg+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#c1a673" stroke-width="3"/>`;});
 const mark=i===f.entrance?'↑':i===f.exit?(f.bossDefeated?'↓':'♜'):i===f.fountain?(f.fountainUsed?'·':'○'):i===f.chest?(f.chestOpened?'·':'◇'):'';
 if(mark&&i!==s.position)svg+=`<text x="${x+size/2}" y="${y+size*.7}" text-anchor="middle" font-size="${size*.5}" fill="#c7b88e">${mark}</text>`;
 });const x=(s.position%n+.5)*size,y=(Math.floor(s.position/n)+.5)*size;
 return svg+`<path d="M 0 ${-size*.3} L ${size*.22} ${size*.25} L 0 ${size*.14} L ${-size*.22} ${size*.25} Z" fill="#a6d9ca" transform="translate(${x} ${y}) rotate(${s.direction*90})"/></svg>`;
}

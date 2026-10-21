// Pure helpers and hand-written data for the skill games. No network, no fake stats.
export const TYPING_PASSAGES=[
'The library stays open late during exam week, and the quiet corner near the window fills up first.',
'A good plan for tonight is short: read ten pages, solve five problems, then sleep on time.',
'Small steps every day beat one giant effort the night before the test.',
'Water the plants, charge the lamp, and keep your notes in one folder before Monday.',
'The rocket climbed through the clouds while the ground crew counted down the final seconds.',
'Practice typing a little every day and your fingers will find the keys without looking.'];
export function typingResult(target,typed,ms){
  let correct=0;const n=Math.min(typed.length,target.length);
  for(let i=0;i<n;i++)if(typed[i]===target[i])correct++;
  const minutes=Math.max(ms,1)/60000;
  const wpm=Math.max(0,Math.round(correct/5/minutes));
  const accuracy=typed.length?Math.round(100*correct/typed.length):100;
  return{wpm,accuracy,correct,finished:typed.length>=target.length}}
export function rhythmGrade(offsetMs){
  const a=Math.abs(offsetMs);
  if(a<=90)return{name:'Perfect',points:100};
  if(a<=180)return{name:'Good',points:50};
  if(a<=280)return{name:'Close',points:20};
  return{name:'Miss',points:0}}
export function makePath(length,size=4){
  // Random walk that never revisits a cell. Retries until a full path exists.
  for(let tries=0;tries<60;tries++){
    const start=Math.floor(Math.random()*size*size),seen=new Set([start]),path=[start];
    while(path.length<length){
      const cur=path[path.length-1],x=cur%size,y=Math.floor(cur/size),next=[];
      for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){
        const nx=x+dx,ny=y+dy;
        if(nx>=0&&nx<size&&ny>=0&&ny<size&&!seen.has(ny*size+nx))next.push(ny*size+nx)}
      if(!next.length)break;
      const pick=next[Math.floor(Math.random()*next.length)];
      seen.add(pick);path.push(pick)}
    if(path.length===length)return path}
  // Guaranteed fallback: simple left-to-right rows.
  const flat=[];for(let i=0;i<length;i++)flat.push(i);return flat}
export function pathRound(round){return{size:4,length:Math.min(3+round,10)}}
export function makeOddGrid(round,rand=Math.random){
  const size=Math.min(3+Math.floor(round/4),6);
  const hue=Math.floor(rand()*360);
  const step=Math.max(26-round*2,7);
  const cells=size*size,index=Math.floor(rand()*cells);
  const base='hsl('+hue+', 45%, 52%)',odd='hsl('+hue+', 45%, '+(52+step)+'%)';
  return{size,index,base,odd,cells}}
export function oddScore(round,survived){return survived*100}

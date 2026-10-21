import{MOTION_GAMES}from'./game-catalogue.js';
// Original local game rules. Normalized coordinates, bounded physics steps.
export{ MOTION_GAMES }from'./game-catalogue.js';

const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function newMotion(kind){if(!MOTION_GAMES.some(g=>g.id===kind))throw Error('Unknown motion game');return{kind,time:0,score:0,lives:3,over:false,win:false,player:.5,bot:.5,ball:{x:.5,y:.5,vx:kind==='breaker'?.28:.36,vy:kind==='breaker'?-.43:.23},bricks:Array(24).fill(true),hits:0,you:0,them:0,serve:.6,bird:.46,velocity:0,gates:[],spawn:.8,seed:29,impulse:0};}
export function motionStep(state,dt,input={}){if(state.over)return state;dt=Number.isFinite(dt)?clamp(dt,0,.05):0;if(!dt)return state;let s={...state,ball:{...state.ball},bricks:[...state.bricks],gates:state.gates.map(g=>({...g}))};const n=Math.ceil(dt/.008);for(let i=0;i<n&&!s.over;i++)advance(s,dt/n,input,i===0);return s;}
function advance(s,dt,input,first){s.time+=dt;const direction=clamp(input.direction||0,-1,1);if(s.kind==='flap'){
if(first&&input.impulse!==s.impulse){s.impulse=input.impulse;if(Number.isFinite(input.impulse))s.velocity=-.48;}
s.velocity=Math.min(.95,s.velocity+1.2*dt);s.bird+=s.velocity*dt;s.spawn-=dt;
if(s.spawn<=0){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;s.gates.push({x:1.06,center:.25+(s.seed/4294967296)*.48,passed:false});s.spawn=1.7;}
for(const g of s.gates){g.x-=dt*(.23+Math.min(.09,s.time*.0008));if(g.x<.24&&!g.passed){g.passed=true;s.score+=100;}if(Math.abs(g.x-.27)<.067&&(s.bird-.024<g.center-.15||s.bird+.024>g.center+.15))s.over=true;}
s.gates=s.gates.filter(g=>g.x>-.1);if(s.bird<.03||s.bird>.97)s.over=true;if(s.over)s.lives=0;return;
}
const target=Number.isFinite(input.target)?clamp(input.target,.1,.9):null;s.player=target===null?clamp(s.player+direction*.85*dt,.11,.89):target;
if(s.kind==='pong'){
// The bot has capped travel speed and a neutral target while the ball moves away.
const targetBot=s.ball.vx>0?s.ball.y:.5;s.bot+=clamp(targetBot-s.bot,-.30*dt,.30*dt);s.bot=clamp(s.bot,.11,.89);
if(s.serve>0){s.serve-=dt;return;}
const b=s.ball,old=b.x;b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.y<.018){b.y=.018;b.vy=Math.abs(b.vy);}if(b.y>.982){b.y=.982;b.vy=-Math.abs(b.vy);}
if(b.vx<0&&old>=.075&&b.x<=.075&&Math.abs(b.y-s.player)<=.125){b.x=.075;b.vx=Math.min(.80,Math.abs(b.vx)*1.045);b.vy=(b.y-s.player)*4;if(Math.abs(b.vy)<.14)b.vy=b.vy<0?-.14:.14;s.hits++;}
if(b.vx>0&&old<=.925&&b.x>=.925&&Math.abs(b.y-s.bot)<=.125){b.x=.925;b.vx=-Math.min(.80,Math.abs(b.vx)*1.045);b.vy=(b.y-s.bot)*4;if(Math.abs(b.vy)<.14)b.vy=b.vy<0?-.14:.14;}
if(b.x<-.025||b.x>1.025){const won=b.x>1;s.you+=won?1:0;s.them+=won?0:1;s.score=s.you*200;s.over=s.you>=5||s.them>=5;s.win=s.you>=5;s.ball={x:.5,y:.5,vx:won?-.36:.36,vy:(s.you+s.them)%2?.23:-.23};s.serve=.65;}
}else{
if(s.serve>0){s.serve-=dt;s.ball.x=s.player;s.ball.y=.84;return;}
const b=s.ball,oy=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.x<.018){b.x=.018;b.vx=Math.abs(b.vx);}if(b.x>.982){b.x=.982;b.vx=-Math.abs(b.vx);}if(b.y<.018){b.y=.018;b.vy=Math.abs(b.vy);}
if(b.vy>0&&oy<=.872&&b.y>=.872&&Math.abs(b.x-s.player)<.137){b.y=.872;b.vy=-Math.max(.36,Math.abs(b.vy));b.vx=(b.x-s.player)*3.5;if(Math.abs(b.vx)<.12)b.vx=b.vx<0?-.12:.12;s.hits++;}
for(let j=0;j<24;j++)if(s.bricks[j]){const row=Math.floor(j/6),col=j%6,left=.055+col*.15,top=.12+row*.065;if(b.x+.015>left&&b.x-.015<left+.14&&b.y+.015>top&&b.y-.015<top+.047){s.bricks[j]=false;s.score+=50;if(oy<=top||oy>=top+.047)b.vy=-b.vy;else b.vx=-b.vx;break;}}
if(b.y>1.04){s.lives--;s.over=s.lives<=0;s.ball={x:s.player,y:.84,vx:(s.lives%2?.28:-.28),vy:-.43};s.serve=.8;}
if(s.bricks.every(v=>!v)){s.over=true;s.win=true;s.score+=s.lives*100;}
}
}

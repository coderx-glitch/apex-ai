// Original local boards. Small pure rules, no service calls.
export const STRATEGY_IDS=['reversi','nim','flood','wordsearch'];
export function reversiStart(){const b=Array(36).fill(0);b[14]=2;b[15]=1;b[20]=1;b[21]=2;return b}
const directions=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
export function reversiFlips(board,at,player){if(at<0||at>=36||board[at]||![1,2].includes(player))return[];const out=[],r=Math.floor(at/6),c=at%6;for(const[dr,dc]of directions){const run=[];let y=r+dr,x=c+dc;while(y>=0&&y<6&&x>=0&&x<6&&board[y*6+x]===3-player){run.push(y*6+x);y+=dr;x+=dc}if(run.length&&y>=0&&y<6&&x>=0&&x<6&&board[y*6+x]===player)out.push(...run)}return out}
export function reversiMoves(board,player){return board.flatMap((_,i)=>reversiFlips(board,i,player).length?[i]:[])}
export function reversiMove(board,at,player){const flips=reversiFlips(board,at,player);if(!flips.length)return null;const next=[...board];for(const i of[at,...flips])next[i]=player;return next}
export function reversiBot(board){return reversiMoves(board,2).sort((a,b)=>([0,5,30,35].includes(b)?20:0)+reversiFlips(board,b,2).length-([0,5,30,35].includes(a)?20:0)-reversiFlips(board,a,2).length)[0]??-1}
export function reversiTurn(board,at){let next=at<0&&reversiMoves(board,1).length===0?[...board]:reversiMove(board,at,1);if(!next)return null;let bot=0;while(reversiMoves(next,2).length){next=reversiMove(next,reversiBot(next),2);bot++;if(reversiMoves(next,1).length)break}return{board:next,botMoves:bot,done:!reversiMoves(next,1).length&&!reversiMoves(next,2).length,mustPass:!reversiMoves(next,1).length&&!!reversiMoves(next,2).length}}
export function nimMove(piles,pile,take){if(!Number.isInteger(pile)||pile<0||pile>=piles.length||!Number.isInteger(take)||take<1||take>piles[pile])return null;return piles.map((v,i)=>i===pile?v-take:v)}
export function nimBot(piles){const xor=piles.reduce((a,v)=>a^v,0);for(let i=0;i<piles.length;i++){const target=piles[i]^xor;if(target<piles[i])return{pile:i,take:piles[i]-target}}const pile=piles.findIndex(v=>v>0);return pile<0?null:{pile,take:1}}
export const FLOOD_COLORS=['Coral','Sky','Gold','Mint','Violet'];
export function floodStart(random=Math.random){return Array.from({length:36},()=>Math.floor(Math.max(0,Math.min(.999999,random()))*5))}
export function floodRegion(board){const seen=new Set([0]),queue=[0];while(queue.length){const i=queue.pop(),r=Math.floor(i/6),c=i%6;for(const[y,x]of[[r-1,c],[r+1,c],[r,c-1],[r,c+1]])if(y>=0&&y<6&&x>=0&&x<6&&!seen.has(y*6+x)&&board[y*6+x]===board[0]){seen.add(y*6+x);queue.push(y*6+x)}}return[...seen]}
export function floodMove(board,color){if(!Number.isInteger(color)||color<0||color>4||color===board[0])return null;const set=new Set(floodRegion(board));return board.map((v,i)=>set.has(i)?color:v)}
export const SEARCH_WORDS=['ORBIT','COMET','MOON','STAR'];
export const WORD_PATHS=[[0,1,2,3,4],[6,13,20,27,34],[12,18,24,30],[17,23,29,35]];
export function wordBoard(random=Math.random){const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ',b=Array.from({length:36},()=>chars[Math.floor(Math.max(0,Math.min(.999999,random()))*26)]);WORD_PATHS.forEach((path,i)=>path.forEach((at,j)=>b[at]=SEARCH_WORDS[i][j]));return b}
export function wordPath(from,to){const ar=Math.floor(from/6),ac=from%6,br=Math.floor(to/6),bc=to%6,dy=br-ar,dx=bc-ac;if(from<0||from>35||to<0||to>35||(!dy&&!dx)||dy&&dx&&Math.abs(dy)!==Math.abs(dx))return[];const count=Math.max(Math.abs(dy),Math.abs(dx));return Array.from({length:count+1},(_,i)=>(ar+Math.sign(dy)*i)*6+ac+Math.sign(dx)*i)}
export function matchWord(board,from,to){const path=wordPath(from,to),text=path.map(i=>board[i]).join(''),word=SEARCH_WORDS.find(w=>w===text||w===[...text].reverse().join(''));return word?{word,path}:null}

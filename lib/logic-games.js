// Small deterministic logic games. No model calls or invented completion states.
export{LOGIC_GAMES}from'./game-catalogue.js';

export const SUDOKU_GIVEN=[1,0,0,4,0,4,1,0,0,1,4,0,4,0,0,1];
export function sudokuConflict(board,at){const value=board[at];if(!value)return false;const row=Math.floor(at/4),col=at%4;return board.some((v,i)=>i!==at&&v===value&&(Math.floor(i/4)===row||i%4===col||Math.floor(Math.floor(i/4)/2)===Math.floor(row/2)&&Math.floor((i%4)/2)===Math.floor(col/2)))}
export function sudokuSolved(board){return Array.isArray(board)&&board.length===16&&board.every((v,i)=>[1,2,3,4].includes(v)&&!sudokuConflict(board,i))}
export const PIXEL_PATTERN=[0,1,0,1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,1,0,0,0,1,0,0];
export function runs(values){const out=[];let count=0;for(const v of[...values,0]){if(v)count++;else if(count){out.push(count);count=0}}return out.length?out:[0]}
export function nonogramClues(pattern=PIXEL_PATTERN){return{rows:Array.from({length:5},(_,i)=>runs(pattern.slice(i*5,i*5+5))),columns:Array.from({length:5},(_,i)=>runs(Array.from({length:5},(_,r)=>pattern[r*5+i])))}}
export function nonogramSolved(board,pattern=PIXEL_PATTERN){return board.length===25&&board.every((v,i)=>(v===1?1:0)===pattern[i])}
export function codeFeedback(secret,guess){if(secret.length!==4||guess.length!==4||guess.some(v=>!Number.isInteger(v)||v<0||v>5)||new Set(guess).size!==4)throw Error('Choose four different colors.');const exact=guess.filter((v,i)=>v===secret[i]).length,shared=guess.filter(v=>secret.includes(v)).length;return{exact,misplaced:shared-exact}}
export function newCode(random=Math.random){const a=[0,1,2,3,4,5];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.max(0,Math.min(.999999,random()))*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a.slice(0,4)}
export function moveTower(towers,from,to){if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||from>2||to<0||to>2||from===to||!towers[from].length)return null;const disk=towers[from].at(-1),target=towers[to].at(-1);if(target&&target<disk)return null;return towers.map((t,i)=>i===from?t.slice(0,-1):i===to?[...t,disk]:[...t])}

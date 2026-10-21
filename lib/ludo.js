// Ludo: classic cross-and-circle race. You are Red (bottom), 1-3 local bots.
// Pure game logic - no DOM. Track: 52 cells around the board, then a 6-cell home column per color.
// A 6 enters a token from base. Landing on an enemy sends it back to base, unless the cell is safe.
export const TRACK_LEN=52,HOME_LEN=6,TOKENS=4;
// classic safe squares on the shared track (star cells)
const SAFE=new Set([0,8,13,21,26,34,39,47]);
// each color starts the shared track at its own offset
const START={red:0,green:13,yellow:26,blue:39};
export const COLORS=['red','green','yellow','blue'];
// track layout coordinates (row,col) on a 15x15 board for the classic path
export const TRACK_COORDS=[
[6,0],[6,1],[6,2],[6,3],[6,4],[6,5],[5,6],[4,6],[3,6],[2,6],[1,6],[0,6],[0,7],[0,8],[1,8],[2,8],[3,8],[4,8],[5,8],[6,9],[6,10],[6,11],[6,12],[6,13],[6,14],[7,14],[8,14],[8,13],[8,12],[8,11],[8,10],[8,9],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[14,7],[14,6],[13,6],[12,6],[11,6],[10,6],[9,6],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0],[7,0]];
export const HOME_COORDS={red:[[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]],green:[[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]],yellow:[[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]],blue:[[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]]};
export const BASE_COORDS={red:[[1,1],[1,4],[4,1],[4,4]],green:[[1,10],[1,13],[4,10],[4,13]],yellow:[[10,10],[10,13],[13,10],[13,13]],blue:[[10,1],[10,4],[13,1],[13,4]]};
export function newLudo(bots=3){
  const players=['red',...COLORS.filter(c=>c!=='red').slice(0,Math.max(1,Math.min(3,bots)))];
  const tokens={};for(const c of players)tokens[c]=[-1,-1,-1,-1]; // -1 base, 0-50 track steps from own start, 51-56 home column, 57 finished... use steps: 0..56 where 56 = home
  return{players,tokens,turn:'red',dice:null,moves:[],winner:null,log:['Game started. You are Red. Roll the dice.']};
}
export function rollDice(){return 1+Math.floor(Math.random()*6)}
// position of token on shared track, or 'base'/'home-i'/'done'
export function tokenCell(color,steps){if(steps<0)return'base';if(steps>56)return'done';if(steps>50)return'home-'+(steps-51);return(START[color]+steps)%TRACK_LEN}
export function legalMoves(state,color,dice){
  const out=[];
  state.tokens[color].forEach((s,i)=>{
    if(s>55)return; // finished (56 = home reached exactly)
    if(s<0){if(dice===6)out.push(i);return}
    if(s+dice<=56)out.push(i);
  });
  return out;
}
// apply a move; returns events for UI/log
export function applyMove(state,color,idx,dice){
  const events=[];const t=state.tokens[color];
  if(t[idx]<0){t[idx]=0;events.push(color+' token '+(idx+1)+' enters the board.')}
  else t[idx]+=dice;
  const s=t[idx];
  if(s===56){events.push(color+' token '+(idx+1)+' is home!')}
  else if(s<=50){
    const cell=tokenCell(color,s);
    if(!SAFE.has(cell)){
      for(const other of state.players){
        if(other===color)continue;
        state.tokens[other].forEach((os,oi)=>{
          if(os>=0&&os<=50&&tokenCell(other,os)===cell){state.tokens[other][oi]=-1;events.push(color+' captures '+other+' token '+(oi+1)+' - back to base!')}
        });
      }
    }
  }
  // win check
  if(state.tokens[color].every(x=>x===56)){state.winner=color;events.push(color.toUpperCase()+' wins the game!')}
  // extra turn on a 6 or a capture or reaching home (classic rules)
  const captured=events.some(e=>e.includes('captures'));
  const reachedHome=events.some(e=>e.includes('is home'));
  if(!state.winner&&dice!==6&&!captured&&!reachedHome){
    const i=state.players.indexOf(color);state.turn=state.players[(i+1)%state.players.length];
  }
  state.log.push(...events);
  return events;
}
// simple bot: prefer capture, then leaving base, then moving the token closest to home, avoid landing next to enemies if possible
export function botPick(state,color,dice){
  const moves=legalMoves(state,color,dice);if(!moves.length)return -1;
  let best=moves[0],bestScore=-1e9;
  for(const idx of moves){
    const t=state.tokens[color];const cur=t[idx];
    const next=cur<0?0:cur+dice;
    let score=next; // progress is good
    if(next===56)score+=500;
    if(next<=50){
      const cell=tokenCell(color,next);
      if(!SAFE.has(cell)){
        for(const other of state.players){if(other===color)continue;
          for(const os of state.tokens[other])if(os>=0&&os<=50&&tokenCell(other,os)===cell)score+=300; // capture
        }
        // danger: enemy within 1-6 behind on the track
        for(const other of state.players){if(other===color)continue;
          for(const os of state.tokens[other])if(os>=0&&os<=50){const d=(cell-tokenCell(other,os)+TRACK_LEN)%TRACK_LEN;if(d>=1&&d<=6)score-=80;}
        }
      }else score+=50; // safe cell is nice
    }
    if(cur<0)score+=40; // leaving base opens options
    if(score>bestScore){bestScore=score;best=idx}
  }
  return best;
}

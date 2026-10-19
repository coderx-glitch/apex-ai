// Pure logic for the coding games. Bot Programmer runs tiny programs on a grid; Predict the Output is data + checking.
// Grid legend: # wall, . floor, > ^ v < bot start (facing that way), X goal.
export const BOT_LEVELS=[
{name:'Straight line',grid:['#######','#>..X.#','#######'],hint:'Just walk forward three times.'},
{name:'One corner',grid:['#####','#>..#','###.#','#X..#','#####'],hint:'Forward, forward, turn, forward, forward.'},
{name:'Loop practice',grid:['##########','#>......X#','##########'],hint:'Seven steps forward. One loop beats seven commands.'},
{name:'Snake alley',grid:['######','#>..X#','##.###','#....#','######'],hint:'Plan the two turns before you run.'},
{name:'Full square',grid:['#####','#>..#','#...#','#X..#','#####'],hint:'A loop of three commands twice, then two more steps.'}];
const DIRS={'>':[1,0],'v':[0,1],'<':[-1,0],'^':[0,-1]},ORDER=['^','>','v','<'];
export function parseLevel(grid){let start;const cells=grid.map((row,y)=>[...row].map((ch,x)=>{if(DIRS[ch]){start={x,y,dir:ch};return'.'}return ch}));return{cells,start}}
export function runProgram(grid,commands,maxSteps=120){
  const{cells,start}=parseLevel(grid);if(!start)return{error:'Level has no bot start.'};
  const flat=[];function expand(list,depth){if(depth>3)throw Error('Loops nested too deep. Three levels is plenty.');for(const c of list){if(typeof c==='string')flat.push(c);else if(c&&c.repeat&&Array.isArray(c.body)){const n=Math.max(1,Math.min(9,c.repeat|0));for(let i=0;i<n;i++)expand(c.body,depth+1)}else throw Error('Unknown command. Use forward, left, right or a loop.')}}
  try{expand(commands,0)}catch(e){return{error:e.message}}
  if(!flat.length)return{error:'Add at least one command before running.'};
  const trace=[{...start}];let{ x,y,dir }=start,won=false,crashed=false;
  for(const cmd of flat.slice(0,maxSteps)){
    if(cmd==='left')dir=ORDER[(ORDER.indexOf(dir)+3)%4];
    else if(cmd==='right')dir=ORDER[(ORDER.indexOf(dir)+1)%4];
    else if(cmd==='forward'){const[dx,dy]=DIRS[dir];const nx=x+dx,ny=y+dy;const cell=cells[ny]?.[nx];
      if(cell===undefined||cell==='#'){crashed=true;trace.push({x:nx,y:ny,dir,crash:true});break}
      x=nx;y=ny;if(cell==='X'){won=true;trace.push({x,y,dir,won:true});break}}
    else return{error:'Unknown command: '+cmd};
    trace.push({x,y,dir})}
  return{trace,won,crashed,steps:flat.length,finished:!won&&!crashed}}
export const CODE_QUIZ=[
{code:'let a = 3;\na = a + 2;\nprint(a);',choices:['3','2','5','Error'],answer:2,why:'a starts at 3, then a + 2 makes 5.'},
{code:'let name = "APE" + "X";\nprint(name);',choices:['"APE X"','"APEX"','Error','"APE"'],answer:1,why:'Joining strings with + glues them together with no space.'},
{code:'for (let i = 0; i < 3; i++) {\n  print(i);\n}',choices:['0 1 2','1 2 3','0 1 2 3','3'],answer:0,why:'i starts at 0 and stops before 3, so it prints 0, 1, 2.'},
{code:'let list = [4, 8, 15];\nprint(list[1]);',choices:['4','8','15','1'],answer:1,why:'Lists count from 0, so position 1 is the second item: 8.'},
{code:'let x = 10;\nif (x > 5) {\n  print("big");\n} else {\n  print("small");\n}',choices:['small','big','big small','Error'],answer:1,why:'10 is greater than 5, so the if-branch runs.'},
{code:'let total = 0;\nfor (let i = 1; i <= 4; i++) {\n  total = total + i;\n}\nprint(total);',choices:['4','24','10','0'],answer:2,why:'1+2+3+4 adds up to 10.'},
{code:'let s = "code";\nprint(s.length);',choices:['3','4','"code"','Error'],answer:1,why:'The word code has 4 letters.'},
{code:'let a = 7 % 3;\nprint(a);',choices:['2','1','3','0'],answer:1,why:'% is the remainder: 7 split into 3s leaves 1.'}];
export function quizCheck(item,choice){return item.choices[choice]!==undefined&&choice===item.answer}

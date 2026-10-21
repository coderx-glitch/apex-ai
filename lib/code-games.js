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
export const BUG_HUNT=[
{goal:'This should print 15 (adding 1 to 5), but it prints 10.',lines:['let total = 0;','for (let i = 1; i < 5; i++) {','  total = total + i;','}','print(total);'],answer:1,why:'i < 5 stops at 4, so 5 never gets added. The loop needs i <= 5.'},
{goal:'This should print "match" only when x is 8, but it prints for any x.',lines:['let x = 7;','if (x = 8) {','  print("match");','}'],answer:1,why:'One = assigns 8 to x instead of comparing, and a non-zero value always counts as true. Comparison needs ===.'},
{goal:'This should print 9 (4 plus 5), but it prints "45".',lines:['let a = "4";','let b = 5;','let sum = a + b;','print(sum);'],answer:2,why:'a is text, not a number, so + glues them into "45". Convert a to a number first.'},
{goal:'This should print the last fruit, but it prints undefined.',lines:['let fruits = ["mango", "kiwi", "plum"];','let last = fruits[3];','print(last);'],answer:1,why:'Lists count from 0, so the last of 3 items is at position 2, not 3.'},
{goal:'double(6) should give 12, but it gives undefined.',lines:['function double(n) {','  let result = n * 2;','}','print(double(6));'],answer:1,why:'The function never returns anything. It needs return result; after the calculation.'},
{goal:'This should print the squares of 1, 2 and 3, but it prints 1 three times.',lines:['for (let i = 1; i <= 3; i++) {','  let square = i * 1;','  print(square);','}'],answer:1,why:'i * 1 is always i at first and never a square. It should be i * i.'},
{goal:'This should say "teen" for age 13, but it says "child".',lines:['let age = 13;','if (age > 13) {','  print("teen");','} else {','  print("child");','}'],answer:1,why:'age > 13 is false when age is exactly 13. The check should be age >= 13.'},
{goal:'This should count down 3, 2, 1, but it never stops.',lines:['let n = 3;','while (n > 0) {','  print(n);','}'],answer:2,why:'Nothing inside the loop changes n, so it stays 3 forever. Add n = n - 1; after printing.'}];
export function bugCheck(item,lineIndex){return lineIndex===item.answer}
export const CODE_FILL=[
{code:'let x = ___;\nprint(x * 2);',prints:'prints 10',choices:['20','2','10','5'],answer:3,why:'x * 2 must be 10, so x has to be 5.'},
{code:'let word = "orbit";\nprint(word.___);',prints:'prints 5',choices:['letters','count','size','length'],answer:3,why:'length tells how many characters a string has: o-r-b-i-t is 5.'},
{code:'for (let i = 0; i < ___; i++) {\n  print("hi");\n}',prints:'prints hi 4 times',choices:['4','3','5','0'],answer:0,why:'i counts 0, 1, 2, 3 - four rounds - before 4 < 4 stops the loop.'},
{code:'let nums = [3, 6, 9];\nprint(nums[___]);',prints:'prints 9',choices:['2','3','0','1'],answer:0,why:'Positions start at 0: 3 is [0], 6 is [1], 9 is [2].'},
{code:'let left = 10 ___ 4;\nprint(left);',prints:'prints 6',choices:['+','-','/','*'],answer:1,why:'10 minus 4 is 6. The other operators give 14, 40 and 2.5.'},
{code:'let ok = 8 ___ 8;\nif (ok) {\n  print("same");\n}',prints:'prints same',choices:['<','=','===','!=='],answer:2,why:'=== asks whether both sides are equal. 8 equals 8, so ok is true.'},
{code:'let total = 0;\nfor (let i = 1; i <= 3; i++) {\n  total = total ___ i;\n}\nprint(total);',prints:'prints 6',choices:['*','=','+','-'],answer:2,why:'Adding each i gives 1+2+3 = 6. Subtracting or multiplying would not.'},
{code:'let price = 25;\nif (price > 20) {\n  price = price ___ 5;\n}\nprint(price);',prints:'prints 20',choices:['*','/','-','+'],answer:2,why:'25 is over 20, so the if runs and 25 - 5 leaves 20.'}
];
export function fillCheck(item,choice){return item.choices[choice]!==undefined&&choice===item.answer}
// Trace the Variable: read a short program and call a variable's final value. Arrange the Lines: put a shuffled program back in order.
export const TRACE_VAR=[
{code:'let total = 0;\nfor (let i = 1; i <= 4; i++) {\n  total = total + i;\n}',ask:'total',choices:['4','10','6','24'],answer:1,why:'The loop adds 1, then 2, then 3, then 4 - total ends at 10.'},
{code:'let x = 5;\nx = x * 2;\nx = x - 3;',ask:'x',choices:['10','3','7','8'],answer:2,why:'5 times 2 is 10, minus 3 leaves 7.'},
{code:"let s = 'ab';\ns = s + s;",ask:'s.length',choices:['2','4','8','ab'],answer:1,why:"'ab' + 'ab' is 'abab', which has 4 characters."},
{code:'let a = [3, 1, 4];\na[1] = 9;',ask:'a[1]',choices:['1','9','4','3'],answer:1,why:'Index 1 is the second slot; it gets overwritten to 9.'},
{code:'let c = 0;\nfor (let i = 0; i < 5; i++) {\n  if (i % 2 === 0) c++;\n}',ask:'c',choices:['5','2','3','0'],answer:2,why:'i is even at 0, 2 and 4 - three increments.'},
{code:'let x = 10;\nwhile (x > 6) {\n  x = x - 2;\n}',ask:'x',choices:['6','8','4','0'],answer:0,why:'x goes 10, 8, 6 - then 6 > 6 is false, so it stops at 6.'},
{code:'let n = 2;\nn = n * n;\nn = n * n;',ask:'n',choices:['8','64','16','4'],answer:2,why:'2 squared is 4, 4 squared is 16.'},
{code:"let msg = 'hi';\nif (msg.length > 2) {\n  msg = 'long';\n} else {\n  msg = 'short';\n}",ask:'msg',choices:['long','short','hi','2'],answer:1,why:"'hi' has length 2, not more than 2, so the else branch runs."}];
export function traceCheck(item,choice){return item.choices[choice]!==undefined&&choice===item.answer}
export const ARRANGE_LINES=[
{goal:'prints the numbers 1 to 3',lines:['for (let i = 1; i <= 3; i++) {','  console.log(i);','}']},
{goal:"prints 'Hello, Asha'",lines:["let name = 'Asha';","let msg = 'Hello, ' + name;","console.log(msg);"]},
{goal:'prints the sum 12',lines:['let total = 0;','for (const n of [2, 4, 6]) {','  total = total + n;','}','console.log(total);']},
{goal:'counts down 3, 2, 1',lines:['let n = 3;','while (n > 0) {','  console.log(n);','  n = n - 1;','}']},
{goal:'collects the even numbers',lines:['const evens = [];','for (const n of [1, 2, 3, 4]) {','  if (n % 2 === 0) {','    evens.push(n);','  }','}']},
{goal:'prints 10 using a function',lines:['function double(x) {','  return x * 2;','}','console.log(double(5));']}];
export function arrangeCheck(puzzle,order){return order.length===puzzle.lines.length&&order.every((li,pos)=>li===pos)}

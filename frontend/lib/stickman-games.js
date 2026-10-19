// Pure logic for the stickman games. No rendering here - hosts draw the poses.
export function newStickDash(){return{y:0,vy:0,slide:0,obstacles:[],distance:0,speed:5.5,over:false,score:0,nextIn:1.4,hit:''}}
export function stickDashStep(s,input={},dt=1/60,random=Math.random){
  if(s.over)return s;const n={...s,obstacles:s.obstacles.map(o=>({...o,x:o.x-s.speed*dt})).filter(o=>o.x>-1)};
  n.nextIn-=dt;n.speed=Math.min(11,5.5+n.distance/220);
  if(n.nextIn<=0){const bird=random()<.42;n.obstacles.push({x:11,kind:bird?'bird':'spike'});n.nextIn=.9+random()*1.3*(6/Math.max(6,n.speed+2))}
  if(input.jump&&s.y===0&&s.slide<=0){n.vy=8.6}if(input.slide&&s.y===0){n.slide=.55}
  n.vy-=26*dt;n.y=Math.max(0,s.y+s.vy*dt);if(n.y===0)n.vy=0;n.slide=Math.max(0,s.slide-dt);
  n.distance+=s.speed*dt;n.score=Math.floor(n.distance*10);
  for(const o of n.obstacles){if(o.x>.2&&o.x<.9){const duck=n.slide>0;
    if(o.kind==='spike'&&n.y<.34){n.over=true;n.hit='Tripped on a spike. Classic stickman landing.'}
    if(o.kind==='bird'&&!duck&&n.y<.7){n.over=true;n.hit='A bird headbutted the stickman. Slide under birds.'}}}
  return n}
export function newKarate(){return{boards:[],score:0,lives:3,over:false,nextIn:.9,streak:0,swing:'',bonk:''}}
export function karateStep(s,dt=1/60,random=Math.random){
  if(s.over)return s;const n={...s,boards:s.boards.map(b=>({...b,pos:b.pos+dt/1.6}))};
  n.nextIn-=dt;if(n.nextIn<=0){n.boards.push({side:random()<.5?'left':'right',pos:0});n.nextIn=.7+random()*.9}
  for(const b of n.boards)if(b.pos>1.12&&!b.broken){n.lives--;n.streak=0;n.bonk=b.side;n.boards=n.boards.filter(x=>x!==b);if(n.lives<=0)n.over=true}
  return n}
export function karatePunch(s,side){
  if(s.over)return{...s,swing:side};
  const n={...s,swing:side};const hit=n.boards.find(b=>b.side===side&&b.pos>=.72&&b.pos<=1.08);
  if(hit){n.boards=n.boards.filter(b=>b!==hit);n.streak=s.streak+1;n.score=s.score+1+(n.streak>=5?1:0)}
  return n}

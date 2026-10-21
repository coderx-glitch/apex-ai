import React,{useEffect,useRef}from'react';
import{useReducedMotion}from'./CinemaScene.jsx';
// In-app "calm cosmic workspace" (no library): one fullscreen WebGL fragment shader at reduced resolution.
// Slow nebula + aurora ribbon, parallax star field, and a drifting constellation of nodes that brightens gently
// when you type, focus a field or tap. Dimmed so text stays readable; pauses when hidden; one still frame when motion is reduced.
const VS='attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
const FS=`#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes,uP,uC;uniform float uT,uE,uS;uniform vec2 uN[9];
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
float seg(vec2 p,vec2 a,vec2 b,out float t){vec2 pa=p-a,ba=b-a;t=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*t);}
void main(){vec2 uv=gl_FragCoord.xy/uRes;vec2 p=(gl_FragCoord.xy-.5*uRes)/uRes.y;
vec3 col=mix(vec3(.022,.028,.055),vec3(.04,.034,.09),uv.y);
vec2 q=p*1.1+uP*.05;float w=fbm(q+vec2(uT*.012,0.)+fbm(q*1.5-uT*.01)*1.2);
col+=vec3(.30,.18,.66)*smoothstep(.34,.85,w)*.62;
col+=vec3(.05,.2,.32)*smoothstep(.45,.9,fbm(q*.8+vec2(4.,uT*.008)))*.28;
float a=sin(p.x*1.5+uT*.05+fbm(p*1.2+uT*.02)*2.5);float rb=exp(-pow((p.y-.22*a+.12)*3.4,2.));
col+=vec3(.45,.9,.4)*rb*(.45+.55*fbm(p*3.+uT*.03))*.17;
for(int l=0;l<3;l++){float fl=float(l);vec2 s=p*(7.+fl*6.)+uP*(.25+.25*fl)+vec2(fl*13.,0.);vec2 id=floor(s),f=fract(s)-.5;float r=h(id+fl);
vec2 off=(vec2(h(id*1.3),h(id*2.1))-.5)*.6;float d=length(f-off);float tw=.55+.45*sin(uT*(.6+r*1.4)+r*30.);
col+=vec3(.85,.9,1.)*smoothstep(.07+.03*(2.-fl)*.3,.0,d)*step(.64,r)*tw*(.32+.12*fl);}
float E=.2+uE*.7;
for(int i=0;i<8;i++){float t;float d=seg(p,uN[i],uN[i+1],t);float fi=float(i);
float pt=fract(uT*.11+fi*.37);float dp=abs(t-pt);
col+=vec3(.72,.66,1.)*smoothstep(.0035,.0,d)*.14*E;
col+=mix(vec3(.8,1.,.38),vec3(.7,.62,1.),mod(fi,2.))*exp(-d*70.)*smoothstep(.12,.0,dp)*.12*E;}
for(int i=0;i<9;i++){float d=length(p-uN[i]);float fi=float(i);vec3 c=mix(vec3(.83,1.,.38),vec3(.72,.65,1.),mod(fi,2.));
float pu=.75+.25*sin(uT*.9+fi*1.7);
col+=c*(smoothstep(.011,.004,d)*.9+exp(-d*26.)*.22*pu*(E+.3));}

// foreground bokeh depth
for(int k=0;k<5;k++){float fk=float(k);vec2 bc=vec2(sin(uT*.04+fk*2.1)*.7+uP.x*(.05+fk*.02),cos(uT*.03+fk*1.3)*.4+uP.y*.04)+vec2(fk*.18-.3,fk*.12-.25);float bd=length(p-bc);float br=.09+fk*.025;
col+=mix(vec3(.4,.3,.9),vec3(.6,.9,.35),mod(fk,2.))*smoothstep(br,br*.55,bd)*.035;}
// hero: eclipse planet - dark sphere, glowing corona and limb, two moons on tilted orbits
vec2 hq=p-uC-uP*vec2(.012,.01);float R=.17*uS;float dd=length(hq);float eh=1.+uE*.5;float ang=atan(hq.y,hq.x);
float flick=.82+.18*sin(ang*7.+uT*.4)*sin(ang*3.-uT*.23);
float cor=exp(-max(dd-R,0.)/(R*.34))*step(R,dd);
col+=vec3(.5,.35,1.)*exp(-dd/R*1.1)*.14*eh+mix(vec3(.8,1.,.4),vec3(.72,.62,1.),.5+.5*sin(ang+uT*.15))*cor*.5*flick*eh;
float limb=exp(-pow((dd-R*1.012)/(R*.011),2.));col+=mix(vec3(.83,1.,.4),vec3(.75,.65,1.),.5+.5*sin(ang-uT*.2))*limb*(.75+.5*uE);
vec3 front=vec3(0.);
for(int i=0;i<2;i++){float fi=float(i);float ta=.5+fi*.9,ct=cos(ta),st=sin(ta);vec2 r=vec2(hq.x*ct+hq.y*st,-hq.x*st+hq.y*ct);
float Ro=R*(2.15+fi*.85),tl=.3+.07*fi;float of=length(vec2(r.x/Ro,r.y/(Ro*tl)));col+=vec3(.7,.65,1.)*exp(-pow((of-1.)*Ro*tl/.0024,2.))*.22;
float a=uT*(.2-.07*fi)+fi*2.4;vec2 mp=vec2(cos(a)*Ro,sin(a)*Ro*tl);vec2 mw=vec2(mp.x*ct-mp.y*st,mp.x*st+mp.y*ct);float md=length(hq-mw);float mr=R*(.12-.035*fi);
vec3 mc=mix(vec3(.83,1.,.4),vec3(.78,.7,1.),fi);vec3 mcol=mc*(smoothstep(mr,mr*.55,md)*.95+exp(-md/mr*1.8)*.28)+vec3(1.)*exp(-md/mr*6.)*.35;
if(sin(a)>0.)front+=mcol;else col+=mcol;}
if(dd<R){float z=sqrt(max(1.-(dd/R)*(dd/R),0.));vec3 nn=vec3(hq/R,z);vec3 L=normalize(vec3(-.55,.6,.6));float df=max(dot(nn,L),0.);float fr=pow(1.-z,3.);
float sw=fbm(nn.xy*3.2+vec2(uT*.03,-uT*.02));
vec3 body=vec3(.008,.008,.028)+vec3(.12,.1,.3)*df*df*.55+vec3(.4,.3,.85)*sw*.05*(.3+df)+vec3(.8,1.,.38)*fr*(.35+.75*df)+vec3(.65,.55,1.)*fr*fr*.35;
float edge=smoothstep(R,R*.985,dd);col=mix(col,body,edge);}
col+=front;
col*=.82+.18*smoothstep(1.1,.2,length(p));
col=1.-exp(-col*1.25);
gl_FragColor=vec4(col,1.);}`;
const PTS=[[.62,.9],[.74,.8],[.84,.91],[.93,.72],[.86,.55],[.95,.38],[.82,.22],[.9,.08],[.7,.12]];
export default function CosmosScene(){const paused=useReducedMotion(),ref=useRef();
useEffect(()=>{const c=ref.current;if(!c)return;const gl=c.getContext('webgl',{antialias:false,alpha:false,powerPreference:innerWidth<800?'low-power':'high-performance'});if(!gl)return;
const mk=(t,s)=>{const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);return o},pr=gl.createProgram();gl.attachShader(pr,mk(gl.VERTEX_SHADER,VS));gl.attachShader(pr,mk(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pr);if(!gl.getProgramParameter(pr,gl.LINK_STATUS))return;gl.useProgram(pr);
const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);const al=gl.getAttribLocation(pr,'a');gl.enableVertexAttribArray(al);gl.vertexAttribPointer(al,2,gl.FLOAT,false,0,0);
const U=n=>gl.getUniformLocation(pr,n),uC=U('uC'),uS=U('uS'),uRes=U('uRes'),uP=U('uP'),uT=U('uT'),uE=U('uE'),uN=U('uN');
const small=innerWidth<800;let W=0,H=0,raf=0,last=0,E=0,px=0,py=0,tx=0,ty=0,frames=0,t0=performance.now();
const size=()=>{const s=small?.5:Math.min(window.devicePixelRatio||1,2),k=Math.min(1,2560/(innerWidth*s));W=Math.max(2,Math.round(innerWidth*s*k));H=Math.max(2,Math.round(innerHeight*s*k));c.width=W;c.height=H;gl.viewport(0,0,W,H)};
const draw=now=>{const t=(now-t0)/1000,asp=W/H,arr=new Float32Array(18);
PTS.forEach((p,i)=>{arr[i*2]=(p[0]-.5+.018*Math.sin(t*.21+i*1.9))*asp;arr[i*2+1]=p[1]-.5+.018*Math.cos(t*.17+i*2.3)});
gl.uniform2f(uRes,W,H);const nar=asp<1;gl.uniform2f(uC,nar?.0:asp*.34,nar?-.3:-.16);gl.uniform1f(uS,nar?1.2:1.3);gl.uniform2f(uP,px,py);gl.uniform1f(uT,paused?6:t);gl.uniform1f(uE,E);gl.uniform2fv(uN,arr);gl.drawArrays(gl.TRIANGLES,0,3);frames++;c.dataset.frames=frames};
const gap=small?42:14;
const frame=now=>{raf=requestAnimationFrame(frame);if(document.hidden||now-last<gap)return;last=now;E*=.965;px+=(tx-px)*.04;py+=(ty-py)*.04;draw(now)};
const bump=v=>()=>{E=Math.min(1,E+v)},move=e=>{tx=(e.clientX/innerWidth-.5)*2;ty=(e.clientY/innerHeight-.5)*2};
const kd=bump(.28),fi=bump(.3),pd=bump(.35);
size();addEventListener('resize',size);
if(paused)draw(performance.now());else{addEventListener('pointermove',move,{passive:true});addEventListener('keydown',kd);addEventListener('focusin',fi);addEventListener('pointerdown',pd,{passive:true});raf=requestAnimationFrame(frame)}
return()=>{cancelAnimationFrame(raf);removeEventListener('resize',size);removeEventListener('pointermove',move);removeEventListener('keydown',kd);removeEventListener('focusin',fi);removeEventListener('pointerdown',pd);gl.getExtension('WEBGL_lose_context')?.loseContext()}},[paused]);
return <canvas ref={ref} className="theme-scene cosmos" aria-hidden="true"/>}

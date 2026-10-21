import{localStore}from'../lib/browser-storage.js';
import{loadReading}from'../lib/reading.js';
import React,{useEffect,useRef,useState}from'react';
// Original WebGL login scene (no library): a luminous particle torus-knot "core" with a light shell,
// depth-of-field dust layers, travelling light pulses, spark glints and volumetric light shafts.
// Additive soft sprites give the glow. Pauses when hidden/offscreen, caps pixel ratio, honours reduced motion.
const VS=`attribute vec3 aPos;attribute vec4 aD;uniform vec2 uRot;uniform float uT,uAsp,uPx,uSc;uniform vec2 uOff;uniform float uDim,uSpd;varying vec4 vC;varying float vS;
vec3 rx(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(p.x,p.y*c-p.z*s,p.y*s+p.z*c);}
vec3 rz(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(p.x*c-p.y*s,p.x*s+p.y*c,p.z);}
void main(){vec3 p=aPos;float L=aD.w,ph=aD.z;float ring=0.;
if(L>3.5&&L<5.5){float r1=aPos.y>.5?1.:0.;float a=aPos.x+uT*uSpd*(r1>.5?-.22:.3)-aPos.z;float R=r1>.5?2.1:1.65;p=vec3(cos(a)*R,0.,sin(a)*R);p=rx(p,r1>.5?-.75:.6);p=rz(p,r1>.5?-.5:.35);ring=1.;}
else if(L<1.5){p*=1.+.018*sin(uT*1.2+L*2.);if(L>.5)p.y+=.06*sin(uT*.8);}
else if(L<2.5){p.y=mod(p.y+uT*.05*(.4+ph)+3.,6.)-3.;p.x+=sin(uT*.2+ph*20.)*.08;}
float cy=cos(uRot.x),sy=sin(uRot.x),cx=cos(uRot.y),sx=sin(uRot.y);
vec3 q=vec3(p.x*cy+p.z*sy,p.y,-p.x*sy+p.z*cy);q=vec3(q.x,q.y*cx-q.z*sx,q.y*sx+q.z*cx);
if(L>1.5&&L<2.5){q.xy+=uRot*vec2(-.5,.5)*.9;}
float w=5.-q.z;float k=2.3/w*uSc;float fx=uAsp>1.?1./uAsp:1.,fy=uAsp>1.?1.:uAsp;
gl_Position=vec4(q.x*k*fx+uOff.x,q.y*k*fy+uOff.y,0.,1.);
float dof=abs(q.z-.2)*.3;
gl_PointSize=aD.x*uPx*(11./w)*(1.+dof*(L>1.5&&L<2.5?1.6:.7));
vec3 lime=vec3(.80,1.,.35),vio=vec3(.74,.6,.98),ice=vec3(.88,.95,1.);
vec3 col=mix(lime,vio,aD.y);
float shine=smoothstep(.88,1.,sin(p.x*2.2-p.y*1.4-uT*.9));
float a=1.;
if(L<1.5){col=mix(col,ice,shine*.8);a=.62*(1.-dof*.5)*(.8+.5*shine);}
else if(L<2.5){a=.5*(1.-dof*.55);col=mix(col,ice,.4);}
else if(L<3.5){a=.8*(.5+.5*sin(uT*1.7+ph*50.));col=ice;}
else if(L<4.5){a=.5*(1.-dof*.4);col=mix(vio,lime,aD.y);}
else{a=1.;col=ice;}
vC=vec4(col,a*uDim);vS=(L>2.5&&L<3.5)?1.:0.;}`;
const FS=`precision mediump float;varying vec4 vC;varying float vS;
void main(){vec2 c=gl_PointCoord-.5;float d=length(c)*2.;if(d>1.)discard;
float core=exp(-d*d*5.),glow=exp(-d*d*1.7)*.4;float a=(core+glow)*vC.a;
if(vS>.5){float cr=exp(-abs(c.x)*26.)*exp(-abs(c.y)*3.5)+exp(-abs(c.y)*26.)*exp(-abs(c.x)*3.5);a=max(a*.3,cr*vC.a*1.6);}
gl_FragColor=vec4(vC.rgb*a,a);}`;
function star(out,n,edge,scale,ox,oy,oz,hue,Lid,rot,small){const P=.6,r=Math.random,c0=Math.cos(rot),s0=Math.sin(rot);
for(let i=0;i<n;i++){const th=r()*Math.PI*2,R=Math.pow(Math.abs(Math.cos(th)),P)+Math.pow(Math.abs(Math.sin(th)),P),rad=Math.pow(R,-1/P);
const e=i<edge,rho=e?rad*(.97+r()*.05):rad*Math.sqrt(r());let x=Math.cos(th)*rho,y=Math.sin(th)*rho;const z=(r()-.5)*.26*(1-.7*rho/rad);
out.push((x*c0-y*s0)*scale+ox,(x*s0+y*c0)*scale+oy,z*scale+oz,(e?1.6:.9)+r()*.9,hue,r(),Lid)}}
function geometry(small,hq){const out=[],r=Math.random,m=hq>=2?3:hq?1.7:1;
star(out,Math.round((small?2600:4200)*m),Math.round((small?700:1100)*m),1,0,0,0,0,0,-.2);
star(out,Math.round((small?500:800)*m),Math.round((small?140:240)*m),.34,.86,.74,.12,1,1,.1);
const D=small?600:1300;for(let i=0;i<D;i++)out.push((r()-.5)*9,(r()-.5)*6,(r()-.5)*5-.5,.7+r()*1.8,r(),r(),2);
for(let i=0;i<(small?10:16);i++){const a=r()*Math.PI*2,rr=Math.pow(r(),.6)*(i<4?.85:1);out.push(Math.cos(a)*rr*.9,Math.sin(a)*rr*.9,.1,16+r()*14,0,r(),3)}
out.push(0,0,.15,34,0,0,3);
for(let ring=0;ring<2;ring++){const n=small?130:200;for(let i=0;i<n;i++)out.push(i/n*Math.PI*2,ring,0,.7+r()*.5,ring?0:1,r(),4)}
const nodes=[[0,0],[2.1,0],[4.2,0],[0.8,1],[2.4,1],[4.0,1]];
for(const[a,ring]of nodes){out.push(a,ring,0,13,0,0,5);for(let t=1;t<=9;t++)out.push(a,ring,t*.05,Math.max(1.5,10-t*1.05),0,0,5)}
return new Float32Array(out)}

export function SceneCanvas({paused,cfg,className}){const ref=useRef();
useEffect(()=>{const canvas=ref.current;const gl=canvas.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:true,powerPreference:'low-power'});if(!gl)return;
const sh=(t,s)=>{const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);return o},pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pr);if(!gl.getProgramParameter(pr,gl.LINK_STATUS))return;gl.useProgram(pr);
const small=Math.min(innerWidth,innerHeight)<700,hq=cfg.hq&&!small?1:(cfg.hq&&small?-1:0),data=geometry(small,hq),n=data.length/7;
const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
const A=gl.getAttribLocation(pr,'aPos'),B=gl.getAttribLocation(pr,'aD');gl.enableVertexAttribArray(A);gl.vertexAttribPointer(A,3,gl.FLOAT,false,28,0);gl.enableVertexAttribArray(B);gl.vertexAttribPointer(B,4,gl.FLOAT,false,28,12);
const U=k=>gl.getUniformLocation(pr,k),uRot=U('uRot'),uT=U('uT'),uAsp=U('uAsp'),uPx=U('uPx'),uSc=U('uSc'),uOff=U('uOff'),uDim=U('uDim'),uSpd=U('uSpd');
gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);
let w=0,h=0,dpr=1,raf=0,last=0,visible=true,px=0,py=0,tx=0,ty=0,t0=performance.now(),frames=0;
function draw(now){const t=(now-t0)/1000*cfg.speed,mobile=w<850;gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
gl.uniform2f(uRot,.3*Math.sin(t*.32)+px*.22,-.1+py*.2);gl.uniform1f(uT,t);gl.uniform1f(uAsp,w/h);gl.uniform1f(uPx,dpr*(mobile?.9:1.15)*(hq>=2?.7:hq?.82:1));gl.uniform1f(uSc,mobile?cfg.scM:cfg.sc);gl.uniform2f(uOff,...(mobile?cfg.offM:cfg.off));gl.uniform1f(uDim,cfg.dim*(hq>=2?.85:1));gl.uniform1f(uSpd,1);
gl.drawArrays(gl.POINTS,0,n);frames++;canvas.dataset.frames=frames}
const resize=()=>{dpr=Math.min(window.devicePixelRatio||1,hq>=2?3:hq<0?1.5:hq?1.5:(small?1.25:1.5));w=canvas.clientWidth;h=canvas.clientHeight;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);draw(performance.now())};
const gap=hq>=2?0:hq<0?33:hq?24:(small?40:22);
function frame(now){raf=requestAnimationFrame(frame);if(!visible||document.hidden||now-last<gap)return;last=now;px+=(tx-px)*(hq?.035:.05);py+=(ty-py)*(hq?.035:.05);draw(now)}
const move=e=>{const r=e.touches?e.touches[0]:e;tx=(r.clientX/innerWidth-.5)*2;ty=(r.clientY/innerHeight-.5)*2};
const io=new IntersectionObserver(([e])=>{visible=e.isIntersecting},{threshold:0});io.observe(canvas);
resize();addEventListener('resize',resize);
if(!paused){addEventListener('pointermove',move,{passive:true});raf=requestAnimationFrame(frame)}
return()=>{cancelAnimationFrame(raf);io.disconnect();removeEventListener('resize',resize);removeEventListener('pointermove',move);gl.getExtension('WEBGL_lose_context')?.loseContext()}},[paused]);
return <canvas ref={ref} className={className+" "+(!paused?"playing":"")} aria-hidden="true"/>}
export function useReducedMotion(){const[paused,P]=useState(()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches||loadReading(localStore).motion==='reduce'}catch{return false}});
useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)'),update=()=>{if(media.matches)P(true)};media.addEventListener('change',update);return()=>media.removeEventListener('change',update)},[]);return paused}
export default function ThemeScene(){const paused=useReducedMotion();return <><div className={"theme-bloom"} aria-hidden="true"/><SceneCanvas paused={paused} className="theme-scene" cfg={{sc:1.0,scM:.8,off:[.66,.12],offM:[0,.62],dim:.34,speed:.7}}/></>}

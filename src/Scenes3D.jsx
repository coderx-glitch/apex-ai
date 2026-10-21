import React,{useEffect,useRef}from'react';
import{useReducedMotion}from'./CinemaScene.jsx';
import{THEME_CATALOG,loadCustom}from'../lib/themes.js';
// Five real-time 3D theme scenes (no library): each is a fullscreen WebGL fragment shader that ray-marches or ray-casts real 3D
// geometry (volumetric nebula, crystal field, plasma sun, ocean surface, hyper tunnel) in the active theme's own colours.
// Dynamic resolution keeps frame time in budget; phones and low-end devices start lighter; reduced motion draws one still frame.
const VS='attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
const HEAD=`#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes,uP;uniform float uT,uE;uniform vec3 uA,uB,uBg;uniform float uDim;
float h1(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float h3(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float n3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fb3(vec3 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n3(p);p=p*2.02+vec3(3.1,1.7,5.3);a*=.5;}return v;}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
vec3 stars(vec3 rd,float dens){vec3 c=vec3(0.);for(int k=0;k<2;k++){float sc=60.+float(k)*55.;vec3 q=rd*sc;vec3 id=floor(q);vec3 f=fract(q)-.5;float r=h3(id+float(k));float d=length(f);c+=vec3(.8,.9,1.)*smoothstep(.1,.0,d)*step(dens,r)*(.4+.6*h3(id*1.7));}return c;}
void finish(vec3 col,vec2 uv){float v=smoothstep(1.25,.25,length(uv));col*=(.78+.22*v)*uDim;col=1.-exp(-col*1.35);col=pow(col,vec3(.94));gl_FragColor=vec4(col+h1(gl_FragCoord.xy+uT)*.012,1.);}
`;
const MAIN=b=>`void main(){vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y;vec2 m=uP*.25;${b}}`;
const SCENES={
// 1. volumetric nebula fly-through
nebula:HEAD+MAIN(`vec3 ro=vec3(0.,0.,uT*.35);vec3 rd=normalize(vec3(uv+m*vec2(1.,-1.)*.6,1.1));rd.xy*=rot(sin(uT*.07)*.25);
vec3 col=uBg*1.3+stars(rd,.985)*.55;float tr=1.;vec3 acc=vec3(0.);float t=.6+h1(gl_FragCoord.xy)*.08;
for(int i=0;i<30;i++){vec3 p=ro+rd*t;float d=fb3(p*.55+vec3(0.,0.,uT*.02));d=smoothstep(.42,.9,d)*.9;
float lit=fb3(p*.55+vec3(.4,.6,0.)+rd*.35)*1.4;vec3 c=mix(uA,uB,clamp(fb3(p*.25+4.)*1.6,0.,1.))*(.35+lit);
float a=d*.11*(1.+uE);acc+=tr*a*c*2.6;tr*=1.-a;t+=.17+t*.025;}
col=col*tr+acc;col+=uA*pow(max(0.,1.-length(uv-vec2(.35,.1))*1.4),3.)*.12;finish(col,uv);`),
// 2. crystal cavern: repeated rotating octahedra, glow + fresnel
crystal:HEAD+`float sdOct(vec3 p,float s){p=abs(p);return(p.x+p.y+p.z-s)*.57735;}
vec2 mp(vec3 p){vec3 id=floor(p/3.2+.5);vec3 q=p-id*3.2;float r=h3(id);q.xz*=rot(uT*.15*(r-.5)*3.+r*6.);q.xy*=rot(uT*.1+r*5.);float d=sdOct(q*vec3(1.,.72,1.),.9+.35*r);return vec2(d,r);}
vec3 nrm(vec3 p){vec2 e=vec2(.01,0.);return normalize(vec3(mp(p+e.xyy).x-mp(p-e.xyy).x,mp(p+e.yxy).x-mp(p-e.yxy).x,mp(p+e.yyx).x-mp(p-e.yyx).x));}
`+MAIN(`vec3 ro=vec3(1.1,.9,uT*.55);vec3 rd=normalize(vec3(uv+m*vec2(1.,-1.)*.5,1.2));rd.xy*=rot(sin(uT*.06)*.2);
vec3 col=mix(uBg*1.2,uBg*2.4+uB*.05,smoothstep(-.4,.5,uv.y));float t=0.,glow=0.;float hit=0.;vec2 r=vec2(1.);
for(int i=0;i<56;i++){vec3 p=ro+rd*t;r=mp(p);glow+=.012/(.04+r.x*r.x*8.)*exp(-t*.07);if(r.x<.003){hit=1.;break;}t+=r.x*.85;if(t>26.)break;}
if(hit>.5){vec3 p=ro+rd*t;vec3 n=nrm(p);float fr=pow(1.-max(dot(-rd,n),0.),2.6);vec3 L=normalize(vec3(-.4,.7,-.5));float df=max(dot(n,L),0.);
vec3 base=mix(uA,uB,r.y);vec3 rf=reflect(rd,n);float sp=pow(max(dot(rf,L),0.),24.);
col=mix(col,base*(.08+.5*df)+uB*fr*.9+vec3(1.)*sp*.7,exp(-t*.06));}
col+=mix(uA,uB,.5+.5*sin(uT*.2))*glow*.05*(1.+uE);col+=stars(rd,.99)*.3*(1.-hit);finish(col,uv);`),
// 3. plasma sun with corona and prominences
solar:HEAD+MAIN(`vec3 ro=vec3(0.,0.,-3.2);vec3 rd=normalize(vec3(uv-vec2(.18,.02)+m*vec2(1.,-1.)*.35,1.45));
vec3 col=uBg*1.1+stars(rd,.986)*.45;float b=dot(ro,rd),c=dot(ro,ro)-1.,disc=b*b-c;float R=length(uv-vec2(.18,.02))*1.;
float ang=atan(uv.y-.02,uv.x-.18);
if(disc>0.){float t=-b-sqrt(disc);vec3 p=ro+rd*t;vec3 n=normalize(p);n.xz*=rot(uT*.05);
float f1=fb3(n*2.6+vec3(uT*.08,0.,uT*.05)),f2=fb3(n*6.+f1*2.+vec3(0.,uT*.12,0.));float heat=clamp(f1*1.2+f2*.55,0.,1.4);
vec3 plasma=mix(uB*.55,uA,smoothstep(.25,.95,heat))+vec3(1.,.95,.8)*smoothstep(.95,1.3,heat)*.7;
float mu=sqrt(max(1.-dot(n.xy,n.xy),0.));plasma*=.45+.75*pow(mu,.6);col=plasma*(1.1+.25*uE);}
else{float d=max(length(uv-vec2(.18,.02))*2.4-1.,0.);float streak=fb3(vec3(cos(ang)*2.2,sin(ang)*2.2,uT*.15)*1.4);
col+=mix(uB,uA,exp(-d*2.))*(exp(-d*3.2)*.9*(.6+streak)+exp(-d*.9)*.16)*(1.+.5*uE);
float prom=pow(max(0.,sin(ang*5.+uT*.2)*sin(ang*3.-uT*.13)),3.);col+=uA*exp(-d*7.)*prom*.7;}
finish(col,uv);`),
// 4. ocean surface under a low moon
abyss:HEAD+`float wv(vec2 p,float t){float h=0.;float a=.55;vec2 q=p;for(int i=0;i<5;i++){h+=a*sin(q.x*1.1+t*(.7+float(i)*.2)+sin(q.y*.6+t*.3))*.5;h+=a*.5*sin(q.y*1.4-t*.6+q.x*.3);q=mat2(.8,-.6,.6,.8)*q*1.75;a*=.5;}return h;}
`+MAIN(`vec3 ro=vec3(0.,2.1+sin(uT*.2)*.15,uT*.5);vec3 rd=normalize(vec3(uv.x+m.x*.6,uv.y-.18-m.y*.3,1.2));
vec3 L=normalize(vec3(-.35,.32,1.));float moon=smoothstep(.992,.9985,dot(rd,L));
vec3 sky=mix(uBg*1.6,uB*.45+uBg,pow(clamp(1.-rd.y,0.,1.),2.2));sky+=uA*pow(max(dot(rd,L),0.),18.)*.35+vec3(1.,.97,.9)*moon*1.4+stars(rd,.986)*.55*smoothstep(0.,.3,rd.y);
vec3 col=sky;
if(rd.y<-.005){float t=-ro.y/rd.y;float tt=t;for(int i=0;i<6;i++){vec3 p=ro+rd*tt;tt+=(p.y-wv(p.xz,uT))*.5/(-rd.y+.2);}
vec3 p=ro+rd*tt;vec2 e=vec2(.06,0.);float hx=wv(p.xz+e.xy,uT)-wv(p.xz-e.xy,uT),hz=wv(p.xz+e.yx,uT)-wv(p.xz-e.yx,uT);vec3 n=normalize(vec3(-hx,.22+.04*tt*.05,-hz));
float fr=pow(1.-max(dot(-rd,n),0.),4.);vec3 rf=reflect(rd,n);vec3 rs=mix(uBg*1.5,uB*.5,pow(clamp(1.-rf.y,0.,1.),2.));
float sp=pow(max(dot(rf,L),0.),90.);float crest=smoothstep(.15,.4,wv(p.xz,uT)+.1);
vec3 water=mix(uBg*.8,uA*.12,.5)+rs*fr+uA*sp*1.2*(1.+uE)+vec3(1.)*sp*.5+uA*crest*.05;
float fog=exp(-tt*.045);col=mix(sky*.9,water,fog);}
finish(col,uv);`),
// 5. hyper tunnel fly-through
tunnel:HEAD+MAIN(`vec2 q=uv+m*vec2(.6,-.6);float r=length(q),a=atan(q.y,q.x);float z=1./(r+.015);
float tw=a+z*.18+uT*.12+sin(uT*.2)*.4;float zz=z+uT*1.6;
float ring=smoothstep(.06,0.,abs(fract(zz*.5)-.5)-.44)+.0;float ringA=exp(-pow((fract(zz*.5)-.5)/.05,2.));
float rib=exp(-pow((fract(tw*3.8197)-.5)/.04,2.));float cell=floor(zz*.5);float flick=.55+.45*sin(uT*2.+h1(vec2(cell,floor(tw*3.8197)))*30.);
vec3 colA=mix(uA,uB,.5+.5*sin(zz*.18+uT*.2));vec3 col=uBg*1.2;
col+=colA*(ringA*1.1+rib*.55)*exp(-z*.07)*(1.+uE);
float panel=h1(vec2(cell,floor(tw*3.8197)));col+=mix(uA,uB,panel)*step(.82,panel)*.12*flick*exp(-z*.06);
col+=mix(uB,uA,.5)*exp(-r*5.)*.22;
vec3 st=stars(normalize(vec3(q*2.,1.)),.99);col+=st*.25*smoothstep(.0,.25,r);finish(col,uv);`),
// 6. aurora veil over a ridge line
veil:HEAD+MAIN(`vec3 rd=normalize(vec3(uv.x+m.x*.5,uv.y+.14-m.y*.3,1.1));
vec3 col=mix(uBg*1.3+uB*.06,uBg*.9,smoothstep(0.,.8,rd.y));col+=stars(rd,.984)*smoothstep(0.,.35,rd.y)*.6;
vec3 ac=vec3(0.);for(int i=0;i<26;i++){float fi=float(i);float hh=.5+fi*.1;float t=hh/max(rd.y+.03,.05);vec3 p=vec3(rd.x*t,hh,rd.z*t+uT*.3);
float w=fb3(vec3(p.x*.32+sin(p.z*.22+uT*.1)*1.3,fi*.06,p.z*.1+uT*.03));float band=smoothstep(.36,.78,w)*exp(-fi*.05);
ac+=mix(uA,uB,fi/26.)*band*.085*(1.+uE);}
col+=ac*smoothstep(-.04,.22,rd.y)*1.7;
float ridge=.0+.1*fb3(vec3(rd.x*2.6+4.,0.,1.))+.04*sin(rd.x*1.7);
if(rd.y<ridge){float rim=smoothstep(.02,0.,ridge-rd.y);col=mix(uBg*.5,uBg*.22+ac*.06,.5)+uA*rim*.12;}
finish(col,uv);`),
// 7. spiral galaxy seen at an angle
galaxy:HEAD+MAIN(`vec2 q=(uv-vec2(.12,.02)+m*.2);q*=rot(-.5);q.y/=.46;float r=length(q),a=atan(q.y,q.x);
float arms=.5+.5*cos(2.*(a-uT*.05)+log(r+.02)*4.2);float noise=fb3(vec3(q*3.2,uT*.02));float dens=exp(-r*1.5)*(.25+arms*1.1)*(.55+noise);
float bulge=exp(-r*7.);float dust=smoothstep(.45,.75,fb3(vec3(q*5.5+3.,0.)))*exp(-r*1.2);
vec3 col=uBg*1.1;col+=mix(uB,uA,clamp(r*1.4,0.,1.))*dens*1.4*(1.-dust*.6)+vec3(1.,.93,.8)*bulge*1.1+uA*exp(-r*2.5)*.12*(1.+uE);
vec3 rd=normalize(vec3(uv,1.2));col+=stars(rd,.982)*.6+stars(rd*1.7,.988)*.4;
float st=h1(floor(q*60.));col+=vec3(.9,.95,1.)*step(.993,st)*dens*2.;finish(col,uv);`),
// 8. black hole with lensed accretion disc
horizon:HEAD+MAIN(`vec3 ro=vec3(0.,.55,-7.);vec3 rd=normalize(vec3(uv-vec2(.1,0.)+m*vec2(1.,-1.)*.3,1.5));rd.yz*=rot(-.08);
vec3 p=ro,v=rd;vec3 acc=vec3(0.);bool cap=false;float prevY=p.y;
for(int i=0;i<72;i++){float r2=dot(p,p);float r=sqrt(r2);vec3 g=-1.45*p/(r2*r+.01);float st=clamp(r*.16,.07,.5);v=normalize(v+g*st*.55);vec3 np=p+v*st;
if(r<.98){cap=true;break;}
if(prevY*np.y<0.){float k=prevY/(prevY-np.y);vec3 hp=mix(p,np,k);float rr=length(hp.xz);if(rr>1.5&&rr<5.2){float ang=atan(hp.z,hp.x)+uT*.35*(2.4/rr);
float band=.55+.45*fb3(vec3(rr*2.4,ang*2.,uT*.05));float heat=smoothstep(5.2,1.5,rr);float dop=.7+.6*clamp(dot(normalize(vec3(-hp.z,0.,hp.x)),-v),-1.,1.);
vec3 dc=mix(uB,uA,heat)*band*(.5+1.6*heat)*dop;dc+=vec3(1.,.95,.85)*pow(heat,3.)*.8;acc+=dc*smoothstep(5.2,4.2,rr)*smoothstep(1.5,1.9,rr)*.9;}}
prevY=np.y;p=np;if(r>14.)break;}
vec3 col=uBg*1.1;if(!cap)col+=stars(v,.984)*.7;col+=acc*(1.+.6*uE);
float rim=exp(-pow((length(uv-vec2(.1,0.))*6.1-1.35),2.)*22.);col+=uA*rim*.18*(cap?1.:.0);finish(col,uv);`),
// 9. synthwave horizon
synth:HEAD+MAIN(`vec3 rd=normalize(vec3(uv.x+m.x*.4,uv.y+.02-m.y*.2,1.));vec3 col=mix(uBg*1.4,uBg*.8+uB*.12,smoothstep(.35,-.05,rd.y));col+=uB*exp(-abs(rd.y)*9.)*.35;
vec2 sc=vec2(.0,.25);float sd=length(uv-sc);float bars=step(.0,sin((uv.y-sc.y)*(70.+uv.y*80.)-uT*1.2)+.35+(uv.y-sc.y)*3.5);
vec3 sun=mix(uA,uB,smoothstep(.0,-.28,uv.y-sc.y));float sm=smoothstep(.27,.265,sd)*mix(1.,bars,step(uv.y,sc.y));col=mix(col,sun*1.2,sm*(1.-.0))+uA*exp(-(sd-.26)*6.)*.1*step(.26,sd);
col+=stars(rd,.985)*smoothstep(.05,.4,rd.y)*.5;
float mt=.05+.1*fb3(vec3(rd.x*5.+2.,0.,1.));if(rd.y>0.&&rd.y<mt)col=uBg*.5+uB*.04*(1.-rd.y/mt)+uA*.1*smoothstep(.015,0.,mt-rd.y);
if(rd.y<0.){float t=-1./rd.y;vec3 p=vec3(rd.x*t+m.x*2.,-1.,rd.z*t+uT*2.2);float gx=abs(fract(p.x*.45)-.5),gz=abs(fract(p.z*.6)-.5);
float ln=exp(-min(gx*1.1,gz)*34.)*(1.+uE);vec3 gc=mix(uA,uB,clamp(abs(p.x)*.04,0.,1.));col=uBg*.7+gc*ln*exp(-t*.045)*1.1+uB*.05*exp(-t*.08);}
finish(col,uv);`),
// 10. magma flyover with glowing cracks
magma:HEAD+`vec2 vor(vec2 p){vec2 g=floor(p),f=fract(p);float d1=8.,d2=8.;for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){vec2 o=vec2(float(i),float(j));vec2 r=o+vec2(h1(g+o),h1(g+o+7.3))-f;float d=dot(r,r);if(d<d1){d2=d1;d1=d;}else if(d<d2)d2=d;}return vec2(sqrt(d1),sqrt(d2));}
`+MAIN(`vec3 rd=normalize(vec3(uv.x+m.x*.4,uv.y-.28-m.y*.2,1.));vec3 col=mix(uBg*1.4+uB*.18,uBg*.8,smoothstep(-.02,.5,rd.y));col+=uA*exp(-abs(rd.y)*10.)*.3;
if(rd.y<-.005){float t=-1.4/rd.y;vec3 p=vec3(rd.x*t,-1.4,rd.z*t+uT*.9);vec2 q=p.xz*.55;vec2 vv=vor(q);float edge=vv.y-vv.x;float crack=exp(-edge*7.);float pulse=.7+.3*sin(uT*1.1+h1(floor(q))*20.);
float crust=fb3(vec3(q*3.,1.));vec3 rock=uBg*.7+vec3(.05)*crust;vec3 heat=mix(uB,uA,clamp(crack*1.2,0.,1.))*crack*pulse*(1.1+uE);vec3 f=rock+heat*1.6+uA*exp(-edge*2.2)*.08;
col=mix(col,f,exp(-t*.05));col+=uA*.05*exp(-t*.15);}
vec3 em=vec3(0.);for(int k=0;k<2;k++){float sc=22.+float(k)*18.;vec3 qq=vec3(rd.xy*sc,rd.z*sc);qq.y-=uT*(.6+float(k)*.4)*.5;vec3 id=floor(qq);vec3 f=fract(qq)-.5;float d=length(f);em+=mix(uA,uB,h3(id))*smoothstep(.12,0.,d)*step(.9,h3(id+2.))*.8;}
col+=em*smoothstep(-.1,.2,rd.y+.1)*.6;finish(col,uv);`)
};
export const SCENES_3D=Object.keys(SCENES);
const hex=h=>{const n=parseInt(h.slice(1),16);return[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255]};
export default function Scene3D({id,rev=0}){const paused=useReducedMotion(),ref=useRef();
useEffect(()=>{const c=ref.current;const cu=id==='custom'?loadCustom():null,sid=cu?cu.scene:id;if(!c||!SCENES[sid])return;const gl=c.getContext('webgl',{antialias:false,alpha:false,powerPreference:'high-performance'});if(!gl)return;
const mk=(t,s)=>{const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);return o},pr=gl.createProgram();gl.attachShader(pr,mk(gl.VERTEX_SHADER,VS));gl.attachShader(pr,mk(gl.FRAGMENT_SHADER,SCENES[sid]));gl.linkProgram(pr);if(!gl.getProgramParameter(pr,gl.LINK_STATUS)){c.dataset.error=String((gl.getAttachedShaders(pr)||[])[1]&&gl.getShaderInfoLog(gl.getAttachedShaders(pr)[1])||'link failed').slice(0,300);return}gl.useProgram(pr);
const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);const al=gl.getAttribLocation(pr,'a');gl.enableVertexAttribArray(al);gl.vertexAttribPointer(al,2,gl.FLOAT,false,0,0);
const U=n=>gl.getUniformLocation(pr,n),uRes=U('uRes'),uP=U('uP'),uT=U('uT'),uE=U('uE'),uA=U('uA'),uB=U('uB'),uBg=U('uBg'),uDim=U('uDim');gl.uniform1f(uDim,{nebula:.5,crystal:.62,solar:.5,abyss:.68,tunnel:.7,veil:.7,galaxy:.62,horizon:.62,synth:.7,magma:.62}[sid]||.6)*(cu?cu.dim/.6:1);
const th=THEME_CATALOG.find(t=>t.id===id).palette,spd=cu?cu.speed:1;gl.uniform3fv(uA,hex(th.accent));gl.uniform3fv(uB,hex(th['accent-2']));gl.uniform3fv(uBg,hex(th.bg));
const phone=innerWidth<800,weak=phone||(navigator.hardwareConcurrency||4)<=4||(navigator.deviceMemory||8)<=4;
const maxS=phone?.85:weak?.7:Math.min(window.devicePixelRatio||1,(navigator.hardwareConcurrency||4)>=8?2:1.5),minS=phone?.35:.35;let S=phone?.62:weak?.6:Math.min(maxS,(navigator.hardwareConcurrency||4)>=8?1.4:1.1);if(phone)gl.uniform1f(uDim,Math.min(.95,(+(gl.getUniform(pr,uDim))||.6)*1.3));
const gap=phone||weak?32:15;let W=0,H=0,raf=0,last=0,E=0,px=0,py=0,tx=0,ty=0,frames=0,acc=0,cnt=0,t0=performance.now();
const size=()=>{const k=Math.min(1,2560/(innerWidth*S));W=Math.max(2,Math.round(innerWidth*S*k));H=Math.max(2,Math.round(innerHeight*S*k));c.width=W;c.height=H;gl.viewport(0,0,W,H)};
const draw=now=>{const t=paused?9:(now-t0)/1000*spd;gl.uniform2f(uRes,W,H);gl.uniform2f(uP,px,py);gl.uniform1f(uT,t);gl.uniform1f(uE,E);gl.drawArrays(gl.TRIANGLES,0,3);frames++;c.dataset.frames=frames;c.dataset.scale=S.toFixed(2)};
const frame=now=>{raf=requestAnimationFrame(frame);if(document.hidden||now-last<gap)return;const dt=now-last;last=now;E*=.96;px+=(tx-px)*.04;py+=(ty-py)*.04;draw(now);
acc+=dt;cnt++;if(cnt>=24){const avg=acc/cnt;acc=0;cnt=0;if(avg>gap*1.5&&S>minS){S=Math.max(minS,S*.85);size()}else if(avg<gap*1.12&&S<maxS){S=Math.min(maxS,S*1.07);size()}}};
const bump=v=>()=>{E=Math.min(1,E+v)},move=e=>{tx=(e.clientX/innerWidth-.5)*2;ty=(e.clientY/innerHeight-.5)*2};const kd=bump(.28),fi=bump(.3),pd=bump(.4);
size();addEventListener('resize',size);
if(paused)draw(performance.now());else{addEventListener('pointermove',move,{passive:true});addEventListener('keydown',kd);addEventListener('focusin',fi);addEventListener('pointerdown',pd,{passive:true});raf=requestAnimationFrame(frame)}
return()=>{cancelAnimationFrame(raf);removeEventListener('resize',size);removeEventListener('pointermove',move);removeEventListener('keydown',kd);removeEventListener('focusin',fi);removeEventListener('pointerdown',pd);gl.getExtension('WEBGL_lose_context')?.loseContext()}},[paused,id,rev]);
return <canvas key={id+"-"+rev+"-"+paused} ref={ref} className="theme-scene cosmos" aria-hidden="true"/>}

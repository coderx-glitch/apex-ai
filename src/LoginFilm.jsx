import React from'react';
import{SceneCanvas,useReducedMotion}from'./CinemaScene.jsx';
export default function LoginFilm(){const paused=useReducedMotion();
return <><div className="login-bloom" aria-hidden="true"/><div className={"login-rays "+(!paused?"on":"")} aria-hidden="true"/><SceneCanvas paused={paused} className="login-film" cfg={{sc:.8,scM:1,off:[.03,-.02],offM:[0,.42],dim:.9,speed:1,hq:true}}/><div className="login-film-shade" aria-hidden="true"/></>}

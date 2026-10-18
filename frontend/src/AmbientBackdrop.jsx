import{localStore}from'../lib/browser-storage.js';
import{loadReading}from'../lib/reading.js';
import React,{useEffect,useState}from'react';
export default function AmbientBackdrop({paused=false}){const[hidden,H]=useState(()=>document.hidden);useEffect(()=>{document.documentElement.dataset.readingMotion=loadReading(localStore).motion;const update=()=>H(document.hidden);document.addEventListener('visibilitychange',update);return()=>document.removeEventListener('visibilitychange',update)},[]);return <div className={'ambient-backdrop '+(paused||hidden?'ambient-paused':'')} aria-hidden="true"><i className="ambient-light light-one"/><i className="ambient-light light-two"/><span className="ambient-grid"/></div>}

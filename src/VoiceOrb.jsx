import React,{useEffect,useRef,useState}from'react';
import{claimSpeech,speakBrowser,stopSpeech}from'../lib/speaker.js';
import{X,Mic,Square}from'lucide-react';

// Full-screen voice mode: one question at a time. The browser's own speech
// recognition hears the question, APEX answers in chat, and the browser's
// speech voice reads the reply out loud. Nothing runs in the background -
// closing or hiding this tab stops the microphone and the voice.
export default function VoiceOrb({onClose,onAsk,busy,reply,language,stamp}){
  const[phase,setPhase]=useState('idle'); // idle | listening | thinking | speaking | error
  const[heard,setHeard]=useState('');
  const[note,setNote]=useState('Tap the orb and ask your question.');
  const recognition=useRef(null);
  const askedAt=useRef(0);
  const previousReply=useRef(null);
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;

  useEffect(()=>{ // reset each time the overlay is opened
    setPhase('idle');setHeard('');setNote('Tap the orb and ask your question.');
    previousReply.current=reply?.id||null;
    return()=>{recognition.current?.abort();stopSpeech()};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[stamp]);

  useEffect(()=>{
    const hide=()=>{if(document.hidden){recognition.current?.abort();stopSpeech();setPhase('idle');setNote('Tab was hidden, so the microphone and voice stopped. Tap the orb to start again.')}};
    document.addEventListener('visibilitychange',hide);
    return()=>document.removeEventListener('visibilitychange',hide);
  },[]);

  useEffect(()=>{
    if(phase!=='thinking'||busy||!reply)return;
    if(reply.id===previousReply.current)return; // no new answer yet
    if(reply.error){setPhase('error');setNote(reply.content||'The request failed. Nothing was sent again automatically.');return}
    setPhase('speaking');setNote('Speaking the answer. Tap to stop.');
    if(!window.speechSynthesis){setPhase('idle');setNote('Spoken replies are unavailable in this browser. The answer is in chat.');return}
    const tok=claimSpeech(reply.content);
    if(tok===null){setPhase('idle');setNote('The answer is already being read out. Tap the orb for another question.');return}
    speakBrowser(reply.content,language||'en-IN',tok,err=>{setPhase('idle');setNote(err?'The voice could not play. The answer is in chat.':'Tap the orb for another question.')});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[phase,busy,reply]);

  function listen(){
    if(!SR){setPhase('error');setNote('Speech recognition is unavailable in this browser. Type your question in chat instead.');return}
    try{
      stopSpeech();
      const r=new SR();recognition.current=r;
      r.lang=language||'en-IN';r.continuous=false;r.interimResults=true;
      r.onstart=()=>{setPhase('listening');setHeard('');setNote('Listening. Ask your question, then pause.')};
      r.onresult=e=>{
        let text='';
        for(let i=0;i<e.results.length;i++)text+=e.results[i][0].transcript;
        setHeard(text);
        if(e.results[e.results.length-1].isFinal){
          recognition.current=null;
          r.onresult=null;r.onerror=null;r.onend=null;
          r.abort();
          previousReply.current=reply?.id||null;
          askedAt.current=Date.now();
          setPhase('thinking');setNote('Thinking. The answer appears in chat too.');
          onAsk(text.trim());
        }
      };
      r.onerror=e=>{recognition.current=null;setPhase('error');setNote(e.error==='not-allowed'?'Microphone permission was denied. Nothing was recorded or sent.':'Listening stopped: '+e.error+'. No question was sent.')};
      r.onend=()=>{setPhase(p=>p==='listening'?'idle':p);setNote(n=>n.startsWith('Listening')?'No speech came through. Tap to try again.':n)};
      r.start();
    }catch(e){setPhase('error');setNote('Microphone could not start: '+e.message)}
  }

  function tap(){
    if(phase==='idle'||phase==='error')listen();
    else if(phase==='listening'){recognition.current?.stop()}
    else if(phase==='speaking'){stopSpeech();setPhase('idle');setNote('Voice stopped. Tap the orb for another question.')}
  }

  function close(){recognition.current?.abort();stopSpeech();onClose()}

  return <div className={"voice-overlay "+phase} role="dialog" aria-label="APEX voice assistant">
    <button className="voice-close" aria-label="Close voice assistant" onClick={close}><X size={20}/></button>
    <div className="voice-stage">
      <button className="voice-orb" aria-label={phase==='listening'?'Stop listening':phase==='speaking'?'Stop speaking':'Tap to talk'} onClick={tap} disabled={phase==='thinking'}>
        <span className="orb-ring r1"/><span className="orb-ring r2"/><span className="orb-ring r3"/>
        <span className="orb-core">{phase==='listening'?<Square size={30}/>:<Mic size={34}/>}</span>
        <span className="orb-wave"><i/><i/><i/><i/><i/></span>
      </button>
      <p className="voice-status" role="status">{note}</p>
      {heard&&<p className="voice-heard">“{heard}”</p>}
      {phase==='speaking'&&reply&&<p className="voice-reply">{String(reply.content).slice(0,220)}{String(reply.content).length>220?'…':''}</p>}
    </div>
    <p className="voice-honest">Uses this browser's speech recognition and voice. Microphone starts only when you tap, hears one question at a time, and stops when this tab closes or goes to the background. Your question is sent as a normal chat message - guest and owner limits still apply.</p>
  </div>
}

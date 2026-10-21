export const VIDEO_MAX_BYTES=100*1024*1024;
export const CLIP_MAX_SECONDS=120;
export const TOTAL_MAX_SECONDS=240;
export const MAX_CLIPS=2;
export const VIDEO_FILTERS=[['none','No filter'],['grayscale(1)','Black & white'],['sepia(1)','Sepia'],['invert(1)','Invert'],['brightness(1.25)','Brighter'],['contrast(1.3)','More contrast'],['saturate(1.6)','Vivid colour']];
export function parseTimecode(text){
 const clean=String(text===undefined||text===null?'':text).trim();
 if(!clean)return 0;
 if(!/^\d{1,4}(\.\d{1,3})?(:\d{1,2}(\.\d{1,3})?)?$/.test(clean))throw Error('Use seconds or mm:ss, for example 75 or 1:15.');
 const parts=clean.split(':').map(Number);
 const seconds=parts.length===2?parts[0]*60+parts[1]:parts[0];
 if(!Number.isFinite(seconds)||seconds<0)throw Error('Time cannot be negative.');
 return seconds;
}
export function formatSeconds(seconds){
 const s=Math.max(0,Number(seconds)||0),m=Math.floor(s/60),r=s-m*60,whole=Math.round(r*10)/10;
 return m+':'+(whole<10?'0':'')+whole;
}
export function clampTrim(start,end,duration){
 if(!Number.isFinite(duration)||duration<=0)throw Error('The video length could not be read. The file may be corrupt or unsupported by this browser.');
 if(start<0||end<0)throw Error('Trim times cannot be negative.');
 if(end<=start)throw Error('Trim end must be after trim start.');
 if(end>duration+0.05)throw Error('Trim end is past the video length ('+formatSeconds(duration)+').');
 if(end-start>CLIP_MAX_SECONDS)throw Error('One clip can keep at most '+CLIP_MAX_SECONDS+' seconds. The full result is limited to '+(TOTAL_MAX_SECONDS/60)+' minutes.');
 return{start,end};
}
export function totalKept(clips){return clips.reduce((n,c)=>n+(c.end-c.start),0)}
export function checkTotal(clips){
 const total=totalKept(clips);
 if(total>TOTAL_MAX_SECONDS)throw Error('The kept parts total '+formatSeconds(total)+'. The limit is '+(TOTAL_MAX_SECONDS/60)+' minutes so the browser can hold the result in memory.');
 return total;
}

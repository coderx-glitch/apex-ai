export const READING_DEFAULTS={size:'standard',width:'standard',code:'scroll',motion:'full'};
export function readingPreferences(v){return{size:['standard','comfortable','large'].includes(v?.size)?v.size:'standard',width:['standard','wide'].includes(v?.width)?v.width:'standard',code:['scroll','wrap'].includes(v?.code)?v.code:'scroll',motion:['system','reduce','full'].includes(v?.motion)?v.motion:'full'}}
export function loadReading(storage){try{return readingPreferences(JSON.parse(storage.getItem('apex-reading')))}catch{return{...READING_DEFAULTS}}}

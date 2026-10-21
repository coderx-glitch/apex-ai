export const READING_DEFAULTS={size:'standard',width:'standard',code:'scroll',motion:'system'};
export function readingPreferences(v){return{size:['standard','comfortable','large'].includes(v?.size)?v.size:'standard',width:['standard','wide'].includes(v?.width)?v.width:'standard',code:['scroll','wrap'].includes(v?.code)?v.code:'scroll',motion:['system','reduce'].includes(v?.motion)?v.motion:'system'}}
export function loadReading(storage){try{return readingPreferences(JSON.parse(storage.getItem('apex-reading')))}catch{return{...READING_DEFAULTS}}}

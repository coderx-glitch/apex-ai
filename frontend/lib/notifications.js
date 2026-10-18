export const CATEGORIES={errors:'Errors & limits',tasks:'Task reminders',awards:'Game awards',downloads:'Download activity'};
export const DEFAULT_NOTIFICATION_SETTINGS={errors:true,tasks:true,awards:true,downloads:true,browser:false};
export function cleanNotifications(value){return Array.isArray(value)?value.filter(n=>n&&typeof n.id==='string'&&typeof n.title==='string'&&typeof n.time==='string'&&n.category in CATEGORIES).slice(0,200).map(n=>({id:n.id.slice(0,160),title:n.title.slice(0,160),body:String(n.body||'').slice(0,1000),time:n.time,category:n.category,read:!!n.read})):[]}
export function cleanNotificationSettings(value){return Object.fromEntries(Object.entries(DEFAULT_NOTIFICATION_SETTINGS).map(([key,def])=>[key,typeof value?.[key]==='boolean'?value[key]:def]))}
export function addNotification(list,event,settings){if(!settings[event.category]||list.some(n=>n.id===event.id))return list;return cleanNotifications([{...event,read:false},...list])}

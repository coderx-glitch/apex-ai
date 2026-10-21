// Resolve an attached plugin into a compact, clearly-labelled live-data block for chat context.
// Only already-approved plugins. Data is untrusted external content; the label says so.
import{parseWikiSearch,parseWikiSummary}from'./plugins.js';
import{geocodeUrl,parsePlaces,weatherUrl,parseWeather,frankfurterUrl,parseRates,openLibraryUrl,parseBooks,mealUrl,parseMeals,anilistBody,parseAnime,parseGNews,parseTmdb,parseMusic}from'./plugins.js';
export const CHAT_PLUGINS=[
{id:'weather',name:'Weather',hint:'place name, e.g. Delhi',keyless:true},
{id:'news',name:'News',hint:'topic, e.g. technology'},
{id:'movies',name:'Movies & TV',hint:'title or genre'},
{id:'music',name:'Music',hint:'song or artist'},
{id:'anime',name:'Anime',hint:'title',keyless:true},
{id:'books',name:'Books',hint:'title or author',keyless:true},
{id:'currency',name:'Currency',hint:'e.g. USD to INR',keyless:true},
{id:'recipes',name:'Recipes',hint:'dish or ingredient',keyless:true},
{id:'youtube',name:'YouTube',hint:'search terms'},
{id:'nasa',name:'Space (NASA)',hint:'today\'s astronomy picture'},
{id:'stocks',name:'Stock images',hint:'subject, e.g. mountains'},
{id:'wikipedia',name:'Wikipedia',hint:'topic, e.g. Mars missions'}];
async function getJson(url,opts){const r=await fetch(url,opts);if(!r.ok)throw Error('HTTP '+r.status);return r.json()}
async function serverPlugin(kind,q,extra){const r=await fetch('/api/connect',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider:'plugins',kind,q,...extra})});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||('HTTP '+r.status));return d}
export async function resolvePluginData(id,query){
 const q=String(query||'').trim();
 if(id==='weather'){if(!q)throw Error('Weather needs a place name.');const places=parsePlaces(await getJson(geocodeUrl(q)));if(!places.length)throw Error('No place found for "'+q+'".');const p=places[0];const w=parseWeather(await getJson(weatherUrl(p.lat,p.lon)));return 'Live weather for '+p.name+(p.region?' ('+p.region+')':'')+': now '+w.now.temperature+'°C, feels '+w.now.feelsLike+'°C, '+w.now.label+', humidity '+w.now.humidity+'%, wind '+w.now.wind+' km/h.'}
 if(id==='currency'){const m=/([A-Za-z]{3})\s*(to|in|\/|-)\s*([A-Za-z]{3})/.exec(q);const from=m?m[1].toUpperCase():'USD',to=m?m[3].toUpperCase():'INR';const d=parseRates(await getJson(frankfurterUrl(from,to)));const v=d.rates[to];if(v==null)throw Error('Rate not available for '+from+' to '+to+'.');return 'Live exchange rate ('+d.date+'): 1 '+from+' = '+v+' '+to+'.'}
 if(id==='books'){const items=parseBooks(await getJson(openLibraryUrl(q||'bestsellers')));if(!items.length)throw Error('No books found.');return 'Book results for "'+(q||'bestsellers')+'":\n'+items.slice(0,6).map((b,i)=>(i+1)+'. '+b.title+' - '+b.author+(b.year?' ('+b.year+')':'')+' '+b.url).join('\n')}
 if(id==='recipes'){const meals=parseMeals(await getJson(mealUrl('search',q||'paneer')));if(!meals.length)throw Error('No recipes found.');return 'Recipe results for "'+(q||'paneer')+'":\n'+meals.slice(0,5).map((m,i)=>(i+1)+'. '+m.name+(m.category?' ['+m.category+']':'')).join('\n')}
 if(id==='anime'){const d=await getJson('https://graphql.anilist.co',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(anilistBody(q||'naruto'))});const items=parseAnime(d);if(!items.length)throw Error('No anime found.');return 'Anime results for "'+(q||'naruto')+'":\n'+items.slice(0,6).map((a,i)=>(i+1)+'. '+a.title+(a.year?' ('+a.year+')':'')+(a.score?' score '+a.score+'%':'')).join('\n')}
 if(id==='news'){const d=await serverPlugin('news',q||'technology');const items=parseGNews(d.data||d);if(!items.length)throw Error('No news found.');return 'Latest news for "'+(q||'technology')+'":\n'+items.slice(0,5).map((a,i)=>(i+1)+'. '+a.title+' - '+a.source+' '+a.url).join('\n')}
 if(id==='movies'){const d=await serverPlugin('movies',q||'popular');const items=parseTmdb(d.data||d);if(!items.length)throw Error('No movies found.');return 'Movie/TV results for "'+(q||'popular')+'":\n'+items.slice(0,6).map((m,i)=>(i+1)+'. '+m.title+(m.year?' ('+m.year+')':'')).join('\n')}
 if(id==='music'){const d=await serverPlugin('music',q||'lofi');const items=parseMusic(d.data||d);if(!items.length)throw Error('No tracks found.');return 'Music results for "'+(q||'lofi')+'":\n'+items.slice(0,6).map((t,i)=>(i+1)+'. '+t.name+' - '+t.artists+' '+t.url).join('\n')}
 if(id==='youtube'){const d=await serverPlugin('youtube',q||'lofi');const items=((d.data||d).items||[]).filter(x=>x.id&&x.id.videoId);if(!items.length)throw Error('No videos found.');return 'YouTube results for "'+(q||'lofi')+'":\n'+items.slice(0,5).map((v,i)=>(i+1)+'. '+v.snippet.title+' - https://www.youtube.com/watch?v='+v.id.videoId).join('\n')}
 if(id==='nasa'){const d=await serverPlugin('nasa','apod');const a=(d.data||d).apod||d.data||d;return 'NASA astronomy picture of the day: "'+(a.title||'')+'". '+(String(a.explanation||'').slice(0,600))+(a.url?' Image: '+a.url:'')}
 if(id==='stocks'){const d=await serverPlugin('pixabay',q||'mountains');const items=((d.data||d).hits||[]).slice(0,5);if(!items.length)throw Error('No images found.');return 'Free stock images for "'+(q||'mountains')+'":\n'+items.map((h,i)=>(i+1)+'. '+(h.tags||'image')+' - '+h.pageURL).join('\n')}
 if(id==='wikipedia'){if(!q)throw Error('Wikipedia needs a topic.');const s=await serverPlugin('wikipedia',q);const results=parseWikiSearch(s);if(!results.length)throw Error('No Wikipedia article found.');const sum=parseWikiSummary(await serverPlugin('wikipedia','',{which:'summary',title:results[0].title}));return 'Wikipedia summary for "'+sum.title+'": '+sum.extract+' Source: '+sum.url}
 throw Error('Unknown plugin.');
}

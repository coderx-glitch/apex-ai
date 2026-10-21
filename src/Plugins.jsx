import React,{useState,useEffect,useRef}from'react';
import{parseWikiSearch,parseWikiSummary}from'../lib/plugins.js';
import{geocodeUrl,parsePlaces,weatherUrl,parseWeather,mealUrl,parseMeals,parseCategories,parseGNews,parseTmdb,parseProviders,parseMusic,anilistBody,parseAnime,parseYouTube,parseApod,parseNeows,parsePixabay,frankfurterUrl,parseRates,openLibraryUrl,parseBooks}from'../lib/plugins.js';
async function getJson(url,opts){const r=await fetch(url,{...opts,signal:AbortSignal.timeout(20000)});const d=await r.json().catch(()=>null);if(!r.ok||!d)throw Error('The free service did not answer. Check the network and try again.');return d}
function postGraphQL(url,body){return getJson(url,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(body)})}
async function keyed(kind,q){const r=await fetch('/api/connect',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider:'plugins',kind,q})});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'Plugin request failed.');return d}
function Weather(){
 const[query,Q]=useState(''),[places,PL]=useState(null),[weather,W]=useState(null),[place,P]=useState(null),[error,E]=useState(''),[busy,B]=useState(false),[geoNote,GN]=useState('');
 async function find(e){e?.preventDefault();E('');W(null);PL(null);B(true);try{const list=parsePlaces(await getJson(geocodeUrl(query)));if(!list.length)throw Error('No place matched that name. Try a nearby city.');PL(list);if(list.length===1)pick(list[0])}catch(err){E(err.message)}finally{B(false)}}
 async function pick(p){P(p);PL(null);E('');B(true);try{W(parseWeather(await getJson(weatherUrl(p.lat,p.lon))))}catch(err){E(err.message)}finally{B(false)}}
 function locate(){E('');GN('');if(!navigator.geolocation){GN('This browser has no geolocation. Type a place name instead.');return}B(true);navigator.geolocation.getCurrentPosition(async pos=>{try{const p={name:'Your spot',region:'from this browser',lat:pos.coords.latitude,lon:pos.coords.longitude};await pick(p)}catch(err){E(err.message)}finally{B(false)}},()=>{B(false);GN('Location was not shared. Type a place name instead - nothing was sent anywhere.')},{timeout:8000})}
 return <section className="settings-card"><h3>Weather</h3><p>Live weather and a 3-day outlook from the free Open-Meteo service. No key or account. Your search goes straight from this browser to Open-Meteo.</p>
 <form onSubmit={find} className="plugin-row"><input aria-label="Place name" value={query} maxLength={100} placeholder="City or town, e.g. Gurugram" onChange={e=>Q(e.target.value)}/><button className="primary" disabled={busy||query.trim().length<2}>Check weather</button><button type="button" disabled={busy} onClick={locate}>Use my location</button></form>
 {geoNote&&<p role="status">{geoNote}</p>}
 {places&&<div className="plugin-places" role="list">{places.map(p=><button key={p.name+p.region} onClick={()=>pick(p)}>{p.name}<small>{p.region}</small></button>)}</div>}
 {weather&&place&&<div className="plugin-weather"><h4>{place.name}{place.region?' · '+place.region:''}</h4><p className="weather-now"><b>{Math.round(weather.now.temperature)}°C</b> {weather.now.label}</p><p>Feels like {Math.round(weather.now.feelsLike)}°C · Humidity {weather.now.humidity}% · Wind {Math.round(weather.now.wind)} km/h</p>
 <div className="weather-days">{weather.days.map(d=><div key={d.date}><strong>{new Date(d.date+'T12:00:00').toLocaleDateString(undefined,{weekday:'short'})}</strong><span>{d.label}</span><span>{Math.round(d.max)}° / {Math.round(d.min)}°</span><span>Rain {d.rainChance??0}%</span></div>)}</div></div>}
 {error&&<p role="alert" className="error">{error}</p>}
 <small>Weather data: Open-Meteo.com, free for non-commercial use.</small></section>;
}
function Recipes(){
 const[query,Q]=useState(''),[meals,M]=useState(null),[open,O]=useState(null),[error,E]=useState(''),[busy,B]=useState(false);
 async function search(e,random){e?.preventDefault();E('');M(null);B(true);try{const list=parseMeals(await getJson(mealUrl(random?'random':'search',query)));if(!list.length)throw Error('No recipe matched. Try another dish or ingredient.');M(list)}catch(err){E(err.message)}finally{B(false)}}
 async function expand(id){if(open&&open.id===id){O(null);return}B(true);E('');try{const list=parseMeals(await getJson(mealUrl('lookup',id)));O(list[0]||null)}catch(err){E(err.message)}finally{B(false)}}
 return <section className="settings-card"><h3>Recipes</h3><p>Search a public recipe box by dish or ingredient. Uses the free shared TheMealDB test key, so heavy traffic can rate-limit it - if it stalls, wait a minute and retry. Full instructions open right here.</p>
 <form onSubmit={search} className="plugin-row"><input aria-label="Dish or ingredient" value={query} maxLength={60} placeholder="e.g. paneer, pasta, cake" onChange={e=>Q(e.target.value)}/><button className="primary" disabled={busy||query.trim().length<2}>Find recipes</button><button type="button" disabled={busy} onClick={e=>search(e,true)}>Surprise me</button></form>
 {meals&&<div className="plugin-meals">{meals.map(m=><div key={m.id} className="meal-row"><button onClick={()=>expand(m.id)} aria-expanded={open&&open.id===m.id}>{m.thumb&&<img src={m.thumb} alt="" loading="lazy"/>}<span><strong>{m.name}</strong><small>{[m.category,m.area].filter(Boolean).join(' · ')}</small></span></button>{open&&open.id===m.id&&<div className="meal-detail"><h4>Ingredients</h4><ul>{open.ingredients.map((x,i)=><li key={i}>{x}</li>)}</ul><h4>Method</h4><p>{open.instructions||'No written method on this one.'}</p>{open.source&&<a href={open.source} target="_blank" rel="noopener noreferrer">Original recipe page</a>}</div>}</div>)}</div>}
 {error&&<p role="alert" className="error">{error}</p>}
 <small>Recipe data: TheMealDB (free shared test key).</small></section>;
}

const CURRENCIES=['INR','USD','EUR','GBP','JPY','AED','SGD','AUD','CAD','CNY'];
function Anime(){const[query,Q]=useState(''),[items,I]=useState(null),[error,E]=useState(''),[busy,B]=useState(false);
 async function run(e){e?.preventDefault();E('');I(null);B(true);try{I(parseAnime(await postGraphQL('https://graphql.anilist.co',anilistBody(query.trim()))))}catch(err){E(err.message)}finally{B(false)}}
 return <section className="settings-card"><h3>Anime</h3><p>Look up anime series and films - episode counts, scores and summaries from the free AniList service. No key or account.</p>
 <form onSubmit={run} className="plugin-row"><input aria-label="Anime search" value={query} maxLength={80} placeholder="e.g. Naruto, Your Name" onChange={e=>Q(e.target.value)}/><button className="primary" disabled={busy||query.trim().length<2}>Search anime</button></form>
 {items&&(items.length?<div className="plugin-movies">{items.map((a,i)=><div key={i} className="movie-row">{a.image&&<img src={a.image} alt="" loading="lazy"/>}<div><strong>{a.title}{a.year?' ('+a.year+')':''}</strong><small>{a.kind}{a.episodes?' · '+a.episodes+' episodes':''}{a.score?' · AniList score '+a.score+'/10':''}</small>{a.synopsis&&<p>{a.synopsis}</p>}<a href={a.url} target="_blank" rel="noopener noreferrer">Full page</a></div></div>)}</div>:<p role="status">Nothing matched. Try different words.</p>)}
 {error&&<p role="alert" className="error">{error}</p>}
 <small>Anime data: AniList, free public API.</small></section>;
}

function Wiki(){const[query,Q]=useState(''),[results,R]=useState(null),[summary,S]=useState(null),[error,E]=useState(''),[busy,B]=useState(false);
 async function call(body){const r=await fetch('/api/connect',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider:'plugins',kind:'wikipedia',...body})});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||('HTTP '+r.status));return d}
 async function run(e){e?.preventDefault();E('');R(null);S(null);B(true);try{R(parseWikiSearch(await call({q:query.trim()})))}catch(err){E(err.message)}finally{B(false)}}
 async function openArticle(title){E('');S(null);B(true);try{S(parseWikiSummary(await call({which:'summary',title})))}catch(err){E(err.message)}finally{B(false)}}
 return <section className="settings-card"><h3>Wikipedia</h3><p>Search Wikipedia and read article summaries. Keyless; requests go through the server with the user-agent Wikipedia asks for. Summaries stay under their license - the article link is the required credit.</p>
 <form onSubmit={run} className="plugin-row"><input aria-label="Wikipedia search" value={query} maxLength={80} placeholder="Topic, e.g. Mars missions" onChange={e=>Q(e.target.value)}/><button className="primary" disabled={busy||query.trim().length<2}>Search Wikipedia</button></form>
 {results&&(results.length?<div className="plugin-movies">{results.map((r,i)=><div key={i} className="movie-row"><div><strong>{r.title}</strong><small>{r.snippet}</small><button className="subtle" disabled={busy} onClick={()=>openArticle(r.title)}>Read summary</button></div></div>)}</div>:<p role="status">Nothing matched. Try different words.</p>)}
 {summary&&<article className="wiki-summary">{summary.image&&<img src={summary.image} alt="" loading="lazy"/>}<h4>{summary.title}</h4><p>{summary.extract}</p><a href={summary.url} target="_blank" rel="noopener noreferrer">Read the full article on Wikipedia</a></article>}
 {error&&<p role="alert" className="error">{error}</p>}
 </section>}

function Books(){const[query,Q]=useState(''),[items,I]=useState(null),[error,E]=useState(''),[busy,B]=useState(false);
 async function run(e){e?.preventDefault();E('');I(null);B(true);try{I(parseBooks(await getJson(openLibraryUrl(query.trim()))))}catch(err){E(err.message)}finally{B(false)}}
 return <section className="settings-card"><h3>Books</h3><p>Search the Open Library catalog - titles, authors, first publish year and a page to read or borrow. Free, no key.</p>
 <form onSubmit={run} className="plugin-row"><input aria-label="Book search" value={query} maxLength={80} placeholder="Book or author, e.g. Ruskin Bond" onChange={e=>Q(e.target.value)}/><button className="primary" disabled={busy||query.trim().length<2}>Find books</button></form>
 {items&&(items.length?<div className="plugin-movies">{items.map((b,i)=><div key={i} className="movie-row">{b.cover&&<img src={b.cover} alt="" loading="lazy"/>}<div><strong>{b.title}</strong><small>{b.author}{b.year?' · '+b.year:''}</small><a href={b.url} target="_blank" rel="noopener noreferrer">Open Library page</a></div></div>)}</div>:<p role="status">Nothing matched. Try different words.</p>)}
 {error&&<p role="alert" className="error">{error}</p>}
 <small>Book data: Open Library (Internet Archive).</small></section>;
}
function Currency(){const[amount,A]=useState('100'),[from,F]=useState('USD'),[to,T2]=useState('INR'),[out,O]=useState(null),[error,E]=useState(''),[busy,B]=useState(false);
 async function run(e){e?.preventDefault();E('');O(null);const amt=Number(amount);if(!isFinite(amt)||amt<0){E('Enter a valid amount.');return}if(from===to){E('Pick two different currencies.');return}B(true);try{const d=parseRates(await getJson(frankfurterUrl(from,to)));const rate=d.rates[to];if(typeof rate!=='number')throw Error('That currency pair is not available.');O({rate,total:Math.round(amt*rate*100)/100,date:d.date})}catch(err){E(err.message)}finally{B(false)}}
 return <section className="settings-card"><h3>Currency</h3><p>Live exchange rates from the free Frankfurter service - European Central Bank reference rates, updated on working days. No key.</p>
 <form onSubmit={run} className="plugin-row"><input aria-label="Amount" value={amount} inputMode="decimal" maxLength={12} onChange={e=>A(e.target.value)}/><select aria-label="From currency" value={from} onChange={e=>F(e.target.value)}>{CURRENCIES.map(c=><option key={c} value={c}>{c}</option>)}</select><select aria-label="To currency" value={to} onChange={e=>T2(e.target.value)}>{CURRENCIES.map(c=><option key={c} value={c}>{c}</option>)}</select><button className="primary" disabled={busy}>Convert</button></form>
 {out&&<p className="weather-now"><b>{out.total.toLocaleString(undefined,{maximumFractionDigits:2})} {to}</b> <small>1 {from} = {out.rate} {to} · rate date {out.date}</small></p>}
 {error&&<p role="alert" className="error">{error}</p>}
 <small>Rates: Frankfurter / European Central Bank.</small></section>;
}

function PixabayImg({url,alt}){
 const[src_,S]=useState(''),[failed,F]=useState(false);
 useEffect(()=>{let on=true;(async()=>{try{const r=await fetch('/api/connect',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider:'plugins',kind:'pixabay-image',url})});const d=await r.json().catch(()=>({}));if(on&&r.ok&&d.data)S('data:'+(d.mime||'image/jpeg')+';base64,'+d.data);else if(on)F(true)}catch{if(on)F(true)}})();return()=>{on=false}},[url]);
 if(failed)return <span className="stock-fallback">Preview unavailable. Open the source link below.</span>;
 return src_?<img src={src_} alt={alt||''} loading="lazy" onError={()=>F(true)}/>:<span className="stock-loading">Loading…</span>;
}
function YouTube(){
 const[query,Q]=useState(''),[items,I]=useState(null),[playing,PL]=useState(null),[error,E]=useState(''),[busy,B]=useState(false);
 async function run(e){e?.preventDefault();E('');I(null);PL(null);B(true);try{const r=await fetch('/api/connect',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider:'plugins',kind:'youtube',q:query.trim()})});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'YouTube search failed.');I(parseYouTube(d))}catch(err){E(err.message)}finally{B(false)}}
 return <section className="settings-card"><h3>YouTube</h3><p>Search YouTube and play videos right here - no ads in this player, nothing is downloaded. Uses the free YouTube Data key the owner added (10,000 quota units a day).</p>
 <form onSubmit={run} className="plugin-row"><input aria-label="YouTube search" value={query} maxLength={100} placeholder="Search YouTube, e.g. lo-fi study mix" onChange={e=>Q(e.target.value)}/><button className="primary" disabled={busy||query.trim().length<2}>Search videos</button></form>
 {playing&&<div className="yt-player"><h4>{playing.title}</h4><div className="yt-frame"><iframe src={'https://www.youtube-nocookie.com/embed/'+playing.id+'?autoplay=1'} title={playing.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen/></div><button onClick={()=>PL(null)}>Close player</button></div>}
 {items&&(items.length?<div className="plugin-movies">{items.map(v=><div key={v.id} className="movie-row">{v.thumb&&<img src={v.thumb} alt="" loading="lazy"/>}<div><strong>{v.title}</strong><small>{v.channel}{v.published?' · '+new Date(v.published).toLocaleDateString():''}</small><p><button onClick={()=>PL(v)}>Play here</button> <a href={'https://www.youtube.com/watch?v='+v.id} target="_blank" rel="noopener noreferrer">Open on YouTube</a></p></div></div>)}</div>:<p role="status">Nothing matched. Try different words.</p>)}
 {error&&<p role="alert" className="error">{error}</p>}
 <small>Search results: YouTube Data API. Videos belong to their channels.</small></section>;
}
function Space(){
 const[apod,A]=useState(null),[neos,N]=useState(null),[error,E]=useState(''),[busy,B]=useState('');
 async function run(which){E('');B(which);try{const r=await fetch('/api/connect',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider:'plugins',kind:'nasa',which})});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'The space service did not answer.');if(which==='apod')A(parseApod(d));else N(parseNeows(d))}catch(err){E(err.message)}finally{B('')}}
 return <section className="settings-card"><h3>Space</h3><p>Request NASA's daily astronomy image or today's near-earth object data. The free service can be unavailable; errors are shown without substitute data.</p>
 <div className="plugin-row"><button className="primary" disabled={!!busy} onClick={()=>run('apod')}>{busy==='apod'?'Loading…':"Today's space photo"}</button><button disabled={!!busy} onClick={()=>run('neows')}>{busy==='neows'?'Loading…':'Asteroids today'}</button></div>
 {apod&&<div className="plugin-weather"><h4>{apod.title}{apod.date?' · '+apod.date:''}</h4>{apod.mediaType==='video'?<p><a href={apod.url} target="_blank" rel="noopener noreferrer">Watch today's video</a></p>:apod.url&&<p><a href={apod.url} target="_blank" rel="noopener noreferrer"><img src={apod.url} alt={apod.title} loading="lazy" style={{maxWidth:'100%',borderRadius:'8px'}}/></a></p>}<p>{apod.explanation}</p><small>Credit: {apod.credit}</small></div>}
 {neos&&<div className="plugin-movies">{neos.map((n,i)=><div key={i} className="movie-row"><div><strong>{n.name}</strong><small>{n.size?('about '+n.size+' m wide · '):''}{n.speed.toLocaleString()+' km/h'} · {n.distance.toLocaleString()+' km away'}</small>{n.hazardous&&<p className="watch-line">Flagged by NASA as potentially hazardous - that only means its orbit is tracked closely.</p>}</div></div>)}</div>}
 {error&&<p role="alert" className="error">{error}</p>}
 <small>Data: NASA open APIs (api.nasa.gov).</small></section>;
}
function Stock(){
 const[query,Q]=useState(''),[kind,K]=useState('photos'),[items,I]=useState(null),[error,E]=useState(''),[busy,B]=useState(false);
 async function run(e,video){e?.preventDefault();const v=typeof video==='boolean'?video:kind==='videos';K(v?'videos':'photos');E('');I(null);B(true);try{const r=await fetch('/api/connect',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider:'plugins',kind:'pixabay',q:query.trim(),video:v})});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'Stock search failed.');I(parsePixabay(d,v))}catch(err){E(err.message)}finally{B(false)}}
 return <section className="settings-card"><h3>Stock photos & video</h3><p>Search Pixabay photos and short clips. Small photo previews are mirrored through APEX; open the source link for the original and its license. Videos play directly. Provider limits can make a preview unavailable.</p>
 <form onSubmit={e=>run(e)} className="plugin-row"><input aria-label="Stock search" value={query} maxLength={80} placeholder="e.g. monsoon, workspace, mountains" onChange={e=>Q(e.target.value)}/><button className="primary" disabled={busy||query.trim().length<2}>Photos</button><button disabled={busy||query.trim().length<2} onClick={e=>run(e,true)}>Videos</button></form>
 {items&&(items.length?<div className="stock-grid">{items.map(h=><div key={h.id} className="stock-cell">{kind==='videos'?<video src={h.thumb} controls preload="none" muted playsInline/>:<PixabayImg url={h.thumb} alt={query}/>}<small><a href={h.page} target="_blank" rel="noopener noreferrer">{h.author}</a></small></div>)}</div>:<p role="status">Nothing matched. Try different words.</p>)}
 {error&&<p role="alert" className="error">{error}</p>}
 <small>Content: Pixabay, free to use under the Pixabay Content License.</small></section>;
}
function Keyed({kind,title,intro,placeholder,button,renderItems,credit}){
 const[query,Q]=useState(''),[items,I]=useState(null),[error,E]=useState(''),[busy,B]=useState(false),[note,N]=useState('');
 async function run(e){e?.preventDefault();E('');I(null);B(true);try{const d=await keyed(kind,query.trim());N(d.note||'');I(renderItems.parse(d))}catch(err){E(err.message)}finally{B(false)}}
 return <section className="settings-card"><h3>{title}</h3><p>{intro}</p>
 <form onSubmit={run} className="plugin-row"><input aria-label={title+' search'} value={query} maxLength={120} placeholder={placeholder} onChange={e=>Q(e.target.value)}/><button className="primary" disabled={busy||kind!=='news'&&query.trim().length<2}>{button}</button></form>
 {note&&<p role="status">{note}</p>}
 {items&&(items.length?renderItems.view(items):<p role="status">Nothing matched. Try different words.</p>)}
 {error&&<p role="alert" className="error">{error}</p>}
 <small>{credit}</small></section>;
}
const tabs=[['weather','Weather'],['recipes','Recipes'],['news','News briefing'],['movies','Movies & TV'],['music','Music'],['anime','Anime'],['books','Books'],['currency','Currency'],['youtube','YouTube'],['space','Space'],['stock','Stock'],['wiki','Wikipedia']];
export default function Plugins({onLog}){
 const[tab,T]=useState('weather');
 useEffect(()=>{onLog?.('Plugins opened','Free public data lookups')},[]);
 const META={weather:['Live weather & 3-day outlook','No key','Open-Meteo'],recipes:['Dish & ingredient recipes','No key','TheMealDB'],news:['Topic briefing & headlines','Server key','GNews free tier'],movies:['Movie & TV search + where to watch','Server key','TMDB'],music:['Song search with 30s previews','Keyless chain','Deezer / iTunes'],anime:['Anime search, scores & episodes','No key','AniList'],books:['Book catalog search','No key','Open Library'],currency:['Live exchange rates','No key','Frankfurter'],youtube:['Video search + in-app player','Server key','YouTube Data API'],space:['Astronomy picture & near-earth objects','Server key','NASA'],stock:['Free stock photos','Server key','Pixabay'],wiki:['Encyclopedia search & summaries','No key','Wikipedia']};
 return <div className="plugins-page"><section className="media-intro"><span className="eyebrow">APEX PLUGINS</span><h2>Plugin library</h2><p>Live data services, all free tiers. Keyless tools talk to the source straight from this browser; keyed tools call through the APEX server so keys never touch this browser.</p></section>
 <div className="plugin-grid" role="tablist" aria-label="Plugin tools">{tabs.map(([id,label])=>{const m=META[id]||['','',''];return <button key={id} role="tab" aria-selected={tab===id} className={'plugin-card'+(tab===id?' active':'')} onClick={()=>T(id)}><strong>{label}</strong><span>{m[0]}</span><small><em>{m[1]}</em>{m[2]}</small></button>})}</div>
 {tabs.map(([id])=><div key={id} role="tabpanel" hidden={tab!==id}>
 {id==='weather'&&<Weather/>}
 {id==='anime'&&<Anime/>}
 {id==='youtube'&&<YouTube/>}
 {id==='space'&&<Space/>}
 {id==='stock'&&<Stock/>}
 {id==='wiki'&&<Wiki/>}
 {id==='books'&&<Books/>}
 {id==='currency'&&<Currency/>}
 {id==='recipes'&&<Recipes/>}
 {id==='news'&&<Keyed kind="news" title="News briefing" intro="Top headlines, or a topic search, from the free GNews service (100 requests a day on the free tier). Links open the original publisher - nothing is rewritten or summarized by AI here." placeholder="Topic, e.g. cricket, space, India tech" button="Get briefing" credit="News links: GNews free tier. Articles belong to their publishers." renderItems={{parse:parseGNews,view:items=><ul className="plugin-news">{items.map((a,i)=><li key={i}><a href={a.url} target="_blank" rel="noopener noreferrer">{a.title}</a><small>{a.source}{a.publishedAt?' · '+new Date(a.publishedAt).toLocaleString():''}</small>{a.description&&<p>{a.description}</p>}</li>)}</ul>}}/>}
 {id==='movies'&&<Keyed kind="movies" title="Movies & TV" intro="Search titles and see where they stream in India, from the free TMDB service. Ratings shown are TMDB community scores, not APEX picks." placeholder="Movie or show name" button="Search titles" credit="This product uses the TMDB API but is not endorsed or certified by TMDB. Where-to-watch data: JustWatch." renderItems={{parse:d=>parseTmdb(d).map(r=>({...r,providers:(d.providers||{})[r.kind+'-'+r.id]||null})),view:items=><div className="plugin-movies">{items.map((m,i)=><div key={i} className="movie-row">{m.poster&&<img src={m.poster} alt="" loading="lazy"/>}<div><strong>{m.title}{m.year?' ('+m.year+')':''}</strong><small>{m.kind==='tv'?'TV show':'Movie'}{m.rating!==null?' · TMDB score '+m.rating+'/10':''}</small>{m.overview&&<p>{m.overview}</p>}{m.providers?<p className="watch-line">{m.providers.stream.length?'Stream: '+m.providers.stream.join(', '):''}{m.providers.rent.length?(m.providers.stream.length?' · ':'')+'Rent: '+m.providers.rent.join(', '):''}{!m.providers.stream.length&&!m.providers.rent.length?'No India streaming listing found.':''} {m.providers.link&&<a href={m.providers.link} target="_blank" rel="noopener noreferrer">All options</a>}</p>:<p className="watch-line">Where-to-watch was not fetched for this one.</p>}</div></div>)}</div>}}/>}
 {id==='music'&&<Keyed kind="music" title="Music search" intro="Find tracks, hear 30-second previews and open them in a music app. Metadata, previews and links only - no playback of full songs, no account reading." placeholder="Song, artist or album" button="Search music" credit="Music data and previews: free public music catalogs." renderItems={{parse:parseMusic,view:items=><ul className="plugin-music">{items.map((t,i)=><li key={i}>{t.image&&<img src={t.image} alt="" loading="lazy"/>}<span><a href={t.url} target="_blank" rel="noopener noreferrer">{t.name}</a><small>{t.artists}{t.album?' · '+t.album:''}</small>{t.preview&&<audio controls preload="none" src={t.preview}/>}</span></li>)}</ul>}}/>}
 </div>)}
 </div>;
}

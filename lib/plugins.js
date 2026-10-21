export const WEATHER_CODES={0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Fog',48:'Icy fog',51:'Light drizzle',53:'Drizzle',55:'Heavy drizzle',56:'Light freezing drizzle',57:'Freezing drizzle',61:'Light rain',63:'Rain',65:'Heavy rain',66:'Light freezing rain',67:'Freezing rain',71:'Light snow',73:'Snow',75:'Heavy snow',77:'Snow grains',80:'Light rain showers',81:'Rain showers',82:'Heavy rain showers',85:'Light snow showers',86:'Snow showers',95:'Thunderstorm',96:'Thunderstorm with light hail',99:'Thunderstorm with heavy hail'};
export function geocodeUrl(name){
 const q=String(name||'').trim();
 if(q.length<2||q.length>100)throw Error('Type a place name, 2-100 letters.');
 return 'https://geocoding-api.open-meteo.com/v1/search?count=5&language=en&format=json&name='+encodeURIComponent(q);
}
export function parsePlaces(json){
 const list=(json&&json.results)||[];
 return list.slice(0,5).map(p=>({name:String(p.name||''),region:[p.admin1,p.country].filter(Boolean).join(', '),lat:p.latitude,lon:p.longitude})).filter(p=>p.name&&Number.isFinite(p.lat)&&Number.isFinite(p.lon));
}
export function weatherUrl(lat,lon){
 if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)throw Error('Coordinates look wrong.');
 return 'https://api.open-meteo.com/v1/forecast?latitude='+lat+'&longitude='+lon+'&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=3&timezone=auto';
}
export function weatherLabel(code){return WEATHER_CODES[code]||'Unknown ('+code+')'}
export function parseWeather(json){
 const c=json&&json.current,d=json&&json.daily;
 if(!c||!d||!Array.isArray(d.time))throw Error('Weather reply was incomplete. Try again.');
 return{now:{temperature:c.temperature_2m,feelsLike:c.apparent_temperature,humidity:c.relative_humidity_2m,wind:c.wind_speed_10m,label:weatherLabel(c.weather_code)},days:d.time.map((date,i)=>({date,label:weatherLabel((d.weather_code||[])[i]),max:(d.temperature_2m_max||[])[i],min:(d.temperature_2m_min||[])[i],rainChance:(d.precipitation_probability_max||[])[i]}))};
}
export function mealUrl(kind,query){
 const base='https://www.themealdb.com/api/json/v1/1/';
 if(kind==='search'){const q=String(query||'').trim();if(q.length<2||q.length>60)throw Error('Type a dish or ingredient, 2-60 letters.');return base+'search.php?s='+encodeURIComponent(q)}
 if(kind==='random')return base+'random.php';
 if(kind==='categories')return base+'categories.php';
 if(kind==='lookup'){if(!/^\d+$/.test(String(query||'')))throw Error('Recipe id missing.');return base+'lookup.php?i='+query}
 throw Error('Unknown recipe lookup.');
}
export function parseMeal(m){
 if(!m||!m.idMeal)return null;
 const ingredients=[];
 for(let i=1;i<=20;i++){const item=(m['strIngredient'+i]||'').trim(),measure=(m['strMeasure'+i]||'').trim();if(item)ingredients.push((measure?measure+' ':'')+item)}
 return{id:m.idMeal,name:m.strMeal||'Untitled',category:m.strCategory||'',area:m.strArea||'',thumb:m.strMealThumb||'',instructions:String(m.strInstructions||'').trim(),ingredients,source:m.strSource||'',youtube:m.strYoutube||''};
}
export function parseMeals(json){const list=(json&&json.meals)||[];return list.map(parseMeal).filter(Boolean)}
export function parseCategories(json){const list=(json&&json.categories)||[];return list.map(c=>({name:c.strCategory||'',thumb:c.strCategoryThumb||'',description:String(c.strCategoryDescription||'').slice(0,160)})).filter(c=>c.name)}
export function parseGNews(json){
 const list=(json&&json.articles);
 if(!Array.isArray(list))throw Error('News reply was incomplete.');
 return list.slice(0,10).map(a=>({title:String(a.title||''),description:String(a.description||''),url:String(a.url||''),source:(a.source&&a.source.name)||'',publishedAt:a.publishedAt||'',image:a.image||''})).filter(a=>a.title&&a.url);
}
export function parseTmdb(json){
 const list=(json&&json.results);
 if(!Array.isArray(list))throw Error('Movie reply was incomplete.');
 return list.filter(r=>r.media_type==='movie'||r.media_type==='tv').slice(0,10).map(r=>({id:r.id,kind:r.media_type,title:r.title||r.name||'Untitled',year:String(r.release_date||r.first_air_date||'').slice(0,4),overview:String(r.overview||'').slice(0,400),poster:r.poster_path?'https://image.tmdb.org/t/p/w185'+r.poster_path:'',rating:typeof r.vote_average==='number'?Math.round(r.vote_average*10)/10:null}));
}
export function parseProviders(json,region){
 const r=json&&json.results&&json.results[region||'IN'];
 if(!r)return null;
 const names=list=>(list||[]).map(p=>p.provider_name).filter(Boolean).slice(0,6);
 return{link:r.link||'',stream:names(r.flatrate),rent:names(r.rent),buy:names(r.buy)};
}
export function parseMusic(json){
 const items=json&&json.tracks;
 if(!Array.isArray(items))throw Error('Music reply was incomplete.');
 return items.slice(0,12).map(t=>({name:t.name||'',artists:t.artists||'',album:t.album||'',url:t.url||'',image:t.image||'',preview:t.preview||''})).filter(t=>t.name&&t.url);
}
export function anilistBody(q){return{query:'query($q:String){Page(perPage:10){media(search:$q,type:ANIME,isAdult:false){title{romaji english} format episodes averageScore coverImage{medium} siteUrl description(asHtml:false) startDate{year}}}}',variables:{q}}}
export function parseAnime(json){const items=json&&json.data&&json.data.Page&&json.data.Page.media;if(!Array.isArray(items))throw Error('Anime reply was incomplete.');return items.slice(0,10).map(a=>({title:(a.title&&(a.title.english||a.title.romaji))||'',year:(a.startDate&&a.startDate.year)||'',kind:a.format||'',episodes:a.episodes||null,score:typeof a.averageScore==='number'?Math.round(a.averageScore/10):null,image:(a.coverImage&&a.coverImage.medium)||'',url:a.siteUrl||'',synopsis:String(a.description||'').slice(0,300)})).filter(a=>a.title&&a.url)}
export function frankfurterUrl(from,to){return 'https://api.frankfurter.dev/v1/latest?base='+encodeURIComponent(from)+'&symbols='+encodeURIComponent(to)}
export function parseRates(json){if(!json||!json.rates||typeof json.rates!=='object')throw Error('Currency reply was incomplete.');return{date:json.date||'',rates:json.rates}}
export function openLibraryUrl(q){return 'https://openlibrary.org/search.json?limit=10&fields=key,title,author_name,first_publish_year,cover_i&q='+encodeURIComponent(q)}
export function parseBooks(json){const items=json&&json.docs;if(!Array.isArray(items))throw Error('Book reply was incomplete.');return items.slice(0,10).map(b=>({title:b.title||'',author:(b.author_name||[]).slice(0,2).join(', '),year:b.first_publish_year||'',cover:b.cover_i?'https://covers.openlibrary.org/b/id/'+b.cover_i+'-M.jpg':'',url:'https://openlibrary.org'+b.key})).filter(b=>b.title)}
export function parseYouTube(json){const items=json&&json.items;if(!Array.isArray(items))throw Error('YouTube reply was incomplete.');return items.map(v=>({id:(v.id&&v.id.videoId)||'',title:(v.snippet&&v.snippet.title)||'',channel:(v.snippet&&v.snippet.channelTitle)||'',thumb:(v.snippet&&v.snippet.thumbnails&&v.snippet.thumbnails.medium&&v.snippet.thumbnails.medium.url)||'',published:(v.snippet&&v.snippet.publishedAt)||''})).filter(v=>v.id&&v.title)}
export function parseApod(json){if(!json||!json.title)throw Error('The space photo reply was incomplete.');return{title:json.title,date:json.date||'',explanation:String(json.explanation||'').slice(0,900),url:json.url||'',mediaType:json.media_type||'image',credit:json.copyright||'NASA'}}
export function parseNeows(json){const groups=json&&json.near_earth_objects;if(!groups||typeof groups!=='object')throw Error('The asteroid reply was incomplete.');const list=[];for(const day of Object.values(groups))for(const n of day)list.push({name:n.name||'Unnamed',size:Math.round(((n.estimated_diameter&&n.estimated_diameter.meters&&n.estimated_diameter.meters.estimated_diameter_max)||0)),speed:Math.round(Number(((n.close_approach_data||[])[0]||{}).relative_velocity?.kilometers_per_hour||0)),distance:Math.round(Number(((n.close_approach_data||[])[0]||{}).miss_distance?.kilometers||0)),hazardous:!!n.is_potentially_hazardous_asteroid});return list.sort((a,b)=>a.distance-b.distance).slice(0,8)}
export function parsePixabay(json,video){const items=json&&json.hits;if(!Array.isArray(items))throw Error('Stock reply was incomplete.');if(video)return items.slice(0,12).map(h=>({id:h.id,thumb:(h.videos&&h.videos.small&&h.videos.small.url)||'',author:h.user||'',page:h.pageURL||''})).filter(h=>h.thumb);return items.slice(0,8).map(h=>({id:h.id,thumb:h.previewURL||h.webformatURL||'',author:h.user||'',page:h.pageURL||''})).filter(h=>h.thumb)}

export function parseWikiSearch(json){const list=json&&json.query&&json.query.search;if(!Array.isArray(list))throw Error('Wikipedia reply was incomplete.');return list.map(r=>({title:r.title||'',snippet:String(r.snippet||'').replace(/<[^>]+>/g,'').replace(/&quot;/g,'"').replace(/&#0?39;|&apos;/g,String.fromCharCode(39)).replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')})).filter(r=>r.title)}
export function parseWikiSummary(json){if(!json||!json.title)throw Error('Wikipedia summary was incomplete.');return{title:json.title,extract:String(json.extract||''),url:(json.content_urls&&json.content_urls.desktop&&json.content_urls.desktop.desktop)||('https://en.wikipedia.org/wiki/'+encodeURIComponent(json.title)),image:(json.thumbnail&&json.thumbnail.source)||''}}

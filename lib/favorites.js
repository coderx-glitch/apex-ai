export const FAVORITE_TOOLS=['Chat','Conversations','Search','Research','Projects','Documents','Tasks','Notes','Memory','Code','Media','Games','Controls','Notifications','Converters','Appearance','Activity'];
export function favoriteTools(v){return Array.isArray(v)?[...new Set(v.filter(x=>FAVORITE_TOOLS.includes(x)))].slice(0,6):[]}
export function loadFavorites(storage){try{return favoriteTools(JSON.parse(storage.getItem('apex-favorites')))}catch{return[]}}
export function moveFavorite(list,name,direction){const next=favoriteTools(list),i=next.indexOf(name),j=i+direction;if(![-1,1].includes(direction)||i<0||j<0||j>=next.length)return next;[next[i],next[j]]=[next[j],next[i]];return next}

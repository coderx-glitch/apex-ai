/* "Hey APEX" wake phrase and phone app launching.
   Honest scope: this runs only while the app is open and the microphone was
   started by hand. A web page cannot listen in the background or wake the
   phone. Apps open through Android intent links or their web address. */
export const WAKE_WORDS=['hey apex','ok apex','okay apex','oye apex','hello apex'];
export const LAUNCHABLE_APPS=[
  {id:'youtube',names:['youtube','you tube'],pkg:'com.google.android.youtube',web:'https://www.youtube.com'},
  {id:'whatsapp',names:['whatsapp','whats app'],pkg:'com.whatsapp',web:'https://web.whatsapp.com'},
  {id:'instagram',names:['instagram','insta'],pkg:'com.instagram.android',web:'https://www.instagram.com'},
  {id:'gmail',names:['gmail','mail','email'],pkg:'com.google.android.gm',web:'https://mail.google.com'},
  {id:'maps',names:['maps','google maps','map'],pkg:'com.google.android.apps.maps',web:'https://maps.google.com'},
  {id:'chrome',names:['chrome','browser'],pkg:'com.android.chrome',web:'https://www.google.com'},
  {id:'spotify',names:['spotify'],pkg:'com.spotify.music',web:'https://open.spotify.com'},
  {id:'netflix',names:['netflix'],pkg:'com.netflix.mediaclient',web:'https://www.netflix.com'},
  {id:'telegram',names:['telegram'],pkg:'org.telegram.messenger',web:'https://web.telegram.org'},
  {id:'x',names:['twitter','x'],pkg:'com.twitter.android',web:'https://x.com'},
  {id:'facebook',names:['facebook'],pkg:'com.facebook.katana',web:'https://www.facebook.com'},
  {id:'snapchat',names:['snapchat','snap'],pkg:'com.snapchat.android',web:'https://www.snapchat.com'},
  {id:'linkedin',names:['linkedin','linked in'],pkg:'com.linkedin.android',web:'https://www.linkedin.com'},
  {id:'reddit',names:['reddit'],pkg:'com.reddit.frontpage',web:'https://www.reddit.com'},
  {id:'pinterest',names:['pinterest'],pkg:'com.pinterest',web:'https://www.pinterest.com'},
  {id:'prime',names:['prime video','amazon prime','prime'],pkg:'com.amazon.avod.thirdpartyclient',web:'https://www.primevideo.com'},
  {id:'hotstar',names:['hotstar','disney plus','disney+','jiohotstar'],pkg:'in.startv.hotstar',web:'https://www.hotstar.com'},
  {id:'amazon',names:['amazon','amazon shopping'],pkg:'com.amazon.mshop.android.shopping',web:'https://www.amazon.in'},
  {id:'flipkart',names:['flipkart'],pkg:'com.flipkart.android',web:'https://www.flipkart.com'},
  {id:'zomato',names:['zomato'],pkg:'com.application.zomato',web:'https://www.zomato.com'},
  {id:'swiggy',names:['swiggy'],pkg:'in.swiggy.android',web:'https://www.swiggy.com'},
  {id:'uber',names:['uber'],pkg:'com.ubercab',web:'https://m.uber.com'},
  {id:'ola',names:['ola','ola cabs'],pkg:'com.olacabs.customer',web:'https://book.olacabs.com'},
  {id:'paytm',names:['paytm'],pkg:'net.one97.paytm',web:'https://paytm.com'},
  {id:'phonepe',names:['phonepe','phone pe'],pkg:'com.phonepe.app',web:'https://www.phonepe.com'},
  {id:'gpay',names:['google pay','gpay','g pay'],pkg:'com.google.android.apps.nbu.paisa.user',web:'https://pay.google.com'},
  {id:'drive',names:['drive','google drive'],pkg:'com.google.android.apps.docs',web:'https://drive.google.com'},
  {id:'calendar',names:['calendar','google calendar'],pkg:'com.google.android.calendar',web:'https://calendar.google.com'},
  {id:'photos',names:['photos','google photos','gallery'],pkg:'com.google.android.apps.photos',web:'https://photos.google.com'},
  {id:'meet',names:['meet','google meet'],pkg:'com.google.android.apps.tachyon',web:'https://meet.google.com'},
  {id:'calculator',names:['calculator'],pkg:'com.google.android.calculator',web:''},
  {id:'clock',names:['clock','alarm'],pkg:'com.google.android.deskclock',web:''},
];
export function stripWake(text){const q=String(text||'').toLowerCase().trim().replace(/^[,\s]+/,'');for(const w of WAKE_WORDS){if(q===w)return{woke:true,rest:''};if(q.startsWith(w+' ')||q.startsWith(w+','))return{woke:true,rest:q.slice(w.length).replace(/^[,\s]+/,'')}}return{woke:false,rest:q}}
export function findApp(spoken){const q=String(spoken||'').toLowerCase().trim();if(!q)return null;for(const app of LAUNCHABLE_APPS)for(const n of app.names){if(q===n)return app}for(const app of LAUNCHABLE_APPS)for(const n of app.names){if(q.startsWith(n+' ')||q.endsWith(' '+n))return app}return null}
export function appLaunchUrl(app,isAndroid){if(isAndroid&&app.pkg)return 'intent://#Intent;package='+app.pkg+';end';return app.web||''}
// What to do when the browser speech service reports an error.
// Silence and aborted sessions are normal on phones: just restart.
export function micErrorAction(kind){if(kind==='no-speech'||kind==='aborted')return'restart';if(kind==='network'||kind==='service-unavailable'||kind==='busy')return'restart-notify';return'fatal'}
export function voiceLaunch(text){
  const q=String(text||'').toLowerCase().trim().replace(/[.!?]+$/,'');
  const play=text.match(/^(?:play|sunao|chalao|suna do|chala do)\s+([\s\S]+?)(?:\s+on youtube|\s+youtube pe|\s+youtube par)?$/i);
  if(play&&play[1].trim())return{type:'youtube-play',query:play[1].trim().slice(0,200),url:'https://www.youtube.com/results?search_query='+encodeURIComponent(play[1].trim().slice(0,200))};
  const open=text.match(/^(?:open|kholo|khol do|launch|start)\s+([\s\S]+)$/i);
  if(open){const app=findApp(open[1]);if(app)return{type:'app',app};return{type:'unknown-app',name:open[1].trim().slice(0,80)}}
  const app=findApp(q);if(app)return{type:'app',app};
  return null}

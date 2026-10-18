export const NAV_GROUPS=[
{id:'start',title:'Start here',detail:'Your overview and conversations',tools:[
{name:'Home',description:'Overview, recent work and the demo guide.',keywords:'dashboard counts sample files demo checklist'},
{name:'Chat',description:'Ask APEX AI or prepare a reviewed prompt.',keywords:'assistant questions reasoning messages'},
{name:'Conversations',description:'Find, pin, rename or archive saved chats.',keywords:'history branches pinned archive'},
{name:'Search',description:'Search saved local workspace content.',keywords:'global workspace notes tasks messages'}]},
{id:'organize',title:'Plan & organize',detail:'Your work, notes and context',tools:[
{name:'Projects',description:'Separate brief, notebook, checklist and project memory.',keywords:'project workspace notebook JSON import export'},
{name:'Tasks',description:'Task list, board, reminder calendar and checklists.',keywords:'todo priority subtasks kanban dates template CSV reminder calendar'},
{name:'Notes',description:'Markdown notes, expanded editor, snapshots and flashcard practice.',keywords:'study flashcards Q answer markdown tags history note task'},
{name:'Memory',description:'Review, pause, import or remove local memory.',keywords:'preferences facts context expiration conflict privacy backup'}]},
{id:'create',title:'Research & create',detail:'Evidence, documents and outputs',tools:[
{name:'Research',description:'Wikipedia EN/HI lookup and reviewed source records.',keywords:'wikipedia hindi english bibliography sources evidence comparison live search',limit:'Wikipedia only, not whole-web search'},
{name:'Documents',description:'Read local PDF text or scan printed English text from an image.',keywords:'PDF reader upload pages extract document OCR scan image text local tesseract'},
{name:'Code',description:'Four-file static web apps, source editor and sandbox preview.',keywords:'HTML CSS JS coding build app ZIP',limit:'Static frontend only'},
{name:'Media',description:'APEX image and motion studios, local edits and slideshows.',keywords:'image video slideshow crop resize art LTX FLUX',limit:'Public AI demos need consent and availability'},
{name:'Converters',description:'Convert images, PDFs and short audio/video files locally.',keywords:'JPG PNG WEBP PDF merge extract MP3 WAV MP4 WEBM audio converter'},
{name:'Slides',description:'Turn your outline into an editable .pptx on this device.',keywords:'ppt pptx presentation slides deck powerpoint maker',limit:'You write the content'}]},
{id:'play',title:'Play & interact',detail:'Games and optional device inputs',tools:[
{name:'Games',description:'52 local games, puzzles, bots and cosmetic rewards.',keywords:'chess pong breaker flight flappy bird fruit slice bubbles moles tower stack keeper orbit maze hoop rail train lasso loop mouth head tilt iris gaze constellation dock arcade game hand play',limit:'No multiplayer'},
{name:'Controls',description:'Opt-in hand, face games, eye and browser speech controls.',keywords:'gesture hand face mouth head tilt eye camera voice microphone speech accessibility',limit:'Human tracking accuracy not validated'}]},
{id:'manage',title:'Settings & safety',detail:'Personalize, inspect and stay in control',tools:[
{name:'Notifications',description:'Local alerts and app-open reminder settings.',keywords:'bell unread alerts due browser notification',limit:'Not background push'},
{name:'Appearance',description:'Themes, favorite tools, reading size and reduced motion.',keywords:'theme dark light ocean forest background animation motion font shortcuts'},
{name:'Activity',description:'This workspace\'s editable local action history.',keywords:'logs audit download actions',limit:'Not a server security audit'},
{name:'Connections',description:'See which external integrations are not set up.',keywords:'email Gmail calendar GitHub browser connectors',limit:'External integrations unavailable'},
{name:'Permissions',description:'Data, credential and actual capability boundaries.',keywords:'security keys Firebase provider privacy permissions'},
{name:'Settings',description:'Account methods and owner-only backup/access settings.',keywords:'login account owner password backup restore JSON'}]}];
export const NAV_TOOLS=NAV_GROUPS.flatMap(g=>g.tools.map(t=>({...t,category:g.id,categoryTitle:g.title})));
export function toolMatches(tool,query){const words=String(query||'').toLowerCase().trim().split(/\s+/).filter(Boolean);const text=[tool.name,tool.description,tool.keywords,tool.categoryTitle,tool.limit].join(' ').toLowerCase();return words.every(word=>text.includes(word));}
export function navigationGroups(query=''){return NAV_GROUPS.map(g=>({...g,tools:g.tools.filter(t=>toolMatches({...t,categoryTitle:g.title},query))})).filter(g=>g.tools.length);}

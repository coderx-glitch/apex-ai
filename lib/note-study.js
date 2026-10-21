export const STUDY_LIMIT=40;
export function parseStudyCards(text){
 if(typeof text!=='string'||text.length>100000)throw Error('Study text must be at most 100,000 characters.');
 const cards=[];const lines=text.split(/\r?\n/);for(let i=0;i<lines.length;i++){
 const line=lines[i].trim();if(!line)continue;const split=line.indexOf('::');
 if(split<1)throw Error('Line '+(i+1)+': use Question :: Answer. Remove headings and other lines first.');
 const question=line.slice(0,split).trim(),answer=line.slice(split+2).trim();
 if(!question||!answer)throw Error('Line '+(i+1)+': both question and answer are required.');
 if(question.length>1000||answer.length>4000)throw Error('Line '+(i+1)+': question limit 1,000 characters; answer limit 4,000.');
 cards.push({id:'card-'+i,question,answer});if(cards.length>STUDY_LIMIT)throw Error('Use at most 40 cards in one practice session.');
 }if(!cards.length)throw Error('Add at least one Question :: Answer line.');return cards;
}
export function studyMarkdown(title,cards){return '# '+title+' - reviewed flashcards\n\nLocal practice deck. Answers are user-supplied, not verified by APEX.\n\n'+cards.map((c,i)=>'## '+(i+1)+'. '+c.question+'\n\n'+c.answer).join('\n\n');}
export function practiceSummary(cards,ratings){return{total:cards.length,got:cards.filter(c=>ratings[c.id]==='got').length,missed:cards.filter(c=>ratings[c.id]==='again').length,unrated:cards.filter(c=>!ratings[c.id]).length};}

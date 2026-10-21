import {authorize,json} from '../lib/security.js';
export default function handler(req,res){res.setHeader('Cache-Control','no-store');if(req.method!=='GET')return json(res,405,{error:'GET required'});return authorize(req)?json(res,200,{accepted:true}):json(res,401,{accepted:false,error:'Code not accepted. Enter your latest owner access code.'});}

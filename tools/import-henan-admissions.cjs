const fs=require('node:fs'),vm=require('node:vm');
const ROOT=require('node:path').resolve(__dirname,'..');
const catalogContext=vm.createContext({});
vm.runInContext(fs.readFileSync(ROOT+'/frontend/university-catalog.js','utf8'),catalogContext);
const catalog=vm.runInContext('UNIVERSITY_CATALOG.schools',catalogContext);

const dir=process.env.HENAN_ADMISSIONS_CACHE||ROOT+'/work/admissions-import';fs.mkdirSync(dir+'/raw',{recursive:true});
const prioritized=catalog.filter(s=>!s.special).sort((a,b)=>Number(b.elite985)-Number(a.elite985)||Number(b.elite211)-Number(a.elite211)||Number(b.level==='专科')-Number(a.level==='专科')||Number(b.province==='河南省')-Number(a.province==='河南省'));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function query(kind,code,page=1){
 const filename=`${dir}/raw/${kind}-${code}-${page}.json`;
 if(fs.existsSync(filename))return JSON.parse(fs.readFileSync(filename,'utf8'));
 const endpoint=kind==='score'?'zy_admission/index':'plan_zy/index';
 for(let attempt=0;attempt<3;attempt++){
  try{
   const response=await fetch('https://www.gaokao.haedu.cn/api/'+endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({gb_code:code,year:2025,page,num:500,category:1,category_code:1910}),signal:AbortSignal.timeout(20000)});
   if(response.status===429){await sleep(Number(response.headers.get('retry-after')||10)*1000);continue;}
   if(!response.ok)throw Error('HTTP '+response.status);
   const json=await response.json();if(json.code!==1)throw Error(json.msg||'API error');
   fs.writeFileSync(filename,JSON.stringify(json));return json;
  }catch(e){if(attempt===2)throw e;await sleep(1000*(attempt+1));}
 }
 throw Error('request retries exhausted');
}
async function allRows(kind,code){
 const first=await query(kind,code);const data=[...first.data.data];
 if(first.data.nums>data.length&&data.length===0)throw Error('invalid pagination');
 for(let page=2;data.length<Number(first.data.nums);page++){
  if(page>100)throw Error('pagination limit');const next=await query(kind,code,page);if(!next.data.data.length)throw Error('incomplete pagination');data.push(...next.data.data);
 }
 if(data.length!==Number(first.data.nums))throw Error('unexpected total '+data.length+'/'+first.data.nums);
 return data;
}
const manifest={source:'https://www.gaokao.haedu.cn/',year:2025,requested:prioritized.length,schools:[],failed:[]};
let index=0,done=0,withScores=0;
async function worker(){
 while(index<prioritized.length){
  const school=prioritized[index++],code=school.code.slice(-5);
  try{
   const scores=await allRows('score',code);let plans=[];
   if(scores.some(r=>Number(r.admission_score_min)>0)){plans=await allRows('plan',code);withScores++;}
   manifest.schools.push({name:school.name,code,level:school.level,scoreRows:scores.length,planRows:plans.length});
  }catch(e){manifest.failed.push({name:school.name,code,error:e.message});}
  done++;
  fs.writeFileSync(dir+'/manifest.json',JSON.stringify(manifest,null,2));
  if(done%20===0||done===prioritized.length)console.log(JSON.stringify({done,total:prioritized.length,withScores,failed:manifest.failed.length,last:school.name}));
  await sleep(220);
 }
}
Promise.all([worker(),worker(),worker()]).then(()=>{console.log('IMPORT COMPLETE');if(manifest.failed.length)process.exitCode=1;}).catch(error=>{console.error(error);process.exitCode=1;});

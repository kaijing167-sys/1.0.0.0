// Rules: https://www.haeea.cn/a/202402/43269_69d1d830.shtml
// 2025 explanation: https://www.haeea.cn/attach/file/20250526/20250526151948_0983_74fe03ee.pdf
// No official subject-level raw-score distribution is bundled. Band raw-score
// endpoints come from this game's same-subject cohort, NOT a real regional table.
const GRADE_SCORE_RULES={version:'reselected-grades-v1',subjects:['chemistry','biology','politics','geography'],bands:[
 {grade:'A',share:.15,ceiling:.15,min:86,max:100},
 {grade:'B',share:.35,ceiling:.50,min:71,max:85},
 {grade:'C',share:.35,ceiling:.85,min:56,max:70},
 {grade:'D',share:.13,ceiling:.98,min:41,max:55},
 {grade:'E',share:.02,ceiling:1,min:30,max:40}
]};
function gradeScoreLinear(raw,rawMin,rawMax,min,max){
  if(![raw,rawMin,rawMax,min,max].every(Number.isFinite)||rawMax<rawMin)throw Error('Invalid grade-score interval');
  // Finite simulation cohorts may have a one-score band. Its midpoint keeps
  // equal raw scores equal without inventing an unobserved raw-score spread.
  const value=rawMax===rawMin?(min+max)/2:min+(raw-rawMin)*(max-min)/(rawMax-rawMin);
  return Math.max(min,Math.min(max,Math.round(value)));
}
function gradeScoreCohort(rawScores){
  if(!rawScores.length)return new Map();
  if(rawScores.some(s=>!Number.isFinite(s)||s<0||s>100))throw Error('Invalid raw subject score');
  const sorted=[...rawScores].sort((a,b)=>b-a),groups=[];
  for(let start=0;start<sorted.length;){
    let end=start+1;while(end<sorted.length&&sorted[end]===sorted[start])end++;
    // Tie groups stay intact; midpoint rank makes the result order-independent.
    const percentile=(start+end)/(2*sorted.length);
    const band=GRADE_SCORE_RULES.bands.find(b=>percentile<b.ceiling)||GRADE_SCORE_RULES.bands.at(-1);
    groups.push({raw:sorted[start],band,rankStart:start+1,rankEnd:end});start=end;
  }
  const result=new Map();
  for(const item of groups){
    const peers=groups.filter(p=>p.band.grade===item.band.grade),rawMin=Math.min(...peers.map(p=>p.raw)),rawMax=Math.max(...peers.map(p=>p.raw));
    result.set(item.raw,{raw:item.raw,score:gradeScoreLinear(item.raw,rawMin,rawMax,item.band.min,item.band.max),grade:item.band.grade,rawMin,rawMax,assignedMin:item.band.min,assignedMax:item.band.max,rankStart:item.rankStart,rankEnd:item.rankEnd,cohortSize:sorted.length});
  }
  return result;
}
function assignGaokaoGrades(rows){
  const pending=rows.filter(row=>!row.gradeAssignment);
  if(!pending.length)return rows;
  const lookup=Object.fromEntries(GRADE_SCORE_RULES.subjects.map(id=>[id,gradeScoreCohort(rows.map(row=>row.reselectionRaw?.[id]??(row.rawSubjects||row.subjects)[id]).filter(Number.isFinite))]));
  for(const row of pending){
    row.rawSubjects={...row.subjects};row.gradeDetails={};
    row.reselectionDetails={};
    for(const id of GRADE_SCORE_RULES.subjects){
      const raw=row.reselectionRaw?.[id]??row.rawSubjects[id];
      if(!Number.isFinite(raw))continue;
      row.reselectionDetails[id]={...lookup[id].get(raw),selected:(row.selectedElectives||[]).includes(id)};
      if(Object.hasOwn(row.rawSubjects,id)){
        row.gradeDetails[id]={...row.reselectionDetails[id]};
        row.subjects[id]=row.gradeDetails[id].score;
      }
    }
    row.gradeAssignment={version:GRADE_SCORE_RULES.version,basis:'simulated-same-subject-cohort',year:2025};
    row.total=Object.values(row.subjects).reduce((sum,value)=>sum+value,0);
  }
  return rows;
}


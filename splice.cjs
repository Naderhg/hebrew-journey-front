const fs=require('fs');
const f='src/components/screens.tsx';
let L=fs.readFileSync(f,'utf8').split('\n');
const crlf=L[0].endsWith('\r'); if(crlf) L=L.map(l=>l.replace(/\r$/,''));
const s=L.findIndex(l=>l.includes('{activeSection === "courses" && ('));
const exams=L.findIndex((l,i)=>i>s&&l.includes('{activeSection === "exams" && ('));
// list card ends at first line '          </Card>' after s
const listEnd=L.findIndex((l,i)=>i>s&&l==='          </Card>');
const formStart=listEnd+2; // skip blank
if(L[formStart].trim()!=='<Card>') throw new Error('formStart '+L[formStart]);
// form card ends at last '          </Card>' before exams
let formEnd=-1; for(let i=exams-1;i>formStart;i--){ if(L[i]==='          </Card>'){formEnd=i;break;} }
const form=L.slice(formStart,formEnd+1).map(l=>l.replace(/^        /,''));
const newBlock=fs.readFileSync('tmp_courses.part','utf8').replace(/\r?\n$/,'').split('\n');
let out=[...L.slice(0,s),...newBlock,'',...L.slice(exams)];
const r=out.findIndex(l=>l==='  return (')&&out.findIndex((l,i)=>l.includes('<AppShell')&&out[i+1].includes('role="ADMIN"'))-1;
const decl=['  const courseFormCard = (',...form.map(l=>l.replace(/^    /,'  ')) ,'  );',''];
out.splice(r,0,...decl);
fs.writeFileSync(f,out.join(crlf?'\r\n':'\n'));
console.log(s,listEnd,formStart,formEnd,exams,r);

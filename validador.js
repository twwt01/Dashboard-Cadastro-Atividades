/* ============================================================
   VALIDADOR DE CONTATOS — Telefone · WhatsApp · E-mail
   ============================================================ */

/* ---- COLUMN TYPE DETECTION ---- */

function classifyColumn(header){
  const h=(header||"").toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"");

  if(/whats|wpp|zap/i.test(h)) return "whatsapp";
  if(/fone|telefone|tel\b|celular|phone/i.test(h)) return "phone";
  if(/e-?mail|email|correio/i.test(h)) return "email";
  return "other";
}

/* ---- VALIDATION FUNCTIONS ---- */

function cleanDigits(v){
  return (v||"").replace(/\D/g,"");
}

function validatePhone(raw){
  if(!raw||!raw.trim()) return {status:"empty",msg:""};
  const digits=cleanDigits(raw);

  // remove country code 55 if present at start
  let num=digits;
  if(num.length>=12 && num.startsWith("55")) num=num.slice(2);
  if(num.length===0) return {status:"invalid",msg:"Apenas caracteres não numéricos"};

  // Brazilian landline: DDD(2) + 8 digits = 10
  // Brazilian mobile:  DDD(2) + 9 digits = 11
  if(num.length===10||num.length===11){
    const ddd=parseInt(num.slice(0,2),10);
    if(ddd<11||ddd>99) return {status:"invalid",msg:"DDD inválido: "+num.slice(0,2)};
    if(num.length===11&&num[2]!=="9") return {status:"invalid",msg:"Celular deve começar com 9 após DDD"};
    return {status:"valid",msg:""};
  }

  // 8 or 9 digits without DDD — possibly valid but warn
  if(num.length===8||num.length===9){
    return {status:"valid",msg:"Sem DDD"};
  }

  return {status:"invalid",msg:"Quantidade de dígitos inválida ("+num.length+")"};
}

function validateWhatsApp(raw){
  if(!raw||!raw.trim()) return {status:"empty",msg:""};
  const digits=cleanDigits(raw);

  let num=digits;
  // remove +55
  if(num.startsWith("55")&&num.length>=12) num=num.slice(2);

  if(num.length===0) return {status:"invalid",msg:"Apenas caracteres não numéricos"};

  // WhatsApp in Brazil: DDD(2) + 9 digits (mobile) = 11
  if(num.length===11){
    const ddd=parseInt(num.slice(0,2),10);
    if(ddd<11||ddd>99) return {status:"invalid",msg:"DDD inválido: "+num.slice(0,2)};
    if(num[2]!=="9") return {status:"invalid",msg:"WhatsApp deve começar com 9 após DDD"};
    return {status:"valid",msg:""};
  }

  // 10 digits (landline) — unusual for WhatsApp
  if(num.length===10){
    return {status:"invalid",msg:"Telefone fixo não é WhatsApp (10 dígitos)"};
  }

  // 9 digits without DDD
  if(num.length===9&&num[0]==="9"){
    return {status:"valid",msg:"Sem DDD"};
  }

  return {status:"invalid",msg:"Quantidade de dígitos inválida ("+num.length+")"};
}

function validateEmail(raw){
  if(!raw||!raw.trim()) return {status:"empty",msg:""};
  const v=raw.trim().toLowerCase();

  // basic email regex
  const re=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if(!re.test(v)) return {status:"invalid",msg:"Formato inválido"};

  // check common typos
  const domain=v.split("@")[1];
  const knownDomains=["gmail.com","hotmail.com","outlook.com","yahoo.com","yahoo.com.br",
    "live.com","icloud.com","uol.com.br","bol.com.br","terra.com.br","ig.com.br",
    "globo.com","msn.com","aol.com","protonmail.com","zoho.com"];
  const typos={"gmial.com":"gmail.com","gmal.com":"gmail.com","gamil.com":"gmail.com",
    "gmail.co":"gmail.com","gmail.com.br":"gmail.com","hotmal.com":"hotmail.com",
    "hotmial.com":"hotmail.com","hotmail.co":"hotmail.com","outllook.com":"outlook.com",
    "outlok.com":"outlook.com","yaho.com":"yahoo.com"};

  if(typos[domain]){
    return {status:"invalid",msg:"Possível erro de digitação: "+domain+" → "+typos[domain]};
  }

  return {status:"valid",msg:""};
}

/* ---- STATE ---- */

let headers=[];
let colTypes=[];
let rows=[];
let validationResults=[];
let currentFilter="all";
let searchTerm="";

/* ---- FILE READING ---- */

function detectDelimiter(text){
  const firstLine=text.split("\n")[0]||"";
  const semicolons=(firstLine.match(/;/g)||[]).length;
  const commas=(firstLine.match(/,/g)||[]).length;
  return semicolons>commas?";":","
}

function parseCSV(text){
  const sep=detectDelimiter(text);
  const lines=text.split("\n").filter(l=>l.trim());
  if(lines.length===0) return;

  headers=lines[0].split(sep).map(h=>h.trim().replace(/^"|"$/g,""));
  colTypes=headers.map(h=>classifyColumn(h));
  rows=lines.slice(1).map(l=>{
    const cells=l.split(sep).map(c=>c.trim().replace(/^"|"$/g,""));
    // pad to match headers length
    while(cells.length<headers.length) cells.push("");
    return cells;
  });
}

function parseExcel(data){
  const wb=XLSX.read(data,{type:"array"});
  const ws=wb.Sheets[wb.SheetNames[0]];
  const json=XLSX.utils.sheet_to_json(ws,{header:1,defval:""});
  if(json.length===0) return;

  headers=json[0].map(h=>String(h||"").trim());
  colTypes=headers.map(h=>classifyColumn(h));
  rows=json.slice(1).map(r=>{
    const cells=[];
    for(let i=0;i<headers.length;i++){
      cells.push(String(r[i]!=null?r[i]:"").trim());
    }
    return cells;
  });
}

document.getElementById("file").addEventListener("change",function(e){
  const f=e.target.files[0];
  if(!f) return;

  const ext=f.name.split(".").pop().toLowerCase();

  if(ext==="csv"){
    const reader=new FileReader();
    reader.onload=function(ev){
      let text=ev.target.result;
      if(text.includes("\ufffd")){
        const r2=new FileReader();
        r2.onload=function(ev2){
          parseCSV(ev2.target.result);
          runValidation();
        };
        r2.readAsText(f,"ISO-8859-1");
      } else {
        parseCSV(text);
        runValidation();
      }
    };
    reader.readAsText(f,"UTF-8");
  } else {
    const reader=new FileReader();
    reader.onload=function(ev){
      parseExcel(new Uint8Array(ev.target.result));
      runValidation();
    };
    reader.readAsArrayBuffer(f);
  }

  // reset file input so same file can be re-imported
  this.value="";
});

/* ---- VALIDATION ---- */

function runValidation(){
  validationResults=[];

  rows.forEach((row,ri)=>{
    const rowResult=[];
    row.forEach((cell,ci)=>{
      const type=colTypes[ci];
      let result;
      switch(type){
        case "phone":    result=validatePhone(cell); break;
        case "whatsapp": result=validateWhatsApp(cell); break;
        case "email":    result=validateEmail(cell); break;
        default:         result={status:"skip",msg:""}; break;
      }
      rowResult.push(result);
    });
    validationResults.push(rowResult);
  });

  updateKPIs();
  renderTable();
  showUI();
}

/* ---- KPIs ---- */

function updateKPIs(){
  let totalFields=0, valid=0, invalid=0, empty=0;

  validationResults.forEach(row=>{
    row.forEach(r=>{
      if(r.status==="skip") return;
      totalFields++;
      if(r.status==="valid") valid++;
      else if(r.status==="invalid") invalid++;
      else if(r.status==="empty") empty++;
    });
  });

  document.getElementById("kpiRows").textContent=rows.length;
  document.getElementById("kpiFields").textContent=totalFields;
  document.getElementById("kpiValid").textContent=valid;
  document.getElementById("kpiEmpty").textContent=empty;
  document.getElementById("kpiInvalid").textContent=invalid;
}

/* ---- RENDER TABLE ---- */

function renderTable(){
  const thead=document.getElementById("thead");
  const tbody=document.getElementById("tbody");

  // header
  let thHtml="<tr><th>#</th>";
  headers.forEach((h,i)=>{
    const t=colTypes[i];
    const typeLabel=t==="phone"?"📞 Telefone":t==="whatsapp"?"💬 WhatsApp":t==="email"?"📧 E-mail":"";
    const typeClass=t;
    thHtml+=`<th>${h}${typeLabel?`<span class="col-type ${typeClass}">${typeLabel}</span>`:""}</th>`;
  });
  thHtml+="<th>Status</th></tr>";
  thead.innerHTML=thHtml;

  // body
  let html="";
  rows.forEach((row,ri)=>{
    // filter
    const results=validationResults[ri];
    const hasInvalid=results.some(r=>r.status==="invalid");
    const hasValid=results.some(r=>r.status==="valid");
    const allEmpty=results.filter(r=>r.status!=="skip").every(r=>r.status==="empty");

    if(currentFilter==="invalid"&&!hasInvalid) return;
    if(currentFilter==="valid"&&!hasValid) return;
    if(currentFilter==="empty"&&!allEmpty) return;

    // search
    if(searchTerm){
      const rowText=row.join(" ").toLowerCase();
      if(!rowText.includes(searchTerm)) return;
    }

    // row status summary
    let rowStatus="valid";
    if(hasInvalid) rowStatus="invalid";
    else if(allEmpty) rowStatus="empty";

    html+=`<tr>`;
    html+=`<td class="row-num">${ri+1}</td>`;

    row.forEach((cell,ci)=>{
      const r=results[ci];
      if(r.status==="skip"){
        html+=`<td>${cell}</td>`;
      } else if(r.status==="empty"){
        html+=`<td class="cell-empty">—</td>`;
      } else if(r.status==="valid"){
        html+=`<td class="cell-valid">${cell}</td>`;
      } else {
        html+=`<td class="cell-wrapper cell-invalid">${cell}${r.msg?`<span class="tip">⚠ ${r.msg}</span>`:""}</td>`;
      }
    });

    // status badge
    if(rowStatus==="invalid"){
      html+=`<td><span class="v-badge invalid">❌ Erro</span></td>`;
    } else if(rowStatus==="empty"){
      html+=`<td><span class="v-badge empty">⚪ Vazio</span></td>`;
    } else {
      html+=`<td><span class="v-badge valid">✔ OK</span></td>`;
    }

    html+=`</tr>`;
  });

  tbody.innerHTML=html;
}

/* ---- UI TOGGLE ---- */

function showUI(){
  document.getElementById("emptyState").style.display="none";
  document.getElementById("kpis").style.display="grid";
  document.getElementById("filters").style.display="flex";
  document.getElementById("tableBox").style.display="block";
}

/* ---- FILTERS ---- */

document.querySelectorAll(".filter-btn").forEach(btn=>{
  btn.addEventListener("click",function(){
    document.querySelectorAll(".filter-btn").forEach(b=>b.classList.remove("active"));
    this.classList.add("active");
    currentFilter=this.dataset.filter;
    renderTable();
  });
});

document.getElementById("search").addEventListener("input",function(e){
  searchTerm=e.target.value.toLowerCase();
  renderTable();
});

/* ---- EXPORT ---- */

document.getElementById("btnExport").addEventListener("click",function(){
  if(!rows.length) return;

  const exportRows=[];

  // header
  const hdr=[...headers,"VALIDAÇÃO"];
  exportRows.push(hdr);

  rows.forEach((row,ri)=>{
    const results=validationResults[ri];
    const issues=[];

    results.forEach((r,ci)=>{
      if(r.status==="invalid"){
        issues.push(headers[ci]+": "+r.msg);
      }
    });

    const statusText=issues.length?"INVÁLIDO — "+issues.join(" | "):"OK";
    exportRows.push([...row,statusText]);
  });

  // build CSV
  const sep=";";
  const csv=exportRows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(sep)).join("\n");

  // BOM for Excel UTF-8
  const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download="validacao_contatos.csv";
  a.click();
  URL.revokeObjectURL(url);
});

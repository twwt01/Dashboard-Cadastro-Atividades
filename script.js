const STATUS_COLORS = {
  aberto:"#4f7cff",
  aguardando:"#fbbf24",
  criado:"#a78bfa",
  andamento:"#22d3a0",
  reuniao:"#f87171"
};

const STATUS_LABELS = {
  aberto:"Chamado Aberto",
  aguardando:"Aguardando",
  criado:"Criado",
  andamento:"Em Andamento",
  reuniao:"Em Reunião"
};

const STATUS_BADGE_CLASS = {
  aberto:"aberto",
  aguardando:"aguardando-badge",
  criado:"criado",
  andamento:"andamento",
  reuniao:"reuniao"
};

const PALETTE = ["#4f7cff","#a78bfa","#22d3a0","#fbbf24","#f87171","#f472b6","#38bdf8","#fb923c"];

const AVATAR_COLORS = {
  "Ingrid":"#4f7cff",
  "Camila":"#a78bfa",
  "Juliana":"#22d3a0",
  "Jhennifer":"#fbbf24",
  "Tiffany":"#f87171",
  "Cadastro":"#38bdf8",
  "Camila / Ingrid":"#a78bfa"
};

let chartStatusInstance;
let chartOwnerInstance;
let activeFilter=null;

let data=[
  {demanda:"Assinatura Digital",responsavel:"Tiffany",status:"aguardando",detalhe:"Aguardando Leticia marcar reunião com DocSign",aguardando:"Leticia / DocSign"},
  {demanda:"Autopreenchimento & IA Fotos",responsavel:"Tiffany",status:"reuniao",detalhe:"Reunião com João Elias para avaliar opções",aguardando:"João Elias"},
  {demanda:"Cotação",responsavel:"Jhennifer",status:"aberto",detalhe:"Chamado aberto",aguardando:"— SalesForce"},
  {demanda:"Exclusão e Inclusão de Campos",responsavel:"Juliana",status:"aguardando",detalhe:"Enviado para Jefferson Carvalho",aguardando:"Jefferson Carvalho"},
  {demanda:"Fluxo Dados Cadastrais Criação de Lead",responsavel:"Tiffany",status:"andamento",detalhe:"Analisando robô de validação de bases",aguardando:"—"},
  {demanda:"Fluxo Dados Cadastrais Existentes",responsavel:"Tiffany",status:"andamento",detalhe:"Analisando robô de validação de bases",aguardando:"—"},
  {demanda:"Forum Cadastro",responsavel:"Tiffany",status:"aguardando",detalhe:"Enviado por e-mail para Jefferson Carvalho",aguardando:"Jefferson Carvalho"},
  {demanda:"Funcionário",responsavel:"Ingrid",status:"aberto",detalhe:"Chamado aberto esperando priorização",aguardando:"Priorização interna — SalesForce"},
  {demanda:"Kit Boas Vindas",responsavel:"Camila / Ingrid",status:"aguardando",detalhe:"Fluxo enviado para Jefferson Carvalho",aguardando:"Jefferson Carvalho"},
  {demanda:"Perfil — SF para SAP",responsavel:"Jhennifer",status:"aberto",detalhe:"Automatizar Fluxo Atualizações SF → SAP",aguardando:"— SalesForce"}
];

let current=[...data];
let sortAsc=true;

/* NORMALIZAR STATUS */
function normalizeStatus(s){
  return (s || "").toLowerCase().trim();
}

/* DATA */
function formatDate(){
  return new Date().toLocaleString("pt-BR");
}

/* AVATAR */
function getAvatarColor(name){
  if(AVATAR_COLORS[name]) return AVATAR_COLORS[name];
  const code=(name||"A").charCodeAt(0);
  return `hsl(${code*37%360},60%,55%)`;
}

function getInitials(name){
  if(!name||name==="—") return "?";
  return name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
}

function createAvatar(name){
  const color=getAvatarColor(name);
  return `<div class="avatar" style="background:${color}25;color:${color};border:1.5px solid ${color}50">${getInitials(name)}</div>`;
}

/* BADGE */
function createBadge(status){
  const cls=STATUS_BADGE_CLASS[status]||"aberto";
  const label=STATUS_LABELS[status]||status;
  return `<span class="badge ${cls}"><span class="status-dot"></span>${label}</span>`;
}

/* RENDER */
function render(){
  const tbody=document.getElementById("table");
  tbody.innerHTML="";

  current.forEach(d=>{
    tbody.innerHTML+=`
    <tr>
      <td><strong>${d.demanda}</strong></td>
      <td><div class="responsavel-cell">${createAvatar(d.responsavel)}<span>${d.responsavel}</span></div></td>
      <td>${createBadge(d.status)}</td>
      <td class="detalhe">${d.detalhe}</td>
      <td class="aguardando-col">${d.aguardando}</td>
    </tr>`;
  });

  document.getElementById("total").innerText=current.length;
  document.getElementById("aguardando").innerText=current.filter(d=>d.status==="aguardando").length;
  document.getElementById("abertos").innerText=current.filter(d=>d.status==="aberto").length;
  document.getElementById("andamento").innerText=current.filter(d=>d.status==="andamento").length;
  document.getElementById("outros").innerText=current.filter(d=>d.status==="criado"||d.status==="reuniao").length;
}

/* GRÁFICOS */
function charts(){

  if(chartStatusInstance) chartStatusInstance.destroy();
  if(chartOwnerInstance) chartOwnerInstance.destroy();

  /* STATUS */
  const statusCount={};

  current.forEach(d=>{
    const status=normalizeStatus(d.status);
    if(!status) return;
    statusCount[status]=(statusCount[status]||0)+1;
  });

  const labels=Object.keys(statusCount);
  const values=Object.values(statusCount);

  chartStatusInstance=new Chart(document.getElementById("chartStatus"),{
    type:"doughnut",
    data:{
      labels:labels.map(s=>STATUS_LABELS[s]||s),
      datasets:[{
        data:values,
        backgroundColor:labels.map((_,i)=>PALETTE[i%PALETTE.length])
      }]
    },
    options:{
      plugins:{legend:{labels:{color:"#ccc"}}},
      onClick:(e,el)=>{
        if(el.length){
          const status=labels[el[0].index];
          activeFilter=activeFilter===status?null:status;
          current=activeFilter?data.filter(d=>normalizeStatus(d.status)===status):[...data];
          render();
          charts();
        }
      }
    }
  });

  /* RESPONSÁVEL */
  const ownerCount={};

  current.forEach(d=>{
    ownerCount[d.responsavel]=(ownerCount[d.responsavel]||0)+1;
  });

  const owners=Object.keys(ownerCount);

  chartOwnerInstance=new Chart(document.getElementById("chartOwner"),{
    type:"bar",
    data:{
      labels:owners,
      datasets:[{
        data:Object.values(ownerCount),
        backgroundColor:owners.map((_,i)=>PALETTE[i%PALETTE.length])
      }]
    },
    options:{
      plugins:{legend:{display:false}},
      onClick:(e,el)=>{
        if(el.length){
          const owner=owners[el[0].index];
          activeFilter=activeFilter===owner?null:owner;
          current=activeFilter?data.filter(d=>d.responsavel===owner):[...data];
          render();
          charts();
        }
      }
    }
  });
}

/* SEARCH */
document.getElementById("search").oninput=function(e){
  const v=e.target.value.toLowerCase();
  current=data.filter(d=>JSON.stringify(d).toLowerCase().includes(v));
  render();
  charts();
};

/* SORT */
function sortTable(i){
  const keys=["demanda","responsavel","status","detalhe","aguardando"];
  sortAsc=!sortAsc;
  current.sort((a,b)=>sortAsc?
    (a[keys[i]]||"").localeCompare(b[keys[i]]||"") :
    (b[keys[i]]||"").localeCompare(a[keys[i]]||"")
  );
  render();
}

/* CSV — aceita vírgula ou ponto e vírgula como separador */
function detectDelimiter(text){
  const firstLine=text.split("\n")[0]||"";
  const semicolons=(firstLine.match(/;/g)||[]).length;
  const commas=(firstLine.match(/,/g)||[]).length;
  return semicolons>commas?";":","
}

document.getElementById("file").onchange=function(e){
  const reader=new FileReader();

  reader.onload=function(ev){
    const text=ev.target.result;
    const sep=detectDelimiter(text);
    const lines=text.split("\n").filter(l=>l.trim());

    const newRows=lines.slice(1).map(l=>{
      const c=l.split(sep).map(v=>v.trim().replace(/^"|"$/g,""));
      return {
        demanda:c[0]||"",
        responsavel:c[1]||"",
        status:normalizeStatus(c[2]),
        detalhe:c[3]||"",
        aguardando:c[4]||"—"
      };
    });

    const existing=new Set(data.map(d=>d.demanda.toLowerCase().trim()));

    newRows.forEach(row=>{
      const key=row.demanda.toLowerCase().trim();
      if(key && !existing.has(key)){
        data.push(row);
        existing.add(key);
      }
    });

    current=[...data];

    document.getElementById("update").innerText="Última atualização: "+formatDate();

    render();
    charts();
  };

  reader.readAsText(e.target.files[0],"UTF-8");
};

/* INIT */
document.getElementById("update").innerText="Última atualização: "+formatDate();
render();
charts();

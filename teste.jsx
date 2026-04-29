import { useState, useEffect, useRef, useMemo } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const DEFAULT_DATA = [
  { demanda: "Funcionário", responsavel: "Ingrid", status: "aberto", detalhe: "Chamado aberto esperando priorização", aguardando: "Priorização interna — SalesForce" },
  { demanda: "Whatsapp Bot", responsavel: "Camila", status: "aguardando", detalhe: "Fluxo enviado para Jefferson Carvalho", aguardando: "Jefferson Carvalho" },
  { demanda: "Kit Boas Vindas", responsavel: "Camila / Ingrid", status: "aguardando", detalhe: "Fluxo enviado para Jefferson Carvalho", aguardando: "Jefferson Carvalho" },
  { demanda: "Pós Venda", responsavel: "Cadastro", status: "criado", detalhe: "Fluxo — cadastro", aguardando: "—" },
  { demanda: "Exclusão e Inclusão de Campos", responsavel: "Juliana", status: "aguardando", detalhe: "Enviado para Jefferson Carvalho", aguardando: "Jefferson Carvalho" },
  { demanda: "Cotação", responsavel: "Jhennifer", status: "aberto", detalhe: "Chamado aberto", aguardando: "— SalesForce" },
  { demanda: "Perfil — SF para SAP", responsavel: "Jhennifer", status: "aberto", detalhe: "Automatizar Fluxo Atualizações SF → SAP", aguardando: "— SalesForce" },
  { demanda: "Forum Cadastro", responsavel: "Tiffany", status: "aguardando", detalhe: "Enviado por e-mail para Jefferson Carvalho", aguardando: "Jefferson Carvalho" },
  { demanda: "Autopreenchimento & IA Fotos", responsavel: "Tiffany", status: "reuniao", detalhe: "Reunião com João Elias para avaliar opções", aguardando: "João Elias" },
  { demanda: "Fluxo Dados Cadastrais Existentes", responsavel: "Tiffany", status: "andamento", detalhe: "Analisando robô de validação de bases", aguardando: "—" },
  { demanda: "Assinatura Digital", responsavel: "Tiffany", status: "aguardando", detalhe: "Aguardando Leticia marcar reunião com DocSign", aguardando: "Leticia / DocSign" },
  { demanda: "Reset de Senha", responsavel: "Tiffany", status: "aberto", detalhe: "Chamado aberto", aguardando: "—" },
  { demanda: "Fluxo Dados Cadastrais Criação de Lead", responsavel: "Tiffany", status: "andamento", detalhe: "Analisando robô de validação de bases", aguardando: "—" },
];

const STATUS_CONFIG = {
  aguardando: { label: "Aguardando", color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  aberto:     { label: "Chamado Aberto", color: "#4f7cff", bg: "rgba(79,124,255,0.12)" },
  andamento:  { label: "Em Andamento", color: "#22d3a0", bg: "rgba(34,211,160,0.12)" },
  criado:     { label: "Criado", color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  reuniao:    { label: "Em Reunião", color: "#f87171", bg: "rgba(248,113,113,0.12)" },
};

const PALETTE = ["#4f7cff","#a78bfa","#22d3a0","#fbbf24","#f87171","#f472b6","#38bdf8","#fb923c"];

const AVATAR_COLORS = {
  "Ingrid": "#4f7cff", "Camila": "#a78bfa", "Juliana": "#22d3a0",
  "Jhennifer": "#fbbf24", "Tiffany": "#f87171", "Cadastro": "#38bdf8",
  "Camila / Ingrid": "#a78bfa",
};

function getStatusKey(s = "") {
  const sl = s.toLowerCase();
  if (sl.includes("aguard")) return "aguardando";
  if (sl.includes("aberto") || sl.includes("chamado")) return "aberto";
  if (sl.includes("andamento")) return "andamento";
  if (sl.includes("criado")) return "criado";
  if (sl.includes("reuni")) return "reuniao";
  return "aberto";
}

function getAvatarColor(name) {
  return AVATAR_COLORS[name] || `hsl(${(name?.charCodeAt(0) || 65) * 37 % 360},60%,55%)`;
}

function initials(name) {
  if (!name || name === "—") return "?";
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function Avatar({ name, size = 28 }) {
  const color = getAvatarColor(name);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color + "25", color, border: `1.5px solid ${color}50`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 700, flexShrink: 0,
      fontFamily: "monospace",
    }}>
      {initials(name)}
    </div>
  );
}

function Badge({ status }) {
  const key = getStatusKey(status);
  const cfg = STATUS_CONFIG[key] || STATUS_CONFIG.aberto;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: cfg.bg, color: cfg.color,
      padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em",
      whiteSpace: "nowrap",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.color, boxShadow: `0 0 4px ${cfg.color}`, display: "inline-block" }} />
      {cfg.label}
    </span>
  );
}

function KpiCard({ label, value, color, accent }) {
  return (
    <div style={{
      background: "#161920", border: "1px solid #272c3a", borderRadius: 12,
      padding: "18px 16px", position: "relative", overflow: "hidden",
      transition: "transform 0.2s, border-color 0.2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = accent; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = "#272c3a"; }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accent, borderRadius: "12px 12px 0 0" }} />
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#7b849a", marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: "monospace", fontSize: 34, fontWeight: 800, color: accent, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1e222e", border: "1px solid #272c3a", borderRadius: 8, padding: "8px 14px", fontSize: 12, color: "#e8eaf0" }}>
      <div style={{ color: "#7b849a", marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: p.color || "#4f7cff", fontWeight: 600 }}>{p.value} demanda{p.value !== 1 ? "s" : ""}</div>)}
    </div>
  );
};

export default function Dashboard() {
  const [data, setData] = useState(DEFAULT_DATA);
  const [search, setSearch] = useState("");
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleString("pt-BR"));
  const [description, setDescription] = useState("Acompanhamento de demandas e automações do Time de Cadastros — Status em tempo real.");
  const [toast, setToast] = useState("");
  const [sortCol, setSortCol] = useState(0);
  const [sortAsc, setSortAsc] = useState(true);
  const fileRef = useRef();

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let rows = data.filter(r => Object.values(r).join(" ").toLowerCase().includes(q));
    const keys = ["demanda", "responsavel", "status", "detalhe", "aguardando"];
    rows = [...rows].sort((a, b) => {
      const av = (a[keys[sortCol]] || "").toLowerCase();
      const bv = (b[keys[sortCol]] || "").toLowerCase();
      return sortAsc ? av.localeCompare(bv, "pt") : bv.localeCompare(av, "pt");
    });
    return rows;
  }, [data, search, sortCol, sortAsc]);

  const kpis = useMemo(() => {
    const total = data.length;
    const ag = data.filter(r => getStatusKey(r.status) === "aguardando").length;
    const ab = data.filter(r => getStatusKey(r.status) === "aberto").length;
    const an = data.filter(r => getStatusKey(r.status) === "andamento").length;
    const outros = total - ag - ab - an;
    return { total, ag, ab, an, outros };
  }, [data]);

  const statusChartData = useMemo(() => {
    const counts = {};
    data.forEach(r => {
      const key = getStatusKey(r.status);
      const lbl = STATUS_CONFIG[key]?.label || key;
      counts[lbl] = (counts[lbl] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [data]);

  const ownerChartData = useMemo(() => {
    const counts = {};
    data.forEach(r => {
      const o = (r.responsavel || "—").split("/")[0].trim();
      counts[o] = (counts[o] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 7).map(([name, value]) => ({ name, value }));
  }, [data]);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        // parse CSV simple
        const text = ev.target.result;
        const lines = text.split("\n").filter(Boolean);
        const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/"/g, ""));
        const colMap = {
          demanda: ["demanda","nome","task","item","atividade"],
          responsavel: ["responsavel","responsável","owner","pessoa","analista"],
          status: ["status","situação","situacao","state"],
          detalhe: ["detalhe","detalhes","descrição","descricao","obs","detail"],
          aguardando: ["aguardando","pendente","waiting","dependência"],
        };
        const map = {};
        for (const [field, aliases] of Object.entries(colMap)) {
          const found = aliases.find(a => headers.includes(a));
          if (found) map[field] = headers.indexOf(found);
        }
        const rows = lines.slice(1).map(line => {
          const cols = line.split(",").map(c => c.trim().replace(/"/g, ""));
          return {
            demanda: map.demanda !== undefined ? cols[map.demanda] : cols[0] || "—",
            responsavel: map.responsavel !== undefined ? cols[map.responsavel] : "—",
            status: map.status !== undefined ? cols[map.status] : "aberto",
            detalhe: map.detalhe !== undefined ? cols[map.detalhe] : "—",
            aguardando: map.aguardando !== undefined ? cols[map.aguardando] : "—",
          };
        });
        setData(rows);
        setLastUpdate(new Date().toLocaleString("pt-BR"));
        showToast("✓ Arquivo importado com sucesso!");
      } catch (err) {
        showToast("✗ Erro ao ler o arquivo");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleSort = (col) => {
    if (sortCol === col) setSortAsc(a => !a);
    else { setSortCol(col); setSortAsc(true); }
  };

  const thStyle = (col) => ({
    background: "#1e222e", padding: "10px 14px", textAlign: "left",
    fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em",
    color: sortCol === col ? "#e8eaf0" : "#7b849a",
    borderBottom: "1px solid #272c3a", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap",
  });

  return (
    <div style={{ background: "#0d0f14", minHeight: "100vh", color: "#e8eaf0", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* HEADER */}
      <div style={{
        background: "linear-gradient(135deg,#111420,#161b2e)", borderBottom: "1px solid #272c3a",
        padding: "0 28px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#4f7cff", boxShadow: "0 0 10px #4f7cff" }} />
          <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.03em" }}>Cadastros Dashboard</span>
          <span style={{ fontSize: 12, color: "#7b849a", fontWeight: 300 }}>/ Time Operacional</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontFamily: "monospace", fontSize: 11, color: "#7b849a", background: "#1e222e", border: "1px solid #272c3a", padding: "5px 11px", borderRadius: 6 }}>
            Última atualização: {lastUpdate}
          </div>
          <label style={{
            display: "flex", alignItems: "center", gap: 7, cursor: "pointer",
            background: "linear-gradient(135deg,#4f7cff,#a78bfa)", color: "#fff",
            padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700,
          }}>
            ⬆ Importar CSV
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} style={{ display: "none" }} />
          </label>
        </div>
      </div>

      <div style={{ padding: "24px 28px", maxWidth: 1500, margin: "0 auto" }}>

        {/* DESCRIPTION */}
        <div style={{
          background: "#161920", border: "1px solid #272c3a", borderRadius: 10,
          padding: "12px 18px", display: "flex", alignItems: "center", gap: 10, marginBottom: 22,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#7b849a", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>📋 Descrição</span>
          <input
            value={description} onChange={e => setDescription(e.target.value)}
            style={{ background: "none", border: "none", outline: "none", color: "#e8eaf0", fontSize: 13, flex: 1, fontFamily: "inherit" }}
            placeholder="Adicione uma descrição..."
          />
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14, marginBottom: 24 }}>
          <KpiCard label="Total Demandas" value={kpis.total} accent="#4f7cff" />
          <KpiCard label="Aguardando" value={kpis.ag} accent="#fbbf24" />
          <KpiCard label="Chamados Abertos" value={kpis.ab} accent="#4f7cff" />
          <KpiCard label="Em Andamento" value={kpis.an} accent="#22d3a0" />
          <KpiCard label="Criado / Reunião" value={kpis.outros} accent="#a78bfa" />
        </div>

        {/* CHARTS */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 24 }}>
          {/* Status pie */}
          <div style={{ background: "#161920", border: "1px solid #272c3a", borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#7b849a", marginBottom: 14 }}>Status por demanda</div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                  {statusChartData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11, color: "#7b849a" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Owner bar */}
          <div style={{ background: "#161920", border: "1px solid #272c3a", borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#7b849a", marginBottom: 14 }}>Demandas por responsável</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ownerChartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: "#7b849a", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#7b849a", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {ownerChartData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TABLE */}
        <div style={{ background: "#161920", border: "1px solid #272c3a", borderRadius: 12, overflow: "hidden", marginBottom: 24 }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #272c3a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#7b849a" }}>📌 Demandas Detalhadas</span>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Buscar demanda..."
              style={{
                background: "#1e222e", border: "1px solid #272c3a", borderRadius: 6,
                padding: "6px 12px", color: "#e8eaf0", fontSize: 12, outline: "none", width: 220,
                fontFamily: "inherit",
              }}
            />
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Demanda", "Responsável", "Status", "Detalhe", "Aguardando"].map((h, i) => (
                    <th key={i} style={thStyle(i)} onClick={() => handleSort(i)}>
                      {h} {sortCol === i ? (sortAsc ? "↑" : "↓") : "↕"}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #272c3a", transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#1e222e"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 600 }}>{r.demanda}</td>
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Avatar name={r.responsavel} />
                        <span style={{ fontSize: 13 }}>{r.responsavel}</span>
                      </div>
                    </td>
                    <td style={{ padding: "11px 14px" }}><Badge status={r.status} /></td>
                    <td style={{ padding: "11px 14px", fontSize: 12, color: "#7b849a", maxWidth: 280 }}>{r.detalhe}</td>
                    <td style={{ padding: "11px 14px", fontSize: 12, color: "#7b849a" }}>{r.aguardando}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filtered.length && (
              <div style={{ textAlign: "center", padding: "50px 20px", color: "#7b849a", fontSize: 14 }}>
                Nenhuma demanda encontrada
              </div>
            )}
          </div>
        </div>

        {/* DIMENSIONAMENTO */}
        <div style={{ background: "#161920", border: "1px solid #272c3a", borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#7b849a", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            Análise de Dimensionamento do Time de Cadastros
            <div style={{ flex: 1, height: 1, background: "#272c3a" }} />
          </div>
          <DimCalc />
        </div>

      </div>

      {/* TOAST */}
      <div style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 999,
        background: toast.startsWith("✓") ? "#22d3a0" : "#f87171",
        color: toast.startsWith("✓") ? "#0a1a14" : "#fff",
        padding: "11px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700,
        transition: "all 0.3s", opacity: toast ? 1 : 0, transform: toast ? "translateY(0)" : "translateY(60px)",
        pointerEvents: "none",
      }}>
        {toast}
      </div>
    </div>
  );
}

function DimCalc() {
  const [vol, setVol] = useState("");
  const [tempo, setTempo] = useState("");
  const [horas, setHoras] = useState("7");
  const [dias, setDias] = useState("22");
  const [atuais, setAtuais] = useState("");

  const result = useMemo(() => {
    const v = parseFloat(vol), t = parseFloat(tempo), h = parseFloat(horas), d = parseFloat(dias), a = parseFloat(atuais);
    if (!v || !t) return "";
    const minMes = h * 60 * d;
    const nec = Math.ceil((v * t) / minMes);
    let res = `${nec} analista(s) necessário(s)`;
    if (a) {
      const delta = nec - a;
      res += delta > 0 ? ` — faltam ${delta}` : delta < 0 ? ` — ${Math.abs(delta)} excedente(s)` : " — ✓ adequado";
    }
    return res;
  }, [vol, tempo, horas, dias, atuais]);

  const inp = (label, val, set, placeholder) => (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#7b849a", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{label}</div>
      <input value={val} onChange={e => set(e.target.value)} placeholder={placeholder} type="number"
        style={{ width: "100%", background: "#0d0f14", border: "1px solid #272c3a", borderRadius: 8, padding: "8px 12px", color: "#e8eaf0", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
    </div>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 14 }}>
      {inp("Volume mensal de cadastros", vol, setVol, "ex: 500")}
      {inp("Tempo médio por cadastro (min)", tempo, setTempo, "ex: 15")}
      {inp("Horas úteis/dia por analista", horas, setHoras, "7")}
      {inp("Dias úteis no mês", dias, setDias, "22")}
      {inp("Analistas atuais", atuais, setAtuais, "ex: 3")}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#7b849a", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Resultado dimensionamento</div>
        <input readOnly value={result} placeholder="Preencha os campos..."
          style={{ width: "100%", background: "#0d0f14", border: "1px solid #272c3a", borderRadius: 8, padding: "8px 12px", color: "#22d3a0", fontSize: 13, fontWeight: 700, outline: "none", fontFamily: "inherit" }} />
      </div>
    </div>
  );
}
const { useState, useEffect, useMemo, useRef } = React;
const {
  LayoutDashboard, Users, Building2, Calculator, Package, HardHat,
  ClipboardList, Wallet, Settings, Plus, Pencil, Trash2, X, Search,
  AlertTriangle, ArrowUpRight, ArrowDownRight, ArrowLeft, TrendingUp,
  Folder, FolderPlus, Upload, FileText, Download, File, ChevronRight, FilePlus,
  ListTodo, Flag, CalendarDays, GripVertical, Check, UserPlus, ChevronLeft,
  LogOut, Eye, EyeOff, Shield, Lock,
} = LucideReact;
const {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} = Recharts;

/* ============ Tokens de diseño (plano de ingeniería) ============ */
const T = {
  ink: "#161A20",
  panel: "#1B222C",
  panel2: "#232C38",
  line: "#2E3945",
  concrete: "#EDEFF2",
  card: "#FFFFFF",
  cardLine: "#DDE1E7",
  text: "#1B222C",
  muted: "#6B7480",
  steel: "#2D6CDF",
  steelDk: "#1E4FA8",
  amber: "#F5A623",
  green: "#1E9E63",
  red: "#D8443B",
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  mono: '"SF Mono", ui-monospace, "Roboto Mono", Menlo, Consolas, monospace',
};

const STORE_KEY = "erp:topconsult:v1";
const uid = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(16).slice(2);

/* ============ Persistencia (window.storage + respaldo en memoria) ============ */
async function loadData() {
  try {
    if (typeof window !== "undefined" && window.storage) {
      const r = await window.storage.get(STORE_KEY);
      if (r && r.value) return JSON.parse(r.value);
    }
  } catch (e) { /* clave inexistente o sin storage */ }
  return null;
}
async function saveData(data) {
  try {
    if (typeof window !== "undefined" && window.storage) {
      await window.storage.set(STORE_KEY, JSON.stringify(data));
    }
  } catch (e) { /* sin persistencia disponible */ }
}

/* ---- Contenido de archivos: cada archivo en su propia clave (hasta 5MB c/u) ---- */
const memDocs = {};
async function getDocContent(id) {
  try {
    if (typeof window !== "undefined" && window.storage) {
      const r = await window.storage.get("erp:doc:" + id);
      return r?.value ?? null;
    }
  } catch (e) { /* inexistente */ }
  return memDocs[id] ?? null;
}
async function setDocContent(id, val) {
  try {
    if (typeof window !== "undefined" && window.storage) { await window.storage.set("erp:doc:" + id, val); return; }
  } catch (e) { /* respaldo en memoria */ }
  memDocs[id] = val;
}
async function delDocContent(id) {
  try {
    if (typeof window !== "undefined" && window.storage) { await window.storage.delete("erp:doc:" + id); return; }
  } catch (e) { /* nada */ }
  delete memDocs[id];
}
const readFileAsDataURL = (file) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(r.result);
  r.onerror = rej;
  r.readAsDataURL(file);
});
const today = () => new Date().toISOString().slice(0, 10);
const extOf = (name) => (name.includes(".") ? name.split(".").pop().toLowerCase() : "");
const fmtSize = (b) => {
  if (!b) return "—";
  if (b < 1024) return b + " B";
  if (b < 1048576) return (b / 1024).toFixed(1) + " KB";
  return (b / 1048576).toFixed(1) + " MB";
};
const extColor = (ext) => ({
  pdf: "#D8443B", doc: "#2D6CDF", docx: "#2D6CDF", xls: "#1E9E63", xlsx: "#1E9E63",
  csv: "#1E9E63", dwg: "#F5A623", jpg: "#8E5AD8", jpeg: "#8E5AD8", png: "#8E5AD8",
  txt: "#6B7480", zip: "#9A5A00", rar: "#9A5A00",
}[ext] || "#6B7480");
async function downloadDoc(doc) {
  const content = await getDocContent(doc.id);
  if (content == null) { alert("No se encontró el contenido del archivo."); return; }
  let href = content, revoke = null;
  if (doc.kind === "text") {
    const blob = new Blob([content], { type: doc.mime || "text/plain" });
    href = URL.createObjectURL(blob); revoke = href;
  }
  const a = document.createElement("a");
  a.href = href; a.download = doc.nombre;
  document.body.appendChild(a); a.click(); a.remove();
  if (revoke) setTimeout(() => URL.revokeObjectURL(revoke), 1500);
}

/* ============ Datos de arranque ============ */
function seed() {
  const c1 = uid(), c2 = uid();
  const o1 = uid(), o2 = uid(), o3 = uid();
  const m1 = uid(), m2 = uid(), m3 = uid();
  const p1 = uid(), p2 = uid();
  const pt1 = uid(), pt2 = uid(), pt3 = uid();
  const b1 = uid(), b2 = uid(), b3 = uid(), b4 = uid();
  return {
    cfg: { empresa: "Top Consult", moneda: "S/", ggPct: 10, utilPct: 8 },
    usuarios: [
      { id: uid(), nombre: "Administrador", dni: "00000000", email: "", rol: "admin", pass: "admin123", activo: true },
    ],
    clientes: [
      { id: c1, nombre: "Municipalidad de Miraflores", ruc: "20131380951", contacto: "Ing. Rosa Vega", telefono: "987654321", email: "obras@miraflores.gob.pe" },
      { id: c2, nombre: "Constructora Andina SAC", ruc: "20512345678", contacto: "Arq. Luis Ramos", telefono: "998877665", email: "proyectos@andina.pe" },
    ],
    obras: [
      { id: o1, codigo: "OB-001", nombre: "Mejoramiento vía Av. Los Álamos", clienteId: c1, ubicacion: "Miraflores, Lima", montoContractual: 1850000, fechaInicio: "2026-03-01", fechaFin: "2026-09-30", estado: "En ejecución", avance: 42 },
      { id: o2, codigo: "OB-002", nombre: "Edificio multifamiliar Torre San Isidro", clienteId: c2, ubicacion: "San Isidro, Lima", montoContractual: 4200000, fechaInicio: "2026-01-15", fechaFin: "2026-12-20", estado: "En ejecución", avance: 28 },
      { id: o3, codigo: "OB-003", nombre: "Reservorio apoyado 500 m³", clienteId: c1, ubicacion: "Lurín, Lima", montoContractual: 920000, fechaInicio: "2026-05-10", fechaFin: "2026-08-15", estado: "Planificación", avance: 0 },
    ],
    partidas: [
      { id: uid(), obraId: o1, item: "01.01", descripcion: "Excavación masiva con maquinaria", unidad: "m³", metrado: 3200, pu: 12.5 },
      { id: uid(), obraId: o1, item: "01.02", descripcion: "Base granular e=0.20 m compactada", unidad: "m²", metrado: 8500, pu: 28.4 },
      { id: uid(), obraId: o1, item: "02.01", descripcion: "Carpeta asfáltica en caliente e=2\"", unidad: "m²", metrado: 8500, pu: 45.9 },
      { id: uid(), obraId: o2, item: "01.01", descripcion: "Concreto f'c=280 kg/cm² en columnas", unidad: "m³", metrado: 620, pu: 520 },
      { id: uid(), obraId: o2, item: "01.02", descripcion: "Acero de refuerzo fy=4200 kg/cm²", unidad: "kg", metrado: 84000, pu: 6.8 },
    ],
    materiales: [
      { id: m1, codigo: "CEM-01", nombre: "Cemento Portland Tipo I (bolsa)", unidad: "bls", stockInicial: 1200, stockMin: 300, precio: 28.5 },
      { id: m2, codigo: "ACE-01", nombre: "Acero corrugado 1/2\" (varilla)", unidad: "var", stockInicial: 450, stockMin: 200, precio: 34.9 },
      { id: m3, codigo: "AGR-01", nombre: "Piedra chancada 1/2\"", unidad: "m³", stockInicial: 80, stockMin: 120, precio: 65 },
    ],
    movimientos: [
      { id: uid(), materialId: m1, tipo: "salida", cantidad: 400, obraId: o2, fecha: "2026-08-10", nota: "Vaciado de columnas nivel 3" },
      { id: uid(), materialId: m2, tipo: "entrada", cantidad: 300, obraId: "", fecha: "2026-08-05", nota: "Compra a proveedor" },
    ],
    personal: [
      { id: p1, nombre: "Carlos Mendoza", dni: "45871236", cargo: "Operario", costoDia: 95 },
      { id: p2, nombre: "Julio Paredes", dni: "40125896", cargo: "Peón", costoDia: 68 },
    ],
    tareo: [
      { id: uid(), personalId: p1, obraId: o1, fecha: "2026-08-25", dias: 6 },
      { id: uid(), personalId: p2, obraId: o1, fecha: "2026-08-25", dias: 6 },
      { id: uid(), personalId: p1, obraId: o2, fecha: "2026-08-18", dias: 5 },
    ],
    valorizaciones: [
      { id: uid(), obraId: o1, periodo: "Valorización N°1 - Julio", monto: 385000, fecha: "2026-07-31" },
      { id: uid(), obraId: o1, periodo: "Valorización N°2 - Agosto", monto: 392000, fecha: "2026-08-31" },
      { id: uid(), obraId: o2, periodo: "Valorización N°1 - Julio", monto: 640000, fecha: "2026-07-31" },
    ],
    caja: [
      { id: uid(), tipo: "ingreso", concepto: "Adelanto directo OB-001", monto: 555000, obraId: o1, fecha: "2026-03-05" },
      { id: uid(), tipo: "egreso", concepto: "Compra de agregados", monto: 42000, obraId: o1, fecha: "2026-04-12" },
      { id: uid(), tipo: "ingreso", concepto: "Valorización N°1 OB-002", monto: 640000, obraId: o2, fecha: "2026-08-08" },
      { id: uid(), tipo: "egreso", concepto: "Planilla de obreros agosto", monto: 118000, obraId: o2, fecha: "2026-08-30" },
    ],
    docs: [
      { id: uid(), obraId: o1, parentId: null, tipo: "folder", nombre: "Planos", fecha: "2026-03-02" },
      { id: uid(), obraId: o1, parentId: null, tipo: "folder", nombre: "Documentos contractuales", fecha: "2026-03-02" },
      { id: uid(), obraId: o1, parentId: null, tipo: "folder", nombre: "Valorizaciones", fecha: "2026-03-02" },
      { id: uid(), obraId: o2, parentId: null, tipo: "folder", nombre: "Planos estructurales", fecha: "2026-01-16" },
      { id: uid(), obraId: o2, parentId: null, tipo: "folder", nombre: "Ensayos de laboratorio", fecha: "2026-01-16" },
    ],
    integrantes: [
      { id: uid(), obraId: o1, categoria: "Residente", nombre: "Ing. Marco Salazar", cargo: "Residente de obra", empresa: "Top Consult", telefono: "987112233", email: "msalazar@topconsult.pe", nota: "" },
      { id: uid(), obraId: o1, categoria: "Ingenieros", nombre: "Ing. Diana Ríos", cargo: "Ing. de producción", empresa: "Top Consult", telefono: "986223344", email: "", nota: "" },
      { id: uid(), obraId: o1, categoria: "SOMA", nombre: "Ing. Pedro Quispe", cargo: "Prevencionista SSOMA", empresa: "Top Consult", telefono: "985334455", email: "", nota: "" },
      { id: uid(), obraId: o1, categoria: "Calidad", nombre: "Ing. Ana Torres", cargo: "Jefa de calidad", empresa: "Top Consult", telefono: "", email: "", nota: "" },
      { id: uid(), obraId: o1, categoria: "Cliente", nombre: "Ing. Rosa Vega", cargo: "Supervisora de obra", empresa: "Municipalidad de Miraflores", telefono: "987654321", email: "", nota: "" },
      { id: uid(), obraId: o1, categoria: "Proveedores", nombre: "Aceros Arequipa", cargo: "Suministro de acero", empresa: "Aceros Arequipa S.A.", telefono: "016128000", email: "", nota: "" },
      { id: uid(), obraId: o2, categoria: "Residente", nombre: "Ing. Luis Ramos", cargo: "Residente de obra", empresa: "Constructora Andina", telefono: "998877665", email: "", nota: "" },
    ],
    categorias: [
      { id: uid(), nombre: "Residente" }, { id: uid(), nombre: "Ingenieros" }, { id: uid(), nombre: "SOMA" },
      { id: uid(), nombre: "Calidad" }, { id: uid(), nombre: "Equipo staff" }, { id: uid(), nombre: "Cliente" },
      { id: uid(), nombre: "Proveedores" },
    ],
    planTeam: [
      { id: pt1, nombre: "Ing. Marco Salazar", rol: "Jefe de planificación", email: "msalazar@topconsult.pe", telefono: "987112233" },
      { id: pt2, nombre: "Ing. Diana Ríos", rol: "Programación / CPM", email: "drios@topconsult.pe", telefono: "986223344" },
      { id: pt3, nombre: "Ing. Ana Torres", rol: "Control de calidad", email: "", telefono: "" },
    ],
    buckets: [
      { id: b1, nombre: "Por hacer", orden: 0 },
      { id: b2, nombre: "En proceso", orden: 1 },
      { id: b3, nombre: "En revisión", orden: 2 },
      { id: b4, nombre: "Hecho", orden: 3 },
    ],
    tareas: [
      { id: uid(), bucketId: b1, titulo: "Actualizar cronograma OB-001", descripcion: "Reprogramar con avance real de agosto.", obraId: o1, asignados: [pt2], prioridad: "Alta", estado: "Sin iniciar", fechaInicio: "2026-09-01", fechaVenc: "2026-09-05", checklist: [{ id: uid(), texto: "Revisar avance real", hecho: false }, { id: uid(), texto: "Recalcular ruta crítica", hecho: false }] },
      { id: uid(), bucketId: b1, titulo: "Requerimiento de acero Torre San Isidro", descripcion: "", obraId: o2, asignados: [pt1], prioridad: "Media", estado: "Sin iniciar", fechaInicio: "2026-09-03", fechaVenc: "2026-09-10", checklist: [] },
      { id: uid(), bucketId: b2, titulo: "Metrado de columnas nivel 4", descripcion: "", obraId: o2, asignados: [pt1, pt2], prioridad: "Media", estado: "En curso", fechaInicio: "2026-08-27", fechaVenc: "2026-09-02", checklist: [{ id: uid(), texto: "Verificar planos", hecho: true }, { id: uid(), texto: "Cargar al presupuesto", hecho: false }] },
      { id: uid(), bucketId: b3, titulo: "Protocolo de calidad vaciado", descripcion: "Revisión del PPI antes del vaciado.", obraId: o2, asignados: [pt3], prioridad: "Alta", estado: "En curso", fechaInicio: "2026-08-25", fechaVenc: "2026-08-28", checklist: [] },
      { id: uid(), bucketId: b4, titulo: "Valorización N°2 OB-001", descripcion: "", obraId: o1, asignados: [pt1, pt2], prioridad: "Baja", estado: "Completado", fechaInicio: "2026-08-26", fechaVenc: "2026-08-31", checklist: [] },
    ],
  };
}

/* ============ Utilidades de formato ============ */
const ESTADOS = ["Planificación", "En ejecución", "Paralizada", "Culminada", "Liquidación"];
const estadoColor = (e) => ({
  "Planificación": T.steel, "En ejecución": T.green, "Paralizada": T.red,
  "Culminada": "#5B6472", "Liquidación": T.amber,
}[e] || T.muted);

/* ============ Login: roles, permisos y sesión ============ */
const ROLES = [
  { v: "admin", l: "Administrador" },
  { v: "oficina", l: "Oficina" },
  { v: "obra", l: "Obra" },
];
const rolLabel = (r) => ROLES.find((x) => x.v === r)?.l || r;
const rolColor = (r) => ({ admin: T.amber, oficina: T.steel, obra: T.green }[r] || T.muted);
const PERMISOS = {
  admin: ["panel", "planificacion", "obras", "clientes", "presupuestos", "almacen", "personal", "caja", "usuarios", "config"],
  oficina: ["panel", "planificacion", "obras", "clientes", "presupuestos", "almacen", "personal"],
  obra: ["obras", "planificacion", "almacen"],
};
const puede = (rol, modulo) => rol === "admin" || (PERMISOS[rol] || []).includes(modulo);

const SESSION_KEY = "erp:session";
const loadSession = () => { try { return sessionStorage.getItem(SESSION_KEY); } catch (e) { return null; } };
const saveSession = (id) => { try { if (id) sessionStorage.setItem(SESSION_KEY, id); else sessionStorage.removeItem(SESSION_KEY); } catch (e) { /* nada */ } };

/* ============ Componentes UI base ============ */
function Modal({ title, onClose, children, wide }) {
  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,19,24,.55)" }}>
      <div onClick={(e) => e.stopPropagation()}
        className="w-full rounded-xl overflow-hidden shadow-2xl"
        style={{ background: T.card, maxWidth: wide ? 720 : 460, border: `1px solid ${T.cardLine}` }}>
        <div className="flex items-center justify-between px-5 py-3.5"
          style={{ background: T.panel, color: "#fff" }}>
          <h3 className="text-sm font-semibold tracking-wide">{title}</h3>
          <button onClick={onClose} className="opacity-70 hover:opacity-100">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block mb-3.5">
      <span className="block text-xs font-semibold mb-1.5" style={{ color: T.muted, letterSpacing: ".02em" }}>
        {label}
      </span>
      {children}
    </label>
  );
}
const inputStyle = {
  width: "100%", padding: "9px 11px", borderRadius: 8,
  border: `1px solid ${T.cardLine}`, fontSize: 14, color: T.text,
  outline: "none", background: "#fff",
};

function Btn({ children, onClick, kind = "primary", size = "md", style = {} }) {
  const kinds = {
    primary: { background: T.steel, color: "#fff", border: `1px solid ${T.steelDk}` },
    dark: { background: T.panel, color: "#fff", border: `1px solid ${T.line}` },
    ghost: { background: "transparent", color: T.text, border: `1px solid ${T.cardLine}` },
    danger: { background: "#fff", color: T.red, border: `1px solid ${T.red}` },
  };
  const pad = size === "sm" ? "5px 10px" : "9px 15px";
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg font-semibold transition-opacity hover:opacity-90"
      style={{ ...kinds[kind], padding: pad, fontSize: size === "sm" ? 12.5 : 13.5, ...style }}>
      {children}
    </button>
  );
}

function IconBtn({ icon: Icon, onClick, color = T.muted }) {
  return (
    <button onClick={onClick} className="p-1.5 rounded-md hover:bg-gray-100" style={{ color }}>
      <Icon size={15} />
    </button>
  );
}

function Empty({ label }) {
  return (
    <div className="text-center py-14" style={{ color: T.muted }}>
      <p className="text-sm">{label}</p>
    </div>
  );
}

/* ============ App ============ */
function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("panel");
  const [modal, setModal] = useState(null); // {collection, item}
  const [obraSel, setObraSel] = useState(null); // para presupuesto/valorizaciones
  const [q, setQ] = useState("");
  const [authId, setAuthId] = useState(null);

  useEffect(() => {
    (async () => {
      const d = await loadData();
      let base = d || seed();
      // Migración: si no hay usuarios, crear un administrador por defecto
      if (!base.usuarios || base.usuarios.length === 0) {
        base = { ...base, usuarios: [{ id: uid(), nombre: "Administrador", dni: "00000000", email: "", rol: "admin", pass: "admin123", activo: true }] };
      }
      setData(base);
      const sid = loadSession();
      if (sid && base.usuarios.some((u) => u.id === sid && u.activo)) setAuthId(sid);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (data && !loading) saveData(data);
  }, [data, loading]);

  const cfg = data?.cfg || { moneda: "S/", empresa: "Top Consult", ggPct: 10, utilPct: 8 };
  const money = (n) => `${cfg.moneda} ${new Intl.NumberFormat("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0)}`;
  const int = (n) => new Intl.NumberFormat("es-PE").format(Number(n) || 0);

  /* ---- helpers de datos ---- */
  const set = (coll, arr) => setData((d) => ({ ...d, [coll]: arr }));
  const upsert = (coll, item) =>
    setData((d) => {
      const arr = d[coll];
      const exists = arr.some((x) => x.id === item.id);
      return { ...d, [coll]: exists ? arr.map((x) => (x.id === item.id ? item : x)) : [...arr, item] };
    });
  const remove = (coll, id) =>
    setData((d) => ({ ...d, [coll]: d[coll].filter((x) => x.id !== id) }));

  /* ---- documentos por obra (metadatos en estado, contenido en claves aparte) ---- */
  const addDoc = async (meta, content) => {
    if (content != null) await setDocContent(meta.id, content);
    setData((d) => ({ ...d, docs: [...(d.docs || []), meta] }));
  };
  const updateDoc = (id, patch) =>
    setData((d) => ({ ...d, docs: (d.docs || []).map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  const removeDoc = async (id) => {
    const all = data.docs || [];
    const toDelete = [id];
    const collect = (pid) => all.filter((x) => x.parentId === pid).forEach((ch) => { toDelete.push(ch.id); if (ch.tipo === "folder") collect(ch.id); });
    if (all.find((x) => x.id === id)?.tipo === "folder") collect(id);
    for (const did of toDelete) await delDocContent(did);
    setData((d) => ({ ...d, docs: (d.docs || []).filter((x) => !toDelete.includes(x.id)) }));
  };

  const clienteName = (id) => data?.clientes.find((c) => c.id === id)?.nombre || "—";
  const obraName = (id) => data?.obras.find((o) => o.id === id)?.nombre || "—";
  const matName = (id) => data?.materiales.find((m) => m.id === id)?.nombre || "—";
  const persName = (id) => data?.personal.find((p) => p.id === id)?.nombre || "—";

  /* ---- indicadores derivados ---- */
  const derived = useMemo(() => {
    if (!data) return {};
    const activas = data.obras.filter((o) => o.estado === "En ejecución");
    const montoTotal = data.obras.reduce((s, o) => s + (+o.montoContractual || 0), 0);
    const valorizadoTotal = data.valorizaciones.reduce((s, v) => s + (+v.monto || 0), 0);
    const ingresos = data.caja.filter((c) => c.tipo === "ingreso").reduce((s, c) => s + (+c.monto || 0), 0);
    const egresos = data.caja.filter((c) => c.tipo === "egreso").reduce((s, c) => s + (+c.monto || 0), 0);
    const saldo = ingresos - egresos;
    const wSum = activas.reduce((s, o) => s + (+o.montoContractual || 0), 0);
    const avancePond = wSum ? activas.reduce((s, o) => s + (+o.avance || 0) * (+o.montoContractual || 0), 0) / wSum : 0;
    const stockDe = (m) => (+m.stockInicial || 0) +
      data.movimientos.filter((x) => x.materialId === m.id).reduce((s, x) => s + (x.tipo === "entrada" ? +x.cantidad : -+x.cantidad), 0);
    const bajoStock = data.materiales.filter((m) => stockDe(m) < (+m.stockMin || 0));
    return { activas, montoTotal, valorizadoTotal, ingresos, egresos, saldo, avancePond, stockDe, bajoStock };
  }, [data]);

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: T.concrete, fontFamily: T.sans }}>
        <div className="text-center" style={{ color: T.muted }}>
          <HardHat size={28} className="mx-auto mb-3" style={{ color: T.steel }} />
          <p className="text-sm">Cargando el sistema…</p>
        </div>
      </div>
    );
  }

  const me = (data.usuarios || []).find((u) => u.id === authId && u.activo) || null;
  if (!me) {
    return <Login usuarios={data.usuarios || []} empresa={cfg.empresa}
      onLogin={(id) => { setAuthId(id); saveSession(id); setView("panel"); }} />;
  }
  const logout = () => { setAuthId(null); saveSession(null); };
  // Si el módulo actual no está permitido para el rol, ir al primero permitido
  const ORDEN_MODULOS = ["panel", "planificacion", "obras", "clientes", "presupuestos", "almacen", "personal", "caja", "usuarios", "config"];
  const primerModulo = ORDEN_MODULOS.find((k) => puede(me.rol, k)) || "panel";
  const vistaPermitida = puede(me.rol, view) ? view : primerModulo;

  const NAV = [
    { k: "panel", label: "Panel", icon: LayoutDashboard },
    { k: "planificacion", label: "Planificación", icon: ListTodo },
    { k: "obras", label: "Obras", icon: Building2 },
    { k: "clientes", label: "Clientes", icon: Users },
    { k: "presupuestos", label: "Presupuestos", icon: Calculator },
    { k: "almacen", label: "Almacén", icon: Package },
    { k: "personal", label: "Personal", icon: HardHat },
    { k: "caja", label: "Caja", icon: Wallet },
    { k: "usuarios", label: "Usuarios", icon: Shield },
    { k: "config", label: "Configuración", icon: Settings },
  ].filter((n) => puede(me.rol, n.k));
  const viewTitle = NAV.find((n) => n.k === vistaPermitida)?.label || "";

  return (
    <div className="flex min-h-screen" style={{ background: T.concrete, fontFamily: T.sans, color: T.text }}>
      {/* Sidebar */}
      <aside className="shrink-0 flex flex-col" style={{ width: 232, background: T.ink, color: "#fff" }}>
        <div className="px-5 py-5" style={{ borderBottom: `1px solid ${T.line}` }}>
          <div className="flex items-center gap-2.5">
            <div className="grid place-items-center rounded-md" style={{ width: 34, height: 34, background: T.amber }}>
              <HardHat size={19} color={T.ink} />
            </div>
            <div>
              <div className="text-[15px] font-bold leading-none tracking-tight">{cfg.empresa}</div>
              <div className="text-[10px] mt-1 tracking-[.18em] uppercase" style={{ color: T.muted }}>ERP Construcción</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-3 overflow-y-auto">
          {NAV.map((n, i) => {
            const active = vistaPermitida === n.k;
            return (
              <button key={n.k}
                onClick={() => { setView(n.k); setObraSel(null); setQ(""); }}
                className="w-full flex items-center gap-3 px-5 py-2.5 text-[13.5px] transition-colors"
                style={{
                  background: active ? T.panel2 : "transparent",
                  color: active ? "#fff" : "#9AA4B2",
                  borderLeft: `3px solid ${active ? T.amber : "transparent"}`,
                  fontWeight: active ? 600 : 500,
                }}>
                <n.icon size={17} />
                <span>{n.label}</span>
              </button>
            );
          })}
        </nav>
        <div style={{ borderTop: `1px solid ${T.line}` }}>
          <div className="flex items-center gap-2.5 px-5 py-3">
            <div className="grid place-items-center rounded-full shrink-0 text-xs font-bold"
              style={{ width: 34, height: 34, background: rolColor(me.rol) + "33", color: "#fff", border: `1px solid ${rolColor(me.rol)}` }}>
              {iniciales(me.nombre)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold truncate" style={{ color: "#fff" }}>{me.nombre}</div>
              <div className="text-[10px] font-semibold" style={{ color: rolColor(me.rol) }}>{rolLabel(me.rol)}</div>
            </div>
            <button onClick={logout} title="Cerrar sesión" className="p-1.5 rounded-md hover:bg-white/10" style={{ color: "#9AA4B2" }}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="flex items-center justify-between px-7 py-4"
          style={{ background: T.card, borderBottom: `1px solid ${T.cardLine}` }}>
          <div>
            <div className="text-[11px] uppercase tracking-[.14em]" style={{ color: T.muted }}>Módulo</div>
            <h1 className="text-lg font-bold" style={{ color: T.ink }}>{viewTitle}</h1>
          </div>
          {derived.bajoStock?.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ background: "#FCEFE0", color: "#9A5A00", fontSize: 12.5, fontWeight: 600 }}>
              <AlertTriangle size={15} />
              {derived.bajoStock.length} material(es) bajo stock mínimo
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-7">
          {vistaPermitida === "panel" && <Panel {...{ data, derived, money, int, obraName }} />}
          {vistaPermitida === "planificacion" && <Planificacion {...{ data, setModal, remove, upsert, set, money, int }} />}
          {vistaPermitida === "obras" && <Obras {...{ data, q, setQ, money, clienteName, derived, openNew: () => setModal({ collection: "obras", item: null }), openEdit: (it) => setModal({ collection: "obras", item: it }), upsert, remove, set, addDoc, updateDoc, removeDoc }} />}
          {vistaPermitida === "clientes" && <Tabla
            titulo="Clientes" coll="clientes" data={data} q={q} setQ={setQ}
            cols={[{ k: "nombre", h: "Razón social" }, { k: "ruc", h: "RUC", mono: true }, { k: "contacto", h: "Contacto" }, { k: "telefono", h: "Teléfono", mono: true }, { k: "email", h: "Email" }]}
            onNew={() => setModal({ collection: "clientes", item: null })}
            onEdit={(it) => setModal({ collection: "clientes", item: it })}
            onDel={(id) => remove("clientes", id)} />}
          {vistaPermitida === "presupuestos" && <Presupuestos {...{ data, cfg, money, int, obraSel, setObraSel, clienteName, upsert, remove, setModal }} />}
          {vistaPermitida === "almacen" && <Almacen {...{ data, q, setQ, money, int, derived, matName, obraName, setModal, remove }} />}
          {vistaPermitida === "personal" && <Personal {...{ data, q, setQ, money, int, persName, obraName, setModal, remove }} />}
          {vistaPermitida === "caja" && <Caja {...{ data, money, obraName, derived, setModal, remove }} />}
          {vistaPermitida === "usuarios" && <Usuarios {...{ data, me, upsert, remove }} />}
          {vistaPermitida === "config" && <Config {...{ data, setData, cfg, setView }} />}
        </div>
      </main>

      {modal && <EntityModal {...{ modal, setModal, data, upsert, money }} />}
    </div>
  );
}

/* ============ Panel / Dashboard ============ */
function Panel({ data, derived, money, int, obraName }) {
  const kpis = [
    { label: "Obras activas", value: int(derived.activas.length), sub: `de ${int(data.obras.length)} en total`, color: T.green },
    { label: "Monto contractual", value: money(derived.montoTotal), sub: "cartera total", color: T.steel },
    { label: "Valorizado acumulado", value: money(derived.valorizadoTotal), sub: `${derived.montoTotal ? ((derived.valorizadoTotal / derived.montoTotal) * 100).toFixed(1) : 0}% de la cartera`, color: T.amber },
    { label: "Saldo de caja", value: money(derived.saldo), sub: `${money(derived.ingresos)} ingresos`, color: derived.saldo >= 0 ? T.green : T.red },
    { label: "Egresos totales", value: money(derived.egresos), sub: "gastos de caja", color: T.red },
  ];
  const barData = data.obras.map((o) => ({
    name: o.codigo,
    Contractual: +o.montoContractual || 0,
    Valorizado: data.valorizaciones.filter((v) => v.obraId === o.id).reduce((s, v) => s + (+v.monto || 0), 0),
    Egresos: (data.caja || []).filter((c) => c.obraId === o.id && c.tipo === "egreso").reduce((s, c) => s + (+c.monto || 0), 0),
  }));
  const estadoData = ESTADOS.map((e) => ({ name: e, value: data.obras.filter((o) => o.estado === e).length })).filter((x) => x.value > 0);

  return (
    <div>
      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: "repeat(5, minmax(0,1fr))" }}>
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl p-4" style={{ background: T.card, border: `1px solid ${T.cardLine}` }}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: T.muted }}>{k.label}</span>
              <span className="w-2 h-2 rounded-full" style={{ background: k.color }} />
            </div>
            <div className="mt-2 text-[22px] font-bold leading-tight" style={{ color: T.ink, fontFamily: T.mono }}>{k.value}</div>
            <div className="text-xs mt-1" style={{ color: T.muted }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: "1.6fr 1fr" }}>
        <div className="rounded-xl p-5" style={{ background: T.card, border: `1px solid ${T.cardLine}` }}>
          <h3 className="text-sm font-bold mb-1" style={{ color: T.ink }}>Contractual vs. valorizado por obra</h3>
          <p className="text-xs mb-3" style={{ color: T.muted }}>Avance financiero y egresos por obra</p>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 6, right: 6, left: -6, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.muted }} axisLine={{ stroke: T.cardLine }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: T.muted }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
                <Tooltip formatter={(v) => money(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${T.cardLine}` }} />
                <Bar dataKey="Contractual" fill={T.steel} radius={[3, 3, 0, 0]} />
                <Bar dataKey="Valorizado" fill={T.amber} radius={[3, 3, 0, 0]} />
                <Bar dataKey="Egresos" fill={T.red} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-5 mt-2 text-xs" style={{ color: T.muted }}>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: T.steel }} />Contractual</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: T.amber }} />Valorizado</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: T.red }} />Egresos</span>
          </div>
        </div>

        <div className="rounded-xl p-5" style={{ background: T.card, border: `1px solid ${T.cardLine}` }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: T.ink }}>Estado de obras</h3>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={estadoData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={44} outerRadius={72} paddingAngle={2}>
                  {estadoData.map((e) => <Cell key={e.name} fill={estadoColor(e.name)} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {estadoData.map((e) => (
              <div key={e.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2" style={{ color: T.text }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: estadoColor(e.name) }} />{e.name}
                </span>
                <span style={{ fontFamily: T.mono, color: T.muted }}>{e.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl p-5 mt-4" style={{ background: T.card, border: `1px solid ${T.cardLine}` }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: T.ink }}>Avance físico por obra</h3>
        <div className="space-y-3">
          {data.obras.map((o) => (
            <div key={o.id}>
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: T.text, fontWeight: 600 }}>{o.codigo} · {o.nombre}</span>
                <span style={{ fontFamily: T.mono, color: T.muted }}>{o.avance}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "#EEF0F3" }}>
                <div className="h-full rounded-full" style={{ width: `${o.avance}%`, background: estadoColor(o.estado) }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============ Obras (tarjetas) ============ */
function Obras({ data, q, setQ, money, clienteName, openNew, openEdit, upsert, remove, set, addDoc, updateDoc, removeDoc }) {
  const [open, setOpen] = useState(null); // {id, tab}
  if (open) {
    const obra = data.obras.find((o) => o.id === open.id);
    if (!obra) return null;
    return <ObraWorkspace {...{ data, obra, tab0: open.tab, back: () => setOpen(null), clienteName, upsert, remove, set, addDoc, updateDoc, removeDoc }} />;
  }
  const list = data.obras.filter((o) =>
    (o.nombre + o.codigo + clienteName(o.clienteId)).toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <Toolbar q={q} setQ={setQ} onNew={openNew} nuevoLabel="Nueva obra" placeholder="Buscar obra o cliente…" />
      {list.length === 0 ? <Empty label="No hay obras registradas." /> : (
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(2, minmax(0,1fr))" }}>
          {list.map((o) => {
            const valorizado = data.valorizaciones.filter((v) => v.obraId === o.id).reduce((s, v) => s + (+v.monto || 0), 0);
            const finPct = o.montoContractual ? (valorizado / o.montoContractual) * 100 : 0;
            const nFiles = (data.docs || []).filter((d) => d.obraId === o.id && d.tipo === "file").length;
            const nInt = (data.integrantes || []).filter((m) => m.obraId === o.id).length;
            const nTareas = (data.tareas || []).filter((t) => t.obraId === o.id).length;
            return (
              <div key={o.id} className="rounded-xl p-5" style={{ background: T.card, border: `1px solid ${T.cardLine}` }}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold px-1.5 py-0.5 rounded" style={{ background: T.ink, color: "#fff", fontFamily: T.mono }}>{o.codigo}</span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: estadoColor(o.estado) + "22", color: estadoColor(o.estado) }}>{o.estado}</span>
                    </div>
                    <h3 className="text-[15px] font-bold mt-2 leading-snug" style={{ color: T.ink }}>{o.nombre}</h3>
                    <p className="text-xs mt-0.5" style={{ color: T.muted }}>{clienteName(o.clienteId)} · {o.ubicacion}</p>
                  </div>
                  <div className="flex gap-1">
                    <IconBtn icon={Pencil} onClick={() => openEdit(o)} />
                    <IconBtn icon={Trash2} onClick={() => remove("obras", o.id)} color={T.red} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-wide" style={{ color: T.muted }}>Monto contractual</div>
                    <div className="text-sm font-bold" style={{ fontFamily: T.mono, color: T.ink }}>{money(o.montoContractual)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wide" style={{ color: T.muted }}>Plazo</div>
                    <div className="text-xs font-semibold" style={{ color: T.text }}>{o.fechaInicio} → {o.fechaFin}</div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <ProgressRow label="Avance físico" pct={o.avance} color={estadoColor(o.estado)} />
                  <ProgressRow label="Avance financiero" pct={finPct} color={T.amber} note={money(valorizado)} />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <button onClick={() => setOpen({ id: o.id, tab: "planificacion" })}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12.5px] font-semibold transition-colors hover:opacity-90"
                    style={{ background: T.concrete, color: T.steel, border: `1px solid ${T.cardLine}` }}>
                    <ListTodo size={14} /> Plan{nTareas > 0 ? ` · ${nTareas}` : ""}
                  </button>
                  <button onClick={() => setOpen({ id: o.id, tab: "equipo" })}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12.5px] font-semibold transition-colors hover:opacity-90"
                    style={{ background: T.concrete, color: T.steel, border: `1px solid ${T.cardLine}` }}>
                    <Users size={14} /> Equipo{nInt > 0 ? ` · ${nInt}` : ""}
                  </button>
                  <button onClick={() => setOpen({ id: o.id, tab: "docs" })}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12.5px] font-semibold transition-colors hover:opacity-90"
                    style={{ background: T.concrete, color: T.steel, border: `1px solid ${T.cardLine}` }}>
                    <Folder size={14} /> Docs{nFiles > 0 ? ` · ${nFiles}` : ""}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============ Espacio de trabajo de una obra (pestañas) ============ */
const CATEGORIAS = ["Residente", "Ingenieros", "SOMA", "Calidad", "Equipo staff", "Cliente", "Proveedores"];
const CAT_PALETTE = [T.steel, T.steelDk, T.green, T.amber, "#8E5AD8", T.ink, "#9A5A00", "#0E8F8F", "#C2456E", "#5B6472"];
const catColor = (c, idx = 0) => ({
  "Residente": T.steel, "Ingenieros": T.steelDk, "SOMA": T.green,
  "Calidad": T.amber, "Equipo staff": "#8E5AD8", "Cliente": T.ink, "Proveedores": "#9A5A00",
}[c] ?? CAT_PALETTE[idx % CAT_PALETTE.length]);
const iniciales = (nombre) =>
  (nombre || "?").split(/\s+/).filter((w) => w && !w.endsWith(".")).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";

function ObraWorkspace({ data, obra, tab0, back, clienteName, upsert, remove, set, addDoc, updateDoc, removeDoc }) {
  const [tab, setTab] = useState(tab0 || "planificacion");
  const tabs = [["planificacion", "Planificación", ListTodo], ["equipo", "Equipo", Users], ["docs", "Documentos", Folder]];
  return (
    <div>
      <button onClick={back} className="flex items-center gap-1.5 text-sm mb-3" style={{ color: T.steel, fontWeight: 600 }}>
        <ArrowLeft size={15} /> Volver a obras
      </button>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[11px] font-bold px-1.5 py-0.5 rounded" style={{ background: T.ink, color: "#fff", fontFamily: T.mono }}>{obra.codigo}</span>
        <h2 className="text-base font-bold" style={{ color: T.ink }}>{obra.nombre}</h2>
      </div>
      <p className="text-xs mb-4" style={{ color: T.muted }}>{clienteName(obra.clienteId)} · {obra.ubicacion}</p>

      <div className="flex gap-1 p-1 rounded-lg mb-5" style={{ background: "#E3E6EB", width: "max-content" }}>
        {tabs.map(([k, l, Icon]) => (
          <button key={k} onClick={() => setTab(k)}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-md font-semibold"
            style={{ background: tab === k ? "#fff" : "transparent", color: tab === k ? T.ink : T.muted }}>
            <Icon size={15} /> {l}
          </button>
        ))}
      </div>

      {tab === "planificacion" && <Planner {...{ data, upsert, remove, set, obra }} />}
      {tab === "equipo" && <TeamPanel {...{ data, obra, upsert, remove, set }} />}
      {tab === "docs" && <FileManager {...{ data, obra, addDoc, updateDoc, removeDoc }} />}
    </div>
  );
}

/* ============ Cartera de integrantes ============ */
function TeamPanel({ data, obra, upsert, remove, set }) {
  const [modal, setModal] = useState(null);       // integrante {item, categoria}
  const [secModal, setSecModal] = useState(null); // sección {item}
  const sections = data.categorias || CATEGORIAS.map((n) => ({ id: n, nombre: n }));
  const nombres = sections.map((s) => s.nombre);
  const list = (data.integrantes || []).filter((m) => m.obraId === obra.id);

  const saveSeccion = (nombre, item) => {
    const nom = (nombre || "").trim();
    if (!nom) { alert("Escribe un nombre."); return; }
    if (sections.some((s) => s.nombre.toLowerCase() === nom.toLowerCase() && s.id !== item?.id)) { alert("Ya existe una sección con ese nombre."); return; }
    if (item) {
      upsert("categorias", { ...item, nombre: nom });
      if (item.nombre !== nom) set("integrantes", (data.integrantes || []).map((m) => (m.categoria === item.nombre ? { ...m, categoria: nom } : m)));
    } else {
      upsert("categorias", { id: uid(), nombre: nom });
    }
    setSecModal(null);
  };
  const delSeccion = (sec) => {
    const n = (data.integrantes || []).filter((m) => m.categoria === sec.nombre).length;
    if (confirm(`Eliminar la sección "${sec.nombre}"${n ? ` y sus ${n} integrante(s) en todas las obras` : ""}?`)) {
      if (n) set("integrantes", (data.integrantes || []).filter((m) => m.categoria !== sec.nombre));
      remove("categorias", sec.id);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm" style={{ color: T.muted }}>
          Cartera de integrantes · <b style={{ color: T.ink }}>{list.length}</b> registrados
        </p>
        <div className="flex gap-2">
          <Btn kind="ghost" onClick={() => setSecModal({ item: null })}><Plus size={15} />Nueva sección</Btn>
          <Btn onClick={() => setModal({ item: null, categoria: nombres[0] || "" })}><Plus size={15} />Nuevo integrante</Btn>
        </div>
      </div>

      {sections.length === 0 ? <Empty label="No hay secciones. Crea una para empezar." /> : (
        <div className="space-y-4">
          {sections.map((sec, i) => {
            const cat = sec.nombre;
            const color = catColor(cat, i);
            const members = list.filter((m) => m.categoria === cat);
            return (
              <div key={sec.id} className="rounded-xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.cardLine}` }}>
                <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: members.length ? `1px solid ${T.cardLine}` : "none" }}>
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                    <span className="text-sm font-bold" style={{ color: T.ink }}>{cat}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: color + "1e", color, fontFamily: T.mono }}>{members.length}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setModal({ item: null, categoria: cat })}
                      className="flex items-center gap-1 text-xs font-semibold mr-1" style={{ color: T.steel }}>
                      <Plus size={13} /> Agregar
                    </button>
                    <IconBtn icon={Pencil} onClick={() => setSecModal({ item: sec })} />
                    <IconBtn icon={Trash2} onClick={() => delSeccion(sec)} color={T.red} />
                  </div>
                </div>
                {members.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid #F0F2F5" }}>
                    <div className="grid place-items-center rounded-full shrink-0 text-xs font-bold"
                      style={{ width: 34, height: 34, background: color + "1e", color }}>
                      {iniciales(m.nombre)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate" style={{ color: T.ink }}>{m.nombre}</div>
                      <div className="text-xs truncate" style={{ color: T.muted }}>
                        {[m.cargo, m.empresa].filter(Boolean).join(" · ") || "—"}
                      </div>
                    </div>
                    <div className="text-xs text-right shrink-0" style={{ color: T.muted }}>
                      {m.telefono && <div style={{ fontFamily: T.mono }}>{m.telefono}</div>}
                      {m.email && <div className="truncate" style={{ maxWidth: 190 }}>{m.email}</div>}
                    </div>
                    <IconBtn icon={Pencil} onClick={() => setModal({ item: m, categoria: m.categoria })} />
                    <IconBtn icon={Trash2} onClick={() => remove("integrantes", m.id)} color={T.red} />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {modal && <IntegranteModal {...{ obra, item: modal.item, categoria: modal.categoria, categorias: nombres, upsert, onClose: () => setModal(null) }} />}
      {secModal && <SeccionModal item={secModal.item} onSave={saveSeccion} onClose={() => setSecModal(null)} />}
    </div>
  );
}

function SeccionModal({ item, onSave, onClose }) {
  const [nombre, setNombre] = useState(item?.nombre || "");
  return (
    <Modal title={item ? "Editar sección" : "Nueva sección"} onClose={onClose}>
      <Field label="Nombre de la sección *">
        <input style={inputStyle} autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onSave(nombre, item); }} placeholder="Ej. Topografía" />
      </Field>
      <div className="flex justify-end gap-2 mt-2">
        <Btn kind="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={() => onSave(nombre, item)}>{item ? "Guardar" : "Crear"}</Btn>
      </div>
    </Modal>
  );
}

function IntegranteModal({ obra, item, categoria, categorias, upsert, onClose }) {
  const [f, setF] = useState(item || { categoria, nombre: "", cargo: "", empresa: "", telefono: "", email: "", nota: "" });
  const set = (k, v) => setF({ ...f, [k]: v });
  const opts = categorias && categorias.length ? categorias : CATEGORIAS;
  const submit = () => {
    if (!f.nombre.trim()) { alert("Escribe el nombre del integrante."); return; }
    upsert("integrantes", { ...f, id: item?.id || uid(), obraId: obra.id });
    onClose();
  };
  const campos = [
    ["cargo", "Cargo / rol"], ["empresa", "Empresa"],
    ["telefono", "Teléfono"], ["email", "Email"],
  ];
  return (
    <Modal title={item ? "Editar integrante" : "Nuevo integrante"} onClose={onClose} wide>
      <div className="grid gap-x-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <Field label="Categoría">
          <select style={inputStyle} value={f.categoria} onChange={(e) => set("categoria", e.target.value)}>
            {opts.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Nombre / entidad *">
          <input style={inputStyle} value={f.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Ej. Ing. Marco Salazar" />
        </Field>
        {campos.map(([k, l]) => (
          <Field key={k} label={l}>
            <input style={inputStyle} value={f[k]} onChange={(e) => set(k, e.target.value)} />
          </Field>
        ))}
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Nota"><input style={inputStyle} value={f.nota} onChange={(e) => set("nota", e.target.value)} /></Field>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-2">
        <Btn kind="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={submit}>{item ? "Guardar" : "Agregar"}</Btn>
      </div>
    </Modal>
  );
}

/* ============ Gestor de documentos por obra ============ */
function FileManager({ data, obra, back, addDoc, updateDoc, removeDoc }) {
  const [folder, setFolder] = useState(null);   // id de carpeta actual (null = raíz)
  const [path, setPath] = useState([]);          // migas de pan [{id, nombre}]
  const [modal, setModal] = useState(null);      // {type:'folder'|'text', item}
  const fileInput = useRef(null);

  const docs = data.docs || [];
  const here = docs.filter((d) => d.obraId === obra.id && (d.parentId || null) === (folder || null));
  const folders = here.filter((d) => d.tipo === "folder").sort((a, b) => a.nombre.localeCompare(b.nombre));
  const files = here.filter((d) => d.tipo === "file").sort((a, b) => a.nombre.localeCompare(b.nombre));

  const enter = (f) => { setPath([...path, { id: f.id, nombre: f.nombre }]); setFolder(f.id); };
  const goCrumb = (i) => {
    if (i < 0) { setPath([]); setFolder(null); }
    else { setPath(path.slice(0, i + 1)); setFolder(path[i].id); }
  };

  const onUpload = async (e) => {
    const chosen = Array.from(e.target.files || []);
    for (const file of chosen) {
      if (file.size > 4.5 * 1048576) { alert(`"${file.name}" supera 4.5 MB y no se puede guardar. Comprime el archivo o súbelo dividido.`); continue; }
      const dataURL = await readFileAsDataURL(file);
      await addDoc({
        id: uid(), obraId: obra.id, parentId: folder || null, tipo: "file", kind: "binary",
        nombre: file.name, ext: extOf(file.name), mime: file.type, size: file.size, fecha: today(),
      }, dataURL);
    }
    if (fileInput.current) fileInput.current.value = "";
  };

  const saveFolder = (nombre, item) => {
    if (item) updateDoc(item.id, { nombre });
    else addDoc({ id: uid(), obraId: obra.id, parentId: folder || null, tipo: "folder", nombre, fecha: today() }, null);
    setModal(null);
  };
  const saveText = async ({ nombre, contenido }, item) => {
    const name = nombre.toLowerCase().endsWith(".txt") ? nombre : nombre + ".txt";
    if (item) {
      await setDocContent(item.id, contenido);
      updateDoc(item.id, { nombre: name, size: new Blob([contenido]).size });
    } else {
      await addDoc({
        id: uid(), obraId: obra.id, parentId: folder || null, tipo: "file", kind: "text",
        nombre: name, ext: "txt", mime: "text/plain", size: new Blob([contenido]).size, fecha: today(),
      }, contenido);
    }
    setModal(null);
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-4">
        <div>
          {/* Migas de pan */}
          <div className="flex items-center flex-wrap gap-1 text-sm">
            <button onClick={() => goCrumb(-1)} className="flex items-center gap-1 font-semibold" style={{ color: path.length ? T.steel : T.muted }}>
              <Folder size={14} /> Documentos
            </button>
            {path.map((c, i) => (
              <span key={c.id} className="flex items-center gap-1">
                <ChevronRight size={13} style={{ color: T.muted }} />
                <button onClick={() => goCrumb(i)} className="font-semibold" style={{ color: i === path.length - 1 ? T.ink : T.steel }}>{c.nombre}</button>
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Btn kind="ghost" onClick={() => setModal({ type: "folder", item: null })}><FolderPlus size={15} />Carpeta</Btn>
          <Btn kind="ghost" onClick={() => setModal({ type: "text", item: null })}><FilePlus size={15} />Crear archivo</Btn>
          <Btn onClick={() => fileInput.current?.click()}><Upload size={15} />Subir</Btn>
          <input ref={fileInput} type="file" multiple className="hidden" onChange={onUpload} />
        </div>
      </div>

      {folders.length === 0 && files.length === 0 ? (
        <div className="rounded-xl py-16 text-center" style={{ background: T.card, border: `1px dashed ${T.cardLine}` }}>
          <Folder size={30} className="mx-auto mb-3" style={{ color: T.cardLine }} />
          <p className="text-sm" style={{ color: T.muted }}>Esta carpeta está vacía.</p>
          <p className="text-xs mt-1" style={{ color: T.muted }}>Crea una subcarpeta, sube un archivo o crea uno nuevo.</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.cardLine}` }}>
          {folders.map((f) => (
            <div key={f.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50" style={{ borderBottom: "1px solid #F0F2F5" }}>
              <button onClick={() => enter(f)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                <Folder size={19} style={{ color: T.amber }} />
                <span className="font-semibold truncate" style={{ color: T.ink }}>{f.nombre}</span>
                <span className="text-xs" style={{ color: T.muted }}>
                  {docs.filter((d) => d.parentId === f.id).length} elemento(s)
                </span>
              </button>
              <span className="text-xs" style={{ color: T.muted, fontFamily: T.mono }}>{f.fecha}</span>
              <IconBtn icon={Pencil} onClick={() => setModal({ type: "folder", item: f })} />
              <IconBtn icon={Trash2} onClick={() => { if (confirm(`Eliminar la carpeta "${f.nombre}" y todo su contenido?`)) removeDoc(f.id); }} color={T.red} />
            </div>
          ))}
          {files.map((f) => (
            <div key={f.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50" style={{ borderBottom: "1px solid #F0F2F5" }}>
              <div className="grid place-items-center rounded-md shrink-0" style={{ width: 30, height: 30, background: extColor(f.ext) + "1e" }}>
                {f.kind === "text" ? <FileText size={16} style={{ color: extColor(f.ext) }} /> : <File size={16} style={{ color: extColor(f.ext) }} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate" style={{ color: T.ink }}>{f.nombre}</div>
                <div className="text-xs" style={{ color: T.muted }}>
                  <span className="uppercase" style={{ fontFamily: T.mono }}>{f.ext || "archivo"}</span> · {fmtSize(f.size)} · {f.fecha}
                </div>
              </div>
              {f.kind === "text" && <IconBtn icon={Pencil} onClick={() => setModal({ type: "text", item: f })} />}
              <IconBtn icon={Download} onClick={() => downloadDoc(f)} color={T.steel} />
              <IconBtn icon={Trash2} onClick={() => { if (confirm(`Eliminar "${f.nombre}"?`)) removeDoc(f.id); }} color={T.red} />
            </div>
          ))}
        </div>
      )}

      {modal?.type === "folder" && <FolderModal item={modal.item} onSave={saveFolder} onClose={() => setModal(null)} />}
      {modal?.type === "text" && <TextFileModal item={modal.item} onSave={saveText} onClose={() => setModal(null)} />}
    </div>
  );
}

function FolderModal({ item, onSave, onClose }) {
  const [nombre, setNombre] = useState(item?.nombre || "");
  return (
    <Modal title={item ? "Renombrar carpeta" : "Nueva carpeta"} onClose={onClose}>
      <Field label="Nombre de la carpeta *">
        <input style={inputStyle} value={nombre} autoFocus onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej. Planos estructurales" />
      </Field>
      <div className="flex justify-end gap-2 mt-2">
        <Btn kind="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={() => { if (!nombre.trim()) { alert("Escribe un nombre."); return; } onSave(nombre.trim(), item); }}>
          {item ? "Guardar" : "Crear"}
        </Btn>
      </div>
    </Modal>
  );
}

function TextFileModal({ item, onSave, onClose }) {
  const [nombre, setNombre] = useState(item?.nombre || "");
  const [contenido, setContenido] = useState("");
  const [cargando, setCargando] = useState(!!item);
  useEffect(() => {
    if (item) getDocContent(item.id).then((c) => { setContenido(c || ""); setCargando(false); });
  }, [item]);
  return (
    <Modal title={item ? "Editar archivo" : "Crear archivo de texto"} onClose={onClose} wide>
      <Field label="Nombre del archivo *">
        <input style={inputStyle} value={nombre} onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej. Acta de reunión 25-08.txt" />
      </Field>
      <Field label="Contenido">
        <textarea
          style={{ ...inputStyle, minHeight: 240, fontFamily: T.mono, fontSize: 13, lineHeight: 1.5, resize: "vertical" }}
          value={cargando ? "Cargando…" : contenido}
          disabled={cargando}
          onChange={(e) => setContenido(e.target.value)}
          placeholder="Escribe aquí el contenido del documento…" />
      </Field>
      <div className="flex justify-end gap-2">
        <Btn kind="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={() => { if (!nombre.trim()) { alert("Escribe un nombre."); return; } onSave({ nombre: nombre.trim(), contenido }, item); }}>
          {item ? "Guardar cambios" : "Crear archivo"}
        </Btn>
      </div>
    </Modal>
  );
}
function ProgressRow({ label, pct, color, note }) {
  const p = Math.min(100, Math.max(0, pct));
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1">
        <span style={{ color: T.muted }}>{label}</span>
        <span style={{ fontFamily: T.mono, color: T.text }}>{note ? `${note} · ` : ""}{p.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#EEF0F3" }}>
        <div className="h-full rounded-full" style={{ width: `${p}%`, background: color }} />
      </div>
    </div>
  );
}

/* ============ Tabla genérica (clientes) ============ */
function Toolbar({ q, setQ, onNew, nuevoLabel, placeholder }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2 px-3 rounded-lg" style={{ background: T.card, border: `1px solid ${T.cardLine}`, width: 320 }}>
        <Search size={15} style={{ color: T.muted }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder}
          className="py-2 text-sm w-full" style={{ outline: "none", background: "transparent", color: T.text }} />
      </div>
      <Btn onClick={onNew}><Plus size={15} />{nuevoLabel}</Btn>
    </div>
  );
}

function Tabla({ titulo, coll, data, q, setQ, cols, onNew, onEdit, onDel }) {
  const rows = data[coll].filter((r) =>
    cols.some((c) => String(r[c.k] || "").toLowerCase().includes(q.toLowerCase())));
  return (
    <div>
      <Toolbar q={q} setQ={setQ} onNew={onNew} nuevoLabel={`Nuevo`} placeholder={`Buscar en ${titulo.toLowerCase()}…`} />
      <div className="rounded-xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.cardLine}` }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F7F8FA", borderBottom: `1px solid ${T.cardLine}` }}>
              {cols.map((c) => <th key={c.k} className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: T.muted }}>{c.h}</th>)}
              <th className="px-4 py-2.5 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ borderBottom: `1px solid #F0F2F5` }}>
                {cols.map((c) => (
                  <td key={c.k} className="px-4 py-3" style={{ color: T.text, fontFamily: c.mono ? T.mono : T.sans, fontSize: c.mono ? 12.5 : 14 }}>
                    {r[c.k] || <span style={{ color: T.muted }}>—</span>}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-end">
                    <IconBtn icon={Pencil} onClick={() => onEdit(r)} />
                    <IconBtn icon={Trash2} onClick={() => onDel(r.id)} color={T.red} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <Empty label="Sin registros." />}
      </div>
    </div>
  );
}

/* ============ Presupuestos (APU simple por obra) ============ */
function Presupuestos({ data, cfg, money, int, obraSel, setObraSel, clienteName, upsert, remove, setModal }) {
  const [subtab, setSubtab] = useState("presupuesto");
  if (!obraSel) {
    return (
      <div>
        <p className="text-sm mb-4" style={{ color: T.muted }}>Selecciona una obra para ver o editar su presupuesto por partidas.</p>
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(2,minmax(0,1fr))" }}>
          {data.obras.map((o) => {
            const cd = data.partidas.filter((p) => p.obraId === o.id).reduce((s, p) => s + (+p.metrado || 0) * (+p.pu || 0), 0);
            return (
              <button key={o.id} onClick={() => setObraSel(o.id)}
                className="text-left rounded-xl p-4 hover:shadow-md transition-shadow"
                style={{ background: T.card, border: `1px solid ${T.cardLine}` }}>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded" style={{ background: T.ink, color: "#fff", fontFamily: T.mono }}>{o.codigo}</span>
                  <span className="text-sm font-bold" style={{ color: T.ink }}>{o.nombre}</span>
                </div>
                <div className="mt-3 flex justify-between text-xs">
                  <span style={{ color: T.muted }}>Costo directo</span>
                  <span style={{ fontFamily: T.mono, color: T.text, fontWeight: 700 }}>{money(cd)}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  const obra = data.obras.find((o) => o.id === obraSel);
  const partidas = data.partidas.filter((p) => p.obraId === obraSel);
  const cd = partidas.reduce((s, p) => s + (+p.metrado || 0) * (+p.pu || 0), 0);
  const gg = cd * (+cfg.ggPct / 100);
  const util = cd * (+cfg.utilPct / 100);
  const sub = cd + gg + util;
  const igv = sub * 0.18;
  const total = sub + igv;

  return (
    <div>
      <button onClick={() => setObraSel(null)} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: T.steel, fontWeight: 600 }}>
        <ArrowLeft size={15} /> Volver a obras
      </button>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-base font-bold" style={{ color: T.ink }}>{obra.codigo} · {obra.nombre}</h2>
          <p className="text-xs" style={{ color: T.muted }}>{clienteName(obra.clienteId)}</p>
        </div>
        {subtab === "presupuesto"
          ? <Btn onClick={() => setModal({ collection: "partidas", item: null, extra: { obraId: obraSel } })}><Plus size={15} />Nueva partida</Btn>
          : <Btn onClick={() => setModal({ collection: "caja", item: null, extra: { obraId: obraSel } })}><Plus size={15} />Nuevo movimiento</Btn>}
      </div>

      <div className="flex gap-1 p-1 rounded-lg mb-5" style={{ background: "#E3E6EB", width: "max-content" }}>
        {[["presupuesto", "Presupuesto", Calculator], ["flujo", "Flujo de caja", Wallet]].map(([k, l, Icon]) => (
          <button key={k} onClick={() => setSubtab(k)}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-md font-semibold"
            style={{ background: subtab === k ? "#fff" : "transparent", color: subtab === k ? T.ink : T.muted }}>
            <Icon size={15} /> {l}
          </button>
        ))}
      </div>

      {subtab === "flujo" ? (
        <FlujoObra {...{ data, obra, money, presupuesto: total, setModal, remove }} />
      ) : (
        <>
          <div className="rounded-xl overflow-hidden mb-4" style={{ background: T.card, border: `1px solid ${T.cardLine}` }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#F7F8FA", borderBottom: `1px solid ${T.cardLine}` }}>
                  {["Ítem", "Descripción", "Und.", "Metrado", "P. Unit.", "Parcial", ""].map((h, i) => (
                    <th key={i} className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: T.muted, textAlign: i >= 3 && i <= 5 ? "right" : "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {partidas.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #F0F2F5" }}>
                    <td className="px-4 py-3" style={{ fontFamily: T.mono, fontSize: 12.5 }}>{p.item}</td>
                    <td className="px-4 py-3">{p.descripcion}</td>
                    <td className="px-4 py-3" style={{ color: T.muted }}>{p.unidad}</td>
                    <td className="px-4 py-3 text-right" style={{ fontFamily: T.mono }}>{int(p.metrado)}</td>
                    <td className="px-4 py-3 text-right" style={{ fontFamily: T.mono }}>{money(p.pu)}</td>
                    <td className="px-4 py-3 text-right font-bold" style={{ fontFamily: T.mono }}>{money((+p.metrado || 0) * (+p.pu || 0))}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <IconBtn icon={Pencil} onClick={() => setModal({ collection: "partidas", item: p, extra: { obraId: obraSel } })} />
                        <IconBtn icon={Trash2} onClick={() => remove("partidas", p.id)} color={T.red} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {partidas.length === 0 && <Empty label="Aún no hay partidas en esta obra." />}
          </div>

          <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 320px" }}>
            <div className="rounded-xl p-4" style={{ background: "#FCEFE0", border: `1px solid #F0D9BB` }}>
              <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "#9A5A00" }}>
                <AlertTriangle size={16} />Comparación con contrato
              </div>
              <p className="text-xs mt-2" style={{ color: "#9A5A00" }}>
                Monto contractual: <b style={{ fontFamily: T.mono }}>{money(obra.montoContractual)}</b> ·
                {" "}Presupuesto calculado: <b style={{ fontFamily: T.mono }}>{money(total)}</b>.
                {" "}{total > obra.montoContractual
                  ? "El presupuesto supera el contrato, revisa márgenes."
                  : "El presupuesto está dentro del contrato."}
              </p>
            </div>
            <div className="rounded-xl p-4" style={{ background: T.panel, color: "#fff" }}>
              <ResumenRow l="Costo directo" v={money(cd)} />
              <ResumenRow l={`Gastos generales (${cfg.ggPct}%)`} v={money(gg)} />
              <ResumenRow l={`Utilidad (${cfg.utilPct}%)`} v={money(util)} />
              <ResumenRow l="Subtotal" v={money(sub)} />
              <ResumenRow l="IGV (18%)" v={money(igv)} />
              <div className="flex justify-between pt-2 mt-2" style={{ borderTop: `1px solid ${T.line}` }}>
                <span className="text-sm font-bold">Total presupuesto</span>
                <span className="text-sm font-bold" style={{ fontFamily: T.mono, color: T.amber }}>{money(total)}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function FlujoObra({ data, obra, money, presupuesto, setModal, remove }) {
  const movs = (data.caja || []).filter((c) => c.obraId === obra.id).sort((a, b) => (a.fecha || "").localeCompare(b.fecha || ""));
  const ingresos = movs.filter((c) => c.tipo === "ingreso").reduce((s, c) => s + (+c.monto || 0), 0);
  const egresos = movs.filter((c) => c.tipo === "egreso").reduce((s, c) => s + (+c.monto || 0), 0);
  const saldo = ingresos - egresos;
  const pct = presupuesto ? Math.min(100, (egresos / presupuesto) * 100) : 0;
  let run = 0;
  const rows = movs.map((c) => { run += c.tipo === "ingreso" ? (+c.monto || 0) : -(+c.monto || 0); return { ...c, saldoAcum: run }; });

  return (
    <div>
      <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        {[["Ingresos de obra", ingresos, T.green], ["Egresos de obra", egresos, T.red], ["Saldo de obra", saldo, saldo >= 0 ? T.ink : T.red]].map(([l, v, c]) => (
          <div key={l} className="rounded-xl p-4" style={{ background: T.card, border: `1px solid ${T.cardLine}` }}>
            <div className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: T.muted }}>{l}</div>
            <div className="text-lg font-bold mt-1" style={{ fontFamily: T.mono, color: c }}>{money(v)}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl p-4 mb-4" style={{ background: T.card, border: `1px solid ${T.cardLine}` }}>
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold" style={{ color: T.text }}>Egresos ejecutados vs. presupuesto</span>
          <span style={{ color: T.muted, fontFamily: T.mono }}>{money(egresos)} de {money(presupuesto)} · {pct.toFixed(1)}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "#EEF0F3" }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 100 ? T.red : T.steel }} />
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.cardLine}` }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F7F8FA", borderBottom: `1px solid ${T.cardLine}` }}>
              {["Fecha", "Concepto", "Tipo", "Monto", "Saldo acum.", ""].map((h, i) => (
                <th key={i} className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: T.muted, textAlign: i >= 3 && i <= 4 ? "right" : "left" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} style={{ borderBottom: "1px solid #F0F2F5" }}>
                <td className="px-4 py-3" style={{ fontFamily: T.mono, fontSize: 12.5 }}>{c.fecha}</td>
                <td className="px-4 py-3">{c.concepto}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: (c.tipo === "ingreso" ? T.green : T.red) + "1e", color: c.tipo === "ingreso" ? T.green : T.red }}>{c.tipo}</span>
                </td>
                <td className="px-4 py-3 text-right font-bold" style={{ fontFamily: T.mono, color: c.tipo === "ingreso" ? T.green : T.red }}>
                  {c.tipo === "ingreso" ? "+" : "−"}{money(c.monto)}
                </td>
                <td className="px-4 py-3 text-right" style={{ fontFamily: T.mono, color: c.saldoAcum < 0 ? T.red : T.text }}>{money(c.saldoAcum)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-end">
                    <IconBtn icon={Pencil} onClick={() => setModal({ collection: "caja", item: c })} />
                    <IconBtn icon={Trash2} onClick={() => remove("caja", c.id)} color={T.red} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <Empty label="Sin movimientos de caja para esta obra." />}
      </div>
    </div>
  );
}
function ResumenRow({ l, v }) {
  return (
    <div className="flex justify-between text-[13px] py-1">
      <span style={{ color: "#9AA4B2" }}>{l}</span>
      <span style={{ fontFamily: T.mono }}>{v}</span>
    </div>
  );
}

/* ============ Almacén ============ */
function Almacen({ data, q, setQ, money, int, derived, matName, obraName, setModal, remove }) {
  const [tab, setTab] = useState("materiales");
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: "#E3E6EB" }}>
          {[["materiales", "Materiales"], ["movimientos", "Movimientos"]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className="px-4 py-1.5 text-sm rounded-md font-semibold"
              style={{ background: tab === k ? "#fff" : "transparent", color: tab === k ? T.ink : T.muted }}>{l}</button>
          ))}
        </div>
        <Btn onClick={() => setModal({ collection: tab === "materiales" ? "materiales" : "movimientos", item: null })}>
          <Plus size={15} />{tab === "materiales" ? "Nuevo material" : "Registrar movimiento"}
        </Btn>
      </div>

      {tab === "materiales" ? (
        <div className="rounded-xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.cardLine}` }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F7F8FA", borderBottom: `1px solid ${T.cardLine}` }}>
                {["Código", "Material", "Und.", "Stock actual", "Mínimo", "Precio", "Valor stock", ""].map((h, i) => (
                  <th key={i} className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: T.muted, textAlign: i >= 3 && i <= 6 ? "right" : "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.materiales.map((m) => {
                const stock = derived.stockDe(m);
                const bajo = stock < (+m.stockMin || 0);
                return (
                  <tr key={m.id} style={{ borderBottom: "1px solid #F0F2F5" }}>
                    <td className="px-4 py-3" style={{ fontFamily: T.mono, fontSize: 12.5 }}>{m.codigo}</td>
                    <td className="px-4 py-3">{m.nombre}</td>
                    <td className="px-4 py-3" style={{ color: T.muted }}>{m.unidad}</td>
                    <td className="px-4 py-3 text-right font-bold" style={{ fontFamily: T.mono, color: bajo ? T.red : T.ink }}>
                      {int(stock)}{bajo && <AlertTriangle size={13} className="inline ml-1 -mt-0.5" />}
                    </td>
                    <td className="px-4 py-3 text-right" style={{ fontFamily: T.mono, color: T.muted }}>{int(m.stockMin)}</td>
                    <td className="px-4 py-3 text-right" style={{ fontFamily: T.mono }}>{money(m.precio)}</td>
                    <td className="px-4 py-3 text-right font-semibold" style={{ fontFamily: T.mono }}>{money(stock * (+m.precio || 0))}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <IconBtn icon={Pencil} onClick={() => setModal({ collection: "materiales", item: m })} />
                        <IconBtn icon={Trash2} onClick={() => remove("materiales", m.id)} color={T.red} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {data.materiales.length === 0 && <Empty label="Sin materiales." />}
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.cardLine}` }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F7F8FA", borderBottom: `1px solid ${T.cardLine}` }}>
                {["Fecha", "Tipo", "Material", "Cantidad", "Obra", "Nota", ""].map((h, i) => (
                  <th key={i} className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: T.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...data.movimientos].sort((a, b) => (b.fecha || "").localeCompare(a.fecha || "")).map((mv) => (
                <tr key={mv.id} style={{ borderBottom: "1px solid #F0F2F5" }}>
                  <td className="px-4 py-3" style={{ fontFamily: T.mono, fontSize: 12.5 }}>{mv.fecha}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: (mv.tipo === "entrada" ? T.green : T.red) + "1e", color: mv.tipo === "entrada" ? T.green : T.red }}>
                      {mv.tipo === "entrada" ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}{mv.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3">{matName(mv.materialId)}</td>
                  <td className="px-4 py-3" style={{ fontFamily: T.mono }}>{int(mv.cantidad)}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: T.muted }}>{mv.obraId ? obraName(mv.obraId) : "—"}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: T.muted }}>{mv.nota || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <IconBtn icon={Trash2} onClick={() => remove("movimientos", mv.id)} color={T.red} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.movimientos.length === 0 && <Empty label="Sin movimientos de almacén." />}
        </div>
      )}
    </div>
  );
}

/* ============ Personal + Tareo ============ */
function Personal({ data, q, setQ, money, int, persName, obraName, setModal, remove }) {
  const [tab, setTab] = useState("planilla");
  const costoTareo = (t) => (+t.dias || 0) * (data.personal.find((p) => p.id === t.personalId)?.costoDia || 0);
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: "#E3E6EB" }}>
          {[["planilla", "Planilla"], ["tareo", "Tareo"]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className="px-4 py-1.5 text-sm rounded-md font-semibold"
              style={{ background: tab === k ? "#fff" : "transparent", color: tab === k ? T.ink : T.muted }}>{l}</button>
          ))}
        </div>
        <Btn onClick={() => setModal({ collection: tab === "planilla" ? "personal" : "tareo", item: null })}>
          <Plus size={15} />{tab === "planilla" ? "Nuevo trabajador" : "Registrar tareo"}
        </Btn>
      </div>

      {tab === "planilla" ? (
        <div className="rounded-xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.cardLine}` }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F7F8FA", borderBottom: `1px solid ${T.cardLine}` }}>
                {["Nombre", "DNI", "Cargo", "Costo/día", ""].map((h, i) => (
                  <th key={i} className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: T.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.personal.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #F0F2F5" }}>
                  <td className="px-4 py-3 font-semibold">{p.nombre}</td>
                  <td className="px-4 py-3" style={{ fontFamily: T.mono, fontSize: 12.5 }}>{p.dni}</td>
                  <td className="px-4 py-3" style={{ color: T.muted }}>{p.cargo}</td>
                  <td className="px-4 py-3" style={{ fontFamily: T.mono }}>{money(p.costoDia)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <IconBtn icon={Pencil} onClick={() => setModal({ collection: "personal", item: p })} />
                      <IconBtn icon={Trash2} onClick={() => remove("personal", p.id)} color={T.red} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.personal.length === 0 && <Empty label="Sin personal registrado." />}
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.cardLine}` }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F7F8FA", borderBottom: `1px solid ${T.cardLine}` }}>
                {["Fecha", "Trabajador", "Obra", "Días", "Costo M.O.", ""].map((h, i) => (
                  <th key={i} className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: T.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...data.tareo].sort((a, b) => (b.fecha || "").localeCompare(a.fecha || "")).map((t) => (
                <tr key={t.id} style={{ borderBottom: "1px solid #F0F2F5" }}>
                  <td className="px-4 py-3" style={{ fontFamily: T.mono, fontSize: 12.5 }}>{t.fecha}</td>
                  <td className="px-4 py-3">{persName(t.personalId)}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: T.muted }}>{obraName(t.obraId)}</td>
                  <td className="px-4 py-3" style={{ fontFamily: T.mono }}>{t.dias}</td>
                  <td className="px-4 py-3 font-semibold" style={{ fontFamily: T.mono }}>{money(costoTareo(t))}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <IconBtn icon={Trash2} onClick={() => remove("tareo", t.id)} color={T.red} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.tareo.length === 0 && <Empty label="Sin tareos registrados." />}
        </div>
      )}
    </div>
  );
}

/* ============ Valorizaciones ============ */
function Valorizaciones({ data, money, int, obraSel, setObraSel, setModal, remove }) {
  if (!obraSel) {
    return (
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(2,minmax(0,1fr))" }}>
        {data.obras.map((o) => {
          const val = data.valorizaciones.filter((v) => v.obraId === o.id).reduce((s, v) => s + (+v.monto || 0), 0);
          const pct = o.montoContractual ? (val / o.montoContractual) * 100 : 0;
          return (
            <button key={o.id} onClick={() => setObraSel(o.id)} className="text-left rounded-xl p-4 hover:shadow-md"
              style={{ background: T.card, border: `1px solid ${T.cardLine}` }}>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded" style={{ background: T.ink, color: "#fff", fontFamily: T.mono }}>{o.codigo}</span>
                <span className="text-sm font-bold" style={{ color: T.ink }}>{o.nombre}</span>
              </div>
              <ProgressRow label="Valorizado / contrato" pct={pct} color={T.amber} note={money(val)} />
            </button>
          );
        })}
      </div>
    );
  }
  const obra = data.obras.find((o) => o.id === obraSel);
  const vals = data.valorizaciones.filter((v) => v.obraId === obraSel).sort((a, b) => (a.fecha || "").localeCompare(b.fecha || ""));
  const acum = vals.reduce((s, v) => s + (+v.monto || 0), 0);
  const saldo = (+obra.montoContractual || 0) - acum;
  return (
    <div>
      <button onClick={() => setObraSel(null)} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: T.steel, fontWeight: 600 }}>
        <ArrowLeft size={15} /> Volver a obras
      </button>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold" style={{ color: T.ink }}>{obra.codigo} · {obra.nombre}</h2>
        <Btn onClick={() => setModal({ collection: "valorizaciones", item: null, extra: { obraId: obraSel } })}><Plus size={15} />Nueva valorización</Btn>
      </div>
      <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        {[["Monto contractual", money(obra.montoContractual), T.steel], ["Valorizado acumulado", money(acum), T.amber], ["Saldo por valorizar", money(saldo), saldo >= 0 ? T.green : T.red]].map(([l, v, c]) => (
          <div key={l} className="rounded-xl p-4" style={{ background: T.card, border: `1px solid ${T.cardLine}` }}>
            <div className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: T.muted }}>{l}</div>
            <div className="text-lg font-bold mt-1" style={{ fontFamily: T.mono, color: c }}>{v}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.cardLine}` }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F7F8FA", borderBottom: `1px solid ${T.cardLine}` }}>
              {["Fecha", "Periodo", "Monto", ""].map((h, i) => (
                <th key={i} className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: T.muted }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vals.map((v) => (
              <tr key={v.id} style={{ borderBottom: "1px solid #F0F2F5" }}>
                <td className="px-4 py-3" style={{ fontFamily: T.mono, fontSize: 12.5 }}>{v.fecha}</td>
                <td className="px-4 py-3">{v.periodo}</td>
                <td className="px-4 py-3 font-bold" style={{ fontFamily: T.mono }}>{money(v.monto)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-end">
                    <IconBtn icon={Pencil} onClick={() => setModal({ collection: "valorizaciones", item: v, extra: { obraId: obraSel } })} />
                    <IconBtn icon={Trash2} onClick={() => remove("valorizaciones", v.id)} color={T.red} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {vals.length === 0 && <Empty label="Sin valorizaciones para esta obra." />}
      </div>
    </div>
  );
}

/* ============ Caja / Finanzas ============ */
function Caja({ data, money, obraName, derived, setModal, remove }) {
  return (
    <div>
      <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        {[["Ingresos", derived.ingresos, T.green], ["Egresos", derived.egresos, T.red], ["Saldo", derived.saldo, derived.saldo >= 0 ? T.ink : T.red]].map(([l, v, c]) => (
          <div key={l} className="rounded-xl p-4" style={{ background: T.card, border: `1px solid ${T.cardLine}` }}>
            <div className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: T.muted }}>{l}</div>
            <div className="text-lg font-bold mt-1" style={{ fontFamily: T.mono, color: c }}>{money(v)}</div>
          </div>
        ))}
      </div>
      <div className="flex justify-end mb-4">
        <Btn onClick={() => setModal({ collection: "caja", item: null })}><Plus size={15} />Nuevo movimiento</Btn>
      </div>
      <div className="rounded-xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.cardLine}` }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F7F8FA", borderBottom: `1px solid ${T.cardLine}` }}>
              {["Fecha", "Tipo", "Concepto", "Obra", "Monto", ""].map((h, i) => (
                <th key={i} className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: T.muted }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...data.caja].sort((a, b) => (b.fecha || "").localeCompare(a.fecha || "")).map((c) => (
              <tr key={c.id} style={{ borderBottom: "1px solid #F0F2F5" }}>
                <td className="px-4 py-3" style={{ fontFamily: T.mono, fontSize: 12.5 }}>{c.fecha}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: (c.tipo === "ingreso" ? T.green : T.red) + "1e", color: c.tipo === "ingreso" ? T.green : T.red }}>{c.tipo}</span>
                </td>
                <td className="px-4 py-3">{c.concepto}</td>
                <td className="px-4 py-3 text-xs" style={{ color: T.muted }}>{c.obraId ? obraName(c.obraId) : "—"}</td>
                <td className="px-4 py-3 font-bold" style={{ fontFamily: T.mono, color: c.tipo === "ingreso" ? T.green : T.red }}>
                  {c.tipo === "ingreso" ? "+" : "−"}{money(c.monto)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-end">
                    <IconBtn icon={Trash2} onClick={() => remove("caja", c.id)} color={T.red} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.caja.length === 0 && <Empty label="Sin movimientos de caja." />}
      </div>
    </div>
  );
}

/* ============ Configuración ============ */
function Config({ data, setData, cfg, setView }) {
  const [f, setF] = useState(cfg);
  const save = () => setData((d) => ({ ...d, cfg: { ...f, ggPct: +f.ggPct, utilPct: +f.utilPct } }));
  const reset = () => {
    if (confirm("Esto borrará todos los datos y cargará el ejemplo inicial. ¿Continuar?")) {
      setData(seed()); setView("panel");
    }
  };
  return (
    <div style={{ maxWidth: 520 }}>
      <div className="rounded-xl p-5 mb-4" style={{ background: T.card, border: `1px solid ${T.cardLine}` }}>
        <h3 className="text-sm font-bold mb-4" style={{ color: T.ink }}>Datos de la empresa</h3>
        <Field label="Nombre de la empresa">
          <input style={inputStyle} value={f.empresa} onChange={(e) => setF({ ...f, empresa: e.target.value })} />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Moneda"><input style={inputStyle} value={f.moneda} onChange={(e) => setF({ ...f, moneda: e.target.value })} /></Field>
          <Field label="Gastos grales. %"><input type="number" style={inputStyle} value={f.ggPct} onChange={(e) => setF({ ...f, ggPct: e.target.value })} /></Field>
          <Field label="Utilidad %"><input type="number" style={inputStyle} value={f.utilPct} onChange={(e) => setF({ ...f, utilPct: e.target.value })} /></Field>
        </div>
        <div className="mt-2"><Btn onClick={save}>Guardar cambios</Btn></div>
      </div>
      <div className="rounded-xl p-5" style={{ background: T.card, border: `1px solid ${T.cardLine}` }}>
        <h3 className="text-sm font-bold mb-1" style={{ color: T.ink }}>Datos del sistema</h3>
        <p className="text-xs mb-3" style={{ color: T.muted }}>
          La información se guarda automáticamente en este dispositivo. Restablecer carga de nuevo el ejemplo inicial.
        </p>
        <Btn kind="danger" onClick={reset}><Trash2 size={14} />Restablecer datos de ejemplo</Btn>
      </div>
    </div>
  );
}

/* ============ Planificación (equipo + tablero tipo Planner) ============ */
const PRIORIDADES = ["Baja", "Media", "Alta", "Urgente"];
const ESTADOS_TAREA = ["Sin iniciar", "En curso", "Completado"];
const prioColor = (p) => ({ "Baja": "#6B7480", "Media": T.steel, "Alta": T.amber, "Urgente": T.red }[p] || T.muted);
const estadoTareaColor = (e) => ({ "Sin iniciar": "#6B7480", "En curso": T.steel, "Completado": T.green }[e] || T.muted);

function Planificacion({ data, setModal, remove, upsert, set, money, int }) {
  const [tab, setTab] = useState("tablero");
  const [valObra, setValObra] = useState(null);
  const tabs = [["tablero", "Tablero", ListTodo], ["valorizaciones", "Valorizaciones", ClipboardList], ["equipo", "Equipo de planificación", Users]];
  return (
    <div>
      <div className="flex gap-1 p-1 rounded-lg mb-5" style={{ background: "#E3E6EB", width: "max-content" }}>
        {tabs.map(([k, l, Icon]) => (
          <button key={k} onClick={() => setTab(k)}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-md font-semibold"
            style={{ background: tab === k ? "#fff" : "transparent", color: tab === k ? T.ink : T.muted }}>
            <Icon size={15} /> {l}
          </button>
        ))}
      </div>
      {tab === "tablero" && <Planner {...{ data, upsert, remove, set }} />}
      {tab === "valorizaciones" && <Valorizaciones {...{ data, money, int, obraSel: valObra, setObraSel: setValObra, setModal, remove }} />}
      {tab === "equipo" && <PlanTeam {...{ data, setModal, remove }} />}
    </div>
  );
}

function PlanTeam({ data, setModal, remove }) {
  const list = data.planTeam || [];
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm" style={{ color: T.muted }}>
          Integrantes del equipo de planificación · <b style={{ color: T.ink }}>{list.length}</b>
        </p>
        <Btn onClick={() => setModal({ collection: "planTeam", item: null })}><UserPlus size={15} />Nuevo integrante</Btn>
      </div>
      {list.length === 0 ? <Empty label="Aún no hay integrantes en el equipo de planificación." /> : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(3, minmax(0,1fr))" }}>
          {list.map((m) => (
            <div key={m.id} className="rounded-xl p-4 flex items-start gap-3" style={{ background: T.card, border: `1px solid ${T.cardLine}` }}>
              <div className="grid place-items-center rounded-full shrink-0 text-sm font-bold"
                style={{ width: 42, height: 42, background: T.steel + "1e", color: T.steel }}>{iniciales(m.nombre)}</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate" style={{ color: T.ink }}>{m.nombre}</div>
                <div className="text-xs" style={{ color: T.steel, fontWeight: 600 }}>{m.rol || "—"}</div>
                {m.email && <div className="text-xs truncate mt-1" style={{ color: T.muted }}>{m.email}</div>}
                {m.telefono && <div className="text-xs" style={{ color: T.muted, fontFamily: T.mono }}>{m.telefono}</div>}
              </div>
              <div className="flex flex-col gap-1">
                <IconBtn icon={Pencil} onClick={() => setModal({ collection: "planTeam", item: m })} />
                <IconBtn icon={Trash2} onClick={() => remove("planTeam", m.id)} color={T.red} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Planner({ data, upsert, remove, set, obra }) {
  const scoped = !!obra;
  const [vista, setVista] = useState("tablero"); // tablero | calendario | gantt
  const [obraFiltro, setObraFiltro] = useState("");
  const [personaFiltro, setPersonaFiltro] = useState("");
  const [drag, setDrag] = useState(null);
  const [overBucket, setOverBucket] = useState(null);
  const [overCard, setOverCard] = useState(null);
  const [taskModal, setTaskModal] = useState(null);     // {item, bucketId}
  const [bucketModal, setBucketModal] = useState(null); // {item}
  const buckets = [...(data.buckets || [])].sort((a, b) => a.orden - b.orden);
  const team = data.planTeam || [];
  const miembro = (id) => team.find((m) => m.id === id);
  const match = (t) => (scoped ? t.obraId === obra.id : (!obraFiltro || t.obraId === obraFiltro)) && (!personaFiltro || (t.asignados || []).includes(personaFiltro));
  const tareasDe = (bid) => (data.tareas || []).filter((t) => t.bucketId === bid && match(t));
  const tareasFiltradas = (data.tareas || []).filter(match);

  const moveTask = (taskId, targetBucketId, beforeTaskId) => {
    const arr = [...(data.tareas || [])];
    const idx = arr.findIndex((t) => t.id === taskId);
    if (idx < 0) return;
    const [task] = arr.splice(idx, 1);
    const moved = { ...task, bucketId: targetBucketId };
    if (beforeTaskId && beforeTaskId !== taskId) {
      const bidx = arr.findIndex((t) => t.id === beforeTaskId);
      arr.splice(bidx < 0 ? arr.length : bidx, 0, moved);
    } else {
      let lastIdx = -1;
      arr.forEach((t, i) => { if (t.bucketId === targetBucketId) lastIdx = i; });
      arr.splice(lastIdx + 1, 0, moved);
    }
    set("tareas", arr);
  };
  const dropOnBucket = (bid) => { if (drag) moveTask(drag, bid, null); setDrag(null); setOverBucket(null); setOverCard(null); };
  const dropOnCard = (bid, cardId) => { if (drag && drag !== cardId) moveTask(drag, bid, cardId); setDrag(null); setOverBucket(null); setOverCard(null); };

  // Cambiar estado y mover la tarjeta a la columna que corresponde
  const bucketForEstado = (estado) => {
    const bs = buckets;
    const has = (b, kws) => kws.some((k) => (b.nombre || "").toLowerCase().includes(k));
    if (estado === "Completado") return bs.find((b) => has(b, ["hecho", "complet", "termin", "final", "fin", "cerr"])) || bs[bs.length - 1];
    if (estado === "En curso") return bs.find((b) => has(b, ["proceso", "curso", "ejecu", "seguim", "revis"])) || bs[Math.min(1, bs.length - 1)];
    return bs.find((b) => has(b, ["hacer", "inicio", "pendien", "backlog", "todo"])) || bs[0];
  };
  const setEstado = (t, estado) => {
    const target = bucketForEstado(estado);
    set("tareas", (data.tareas || []).map((x) => (x.id === t.id ? { ...x, estado, bucketId: target ? target.id : x.bucketId } : x)));
  };

  const saveBucket = (nombre, item) => {
    if (item) upsert("buckets", { ...item, nombre });
    else upsert("buckets", { id: uid(), nombre, orden: (buckets[buckets.length - 1]?.orden ?? -1) + 1 });
    setBucketModal(null);
  };
  const delBucket = (b) => {
    if (confirm(`Eliminar la columna "${b.nombre}" y todas sus tareas?`)) {
      (data.tareas || []).filter((t) => t.bucketId === b.id).forEach((t) => remove("tareas", t.id));
      remove("buckets", b.id);
    }
  };
  const overdue = (t) => t.fechaVenc && t.estado !== "Completado" && t.fechaVenc < today();
  const selWrap = { display: "flex", alignItems: "center", gap: 8, padding: "0 12px", borderRadius: 8, background: T.card, border: `1px solid ${T.cardLine}` };
  const abrir = (t) => setTaskModal({ item: t, bucketId: t.bucketId });

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3" style={{ flexWrap: "wrap" }}>
        <div className="flex items-center gap-2" style={{ flexWrap: "wrap" }}>
          {!scoped && (
            <div style={selWrap}>
              <Building2 size={15} style={{ color: T.muted }} />
              <select value={obraFiltro} onChange={(e) => setObraFiltro(e.target.value)}
                className="py-2 text-sm" style={{ outline: "none", background: "transparent", color: T.text }}>
                <option value="">Todas las obras</option>
                {data.obras.map((o) => <option key={o.id} value={o.id}>{o.codigo} · {o.nombre}</option>)}
              </select>
            </div>
          )}
          <div style={selWrap}>
            <Users size={15} style={{ color: T.muted }} />
            <select value={personaFiltro} onChange={(e) => setPersonaFiltro(e.target.value)}
              className="py-2 text-sm" style={{ outline: "none", background: "transparent", color: T.text }}>
              <option value="">Todas las personas</option>
              {team.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: "#E3E6EB" }}>
            {[["tablero", "Tablero", ListTodo], ["calendario", "Calendario", CalendarDays], ["gantt", "Gantt", TrendingUp]].map(([k, l, Icon]) => (
              <button key={k} onClick={() => setVista(k)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] rounded-md font-semibold"
                style={{ background: vista === k ? "#fff" : "transparent", color: vista === k ? T.ink : T.muted }}>
                <Icon size={14} /> {l}
              </button>
            ))}
          </div>
          {vista === "tablero" && <Btn kind="ghost" onClick={() => setBucketModal({ item: null })}><Plus size={15} />Columna</Btn>}
        </div>
      </div>

      {vista === "tablero" && (
        <div className="flex gap-4 overflow-x-auto pb-2" style={{ alignItems: "flex-start" }}>
          {buckets.map((b) => {
            const tareas = tareasDe(b.id);
            const activo = overBucket === b.id;
            return (
              <div key={b.id} className="shrink-0 rounded-xl flex flex-col"
                style={{ width: 300, background: activo ? "#E9EEF9" : "#F2F4F7", border: `1px solid ${activo ? T.steel : T.cardLine}`, maxHeight: "72vh" }}
                onDragOver={(e) => { e.preventDefault(); setOverBucket(b.id); }}
                onDragLeave={() => setOverBucket((v) => (v === b.id ? null : v))}
                onDrop={() => dropOnBucket(b.id)}>
                <div className="flex items-center justify-between px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: T.ink }}>{b.nombre}</span>
                    <span className="text-xs px-1.5 rounded-full" style={{ background: "#fff", color: T.muted, fontFamily: T.mono }}>{tareas.length}</span>
                  </div>
                  <div className="flex gap-0.5">
                    <IconBtn icon={Pencil} onClick={() => setBucketModal({ item: b })} />
                    <IconBtn icon={Trash2} onClick={() => delBucket(b)} color={T.red} />
                  </div>
                </div>

                <div className="px-2.5 pb-2 space-y-2 overflow-y-auto">
                  {tareas.map((t) => (
                    <div key={t.id}>
                      {drag && overCard === t.id && drag !== t.id && <div style={{ height: 3, borderRadius: 2, background: T.steel, marginBottom: 6 }} />}
                      <div draggable
                        onDragStart={() => setDrag(t.id)} onDragEnd={() => { setDrag(null); setOverBucket(null); setOverCard(null); }}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setOverCard(t.id); }}
                        onDrop={(e) => { e.stopPropagation(); dropOnCard(b.id, t.id); }}
                        onClick={() => abrir(t)}
                        className="rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow"
                        style={{ background: "#fff", border: `1px solid ${T.cardLine}`, borderLeft: `3px solid ${prioColor(t.prioridad)}`, opacity: drag === t.id ? 0.4 : 1 }}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Flag size={12} style={{ color: prioColor(t.prioridad) }} />
                          <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: prioColor(t.prioridad) }}>{t.prioridad}</span>
                          <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: estadoTareaColor(t.estado) + "1e", color: estadoTareaColor(t.estado) }}>{t.estado}</span>
                        </div>
                        <div className="text-sm font-semibold leading-snug" style={{ color: T.ink }}>{t.titulo}</div>
                        {t.obraId && (
                          <div className="text-[11px] mt-1 truncate" style={{ color: T.muted }}>
                            {data.obras.find((o) => o.id === t.obraId)?.codigo || ""} · {data.obras.find((o) => o.id === t.obraId)?.nombre || ""}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-2.5">
                          {t.fechaVenc && (
                            <span className="flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded"
                              style={{ background: overdue(t) ? "#FBE6E4" : "#EEF0F3", color: overdue(t) ? T.red : T.muted, fontFamily: T.mono }}>
                              <CalendarDays size={11} />{t.fechaVenc}
                            </span>
                          )}
                          {(t.checklist?.length > 0) && (
                            <span className="flex items-center gap-1 text-[11px]" style={{ color: T.muted }}>
                              <Check size={11} />{t.checklist.filter((c) => c.hecho).length}/{t.checklist.length}
                            </span>
                          )}
                          <div className="ml-auto flex -space-x-1.5">
                            {(t.asignados || []).slice(0, 3).map((id) => {
                              const m = miembro(id);
                              return (
                                <span key={id} title={m?.nombre} className="grid place-items-center rounded-full text-[9px] font-bold"
                                  style={{ width: 22, height: 22, background: T.steel, color: "#fff", border: "2px solid #fff" }}>
                                  {iniciales(m?.nombre)}
                                </span>
                              );
                            })}
                            {(t.asignados?.length || 0) > 3 && (
                              <span className="grid place-items-center rounded-full text-[9px] font-bold" style={{ width: 22, height: 22, background: T.muted, color: "#fff", border: "2px solid #fff" }}>+{t.asignados.length - 3}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
                          {[["Sin iniciar", "Inicio"], ["En curso", "Proceso"], ["Completado", "Hecho"]].map(([est, lbl]) => {
                            const on = t.estado === est;
                            return (
                              <button key={est} onClick={(e) => { e.stopPropagation(); setEstado(t, est); }}
                                className="flex-1 text-[10px] font-semibold py-1 rounded transition-colors"
                                style={{ background: on ? estadoTareaColor(est) : "#F2F4F7", color: on ? "#fff" : T.muted, border: `1px solid ${on ? estadoTareaColor(est) : T.cardLine}` }}>
                                {lbl}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button onClick={() => setTaskModal({ item: null, bucketId: b.id })}
                  className="m-2.5 mt-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[13px] font-semibold hover:bg-white"
                  style={{ color: T.steel, border: `1px dashed ${T.cardLine}` }}>
                  <Plus size={14} /> Agregar tarea
                </button>
              </div>
            );
          })}

          <button onClick={() => setBucketModal({ item: null })}
            className="shrink-0 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold hover:bg-gray-100"
            style={{ width: 220, height: 52, color: T.muted, border: `1px dashed ${T.cardLine}`, background: "#F2F4F7" }}>
            <Plus size={16} /> Nueva columna
          </button>
        </div>
      )}

      {vista === "calendario" && <CalendarView tasks={tareasFiltradas} data={data} onOpen={abrir} />}
      {vista === "gantt" && <GanttView tasks={tareasFiltradas} data={data} onOpen={abrir} />}

      {taskModal && <TareaModal {...{ data, item: taskModal.item, bucketId: taskModal.bucketId, defaultObra: scoped ? obra.id : "", upsert, remove, onClose: () => setTaskModal(null) }} />}
      {bucketModal && <BucketModal item={bucketModal.item} onSave={saveBucket} onClose={() => setBucketModal(null)} />}
    </div>
  );
}

/* ============ Vista Calendario ============ */
const DIAS_SEM = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
function CalendarView({ tasks, data, onOpen }) {
  const now = new Date();
  const [cur, setCur] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const first = new Date(cur.y, cur.m, 1);
  const startDay = (first.getDay() + 6) % 7; // lunes = 0
  const dim = new Date(cur.y, cur.m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(d);
  while (cells.length % 7) cells.push(null);
  const iso = (d) => `${cur.y}-${String(cur.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const tasksOn = (d) => tasks.filter((t) => t.fechaVenc === iso(d));
  const sinFecha = tasks.filter((t) => !t.fechaVenc);
  const hoy = today();
  const mesNombre = new Intl.DateTimeFormat("es", { month: "long", year: "numeric" }).format(first);
  const shift = (n) => { let m = cur.m + n, y = cur.y; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } setCur({ y, m }); };

  return (
    <div className="rounded-xl p-4" style={{ background: T.card, border: `1px solid ${T.cardLine}` }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold capitalize" style={{ color: T.ink }}>{mesNombre}</h3>
        <div className="flex items-center gap-1">
          <button onClick={() => shift(-1)} className="p-1.5 rounded-md hover:bg-gray-100"><ChevronLeft size={16} style={{ color: T.muted }} /></button>
          <button onClick={() => setCur({ y: now.getFullYear(), m: now.getMonth() })} className="text-xs font-semibold px-2 py-1 rounded-md hover:bg-gray-100" style={{ color: T.steel }}>Hoy</button>
          <button onClick={() => shift(1)} className="p-1.5 rounded-md hover:bg-gray-100"><ChevronRight size={16} style={{ color: T.muted }} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DIAS_SEM.map((d) => <div key={d} className="text-center text-[11px] font-semibold uppercase tracking-wide" style={{ color: T.muted }}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={i} style={{ minHeight: 96, background: "#FAFBFC", borderRadius: 8 }} />;
          const list = tasksOn(d);
          const esHoy = iso(d) === hoy;
          return (
            <div key={i} className="rounded-lg p-1.5" style={{ minHeight: 96, background: "#fff", border: `1px solid ${esHoy ? T.steel : "#EEF0F3"}` }}>
              <div className="text-[11px] font-bold mb-1" style={{ color: esHoy ? T.steel : T.muted, fontFamily: T.mono }}>{d}</div>
              <div className="space-y-1">
                {list.slice(0, 3).map((t) => (
                  <button key={t.id} onClick={() => onOpen(t)}
                    className="w-full text-left text-[10.5px] font-semibold px-1.5 py-1 rounded truncate block"
                    style={{ background: estadoTareaColor(t.estado) + "1e", color: estadoTareaColor(t.estado), borderLeft: `2px solid ${prioColor(t.prioridad)}` }}>
                    {t.titulo}
                  </button>
                ))}
                {list.length > 3 && <div className="text-[10px] px-1" style={{ color: T.muted }}>+{list.length - 3} más</div>}
              </div>
            </div>
          );
        })}
      </div>
      {sinFecha.length > 0 && (
        <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${T.cardLine}` }}>
          <div className="text-xs font-semibold mb-2" style={{ color: T.muted }}>Sin fecha de vencimiento</div>
          <div className="flex flex-wrap gap-2">
            {sinFecha.map((t) => (
              <button key={t.id} onClick={() => onOpen(t)} className="text-xs font-semibold px-2 py-1 rounded"
                style={{ background: estadoTareaColor(t.estado) + "1e", color: estadoTareaColor(t.estado), borderLeft: `2px solid ${prioColor(t.prioridad)}` }}>{t.titulo}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============ Vista Gantt (cronograma) ============ */
function GanttView({ tasks, data, onOpen }) {
  const MS = 86400000, dayW = 34, labelW = 230;
  const parse = (s) => new Date(s + "T00:00:00");
  const dated = tasks.map((t) => {
    const s = t.fechaInicio || t.fechaVenc, e = t.fechaVenc || t.fechaInicio;
    if (!s || !e) return null;
    let start = parse(s), end = parse(e);
    if (end < start) { const x = start; start = end; end = x; }
    return { t, start, end };
  }).filter(Boolean).sort((a, b) => a.start - b.start);

  if (dated.length === 0) return <Empty label="No hay tareas con fechas para mostrar en el cronograma." />;

  const min = new Date(Math.min(...dated.map((x) => x.start.getTime())));
  const max = new Date(Math.max(...dated.map((x) => x.end.getTime())));
  min.setDate(min.getDate() - 2); max.setDate(max.getDate() + 2);
  const totalDays = Math.round((max - min) / MS) + 1;
  const width = totalDays * dayW;
  const days = Array.from({ length: totalDays }, (_, i) => { const d = new Date(min); d.setDate(min.getDate() + i); return d; });
  const idxOf = (d) => Math.round((d - min) / MS);
  const hoyD = parse(today());
  const hoyIn = hoyD >= min && hoyD <= max;
  const stick = { position: "sticky", left: 0, zIndex: 1, background: "#fff", borderRight: `1px solid ${T.cardLine}` };
  const obraCod = (id) => data.obras.find((o) => o.id === id)?.codigo;

  return (
    <div className="rounded-xl" style={{ background: T.card, border: `1px solid ${T.cardLine}`, overflowX: "auto" }}>
      <div style={{ minWidth: labelW + width }}>
        {/* Encabezado de fechas */}
        <div className="flex" style={{ borderBottom: `1px solid ${T.cardLine}` }}>
          <div style={{ ...stick, width: labelW }} className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide" >
            <span style={{ color: T.muted }}>Tarea</span>
          </div>
          <div style={{ width, display: "flex" }}>
            {days.map((d, i) => {
              const wknd = d.getDay() === 0 || d.getDay() === 6;
              const showMonth = d.getDate() === 1 || i === 0;
              return (
                <div key={i} style={{ width: dayW, textAlign: "center", background: wknd ? "#F7F8FA" : "#fff", borderLeft: i ? "1px solid #F0F2F5" : "none" }} className="py-1">
                  {showMonth && <div className="text-[9px] font-bold uppercase" style={{ color: T.steel }}>{new Intl.DateTimeFormat("es", { month: "short" }).format(d).replace(".", "")}</div>}
                  <div className="text-[10px]" style={{ color: wknd ? T.muted : T.text, fontFamily: T.mono }}>{d.getDate()}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filas de tareas */}
        <div style={{ position: "relative" }}>
          {hoyIn && <div style={{ position: "absolute", left: labelW + idxOf(hoyD) * dayW + dayW / 2, top: 0, bottom: 0, width: 2, background: T.red, zIndex: 2 }} />}
          {dated.map(({ t, start, end }) => {
            const left = idxOf(start) * dayW;
            const w = (idxOf(end) - idxOf(start) + 1) * dayW;
            return (
              <div key={t.id} className="flex" style={{ borderBottom: "1px solid #F0F2F5", height: 40 }}>
                <div style={{ ...stick, width: labelW }} className="px-3 flex flex-col justify-center">
                  <div className="text-[12.5px] font-semibold truncate" style={{ color: T.ink }}>{t.titulo}</div>
                  {t.obraId && <div className="text-[10px] truncate" style={{ color: T.muted }}>{obraCod(t.obraId)}</div>}
                </div>
                <div style={{ width, position: "relative", backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent ${dayW - 1}px, #F2F4F7 ${dayW - 1}px, #F2F4F7 ${dayW}px)` }}>
                  <button onClick={() => onOpen(t)} title={t.titulo}
                    className="absolute flex items-center px-2 rounded-md hover:opacity-90"
                    style={{ left: left + 3, width: Math.max(w - 6, 20), top: 8, height: 24, background: estadoTareaColor(t.estado), borderLeft: `4px solid ${prioColor(t.prioridad)}` }}>
                    <span className="text-[10.5px] font-semibold truncate" style={{ color: "#fff" }}>{t.titulo}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BucketModal({ item, onSave, onClose }) {
  const [nombre, setNombre] = useState(item?.nombre || "");
  return (
    <Modal title={item ? "Renombrar columna" : "Nueva columna"} onClose={onClose}>
      <Field label="Nombre de la columna *">
        <input style={inputStyle} autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. En proceso" />
      </Field>
      <div className="flex justify-end gap-2 mt-2">
        <Btn kind="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={() => { if (!nombre.trim()) { alert("Escribe un nombre."); return; } onSave(nombre.trim(), item); }}>{item ? "Guardar" : "Crear"}</Btn>
      </div>
    </Modal>
  );
}

function TareaModal({ data, item, bucketId, defaultObra, upsert, remove, onClose }) {
  const [f, setF] = useState(item || { titulo: "", descripcion: "", obraId: defaultObra || "", asignados: [], prioridad: "Media", estado: "Sin iniciar", fechaInicio: "", fechaVenc: "", checklist: [] });
  const [nuevo, setNuevo] = useState("");
  const set = (k, v) => setF({ ...f, [k]: v });
  const team = data.planTeam || [];
  const toggleAsig = (id) => set("asignados", (f.asignados || []).includes(id) ? f.asignados.filter((x) => x !== id) : [...(f.asignados || []), id]);
  const addCheck = () => { if (!nuevo.trim()) return; set("checklist", [...(f.checklist || []), { id: uid(), texto: nuevo.trim(), hecho: false }]); setNuevo(""); };
  const toggleCheck = (id) => set("checklist", f.checklist.map((c) => (c.id === id ? { ...c, hecho: !c.hecho } : c)));
  const delCheck = (id) => set("checklist", f.checklist.filter((c) => c.id !== id));
  const bucketForEstado = (estado) => {
    const bs = [...(data.buckets || [])].sort((a, b) => a.orden - b.orden);
    const has = (b, kws) => kws.some((k) => (b.nombre || "").toLowerCase().includes(k));
    if (estado === "Completado") return bs.find((b) => has(b, ["hecho", "complet", "termin", "final", "fin", "cerr"])) || bs[bs.length - 1];
    if (estado === "En curso") return bs.find((b) => has(b, ["proceso", "curso", "ejecu", "seguim", "revis"])) || bs[Math.min(1, bs.length - 1)];
    return bs.find((b) => has(b, ["hacer", "inicio", "pendien", "backlog", "todo"])) || bs[0];
  };
  const submit = () => {
    if (!f.titulo.trim()) { alert("Escribe un título para la tarea."); return; }
    const target = bucketForEstado(f.estado);
    const nuevoBucket = target ? target.id : (item?.bucketId || bucketId);
    upsert("tareas", { ...f, id: item?.id || uid(), bucketId: nuevoBucket });
    onClose();
  };
  return (
    <Modal title={item ? "Editar tarea" : "Nueva tarea"} onClose={onClose} wide>
      <Field label="Título *">
        <input style={inputStyle} autoFocus value={f.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="Ej. Actualizar cronograma" />
      </Field>
      <Field label="Descripción">
        <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={f.descripcion} onChange={(e) => set("descripcion", e.target.value)} />
      </Field>
      <div className="grid gap-x-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <Field label="Obra">
          <select style={inputStyle} value={f.obraId} onChange={(e) => set("obraId", e.target.value)}>
            <option value="">— Sin obra —</option>
            {data.obras.map((o) => <option key={o.id} value={o.id}>{o.codigo} · {o.nombre}</option>)}
          </select>
        </Field>
        <Field label="Prioridad">
          <select style={inputStyle} value={f.prioridad} onChange={(e) => set("prioridad", e.target.value)}>
            {PRIORIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Fecha de inicio">
          <input type="date" style={inputStyle} value={f.fechaInicio || ""} onChange={(e) => set("fechaInicio", e.target.value)} />
        </Field>
        <Field label="Fecha de vencimiento">
          <input type="date" style={inputStyle} value={f.fechaVenc} onChange={(e) => set("fechaVenc", e.target.value)} />
        </Field>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Estado">
            <select style={inputStyle} value={f.estado} onChange={(e) => set("estado", e.target.value)}>
              {ESTADOS_TAREA.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </Field>
        </div>
      </div>

      <Field label="Asignar a">
        {team.length === 0 ? (
          <p className="text-xs" style={{ color: T.muted }}>Agrega integrantes en la pestaña "Equipo de planificación".</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {team.map((m) => {
              const on = (f.asignados || []).includes(m.id);
              return (
                <button key={m.id} onClick={() => toggleAsig(m.id)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: on ? T.steel : "#fff", color: on ? "#fff" : T.text, border: `1px solid ${on ? T.steel : T.cardLine}` }}>
                  <span className="grid place-items-center rounded-full text-[9px] font-bold"
                    style={{ width: 18, height: 18, background: on ? "#ffffff33" : T.steel + "1e", color: on ? "#fff" : T.steel }}>{iniciales(m.nombre)}</span>
                  {m.nombre}
                </button>
              );
            })}
          </div>
        )}
      </Field>

      <Field label="Lista de verificación">
        <div className="space-y-1.5 mb-2">
          {(f.checklist || []).map((c) => (
            <div key={c.id} className="flex items-center gap-2">
              <button onClick={() => toggleCheck(c.id)} className="grid place-items-center rounded shrink-0"
                style={{ width: 18, height: 18, background: c.hecho ? T.green : "#fff", border: `1px solid ${c.hecho ? T.green : T.cardLine}` }}>
                {c.hecho && <Check size={12} color="#fff" />}
              </button>
              <span className="text-sm flex-1" style={{ color: c.hecho ? T.muted : T.text, textDecoration: c.hecho ? "line-through" : "none" }}>{c.texto}</span>
              <IconBtn icon={Trash2} onClick={() => delCheck(c.id)} color={T.red} />
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input style={inputStyle} value={nuevo} onChange={(e) => setNuevo(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addCheck(); }} placeholder="Agregar ítem…" />
          <Btn kind="ghost" onClick={addCheck}><Plus size={15} /></Btn>
        </div>
      </Field>

      <div className="flex items-center justify-between mt-2">
        {item ? <Btn kind="danger" onClick={() => { remove("tareas", item.id); onClose(); }}><Trash2 size={14} />Eliminar</Btn> : <span />}
        <div className="flex gap-2">
          <Btn kind="ghost" onClick={onClose}>Cancelar</Btn>
          <Btn onClick={submit}>{item ? "Guardar" : "Crear tarea"}</Btn>
        </div>
      </div>
    </Modal>
  );
}

/* ============ Login (local, en el frontend) ============ */
function Login({ usuarios, empresa, onLogin }) {
  const [idf, setIdf] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const buscar = (s) => {
    const q = (s || "").trim().toLowerCase();
    return usuarios.find((u) => u.activo && (u.dni === s.trim() || (u.email || "").toLowerCase() === q));
  };
  const user = buscar(idf);
  const soloAdminInicial = usuarios.length === 1 && usuarios[0].dni === "00000000" && usuarios[0].pass === "admin123";

  const enter = () => {
    const u = buscar(idf);
    if (!u) { setError("DNI/correo no registrado o usuario inactivo."); return; }
    if ((u.pass || "") !== pass) { setError("Contraseña incorrecta."); return; }
    onLogin(u.id);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ fontFamily: T.sans, background: `radial-gradient(1200px 600px at 15% -10%, #223049 0%, ${T.ink} 55%)` }}>
      <div className="w-full rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
        style={{ maxWidth: 820, minHeight: 460, border: `1px solid ${T.line}` }}>

        {/* Panel visual con el logo */}
        <div className="relative flex flex-col items-center justify-center text-center p-8"
          style={{
            background: `linear-gradient(160deg, ${T.panel} 0%, ${T.ink} 100%)`,
            width: "100%", maxWidth: 340, flexShrink: 0,
            backgroundImage: `linear-gradient(160deg, ${T.panel} 0%, ${T.ink} 100%), repeating-linear-gradient(0deg, transparent, transparent 23px, rgba(255,255,255,.03) 23px, rgba(255,255,255,.03) 24px), repeating-linear-gradient(90deg, transparent, transparent 23px, rgba(255,255,255,.03) 23px, rgba(255,255,255,.03) 24px)`,
          }}>
          <div className="grid place-items-center rounded-full mb-4"
            style={{ width: 148, height: 148, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", boxShadow: "0 12px 40px rgba(0,0,0,.35)" }}>
            <img src="logo.png" alt="Logo" style={{ width: 118, height: 118, objectFit: "contain" }}
              onError={(e) => { e.currentTarget.style.display = "none"; if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = "grid"; }} />
            <div style={{ display: "none", width: 96, height: 96, background: T.amber, borderRadius: 16, placeItems: "center" }}>
              <HardHat size={52} color={T.ink} />
            </div>
          </div>
          <div className="text-2xl font-bold" style={{ color: "#fff" }}>{empresa}</div>
          <div className="text-[10px] tracking-[.28em] uppercase mt-1" style={{ color: T.amber }}>ERP Construcción</div>
          <div className="text-[11px] mt-6 leading-relaxed" style={{ color: "#9AA4B2" }}>
            Obras · Planificación<br />Presupuestos · Almacén
          </div>
        </div>

        {/* Formulario */}
        <div className="flex-1 flex flex-col justify-center p-8" style={{ background: T.card }}>
          <h2 className="text-xl font-bold" style={{ color: T.ink }}>Bienvenido</h2>
          <p className="text-xs mb-5" style={{ color: T.muted }}>Inicia sesión para continuar.</p>

          <Field label="DNI o correo">
            <input style={inputStyle} value={idf} autoFocus
              onChange={(e) => { setIdf(e.target.value); setError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") enter(); }}
              placeholder="Ej. 45871236 o correo@empresa.com" />
          </Field>

          {user && (
            <div className="flex items-center gap-2 -mt-1 mb-3 text-xs">
              <span style={{ color: T.muted }}>Rol:</span>
              <span className="font-semibold px-2 py-0.5 rounded-full" style={{ background: rolColor(user.rol) + "1e", color: rolColor(user.rol) }}>
                <Shield size={11} className="inline mr-1 -mt-0.5" />{rolLabel(user.rol)}
              </span>
              <span className="truncate" style={{ color: T.muted }}>· {user.nombre}</span>
            </div>
          )}

          <Field label="Contraseña">
            <div style={{ position: "relative" }}>
              <input style={{ ...inputStyle, paddingRight: 40 }} type={show ? "text" : "password"} value={pass}
                onChange={(e) => { setPass(e.target.value); setError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") enter(); }}
                placeholder="Tu contraseña" />
              <button onClick={() => setShow(!show)} title={show ? "Ocultar" : "Ver"}
                style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: T.muted, padding: 4 }}>
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </Field>

          {error && <div className="text-xs font-semibold mb-3" style={{ color: T.red }}>{error}</div>}

          <Btn onClick={enter} style={{ width: "100%", justifyContent: "center", padding: "11px 15px", fontSize: 14.5 }}>
            <Lock size={15} /> Ingresar
          </Btn>

          {soloAdminInicial && (
            <div className="mt-4 text-[11px] rounded-lg p-2.5" style={{ background: "#FCEFE0", color: "#9A5A00" }}>
              Primer ingreso: DNI <b>00000000</b> · contraseña <b>admin123</b>. Cámbiala luego en Usuarios.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============ Usuarios (gestión, solo admin) ============ */
function Usuarios({ data, me, upsert, remove }) {
  const [modal, setModal] = useState(null);
  const list = data.usuarios || [];
  const adminsActivos = list.filter((u) => u.rol === "admin" && u.activo).length;

  const delUser = (u) => {
    if (u.id === me.id) { alert("No puedes eliminar tu propia cuenta mientras estás dentro."); return; }
    if (u.rol === "admin" && adminsActivos <= 1) { alert("Debe quedar al menos un administrador activo."); return; }
    if (confirm(`Eliminar al usuario "${u.nombre}"?`)) remove("usuarios", u.id);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm" style={{ color: T.muted }}>
          Usuarios del sistema · <b style={{ color: T.ink }}>{list.length}</b>
        </p>
        <Btn onClick={() => setModal({ item: null })}><UserPlus size={15} />Nuevo usuario</Btn>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.cardLine}` }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F7F8FA", borderBottom: `1px solid ${T.cardLine}` }}>
              {["Nombre", "DNI", "Correo", "Rol", "Estado", ""].map((h, i) => (
                <th key={i} className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: T.muted }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id} style={{ borderBottom: "1px solid #F0F2F5" }}>
                <td className="px-4 py-3 font-semibold" style={{ color: T.ink }}>
                  {u.nombre}{u.id === me.id && <span className="text-[10px] ml-1" style={{ color: T.muted }}>(tú)</span>}
                </td>
                <td className="px-4 py-3" style={{ fontFamily: T.mono, fontSize: 12.5 }}>{u.dni}</td>
                <td className="px-4 py-3 text-xs" style={{ color: T.muted }}>{u.email || "—"}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: rolColor(u.rol) + "1e", color: rolColor(u.rol) }}>{rolLabel(u.rol)}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-semibold" style={{ color: u.activo ? T.green : T.muted }}>{u.activo ? "Activo" : "Inactivo"}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-end">
                    <IconBtn icon={Pencil} onClick={() => setModal({ item: u })} />
                    <IconBtn icon={Trash2} onClick={() => delUser(u)} color={T.red} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <Empty label="Sin usuarios." />}
      </div>

      {modal && <UsuarioModal {...{ data, item: modal.item, me, upsert, onClose: () => setModal(null) }} />}
    </div>
  );
}

function UsuarioModal({ data, item, me, upsert, onClose }) {
  const [f, setF] = useState(item || { nombre: "", dni: "", email: "", rol: "oficina", pass: "", activo: true });
  const [show, setShow] = useState(false);
  const set = (k, v) => setF({ ...f, [k]: v });
  const lista = data.usuarios || [];

  const submit = () => {
    if (!f.nombre.trim() || !f.dni.trim()) { alert("Nombre y DNI son obligatorios."); return; }
    if (lista.some((u) => u.dni === f.dni.trim() && u.id !== item?.id)) { alert("Ya existe un usuario con ese DNI."); return; }
    if (!item && !f.pass) { alert("Asigna una contraseña."); return; }
    if (item && item.rol === "admin") {
      const otrosAdmins = lista.filter((u) => u.rol === "admin" && u.activo && u.id !== item.id).length;
      if (otrosAdmins === 0 && (f.rol !== "admin" || !f.activo)) { alert("Debe quedar al menos un administrador activo."); return; }
    }
    const pass = f.pass ? f.pass : (item?.pass || "");
    upsert("usuarios", { ...f, dni: f.dni.trim(), email: (f.email || "").trim(), pass, id: item?.id || uid() });
    onClose();
  };

  return (
    <Modal title={item ? "Editar usuario" : "Nuevo usuario"} onClose={onClose} wide>
      <div className="grid gap-x-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <Field label="Nombre completo *">
          <input style={inputStyle} value={f.nombre} autoFocus onChange={(e) => set("nombre", e.target.value)} placeholder="Ej. Ing. Marco Salazar" />
        </Field>
        <Field label="DNI *">
          <input style={inputStyle} value={f.dni} inputMode="numeric" onChange={(e) => set("dni", e.target.value)} placeholder="Ej. 45871236" />
        </Field>
        <Field label="Correo (opcional, sirve para ingresar)">
          <input style={inputStyle} value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="correo@empresa.com" />
        </Field>
        <Field label="Rol *">
          <select style={inputStyle} value={f.rol} onChange={(e) => set("rol", e.target.value)}>
            {ROLES.map((r) => <option key={r.v} value={r.v}>{r.l}</option>)}
          </select>
        </Field>
        <Field label="Estado">
          <select style={inputStyle} value={f.activo ? "1" : "0"} onChange={(e) => set("activo", e.target.value === "1")}>
            <option value="1">Activo</option>
            <option value="0">Inactivo</option>
          </select>
        </Field>
        <Field label={item ? "Contraseña (en blanco = no cambiar)" : "Contraseña *"}>
          <div style={{ position: "relative" }}>
            <input style={{ ...inputStyle, paddingRight: 40 }} type={show ? "text" : "password"} value={f.pass}
              onChange={(e) => set("pass", e.target.value)} placeholder={item ? "••••••••" : "Nueva contraseña"} />
            <button onClick={() => setShow(!show)} title={show ? "Ocultar" : "Ver"}
              style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: T.muted, padding: 4 }}>
              {show ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </Field>
      </div>
      <div className="rounded-lg p-2.5 mb-3 text-[11px]" style={{ background: "#F2F4F7", color: T.muted }}>
        <b style={{ color: rolColor(f.rol) }}>{rolLabel(f.rol)}</b>: {f.rol === "admin" ? "acceso a todo el sistema." : f.rol === "oficina" ? "todo excepto Caja (sin Usuarios ni Configuración)." : "Obras, Planificación y Almacén."}
      </div>
      <div className="flex justify-end gap-2">
        <Btn kind="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={submit}>{item ? "Guardar" : "Crear usuario"}</Btn>
      </div>
    </Modal>
  );
}

/* ============ Modal de entidad (formularios) ============ */
function EntityModal({ modal, setModal, data, upsert, money }) {
  const { collection, item, extra } = modal;
  const defsFor = () => {
    const obras = data.obras.map((o) => ({ v: o.id, l: `${o.codigo} · ${o.nombre}` }));
    const clientes = data.clientes.map((c) => ({ v: c.id, l: c.nombre }));
    const materiales = data.materiales.map((m) => ({ v: m.id, l: m.nombre }));
    const personal = data.personal.map((p) => ({ v: p.id, l: p.nombre }));
    const map = {
      planTeam: [
        { k: "nombre", label: "Nombre completo", req: true, full: true },
        { k: "rol", label: "Rol en planificación" },
        { k: "email", label: "Email" }, { k: "telefono", label: "Teléfono" },
      ],
      clientes: [
        { k: "nombre", label: "Razón social", req: true },
        { k: "ruc", label: "RUC" }, { k: "contacto", label: "Contacto" },
        { k: "telefono", label: "Teléfono" }, { k: "email", label: "Email" },
      ],
      obras: [
        { k: "codigo", label: "Código", req: true }, { k: "nombre", label: "Nombre de la obra", req: true, full: true },
        { k: "clienteId", label: "Cliente", type: "select", opts: clientes },
        { k: "ubicacion", label: "Ubicación" },
        { k: "montoContractual", label: "Monto contractual", type: "number" },
        { k: "estado", label: "Estado", type: "select", opts: ESTADOS.map((e) => ({ v: e, l: e })) },
        { k: "fechaInicio", label: "Fecha inicio", type: "date" }, { k: "fechaFin", label: "Fecha fin", type: "date" },
        { k: "avance", label: "Avance físico %", type: "number" },
      ],
      partidas: [
        { k: "item", label: "Ítem (ej. 01.01)", req: true }, { k: "descripcion", label: "Descripción", req: true, full: true },
        { k: "unidad", label: "Unidad" }, { k: "metrado", label: "Metrado", type: "number" }, { k: "pu", label: "Precio unitario", type: "number" },
      ],
      materiales: [
        { k: "codigo", label: "Código", req: true }, { k: "nombre", label: "Material", req: true, full: true },
        { k: "unidad", label: "Unidad" }, { k: "stockInicial", label: "Stock inicial", type: "number" },
        { k: "stockMin", label: "Stock mínimo", type: "number" }, { k: "precio", label: "Precio", type: "number" },
      ],
      movimientos: [
        { k: "materialId", label: "Material", type: "select", opts: materiales, req: true },
        { k: "tipo", label: "Tipo", type: "select", opts: [{ v: "entrada", l: "Entrada" }, { v: "salida", l: "Salida" }] },
        { k: "cantidad", label: "Cantidad", type: "number", req: true },
        { k: "obraId", label: "Obra (opcional)", type: "select", opts: [{ v: "", l: "— Sin obra —" }, ...obras] },
        { k: "fecha", label: "Fecha", type: "date" }, { k: "nota", label: "Nota", full: true },
      ],
      personal: [
        { k: "nombre", label: "Nombre completo", req: true, full: true }, { k: "dni", label: "DNI" },
        { k: "cargo", label: "Cargo" }, { k: "costoDia", label: "Costo por día", type: "number" },
      ],
      tareo: [
        { k: "personalId", label: "Trabajador", type: "select", opts: personal, req: true },
        { k: "obraId", label: "Obra", type: "select", opts: obras, req: true },
        { k: "fecha", label: "Fecha (fin de semana)", type: "date" }, { k: "dias", label: "Días trabajados", type: "number", req: true },
      ],
      valorizaciones: [
        { k: "periodo", label: "Periodo / descripción", req: true, full: true },
        { k: "monto", label: "Monto", type: "number", req: true }, { k: "fecha", label: "Fecha", type: "date" },
      ],
      caja: [
        { k: "tipo", label: "Tipo", type: "select", opts: [{ v: "ingreso", l: "Ingreso" }, { v: "egreso", l: "Egreso" }] },
        { k: "concepto", label: "Concepto", req: true, full: true }, { k: "monto", label: "Monto", type: "number", req: true },
        { k: "obraId", label: "Obra (opcional)", type: "select", opts: [{ v: "", l: "— Sin obra —" }, ...obras] },
        { k: "fecha", label: "Fecha", type: "date" },
      ],
    };
    return map[collection];
  };
  const defs = defsFor();
  const titles = {
    planTeam: "integrante de planificación",
    clientes: "cliente", obras: "obra", partidas: "partida", materiales: "material",
    movimientos: "movimiento", personal: "trabajador", tareo: "tareo",
    valorizaciones: "valorización", caja: "movimiento de caja",
  };

  const initial = () => {
    const base = {};
    defs.forEach((d) => {
      if (item) base[d.k] = item[d.k] ?? "";
      else base[d.k] = (d.type === "select" && d.opts?.length) ? d.opts[0].v : "";
    });
    if (extra?.obraId) base.obraId = extra.obraId;
    return base;
  };
  const [form, setForm] = useState(initial);
  const numeric = new Set(defs.filter((d) => d.type === "number").map((d) => d.k));

  const submit = () => {
    for (const d of defs) if (d.req && !String(form[d.k] ?? "").trim()) { alert(`Falta: ${d.label}`); return; }
    const obj = { ...form, id: item?.id || uid() };
    numeric.forEach((k) => { obj[k] = obj[k] === "" ? 0 : Number(obj[k]); });
    if (extra?.obraId) obj.obraId = extra.obraId;
    upsert(collection, obj);
    setModal(null);
  };

  return (
    <Modal title={`${item ? "Editar" : "Nuevo"} ${titles[collection]}`} onClose={() => setModal(null)} wide={defs.length > 5}>
      <div className="grid gap-x-3" style={{ gridTemplateColumns: defs.length > 5 ? "1fr 1fr" : "1fr" }}>
        {defs.map((d) => (
          <div key={d.k} style={{ gridColumn: d.full ? "1 / -1" : "auto" }}>
            <Field label={d.label + (d.req ? " *" : "")}>
              {d.type === "select" ? (
                <select style={inputStyle} value={form[d.k] ?? ""} onChange={(e) => setForm({ ...form, [d.k]: e.target.value })}>
                  {(d.opts || []).map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                  {(!d.opts || d.opts.length === 0) && <option value="">(sin opciones)</option>}
                </select>
              ) : (
                <input style={inputStyle} type={d.type === "number" ? "number" : d.type === "date" ? "date" : "text"}
                  value={form[d.k] ?? ""} onChange={(e) => setForm({ ...form, [d.k]: e.target.value })} />
              )}
            </Field>
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 mt-2">
        <Btn kind="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
        <Btn onClick={submit}>{item ? "Guardar" : "Agregar"}</Btn>
      </div>
    </Modal>
  );
}


const _root = ReactDOM.createRoot(document.getElementById("root"));
_root.render(<App />);

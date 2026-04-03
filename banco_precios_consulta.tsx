import { useState, useEffect, useCallback } from "react";

const SUPABASE_URL = "https://idpqeviidafxyhyxlpfb.supabase.co";
const SUPABASE_ANON_KEY = "";

const CATEGORIAS = [
  { value: "", label: "Todas las categorías" },
  { value: "material", label: "Material" },
  { value: "mano_de_obra", label: "Mano de Obra" },
  { value: "equipo", label: "Equipo" },
  { value: "subcontrato", label: "Subcontrato" },
  { value: "otro", label: "Otro" },
];

const CAT_COLORS = {
  material: "#2563eb",
  mano_de_obra: "#16a34a",
  equipo: "#d97706",
  subcontrato: "#7c3aed",
  otro: "#6b7280",
};

const CAT_LABELS = {
  material: "Material",
  mano_de_obra: "Mano de Obra",
  equipo: "Equipo",
  subcontrato: "Subcontrato",
  otro: "Otro",
};

function Badge({ categoria }) {
  const color = CAT_COLORS[categoria] || "#6b7280";
  return (
    <span style={{
      background: color + "18",
      color,
      border: `1px solid ${color}40`,
      borderRadius: 6,
      padding: "2px 8px",
      fontSize: 11,
      fontWeight: 600,
      whiteSpace: "nowrap",
    }}>
      {CAT_LABELS[categoria] || categoria}
    </span>
  );
}

export default function BancoPrecios() {
  const [apiKey, setApiKey] = useState(SUPABASE_ANON_KEY);
  const [keyInput, setKeyInput] = useState("");
  const [keySet, setKeySet] = useState(!!SUPABASE_ANON_KEY);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState("");
  const [soloActivos, setSoloActivos] = useState(true);
  const [sortField, setSortField] = useState("descripcion");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const fetchData = useCallback(async () => {
    if (!apiKey) return;
    setLoading(true);
    setError(null);
    try {
      let url = `${SUPABASE_URL}/rest/v1/banco_precios?select=*&order=${sortField}.${sortDir}&limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`;
      if (search) url += `&or=(descripcion.ilike.*${encodeURIComponent(search)}*,codigo.ilike.*${encodeURIComponent(search)}*)`;
      if (categoria) url += `&categoria=eq.${categoria}`;
      if (soloActivos) url += `&activo=eq.true`;

      // Count query
      let countUrl = `${SUPABASE_URL}/rest/v1/banco_precios?select=id`;
      if (search) countUrl += `&or=(descripcion.ilike.*${encodeURIComponent(search)}*,codigo.ilike.*${encodeURIComponent(search)}*)`;
      if (categoria) countUrl += `&categoria=eq.${categoria}`;
      if (soloActivos) countUrl += `&activo=eq.true`;

      const headers = {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Prefer: "count=exact",
      };

      const [dataRes, countRes] = await Promise.all([
        fetch(url, { headers }),
        fetch(countUrl, { headers: { ...headers, Prefer: "count=exact" } }),
      ]);

      if (!dataRes.ok) {
        const err = await dataRes.json();
        throw new Error(err.message || `Error ${dataRes.status}`);
      }

      const data = await dataRes.json();
      const ct = countRes.headers.get("content-range");
      const totalCount = ct ? parseInt(ct.split("/")[1]) : data.length;

      setItems(data);
      setTotal(totalCount);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [apiKey, search, categoria, soloActivos, sortField, sortDir, page]);

  useEffect(() => {
    if (keySet) fetchData();
  }, [fetchData, keySet]);

  useEffect(() => { setPage(0); }, [search, categoria, soloActivos]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span style={{ opacity: 0.3, fontSize: 10 }}> ⇅</span>;
    return <span style={{ fontSize: 10 }}>{sortDir === "asc" ? " ↑" : " ↓"}</span>;
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (!keySet) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: "#fff", borderRadius: 12, padding: 32, maxWidth: 420, width: "100%", boxShadow: "0 2px 16px #0001" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 24 }}>🏗️</span>
            <span style={{ fontWeight: 700, fontSize: 18, color: "#1e293b" }}>ContruYA</span>
          </div>
          <p style={{ color: "#64748b", marginBottom: 20, fontSize: 14 }}>
            Ingresa tu Supabase <strong>anon key</strong> para consultar el banco de precios.
          </p>
          <input
            type="password"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && keyInput && (setApiKey(keyInput), setKeySet(true))}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, marginBottom: 12, boxSizing: "border-box", fontFamily: "monospace" }}
            autoFocus
          />
          <button
            onClick={() => { if (keyInput) { setApiKey(keyInput); setKeySet(true); } }}
            disabled={!keyInput}
            style={{ width: "100%", padding: "10px 0", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: keyInput ? "pointer" : "not-allowed", opacity: keyInput ? 1 : 0.5 }}
          >
            Conectar →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#1e293b", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>🏗️</span>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>ContruYA</span>
          <span style={{ color: "#94a3b8", fontSize: 13 }}>/ Banco de Precios</span>
        </div>
        <span style={{ color: "#64748b", fontSize: 12 }}>{total.toLocaleString()} artículos</span>
      </div>

      <div style={{ padding: "20px 24px" }}>
        {/* Filtros */}
        <div style={{ background: "#fff", borderRadius: 10, padding: "16px 20px", marginBottom: 16, boxShadow: "0 1px 4px #0001", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text"
            placeholder="🔍  Buscar por descripción o código..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: "1 1 220px", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, outline: "none" }}
          />
          <select
            value={categoria}
            onChange={e => setCategoria(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, background: "#fff", cursor: "pointer" }}
          >
            {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#475569", cursor: "pointer", userSelect: "none" }}>
            <input
              type="checkbox"
              checked={soloActivos}
              onChange={e => setSoloActivos(e.target.checked)}
              style={{ accentColor: "#2563eb" }}
            />
            Solo activos
          </label>
          {(search || categoria || !soloActivos) && (
            <button onClick={() => { setSearch(""); setCategoria(""); setSoloActivos(true); }}
              style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #fca5a5", background: "#fef2f2", color: "#dc2626", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
              ✕ Limpiar
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "12px 16px", marginBottom: 16, color: "#dc2626", fontSize: 13 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Tabla */}
        <div style={{ background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px #0001", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  {[
                    { field: "codigo", label: "Código" },
                    { field: "descripcion", label: "Descripción" },
                    { field: "categoria", label: "Categoría" },
                    { field: "subcategoria", label: "Subcategoría" },
                    { field: "unidad", label: "Unidad" },
                    { field: "precio_ref", label: "Precio Ref." },
                    { field: "fuente", label: "Fuente" },
                    { field: "activo", label: "Estado" },
                  ].map(col => (
                    <th
                      key={col.field}
                      onClick={() => handleSort(col.field)}
                      style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#475569", cursor: "pointer", whiteSpace: "nowrap", userSelect: "none" }}
                    >
                      {col.label}<SortIcon field={col.field} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Cargando...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
                    {total === 0 && !search && !categoria ? "No hay artículos. Agregá items al banco de precios desde ContruYA." : "Sin resultados para los filtros aplicados."}
                  </td></tr>
                ) : items.map((item, i) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "9px 14px", color: "#64748b", fontFamily: "monospace", fontSize: 12 }}>{item.codigo || "—"}</td>
                    <td style={{ padding: "9px 14px", color: "#1e293b", fontWeight: 500, maxWidth: 280 }}>{item.descripcion}</td>
                    <td style={{ padding: "9px 14px" }}><Badge categoria={item.categoria} /></td>
                    <td style={{ padding: "9px 14px", color: "#64748b" }}>{item.subcategoria || "—"}</td>
                    <td style={{ padding: "9px 14px", color: "#475569", fontWeight: 500 }}>{item.unidad}</td>
                    <td style={{ padding: "9px 14px", color: "#1e293b", fontWeight: 700, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                      ${Number(item.precio_ref).toFixed(2)}
                    </td>
                    <td style={{ padding: "9px 14px", color: "#64748b", fontSize: 12 }}>{item.fuente || "—"}</td>
                    <td style={{ padding: "9px 14px" }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6,
                        background: item.activo ? "#dcfce7" : "#f1f5f9",
                        color: item.activo ? "#16a34a" : "#94a3b8",
                      }}>
                        {item.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div style={{ padding: "12px 20px", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b", fontSize: 13 }}>
                Página {page + 1} de {totalPages} · {total} resultados
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #e2e8f0", background: page === 0 ? "#f8fafc" : "#fff", color: page === 0 ? "#cbd5e1" : "#1e293b", cursor: page === 0 ? "default" : "pointer", fontSize: 13 }}>
                  ← Anterior
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                  style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #e2e8f0", background: page >= totalPages - 1 ? "#f8fafc" : "#fff", color: page >= totalPages - 1 ? "#cbd5e1" : "#1e293b", cursor: page >= totalPages - 1 ? "default" : "pointer", fontSize: 13 }}>
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

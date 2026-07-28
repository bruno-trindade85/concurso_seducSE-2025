"use client";

import { useMemo, useState } from "react";
import minedProfessionals from "./data/professionals.json";

type Category = "Efetivo" | "Temporário" | "Educação Profissional";
type SortKey = "school" | "category" | "area" | "disciplines" | "admission" | "situation";
type SortDirection = "asc" | "desc";

type Professional = {
  dre: string;
  city: string;
  school: string;
  schoolCode: string;
  name: string;
  category: Category;
  area: string;
  admission?: string;
  possession: string;
  situation: string;
  jornada: string;
  disciplines: string[];
  url: string;
};

const professionals = minedProfessionals as Professional[];

const categoryColors: Record<Category, string> = {
  Efetivo: "#4867f7",
  Temporário: "#f7a51a",
  "Educação Profissional": "#18a5a4",
};

const directorates = ["DEA", "DRE 1", "DRE 2", "DRE 3", "DRE 4", "DRE 5", "DRE 6", "DRE 7", "DRE 8", "DRE 9"];
const availableDirectorates = new Set(["DRE 5", "DRE 9"]);

export default function Home() {
  const [selectedDre, setSelectedDre] = useState<string | null>(null);
  const [category, setCategory] = useState("Todos");
  const [school, setSchool] = useState("Todas");
  const [area, setArea] = useState("Todas");
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const directorateScope = useMemo(
    () => professionals.filter((person) => person.dre === selectedDre),
    [selectedDre],
  );

  const schools = useMemo(
    () => [...new Set(directorateScope.map((person) => person.school))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [directorateScope],
  );

  const schoolScope = useMemo(
    () => directorateScope.filter((person) => school === "Todas" || person.school === school),
    [directorateScope, school],
  );

  const areas = useMemo(
    () => [...new Set(schoolScope.map((person) => person.area))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [schoolScope],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return schoolScope.filter((person) => {
      const matchesCategory = category === "Todos" || person.category === category;
      const matchesArea = area === "Todas" || person.area === area;
      const matchesSearch =
        !term ||
        person.name.toLocaleLowerCase("pt-BR").includes(term) ||
        person.area.toLocaleLowerCase("pt-BR").includes(term);
      return matchesCategory && matchesArea && matchesSearch;
    });
  }, [schoolScope, category, area, search]);

  const counts = useMemo(
    () => ({
      total: filtered.length,
      effective: filtered.filter((p) => p.category === "Efetivo").length,
      temporary: filtered.filter((p) => p.category === "Temporário").length,
      professional: filtered.filter((p) => p.category === "Educação Profissional").length,
    }),
    [filtered],
  );

  const sortedProfessionals = useMemo(() => {
    if (!sortKey) return filtered;

    return [...filtered].sort((a, b) => {
      const aValue = sortValue(a, sortKey);
      const bValue = sortValue(b, sortKey);

      if (sortKey === "admission") {
        if (aValue === null) return bValue === null ? 0 : 1;
        if (bValue === null) return -1;
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      const comparison = String(aValue).localeCompare(String(bValue), "pt-BR", {
        sensitivity: "base",
        numeric: true,
      });
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filtered, sortKey, sortDirection]);

  const pendingDates = filtered.filter((person) => !(person.admission ?? person.possession).match(/^\d{2}\/\d{2}\/\d{4}$/)).length;

  const resetFilters = () => {
    setCategory("Todos");
    setSchool("Todas");
    setArea("Todas");
    setSearch("");
  };

  const cityCount = new Set(directorateScope.map((person) => person.city)).size;
  const selectedCity = school === "Todas"
    ? `${cityCount} municípios · ${schools.length} escolas`
    : directorateScope.find((person) => person.school === school)?.city ?? "";

  const handleSchoolChange = (value: string) => {
    setSchool(value);
    setArea("Todas");
    setSearch("");
  };

  const handleDreChange = (value: string) => {
    setSelectedDre(value);
    resetFilters();
    setMenuOpen(false);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((current) => current === "asc" ? "desc" : "asc");
      return;
    }
    setSortKey(key);
    setSortDirection("asc");
  };

  return (
    <main className="app-shell">
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">SE</span>
          <div>
            <strong>Gestão da Rede</strong>
            <small>Rede Estadual</small>
          </div>
        </div>
        <nav aria-label="Navegação principal">
          {directorates.map((dre) => (
            <button
              key={dre}
              className={`nav-item ${selectedDre === dre ? "active" : ""}`}
              onClick={() => handleDreChange(dre)}
              aria-pressed={selectedDre === dre}
            >
              {dre}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="live-dot" />
          <div><strong>Dados do portal SEDUC</strong><small>Protótipo em validação</small></div>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir menu">☰</button>
          <div className="breadcrumb"><span>Painel de gestão</span><b>/</b><strong>{selectedDre ?? "Selecione uma diretoria"}</strong></div>
          <div className="top-actions"><button aria-label="Notificações">◌</button><span className="avatar">BT</span></div>
        </header>

        {!selectedDre ? (
          <div className="selection-screen">
            <span className="selection-mark">SE</span>
            <span className="eyebrow">PAINEL DE GESTÃO</span>
            <h1>Escolha uma diretoria</h1>
            <p>Selecione DEA ou uma DRE no menu lateral para visualizar as informações.</p>
          </div>
        ) : !availableDirectorates.has(selectedDre) ? (
          <div className="selection-screen">
            <span className="selection-mark">{selectedDre}</span>
            <span className="eyebrow">DIRETORIA SELECIONADA</span>
            <h1>{selectedDre}</h1>
            <p>Os dados desta diretoria serão exibidos aqui após a próxima etapa de mineração.</p>
          </div>
        ) : (
        <div className="dashboard">
          <section className="page-heading">
            <div>
              <span className="eyebrow">DIRETORIA REGIONAL DE EDUCAÇÃO</span>
              <h1>Gestão de professores</h1>
              <p>{selectedDre} · {selectedCity}</p>
            </div>
            <span className="source-badge"><i /> {schools.length} escolas consolidadas</span>
          </section>

          <section className="filter-panel" aria-label="Filtros do dashboard">
            <label><span>DRE</span><select value={selectedDre} onChange={(e) => handleDreChange(e.target.value)} aria-label="Selecionar DRE">
              {directorates.map((dre) => <option key={dre} value={dre}>{dre}</option>)}
            </select></label>
            <label className="school-filter"><span>Escola</span><select value={school} onChange={(e) => handleSchoolChange(e.target.value)} aria-label="Selecionar escola">
              <option value="Todas">Todas as escolas — consolidado {selectedDre}</option>
              {schools.map((item) => <option key={item} value={item}>{formatSchool(item)}</option>)}
            </select></label>
            <label><span>Vínculo</span><select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Selecionar vínculo">
              <option>Todos</option><option>Efetivo</option><option>Temporário</option><option>Educação Profissional</option>
            </select></label>
            <label><span>Área</span><select value={area} onChange={(e) => setArea(e.target.value)} aria-label="Selecionar área">
              <option>Todas</option>{areas.map((item) => <option key={item}>{item}</option>)}
            </select></label>
            <button className="reset-button" onClick={resetFilters}>Limpar filtros</button>
          </section>
          {pendingDates > 0 && (
            <div className="data-warning" role="status">
              <span>!</span>
              <p><strong>{pendingDates} datas de posse aguardam validação.</strong> Os demais dados desses profissionais já estão disponíveis.</p>
            </div>
          )}

          <section className="kpi-grid" aria-label="Indicadores principais">
            <Kpi icon="●" value={counts.total} label="Profissionais" tone="blue" />
            <Kpi icon="○" value={counts.effective} label="Efetivos" tone="violet" />
            <Kpi icon="◷" value={counts.temporary} label="Temporários" tone="amber" />
            <Kpi icon="◇" value={counts.professional} label="Educação profissional" tone="teal" />
          </section>

          <section className="analytics-grid">
            <article className="card composition-card">
              <CardHeader title="Composição do quadro" subtitle="Distribuição por tipo de vínculo" />
              <div className="composition-body">
                <div className="donut" style={{"--effective": `${counts.total ? (counts.effective / counts.total) * 100 : 0}%`, "--temporary": `${counts.total ? ((counts.effective + counts.temporary) / counts.total) * 100 : 0}%`} as React.CSSProperties}>
                  <div><strong>{counts.total}</strong><span>Total</span></div>
                </div>
                <div className="legend">
                  <Legend label="Efetivos" value={counts.effective} total={counts.total} color={categoryColors.Efetivo} />
                  <Legend label="Temporários" value={counts.temporary} total={counts.total} color={categoryColors.Temporário} />
                  <Legend label="Educação profissional" value={counts.professional} total={counts.total} color={categoryColors["Educação Profissional"]} />
                </div>
              </div>
            </article>

            <article className="card">
              <CardHeader title="Profissionais por vínculo" subtitle={school === "Todas" ? `Consolidado de ${schools.length} escolas` : "Quadro da escola selecionada"} />
              <div className="bar-chart">
                <Bar label="Efetivos" value={counts.effective} max={Math.max(counts.effective, counts.temporary, counts.professional, 1)} tone="effective" />
                <Bar label="Temporários" value={counts.temporary} max={Math.max(counts.effective, counts.temporary, counts.professional, 1)} tone="temporary" />
                <Bar label="Educação profissional" value={counts.professional} max={Math.max(counts.effective, counts.temporary, counts.professional, 1)} tone="professional" />
              </div>
            </article>
          </section>

          <section className="card table-card">
            <div className="table-heading">
              <CardHeader title="Detalhamento dos profissionais" subtitle={`${filtered.length} registros encontrados`} />
              <label className="search-box"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar nome ou área" aria-label="Buscar profissional" /></label>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <SortHeader label="Nome e escola" sortKey="school" activeKey={sortKey} direction={sortDirection} onSort={handleSort} />
                  <SortHeader label="Vínculo" sortKey="category" activeKey={sortKey} direction={sortDirection} onSort={handleSort} />
                  <SortHeader label="Área de formação" sortKey="area" activeKey={sortKey} direction={sortDirection} onSort={handleSort} />
                  <SortHeader label="Disciplina no SIGA" sortKey="disciplines" activeKey={sortKey} direction={sortDirection} onSort={handleSort} />
                  <SortHeader label="Data de admissão" sortKey="admission" activeKey={sortKey} direction={sortDirection} onSort={handleSort} />
                  <SortHeader label="Situação" sortKey="situation" activeKey={sortKey} direction={sortDirection} onSort={handleSort} />
                </tr></thead>
                <tbody>
                  {sortedProfessionals.map((person) => (
                    <tr key={`${person.schoolCode}-${person.name}-${person.category}`}>
                      <td><strong>{titleCase(person.name)}</strong><small>{formatSchool(person.school)} · {person.city}</small></td>
                      <td><span className={`pill ${person.category === "Efetivo" ? "pill-effective" : person.category === "Temporário" ? "pill-temporary" : "pill-professional"}`}>{person.category}</span></td>
                      <td>{person.area}</td>
                      <td>{person.disciplines.length ? person.disciplines.join(", ") : <span className="not-informed">Não informada</span>}</td>
                      <td>{person.admission ?? person.possession}</td>
                      <td><span className="status"><i /> {person.situation}</span></td>
                    </tr>
                  ))}
                  {!filtered.length && <tr><td colSpan={6} className="empty">Nenhum profissional encontrado com esses filtros.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
          <footer>Fonte: Portal da Educação — SEDUC/SE · Base consolidada em 27 de julho de 2026</footer>
        </div>
        )}
      </section>
      {menuOpen && <button className="backdrop" onClick={() => setMenuOpen(false)} aria-label="Fechar menu" />}
    </main>
  );
}

function formatSchool(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace("CENTRO DE EXCELÊNCIA DE EDUCAÇÃO EM TEMPO INTEGRAL ", "Centro de Excelência ")
    .replace("CENTRO DE EXCELÊNCIA DE EDUCAÇÃO PROFISSIONALIZANTE ", "Centro de Excelência Profissionalizante ")
    .replace("COLÉGIO ESTADUAL ", "Colégio Estadual ")
    .toLocaleLowerCase("pt-BR")
    .replace(/(^|\s)\p{L}/gu, (letter) => letter.toLocaleUpperCase("pt-BR"))
    .replace(/\bDe\b/g, "de")
    .replace(/\bDa\b/g, "da")
    .replace(/\bDo\b/g, "do")
    .replace(/\bDas\b/g, "das")
    .replace(/\bDos\b/g, "dos")
    .replace(/\bEm\b/g, "em");
}

function titleCase(value: string) {
  return value
    .toLocaleLowerCase("pt-BR")
    .replace(/(^|\s)\p{L}/gu, (letter) => letter.toLocaleUpperCase("pt-BR"))
    .replace(/\bDe\b/g, "de")
    .replace(/\bDa\b/g, "da")
    .replace(/\bDo\b/g, "do")
    .replace(/\bDos\b/g, "dos");
}

function sortValue(person: Professional, key: SortKey): string | number | null {
  if (key === "school") return `${person.school} ${person.name}`;
  if (key === "category") return person.category;
  if (key === "area") return person.area;
  if (key === "disciplines") return person.disciplines.join(", ") || "Não informada";
  if (key === "situation") return person.situation;

  const match = (person.admission ?? person.possession).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  return Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
}

function SortHeader({label, sortKey, activeKey, direction, onSort}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey | null;
  direction: SortDirection;
  onSort: (key: SortKey) => void;
}) {
  const isActive = activeKey === sortKey;
  const directionLabel = isActive ? (direction === "asc" ? "crescente" : "decrescente") : "sem ordenação";

  return (
    <th aria-sort={isActive ? (direction === "asc" ? "ascending" : "descending") : "none"}>
      <button
        className={`sort-button ${isActive ? "sort-active" : ""}`}
        onClick={() => onSort(sortKey)}
        aria-label={`Ordenar ${label}. Ordem atual: ${directionLabel}`}
      >
        <span>{label}</span>
        <i aria-hidden="true">{isActive ? (direction === "asc" ? "↑" : "↓") : "↕"}</i>
      </button>
    </th>
  );
}

function Kpi({icon, value, label, tone}:{icon:string; value:number; label:string; tone:string}) {
  return <article className={`kpi-card ${tone}`}><span className="kpi-icon">{icon}</span><div><strong>{value}</strong><span>{label}</span></div><small>↗</small></article>;
}

function CardHeader({title, subtitle}:{title:string; subtitle:string}) {
  return <header className="card-header"><div><h2>{title}</h2><p>{subtitle}</p></div><button aria-label={`Mais opções de ${title}`}>•••</button></header>;
}

function Legend({label, value, total, color}:{label:string; value:number; total:number; color:string}) {
  return <div className="legend-row"><span className="legend-label"><i style={{background: color}} />{label}</span><strong>{value}</strong><span>{total ? Math.round((value / total) * 100) : 0}%</span></div>;
}

function Bar({label, value, max, tone}:{label:string; value:number; max:number; tone:string}) {
  return <div className="bar-row"><span>{label}</span><div className="bar-track"><i className={tone} style={{width:`${(value / max) * 88}%`}} /></div><strong>{value}</strong></div>;
}

import { useState } from "react";
import { parseInputFile } from "./converters";
import { normalizeRouteRows } from "./normalizers/routes";
import { downloadJson } from "./exporters/json";

const ERROR_LABELS = {
  MISSING_COLUMN: "Colonne obligatoire manquante",
  DUPLICATE_COLUMN: "Plusieurs colonnes correspondent au même champ",
  HUB_MISSING: "Hub non renseigné",
  NO_DATA: "Aucune donnée exploitable",
  DESTINATION_MISSING: "Destination manquante",
  DESTINATION_EQUALS_HUB: "La destination correspond au hub",
  WRONG_DIRECTION: "Route dans le mauvais sens",
  HUB_MISMATCH_OR_ROUTE_AMBIGUOUS: "Hub incompatible ou route ambiguë",
  ROUTE_AMBIGUOUS: "Nom de route ambigu",
  VALUE_MISSING: "Valeur obligatoire manquante",
  NUMBER_MISSING_OR_INVALID: "Nombre absent ou invalide",
  NUMBER_NEGATIVE: "Valeur négative à vérifier",
  DUPLICATE_ROUTE: "Route en doublon"
};

const REPORT_VIEWS = [
  ["summary", "Synthèse"],
  ["routes", "Routes lues"],
  ["duplicates", "Doublons"],
  ["errors", "Erreurs détaillées"],
  ["warnings", "Avertissements"]
];

function describeError(error) {
  const label = ERROR_LABELS[error.code] ?? error.code;
  const field = error.field ? ` — champ : ${error.field}` : "";
  const duplicate = error.matchingRows ? ` (lignes ${error.matchingRows.join(", ")})` : "";
  const column = error.column ? ` — colonne : ${error.column}` : "";
  return `${label}${field}${column}${duplicate}`;
}

function App() {
  const [hub, setHub] = useState("");
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [reportView, setReportView] = useState("summary");

  async function analyze() {
    if (!file) return setMessage("Sélectionne d'abord un fichier.");
    if (!hub.trim()) return setMessage("Indique le hub avant l'analyse.");

    setBusy(true);
    setMessage("");
    setResult(null);
    setReportView("summary");

    try {
      const parsed = await parseInputFile(file);

      if (parsed.format === "json") {
        setMessage("Lecture JSON réussie. La normalisation des JSON sera ajoutée après la V1 Excel/CSV.");
        return;
      }

      const normalized = normalizeRouteRows(parsed.data.rows, hub.trim().toUpperCase());
      setResult({ ...normalized, sourceFormat: parsed.format, sourceFile: file.name });
    } catch (error) {
      setMessage(error.message || "Erreur inconnue pendant l'import.");
    } finally {
      setBusy(false);
    }
  }

  function exportResult() {
    if (!result?.routes?.length || result.report.errorCount > 0) return;
    downloadJson({ version: "1.0", hub: hub.trim().toUpperCase(), routes: result.routes });
  }

  const errorCount = result?.report?.errorCount ?? 0;
  const routeCount = result?.report?.routeCount ?? 0;
  const rowIssues = result?.report?.rows ?? [];
  const validCount = Math.max(0, routeCount - rowIssues.length);
  const allErrors = [
    ...(result?.report?.errors ?? []).map(error => ({ row: "—", routeName: "Structure du fichier", error })),
    ...rowIssues.flatMap(item => item.errors.map(error => ({
      row: item.row,
      routeName: result?.routes?.find(route => route.sourceRow === item.row)?.routeName || "(route non reconnue)",
      error
    })))
  ];
  const duplicates = allErrors.filter(item => item.error.code === "DUPLICATE_ROUTE");
  const warnings = result?.report?.warnings ?? [];

  return (
    <main className="app">
      <header>
        <p className="eyebrow">Script-AM / V4</p>
        <h1>Convertisseur de routes — V1</h1>
        <p>Import Excel ou CSV → détection des colonnes → normalisation → JSON.</p>
      </header>

      <section className="panel">
        <label htmlFor="hub">Hub</label>
        <input id="hub" value={hub} onChange={e => setHub(e.target.value.toUpperCase())} placeholder="Ex. CGK" maxLength={4} />

        <label htmlFor="file">Fichier de routes</label>
        <input id="file" type="file" accept=".xlsx,.xls,.csv,.json" onChange={e => { setFile(e.target.files?.[0] ?? null); setResult(null); setMessage(""); }} />

        {file && <div className="file-info"><strong>Fichier :</strong> {file.name}</div>}

        <button onClick={analyze} disabled={busy}>{busy ? "Analyse…" : "Analyser le fichier"}</button>

        {message && <div className="status">{message}</div>}

        {result && (
          <div className="report">
            <h2>Rapport de validation</h2>
            <p>Fichier analysé : <strong>{result.sourceFile}</strong> ({result.sourceFormat?.toUpperCase()})</p>
            <div className="report-cards">
              <div><span>Routes reconnues</span><strong>{routeCount}</strong></div>
              <div><span>Lignes sans erreur</span><strong>{validCount}</strong></div>
              <div><span>Erreurs</span><strong>{errorCount}</strong></div>
              <div><span>Lignes en doublon</span><strong>{new Set(duplicates.map(item => item.row)).size}</strong></div>
              <div><span>Avertissements</span><strong>{warnings.length}</strong></div>
            </div>

            <label htmlFor="report-view">Consulter le rapport</label>
            <select id="report-view" value={reportView} onChange={e => setReportView(e.target.value)}>
              {REPORT_VIEWS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>

            {reportView === "summary" && (
              <div className="report-section">
                <h3>Synthèse</h3>
                <p>{errorCount === 0 ? "Aucune erreur détectée. L'export JSON est disponible." : "Des erreurs ont été détectées. L'export JSON est bloqué jusqu'à correction."}</p>
                <p>Les lignes complètement vides sont ignorées. Les erreurs détaillées et les routes reconnues sont consultables dans la liste ci-dessus.</p>
              </div>
            )}

            {reportView === "routes" && (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Ligne</th><th>Route</th><th>Identité</th><th>Pays</th><th>Cat.</th><th>Distance</th><th>Taxes</th><th>Demande Éco</th><th>Demande Aff.</th><th>Demande 1re</th><th>Demande cargo</th><th>Tarif Éco</th><th>Tarif Aff.</th><th>Tarif 1re</th><th>Tarif cargo</th><th>État</th></tr></thead>
                  <tbody>
                    {(result.routes ?? []).map(route => {
                      const issue = rowIssues.some(item => item.row === route.sourceRow);
                      return <tr key={route.sourceRow}>
                        <td>{route.sourceRow}</td><td>{route.routeName || "—"}</td><td>{route.identity || "—"}</td><td>{route.country || "—"}</td>
                        <td>{route.category ?? "—"}</td><td>{route.distance ?? "—"}</td><td>{route.taxPerFlight ?? "—"}</td>
                        <td>{route.demand?.economy ?? "—"}</td>
                        <td>{route.demand?.business ?? "—"}</td>
                        <td>{route.demand?.first ?? "—"}</td>
                        <td>{route.demand?.cargo ?? "—"}</td>
                        <td>{route.prices?.economy ?? "—"}</td>
                        <td>{route.prices?.business ?? "—"}</td>
                        <td>{route.prices?.first ?? "—"}</td>
                        <td>{route.prices?.cargo ?? "—"}</td>
                        <td>{issue ? "À vérifier" : "OK"}</td>
                      </tr>;
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {reportView === "duplicates" && (
              <div className="report-section">
                <h3>Doublons détectés ({duplicates.length})</h3>
                {duplicates.length === 0 ? <p>Aucun doublon détecté.</p> : <ul>
                  {duplicates.map((item, index) => <li key={index}>Ligne {item.row} — {item.routeName} : {describeError(item.error)}</li>)}
                </ul>}
              </div>
            )}

            {reportView === "errors" && (
              <div className="report-section">
                <h3>Erreurs détaillées ({allErrors.length})</h3>
                {allErrors.length === 0 ? <p>Aucune erreur détectée.</p> : <div className="table-wrap">
                  <table>
                    <thead><tr><th>Ligne</th><th>Route / zone</th><th>Erreur</th><th>Code</th></tr></thead>
                    <tbody>{allErrors.map((item, index) => <tr key={index}>
                      <td>{item.row}</td><td>{item.routeName}</td><td>{describeError(item.error)}</td><td><code>{item.error.code}</code></td>
                    </tr>)}</tbody>
                  </table>
                </div>}
              </div>
            )}

            {reportView === "warnings" && (
              <div className="report-section">
                <h3>Avertissements ({warnings.length})</h3>
                {warnings.length === 0 ? <p>Aucun avertissement détecté.</p> : <ul>
                  {warnings.map((warning, index) => <li key={index}>{warning.message || describeError(warning)}</li>)}
                </ul>}
              </div>
            )}

            {errorCount === 0 && result.routes?.length > 0 ? (
              <button onClick={exportResult}>Exporter le JSON normalisé</button>
            ) : (
              <p>Export bloqué : corrige les erreurs puis relance l'analyse.</p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default App;

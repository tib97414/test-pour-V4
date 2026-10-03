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

function describeError(error) {
  const label = ERROR_LABELS[error.code] ?? error.code;
  const field = error.field ? ` — champ : ${error.field}` : "";
  const duplicate = error.matchingRows ? ` (lignes ${error.matchingRows.join(", ")})` : "";
  return `${label}${field}${duplicate}`;
}

function App() {
  const [hub, setHub] = useState("");
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function analyze() {
    if (!file) return setMessage("Sélectionne d'abord un fichier.");
    if (!hub.trim()) return setMessage("Indique le hub avant l'analyse.");

    setBusy(true);
    setMessage("");
    setResult(null);

    try {
      const parsed = await parseInputFile(file);

      if (parsed.format === "json") {
        setMessage("Lecture JSON réussie. La normalisation des JSON sera ajoutée après la V1 Excel/CSV.");
        return;
      }

      const normalized = normalizeRouteRows(parsed.data.rows, hub.trim().toUpperCase());
      setResult(normalized);
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
  const validCount = result ? Math.max(0, (result.report.routeCount ?? 0) - (result.report.rows?.filter(row => row.errors.length > 0).length ?? 0)) : 0;

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
            <p>Routes reconnues : <strong>{result.report.routeCount ?? 0}</strong></p>
            <p>Lignes sans erreur : <strong>{validCount}</strong></p>
            <p>Erreurs : <strong>{errorCount}</strong></p>

            {result.report.errors?.length > 0 && (
              <section>
                <h3>Problèmes de structure</h3>
                <ul>{result.report.errors.map((error, index) => <li key={index}>{describeError(error)}</li>)}</ul>
              </section>
            )}

            {result.report.rows?.length > 0 && (
              <section>
                <h3>Détails par ligne</h3>
                <ul>
                  {result.report.rows.map(item => (
                    <li key={item.row}>
                      Ligne {item.row} : {item.errors.map(describeError).join("; ")}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {errorCount === 0 && result.routes?.length > 0 ? (
              <button onClick={exportResult}>Exporter le JSON</button>
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

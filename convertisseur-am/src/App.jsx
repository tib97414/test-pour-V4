import { useState } from "react";
import { parseInputFile } from "./converters";
import { normalizeRouteRows } from "./normalizers/routes";
import { downloadJson } from "./exporters/json";

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
        setResult({ parsed, report: { routeCount: 0, errorCount: 0, errors: [], warnings: [] } });
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
    if (!result?.routes?.length || result.report.errorCount) return;
    downloadJson({ version: "1.0", hub: hub.trim().toUpperCase(), routes: result.routes });
  }

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
        <input id="file" type="file" accept=".xlsx,.xls,.csv,.json" onChange={e => setFile(e.target.files?.[0] ?? null)} />

        {file && <div className="file-info"><strong>Fichier :</strong> {file.name}</div>}

        <button onClick={analyze} disabled={busy}>{busy ? "Analyse…" : "Analyser le fichier"}</button>

        {message && <div className="status">{message}</div>}

        {result && (
          <div className="report">
            <h2>Rapport</h2>
            <p>Routes lues : <strong>{result.report.routeCount ?? 0}</strong></p>
            <p>Erreurs : <strong>{result.report.errorCount ?? 0}</strong></p>
            {result.report.errorCount === 0 && result.routes?.length > 0 && (
              <button onClick={exportResult}>Exporter le JSON</button>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default App;

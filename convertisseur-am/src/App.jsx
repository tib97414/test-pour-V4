import { useState } from "react";

function App() {
  const [hub, setHub] = useState("");
  const [file, setFile] = useState(null);

  return (
    <main className="app">
      <header>
        <p className="eyebrow">Script-AM / V4</p>
        <h1>Convertisseur de routes — V1</h1>
        <p>
          Excel, CSV, JSON ou XML → données de routes normalisées → JSON.
        </p>
      </header>

      <section className="panel">
        <label htmlFor="hub">Hub</label>
        <input
          id="hub"
          value={hub}
          onChange={(event) => setHub(event.target.value.toUpperCase())}
          placeholder="Ex. CGK"
          maxLength={4}
        />

        <label htmlFor="file">Fichier de routes</label>
        <input
          id="file"
          type="file"
          accept=".xlsx,.xls,.csv,.json,.xml"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />

        {file && (
          <div className="file-info">
            <strong>Fichier sélectionné :</strong> {file.name}
          </div>
        )}

        <div className="status">
          <strong>État V1 :</strong> interface initialisée. Le moteur
          d'importation sera ajouté par module, format par format.
        </div>
      </section>
    </main>
  );
}

export default App;

import { detectColumns } from "./headers";

const REQUIRED = [
  "routeName", "country", "category", "distance", "taxPerFlight",
  "demandEconomy", "demandBusiness", "demandFirst", "demandCargo",
  "priceEconomy", "priceBusiness", "priceFirst", "priceCargo"
];

function toNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const text = String(value ?? "").trim();
  if (!text) return null;
  const normalized = text.replace(/\s/g, "").replace(",", ".");
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function extractDestination(routeName, hub) {
  const raw = String(routeName ?? "").trim();
  if (!raw) return { destination: null, error: "DESTINATION_MISSING" };

  const parts = raw.split(/\s*(?:-|→|->|\/|–|—)\s*/).filter(Boolean);

  if (parts.length === 1) {
    return { destination: parts[0].toUpperCase(), error: null };
  }

  if (parts.length === 2) {
    const left = parts[0].toUpperCase();
    const right = parts[1].toUpperCase();
    if (left === hub) return { destination: right, error: null };
    if (right === hub) return {
      destination: right,
      error: "WRONG_DIRECTION"
    };
  }

  return { destination: null, error: "ROUTE_AMBIGUOUS" };
}

export function normalizeRouteRows(rows, hub) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      routes: [],
      report: { errors: [{ code: "NO_DATA" }], warnings: [] }
    };
  }

  const headers = rows[0].map(value => String(value ?? ""));
  const detection = detectColumns(headers);
  const report = {
    errors: [...detection.errors],
    warnings: [...detection.warnings],
    rows: []
  };

  if (detection.errors.length) {
    return { routes: [], report };
  }

  const routes = [];

  rows.slice(1).forEach((row, offset) => {
    const rowNumber = offset + 2;
    const get = key => row[detection.columns[key]];

    const identity = extractDestination(get("routeName"), hub);
    const route = {
      sourceRow: rowNumber,
      routeName: String(get("routeName") ?? "").trim(),
      hub,
      destination: identity.destination,
      identity: identity.destination ? `${hub}:${identity.destination}` : null,
      country: String(get("country") ?? "").trim(),
      category: toNumber(get("category")),
      distance: toNumber(get("distance")),
      taxPerFlight: toNumber(get("taxPerFlight")),
      demand: {
        economy: toNumber(get("demandEconomy")),
        business: toNumber(get("demandBusiness")),
        first: toNumber(get("demandFirst")),
        cargo: toNumber(get("demandCargo"))
      },
      prices: {
        economy: toNumber(get("priceEconomy")),
        business: toNumber(get("priceBusiness")),
        first: toNumber(get("priceFirst")),
        cargo: toNumber(get("priceCargo"))
      }
    };

    const rowErrors = [];
    if (identity.error) rowErrors.push({ code: identity.error });
    for (const key of REQUIRED.slice(1)) {
      const value = key === "country" ? route.country : key === "category" ? route.category : route[key];
      if (value === null || value === "") rowErrors.push({ code: "VALUE_INVALID", field: key });
    }

    if (rowErrors.length) {
      report.rows.push({ row: rowNumber, errors: rowErrors });
    }

    routes.push(route);
  });

  report.errorCount = report.errors.length + report.rows.reduce((sum, row) => sum + row.errors.length, 0);
  report.routeCount = routes.length;

  return { routes, report };
}

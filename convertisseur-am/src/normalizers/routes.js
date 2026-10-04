import { detectColumns } from "./headers";

const NUMERIC_FIELDS = [
  ["category", "category"],
  ["distance", "distance"],
  ["taxPerFlight", "taxPerFlight"],
  ["demandEconomy", "demand.economy"],
  ["demandBusiness", "demand.business"],
  ["demandFirst", "demand.first"],
  ["demandCargo", "demand.cargo"],
  ["priceEconomy", "prices.economy"],
  ["priceBusiness", "prices.business"],
  ["priceFirst", "prices.first"],
  ["priceCargo", "prices.cargo"]
];

function toNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const text = String(value ?? "").trim();
  if (!text) return null;

  // Accept both common export conventions:
  // 6,099.00 (US) / 6.099,00 (French) / 6 099,00 / 6099,00.
  // If both separators exist, the last one is treated as the decimal separator.
  let normalized = text.replace(/[\s\u00A0\u202F']/g, "");
  const hasComma = normalized.includes(",");
  const hasDot = normalized.includes(".");

  if (hasComma && hasDot) {
    if (normalized.lastIndexOf(".") > normalized.lastIndexOf(",")) {
      normalized = normalized.replace(/,/g, "");
    } else {
      normalized = normalized.replace(/\./g, "").replace(",", ".");
    }
  } else if (hasComma || hasDot) {
    const separator = hasComma ? "," : ".";
    const groupingPattern = separator === ","
      ? /^[+-]?\d{1,3}(?:,\d{3})+$/
      : /^[+-]?\d{1,3}(?:\.\d{3})+$/;

    if (groupingPattern.test(normalized)) {
      normalized = normalized.replace(new RegExp(separator === "," ? "," : "\\.", "g"), "");
    } else {
      normalized = normalized.replace(separator, ".");
    }
  }

  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function isEmptyRow(row) {
  return !Array.isArray(row) || row.every(value => String(value ?? "").trim() === "");
}

function extractDestination(routeName, hub) {
  const raw = String(routeName ?? "").trim();
  if (!raw) return { destination: null, error: "DESTINATION_MISSING" };

  const parts = raw.split(/\s*(?:-|→|->|\/|–|—)\s*/).filter(Boolean);

  if (parts.length === 1) {
    const destination = parts[0].trim().toUpperCase();
    return destination === hub
      ? { destination: null, error: "DESTINATION_EQUALS_HUB" }
      : { destination, error: null };
  }

  if (parts.length === 2) {
    const left = parts[0].trim().toUpperCase();
    const right = parts[1].trim().toUpperCase();
    if (left === hub && right !== hub) return { destination: right, error: null };
    if (right === hub) return { destination: null, error: "WRONG_DIRECTION" };
    return { destination: null, error: "HUB_MISMATCH_OR_ROUTE_AMBIGUOUS" };
  }

  return { destination: null, error: "ROUTE_AMBIGUOUS" };
}

function getPathValue(object, path) {
  return path.split(".").reduce((value, key) => value?.[key], object);
}

export function normalizeRouteRows(rows, hubValue) {
  const hub = String(hubValue ?? "").trim().toUpperCase();
  const report = { errors: [], warnings: [], rows: [], routeCount: 0, errorCount: 0 };

  if (!hub) {
    report.errors.push({ code: "HUB_MISSING" });
    report.errorCount = report.errors.length;
    return { routes: [], report };
  }

  if (!Array.isArray(rows) || rows.length === 0 || isEmptyRow(rows[0])) {
    report.errors.push({ code: "NO_DATA" });
    report.errorCount = report.errors.length;
    return { routes: [], report };
  }

  const headers = rows[0].map(value => String(value ?? ""));
  const detection = detectColumns(headers);
  report.errors.push(...detection.errors);

  if (detection.errors.length) {
    report.errorCount = report.errors.length;
    return { routes: [], report };
  }

  const routes = [];
  const routeErrors = new Map();

  rows.slice(1).forEach((row, offset) => {
    // Ignore rows that are genuinely empty (Excel may mark them as used).
    if (isEmptyRow(row)) return;

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
    if (identity.error) rowErrors.push({ code: identity.error, field: "routeName" });
    if (!route.country) rowErrors.push({ code: "VALUE_MISSING", field: "country" });

    for (const [field, path] of NUMERIC_FIELDS) {
      const value = getPathValue(route, path);
      if (value === null) {
        rowErrors.push({ code: "NUMBER_MISSING_OR_INVALID", field });
      } else if (value < 0) {
        rowErrors.push({ code: "NUMBER_NEGATIVE", field, value });
      }
    }

    routeErrors.set(rowNumber, rowErrors);
    routes.push(route);
  });

  // A route identity must be unique within one hub's imported dataset.
  const rowsByIdentity = new Map();
  for (const route of routes) {
    if (!route.identity) continue;
    const matchingRows = rowsByIdentity.get(route.identity) ?? [];
    matchingRows.push(route.sourceRow);
    rowsByIdentity.set(route.identity, matchingRows);
  }

  for (const [identity, matchingRows] of rowsByIdentity) {
    if (matchingRows.length < 2) continue;
    for (const rowNumber of matchingRows) {
      routeErrors.get(rowNumber).push({
        code: "DUPLICATE_ROUTE",
        field: "routeName",
        identity,
        matchingRows
      });
    }
  }

  for (const [rowNumber, errors] of routeErrors) {
    if (errors.length) report.rows.push({ row: rowNumber, errors });
  }

  report.routeCount = routes.length;
  report.errorCount =
    report.errors.length +
    report.rows.reduce((sum, row) => sum + row.errors.length, 0);

  return { routes, report };
}

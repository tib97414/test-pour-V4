export const CANONICAL_COLUMNS = {
  routeName: ["NOM ROUTES", "NOM ROUTE", "ROUTE", "ROUTE NAME", "NOM"],
  country: ["PAYS", "COUNTRY"],
  category: ["CATÉGORIE", "CATEGORIE", "CAT", "CATEGORY"],
  distance: ["DISTANCE", "DISTANCE KM", "DISTANCE (KM)"],
  taxPerFlight: ["TAXES PAR VOL", "TAXE PAR VOL", "TAXES", "TAX"],
  demandEconomy: ["DEMANDE ÉCONOMIE", "DEMANDE ECONOMIE", "DEMANDE ECO", "ECO DEMANDE"],
  demandBusiness: ["DEMANDE AFFAIRES", "DEMANDE AFFAIRE", "DEMANDE BUSINESS", "BUS DEMANDE"],
  demandFirst: ["DEMANDE PREMIÈRE", "DEMANDE PREMIERE", "DEMANDE FIRST", "FIRST DEMANDE"],
  demandCargo: ["DEMANDE CARGO", "CARGO DEMANDE"],
  priceEconomy: ["TARIFS ÉCONOMIE", "TARIFS ECONOMIE", "TARIF ÉCONOMIE", "PRIX ÉCONOMIE", "PRIX ECONOMIE"],
  priceBusiness: ["TARIFS AFFAIRES", "TARIFS BUSINESS", "TARIF AFFAIRES", "PRIX AFFAIRES", "PRIX BUSINESS"],
  priceFirst: ["TARIFS PREMIÈRE", "TARIFS PREMIERE", "TARIF PREMIÈRE", "PRIX PREMIÈRE", "PRIX PREMIERE"],
  priceCargo: ["TARIFS CARGO", "TARIF CARGO", "PRIX CARGO"]
};

export function normalizeHeader(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

export function detectColumns(headers) {
  const normalized = headers.map(normalizeHeader);
  const columns = {};
  const warnings = [];
  const errors = [];

  for (const [canonical, aliases] of Object.entries(CANONICAL_COLUMNS)) {
    const candidates = new Set(aliases.map(normalizeHeader));
    const matches = normalized
      .map((header, index) => candidates.has(header) ? index : -1)
      .filter(index => index >= 0);

    if (matches.length === 0) {
      errors.push({ code: "MISSING_COLUMN", column: canonical });
    } else if (matches.length > 1) {
      errors.push({ code: "DUPLICATE_COLUMN", column: canonical, indexes: matches });
    } else {
      columns[canonical] = matches[0];
    }
  }

  return { columns, warnings, errors };
}

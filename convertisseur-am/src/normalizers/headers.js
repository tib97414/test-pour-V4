export const CANONICAL_COLUMNS = {
  routeName: ["NOM ROUTES", "NOM ROUTE", "ROUTE", "ROUTES", "ROUTE NAME", "NOM", "DESTINATION", "DESTINATIONS"],
  country: ["PAYS", "COUNTRY"],
  category: ["CATÉGORIE", "CATEGORIE", "CAT", "CATEGORY"],
  distance: ["DISTANCE", "DISTANCE KM", "DISTANCE (KM)"],
  taxPerFlight: ["TAXES PAR VOL", "TAXE PAR VOL", "TAXES", "TAXE", "TAX"],
  demandEconomy: ["DEMANDE ÉCONOMIE", "DEMANDE ECONOMIE", "DEMANDE ECO", "ECO DEMANDE", "ECO", "ÉCO", "ECONOMIE", "D ECO", "D.ECO", "DEMAND ECONOMY", "ECONOMY DEMAND"],
  demandBusiness: ["DEMANDE AFFAIRES", "DEMANDE AFFAIRE", "DEMANDE BUSINESS", "BUS DEMANDE", "BUS", "D BUS", "D.BUS", "BUSINESS", "AFFAIRES", "AFF", "D AFF", "D.AFF", "DEMAND BUSINESS", "BUSINESS DEMAND"],
  demandFirst: ["DEMANDE PREMIÈRE", "DEMANDE PREMIERE", "DEMANDE FIRST", "FIRST DEMANDE", "PREM", "D PREM", "D.PREM", "PREMIERE", "FIRST", "D FIRST", "D.FIRST", "DEMAND FIRST", "FIRST DEMAND"],
  demandCargo: ["DEMANDE CARGO", "CARGO DEMANDE", "D.CARGO"],
  priceEconomy: ["TARIFS ÉCONOMIE", "TARIFS ECONOMIE", "TARIF ÉCONOMIE", "PRIX ÉCONOMIE", "PRIX ECONOMIE", "T ECO", "T.ECO", "P ECO", "P.ECO", "T ECONOMY", "T.ECONOMY", "P ECONOMY", "P.ECONOMY", "TARIF ECO", "TARIFS ECO", "PRIX ECO", "PRICE ECONOMY", "PRICE ECO"],
  priceBusiness: ["TARIFS AFFAIRES", "TARIFS BUSINESS", "TARIF AFFAIRES", "PRIX AFFAIRES", "PRIX BUSINESS", "T BUS", "T.BUS", "P BUS", "P.BUS", "T BUSINESS", "T.BUSINESS", "T AFF", "T.AFF", "P BUSINESS", "P.BUSINESS", "P AFF", "P.AFF", "TARIF BUSINESS", "PRIX BUSINESS", "PRICE BUSINESS"],
  priceFirst: ["TARIFS PREMIÈRE", "TARIFS PREMIERE", "TARIF PREMIÈRE", "PRIX PREMIÈRE", "PRIX PREMIERE", "T PREM", "T.PREM", "P PREM", "P.PREM", "T FIRST", "T.FIRST", "P FIRST", "P.FIRST", "TARIF PREMIERE", "PRIX PREMIERE", "PRICE FIRST"],
  priceCargo: ["TARIFS CARGO", "TARIF CARGO", "PRIX CARGO", "T.CARGO", "P.CARGO"]
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

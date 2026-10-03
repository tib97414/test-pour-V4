export async function parseJson(file) {
  const text = await file.text();

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error("JSON invalide : impossible de parser le fichier.");
  }
}

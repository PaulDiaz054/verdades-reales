// Cabeceras CORS comunes a todos los handlers
export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function setCors(res) {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
}

// Parsea el resultado de redis.eval (puede venir como string o como objeto)
export function parseRoom(result) {
  if (!result) return null;
  return typeof result === "string" ? JSON.parse(result) : result;
}

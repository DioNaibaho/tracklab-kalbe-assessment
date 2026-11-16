export const KALBE_BASE_URL =
  process.env.KALBE_BASE_URL || "https://api-assessment-biopharma.kalbe.co.id";

export function getKalbeHeaders(accessToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    app_id: process.env.KALBE_APP_ID || "41e4f05a",
    app_key: process.env.KALBE_APP_KEY || "306db443aa95cecd671214b806bb31ef",
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  return headers;
}

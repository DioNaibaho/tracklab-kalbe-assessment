export interface LogPayload {
  username: string;
  action: string;
  module: string;
  endpoint?: string;
  details?: string;
  statusCode?: number;
}

export async function recordActivityLog(payload: LogPayload) {
  const loggerUrl = process.env.LOGGER_API_URL || "http://localhost:5050/api/logs";
  try {
    await fetch(loggerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: payload.username || "anonymous",
        action: payload.action,
        module: payload.module,
        endpoint: payload.endpoint || "",
        details: payload.details || "",
        statusCode: payload.statusCode || 200,
      }),
    });
  } catch (err) {
    console.error("Failed to send log to .NET service:", err);
  }
}

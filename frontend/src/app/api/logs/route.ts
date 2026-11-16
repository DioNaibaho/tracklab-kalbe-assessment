import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const loggerUrl = process.env.LOGGER_API_URL || "http://localhost:5050/api/logs";
  const { searchParams } = new URL(req.url);
  const query = searchParams.toString();

  try {
    const res = await fetch(`${loggerUrl}${query ? `?${query}` : ""}`, {
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Backend .NET Logger (localhost:5050) tidak merespons",
      },
      { status: 503 }
    );
  }
}
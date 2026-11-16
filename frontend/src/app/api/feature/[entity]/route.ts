import { NextRequest, NextResponse } from "next/server";
import { tracklabStore } from "@/lib/mockStore";
import { recordActivityLog } from "@/lib/logger";
import { KALBE_BASE_URL, getKalbeHeaders } from "@/lib/kalbe";

type EntityKey = "trackers" | "requests" | "trackings";

const UPSTREAM_PATH_MAP: Record<EntityKey, string | undefined> = {
  trackers: process.env.KALBE_TRACKERS_PATH,
  requests: process.env.KALBE_REQUESTS_PATH,
  trackings: process.env.KALBE_TRACKINGS_PATH,
};

function getUsername(req: NextRequest): string {
  const userCookie = req.cookies.get("tracklab_user")?.value;
  if (!userCookie) return "assessment.it";
  try {
    return JSON.parse(userCookie).username || "assessment.it";
  } catch {
    return "assessment.it";
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ entity: string }> }
) {
  const { entity } = await params;
  if (!["trackers", "requests", "trackings"].includes(entity)) {
    return NextResponse.json({ success: false, message: "Unknown entity" }, { status: 404 });
  }

  const key = entity as EntityKey;
  const accessToken = req.cookies.get("tracklab_access_token")?.value;
  const upstreamPath = UPSTREAM_PATH_MAP[key];

  // Baca X-Paging-* headers yang dikirim dari frontend
  const offset = Number(req.headers.get("X-Paging-Offset") || "0");
  const limit = Number(req.headers.get("X-Paging-Limit") || "10");
  const sortBy = req.headers.get("X-Paging-SortBy") || "id";
  const sortOrder = (req.headers.get("X-Paging-SortOrder") || "ASC").toUpperCase();
  const search = (req.headers.get("X-Paging-Search") || "").toLowerCase().trim();

  // Jika endpoint upstream Kalbe sudah dikonfigurasi di .env.local, tembak API asli
  if (upstreamPath && accessToken) {
    try {
      const headers = getKalbeHeaders(accessToken);
      req.headers.forEach((val, hKey) => {
        if (hKey.toLowerCase().startsWith("x-paging-")) {
          headers[hKey] = val;
        }
      });

      const upstreamRes = await fetch(
        `${KALBE_BASE_URL}/api/v1/feature/${upstreamPath}`,
        { method: "GET", headers }
      );
      if (upstreamRes.ok) {
        const data = await upstreamRes.json();
        return NextResponse.json(data);
      }
    } catch {}
  }

  // Fallback ke store lokal dengan simulasi X-Paging-* filtering, sorting, dan pagination
  let items = [...tracklabStore[key]] as unknown as Record<string, unknown>[];

  if (search) {
    items = items.filter((item) =>
      Object.values(item).some((val) =>
        String(val ?? "").toLowerCase().includes(search)
      )
    );
  }

  items.sort((a, b) => {
    const valA = a[sortBy];
    const valB = b[sortBy];
    if (typeof valA === "number" && typeof valB === "number") {
      return sortOrder === "DESC" ? valB - valA : valA - valB;
    }
    const strA = String(valA ?? "").toLowerCase();
    const strB = String(valB ?? "").toLowerCase();
    return sortOrder === "DESC"
      ? strB.localeCompare(strA)
      : strA.localeCompare(strB);
  });

  const totalItems = items.length;
  const pagedItems = items.slice(offset, offset + limit);

  return NextResponse.json({
    success: true,
    code: 200,
    message: "OK",
    data: {
      items: pagedItems,
      totalItems,
      offset,
      limit,
    },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ entity: string }> }
) {
  const { entity } = await params;
  if (!["trackers", "requests", "trackings"].includes(entity)) {
    return NextResponse.json({ success: false, message: "Unknown entity" }, { status: 404 });
  }

  const key = entity as EntityKey;
  const username = getUsername(req);
  const body = await req.json();
  const now = new Date().toISOString();

  const newRecord = {
    ...body,
    id:
      body.id ||
      (key === "requests"
        ? crypto.randomUUID().replace(/-/g, "").toUpperCase()
        : `${key.slice(0, 3)}-${Date.now().toString().slice(-5)}`),
    created_by: username,
    created_on: now,
    last_updated_by: username,
    last_updated_on: now,
    is_active: body.is_active ?? true,
  };

  (tracklabStore[key] as unknown[]).unshift(newRecord);

  await recordActivityLog({
    username,
    action: "CREATE",
    module: key.toUpperCase(),
    endpoint: `/api/feature/${key}`,
    details: `Created ${key} record (${newRecord.code || newRecord.project_code || newRecord.id})`,
    statusCode: 201,
  });

  return NextResponse.json(
    { success: true, code: 201, message: "Created", data: newRecord },
    { status: 201 }
  );
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ entity: string }> }
) {
  const { entity } = await params;
  if (!["trackers", "requests", "trackings"].includes(entity)) {
    return NextResponse.json({ success: false, message: "Unknown entity" }, { status: 404 });
  }

  const key = entity as EntityKey;
  const username = getUsername(req);
  const body = await req.json();

  if (!body.id) {
    return NextResponse.json({ success: false, message: "ID is required" }, { status: 400 });
  }

  const list = tracklabStore[key] as unknown as Record<string, unknown>[];
  const index = list.findIndex((item) => item.id === body.id);

  if (index === -1) {
    return NextResponse.json({ success: false, message: "Record not found" }, { status: 404 });
  }

  const updated = {
    ...list[index],
    ...body,
    last_updated_by: username,
    last_updated_on: new Date().toISOString(),
  };
  list[index] = updated;

  await recordActivityLog({
    username,
    action: "UPDATE",
    module: key.toUpperCase(),
    endpoint: `/api/feature/${key}`,
    details: `Updated ${key} record ID: ${body.id}`,
    statusCode: 200,
  });

  return NextResponse.json({
    success: true,
    code: 200,
    message: "Updated",
    data: updated,
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ entity: string }> }
) {
  const { entity } = await params;
  if (!["trackers", "requests", "trackings"].includes(entity)) {
    return NextResponse.json({ success: false, message: "Unknown entity" }, { status: 404 });
  }

  const key = entity as EntityKey;
  const username = getUsername(req);
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ success: false, message: "ID is required" }, { status: 400 });
  }

  const list = tracklabStore[key] as unknown as Record<string, unknown>[];
  const index = list.findIndex((item) => item.id === id);

  if (index === -1) {
    return NextResponse.json({ success: false, message: "Record not found" }, { status: 404 });
  }

  list.splice(index, 1);

  await recordActivityLog({
    username,
    action: "DELETE",
    module: key.toUpperCase(),
    endpoint: `/api/feature/${key}?id=${id}`,
    details: `Deleted ${key} record ID: ${id}`,
    statusCode: 200,
  });

  return NextResponse.json({
    success: true,
    code: 200,
    message: "Deleted",
  });
}

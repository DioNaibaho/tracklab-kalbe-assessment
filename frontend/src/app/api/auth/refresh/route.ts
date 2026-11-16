import { NextRequest, NextResponse } from "next/server";
import { KALBE_BASE_URL, getKalbeHeaders } from "@/lib/kalbe";
import { recordActivityLog } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const refreshToken = req.cookies.get("tracklab_refresh_token")?.value;
  const upstreamCookie = req.cookies.get("kalbe_upstream_cookie")?.value;
  const userCookie = req.cookies.get("tracklab_user")?.value;
  let username = "assessment.it";

  if (userCookie) {
    try {
      username = JSON.parse(userCookie).username || username;
    } catch {}
  }

  let newAccessToken = `trk_acc_${Date.now()}`;
  let newRefreshToken = refreshToken || `trk_ref_${Date.now()}`;
  let source = "Local Session";

  if (refreshToken || upstreamCookie) {
    try {
      const headers = getKalbeHeaders(refreshToken);
      if (upstreamCookie) {
        headers["Cookie"] = upstreamCookie;
      }

      const kalbeRes = await fetch(
        `${KALBE_BASE_URL}/api/v1/authentication/auth/token/refresh?refreshAuthorization=true`,
        { method: "GET", headers }
      );

      if (kalbeRes.ok) {
        const data = await kalbeRes.json();
        const extractedAccess =
          data?.data?.accessToken || data?.data?.access_token || data?.accessToken;
        const extractedRefresh =
          data?.data?.refreshToken || data?.data?.refresh_token || data?.refreshToken;

        if (extractedAccess) {
          newAccessToken = extractedAccess;
          if (extractedRefresh) newRefreshToken = extractedRefresh;
          source = "Kalbe Biopharma API";
        }
      }
    } catch {}
  }

  await recordActivityLog({
    username,
    action: "REFRESH_TOKEN",
    module: "AUTH",
    endpoint: "/api/auth/refresh",
    details: `Token refreshed via ${source}`,
    statusCode: 200,
  });

  const res = NextResponse.json({
    success: true,
    message: "Token berhasil diperbarui",
    source,
  });

  res.cookies.set("tracklab_access_token", newAccessToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  res.cookies.set("tracklab_refresh_token", newRefreshToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
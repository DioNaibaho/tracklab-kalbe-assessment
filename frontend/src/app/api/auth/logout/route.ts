import { NextRequest, NextResponse } from "next/server";
import { KALBE_BASE_URL, getKalbeHeaders } from "@/lib/kalbe";
import { recordActivityLog } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const accessToken = req.cookies.get("tracklab_access_token")?.value;
  const userCookie = req.cookies.get("tracklab_user")?.value;
  let username = "assessment.it";

  if (userCookie) {
    try {
      username = JSON.parse(userCookie).username || username;
    } catch {}
  }

  if (accessToken) {
    try {
      await fetch(`${KALBE_BASE_URL}/api/v1/authentication/auth/logout`, {
        method: "POST",
        headers: getKalbeHeaders(accessToken),
        body: JSON.stringify({
          appCode: "ASSESSMENT",
          moduleCode: "ALL",
          user: username,
        }),
      });
    } catch {}
  }

  await recordActivityLog({
    username,
    action: "LOGOUT",
    module: "AUTH",
    endpoint: "/auth/logout",
    details: `User ${username} logged out`,
    statusCode: 200,
  });

  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.delete("tracklab_access_token");
  response.cookies.delete("tracklab_refresh_token");
  response.cookies.delete("kalbe_upstream_cookie");
  response.cookies.delete("tracklab_user");
  return response;
}

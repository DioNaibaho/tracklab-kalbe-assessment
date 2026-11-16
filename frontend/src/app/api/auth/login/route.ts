import { NextRequest, NextResponse } from "next/server";
import { KALBE_BASE_URL, getKalbeHeaders } from "@/lib/kalbe";
import { recordActivityLog } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const payload = {
      appCode: body.appCode || "ASSESSMENT",
      moduleCode: body.moduleCode || "ALL",
      user: body.user,
      password: body.password,
    };

    const kalbeRes = await fetch(
      `${KALBE_BASE_URL}/api/v1/authentication/auth/login`,
      {
        method: "POST",
        headers: getKalbeHeaders(),
        body: JSON.stringify(payload),
      }
    );

    const data = await kalbeRes.json();

    if (!kalbeRes.ok || !data.success) {
      await recordActivityLog({
        username: payload.user || "unknown",
        action: "LOGIN_FAILED",
        module: "AUTH",
        endpoint: "/auth/login",
        details: data.message || "Authentication failed",
        statusCode: kalbeRes.status || 401,
      });

      return NextResponse.json(
        { success: false, message: data.message || "Login gagal" },
        { status: kalbeRes.status || 401 }
      );
    }

    const accessToken = data.data?.token?.access;
    const refreshToken = data.data?.token?.refresh;
    const expiresIn = data.data?.token?.expiresIn || 3600;
    const rawSetCookie = kalbeRes.headers.get("set-cookie") || "";

    const userProfile = {
      id: data.data?.id,
      username: data.data?.username,
      email: data.data?.email,
      appDescription: data.data?.appDescription,
      appCode: data.data?.appCode,
      moduleCode: data.data?.moduleCode,
    };

    await recordActivityLog({
      username: userProfile.username || payload.user,
      action: "LOGIN",
      module: "AUTH",
      endpoint: "/auth/login",
      details: `User ${userProfile.username} logged in (${userProfile.email})`,
      statusCode: 200,
    });

    const response = NextResponse.json({
      success: true,
      user: userProfile,
    });

    response.cookies.set("tracklab_access_token", accessToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: expiresIn,
    });

    if (refreshToken) {
      response.cookies.set("tracklab_refresh_token", refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    if (rawSetCookie) {
      response.cookies.set("kalbe_upstream_cookie", rawSetCookie, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    response.cookies.set("tracklab_user", JSON.stringify(userProfile), {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: expiresIn,
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, message: "Internal server error during login" },
      { status: 500 }
    );
  }
}

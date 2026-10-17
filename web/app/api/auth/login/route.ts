import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { email, password, demoRole } = body;

    // Server-side mapping for demo access without exposing credentials to client
    if (demoRole === "OWNER") {
      email = "owner@shelfsense.local";
      password = process.env.DEMO_OWNER_PASSWORD || "password123";
    } else if (demoRole === "STAFF") {
      email = "staff@shelfsense.local";
      password = process.env.DEMO_STAFF_PASSWORD || "password123";
    }

    if (!email || !password) {
      return NextResponse.json(
        { statusCode: 400, message: "Email and password are required" },
        { status: 400 }
      );
    }

    const backendRes = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(data, { status: backendRes.status });
    }

    // Extract token (either at data.accessToken or data.data.accessToken)
    const token =
      data.accessToken ||
      (data.data && data.data.accessToken);

    const user =
      data.user ||
      (data.data && data.data.user);

    if (!token) {
      return NextResponse.json(
        { statusCode: 502, message: "Authentication token missing from upstream service" },
        { status: 502 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user,
      message: "Logged in successfully",
    });

    // Set secure httpOnly cookie
    response.cookies.set({
      name: "accessToken",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      {
        statusCode: 500,
        message: error.message || "Internal server error during login",
      },
      { status: 500 }
    );
  }
}

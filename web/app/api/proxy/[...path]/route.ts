import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";

async function proxyRequest(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await params;
    const pathString = path.join("/");
    const search = req.nextUrl.search;
    const targetUrl = `${API_BASE_URL}/api/v1/${pathString}${search}`;

    const token = req.cookies.get("accessToken")?.value;

    const headers: Record<string, string> = {
      "Content-Type": req.headers.get("content-type") || "application/json",
      Accept: "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const init: RequestInit = {
      method: req.method,
      headers,
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      const body = await req.text();
      if (body) {
        init.body = body;
      }
    }

    const backendRes = await fetch(targetUrl, init);
    const contentType = backendRes.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      const data = await backendRes.json();
      return NextResponse.json(data, {
        status: backendRes.status,
      });
    }

    const textData = await backendRes.text();
    return new NextResponse(textData, {
      status: backendRes.status,
      headers: {
        "Content-Type": contentType || "text/plain",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        statusCode: 502,
        message: "Failed to communicate with ShelfSense backend service",
        error: error.message,
      },
      { status: 502 }
    );
  }
}

export {
  proxyRequest as GET,
  proxyRequest as POST,
  proxyRequest as PUT,
  proxyRequest as PATCH,
  proxyRequest as DELETE,
};

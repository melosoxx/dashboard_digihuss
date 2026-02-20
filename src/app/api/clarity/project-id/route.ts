import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const headerProjectId = request.headers.get("X-Clarity-Project-Id");
  const projectId = headerProjectId || process.env.CLARITY_PROJECT_ID || null;

  return NextResponse.json({ projectId });
}

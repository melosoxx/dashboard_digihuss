import { NextResponse } from "next/server";
import { clarityClient } from "@/lib/clarity";

export async function GET() {
  try {
    const data = await clarityClient.getInsights();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Clarity error:", error);
    return NextResponse.json(
      { error: "Failed to fetch insights from Clarity" },
      { status: 500 }
    );
  }
}

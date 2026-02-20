import { NextResponse, type NextRequest } from "next/server";
import { resolveClarityClient } from "@/lib/credentials";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const rawDays = parseInt(searchParams.get("numOfDays") || "3", 10);
    const numOfDays = ([1, 2, 3] as const).includes(rawDays as 1 | 2 | 3)
      ? (rawDays as 1 | 2 | 3)
      : 3;

    const client = resolveClarityClient(request);
    const data = await client.getInsights(numOfDays);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Clarity error:", error);
    const status = (error as Error & { status?: number }).status;
    if (status === 429) {
      return NextResponse.json(
        { error: "Límite diario de Clarity excedido. Intentá mañana." },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: "Error al obtener datos de Clarity" },
      { status: 500 }
    );
  }
}

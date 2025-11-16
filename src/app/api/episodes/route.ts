// app/api/episodes/route.ts
import { NextResponse } from "next/server";
import { getEpisodesGrouped } from "@/lib/episodes";

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await getEpisodesGrouped();
    return NextResponse.json({ data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

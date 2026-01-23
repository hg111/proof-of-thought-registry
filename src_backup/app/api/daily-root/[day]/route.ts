import { NextRequest, NextResponse } from "next/server";
import { computeAndStoreDailyRoot } from "@/lib/dailyRoot";

export async function GET(_req: NextRequest, { params }: { params: { day: string } }) {
  const day = params.day; // YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return NextResponse.json({ error: "invalid day format (YYYY-MM-DD)" }, { status: 400 });
  }
  const out = computeAndStoreDailyRoot(day);
  return NextResponse.json(out);
}
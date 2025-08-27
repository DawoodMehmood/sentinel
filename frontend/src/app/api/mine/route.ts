import { NextResponse } from "next/server";
import { inngest } from "@/utils/inngest";

export async function POST() {
  try {
    // Send the event that triggers the function
    await inngest.send({ name: "app/mine.patterns", data: {} });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

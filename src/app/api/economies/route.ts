import { listEconomies } from "@/server/db";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ economies: listEconomies() });
}

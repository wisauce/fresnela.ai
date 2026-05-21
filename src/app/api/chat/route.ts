import { handleWorkspaceChat } from "@/server/agent";
import { chatSchema } from "@/server/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const parsed = chatSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid chat payload", details: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const result = await handleWorkspaceChat(parsed.data);
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Chat failed" }, { status: 400 });
  }
}

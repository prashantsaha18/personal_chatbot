import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import sql from "@/lib/db";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const userId = (session.user as any).id;

  // Verify ownership
  const chat = await sql`
    SELECT id FROM chats WHERE id = ${params.id} AND user_id = ${userId}
  `;
  if (!chat.length) return new Response("Not Found", { status: 404 });

  const messages = await sql`
    SELECT id, role, content, created_at
    FROM messages
    WHERE chat_id = ${params.id}
    ORDER BY created_at ASC
  `;
  return Response.json(messages);
}

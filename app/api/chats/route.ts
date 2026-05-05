import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import sql from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const userId = (session.user as any).id;
  const chats = await sql`
    SELECT id, title, created_at, updated_at
    FROM chats
    WHERE user_id = ${userId}
    ORDER BY updated_at DESC
  `;
  return Response.json(chats);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { id } = await req.json();
  const userId = (session.user as any).id;

  await sql`
    DELETE FROM chats WHERE id = ${id} AND user_id = ${userId}
  `;
  return Response.json({ success: true });
}

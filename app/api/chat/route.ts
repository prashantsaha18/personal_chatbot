import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import sql from "@/lib/db";
import OpenAI from "openai";

// xAI is OpenAI-compatible
const xai = new OpenAI({
  apiKey: process.env.XAI_API_KEY!,
  baseURL: "https://api.x.ai/v1",
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages, chatId } = await req.json();
  const userId = (session.user as any).id;

  // Create a new chat record if needed
  let activeChatId = chatId;
  if (!activeChatId) {
    const firstMsg = messages.find((m: any) => m.role === "user")?.content || "New Chat";
    const title = firstMsg.slice(0, 60);
    const rows = await sql`
      INSERT INTO chats (user_id, title)
      VALUES (${userId}, ${title})
      RETURNING id
    `;
    activeChatId = rows[0].id;
  }

  // Save user message
  const lastMsg = messages[messages.length - 1];
  await sql`
    INSERT INTO messages (chat_id, role, content)
    VALUES (${activeChatId}, ${lastMsg.role}, ${lastMsg.content})
  `;

  // Stream from xAI Grok
  const stream = await xai.chat.completions.create({
    model: "grok-3-mini",   // or "grok-3" for full model
    messages,
    stream: true,
    max_tokens: 2048,
  });

  let fullResponse = "";

  const readableStream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Send chat ID first (so client can redirect to /chat/[id])
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ chatId: activeChatId })}\n\n`)
      );

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || "";
        fullResponse += text;
        if (text) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
          );
        }
      }

      // Save assistant response
      await sql`
        INSERT INTO messages (chat_id, role, content)
        VALUES (${activeChatId}, 'assistant', ${fullResponse})
      `;

      // Update chat timestamp
      await sql`
        UPDATE chats SET updated_at = NOW() WHERE id = ${activeChatId}
      `;

      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

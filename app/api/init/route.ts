import { initDB } from "@/lib/db";

export async function GET(req: Request) {
  // Simple secret check to prevent public access
  const { searchParams } = new URL(req.url);
  if (searchParams.get("secret") !== process.env.NEXTAUTH_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }
  try {
    await initDB();
    return Response.json({ success: true, message: "Database tables created!" });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

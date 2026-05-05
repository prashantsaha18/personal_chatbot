import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";

export default function ChatIdPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <ChatArea chatId={params.id} />
      </main>
    </div>
  );
}

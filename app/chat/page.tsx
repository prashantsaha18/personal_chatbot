import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";

export default function ChatPage() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <ChatArea />
      </main>
    </div>
  );
}

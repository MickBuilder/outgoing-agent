import { ScrollArea } from "@/components/ui/scroll-area";
import { Message } from "@/lib/hooks/use-chat";
import { ChatMessage } from "./ChatMessage";
import { useEffect, useRef } from "react";
interface ChatMessagesProps {
    messages: Message[];
    isLoading: boolean;
}
export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);

    return (
        <ScrollArea className="h-[calc(100vh-150px)] w-full p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
                {messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)}
                {isLoading && <ChatMessage message={{ id: 'loading', sender: 'agent', text: 'Thinking...' }} />}
            </div>
        </ScrollArea>
    );
}
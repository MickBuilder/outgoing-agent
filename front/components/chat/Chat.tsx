'use client';

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Message, Event, useChat } from "@/lib/hooks/use-chat";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { EventGrid } from "../events/EventGrid";

// Define the props for the Chat component
interface ChatProps {
    initialData: {
        messages: Message[];
        events: Event[];
    } | null;
}

export function Chat({ initialData }: ChatProps) {
    const { messages, events, isLoading, handleSendMessage } = useChat(initialData);

    return (
        <ResizablePanelGroup direction="horizontal" className="h-screen w-screen">
            <ResizablePanel defaultSize={70}>
                <EventGrid events={events} />
            </ResizablePanel>

            <ResizableHandle  />

            <ResizablePanel defaultSize={30} minSize={25}>
                <div className="flex flex-col h-full">
                    <div className="p-4 border-b">
                        <h1 className="text-xl font-bold">Connector Agent</h1>
                        <p className="text-sm text-muted-foreground">Your AI companion for finding real-life connections.</p>
                    </div>
                    <div className="flex-1">
                       <ChatMessages messages={messages} isLoading={isLoading} />
                    </div>
                    <div className="p-4 border-t">
                       <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
                    </div>
                </div>
            </ResizablePanel>
        </ResizablePanelGroup>
    );
}
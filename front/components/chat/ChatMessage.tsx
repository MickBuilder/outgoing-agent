import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Message } from "@/lib/hooks/use-chat"; // Import our Message type

interface ChatMessageProps {
    message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
    return (
        <div className={cn('flex items-start gap-4', message.sender === 'user' && 'justify-end')}>
            {message.sender === 'agent' && (
                <Avatar className="h-8 w-8">
                    <AvatarImage src="/agent-avatar.png" alt="Agent"/>
                    <AvatarFallback>A</AvatarFallback>
                </Avatar>
            )}
            <div className={cn(
                'flex max-w-[75%] flex-col gap-2 rounded-lg p-3 text-sm',
                message.sender === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
            )}>
                {message.text}
            </div>
        </div>
    );
}
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useRef } from 'react';

interface ChatInputProps {
    onSendMessage: (message: string) => void;
    isLoading: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSend = () => {
        const textarea = textareaRef.current;
        if (textarea && !isLoading && textarea.value.trim()) {
            onSendMessage(textarea.value);
            textarea.value = '';
            textarea.style.height = 'auto'; // Reset height after sending
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevents adding a new line
            handleSend();
        }
    };

    const handleInput = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }

    return (
        <div className="flex w-full items-end space-x-2">
            <Textarea
                ref={textareaRef}
                onKeyDown={handleKeyDown}
                onInput={handleInput}
                placeholder="Ask about events or share feedback..."
                disabled={isLoading}
                className="min-h-[40px] max-h-[150px] resize-none"
                rows={1}
            />
            <Button type="button" onClick={handleSend} disabled={isLoading}>Send</Button>
        </div>
    );
}
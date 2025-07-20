import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface Event {
    title: string;
    date: string;
    location: string;
    summary: string;
    url: string;
}

export interface Message {
    id: string;
    sender: 'user' | 'agent';
    text: string;
}

export function useChat(initialData: { messages: Message[], events: Event[] } | null) {
    const [messages, setMessages] = useState<Message[]>(initialData?.messages || []);
    const [events, setEvents] = useState<Event[]>(initialData?.events || []);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    // Effect to get or create an anonymous user ID
    useEffect(() => {
        let currentUserId = localStorage.getItem('connector_user_id');
        if (!currentUserId) {
            currentUserId = uuidv4();
            localStorage.setItem('connector_user_id', currentUserId);
        }
        setUserId(currentUserId);
    }, []);

    const handleSendMessage = async (messageText: string) => {
        if (!messageText.trim() || isLoading || !userId) return;

        const userMessage: Message = { id: uuidv4(), sender: 'user', text: messageText };
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/chat`;
        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);
        setEvents([]);

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    message: messageText,
                }),
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }

            const data = await response.json();
            const agentMessage: Message = { id: uuidv4(), sender: 'agent', text: data.response_text };
            setMessages((prev) => [...prev, agentMessage]);

            if (data.events && data.events.length > 0) {
                setEvents(data.events);
            }

        } catch (error) {
            console.error('Failed to send message:', error);
            const errorMessage: Message = { id: uuidv4(), sender: 'agent', text: 'Oops! I had trouble connecting. Please try again.' };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        messages,
        events,
        input,
        setInput,
        handleSendMessage,
        isLoading,
    };
}
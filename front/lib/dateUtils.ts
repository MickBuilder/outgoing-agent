import { Event } from "@/lib/hooks/use-chat"; // Assuming your Event type is exported from use-chat

export function groupEventsByDate(events: Event[]): Record<string, Event[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const getRelativeDateLabel = (date: Date): string => {
        if (date.getTime() === today.getTime()) {
            return "Today";
        }
        if (date.getTime() === tomorrow.getTime()) {
            return "Tomorrow";
        }
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return events.reduce((acc: Record<string, Event[]>, event) => {
        // Create a new Date object and normalize it to midnight to avoid timezone issues
        const eventDate = new Date(event.date + 'T00:00:00');
        const label = getRelativeDateLabel(eventDate);
        
        if (!acc[label]) {
            acc[label] = [];
        }
        acc[label].push(event);
        return acc;
    }, {});
}
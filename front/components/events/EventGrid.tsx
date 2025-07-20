import { ScrollArea } from "@/components/ui/scroll-area";
import { Event } from "@/lib/hooks/use-chat";
import { EventCard } from "./EventCard";
import { groupEventsByDate } from "@/lib/dateUtils"; // <-- Import our new helper

export function EventGrid({ events }: { events: Event[] }) {
    if (events.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                    <p className="text-lg font-medium">No events found yet.</p>
                    <p className="text-sm">Ask the agent to find activities for you!</p>
                </div>
            </div>
        );
    }

    const groupedEvents = groupEventsByDate(events);
    const dateSections = Object.keys(groupedEvents);

    return (
        <ScrollArea className="h-full">
            <div className="p-4 space-y-8">
                {dateSections.map(dateLabel => (
                    <section key={dateLabel}>
                        <h2 className="text-xl font-bold mb-4 tracking-tight">{dateLabel}</h2>
                        {/* Responsive grid: 1 col on small, 2 on medium, 3 on large screens */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {groupedEvents[dateLabel].map((event) => (
                                <EventCard key={event.url} event={event} />
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </ScrollArea>
    );
}
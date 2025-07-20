import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Event } from "@/lib/hooks/use-chat";

// --- Import the icons we need ---
import { CalendarDays, MapPin } from 'lucide-react';

export function EventCard({ event }: { event: Event }) {
  // Helper function to format the date nicely
  const formattedDate = new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">{event.title}</CardTitle>
        
        {/* --- New section for date and location with icons --- */}
        <div className="space-y-1 pt-2 text-sm text-muted-foreground">
          <div className="flex items-center">
            <CalendarDays className="mr-2 h-4 w-4" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center">
            <MapPin className="mr-2 h-4 w-4" />
            <span>{event.location}</span>
          </div>
        </div>

      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-foreground/80">{event.summary}</p>
      </CardContent>
      <CardFooter>
        <Button asChild variant="secondary" className="w-full">
          <a href={event.url} target="_blank" rel="noopener noreferrer">View Event Details</a>
        </Button>
      </CardFooter>
    </Card>
  );
}
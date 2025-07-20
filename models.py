# models.py
from pydantic import BaseModel, Field
from typing import List, Optional

# --- Data model for a single event ---
class Event(BaseModel):
    title: str = Field(description="The clear, concise title of the event.")
    date: str = Field(description="The strict 'YYYY-MM-DD' format of the event's start date.")
    location: str = Field(description="The city and state, or specific venue address.")
    summary: str = Field(description="A one-sentence summary of why this event is a good fit for the user.")
    url: str = Field(description="The full URL to the event page for more details.")

# --- The standard response model for the API ---
# The agent will now be forced to output its final answer in this format.
class ChatResponse(BaseModel):
    response_text: str = Field(description="The conversational, natural-language response to the user.")
    events: Optional[List[Event]] = Field(default=[], description="A list of event objects found by the agent.")
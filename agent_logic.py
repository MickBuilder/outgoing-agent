# agent_logic.py
import os
import functools
import datetime
from dotenv import load_dotenv

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_tavily import TavilySearch
# We now import StructuredTool
from langchain.tools import Tool, StructuredTool
from pydantic import BaseModel, Field

from models import ChatResponse
from user_profile import get_user_profile, update_user_profile 
from scraping_tool import smart_scraper_tool

load_dotenv()

# --- Agent 1: The Event-Finding Specialist (Upgraded with Memory) ---
def create_event_finding_agent(user_id: str):
    """
    Creates a specialist agent focused on finding events.
    It can now also update the user's profile if it learns new information.
    """
    llm = ChatOpenAI(model="gpt-4o", temperature=0.5)
    
    # --- Tools for the Event Finder ---
    get_profile_for_user_partial = functools.partial(get_user_profile, user_id=user_id)
    get_profile_tool = Tool(
        name="get_profile_tool_for_user",
        func=lambda *args, **kwargs: get_profile_for_user_partial(),
        description="MUST be called to get the user's current profile (city, interests, etc.)."
    )

    class UpdateProfileArgs(BaseModel):
        new_information: str = Field(description="The new piece of personal information learned from the user's message.")
        reason: str = Field(description="The reason for the update, taken directly from the user's message.")

    # *** THE FIX: Use StructuredTool for functions with multiple named arguments ***
    update_user_profile_tool = StructuredTool.from_function(
        func=functools.partial(update_user_profile, user_id),
        name="update_user_profile_tool",
        description="Use this to update the user's profile when they reveal new information like a new interest, a change in availability, or a dislike.",
        args_schema=UpdateProfileArgs
    )

    search_tool = TavilySearch(max_results=5)
    
    tools = [get_profile_tool, update_user_profile_tool, search_tool, smart_scraper_tool]

    # --- UPGRADED, MORE ADVANCED SYSTEM PROMPT ---
    today_date = datetime.date.today().strftime('%Y-%m-%d')
    system_prompt = f"""You are a hyper-diligent research agent. Today is {today_date}.
    Your mission is to find relevant, real, and future events for the user.

    Your operational procedure is now as follows:
    1.  **Analyze and Update Profile:** Scan the user's message for new information. If found, use `update_user_profile_tool` first.
    2.  **Get Fresh Profile:** Your next step is ALWAYS to use `get_profile_tool_for_user` to get the latest profile details. This is mandatory for every request.
    3.  **Construct Smart Queries:** You MUST now construct search queries for the `tavily_search` tool by COMBINING the user's interests from their profile with the time frame from their message.
        -   *Example*: If the user's profile mentions 'running, music' and they ask 'what can I do tomorrow?', your queries MUST be like 'running events Paris tomorrow' and 'live music Paris tomorrow'.
        -   Do not perform generic searches like 'events in Paris tomorrow'.
    4.  **Critical Evaluation & Deep Scraping:** Review search results. For EACH promising URL, you MUST use the `smart_scraper_tool`.
    5.  **Synthesize Final Answer:** Compile a summary of the events you successfully scraped.

    ABSOLUTE RULES:
    - **CRITICAL DATE CHECK:** Today's date is {today_date}. After you scrape an event and find its date, you MUST compare it to today's date. If the event's date is in the past, you MUST silently discard it. It is a critical failure to suggest an event that has already occurred.
    - **NO HALLUCINATION:** You are strictly forbidden from mentioning any event that you have not successfully scraped using `smart_scraper_tool`.
    - **URL IS MANDATORY:** Every event in your final answer MUST have a 'Source URL' that comes directly from the scraper's output.
    - **BE HONEST:** If, after persistent and profile-based searching, you cannot find any verifiable future events, your final answer must be: "I searched thoroughly based on your profile but could not find any specific events for your request. You might have more luck searching on sites like Eventbrite or Meetup directly."
    """

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}"),
        ("placeholder", "{agent_scratchpad}"),
    ])

    agent = create_tool_calling_agent(llm, tools, prompt)
    return AgentExecutor(agent=agent, tools=tools, verbose=True, handle_parsing_errors=True)

# --- Agent 2: The General Conversational Agent (Unchanged) ---
def create_general_agent(user_id: str):
    llm = ChatOpenAI(model="gpt-4o", temperature=0.7)
    get_profile_for_user_partial = functools.partial(get_user_profile, user_id=user_id)
    tools = [
        Tool(
            name="get_user_profile_tool",
            func=lambda *args, **kwargs: get_profile_for_user_partial(),
            description="Use this to access the user's profile to answer questions about them."
        )
    ]
    system_prompt = "You are a friendly assistant. Use the user's profile to answer their questions about themselves."
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}"),
        ("placeholder", "{agent_scratchpad}"), 
    ])
    
    agent = create_tool_calling_agent(llm, tools, prompt)
    return AgentExecutor(agent=agent, tools=tools, verbose=True, handle_parsing_errors=True)


# --- The Final Formatting Chain (Unchanged) ---
def create_formatter_chain():
    formatter_llm = ChatOpenAI(model="gpt-4o", temperature=0)
    system_message = """You are an expert formatting assistant. Your task is to take the user's text and convert it into a structured `ChatResponse` JSON object.

    - The `response_text` field should be a brief, friendly, one-sentence introduction. DO NOT include the list of events in the `response_text`.
    - If the text mentions specific events, extract ALL their details (title, date, location, summary, url) into the `events` list.
    - If no specific, concrete events are mentioned, the `events` list MUST be an empty list `[]`.
    """
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_message),
        ("human", "Please format the following text:\n\n{agent_answer}")
    ])
    
    return prompt | formatter_llm.with_structured_output(ChatResponse)
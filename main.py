# main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware 
from pydantic import BaseModel
import json
import traceback

# Now importing all three creators
from agent_logic import create_event_finding_agent, create_general_agent, create_formatter_chain
from user_profile import save_user_profile, get_user_profile
from models import ChatResponse
from langchain_core.messages import HumanMessage, AIMessage
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

# --- App and State Setup ---
app = FastAPI(title="Connector Agent API")
session_histories: dict[str, list] = {}
origins = ["http://localhost:3000"]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# --- API Models ---
class ChatRequest(BaseModel):
    user_id: str
    message: str

class OnboardSubmitRequest(BaseModel):
    user_id: str
    answers: dict[str, str]

# --- Helper Functions ---
def load_onboarding_questions():
    with open('onboarding_questions.json', 'r') as f:
        return json.load(f)

async def route_request(message: str) -> str:
    """Uses an LLM to decide the user's intent."""
    router_llm = ChatOpenAI(model="gpt-4o", temperature=0)
    system_prompt = """You are an expert request router. Your job is to classify the user's message into one of two categories:
    1. 'event_finding': For any requests related to finding activities, events, things to do, etc.
    2. 'general_conversation': For requests about the user's own profile, greetings, or other non-event questions.
    
    Respond with ONLY the category name and nothing else."""
    
    prompt = ChatPromptTemplate.from_messages([("system", system_prompt), ("human", "{input}")])
    router_chain = prompt | router_llm
    response = await router_chain.ainvoke({"input": message})
    route = response.content.strip()
    print(f"--- Routing request to: {route} ---")
    return route

async def get_agent_response(user_id: str, message: str, chat_history: list) -> ChatResponse:
    """Helper function to route, run the correct agent, and format the response."""
    try:
        route = await route_request(message)
        
        # --- THE FIX: We now have two distinct logic paths based on the route ---

        # PATH 1: The user wants to find events. Use the full agent->formatter pipeline.
        if route == "event_finding":
            agent_executor = create_event_finding_agent(user_id=user_id)
            
            # Step 1: Run the research agent to get a text block of events.
            agent_response = await agent_executor.ainvoke({"input": message, "chat_history": chat_history})
            agent_answer_text = agent_response['output']
            print(f"--- Raw Event Agent Output: {agent_answer_text}")

            # Step 2: Run the formatter to reliably extract events and create the final JSON.
            formatter_chain = create_formatter_chain()
            structured_response = await formatter_chain.ainvoke({"agent_answer": agent_answer_text})
            return structured_response

        # PATH 2: The user is having a general conversation. We BYPASS the formatter.
        else: # Defaults to 'general_conversation'
            agent_executor = create_general_agent(user_id=user_id)
            
            # Step 1: Run the conversational agent. Its output is the final answer.
            agent_response = await agent_executor.ainvoke({"input": message, "chat_history": chat_history})
            agent_answer_text = agent_response['output']
            print(f"--- Raw General Agent Output: {agent_answer_text}")

            # Step 2: Manually build the ChatResponse. The agent's output is the response_text.
            # This completely avoids the faulty formatting step.
            return ChatResponse(response_text=agent_answer_text, events=[])

    except Exception as e:
        print(f"--- AGENT OR FORMATTER FAILED ---\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Agent failed: {e}")

# --- API Endpoints ---
@app.get("/onboarding/start/{user_id}")
async def start_onboarding(user_id: str):
    profile = get_user_profile(user_id)
    return {
        "status": "complete" if "No profile found" not in profile else "pending",
        "questions": [] if "No profile found" not in profile else load_onboarding_questions()
    }

@app.post("/onboarding/submit", response_model=ChatResponse)
async def submit_onboarding_and_get_events(request: OnboardSubmitRequest):
    user_id, answers = request.user_id, request.answers
    profile_text = "User Profile:\n" + "\n".join(f"- {q.get('text', q['id'])}: {answers.get(q['id'], 'N/A')}" for q in load_onboarding_questions())
    save_user_profile(user_id, profile_text)
    
    initial_prompt = "Based on my new profile, please suggest some fun events for me for the upcoming weekend."
    output_data = await get_agent_response(user_id, initial_prompt, [])
    
    initial_history = [AIMessage(content=output_data.response_text)]
    session_histories[user_id] = initial_history
    return output_data

@app.post("/chat", response_model=ChatResponse)
async def chat_with_agent(request: ChatRequest):
    user_id, message = request.user_id, request.message
    chat_history = session_histories.get(user_id, [])
    
    output_data = await get_agent_response(user_id, message, chat_history)
    print(f"--- Final Structured Output: {output_data}")
    
    chat_history.append(HumanMessage(content=message))
    chat_history.append(AIMessage(content=output_data.response_text))
    session_histories[user_id] = chat_history
    
    return output_data
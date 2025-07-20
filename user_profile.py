import chromadb

# --- 1. Setup the Persistent Database ---
client = chromadb.PersistentClient(path="./chroma_db")
user_profile_collection = client.get_or_create_collection(name="user_profiles")

# --- 2. Define the Core Profile Functions ---
# Note: These are now just plain Python functions, no @tool decorator.

def save_user_profile(user_id: str, profile_text: str):
    """Saves or updates a user's profile text in the database."""
    # The `upsert` method is safer: it creates if not exists, and updates if it does.
    user_profile_collection.upsert(
        documents=[profile_text],
        ids=[user_id]
    )
    print(f"Profile saved/updated for user: {user_id}")

def get_user_profile(user_id: str) -> str:
    """Retrieves a user's profile from the database."""
    try:
        profile = user_profile_collection.get(ids=[user_id])
        if profile['documents']:
            return profile['documents'][0]
        else:
            return "No profile found for this user."
    except Exception as e:
        return f"Error retrieving profile: {e}"

def update_user_profile(user_id: str, new_information: str, reason: str) -> str:
    """
    Intelligently merges new information into an existing user profile.
    This is a plain function that will be wrapped as a tool.
    """
    from langchain_openai import ChatOpenAI # Local import to avoid circular dependencies

    current_profile = get_user_profile(user_id)
    if "No profile found" in current_profile:
        return "Cannot update a profile that does not exist."

    updater_llm = ChatOpenAI(model="gpt-4o", temperature=0)
    
    updater_prompt = f"""You are a profile manager. Your task is to intelligently integrate new information into an existing user profile.
    
    Current Profile:
    ---
    {current_profile}
    ---
    
    New Information to Integrate:
    '{new_information}' (Reason: {reason})

    Rewrite the entire profile, seamlessly incorporating the new information. Maintain the existing structure and tone.
    
    Updated Profile:"""

    updated_profile_text = updater_llm.invoke(updater_prompt).content
    
    save_user_profile(user_id, updated_profile_text)
    
    return "Profile successfully updated."
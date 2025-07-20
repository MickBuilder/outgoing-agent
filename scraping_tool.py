import requests
from bs4 import BeautifulSoup
from langchain.tools import tool
from langchain_openai import ChatOpenAI

def get_text_from_url(url: str) -> str:
    """Fetches and extracts clean text content from a URL."""
    try:
        response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        for script in soup(["script", "style"]):
            script.extract()
        
        return " ".join(t.strip() for t in soup.stripped_strings)
    except requests.RequestException as e:
        print(f"Error fetching URL {url}: {e}")
        return f"Error: Could not fetch the URL. Status code might be an issue."

@tool
def smart_scraper_tool(url: str) -> str:
    """
    Use this tool to get detailed information from a specific event webpage URL.
    It takes a URL, extracts key event details, and returns them.
    """
    page_text = get_text_from_url(url)
    if page_text.startswith("Error"):
        return page_text

    extractor_llm = ChatOpenAI(model="gpt-4o", temperature=0)

    # *** UPDATED PROMPT TO INCLUDE THE URL IN THE OUTPUT ***
    extractor_prompt = f"""You are a data extraction bot.
    From the following webpage text, which was sourced from the URL '{url}', extract the key details for the event.
    If a piece of information is not present, state 'Not found'.
    
    Webpage Text:
    ---
    {page_text[:4000]} 
    ---
    
    Extract the following fields and format them clearly:
    - Title: 
    - Date(s):
    - Location/Address:
    - Summary:
    - Source URL: {url}
    """
    
    extracted_info = extractor_llm.invoke(extractor_prompt).content
    return extracted_info
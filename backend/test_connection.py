import asyncio
import os
from dotenv import load_dotenv
from backend.openrouter import query_model
from backend.config import COUNCIL_MODELS

load_dotenv()

async def test():
    api_key = os.getenv("OPENROUTER_API_KEY")
    print(f"API Key present: {bool(api_key)}")
    if api_key:
        print(f"API Key start: {api_key[:10]}...")

    print("\nTesting connection with gemini-2.5-flash (Title generator)...")
    try:
        response = await query_model("google/gemini-2.5-flash", [{"role": "user", "content": "Hello"}], timeout=10.0)
        if response:
            print("✓ gemini-2.5-flash responded")
        else:
            print("✗ gemini-2.5-flash returned None")
    except Exception as e:
        print(f"✗ gemini-2.5-flash failed: {e}")

    print("\nTesting first council model:", COUNCIL_MODELS[0])
    try:
        response = await query_model(COUNCIL_MODELS[0], [{"role": "user", "content": "Hello"}], timeout=10.0)
        if response:
            print(f"✓ {COUNCIL_MODELS[0]} responded")
        else:
            print(f"✗ {COUNCIL_MODELS[0]} returned None")
    except Exception as e:
        print(f"✗ {COUNCIL_MODELS[0]} failed: {e}")

if __name__ == "__main__":
    asyncio.run(test())


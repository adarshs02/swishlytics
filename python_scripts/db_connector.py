import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

def get_supabase_client():
    """
    Initializes and returns the Supabase client.

    Returns:
        Client: An instance of the Supabase client.
    """
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    
    if not url or not key:
        raise ValueError("Supabase URL and anon key must be set in the .env file.")

    return create_client(url, key)

if __name__ == '__main__':
    # Example usage: Fetch players and print their names
    try:
        supabase = get_supabase_client()
        response = supabase.table('players').select('full_name').limit(5).execute()
        
        if response.data:
            print("Successfully connected to Supabase!")
            print("First 5 players found:")
            for player in response.data:
                print(player['full_name'])
        else:
            print("Could not fetch players, but connection might still be valid.")
            print("Response:", response)

    except Exception as e:
        print(f"An error occurred: {e}")

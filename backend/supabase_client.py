import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL:
    raise EnvironmentError("SUPABASE_URL environment variable is not set")
if not SUPABASE_SERVICE_KEY:
    raise EnvironmentError("SUPABASE_SERVICE_KEY environment variable is not set")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
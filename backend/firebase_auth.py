from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx
from config import FIREBASE_PROJECT_ID

security = HTTPBearer(auto_error=False)

async def verify_firebase_token(
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    if not credentials:
        return None
    token = credentials.credentials
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=AIzaSyC9zMexi784uFA8RPpifritlKS_5mf4viU",
                json={"idToken": token}
            )
            if response.status_code == 200:
                data = response.json()
                users = data.get("users", [])
                if users:
                    return users[0]
        return None
    except Exception:
        return None

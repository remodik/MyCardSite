import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import uuid
from datetime import datetime

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_test_user():
    client = AsyncIOMotorClient("mongodb://localhost:27017/projectsdb")
    db = client.projectsdb
    
    # Check if user already exists
    existing_user = await db.users.find_one({"username": "testuser"})
    if existing_user:
        print("Test user already exists!")
        return
    
    # Create test user
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "username": "testuser",
        "email": "testuser@example.com",
        "password_hash": pwd_context.hash("test123"),
        "role": "user",
        "created_at": datetime.utcnow().isoformat(),
    }
    
    await db.users.insert_one(user)
    print("Test user created successfully!")
    print("Username: testuser")
    print("Password: test123")
    print("Email: testuser@example.com")

if __name__ == "__main__":
    asyncio.run(create_test_user())

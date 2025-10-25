import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import uuid
from datetime import datetime

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin():
    client = AsyncIOMotorClient("mongodb://localhost:27017/projectsdb")
    db = client.projectsdb
    
    # Check if admin already exists
    existing_admin = await db.users.find_one({"username": "admin"})
    if existing_admin:
        print("Admin user already exists!")
        return
    
    # Create admin user
    admin_id = str(uuid.uuid4())
    admin = {
        "id": admin_id,
        "username": "admin",
        "email": "admin@example.com",
        "password_hash": pwd_context.hash("admin123"),
        "role": "admin",
        "created_at": datetime.utcnow().isoformat(),
    }
    
    await db.users.insert_one(admin)
    print("Admin user created successfully!")
    print("Username: admin")
    print("Password: admin123")
    print("Email: admin@example.com")

if __name__ == "__main__":
    asyncio.run(create_admin())

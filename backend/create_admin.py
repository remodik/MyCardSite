import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import uuid
from datetime import datetime

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def create_admin():
    client = AsyncIOMotorClient("mongodb://localhost:27017/projectsdb")
    db = client.projectsdb

    existing_admin = await db.users.find_one({"username": "remod3"})
    if existing_admin:
        print("Admin user already exists!")
        return

    admin_id = str(uuid.uuid4())
    admin = {
        "id": admin_id,
        "username": "remod3",
        "email": "slenderzet@gmail.com",
        "password_hash": pwd_context.hash("domer123"),
        "role": "admin",
        "created_at": datetime.now().isoformat(),
    }
    
    await db.users.insert_one(admin)
    print("Admin user created successfully!")
    print("Username: remod3")
    print("Password: domer123")
    print("Email: slenderzet@gmail.com")


if __name__ == "__main__":
    asyncio.run(create_admin())

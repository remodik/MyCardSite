import asyncio
import uuid
from datetime import datetime
from passlib.context import CryptContext
from sqlalchemy import select

from database import User, async_session_factory, init_models

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def create_test_user() -> None:
    await init_models()
    async with async_session_factory() as session:
        result = await session.execute(select(User).where(User.username == "testuser"))
        existing_user = result.scalar_one_or_none()
        if existing_user:
            print("Test user already exists!")
            return

        user_id = str(uuid.uuid4())
        user = User(
            id=user_id,
            username="testuser",
            email="testuser@example.com",
            password_hash=pwd_context.hash("test123"),
            role="user",
            created_at=datetime.now(),
        )
        session.add(user)
        await session.commit()

        print("Test user created successfully!")
        print("Username: testuser")
        print("Password: test123")
        print("Email: testuser@example.com")


if __name__ == "__main__":
    asyncio.run(create_test_user())

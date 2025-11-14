import asyncio
import uuid
from datetime import datetime
from passlib.context import CryptContext
from sqlalchemy import select

from database import User, async_session_factory, init_models

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def create_admin() -> None:
    await init_models()
    async with async_session_factory() as session:
        result = await session.execute(select(User).where(User.username == "remod3"))
        existing_admin = result.scalar_one_or_none()
        if existing_admin:
            print("Admin user already exists!")
            return

        admin_id = str(uuid.uuid4())
        admin = User(
            id=admin_id,
            username="remodik",
            email="slenderzet@gmail.com",
            password_hash=pwd_context.hash("domer123"),
            role="admin",
            created_at=datetime.now(),
        )
        session.add(admin)
        await session.commit()

        print("Admin user created successfully!")
        print("Username: remod3")
        print("Password: domer123")
        print("Email: slenderzet@gmail.com")


if __name__ == "__main__":
    asyncio.run(create_admin())

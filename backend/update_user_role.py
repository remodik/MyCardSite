import asyncio
from sqlalchemy import select, update
from database import async_session_factory, User


async def update_role():
    async with async_session_factory() as session:
        stmt = update(User).where(User.username == "remod3").values(role="admin")
        await session.execute(stmt)
        await session.commit()

        result = await session.execute(select(User).where(User.username == "remod3"))
        user = result.scalar_one()
        print(f"✅ Роль пользователя {user.username} обновлена на: {user.role}")


if __name__ == "__main__":
    asyncio.run(update_role())

import asyncio
import uuid
from datetime import datetime
from database import Service, async_session_factory, init_models


async def create_demo_services() -> None:
    await init_models()
    
    services_data = [
        {
            "name": "Разработка веб-приложения",
            "description": "Полноценная разработка веб-приложения с использованием современных технологий. Включает дизайн, frontend, backend, базу данных и деплой.",
            "price": "от 50 000 руб.",
            "estimated_time": "2-4 недели",
            "payment_methods": "Банковская карта, PayPal, Криптовалюта",
            "frameworks": "React, FastAPI, PostgreSQL, Docker",
        },
        {
            "name": "Discord бот на заказ",
            "description": "Создание Discord бота с любым функционалом под ваши требования. Модерация, развлечения, интеграции с API, базы данных и многое другое.",
            "price": "от 15 000 руб.",
            "estimated_time": "1-2 недели",
            "payment_methods": "Банковская карта, PayPal",
            "frameworks": "Python, Py-cord, disnake, SQLite, PostgreSQL",
        },
        {
            "name": "Landing Page / Визитка",
            "description": "Современный одностраничный сайт для вашего бизнеса или личного портфолио. Адаптивный дизайн, SEO-оптимизация, быстрая загрузка.",
            "price": "от 10 000 руб.",
            "estimated_time": "3-7 дней",
            "payment_methods": "Банковская карта, ЮMoney, PayPal",
            "frameworks": "React, Next.js, TailwindCSS",
        },
        {
            "name": "Консультация и помощь",
            "description": "Помощь в решении проблем с вашим проектом, код-ревью, консультации по архитектуре, выбору технологий и оптимизации.",
            "price": "1 500 руб./час",
            "estimated_time": "по договоренности",
            "payment_methods": "Банковская карта, PayPal",
            "frameworks": "Python, JavaScript, FastAPI, React, Discord.py",
        },
    ]
    
    async with async_session_factory() as session:
        for service_data in services_data:
            service_id = str(uuid.uuid4())
            service = Service(
                id=service_id,
                name=service_data["name"],
                description=service_data["description"],
                price=service_data["price"],
                estimated_time=service_data["estimated_time"],
                payment_methods=service_data["payment_methods"],
                frameworks=service_data["frameworks"],
                created_at=datetime.now(),
                updated_at=datetime.now(),
            )
            session.add(service)
        
        await session.commit()
        print(f"✅ Successfully created {len(services_data)} demo services!")


if __name__ == "__main__":
    asyncio.run(create_demo_services())

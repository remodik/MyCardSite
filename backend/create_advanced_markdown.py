import asyncio
import requests

API_URL = "http://0.0.0.0:8001"

ADVANCED_MARKDOWN = """# Расширенная поддержка Markdown

Этот документ демонстрирует все возможности GitHub Flavored Markdown.

## Базовое форматирование

**Жирный текст**, *курсив*, ***жирный курсив***

~~Зачеркнутый текст~~

## Списки

### Обычный список
- Элемент 1
- Элемент 2
  - Подэлемент 2.1
  - Подэлемент 2.2
- Элемент 3

### Нумерованный список
1. Первый
2. Второй
3. Третий

### Task Lists (чекбоксы)
- [x] Завершенная задача
- [x] Еще одна завершенная
- [ ] Незавершенная задача
- [ ] Другая незавершенная

## Таблицы

| Заголовок 1 | Заголовок 2 | Заголовок 3 |
|-------------|-------------|-------------|
| Строка 1    | Данные      | Значение    |
| Строка 2    | Еще данные  | Еще значение|
| Строка 3    | Больше      | Информация  |

### Таблица с выравниванием

| Влево | По центру | Вправо |
|:------|:---------:|-------:|
| Текст | Текст     | Текст  |
| А     | Б         | В      |

## Код

Инлайн код: `const x = 42;`

### Блок кода с подсветкой

```python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# Вызов функции
result = fibonacci(10)
print(f"Fibonacci(10) = {result}")
```

```javascript
// JavaScript пример
const greeting = (name) => {
    return `Привет, ${name}!`;
};

console.log(greeting('мир'));
```

## Цитаты

> Это обычная цитата.
> Она может быть многострочной.

> ### Цитата с заголовком
> - И списком
> - Внутри

## Ссылки

[Обычная ссылка](https://example.com)

[Ссылка с заголовком](https://example.com "Это заголовок")

Автоматическая ссылка: https://github.com

## Математические формулы

Инлайн формула: $E = mc^2$

Блочная формула:

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

Квадратное уравнение:

$$
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$

## Emoji поддержка :rocket:

:smile: :heart: :thumbsup: :star: :fire: :sparkles:

:+1: :tada: :clap: :rocket: :100:

## HTML в Markdown

<div style="background: linear-gradient(to right, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; color: white;">
  <h3>HTML блок</h3>
  <p>Markdown поддерживает <strong>HTML</strong> внутри!</p>
</div>

## Горизонтальная линия

---

## Клавиши

Нажмите <kbd>Ctrl</kbd> + <kbd>C</kbd> для копирования.

<kbd>⌘</kbd> + <kbd>V</kbd> для вставки на Mac.

## Footnotes (сноски)

Вот текст со сноской[^1].

Еще одна сноска[^note].

[^1]: Это первая сноска.
[^note]: Это именованная сноска с подробным описанием.

## Изображения

![Placeholder Image](https://via.placeholder.com/400x200/667eea/ffffff?text=Markdown+Image)

## Выделение (подсветка)

==Этот текст выделен желтым==

## Details/Summary (раскрывающиеся блоки)

<details>
<summary>Нажмите, чтобы развернуть</summary>

Это скрытый контент!

- Элемент списка
- Еще элемент

```python
print("Код тоже может быть здесь!")
```

</details>

## Комбинированный пример

> **Важно!** :warning:
> 
> Формула для вычисления: $f(x) = x^2 + 2x + 1$
> 
> Код:
> ```python
> def square(x):
>     return x ** 2
> ```
> 
> - [x] Проверено
> - [ ] Требует внимания

---

**Конец демонстрации!** :tada: :rocket:
"""


async def create_advanced_markdown():
    # Login
    response = requests.post(f"{API_URL}/api/auth/login", json={
        "username": "remod3",
        "password": "domer123"
    })
    
    if response.status_code != 200:
        print("Login failed!")
        return
    
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get first project
    projects_response = requests.get(f"{API_URL}/api/projects", headers=headers)
    projects = projects_response.json()
    
    if not projects:
        print("No projects found!")
        return
    
    project_id = projects[0]["id"]
    print(f"Using project: {project_id}")
    
    # Create advanced markdown file
    file_response = requests.post(
        f"{API_URL}/api/files",
        headers=headers,
        json={
            "project_id": project_id,
            "name": "ADVANCED_MARKDOWN.md",
            "content": ADVANCED_MARKDOWN,
            "file_type": "md"
        }
    )
    
    if file_response.status_code == 200:
        print("✅ Advanced Markdown file created successfully!")
    else:
        print(f"❌ Failed to create file: {file_response.text}")


if __name__ == "__main__":
    asyncio.run(create_advanced_markdown())

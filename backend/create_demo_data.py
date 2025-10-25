import asyncio
import requests
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
from datetime import datetime

API_URL = "https://6489053f-0853-43a0-8d83-b6d933d76bd9.preview.emergentagent.com"

async def create_demo_data():
    # Login as admin
    response = requests.post(f"{API_URL}/api/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create a project
    project_response = requests.post(
        f"{API_URL}/api/projects",
        headers=headers,
        json={
            "name": "Demo Project",
            "description": "A demonstration project with various file types"
        }
    )
    project_id = project_response.json()["id"]
    print(f"Created project: {project_id}")
    
    # Create README.md file
    readme_content = """# Demo Project

Welcome to the demo project! This showcases file management and markdown rendering.

## Features

- **File Upload**: Upload various file types
- **Markdown Support**: Full markdown rendering with syntax highlighting
- **Code Files**: View code with syntax highlighting

## Code Example

Here's a Python example:

```python
def hello_world():
    print("Hello, World!")
    return True
```

## Lists

- Item 1
- Item 2
- Item 3

1. First
2. Second
3. Third
"""
    
    requests.post(
        f"{API_URL}/api/files",
        headers=headers,
        json={
            "project_id": project_id,
            "name": "README.md",
            "content": readme_content,
            "file_type": "md"
        }
    )
    print("Created README.md")
    
    # Create a Python file
    python_content = """def fibonacci(n):
    \"\"\"Generate Fibonacci sequence up to n numbers\"\"\"
    fib = [0, 1]
    while len(fib) < n:
        fib.append(fib[-1] + fib[-2])
    return fib

def main():
    print("Fibonacci sequence:")
    numbers = fibonacci(10)
    for i, num in enumerate(numbers):
        print(f"F({i}) = {num}")

if __name__ == "__main__":
    main()
"""
    
    requests.post(
        f"{API_URL}/api/files",
        headers=headers,
        json={
            "project_id": project_id,
            "name": "fibonacci.py",
            "content": python_content,
            "file_type": "py"
        }
    )
    print("Created fibonacci.py")
    
    # Create a JavaScript file
    js_content = """// React component example
import React, { useState } from 'react';

const Counter = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="counter">
      <h2>Count: {count}</h2>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
      <button onClick={() => setCount(count - 1)}>
        Decrement
      </button>
    </div>
  );
};

export default Counter;
"""
    
    requests.post(
        f"{API_URL}/api/files",
        headers=headers,
        json={
            "project_id": project_id,
            "name": "Counter.jsx",
            "content": js_content,
            "file_type": "jsx"
        }
    )
    print("Created Counter.jsx")
    
    # Create package.json
    package_json = """{
  "name": "demo-project",
  "version": "1.0.0",
  "description": "Demo project",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "test": "jest"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "jest": "^29.0.0"
  }
}
"""
    
    requests.post(
        f"{API_URL}/api/files",
        headers=headers,
        json={
            "project_id": project_id,
            "name": "package.json",
            "content": package_json,
            "file_type": "json"
        }
    )
    print("Created package.json")
    
    # Create .gitignore
    gitignore_content = """node_modules/
.env
.DS_Store
*.log
dist/
build/
.cache/
"""
    
    requests.post(
        f"{API_URL}/api/files",
        headers=headers,
        json={
            "project_id": project_id,
            "name": ".gitignore",
            "content": gitignore_content,
            "file_type": "gitignore"
        }
    )
    print("Created .gitignore")
    
    print("\n✅ Demo data created successfully!")
    print(f"Project ID: {project_id}")

if __name__ == "__main__":
    asyncio.run(create_demo_data())

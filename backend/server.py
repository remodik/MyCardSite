from fastapi import FastAPI, HTTPException, Depends, status, WebSocket, WebSocketDisconnect, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
from dotenv import load_dotenv
import uuid
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import random
import string
import base64

load_dotenv()

app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/projectsdb")
client = AsyncIOMotorClient(MONGO_URL)
db = client.projectsdb

# Security
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# SendGrid
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
FROM_EMAIL = os.getenv("FROM_EMAIL")

# WebSocket connections manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[Dict[str, Any]] = []

    async def connect(self, websocket: WebSocket, user_id: str, username: str):
        await websocket.accept()
        self.active_connections.append({
            "websocket": websocket,
            "user_id": user_id,
            "username": username
        })

    def disconnect(self, websocket: WebSocket):
        self.active_connections = [
            conn for conn in self.active_connections 
            if conn["websocket"] != websocket
        ]

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection["websocket"].send_json(message)
            except:
                pass

manager = ConnectionManager()

# Pydantic Models
class UserCreate(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class PasswordResetRequest(BaseModel):
    username_or_email: str

class PasswordReset(BaseModel):
    username_or_email: str
    reset_code: str
    new_password: str

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class FileCreate(BaseModel):
    project_id: str
    name: str
    content: str
    file_type: str

class FileUpdate(BaseModel):
    name: Optional[str] = None
    content: Optional[str] = None

class ChatMessage(BaseModel):
    message: str

# Helper Functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise credentials_exception
    return user

async def get_current_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

def generate_reset_code():
    return ''.join(random.choices(string.digits, k=6))

async def send_reset_email(email: str, code: str):
    try:
        message = Mail(
            from_email=FROM_EMAIL,
            to_emails=email,
            subject='Password Reset Code',
            html_content=f'<strong>Your password reset code is: {code}</strong><br>This code will expire in 15 minutes.'
        )
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

# Auth Endpoints
@app.post("/api/auth/register", response_model=Token)
async def register(user: UserCreate):
    # Check if username exists
    existing_user = await db.users.find_one({"username": user.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Check if email exists (if provided)
    if user.email:
        existing_email = await db.users.find_one({"email": user.email})
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_id = str(uuid.uuid4())
    user_dict = {
        "id": user_id,
        "username": user.username,
        "email": user.email,
        "password_hash": get_password_hash(user.password),
        "role": "user",
        "created_at": datetime.utcnow().isoformat(),
    }
    
    await db.users.insert_one(user_dict)
    
    # Create token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_id}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "username": user.username,
            "email": user.email,
            "role": "user"
        }
    }

@app.post("/api/auth/login", response_model=Token)
async def login(user: UserLogin):
    # Find user by username
    db_user = await db.users.find_one({"username": user.username})
    if not db_user or not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user["id"]}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": db_user["id"],
            "username": db_user["username"],
            "email": db_user.get("email"),
            "role": db_user["role"]
        }
    }

@app.get("/api/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "username": current_user["username"],
        "email": current_user.get("email"),
        "role": current_user["role"]
    }

@app.post("/api/auth/password-reset-request")
async def request_password_reset(request: PasswordResetRequest):
    # Find user by username or email
    user = await db.users.find_one({
        "$or": [
            {"username": request.username_or_email},
            {"email": request.username_or_email}
        ]
    })
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # If user has email, send reset code
    if user.get("email"):
        reset_code = generate_reset_code()
        reset_id = str(uuid.uuid4())
        
        # Store reset request
        await db.password_resets.insert_one({
            "id": reset_id,
            "user_id": user["id"],
            "code": reset_code,
            "created_at": datetime.utcnow().isoformat(),
            "expires_at": (datetime.utcnow() + timedelta(minutes=15)).isoformat(),
            "used": False
        })
        
        # Send email
        email_sent = await send_reset_email(user["email"], reset_code)
        
        return {
            "message": "Reset code sent to your email",
            "has_email": True,
            "email_sent": email_sent
        }
    else:
        # Create admin reset request
        reset_id = str(uuid.uuid4())
        await db.admin_reset_requests.insert_one({
            "id": reset_id,
            "user_id": user["id"],
            "username": user["username"],
            "status": "pending",
            "requested_at": datetime.utcnow().isoformat()
        })
        
        return {
            "message": "Reset request sent to administrator",
            "has_email": False
        }

@app.post("/api/auth/password-reset")
async def reset_password(reset: PasswordReset):
    # Find user
    user = await db.users.find_one({
        "$or": [
            {"username": reset.username_or_email},
            {"email": reset.username_or_email}
        ]
    })
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Find valid reset code
    reset_request = await db.password_resets.find_one({
        "user_id": user["id"],
        "code": reset.reset_code,
        "used": False
    })
    
    if not reset_request:
        raise HTTPException(status_code=400, detail="Invalid reset code")
    
    # Check expiration
    expires_at = datetime.fromisoformat(reset_request["expires_at"])
    if datetime.utcnow() > expires_at:
        raise HTTPException(status_code=400, detail="Reset code expired")
    
    # Update password
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"password_hash": get_password_hash(reset.new_password)}}
    )
    
    # Mark reset as used
    await db.password_resets.update_one(
        {"id": reset_request["id"]},
        {"$set": {"used": True}}
    )
    
    return {"message": "Password reset successful"}

# Projects Endpoints
@app.get("/api/projects")
async def get_projects(current_user: dict = Depends(get_current_user)):
    projects = []
    async for project in db.projects.find():
        project.pop("_id", None)
        projects.append(project)
    return projects

@app.get("/api/projects/{project_id}")
async def get_project(project_id: str, current_user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.pop("_id", None)
    
    # Get files for this project
    files = []
    async for file in db.files.find({"project_id": project_id}):
        file.pop("_id", None)
        files.append(file)
    
    project["files"] = files
    return project

@app.post("/api/projects")
async def create_project(project: ProjectCreate, current_user: dict = Depends(get_current_admin)):
    project_id = str(uuid.uuid4())
    project_dict = {
        "id": project_id,
        "name": project.name,
        "description": project.description,
        "created_by": current_user["id"],
        "created_at": datetime.utcnow().isoformat(),
    }
    
    await db.projects.insert_one(project_dict)
    project_dict.pop("_id", None)
    return project_dict

@app.put("/api/projects/{project_id}")
async def update_project(project_id: str, project: ProjectUpdate, current_user: dict = Depends(get_current_admin)):
    update_data = {k: v for k, v in project.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.projects.update_one(
        {"id": project_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    
    updated_project = await db.projects.find_one({"id": project_id})
    updated_project.pop("_id", None)
    return updated_project

@app.delete("/api/projects/{project_id}")
async def delete_project(project_id: str, current_user: dict = Depends(get_current_admin)):
    # Delete project
    result = await db.projects.delete_one({"id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Delete all files in project
    await db.files.delete_many({"project_id": project_id})
    
    return {"message": "Project deleted"}

# Files Endpoints
@app.post("/api/files")
async def create_file(file: FileCreate, current_user: dict = Depends(get_current_admin)):
    file_id = str(uuid.uuid4())
    file_dict = {
        "id": file_id,
        "project_id": file.project_id,
        "name": file.name,
        "content": file.content,
        "file_type": file.file_type,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }
    
    await db.files.insert_one(file_dict)
    file_dict.pop("_id", None)
    return file_dict

@app.post("/api/files/upload")
async def upload_file(
    project_id: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_admin)
):
    # Read file content
    content = await file.read()
    
    # Determine file type and encoding
    file_type = file.filename.split('.')[-1] if '.' in file.filename else 'txt'
    
    # For binary files (images, videos), encode as base64
    if file_type in ['png', 'jpg', 'jpeg', 'gif', 'webp', 'mp4', 'avi', 'mov', 'webm']:
        content_str = base64.b64encode(content).decode('utf-8')
        is_binary = True
    else:
        try:
            content_str = content.decode('utf-8')
            is_binary = False
        except:
            content_str = base64.b64encode(content).decode('utf-8')
            is_binary = True
    
    file_id = str(uuid.uuid4())
    file_dict = {
        "id": file_id,
        "project_id": project_id,
        "name": file.filename,
        "content": content_str,
        "file_type": file_type,
        "is_binary": is_binary,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }
    
    await db.files.insert_one(file_dict)
    file_dict.pop("_id", None)
    return file_dict

@app.get("/api/files/{file_id}")
async def get_file(file_id: str, current_user: dict = Depends(get_current_user)):
    file = await db.files.find_one({"id": file_id})
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    file.pop("_id", None)
    return file

@app.put("/api/files/{file_id}")
async def update_file(file_id: str, file: FileUpdate, current_user: dict = Depends(get_current_admin)):
    update_data = {k: v for k, v in file.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_data["updated_at"] = datetime.utcnow().isoformat()
    
    result = await db.files.update_one(
        {"id": file_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="File not found")
    
    updated_file = await db.files.find_one({"id": file_id})
    updated_file.pop("_id", None)
    return updated_file

@app.delete("/api/files/{file_id}")
async def delete_file(file_id: str, current_user: dict = Depends(get_current_admin)):
    result = await db.files.delete_one({"id": file_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="File not found")
    return {"message": "File deleted"}

# Admin Endpoints
@app.get("/api/admin/users")
async def get_users(current_user: dict = Depends(get_current_admin)):
    users = []
    async for user in db.users.find():
        user.pop("_id", None)
        user.pop("password_hash", None)
        users.append(user)
    return users

@app.get("/api/admin/reset-requests")
async def get_reset_requests(current_user: dict = Depends(get_current_admin)):
    requests = []
    async for request in db.admin_reset_requests.find({"status": "pending"}):
        request.pop("_id", None)
        requests.append(request)
    return requests

@app.post("/api/admin/reset-password/{user_id}")
async def admin_reset_password(user_id: str, current_user: dict = Depends(get_current_admin)):
    # Reset password to qwerty123
    new_password = "qwerty123"
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"password_hash": get_password_hash(new_password)}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Mark all pending reset requests as completed
    await db.admin_reset_requests.update_many(
        {"user_id": user_id, "status": "pending"},
        {"$set": {"status": "completed", "completed_at": datetime.utcnow().isoformat()}}
    )
    
    return {"message": f"Password reset to {new_password}"}

@app.put("/api/admin/users/{user_id}/role")
async def update_user_role(user_id: str, role: str, current_user: dict = Depends(get_current_admin)):
    if role not in ["user", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"role": role}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "Role updated"}

# Chat WebSocket
@app.websocket("/api/ws/chat")
async def websocket_chat(websocket: WebSocket, token: str):
    try:
        # Verify token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        user = await db.users.find_one({"id": user_id})
        
        if not user:
            await websocket.close(code=1008)
            return
        
        await manager.connect(websocket, user_id, user["username"])
        
        # Send recent messages
        messages = []
        async for msg in db.chat_messages.find().sort("timestamp", -1).limit(50):
            msg.pop("_id", None)
            messages.append(msg)
        
        messages.reverse()
        await websocket.send_json({"type": "history", "messages": messages})
        
        # Notify others
        await manager.broadcast({
            "type": "user_joined",
            "username": user["username"]
        })
        
        while True:
            data = await websocket.receive_json()
            message_id = str(uuid.uuid4())
            message = {
                "id": message_id,
                "user_id": user_id,
                "username": user["username"],
                "message": data["message"],
                "timestamp": datetime.utcnow().isoformat()
            }
            
            # Save to database
            await db.chat_messages.insert_one(message.copy())
            message.pop("_id", None)
            
            # Broadcast to all
            await manager.broadcast({
                "type": "message",
                "data": message
            })
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast({
            "type": "user_left",
            "username": user["username"]
        })
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)

# Health check
@app.get("/api/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

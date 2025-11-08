import asyncio
import base64
import os
import random
import smtplib
import string
import uuid
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional, List, Dict, Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, status, WebSocket, WebSocketDisconnect, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from jose import JWTError, jwt
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from pymongo.errors import PyMongoError, ServerSelectionTimeoutError

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/projectsdb")
client = AsyncIOMotorClient(MONGO_URL)
db = client.projectsdb

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

FROM_EMAIL = os.getenv("FROM_EMAIL")
SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")


def _env_flag(name: str, default: str = "false") -> bool:
    return os.getenv(name, default).strip().lower() in {"1", "true", "yes", "on"}


SMTP_USE_TLS = _env_flag("SMTP_USE_TLS", "true")
SMTP_USE_SSL = _env_flag("SMTP_USE_SSL", "false")
SMTP_VALIDATE_CERTS = _env_flag("SMTP_VALIDATE_CERTS", "true")
SMTP_SUPPRESS_SEND = _env_flag("SMTP_SUPPRESS_SEND", "false")
SMTP_TIMEOUT = int(os.getenv("SMTP_TIMEOUT", "30"))
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME")


FASTMAIL_CONFIG: Optional[ConnectionConfig] = None
FASTMAIL_CLIENT: Optional[FastMail] = None

if SMTP_HOST:
    mail_from = FROM_EMAIL or SMTP_USER
    if mail_from:
        FASTMAIL_CONFIG = ConnectionConfig(
            MAIL_USERNAME=SMTP_USER,
            MAIL_PASSWORD=SMTP_PASSWORD,
            MAIL_FROM=mail_from,
            MAIL_FROM_NAME=SMTP_FROM_NAME,
            MAIL_PORT=SMTP_PORT,
            MAIL_SERVER=SMTP_HOST,
            MAIL_STARTTLS=SMTP_USE_TLS and not SMTP_USE_SSL,
            MAIL_SSL_TLS=SMTP_USE_SSL,
            USE_CREDENTIALS=bool(SMTP_USER and SMTP_PASSWORD),
            VALIDATE_CERTS=SMTP_VALIDATE_CERTS,
            SUPPRESS_SEND=SMTP_SUPPRESS_SEND,
        )
        FASTMAIL_CLIENT = FastMail(FASTMAIL_CONFIG)


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


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now() + expires_delta
    else:
        expire = datetime.now() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def ensure_db_connection():
    try:
        await db.command("ping")
    except ServerSelectionTimeoutError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection failed. Ensure MongoDB is running or update MONGO_URL.",
        ) from exc
    except PyMongoError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected database error occurred.",
        ) from exc


async def get_current_user(token: str = Depends(oauth2_scheme)):
    await ensure_db_connection()
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


def _compose_reset_email(code: str) -> Dict[str, str]:
    subject = "Password Reset Code"
    text_content = (
        f"Your password reset code is: {code}\n"
        "This code will expire in 15 minutes."
    )
    html_content = (
        "<p><strong>Your password reset code is:</strong> "
        f"<code>{code}</code></p>"
        "<p>This code will expire in 15 minutes.</p>"
    )
    return {
        "subject": subject,
        "text": text_content,
        "html": html_content,
    }


def _send_reset_email(email: str, message_data: Dict[str, str]) -> bool:
    if not SMTP_HOST:
        print("SMTP host is not configured; skipping email send.")
        return False

    sender = FROM_EMAIL or SMTP_USER
    if not sender:
        print("No sender email configured; set FROM_EMAIL or SMTP_USER.")
        return False

    if SMTP_USE_TLS and SMTP_USE_SSL:
        print("Both SMTP_USE_TLS and SMTP_USE_SSL are enabled; defaulting to TLS only.")

    mime_message = MIMEMultipart("alternative")
    mime_message["Subject"] = message_data["subject"]
    mime_message["From"] = sender
    mime_message["To"] = email

    mime_message.attach(MIMEText(message_data["text"], "plain"))
    mime_message.attach(MIMEText(message_data["html"], "html"))

    smtp_class = smtplib.SMTP_SSL if (SMTP_USE_SSL and not SMTP_USE_TLS) else smtplib.SMTP

    try:
        with smtp_class(SMTP_HOST, SMTP_PORT, timeout=SMTP_TIMEOUT) as server:
            server.ehlo()
            if SMTP_USE_TLS and smtp_class is smtplib.SMTP:
                server.starttls()
                server.ehlo()
            if SMTP_USER and SMTP_PASSWORD:
                server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(sender, [email], mime_message.as_string())
        return True
    except Exception as exc:
        print(f"Error sending email: {exc}")
        return False


async def send_reset_email(email: str, code: str) -> bool:
    message_data = _compose_reset_email(code)

    if FASTMAIL_CLIENT:
        message = MessageSchema(
            subject=message_data["subject"],
            recipients=[email],
            body=message_data["html"],
            subtype=MessageType.html,
        )
        try:
            await FASTMAIL_CLIENT.send_message(message)
            return True
        except Exception as exc:
            print(f"FastMail send failed, falling back to SMTP: {exc}")
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, _send_reset_email, email, message_data)


@app.post("/api/auth/register", response_model=Token)
async def register(user: UserCreate):
    await ensure_db_connection()
    existing_user = await db.users.find_one({"username": user.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    if user.email:
        existing_email = await db.users.find_one({"email": user.email})
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already registered")

    user_id = str(uuid.uuid4())
    user_dict = {
        "id": user_id,
        "username": user.username,
        "email": user.email,
        "password_hash": get_password_hash(user.password),
        "role": "user",
        "created_at": datetime.now().isoformat(),
    }
    
    await db.users.insert_one(user_dict)

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
    await ensure_db_connection()
    db_user = await db.users.find_one({"username": user.username})
    if not db_user or not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

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
    await ensure_db_connection()
    user = await db.users.find_one({
        "$or": [
            {"username": request.username_or_email},
            {"email": request.username_or_email}
        ]
    })
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.get("email"):
        reset_code = generate_reset_code()
        reset_id = str(uuid.uuid4())
        
        # Store reset request
        await db.password_resets.insert_one({
            "id": reset_id,
            "user_id": user["id"],
            "code": reset_code,
            "created_at": datetime.now().isoformat(),
            "expires_at": (datetime.now() + timedelta(minutes=15)).isoformat(),
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
            "requested_at": datetime.now().isoformat()
        })
        
        return {
            "message": "Reset request sent to administrator",
            "has_email": False
        }

@app.post("/api/auth/password-reset")
async def reset_password(reset: PasswordReset):
    await ensure_db_connection()
    user = await db.users.find_one({
        "$or": [
            {"username": reset.username_or_email},
            {"email": reset.username_or_email}
        ]
    })
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    reset_request = await db.password_resets.find_one({
        "user_id": user["id"],
        "code": reset.reset_code,
        "used": False
    })
    
    if not reset_request:
        raise HTTPException(status_code=400, detail="Invalid reset code")
    
    # Check expiration
    expires_at = datetime.fromisoformat(reset_request["expires_at"])
    if datetime.now() > expires_at:
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
        "created_at": datetime.now().isoformat(),
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
    result = await db.projects.delete_one({"id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")

    await db.files.delete_many({"project_id": project_id})
    
    return {"message": "Project deleted"}


@app.post("/api/files")
async def create_file(file: FileCreate, current_user: dict = Depends(get_current_admin)):
    file_id = str(uuid.uuid4())
    file_dict = {
        "id": file_id,
        "project_id": file.project_id,
        "name": file.name,
        "content": file.content,
        "file_type": file.file_type,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
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
    content = await file.read()

    file_type = file.filename.split('.')[-1] if '.' in file.filename else 'txt'

    if file_type in ['png', 'jpg', 'jpeg', 'gif', 'webp', 'mp4', 'avi', 'mov', 'webm', 'ico']:
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
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
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
    
    update_data["updated_at"] = datetime.now().isoformat()
    
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
    new_password = "qwerty123"
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"password_hash": get_password_hash(new_password)}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    await db.admin_reset_requests.update_many(
        {"user_id": user_id, "status": "pending"},
        {"$set": {"status": "completed", "completed_at": datetime.now().isoformat()}}
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


@app.websocket("/api/ws/chat")
async def websocket_chat(websocket: WebSocket, token: str):
    await websocket.accept()
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        user = await db.users.find_one({"id": user_id})
        
        if not user:
            await websocket.close(code=1008)
            return
        
        await manager.connect(websocket, user_id, user["username"])

        messages = []
        async for msg in db.chat_messages.find().sort("timestamp", -1).limit(50):
            msg.pop("_id", None)
            messages.append(msg)
        
        messages.reverse()
        await websocket.send_json({"type": "history", "messages": messages})

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
                "timestamp": datetime.now().isoformat()
            }

            await db.chat_messages.insert_one(message.copy())
            message.pop("_id", None)

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


@app.get("/api/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

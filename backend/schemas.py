from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# Authentication schemas
class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    email: str

# Customer schemas
class CustomerCreate(BaseModel):
    name: str
    email: EmailStr
    timezone: str

class CustomerResponse(BaseModel):
    id: int
    name: str
    email: str
    timezone: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Source configuration schemas
class SourceConfigCreate(BaseModel):
    db_host: str
    db_port: int
    db_username: str
    db_password: str
    db_name: str

class SourceConfigResponse(BaseModel):
    id: int
    customer_id: int
    db_host: str
    db_port: int
    db_username: str
    db_password: str
    db_name: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Pipeline schemas
class PipelineUpdate(BaseModel):
    is_running: bool

class PipelineResponse(BaseModel):
    id: int
    customer_id: int
    is_running: bool
    last_updated: datetime
    created_at: datetime

    class Config:
        from_attributes = True

# User schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str

class UserResponse(BaseModel):
    id: int
    email: str
    role: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# System health schemas
class SystemHealthResponse(BaseModel):
    customer_id: int
    customer_name: str
    status: str  # healthy, warning, error
    last_sync_time: datetime
    last_error_message: Optional[str]
    pipeline_running: bool 
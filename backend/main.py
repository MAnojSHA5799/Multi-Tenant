from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import jwt
from typing import List, Optional
import os
from dotenv import load_dotenv
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

from models import get_db, Customer, SourceConfig, Pipeline, User, create_tables
from schemas import (
    CustomerCreate, CustomerResponse, SourceConfigCreate, SourceConfigResponse,
    PipelineUpdate, PipelineResponse, UserCreate, UserResponse, LoginRequest,
    LoginResponse, SystemHealthResponse
)

load_dotenv()

app = FastAPI(title="Multi-Tenant Admin Portal", version="1.0.0")

# CORS middleware


# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
# ACCESS_TOKEN_EXPIRE_MINUTES = 30
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 60 minutes × 24 hours = 1440 minutes

security = HTTPBearer()

# Create tables on startup
@app.on_event("startup")
async def startup_event():
    create_tables()

# Authentication functions
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Mock users for demo
MOCK_USERS = {
    "admin@example.com": {
        "password": "admin123",
        "role": "admin",
        "id": 1
    },
    "viewer@example.com": {
        "password": "viewer123", 
        "role": "viewer",
        "id": 2
    }
}

# Authentication endpoints
@app.post("/auth/login", response_model=LoginResponse)
async def login(login_data: LoginRequest):
    user = MOCK_USERS.get(login_data.email)
    if not user or user["password"] != login_data.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(
        data={"sub": login_data.email, "role": user["role"], "user_id": user["id"]}
    )
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        role=user["role"],
        email=login_data.email
    )

# Customer management endpoints
@app.post("/customers", response_model=CustomerResponse)
async def create_customer(
    customer: CustomerCreate,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    if token.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    db_customer = Customer(**customer.dict())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return CustomerResponse.from_orm(db_customer)

@app.get("/customers", response_model=List[CustomerResponse])
async def get_customers(
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    customers = db.query(Customer).all()
    return [CustomerResponse.from_orm(customer) for customer in customers]

@app.get("/customers/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return CustomerResponse.from_orm(customer)

@app.put("/customers/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: int,
    customer_update: CustomerCreate,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    if token.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    for key, value in customer_update.dict().items():
        setattr(customer, key, value)
    
    db.commit()
    db.refresh(customer)
    return CustomerResponse.from_orm(customer)

@app.delete("/customers/{customer_id}")
async def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    if token.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    db.delete(customer)
    db.commit()
    return {"message": "Customer deleted successfully"}

# Source configuration endpoints
@app.post("/customers/{customer_id}/source-config", response_model=SourceConfigResponse)
async def create_source_config(
    customer_id: int,
    config: SourceConfigCreate,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    if token.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check if customer exists
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Check if config already exists for this customer
    existing_config = db.query(SourceConfig).filter(SourceConfig.customer_id == customer_id).first()
    if existing_config:
        # Update existing config
        for key, value in config.dict().items():
            setattr(existing_config, key, value)
        db.commit()
        db.refresh(existing_config)
        return SourceConfigResponse.from_orm(existing_config)
    
    # Create new config
    db_config = SourceConfig(**config.dict(), customer_id=customer_id)
    db.add(db_config)
    db.commit()
    db.refresh(db_config)
    return SourceConfigResponse.from_orm(db_config)

@app.get("/customers/{customer_id}/source-config", response_model=SourceConfigResponse)
async def get_source_config(
    customer_id: int,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    config = db.query(SourceConfig).filter(SourceConfig.customer_id == customer_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Source config not found")
    return SourceConfigResponse.from_orm(config)

# Pipeline management endpoints
@app.post("/customers/{customer_id}/pipeline", response_model=PipelineResponse)
async def create_pipeline(
    customer_id: int,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    if token.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check if customer exists
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Check if pipeline already exists
    existing_pipeline = db.query(Pipeline).filter(Pipeline.customer_id == customer_id).first()
    if existing_pipeline:
        return PipelineResponse.from_orm(existing_pipeline)
    
    # Create new pipeline
    db_pipeline = Pipeline(customer_id=customer_id, is_running=False)
    db.add(db_pipeline)
    db.commit()
    db.refresh(db_pipeline)
    return PipelineResponse.from_orm(db_pipeline)

@app.put("/customers/{customer_id}/pipeline", response_model=PipelineResponse)
async def update_pipeline(
    customer_id: int,
    pipeline_update: PipelineUpdate,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    if token.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    pipeline = db.query(Pipeline).filter(Pipeline.customer_id == customer_id).first()
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    
    pipeline.is_running = pipeline_update.is_running
    pipeline.last_updated = datetime.utcnow()
    db.commit()
    db.refresh(pipeline)
    return PipelineResponse.from_orm(pipeline)

@app.get("/customers/{customer_id}/pipeline", response_model=PipelineResponse)
async def get_pipeline(
    customer_id: int,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    pipeline = db.query(Pipeline).filter(Pipeline.customer_id == customer_id).first()
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    return PipelineResponse.from_orm(pipeline)

# System health endpoint
@app.get("/system-health", response_model=List[SystemHealthResponse])
async def get_system_health(
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    customers = db.query(Customer).all()
    health_data = []
    
    for customer in customers:
        pipeline = db.query(Pipeline).filter(Pipeline.customer_id == customer.id).first()
        
        # Simulate health metrics
        import random
        status = random.choice(["healthy", "warning", "error"])
        last_sync = datetime.utcnow() - timedelta(hours=random.randint(1, 24))
        error_message = None if status == "healthy" else "Simulated error message"
        
        health_data.append(SystemHealthResponse(
            customer_id=customer.id,
            customer_name=customer.name,
            status=status,
            last_sync_time=last_sync,
            last_error_message=error_message,
            pipeline_running=pipeline.is_running if pipeline else False
        ))
    
    return health_data

# User management endpoints
@app.post("/users", response_model=UserResponse)
async def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    if token.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    db_user = User(
        email=user.email,
        password_hash=pwd_context.hash(user.password),
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return UserResponse.from_orm(db_user)

@app.get("/users", response_model=List[UserResponse])
async def get_users(
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    if token.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = db.query(User).all()
    return [UserResponse.from_orm(user) for user in users]

@app.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_update: UserCreate,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    if token.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update user fields
    user.email = user_update.email
    user.role = user_update.role
    
    # Only update password if provided
    if user_update.password:
        user.password_hash = pwd_context.hash(user_update.password)
    
    db.commit()
    db.refresh(user)
    return UserResponse.from_orm(user)

@app.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token)
):
    if token.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent deleting the last admin user
    if user.role == "admin":
        admin_count = db.query(User).filter(User.role == "admin").count()
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot delete the last admin user")
    
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 
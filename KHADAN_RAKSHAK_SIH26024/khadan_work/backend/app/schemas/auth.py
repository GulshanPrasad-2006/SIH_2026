from pydantic import BaseModel
from typing import Optional
from app.models.user import UserRole

class LoginRequest(BaseModel):
    username: str
    password: str
    mine_name: Optional[str] = "BCCL - Jharia Colliery"

class UserProfile(BaseModel):
    id: int
    username: str
    full_name: str
    designation: str
    role: UserRole
    mine_name: Optional[str] = None
    scope_badge: Optional[str] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile
    default_screen: int

class MineBrief(BaseModel):
    id: int
    name: str
    subsidiary: str
    zone: str
    mine_type: str
    gassy_category: str

    class Config:
        from_attributes = True

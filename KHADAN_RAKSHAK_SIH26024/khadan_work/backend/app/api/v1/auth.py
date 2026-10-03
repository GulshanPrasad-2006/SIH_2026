from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User, UserRole
from app.models.mine import Mine
from app.schemas.auth import LoginRequest, TokenResponse, UserProfile, MineBrief

router = APIRouter(prefix="/auth", tags=["Screen 1: Authentication & Mine Selection"])

DEFAULT_SCREENS = {
    UserRole.WORKER: 2,
    UserRole.MANAGER: 9,
    UserRole.FIXER: 6,
    UserRole.SUPERVISOR: 8,
    UserRole.CORPORATE: 11
}

SCOPE_BADGES = {
    UserRole.WORKER: "Scope: Field Safety Inspector (Form IV)",
    UserRole.MANAGER: "Scope: Colliery Agent & Mine Manager",
    UserRole.FIXER: "Scope: Remedial Action Fixer",
    UserRole.SUPERVISOR: "Scope: Statutory Shift Supervisor",
    UserRole.CORPORATE: "Scope: Directorate Central Regulator"
}

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Screen 1: Statutory Officer Login
    Authenticates user and returns role metadata and default landing screen.
    """
    user = db.query(User).filter(User.username == request.username.strip().lower()).first()
    if not user or user.password_hash != request.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password credentials."
        )

    # If mine_name is provided, update or reflect it
    mine_name = request.mine_name or user.mine_name or "BCCL - Jharia Colliery"

    user_profile = UserProfile(
        id=user.id,
        username=user.username,
        full_name=user.full_name,
        designation=user.designation,
        role=user.role,
        mine_name=mine_name,
        scope_badge=SCOPE_BADGES.get(user.role, "Scope: General")
    )

    # Simplified token for hackathon / demo usage
    token = f"khadan_rakshak_token_{user.username}_{user.role.value}"

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=user_profile,
        default_screen=DEFAULT_SCREENS.get(user.role, 2)
    )

@router.get("/mines", response_model=List[MineBrief])
def list_mines(db: Session = Depends(get_db)):
    """
    Screen 1: List all active coal mining units for colliery selection.
    """
    return db.query(Mine).all()

@router.get("/me", response_model=UserProfile)
def get_current_user_profile(username: str = "rajesh.sharma", db: Session = Depends(get_db)):
    """
    Returns active user profile for session validation.
    """
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserProfile(
        id=user.id,
        username=user.username,
        full_name=user.full_name,
        designation=user.designation,
        role=user.role,
        mine_name=user.mine_name,
        scope_badge=SCOPE_BADGES.get(user.role, "Scope: General")
    )

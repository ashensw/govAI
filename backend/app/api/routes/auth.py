from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import client_ip, get_current_user
from app.core.security import create_access_token, verify_password
from app.database import get_db
from app.models import User
from app.schemas import LoginRequest, LoginResponse, UserOut
from app.services.audit import log_action

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if user is None or not user.is_active or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")

    token = create_access_token(subject=user.id, extra_claims={"role": user.role.value})
    log_action(
        db,
        user=user,
        action="login",
        resource_type="user",
        resource_id=user.id,
        ip_address=client_ip(request),
    )
    return LoginResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return UserOut.model_validate(user)

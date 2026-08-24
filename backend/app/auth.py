import jwt
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel

SECRET_KEY = "campusconnect_secret_key_change_me_in_production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# Fake user database
USERS_DB = {
    "faculty_cse": {
        "username": "faculty_cse",
        "password": "password123",
        "role": "FACULTY",
        "branch": "CSE"
    },
    "hod_cse": {
        "username": "hod_cse",
        "password": "password123",
        "role": "HOD",
        "branch": "CSE"
    },
    "faculty_ece": {
        "username": "faculty_ece",
        "password": "password123",
        "role": "FACULTY",
        "branch": "ECE"
    },
    "hod_ece": {
        "username": "hod_ece",
        "password": "password123",
        "role": "HOD",
        "branch": "ECE"
    },
    "principal": {
        "username": "principal",
        "password": "password123",
        "role": "PRINCIPAL",
        "branch": None  # System-wide
    }
}

class User(BaseModel):
    username: str
    role: str
    branch: Optional[str] = None

class TokenData(BaseModel):
    username: str
    role: str
    branch: Optional[str] = None

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        branch: Optional[str] = payload.get("branch")
        if username is None or role is None:
            raise credentials_exception
        return User(username=username, role=role, branch=branch)
    except jwt.PyJWTError:
        raise credentials_exception

def check_branch_access(user: User, target_branch: str):
    """
    Checks if a user has access to a specific branch.
    PRINCIPAL can access any branch.
    FACULTY and HOD can only access their designated branch.
    """
    if user.role == "PRINCIPAL":
        return True
    if user.branch == target_branch:
        return True
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=f"Access denied for branch {target_branch}. User belongs to {user.branch}."
    )

def verify_role(allowed_roles: List[str]):
    def dependency(user: User = Depends(get_current_user)):
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role {user.role} is not authorized. Allowed: {allowed_roles}."
            )
        return user
    return dependency

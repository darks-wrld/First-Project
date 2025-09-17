from pydantic import BaseModel, EmailStr
from typing import Optional

# --- Token Schemas ---

class Token(BaseModel):
    """
    Schema for the JWT access token response.
    """
    access_token: str
    token_type: str


class TokenData(BaseModel):
    """
    Schema for the data contained within a JWT.
    The 'sub' (subject) will be the username.
    """
    username: Optional[str] = None


# --- User Schemas ---

class UserBase(BaseModel):
    """
    Base schema for a user, containing common attributes.
    """
    username: str
    email: EmailStr
    role: str = "community"


class UserCreate(UserBase):
    """
    Schema for creating a new user. Inherits from UserBase and adds the password.
    """
    password: str


class User(UserBase):
    """
    Schema for reading/returning user data.
    This model is used when fetching user information from the API.
    It should not include sensitive information like the password.
    """
    id: int

    class Config:
        # This allows the model to be created from ORM objects
        # (e.g., SQLAlchemy models) directly.
        from_attributes = True


class UserInDB(User):
    """
    Schema for user data as it is stored in the database.
    Includes the hashed password for internal use (e.g., authentication).
    """
    hashed_password: str

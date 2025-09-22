from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from typing import Annotated

# Although we are using an in-memory DB, we import schemas and security
# as if we were using a real one, to keep the structure consistent.
from . import schemas
from . import security

# --- App Initialization ---
app = FastAPI(title="MRPT Backend API")

# --- CORS Middleware Configuration ---
# This is crucial for allowing the frontend (running on a different port)
# to communicate with the backend.
origins = [
    "http://localhost",
    "http://localhost:5173",  # Default port for Vite dev server
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)


# --- In-Memory "Database" for demonstration ---
# This dictionary will act as our user database.
# In a real application, this would be a connection to PostgreSQL/PostGIS.
fake_users_db = {}


@app.on_event("startup")
async def startup_event():
    """
    On application startup, check for and create the initial admin user
    if it doesn't already exist. This ensures the system is always accessible.
    """
    # This check is important to prevent re-creating the user on hot reloads
    if "admin" not in fake_users_db:
        hashed_password = security.get_password_hash("6thMarch1957")
        fake_users_db["admin"] = {
            "id": 1,
            "username": "admin",
            "email": "admin@mrpt.gov.gh",
            "hashed_password": hashed_password,
            "role": "admin",
        }
        print("Default admin user 'admin' created successfully.")


# --- Security & Dependency Injection ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_user_from_db(db: dict, username: str) -> schemas.UserInDB | None:
    """Helper function to retrieve a user from our fake DB."""
    if username in db:
        user_dict = db[username]
        return schemas.UserInDB(**user_dict)
    return None

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]) -> schemas.User:
    """
    Dependency to get the current user from a JWT token.
    This function is used to protect endpoints that require authentication.

    It decodes the token, validates the username, and fetches the user from the DB.
    Raises an HTTPException if the token is invalid or the user doesn't exist.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = security.decode_token_payload(token)
    if payload is None:
        raise credentials_exception

    username: str | None = payload.get("sub")
    if username is None:
        raise credentials_exception

    token_data = schemas.TokenData(username=username)

    user = get_user_from_db(fake_users_db, username=token_data.username)
    if user is None:
        raise credentials_exception

    return user


# --- API Endpoints ---

@app.get("/")
def read_root():
    """Root endpoint to confirm the API is running."""
    return {"message": "Welcome to the Mapping and Risk Prediction Tool API"}


@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()]
):
    """
    Provides an access token for a valid user.
    This is the main login endpoint. It uses OAuth2's "password" flow.
    """
    user = get_user_from_db(fake_users_db, form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = security.create_access_token(
        data={"sub": user.username}
    )

    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/users/me/", response_model=schemas.User)
async def read_users_me(
    current_user: Annotated[schemas.User, Depends(get_current_user)]
):
    """
    Fetches the details for the currently authenticated user.
    This endpoint is protected; a valid JWT token must be provided.
    """
    return current_user

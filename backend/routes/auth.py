from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session

from backend.db.database import get_db
from backend.models.user import User, PlayerProfile
from backend.schemas.user import (
    UserRegister,
    UserLogin,
    TokenResponse,
    UserResponse,
    PlayerProfileResponse,
    UpdateProfileRequest
)
from backend.core.security import hash_password, verify_password, create_access_token
from backend.core.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(request: UserRegister, response: Response, db: Session = Depends(get_db)):
    # Check if username or email already taken
    existing_user = db.query(User).filter(
        (User.username == request.username) | (User.email == request.email)
    ).first()

    if existing_user:
        if existing_user.username == request.username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username is already claimed by another adventurer"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered in the realm"
            )

    # Create new User
    user = User(
        username=request.username,
        email=request.email,
        hashed_password=hash_password(request.password)
    )
    db.add(user)
    db.flush()

    # Create Initial PlayerProfile with Level 1 starter pack
    starter_avatar = request.avatar_url or "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=150&q=80"
    profile = PlayerProfile(
        user_id=user.id,
        avatar_url=starter_avatar,
        title="Novice Wanderer",
        level=1,
        xp=100,
        coins=200,
        stories_completed=0,
        multiplayer_wins=0,
        favorite_genre="Fantasy",
        inventory=[
            {
                "id": "starter_blade",
                "name": "Runebound Dagger",
                "type": "relic",
                "description": "A faint luminescent blade granting protection at dark crossroads."
            }
        ],
        achievements=[
            {
                "id": "first_adventure",
                "title": "First Adventure",
                "description": "Begin your journey across the infinite realities.",
                "unlocked_at": None
            }
        ],
        stats={"decisions_made": 0, "total_playtime_minutes": 0}
    )
    db.add(profile)
    db.commit()
    db.refresh(user)

    # Issue JWT Token
    token = create_access_token(data={"sub": str(user.id), "username": user.username})

    # Set auth cookie
    response.set_cookie(
        key="auth_token",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 7
    )

    return TokenResponse(
        token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.post("/login", response_model=TokenResponse)
def login(request: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = None
    if request.email:
        user = db.query(User).filter(User.email.ilike(request.email.strip())).first()
    elif request.username:
        user = db.query(User).filter(User.username.ilike(request.username.strip())).first()

    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Verify your email/username and secret passphrase."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Adventurer account is suspended"
        )

    token = create_access_token(data={"sub": str(user.id), "username": user.username})

    response.set_cookie(
        key="auth_token",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 7
    )

    return TokenResponse(
        token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(user: User = Depends(get_current_user)):
    return UserResponse.model_validate(user)


@router.put("/profile", response_model=PlayerProfileResponse)
def update_profile(
    request: UpdateProfileRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = user.profile
    if not profile:
        profile = PlayerProfile(user_id=user.id)
        db.add(profile)

    if request.avatar_url is not None:
        profile.avatar_url = request.avatar_url
    if request.favorite_genre is not None:
        profile.favorite_genre = request.favorite_genre
    if request.title is not None:
        profile.title = request.title

    db.commit()
    db.refresh(profile)
    return PlayerProfileResponse.model_validate(profile)


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="auth_token")
    return {"message": "Adventurer logged out of realm"}

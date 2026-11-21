import pytest
from fastapi.testclient import TestClient
import uuid

from backend.main import app

client = TestClient(app)


@pytest.fixture
def auth_user():
    unique_suffix = uuid.uuid4().hex[:8]
    username = f"prog_{unique_suffix}"
    email = f"prog_{unique_suffix}@adventurer.com"
    password = "ProgPassword123!"

    reg = client.post(
        "/api/auth/register",
        json={"username": username, "email": email, "password": password}
    )
    token = reg.json().get("token") or reg.json().get("access_token")
    user_id = reg.json()["user"]["id"]
    return {"token": token, "user_id": user_id, "username": username}


def test_story_completion_reward(auth_user):
    headers = {"Authorization": f"Bearer {auth_user['token']}"}

    # Reward story completion
    response = client.post(
        "/api/rewards/story-complete",
        json={"story_id": 1, "outcome": "win"},
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["xp_gained"] > 0
    assert data["coins_gained"] > 0
    assert data["new_level"] >= 1


def test_store_purchase_and_overdraft_protection(auth_user):
    headers = {"Authorization": f"Bearer {auth_user['token']}"}

    # Starting gold for registered user is 200
    purchase_res = client.post(
        "/api/rewards/store/purchase",
        json={
            "item_id": "potion_luck",
            "item_name": "Elixir of Luck",
            "cost": 50,
            "category": "consumable"
        },
        headers=headers
    )
    assert purchase_res.status_code == 200
    p_data = purchase_res.json()
    assert p_data["success"] is True
    assert p_data["remaining_coins"] == 150

    # Overdraft protection: trying to buy 9999 gold item with 150 gold
    overdraft_res = client.post(
        "/api/rewards/store/purchase",
        json={
            "item_id": "godly_armor",
            "item_name": "Titanium Exosuit",
            "cost": 9999,
            "category": "skin"
        },
        headers=headers
    )
    assert overdraft_res.status_code == 400
    assert "Insufficient coins" in overdraft_res.json()["detail"]


def test_achievement_unlock_and_anti_duplicate(auth_user):
    headers = {"Authorization": f"Bearer {auth_user['token']}"}

    # Unlock first adventure achievement
    unlock1 = client.post(
        "/api/rewards/achievements/unlock",
        json={"achievement_code": "first_adventure"},
        headers=headers
    )
    assert unlock1.status_code == 200
    res1 = unlock1.json()
    assert res1["rewarded"] is True

    # Re-unlock: should not award duplicate rewards
    unlock2 = client.post(
        "/api/rewards/achievements/unlock",
        json={"achievement_code": "first_adventure"},
        headers=headers
    )
    assert unlock2.status_code == 200
    res2 = unlock2.json()
    assert res2["rewarded"] is False  # Duplicate claim prevented

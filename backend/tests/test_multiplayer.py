import pytest
from fastapi.testclient import TestClient
import uuid

from backend.main import app

client = TestClient(app)


@pytest.fixture
def auth_player():
    unique_suffix = uuid.uuid4().hex[:8]
    username = f"mp_{unique_suffix}"
    email = f"mp_{unique_suffix}@adventurer.com"
    password = "MultiplayerPass123!"

    reg = client.post(
        "/api/auth/register",
        json={"username": username, "email": email, "password": password}
    )
    token = reg.json().get("token") or reg.json().get("access_token")
    user_id = reg.json()["user"]["id"]
    return {"token": token, "user_id": user_id, "username": username}


def test_multiplayer_room_lifecycle(auth_player):
    headers = {"Authorization": f"Bearer {auth_player['token']}"}

    # 1. Create a multiplayer room
    create_res = client.post(
        "/api/multiplayer/rooms/create",
        json={
            "title": "Dragon Citadel Raid",
            "mode": "Shared Voting",
            "max_players": 4,
            "is_private": False
        },
        headers=headers
    )
    assert create_res.status_code == 200
    room = create_res.json()
    assert room["title"] == "Dragon Citadel Raid"
    assert "room_code" in room
    room_code = room["room_code"]

    # 2. Query public rooms list
    list_res = client.get("/api/multiplayer/rooms")
    assert list_res.status_code == 200
    rooms = list_res.json()
    assert any(r["room_code"] == room_code for r in rooms)

    # 3. Retrieve room details
    get_res = client.get(f"/api/multiplayer/rooms/{room_code}", headers=headers)
    assert get_res.status_code == 200
    details = get_res.json()
    assert details["room_code"] == room_code
    assert len(details["players"]) >= 1

    # 4. Join room (already joined as host, should return cleanly)
    join_res = client.post(
        f"/api/multiplayer/rooms/{room_code}/join",
        json={},
        headers=headers
    )
    assert join_res.status_code == 200
    assert join_res.json()["success"] is True

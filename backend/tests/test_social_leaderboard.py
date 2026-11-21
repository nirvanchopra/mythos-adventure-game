import pytest
from fastapi.testclient import TestClient
import uuid

from backend.main import app

client = TestClient(app)


def test_leaderboard_endpoints():
    res = client.get("/api/leaderboard/global?sort_by=xp&limit=10")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

    res_level = client.get("/api/leaderboard/global?sort_by=level&limit=10")
    assert res_level.status_code == 200


def test_player_search_and_feed():
    unique_suffix = uuid.uuid4().hex[:8]
    username = f"searcher_{unique_suffix}"
    email = f"searcher_{unique_suffix}@adventurer.com"
    password = "SearchPass123!"

    client.post(
        "/api/auth/register",
        json={"username": username, "email": email, "password": password}
    )

    # Search for this user
    search_res = client.get(f"/api/social/search?q={username}")
    assert search_res.status_code == 200
    results = search_res.json()
    assert any(r["username"] == username for r in results)

    # Activity feed
    feed_res = client.get("/api/social/feed?limit=5")
    assert feed_res.status_code == 200
    assert isinstance(feed_res.json(), list)

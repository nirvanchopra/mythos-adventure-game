import pytest
from fastapi.testclient import TestClient
import uuid

from backend.main import app
from backend.db.database import SessionLocal
from backend.models.story import Story, StoryNode

client = TestClient(app)


@pytest.fixture
def story_and_player():
    unique_suffix = uuid.uuid4().hex[:8]
    username = f"story_{unique_suffix}"
    email = f"story_{unique_suffix}@adventurer.com"
    password = "StoryPass123!"

    reg = client.post(
        "/api/auth/register",
        json={"username": username, "email": email, "password": password}
    )
    token = reg.json().get("token") or reg.json().get("access_token")
    user_id = reg.json()["user"]["id"]

    # Create dummy story and node in DB
    db = SessionLocal()
    story = Story(
        title=f"Quest of {unique_suffix}",
        description="Ancient Ruins",
        content={"nodes": []},
        session_id=str(uuid.uuid4()),
        genre="Fantasy",
        difficulty="Normal",
        character_name="Hero",
        user_id=user_id
    )
    db.add(story)
    db.flush()

    node = StoryNode(
        story_id=story.id,
        content="You stand before the obsidian archway.",
        is_root_node=True,
        is_winning_ending=False,
        is_end_node=False,
        options=[]
    )
    db.add(node)
    db.commit()
    db.refresh(story)
    db.refresh(node)

    data = {
        "token": token,
        "user_id": user_id,
        "story_id": story.id,
        "node_id": node.id
    }
    db.close()
    return data


def test_story_checkpoint_save_and_load(story_and_player):
    headers = {"Authorization": f"Bearer {story_and_player['token']}"}
    story_id = story_and_player["story_id"]
    node_id = story_and_player["node_id"]

    # 1. Save story progress checkpoint
    save_res = client.post(
        "/api/progress/save",
        json={
            "story_id": story_id,
            "current_node_id": node_id,
            "visited_node_ids": [node_id],
            "inventory_snapshot": [{"id": "torch", "name": "Torch"}],
            "checkpoint_name": "Archway Entrance"
        },
        headers=headers
    )
    assert save_res.status_code == 200
    save_data = save_res.json()
    assert save_data["success"] is True
    assert save_data["current_node_id"] == node_id

    # 2. Load the saved checkpoint
    load_res = client.get(f"/api/progress/{story_id}", headers=headers)
    assert load_res.status_code == 200
    progress = load_res.json()
    assert progress["story_id"] == story_id
    assert progress["current_node_id"] == node_id
    assert len(progress["inventory_snapshot"]) >= 1

    # 3. List active saves
    list_res = client.get("/api/progress/user/saves", headers=headers)
    assert list_res.status_code == 200
    saves = list_res.json()
    assert any(s["story_id"] == story_id for s in saves)


def test_story_creation_and_job_pipeline():
    # Verify story creation endpoint accepts parameters
    res = client.post(
        "/api/stories/create",
        json={
            "theme": "Forgotten Cyber Citadel",
            "genre": "Sci-Fi",
            "difficulty": "Challenging",
            "character_name": "Kaelen",
            "character_class": "Techno-Mage",
            "world_setting": "Neon Dystopia"
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert "job_id" in data
    job_id = data["job_id"]

    # Query the job status
    job_res = client.get(f"/api/jobs/{job_id}")
    assert job_res.status_code == 200
    job_data = job_res.json()
    assert "status" in job_data
    assert str(job_data["status"]).lower() in ["pending", "processing", "completed", "failed"]

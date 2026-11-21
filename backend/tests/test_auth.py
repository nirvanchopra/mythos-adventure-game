import pytest
from fastapi.testclient import TestClient
import uuid

from backend.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "Neon PostgreSQL" in data["database"]


def test_user_registration_and_login():
    unique_suffix = uuid.uuid4().hex[:8]
    username = f"hero_{unique_suffix}"
    email = f"hero_{unique_suffix}@adventurer.com"
    password = "StrongPassword123!"

    # 1. Register
    reg_response = client.post(
        "/api/auth/register",
        json={
            "username": username,
            "email": email,
            "password": password
        }
    )
    assert reg_response.status_code == 201
    reg_data = reg_response.json()
    assert "token" in reg_data
    token = reg_data["token"]
    assert reg_data["user"]["username"] == username

    # 2. Duplicate registration rejection
    dup_response = client.post(
        "/api/auth/register",
        json={
            "username": username,
            "email": f"other_{unique_suffix}@adventurer.com",
            "password": password
        }
    )
    assert dup_response.status_code == 400

    # 3. Login
    login_response = client.post(
        "/api/auth/login",
        json={
            "username": username,
            "password": password
        }
    )
    assert login_response.status_code == 200
    login_data = login_response.json()
    assert "token" in login_data

    # 4. Authenticated profile check (/auth/me)
    me_response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_response.status_code == 200
    me_data = me_response.json()
    assert me_data["username"] == username
    assert me_data["profile"]["level"] == 1
    assert me_data["profile"]["coins"] >= 100

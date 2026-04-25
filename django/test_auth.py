import requests

# Register
reg_data = {
    "username": "usertest123",
    "display_name": "Test User",
    "email": "user123@test.com",
    "password": "password123"
}
r1 = requests.post("http://localhost:8000/api/auth/register/", json=reg_data)
print("Register:", r1.status_code, r1.json())

# Login
login_data = {
    "email": "user123@test.com",
    "password": "password123"
}
r2 = requests.post("http://localhost:8000/api/auth/login/", json=login_data)
print("Login:", r2.status_code, r2.json())

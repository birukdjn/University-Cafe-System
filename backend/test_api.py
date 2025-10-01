#!/usr/bin/env python
import requests
import json

# Test API endpoints
BASE_URL = "http://127.0.0.1:8000"

def test_endpoint(url, method="GET", data=None, headers=None):
    """Test an API endpoint"""
    try:
        if method == "GET":
            response = requests.get(url, headers=headers)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers)
        
        print(f"\n{method} {url}")
        print(f"Status: {response.status_code}")
        if response.status_code < 400:
            print(f"Response: {response.json()}")
        else:
            print(f"Error: {response.text}")
        return response
    except Exception as e:
        print(f"Error testing {url}: {e}")
        return None

def main():
    print("Testing Cafe System API Endpoints...")
    
    # Test basic endpoints
    test_endpoint(f"{BASE_URL}/api/students/")
    test_endpoint(f"{BASE_URL}/api/meals/")
    
    # Test cafe endpoints (should require authentication)
    test_endpoint(f"{BASE_URL}/api/cafe/categories/")
    test_endpoint(f"{BASE_URL}/api/cafe/menu-items/")
    
    # Test authentication endpoints
    print("\n=== Testing Authentication ===")
    
    # Test registration
    register_data = {
        "username": "testuser",
        "email": "test@example.com",
        "first_name": "Test",
        "last_name": "User",
        "password": "testpass123",
        "password_confirm": "testpass123",
        "role": "customer"
    }
    register_response = test_endpoint(f"{BASE_URL}/api/cafe/auth/register/", "POST", register_data)
    
    # Test login
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    login_response = test_endpoint(f"{BASE_URL}/api/cafe/auth/login/", "POST", login_data)
    
    if login_response and login_response.status_code == 200:
        token = login_response.json().get('tokens', {}).get('access')
        if token:
            headers = {"Authorization": f"Bearer {token}"}
            print("\n=== Testing Authenticated Endpoints ===")
            test_endpoint(f"{BASE_URL}/api/cafe/categories/", headers=headers)
            test_endpoint(f"{BASE_URL}/api/cafe/menu-items/", headers=headers)
            test_endpoint(f"{BASE_URL}/api/cafe/dashboard/stats/", headers=headers)

if __name__ == "__main__":
    main()

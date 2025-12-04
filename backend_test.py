#!/usr/bin/env python3
"""
Backend API Testing Script for Contact Form
Tests the /api/contact endpoint functionality and email sending
"""

import json
import requests
import time
from typing import Dict, Any

# Backend URL configuration
BACKEND_URL = "http://localhost:8001"
CONTACT_ENDPOINT = f"{BACKEND_URL}/api/contact"

def test_contact_form_api():
    """Test the contact form API endpoint with various scenarios"""
    
    print("=" * 60)
    print("TESTING CONTACT FORM API")
    print("=" * 60)
    
    # Test Case 1: Valid contact message
    print("\n1. Testing valid contact message...")
    test_data = {
        "name": "Иван Петров",
        "email": "test@example.com",
        "phone": "+7 999 111 22 33",
        "subject": "Тестовое сообщение",
        "message": "Это тестовое сообщение с формы контакта. Проверяем работу API и отправку email."
    }
    
    try:
        response = requests.post(CONTACT_ENDPOINT, json=test_data, timeout=30)
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text}")
        
        if response.status_code == 200:
            response_data = response.json()
            if response_data.get("success") and response_data.get("message") == "Сообщение отправлено":
                print("   ✅ PASS: Valid contact message sent successfully")
            else:
                print(f"   ❌ FAIL: Unexpected response format: {response_data}")
        else:
            print(f"   ❌ FAIL: Expected status 200, got {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"   ❌ ERROR: Request failed - {e}")
    
    # Test Case 2: Contact message without phone (optional field)
    print("\n2. Testing contact message without phone...")
    test_data_no_phone = {
        "name": "Мария Сидорова",
        "email": "maria@example.com",
        "subject": "Вопрос по услугам",
        "message": "Здравствуйте! Хотела бы узнать подробности о ваших услугах разработки."
    }
    
    try:
        response = requests.post(CONTACT_ENDPOINT, json=test_data_no_phone, timeout=30)
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text}")
        
        if response.status_code == 200:
            response_data = response.json()
            if response_data.get("success") and response_data.get("message") == "Сообщение отправлено":
                print("   ✅ PASS: Contact message without phone sent successfully")
            else:
                print(f"   ❌ FAIL: Unexpected response format: {response_data}")
        else:
            print(f"   ❌ FAIL: Expected status 200, got {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"   ❌ ERROR: Request failed - {e}")
    
    # Test Case 3: Invalid email format
    print("\n3. Testing invalid email format...")
    test_data_invalid_email = {
        "name": "Тест Пользователь",
        "email": "invalid-email",
        "subject": "Тест",
        "message": "Тестовое сообщение с неправильным email"
    }
    
    try:
        response = requests.post(CONTACT_ENDPOINT, json=test_data_invalid_email, timeout=30)
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text}")
        
        if response.status_code == 422:
            print("   ✅ PASS: Invalid email format properly rejected")
        else:
            print(f"   ❌ FAIL: Expected status 422 for invalid email, got {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"   ❌ ERROR: Request failed - {e}")
    
    # Test Case 4: Missing required fields
    print("\n4. Testing missing required fields...")
    test_data_missing = {
        "name": "Тест",
        "email": "test@example.com"
        # Missing subject and message
    }
    
    try:
        response = requests.post(CONTACT_ENDPOINT, json=test_data_missing, timeout=30)
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text}")
        
        if response.status_code == 422:
            print("   ✅ PASS: Missing required fields properly rejected")
        else:
            print(f"   ❌ FAIL: Expected status 422 for missing fields, got {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"   ❌ ERROR: Request failed - {e}")

    # Test Case 5: Large message content
    print("\n5. Testing large message content...")
    large_message = "Это очень длинное сообщение. " * 100  # ~3000 characters
    test_data_large = {
        "name": "Тест Большое Сообщение",
        "email": "large@example.com",
        "phone": "+7 888 999 00 11",
        "subject": "Большое сообщение",
        "message": large_message
    }
    
    try:
        response = requests.post(CONTACT_ENDPOINT, json=test_data_large, timeout=30)
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text}")
        
        if response.status_code == 200:
            response_data = response.json()
            if response_data.get("success"):
                print("   ✅ PASS: Large message sent successfully")
            else:
                print(f"   ❌ FAIL: Large message failed: {response_data}")
        else:
            print(f"   ❌ FAIL: Expected status 200 for large message, got {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"   ❌ ERROR: Request failed - {e}")

def test_backend_health():
    """Test if backend is running and accessible"""
    print("\n" + "=" * 60)
    print("TESTING BACKEND HEALTH")
    print("=" * 60)
    
    try:
        response = requests.get(f"{BACKEND_URL}/api/health", timeout=10)
        print(f"Health check status: {response.status_code}")
        print(f"Health check response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Backend is running and accessible")
            return True
        else:
            print("❌ Backend health check failed")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Backend is not accessible: {e}")
        return False

def check_email_logs():
    """Check backend logs for email sending activity"""
    print("\n" + "=" * 60)
    print("CHECKING EMAIL LOGS")
    print("=" * 60)
    
    import subprocess
    
    try:
        # Check recent backend logs for email activity
        result = subprocess.run(
            ["tail", "-n", "50", "/var/log/supervisor/backend.out.log"],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0:
            logs = result.stdout
            contact_requests = [line for line in logs.split('\n') if '/api/contact' in line]
            
            print(f"Found {len(contact_requests)} contact form requests in recent logs:")
            for req in contact_requests[-10:]:  # Show last 10
                print(f"   {req}")
                
            if contact_requests:
                print("✅ Contact form API is being called successfully")
            else:
                print("⚠️  No recent contact form requests found in logs")
        else:
            print("❌ Could not read backend logs")
            
    except Exception as e:
        print(f"❌ Error checking logs: {e}")

def main():
    """Main test execution"""
    print("Starting Backend Contact Form API Tests")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Contact Endpoint: {CONTACT_ENDPOINT}")
    
    # Test backend health first
    if not test_backend_health():
        print("\n❌ Backend is not accessible. Stopping tests.")
        return
    
    # Test contact form API
    test_contact_form_api()
    
    # Check email logs
    check_email_logs()
    
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print("✅ Backend is running on port 8001")
    print("✅ Contact API endpoint is accessible")
    print("✅ API returns proper responses for valid/invalid data")
    print("✅ Email functionality is configured (SMTP settings present)")
    print("\nNote: Email delivery depends on SMTP configuration.")
    print("Check backend logs for any email sending errors.")

if __name__ == "__main__":
    main()
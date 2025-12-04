#!/usr/bin/env python3
"""
Direct email sending test to verify SMTP functionality
"""

import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/backend/.env')

def test_direct_email_send():
    """Test direct email sending using the same configuration as the backend"""
    
    SMTP_HOST = os.getenv("SMTP_HOST")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER = os.getenv("SMTP_USER")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
    FROM_EMAIL = os.getenv("FROM_EMAIL")
    
    print("Testing direct email sending...")
    print(f"SMTP Host: {SMTP_HOST}")
    print(f"SMTP Port: {SMTP_PORT}")
    print(f"SMTP User: {SMTP_USER}")
    print(f"From Email: {FROM_EMAIL}")
    
    if not all([SMTP_HOST, SMTP_USER, SMTP_PASSWORD, FROM_EMAIL]):
        print("❌ Missing SMTP configuration")
        return False
    
    # Create test message
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Test Email from Contact Form API"
    msg["From"] = FROM_EMAIL
    msg["To"] = FROM_EMAIL  # Send to self for testing
    
    text_content = """
    This is a test email to verify SMTP functionality.
    
    Test Details:
    - Sent from contact form API test
    - SMTP Host: smtp.gmail.com
    - Port: 587
    - TLS: Enabled
    """
    
    html_content = """
    <html>
    <body>
        <h2>Test Email from Contact Form API</h2>
        <p>This is a test email to verify SMTP functionality.</p>
        <ul>
            <li>Sent from contact form API test</li>
            <li>SMTP Host: smtp.gmail.com</li>
            <li>Port: 587</li>
            <li>TLS: Enabled</li>
        </ul>
    </body>
    </html>
    """
    
    msg.attach(MIMEText(text_content, "plain"))
    msg.attach(MIMEText(html_content, "html"))
    
    try:
        print("Connecting to SMTP server...")
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30) as server:
            server.ehlo()
            print("Starting TLS...")
            server.starttls()
            server.ehlo()
            print("Logging in...")
            server.login(SMTP_USER, SMTP_PASSWORD)
            print("Sending email...")
            server.sendmail(FROM_EMAIL, [FROM_EMAIL], msg.as_string())
            print("✅ Email sent successfully!")
            return True
            
    except Exception as e:
        print(f"❌ Email sending failed: {e}")
        return False

if __name__ == "__main__":
    success = test_direct_email_send()
    if success:
        print("\n✅ SMTP configuration is working correctly")
        print("✅ Emails should be delivered successfully")
    else:
        print("\n❌ SMTP configuration has issues")
        print("❌ Email delivery may fail")
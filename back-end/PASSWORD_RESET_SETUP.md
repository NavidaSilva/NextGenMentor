# Admin Password Reset Setup Guide

## Environment Variables Required

Add these environment variables to your `.env` file in the back-end directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/nextgenmentor

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Email Configuration (Gmail)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password

# Server Port
PORT=5000
```

## Gmail Setup Instructions

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password as `EMAIL_PASS` (not your regular Gmail password)

## How to Use

### For Admins:
1. Go to the login page
2. Click "Forgot Password?"
3. Enter your admin email address
4. Check your email for the reset link
5. Click the link to reset your password
6. Enter your new password

### API Endpoints:
- `POST /admin/forgot-password` - Request password reset
- `POST /admin/reset-password` - Reset password with token
- `GET /admin/verify-reset-token/:token` - Verify reset token

## Security Features:
- Passwords are hashed using bcrypt
- Reset tokens expire after 1 hour
- Tokens are cryptographically secure (32 bytes)
- No information leakage about admin existence
- Password validation (minimum 6 characters)

## Testing:
1. Create a test admin using the existing `/admin/create-test-admin` endpoint
2. Try the password reset flow
3. Verify the email is sent and the reset works

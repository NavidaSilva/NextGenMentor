# Admin Password Reset Tests

## Backend Tests

### Test File: `tests/admin-password-reset.test.js`

#### Test Coverage:
- ✅ **Forgot Password Request** (`POST /admin/forgot-password`)
  - Valid admin email sends reset email
  - Non-existent email returns same message (security)
  - Missing email validation
  - Unique reset token generation

- ✅ **Token Verification** (`GET /admin/verify-reset-token/:token`)
  - Valid token verification
  - Invalid token rejection
  - Expired token rejection

- ✅ **Password Reset** (`POST /admin/reset-password`)
  - Valid token password reset
  - Invalid token rejection
  - Expired token rejection
  - Password length validation
  - Missing parameters validation

- ✅ **Login Integration**
  - Login with new password after reset
  - Reject old password after reset

#### Running Backend Tests:

```bash
# Run all password reset tests
cd back-end
npm test tests/admin-password-reset.test.js

# Or run the specific test script
node run-password-reset-tests.js

# Run with verbose output
npx jest tests/admin-password-reset.test.js --verbose
```

#### Test Database:
- Uses `nextgenmentor_test` database
- Automatically cleans up test data
- Isolated from production data

## Frontend Tests

### Test File: `src/__tests__/AdminPasswordReset.test.jsx`

#### Test Coverage:
- ✅ **Login Page Forgot Password**
  - Forgot password form rendering
  - Password reset request submission
  - Loading states
  - Error handling

- ✅ **Reset Password Page**
  - Token verification
  - Invalid token handling
  - Password reset form
  - Password validation (length, confirmation)
  - Success/error states
  - Navigation

#### Running Frontend Tests:

```bash
# Run all tests
cd front-end
npm test

# Run only password reset tests
npm test AdminPasswordReset

# Run with coverage
npm test -- --coverage
```

#### Mock Setup:
- Uses Mock Service Worker (MSW) for API mocking
- Mocks all password reset API endpoints
- Simulates various response scenarios
- No actual API calls during testing

## Test Scenarios Covered

### 1. Happy Path
1. Admin clicks "Forgot Password"
2. Enters email address
3. Receives reset email
4. Clicks reset link
5. Enters new password
6. Successfully resets password
7. Can login with new password

### 2. Error Scenarios
- Invalid email format
- Non-existent admin email
- Invalid/expired reset token
- Password too short
- Password confirmation mismatch
- Network/server errors

### 3. Security Scenarios
- No information leakage about admin existence
- Token expiration handling
- Unique token generation
- Password validation

## Dependencies for Testing

### Backend:
- `jest` - Test framework
- `supertest` - HTTP testing
- `mongoose` - Database testing

### Frontend:
- `@testing-library/react` - Component testing
- `@testing-library/jest-dom` - DOM matchers
- `msw` - API mocking
- `jest` - Test framework

## Test Data

### Test Admin User:
```json
{
  "email": "test@admin.com",
  "password": "admin123",
  "fullName": "Test Admin",
  "role": "admin"
}
```

### Test Reset Token:
- Format: 64-character hex string
- Expires: 1 hour from generation
- Unique per request

## Running All Tests

### Backend:
```bash
cd back-end
npm test
```

### Frontend:
```bash
cd front-end
npm test
```

### Both (from root):
```bash
# Backend tests
cd back-end && npm test && cd ..

# Frontend tests  
cd front-end && npm test && cd ..
```

## Test Results Expected

- **Backend**: 15+ test cases covering all API endpoints
- **Frontend**: 10+ test cases covering UI interactions
- **Coverage**: 90%+ for password reset functionality
- **Performance**: All tests complete in < 30 seconds

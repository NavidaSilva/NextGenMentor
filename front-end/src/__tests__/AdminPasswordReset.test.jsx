import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../Pages/auth/Login';
import ResetPassword from '../Pages/auth/ResetPassword';

// Mock fetch globally
global.fetch = jest.fn();

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useSearchParams: () => [new URLSearchParams('?token=test-token-123')],
}));

// Mock alert
global.alert = jest.fn();

describe('Admin Password Reset - Login Page', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    global.fetch.mockClear();
    global.alert.mockClear();
  });

  it('should render forgot password form when clicked', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Click forgot password button
    const forgotPasswordBtn = screen.getByText('Forgot Password?');
    fireEvent.click(forgotPasswordBtn);

    // Check if forgot password form appears
    expect(screen.getByText('Send Reset Link')).toBeInTheDocument();
    // Use more specific selector for the forgot password email field
    const forgotPasswordForm = screen.getByText('Send Reset Link').closest('form');
    expect(forgotPasswordForm).toBeInTheDocument();
  });

  it('should send password reset request on form submit', async () => {
    // Mock successful API response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'If an admin account with this email exists, a password reset link has been sent.' })
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Open forgot password form
    const forgotPasswordBtn = screen.getByText('Forgot Password?');
    fireEvent.click(forgotPasswordBtn);

    // Fill email and submit - use the forgot password form specifically
    const forgotPasswordForm = screen.getByText('Send Reset Link').closest('form');
    const emailInput = forgotPasswordForm.querySelector('input[name="email"]');
    const submitBtn = screen.getByText('Send Reset Link');

    fireEvent.change(emailInput, { target: { value: 'test@admin.com' } });
    fireEvent.click(submitBtn);

    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText('Reset link sent to your email.')).toBeInTheDocument();
    });

    // Verify API was called
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:5000/admin/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@admin.com' })
    });
  });

  it('should show loading state during password reset request', async () => {
    // Mock delayed API response
    global.fetch.mockImplementationOnce(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({ message: 'Success' })
        }), 100)
      )
    );

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Open forgot password form
    const forgotPasswordBtn = screen.getByText('Forgot Password?');
    fireEvent.click(forgotPasswordBtn);

    // Fill email and submit
    const forgotPasswordForm = screen.getByText('Send Reset Link').closest('form');
    const emailInput = forgotPasswordForm.querySelector('input[name="email"]');
    const submitBtn = screen.getByText('Send Reset Link');

    fireEvent.change(emailInput, { target: { value: 'test@admin.com' } });
    
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    // Check loading state
    expect(screen.getByText('Sending...')).toBeInTheDocument();
  });

  it('should handle password reset request error', async () => {
    // Mock API error
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Server error' })
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Open forgot password form
    const forgotPasswordBtn = screen.getByText('Forgot Password?');
    fireEvent.click(forgotPasswordBtn);

    // Fill email and submit
    const forgotPasswordForm = screen.getByText('Send Reset Link').closest('form');
    const emailInput = forgotPasswordForm.querySelector('input[name="email"]');
    const submitBtn = screen.getByText('Send Reset Link');

    fireEvent.change(emailInput, { target: { value: 'test@admin.com' } });
    fireEvent.click(submitBtn);

    // Wait for error handling
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Server error');
    });
  });
});

describe('Admin Password Reset - Reset Password Page', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    global.fetch.mockClear();
    global.alert.mockClear();
  });

  it('should render reset password form with valid token', async () => {
    // Mock successful token verification
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Token is valid', email: 'test@admin.com' })
    });

    render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );

    // Should show loading initially
    expect(screen.getByText('Verifying Reset Token')).toBeInTheDocument();

    // Wait for token verification
    await waitFor(() => {
      expect(screen.getByText('Reset Your Password')).toBeInTheDocument();
      expect(screen.getByText('Please enter your new password below.')).toBeInTheDocument();
    });
  });

  it('should show error for invalid token', async () => {
    // Mock invalid token response
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid or expired reset token' })
    });

    render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Invalid Reset Link')).toBeInTheDocument();
      expect(screen.getByText('Invalid or expired reset token')).toBeInTheDocument();
    });
  });

  it('should reset password successfully', async () => {
    // Mock token verification success
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Token is valid', email: 'test@admin.com' })
    });

    // Mock password reset success
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Password has been reset successfully' })
    });

    render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );

    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByText('Reset Your Password')).toBeInTheDocument();
    });

    // Fill password fields
    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
    const submitBtn = screen.getByText('Reset Password');

    fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });
    fireEvent.click(submitBtn);

    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText('Password Reset Successful')).toBeInTheDocument();
      expect(screen.getByText('Your password has been reset successfully. You will be redirected to the login page shortly.')).toBeInTheDocument();
    });
  });

  it('should show loading state during password reset', async () => {
    // Mock token verification success
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Token is valid', email: 'test@admin.com' })
    });

    // Mock delayed password reset response
    global.fetch.mockImplementationOnce(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({ message: 'Password has been reset successfully' })
        }), 100)
      )
    );

    render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );

    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByText('Reset Your Password')).toBeInTheDocument();
    });

    // Fill password fields and submit
    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
    const submitBtn = screen.getByText('Reset Password');

    fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });
    
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    // Check loading state
    expect(screen.getByText('Resetting Password...')).toBeInTheDocument();
  });

  it('should handle password reset error', async () => {
    // Mock token verification success
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Token is valid', email: 'test@admin.com' })
    });

    // Mock password reset error
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid or expired reset token' })
    });

    render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );

    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByText('Reset Your Password')).toBeInTheDocument();
    });

    // Fill password fields and submit
    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
    const submitBtn = screen.getByText('Reset Password');

    fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });
    fireEvent.click(submitBtn);

    // Wait for error handling
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Invalid or expired reset token');
    });
  });

  it('should validate password confirmation match', async () => {
    // Mock token verification success
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Token is valid', email: 'test@admin.com' })
    });

    render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );

    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByText('Reset Your Password')).toBeInTheDocument();
    });

    // Fill password fields with different values
    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
    const submitBtn = screen.getByText('Reset Password');

    await act(async () => {
      fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'differentpassword' } });
      fireEvent.click(submitBtn); // Trigger form submission to show validation errors
    });

    // Check validation error - look for the error message in the form
    await waitFor(() => {
      const form = screen.getByText('Reset Password').closest('form');
      expect(form).toHaveTextContent('Passwords must match');
    });
  });

  it('should validate minimum password length', async () => {
    // Mock token verification success
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Token is valid', email: 'test@admin.com' })
    });

    render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );

    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByText('Reset Your Password')).toBeInTheDocument();
    });

    // Fill password fields with short password
    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
    const submitBtn = screen.getByText('Reset Password');

    await act(async () => {
      fireEvent.change(newPasswordInput, { target: { value: '12345' } });
      fireEvent.change(confirmPasswordInput, { target: { value: '12345' } });
      fireEvent.click(submitBtn); // Trigger form submission to show validation errors
    });

    // Check validation error - look for the error message in the form
    await waitFor(() => {
      const form = screen.getByText('Reset Password').closest('form');
      expect(form).toHaveTextContent('Password must be at least 6 characters');
    });
  });

  it('should navigate back to login', async () => {
    // Mock token verification success
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Token is valid', email: 'test@admin.com' })
    });

    render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );

    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByText('Reset Your Password')).toBeInTheDocument();
    });

    // Click back to login button
    const backToLoginBtn = screen.getByText('Back to Login');
    fireEvent.click(backToLoginBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});

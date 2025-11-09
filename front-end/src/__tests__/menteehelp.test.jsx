import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Help from '../Pages/settings/mentee/help'; 

// Mock fetch
global.fetch = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Help Component', () => {
  test('renders correctly', () => {
    render(<Help />);

    expect(screen.getByText(/Support & Help/i)).toBeInTheDocument();
    expect(screen.getByText(/Frequently Asked Questions/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Your Name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Your Email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Describe your issue or question/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit Request/i })).toBeInTheDocument();
  });

  test('updates form fields correctly', () => {
    render(<Help />);

    const nameInput = screen.getByPlaceholderText(/Your Name/i);
    const emailInput = screen.getByPlaceholderText(/Your Email/i);
    const messageInput = screen.getByPlaceholderText(/Describe your issue or question/i);

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(messageInput, { target: { value: 'Need help with account' } });

    expect(nameInput.value).toBe('John Doe');
    expect(emailInput.value).toBe('john@example.com');
    expect(messageInput.value).toBe('Need help with account');
  });

  test('displays success message on successful submission', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Request submitted successfully' }),
    });

    render(<Help />);

    fireEvent.change(screen.getByPlaceholderText(/Your Name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByPlaceholderText(/Your Email/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Describe your issue or question/i), { target: { value: 'Help!' } });

    fireEvent.click(screen.getByRole('button', { name: /Submit Request/i }));

    expect(screen.getByRole('button', { name: /Submitting.../i })).toBeDisabled();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/support/submit', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"name":"John Doe"'),
      }));
      
      // Verify the body contains all required fields
      const callArgs = fetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      expect(requestBody).toMatchObject({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Help!',
        role: 'mentee'
      });
      expect(requestBody.submittedAt).toBeDefined();
      expect(typeof requestBody.submittedAt).toBe('string');
      
      expect(screen.getByText(/Support request submitted successfully/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Your Name/i).value).toBe('');
      expect(screen.getByPlaceholderText(/Your Email/i).value).toBe('');
      expect(screen.getByPlaceholderText(/Describe your issue or question/i).value).toBe('');
    });
  });

  test('displays error message on failed submission', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to submit request' }),
    });

    render(<Help />);

    fireEvent.change(screen.getByPlaceholderText(/Your Name/i), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByPlaceholderText(/Your Email/i), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Describe your issue or question/i), { target: { value: 'Help needed' } });

    fireEvent.click(screen.getByRole('button', { name: /Submit Request/i }));

    await waitFor(() => {
      expect(screen.getByText(/Failed to submit support request/i)).toBeInTheDocument();
    });
  });

  test('displays error message on fetch exception', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<Help />);

    fireEvent.change(screen.getByPlaceholderText(/Your Name/i), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByPlaceholderText(/Your Email/i), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Describe your issue or question/i), { target: { value: 'Help needed' } });

    fireEvent.click(screen.getByRole('button', { name: /Submit Request/i }));

    await waitFor(() => {
      expect(screen.getByText(/Failed to submit support request/i)).toBeInTheDocument();
    });
  });
});

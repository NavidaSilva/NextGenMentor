import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MenteePrivacy from '../Pages/settings/mentee/privacy';
import userEvent from '@testing-library/user-event';

// Mock CustomButton component
jest.mock('../components/common/Button', () => (props) => (
  <button {...props}>{props.children}</button>
));

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.setItem('token', 'fake-token');
  window.alert = jest.fn();

  // Default fetch mock returns a valid response
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ emailVisibility: false }),
  });
});

describe('MenteePrivacy Component', () => {
  test('renders initial UI and checkbox', async () => {
    render(<MenteePrivacy onBack={() => {}} />);

    expect(screen.getByText(/Privacy Settings/i)).toBeInTheDocument();
    expect(screen.getByText(/Allow others to view my email address/i)).toBeInTheDocument();

    const checkbox = await screen.findByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();

    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument();
  });

  test('checkbox updates when clicked', async () => {
    render(<MenteePrivacy onBack={() => {}} />);

    const checkbox = await screen.findByRole('checkbox');
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  test('calls onBack when Cancel button clicked', async () => {
    const onBackMock = jest.fn();
    render(<MenteePrivacy onBack={onBackMock} />);

    const cancelButton = await screen.findByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    expect(onBackMock).toHaveBeenCalled();
  });

  test('saves settings successfully', async () => {
    // Initial fetch
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ emailVisibility: false }),
    });
    // PUT request
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<MenteePrivacy onBack={() => {}} />);

    const saveButton = await screen.findByRole('button', { name: /Save Changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/security/mentee/privacy',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer fake-token',
          }),
          body: JSON.stringify({ emailVisibility: false }),
        })
      );

      expect(window.alert).toHaveBeenCalledWith('Settings saved!');
    });
  });

  test('shows alert if save fails', async () => {
    // Initial fetch
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ emailVisibility: false }),
    });

    // Failed PUT
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Save failed' }),
    });

    render(<MenteePrivacy onBack={() => {}} />);

    const saveButton = await screen.findByRole('button', { name: /Save Changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Error: Save failed');
    });
  });

  test('alerts user if no token on save', async () => {
    localStorage.removeItem('token');

    render(<MenteePrivacy onBack={() => {}} />);

    const saveButton = await screen.findByRole('button', { name: /Save Changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Please log in first.');
    });
  });
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MentorPrivacy from '../Pages/settings/mentor/privacy';

jest.mock('../components/common/Button', () => (props) => (
  <button {...props}>{props.children}</button>
));

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.setItem('token', 'fake-token');
  window.alert = jest.fn();

  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ emailVisibility: false }),
  });
});

describe('MentorPrivacy Component', () => {
  test('renders initial UI and checkbox after async fetch', async () => {
    render(<MentorPrivacy onBack={() => {}} />);

    expect(screen.getByText(/Privacy Settings/i)).toBeInTheDocument();

    const checkbox = await screen.findByRole('checkbox', { name: /Allow others to view my email address/i });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();

    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument();
  });

  test('checkbox toggles when clicked', async () => {
    render(<MentorPrivacy onBack={() => {}} />);

    const checkbox = await screen.findByRole('checkbox', { name: /Allow others to view my email address/i });
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  test('clicking Save triggers PUT fetch and alert', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ emailVisibility: false }) }); // initial fetch
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) }); // PUT

    render(<MentorPrivacy onBack={() => {}} />);

    const saveButton = await screen.findByRole('button', { name: /Save Changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/security/mentor/privacy',
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

  test('clicking Cancel calls onBack', async () => {
    const onBackMock = jest.fn();
    render(<MentorPrivacy onBack={onBackMock} />);

    const cancelButton = await screen.findByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    expect(onBackMock).toHaveBeenCalled();
  });

  test('shows alert if save fails', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ emailVisibility: false }) });
    global.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Save failed' }) });

    render(<MentorPrivacy onBack={() => {}} />);

    const saveButton = await screen.findByRole('button', { name: /Save Changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Error: Save failed');
    });
  });

  test('alerts user if no token on save', async () => {
    localStorage.removeItem('token');

    render(<MentorPrivacy onBack={() => {}} />);

    const saveButton = await screen.findByRole('button', { name: /Save Changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Please log in first.');
    });
  });
});

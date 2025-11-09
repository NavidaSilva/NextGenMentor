import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ChatRoom from '../Pages/chat/ChatRoom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

global.fetch = jest.fn();

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const tokenPayload = { userId: 'user123' };
const fakeToken = `fakeheader.${btoa(JSON.stringify(tokenPayload))}.fakesignature`;
localStorage.setItem('token', fakeToken);

describe('ChatRoom', () => {
  const sessionId = 'session123';

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('token', fakeToken);
  });

  const renderComponent = async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={[`/chat/${sessionId}`]}>
          <Routes>
            <Route path="/chat/:sessionId" element={<ChatRoom />} />
          </Routes>
        </MemoryRouter>
      );
    });
  };

  it('renders messages fetched from API', async () => {
    const mockMessages = [
      { _id: '1', message: 'Hello', user: { _id: 'user123', fullName: 'Me' } },
      { _id: '2', message: 'Hi', user: { _id: 'user456', fullName: 'Other' } },
    ];

    fetch.mockImplementation((url) => {
      if (url.includes('/messages/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMessages),
        });
      }
      if (url.includes('/sessions/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'active', date: new Date().toISOString() }),
        });
      }
    });

    await renderComponent();

    for (const msg of mockMessages) {
      await waitFor(() => expect(screen.getByText(msg.message)).toBeInTheDocument());
    }
  });

  it('sends a message when form is submitted', async () => {
    fetch.mockImplementation((url, options) => {
      if (url.includes('/messages/') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              _id: '3',
              message: 'New Message',
              user: { _id: 'user123', fullName: 'Me' },
            }),
        });
      }
      if (url.includes('/messages/')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      if (url.includes('/sessions/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'active', date: new Date().toISOString() }),
        });
      }
    });

    await renderComponent();

    const input = screen.getByPlaceholderText('Type your message...');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'New Message' } });
    });

    const sendButton = screen.getByRole('button');

    await act(async () => {
      fireEvent.click(sendButton);
    });

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/messages/${sessionId}`),
        expect.objectContaining({ method: 'POST' })
      )
    );
  });

  it('disables input if session is completed', async () => {
    fetch.mockImplementation((url) => {
      if (url.includes('/sessions/')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'completed' }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    await renderComponent();

    await waitFor(() =>
      expect(screen.getByText(/This session has ended/i)).toBeInTheDocument()
    );

    expect(screen.queryByPlaceholderText('Type your message...')).not.toBeInTheDocument();
  });

  it('mentor can end a session', async () => {
    localStorage.setItem('role', 'mentor');
    window.confirm = jest.fn(() => true); 

    fetch.mockImplementation((url, options) => {
      if (url.includes('/sessions/') && options?.method === 'POST') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      if (url.includes('/sessions/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'active', date: new Date().toISOString() }),
        });
      }
      if (url.includes('/messages/')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
    });

    await renderComponent();

    const endButton = await screen.findByText(/End Session/i);
    fireEvent.click(endButton);

    await waitFor(() =>
      expect(screen.getByText(/This session has ended/i)).toBeInTheDocument()
    );
  });

  it('shows rating modal for mentee and submits rating', async () => {
    localStorage.setItem('role', 'mentee');

    fetch.mockImplementation((url, options) => {
      if (url.includes('/sessions/')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              status: 'completed',
              menteeRated: false,
              mentor: { _id: 'mentor123' },
              date: new Date().toISOString(),
            }),
        });
      }
      if (url.includes('/messages/')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      if (url.includes('/ratings') && options?.method === 'POST') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
    });

    await renderComponent();

    await waitFor(() => expect(screen.getByText(/Rate Your Mentor/i)).toBeInTheDocument());

    const stars = document.querySelectorAll('.stars svg');
    fireEvent.click(stars[3]);

    fireEvent.click(screen.getByText(/Submit/i));

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/ratings'),
        expect.objectContaining({ method: 'POST' })
      )
    );
  });
});

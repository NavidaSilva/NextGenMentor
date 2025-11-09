import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import MenteeProfile from '../Pages/profile/menteeprofile';  
import { MemoryRouter } from 'react-router-dom';

const mockMentee = {
  fullName: 'Test User',
  email: 'test@example.com',
  fieldOfStudy: ['Computer Science'],
  mentorType: ['Career'],
  topics: ['React'],
  mentorshipFormat: 'both',
  goals: 'Learn full-stack development',
  bio: 'Passionate about tech',
  earnedBadges: [{ id: '1', earned: true }],
  completedSessions: 4,
};

beforeEach(() => {
  jest.spyOn(global, 'fetch').mockImplementation(() =>
    new Promise((resolve) =>
      setTimeout(
        () =>
          resolve({
            ok: true,
            json: async () => mockMentee,
          }),
        50
      )
    )
  );

  localStorage.setItem('token', 'mocked-token');
});


afterEach(() => {
  jest.restoreAllMocks();
  localStorage.clear();
});

const renderPage = async () => {
  await act(async () => {
    render(
      <MemoryRouter>
        <MenteeProfile />
      </MemoryRouter>
    );
  });
};

test('shows loading state initially', async () => {
  await renderPage();
  expect(await screen.findByText(/Loading profile/i)).toBeInTheDocument();
});

test('renders mentee profile after loading', async () => {
  await renderPage();

  
  expect(
    await screen.findByText('Test User', { selector: 'h3.mentee-name' })
  ).toBeInTheDocument();

  expect(screen.getByText(/Sessions Completed/i)).toBeInTheDocument();
  expect(screen.getByText(/Badges Earned/i)).toBeInTheDocument();

  expect(screen.getByText(/Learn full-stack development/i)).toBeInTheDocument();
  expect(screen.getByText(/Computer Science/i)).toBeInTheDocument();
});

test('displays Achievements tab when clicked', async () => {
  await renderPage();

  const achievementsTab = await screen.findByRole('button', { name: /Achievements/i });
  await act(async () => {
    fireEvent.click(achievementsTab);
  });

  await waitFor(() => {
    expect(screen.getByText(/Starter/i)).toBeInTheDocument();
  });
});

test('shows error if fetch fails', async () => {
  global.fetch.mockResolvedValueOnce({
    ok: false,
    json: async () => ({ error: 'Unauthorized' }),
  });

  await renderPage();

  expect(await screen.findByText(/Error: Unauthorized/i)).toBeInTheDocument();
});

test('shows error if no token is found', async () => {
  localStorage.clear(); 
  await renderPage();

  expect(await screen.findByText(/Error: No token found/i)).toBeInTheDocument();
});

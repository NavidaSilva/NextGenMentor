import React, { act } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import PublicMentorProfile from '../Pages/profile/PublicMentorProfile';
import { MemoryRouter, useLocation, useParams } from 'react-router-dom';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(),
  useParams: jest.fn(),
}));

const mockMentor = {
  fullName: 'Public Mentor',
  averageRating: 5,
  currentRole: 'Senior Dev',
  education: 'MSc AI',
  yearsExperience: '5+',
  linkedIn: 'https://linkedin.com/in/publicmentor',
  currentStatus: 'Professional',
  completedSessions: 10,
  menteesCount: 20,
  mentorshipFormat: 'Online',
  menteeLevel: ['Beginner'],
  bio: 'I love mentoring future devs!',
  totalRatings: 12,
  profilePicture: null,
};

beforeEach(() => {
  
  useLocation.mockReturnValue({ state: { mentor: mockMentor } });
  useParams.mockReturnValue({ mentorId: '123' });

 
  jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => mockMentor,
  });

  localStorage.setItem('token', 'mock-token');
});

afterEach(() => {
  jest.restoreAllMocks();
  localStorage.clear();
});

const renderPage = async () =>
  await act(async () =>
    render(
      <MemoryRouter>
        <PublicMentorProfile />
      </MemoryRouter>
    )
  );


test('renders public mentor profile correctly', async () => {
  await renderPage();

  await waitFor(() => screen.getByText(/Mentor Profile/i));

  const mentorNameElements = screen.getAllByText('Public Mentor');
  expect(mentorNameElements.length).toBeGreaterThanOrEqual(1);

  expect(
    screen.getByRole('heading', { name: /Hello, I’m Public Mentor/i, level: 3 })
  ).toBeInTheDocument();

  expect(screen.getByText(/Senior Dev/i)).toBeInTheDocument();
  expect(screen.getByText(/MSc AI/i)).toBeInTheDocument();
  expect(screen.getByText(/5\+/)).toBeInTheDocument();
  expect(screen.getByText(/Professional/i)).toBeInTheDocument();
  expect(screen.getByText(/Online/i)).toBeInTheDocument();
  expect(screen.getByText(/Beginner/i)).toBeInTheDocument();
  expect(screen.getByText(/I love mentoring future devs!/i)).toBeInTheDocument();

  const linkedInLink = screen.getByRole('link', { name: mockMentor.linkedIn });
  expect(linkedInLink).toHaveAttribute('href', mockMentor.linkedIn);

  expect(screen.getByText(/5.0/)).toBeInTheDocument();
  expect(screen.getByText(/12 ratings/)).toBeInTheDocument();
});

test('renders default avatar if profilePicture is null', async () => {
  await renderPage();
  await waitFor(() => screen.getByText(/Mentor Profile/i));

  const avatarIcon = document.querySelector('.avatar');
  expect(avatarIcon).toBeInTheDocument();
});

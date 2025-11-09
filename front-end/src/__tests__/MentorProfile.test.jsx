import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import MentorProfile from '../Pages/profile/mentorprofile';
import { BrowserRouter } from 'react-router-dom';

const mockMentor = {
  fullName: 'Mentor One',
  averageRating: 4.5,
  email: 'mentor@example.com',
  education: 'BSc Engineering',
  currentStatus: 'Professional',
  yearsExperience: '3-5',
  currentRole: 'Developer',
  linkedIn: 'https://linkedin.com/in/testmentor',
  completedSessions: 8,
  menteesCount: 12,
  industry: ['Software Engineering'],
  mentorshipFormat: 'both',
  menteeLevel: ['Beginner', 'Intermediate'],
  bio: 'Experienced mentor passionate about guiding aspiring developers.',
  totalRatings: 18,
  profilePicture: null,
  emailVisibility: true,
};

let consoleErrorMock;

beforeAll(() => {
  consoleErrorMock = jest.spyOn(console, 'error').mockImplementation((msg) => {
    if (!msg.includes('act(...)')) {
      console.log('console.error:', msg);
    }
  });
});

afterAll(() => {
  consoleErrorMock.mockRestore();
});

beforeEach(() => {
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

const renderPage = () =>
  render(
    <BrowserRouter>
      <MentorProfile />
    </BrowserRouter>
  );

test('renders loading text initially', () => {
  renderPage();
  expect(screen.getByText(/Loading profile/i)).toBeInTheDocument();
});

test('displays mentor details correctly after loading', async () => {
  renderPage();

  await waitFor(() => expect(screen.getByText(/Your Profile/i)).toBeInTheDocument());

  expect(screen.getAllByText('Mentor One').length).toBeGreaterThan(1);
  expect(screen.getByText(/mentor@example.com/i)).toBeInTheDocument();
  expect(screen.getByText(/3-5/i)).toBeInTheDocument();
  expect(screen.getByText(/Software Engineering/i)).toBeInTheDocument();
  expect(screen.getByText(/Experienced mentor passionate about guiding/i)).toBeInTheDocument();
  expect(screen.getByText('Developer')).toBeInTheDocument();

  expect(screen.getByText(/Professional/i)).toBeInTheDocument();
  expect(screen.getByText(/BSc Engineering/i)).toBeInTheDocument();
  expect(screen.getByText(/both/i)).toBeInTheDocument();
  expect(screen.getByText(/Beginner, Intermediate/i)).toBeInTheDocument();
  expect(screen.getByText(/18 ratings/i)).toBeInTheDocument();
});

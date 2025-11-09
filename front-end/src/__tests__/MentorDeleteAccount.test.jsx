import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import MentorDeleteAccount from '../Pages/settings/mentor/deleteaccount';
import axios from 'axios';
import { MemoryRouter } from 'react-router-dom';

jest.mock('axios');

const mockedNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,

}));

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.setItem('token', 'fake-token');
  window.alert = jest.fn();

});

const renderComponent = () =>
  render(
    <MemoryRouter>
      <MentorDeleteAccount />
    </MemoryRouter>
  );

describe('MentorDeleteAccount Component', () => {
  test('renders component correctly', () => {
    renderComponent();
    expect(screen.getByText(/Delete Your Mentor Account/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Type DELETE/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();

  });

  test('enables delete button only when input is DELETE (case-insensitive)', () => {
  renderComponent();

  const input = screen.getByPlaceholderText(/Type DELETE/i);
  const button = screen.getByRole('button');

  fireEvent.change(input, { target: { value: 'delete' } });
  expect(button).toBeEnabled();

  fireEvent.change(input, { target: { value: 'DELETE' } });
  expect(button).toBeEnabled();

  fireEvent.change(input, { target: { value: 'WRONG' } });
  expect(button).toBeDisabled();
});


  test('calls API and navigates on successful delete', async () => {
    axios.delete.mockResolvedValueOnce({});

    renderComponent();

    const input = screen.getByPlaceholderText(/Type DELETE/i);
    const button = screen.getByRole('button');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'DELETE' } });
      fireEvent.click(button);

    });

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        'http://localhost:5000/mentor/delete-account',
        { headers: { Authorization: 'Bearer fake-token' } }
      );
      expect(localStorage.getItem('token')).toBeNull();
      expect(mockedNavigate).toHaveBeenCalledWith('/?deleted=true');
      expect(button).toHaveTextContent(/Permanently Delete Account/i);
      
    });
  });

  test('alerts user on API failure', async () => {
    axios.delete.mockRejectedValueOnce(new Error('Failed'));

    renderComponent();

    const input = screen.getByPlaceholderText(/Type DELETE/i);
    const button = screen.getByRole('button');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'DELETE' } });
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        'Failed to delete account. Try again later.'
      );
    });
  });
});

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import MenteeDeleteAccount from '../Pages/settings/mentee/deleteaccount';
import axios from 'axios';
import { BrowserRouter } from 'react-router-dom';

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
    <BrowserRouter>
      <MenteeDeleteAccount />
    </BrowserRouter>
  );

describe('MenteeDeleteAccount Component', () => {
  test('renders correctly', () => {
    renderComponent();

    expect(screen.getByText(/Delete Your Mentee Account/i)).toBeInTheDocument();

    expect(
      screen.getByText((content, element) => {
        return (
          element.tagName.toLowerCase() === 'p' &&
          content.includes('This action is') &&
          element.querySelector('strong')?.textContent === 'permanent'
        );
      })
    ).toBeInTheDocument();

    expect(screen.getByPlaceholderText(/Type DELETE/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();

  });

  test('enables delete button only when confirmation is DELETE', () => {
    renderComponent();

    const input = screen.getByPlaceholderText(/Type DELETE/i);
    const button = screen.getByRole('button');

    expect(button).toBeDisabled();

    fireEvent.change(input, { target: { value: 'delete' } });
    expect(button).toBeEnabled();

    fireEvent.change(input, { target: { value: 'DELETE' } });
    expect(button).toBeEnabled();

  });

  test('successfully deletes account and navigates', async () => {
    renderComponent();

    axios.delete.mockResolvedValueOnce({ status: 200 });

    const input = screen.getByPlaceholderText(/Type DELETE/i);
    const button = screen.getByRole('button');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'DELETE' } 
    });
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBeNull();
      expect(mockedNavigate).toHaveBeenCalledWith('/?deleted=true');
      expect(button).toHaveTextContent(/Permanently Delete Account/i);
    });
  });

  test('shows alert if deletion fails', async () => {
    renderComponent();

    axios.delete.mockRejectedValueOnce(new Error('Failed'));

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

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MentorSignup from '../Pages/auth/MentorSignup';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Helper for rendering with router
const renderWithRouter = (ui) => render(<BrowserRouter>{ui}</BrowserRouter>);

test('renders Mentor Signup heading', () => {
  renderWithRouter(<MentorSignup />);
  const heading = screen.getByText(/Become a Mentor/i);
  expect(heading).toBeInTheDocument();
});



test('shows validation errors for multiple required fields', async () => {
  renderWithRouter(<MentorSignup />);
  const submitButton = screen.getByRole('button', { name: /Complete Mentor Signup/i });
  fireEvent.click(submitButton);

await waitFor(() => {
  const alerts = screen.getAllByText(/required/i); // generic match
  expect(alerts.length).toBeGreaterThanOrEqual(1);
});
});

test('accepts user input and changes form values', async () => {
  renderWithRouter(<MentorSignup />);

  // Select "Professional" in Current Status
  const statusLabel = screen.getByLabelText(/Current Status/i);
  fireEvent.mouseDown(statusLabel);
  const statusOption = await screen.findByText('Professional');
  fireEvent.click(statusOption);

  await waitFor(() => {
    expect(screen.getByText('Professional')).toBeInTheDocument();
  });


  // Select "3-5" in Experience
  const expLabel = screen.getByLabelText(/Years of Experience/i);
  fireEvent.mouseDown(expLabel);
  const expOption = await screen.findByText('3-5');
  fireEvent.click(expOption);

  await waitFor(() => {
    expect(screen.getByText('3-5')).toBeInTheDocument();
  });

    // Text Fields
  const roleInput = screen.getByLabelText(/Current Role \/ Job Title/i);
  fireEvent.change(roleInput, { target: { value: 'Senior Engineer' } });
  await waitFor(() => {
    expect(roleInput.value).toBe('Senior Engineer');
  });
   const linkedInInput = screen.getByLabelText(/LinkedIn Profile URL/i);
  fireEvent.change(linkedInInput, { target: { value: 'https://linkedin.com/in/test' } });
  await waitFor(() => {
    expect(linkedInInput.value).toBe('https://linkedin.com/in/test');
  });
});

test('selects mentee levels and checks boxes', async () => {
  renderWithRouter(<MentorSignup />);
  
  const undergradCheckbox = screen.getByLabelText(/Undergraduate/i);
  fireEvent.click(undergradCheckbox);
  
  await waitFor(() => {
    expect(undergradCheckbox.checked).toBe(true);
  });
});
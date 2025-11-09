import { render, screen, fireEvent } from '@testing-library/react';
import TopicSelectionPage from '../Pages/query/TopicSelectionPage';
import { BrowserRouter } from 'react-router-dom';
import React from "react";
// Helper to render component with router
const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

test('renders TopicSelectionPage heading', () => {
  renderWithRouter(<TopicSelectionPage />);
  const heading = screen.getByText(/Create a New Mentorship Query/i);
  expect(heading).toBeInTheDocument();
});

test('disables submit if required fields are empty', async () => {
  renderWithRouter(<TopicSelectionPage />);
  const submitButton = screen.getByRole('button', { name: /SUBMIT QUERY/i });

  fireEvent.click(submitButton);


const errors = await screen.findAllByText(/Mentorship heading is required/i);
expect(errors.length).toBeGreaterThan(0);

const errorrs = await screen.findAllByText(/Description is required/i);
expect(errors.length).toBeGreaterThan(0);

  expect(screen.getByText(/Experience is required/i)).toBeInTheDocument();
  expect(screen.getByText(/Communication method is required/i)).toBeInTheDocument();

const erors = await screen.findAllByText(/Learning goal is required/i);
expect(errors.length).toBeGreaterThan(0);

  const topicErors = await screen.findAllByText(/Please select at least one topic or type a custom topic/i);
expect(errors.length).toBeGreaterThan(0);
});

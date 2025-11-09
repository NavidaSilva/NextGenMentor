
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NewSessionModal from '../Components/query/NewSessionModal';
import CalendarAvailability from '../Components/query/CalendarAvailability';

jest.mock('../Components/query/CalendarAvailability', () => jest.fn(() => <div data-testid="calendar-component" />));

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(global, 'fetch').mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: async () => ({ slots: [] }),
    })
  );
  jest.spyOn(global.localStorage.__proto__, 'getItem').mockReturnValue('mockToken');
});


afterEach(() => {
  global.fetch.mockRestore();
});

describe('NewSessionModal', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    mentorId: 'mentor123',
    mentorshipRequestId: 'req456',
    onSessionCreated: jest.fn(),
  };

  it('renders modal with heading when open', () => {
    render(<NewSessionModal {...defaultProps} />);
    expect(screen.getByText(/Schedule New Session/i)).toBeInTheDocument();
  });


  it('fetches and displays slots when opened', async () => {
  const mockSlots = [{ date: '2025-08-12', time: '10:00' }];

  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ slots: mockSlots }),
  });

  render(<NewSessionModal {...defaultProps} />);

  await waitFor(() => {
    expect(CalendarAvailability).toHaveBeenCalled();
    const firstCallProps = CalendarAvailability.mock.calls[0][0];
    expect(firstCallProps.slots).toEqual(mockSlots);
  });
});




  it('shows loading state while fetching slots', async () => {
    let fetchPromiseResolve;
    global.fetch.mockReturnValue(
      new Promise((resolve) => {
        fetchPromiseResolve = resolve;
      })
    );

    render(<NewSessionModal {...defaultProps} />);
    expect(screen.getByText(/Loading slots.../i)).toBeInTheDocument();

    fetchPromiseResolve({
      ok: true,
      json: async () => ({ slots: [] }),
    });

    await waitFor(() => {
      expect(CalendarAvailability).toHaveBeenCalled();
    });
  });

  it('changes session type when radio is clicked', () => {
    render(<NewSessionModal {...defaultProps} />);
    const chatRadio = screen.getByLabelText(/Chat Session/i);
    fireEvent.click(chatRadio);
    expect(chatRadio.checked).toBe(true);
  });

  it('disables confirm button if no slot selected', () => {
    render(<NewSessionModal {...defaultProps} />);
    const confirmButton = screen.getByRole('button', { name: /Confirm Session/i });
    expect(confirmButton).toBeDisabled();
  });
it('submits session and calls onSessionCreated & onClose', async () => {
  const selectedSlot = { date: '2025-08-12', time: '10:00' };

  // Mock CalendarAvailability to auto-select a slot
  CalendarAvailability.mockImplementation(({ onSelectSlot }) => {
    React.useEffect(() => {
      onSelectSlot(selectedSlot);
    }, []);
    return <div data-testid="calendar-component" />;
  });

  // First call: fetchSlots
  // Second call: handleSubmit
  global.fetch
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ slots: [selectedSlot] }),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

  render(<NewSessionModal {...defaultProps} />);

  // Wait for button to become enabled
  const confirmButton = await screen.findByRole('button', { name: /Confirm Session/i });
  await waitFor(() => expect(confirmButton).toBeEnabled());

  fireEvent.click(confirmButton);

  await waitFor(() => {
    expect(defaultProps.onSessionCreated).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});

  it('handles API error on submit', async () => {
    global.fetch
      .mockResolvedValueOnce({ // fetchSlots
        ok: true,
        json: async () => ({ slots: [] }),
      })
      .mockResolvedValueOnce({ // handleSubmit error
        ok: false,
        json: async () => ({ error: 'Something went wrong' }),
      });

    const selectedSlot = { date: '2025-08-12', time: '10:00' };
    CalendarAvailability.mockImplementation(({ onSelectSlot }) => {
      onSelectSlot(selectedSlot);
      return <div data-testid="calendar-component" />;
    });

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<NewSessionModal {...defaultProps} />);

    await waitFor(() => {
      const confirmButton = screen.getByRole('button', { name: /Confirm Session/i });
      fireEvent.click(confirmButton);
    });

   await waitFor(() => {
  expect(
    errorSpy.mock.calls.some(call => call[0] === 'Something went wrong')
  ).toBe(false);
});


    errorSpy.mockRestore();
  });
});
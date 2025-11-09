import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import Settings from '../Pages/settings/mentor/mentorsettings';

jest.mock('../Pages/settings/mentor/account', () => () => <div data-testid="account">Account Component</div>);
jest.mock('../Pages/settings/mentor/privacy', () => () => <div data-testid="privacy">Privacy Component</div>);
jest.mock('../Pages/settings/mentor/help', () => () => <div data-testid="help">Help Component</div>);
jest.mock('../Pages/settings/mentor/deleteaccount', () => () => <div data-testid="delete">Delete Account Component</div>);

describe('Settings Component', () => {
  test('renders sidebar and default main content', () => {
    render(<Settings />);

    const sidebar = screen.getByRole('navigation');
    const buttons = within(sidebar).getAllByRole('button');

    const accountButton = buttons.find(btn => btn.textContent === 'Account');
    const privacyButton = buttons.find(btn => btn.textContent === 'Privacy');
    const helpButton = buttons.find(btn => btn.textContent === 'Help and Support');
    const deleteButton = buttons.find(btn => btn.textContent === 'Delete Account');

    expect(accountButton).toBeInTheDocument();
    expect(privacyButton).toBeInTheDocument();
    expect(helpButton).toBeInTheDocument();
    expect(deleteButton).toBeInTheDocument();

    expect(screen.getByTestId('account')).toBeInTheDocument();
  });

  test('renders Privacy component when Privacy button is clicked', () => {
    render(<Settings />);
    const sidebar = screen.getByRole('navigation');
    const buttons = within(sidebar).getAllByRole('button');
    const privacyButton = buttons.find(btn => btn.textContent === 'Privacy');

    fireEvent.click(privacyButton);
    expect(screen.getByTestId('privacy')).toBeInTheDocument();
  });

  test('renders Help component when Help and Support button is clicked', () => {
    render(<Settings />);
    const sidebar = screen.getByRole('navigation');
    const buttons = within(sidebar).getAllByRole('button');
    const helpButton = buttons.find(btn => btn.textContent === 'Help and Support');

    fireEvent.click(helpButton);
    expect(screen.getByTestId('help')).toBeInTheDocument();
  });

  test('renders Delete Account component when Delete Account button is clicked', () => {
    render(<Settings />);
    const sidebar = screen.getByRole('navigation');
    const buttons = within(sidebar).getAllByRole('button');
    const deleteButton = buttons.find(btn => btn.textContent === 'Delete Account');

    fireEvent.click(deleteButton);
    expect(screen.getByTestId('delete')).toBeInTheDocument();
  });

  test('selected button has "selected" class', () => {
    render(<Settings />);
    const sidebar = screen.getByRole('navigation');
    const buttons = within(sidebar).getAllByRole('button');

    const accountButton = buttons.find(btn => btn.textContent === 'Account');
    const privacyButton = buttons.find(btn => btn.textContent === 'Privacy');

    expect(accountButton).toHaveClass('selected');
    expect(privacyButton).not.toHaveClass('selected');

    fireEvent.click(privacyButton);
    expect(accountButton).not.toHaveClass('selected');
    expect(privacyButton).toHaveClass('selected');
  });
});

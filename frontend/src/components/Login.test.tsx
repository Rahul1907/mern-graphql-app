import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Login from './Login';
import { LOGIN_USER } from '../graphql/mutations';

describe('Login Component', () => {
  const mockOnAuthSuccess = jest.fn();

  beforeEach(() => {
    mockOnAuthSuccess.mockClear();
  });

  test('renders Sign In form by default', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <Login onAuthSuccess={mockOnAuthSuccess} />
      </MockedProvider>
    );

    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Your Name')).not.toBeInTheDocument();
  });

  test('switches to Register form when the Register tab is clicked', async () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <Login onAuthSuccess={mockOnAuthSuccess} />
      </MockedProvider>
    );

    const registerTabButton = screen.getByRole('button', { name: /register/i });
    fireEvent.click(registerTabButton);

    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Your Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  test('executes LOGIN_USER mutation and calls onAuthSuccess on successful login', async () => {
    const user = userEvent.setup();
    const loginMock = {
      request: {
        query: LOGIN_USER,
        variables: {
          email: 'test@example.com',
          password: 'password123',
        },
      },
      result: {
        data: {
          login: {
            token: 'mock-jwt-token',
            user: {
              id: 'u-1',
              name: 'John Doe',
              email: 'test@example.com',
            },
          },
        },
      },
    };

    render(
      <MockedProvider mocks={[loginMock]} addTypename={false}>
        <Login onAuthSuccess={mockOnAuthSuccess} />
      </MockedProvider>
    );

    // Fill the inputs
    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123');

    // Click submit
    const submitBtn = screen.getAllByRole('button', { name: /sign in/i }).find(btn => btn.getAttribute('type') === 'submit');
    if (!submitBtn) throw new Error('Submit button not found');
    await user.click(submitBtn);

    // Wait and verify callback was executed
    await waitFor(() => {
      expect(mockOnAuthSuccess).toHaveBeenCalledWith({
        id: 'u-1',
        name: 'John Doe',
        email: 'test@example.com',
      });
    });
  });
});

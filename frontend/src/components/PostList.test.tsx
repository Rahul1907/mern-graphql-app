import { render, screen, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import '@testing-library/jest-dom';
import PostList from './PostList';
import { GET_POSTS } from '../graphql/queries';

// Mock IntersectionObserver as it doesn't exist in JSDOM testing environment
class MockIntersectionObserver {
  observe = () => null;
  unobserve = () => null;
  disconnect = () => null;
}
window.IntersectionObserver = MockIntersectionObserver as any;

describe('PostList Component', () => {
  const mockCurrentUser = {
    id: 'u-1',
    name: 'John Doe',
    email: 'test@example.com',
  };

  test('renders loading state initially when data is loading and cache is empty', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <PostList currentUser={mockCurrentUser} />
      </MockedProvider>
    );

    expect(screen.getByText('Loading publication feed...')).toBeInTheDocument();
  });

  test('renders empty feed message if no posts are returned', async () => {
    const emptyFeedMock = {
      request: {
        query: GET_POSTS,
        variables: { limit: 5, cursor: null },
      },
      result: {
        data: {
          posts: {
            posts: [],
            cursor: null,
            hasMore: false,
          },
        },
      },
    };

    render(
      <MockedProvider mocks={[emptyFeedMock]} addTypename={false}>
        <PostList currentUser={mockCurrentUser} />
      </MockedProvider>
    );

    // Wait for the query to resolve
    await waitFor(() => {
      expect(screen.getByText(/no publications found/i)).toBeInTheDocument();
    });
  });

  test('renders list of posts on successful query response', async () => {
    const populatedFeedMock = {
      request: {
        query: GET_POSTS,
        variables: { limit: 5, cursor: null },
      },
      result: {
        data: {
          posts: {
            posts: [
              {
                id: 'post-1',
                title: 'Test Article Title One',
                content: 'This is the body content of test article one.',
                author: {
                  id: 'u-2',
                  name: 'Jane Smith',
                  email: 'jane@example.com',
                },
                comments: [],
              },
            ],
            cursor: 'post-1',
            hasMore: false,
          },
        },
      },
    };

    render(
      <MockedProvider mocks={[populatedFeedMock]} addTypename={false}>
        <PostList currentUser={mockCurrentUser} />
      </MockedProvider>
    );

    // Wait for feed posts to render
    await waitFor(() => {
      expect(screen.getByText('Test Article Title One')).toBeInTheDocument();
      expect(screen.getByText('This is the body content of test article one.')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });
});

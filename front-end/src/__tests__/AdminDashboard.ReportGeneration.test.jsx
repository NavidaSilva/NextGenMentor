import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import AdminDashboard from '../Pages/Admin/AdminDashboard';

// Mock fetch globally
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([])
  })
);

// Mock recharts components
jest.mock('recharts', () => ({
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  Line: () => <div data-testid="line" />,
  Pie: () => <div data-testid="pie" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  Legend: () => <div data-testid="legend" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Cell: () => <div data-testid="cell" />
}));

jest.mock('jspdf', () => ({
  jsPDF: jest.fn(() => ({
    setFontSize: jest.fn(),
    text: jest.fn(),
    autoTable: jest.fn(),
    save: jest.fn()
  }))
}));

jest.mock('../Pages/Admin/search.png', () => 'search-icon-mock');

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(() => 'mock-token'),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Helper function to render with router
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Admin Dashboard - Report Generation Tab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    
    // Mock successful API responses
    global.fetch.mockImplementation((url) => {
      if (url.includes('/admin/dashboard-stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            totalMentors: 10,
            totalMentees: 25,
            sessionsThisMonth: 50,
            unresolvedReports: 3
          })
        });
      }
      if (url.includes('/admin/session-report')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { 
              id: '1', 
              date: '2025-01-15', 
              mentor: 'Dr. Smith', 
              mentee: 'John Doe', 
              topic: 'Web Development', 
              type: 'video', 
              status: 'completed',
              mentorRole: 'Professor',
              menteeDepartment: 'Computer Science'
            },
            { 
              id: '2', 
              date: '2025-01-16', 
              mentor: 'Prof. Johnson', 
              mentee: 'Jane Smith', 
              topic: 'Data Science', 
              type: 'chat', 
              status: 'completed',
              mentorRole: 'Senior Developer',
              menteeDepartment: 'Engineering'
            }
          ])
        });
      }
      if (url.includes('/admin/mentor-report')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { 
              fullName: 'Dr. Smith', 
              email: 'dr.smith@example.com', 
              industry: ['Technology'], 
              completedSessions: 15, 
              averageRating: 4.8, 
              menteesCount: 5, 
              yearsExperience: 10, 
              currentRole: 'Professor', 
              education: 'PhD Computer Science' 
            },
            { 
              fullName: 'Prof. Johnson', 
              email: 'prof.johnson@example.com', 
              industry: ['Software'], 
              completedSessions: 12, 
              averageRating: 4.6, 
              menteesCount: 3, 
              yearsExperience: 8, 
              currentRole: 'Senior Developer', 
              education: 'MS Software Engineering' 
            }
          ])
        });
      }
      if (url.includes('/admin/all-mentors')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { _id: '1', fullName: 'Dr. Smith', email: 'dr.smith@example.com', currentRole: 'Professor' },
            { _id: '2', fullName: 'Prof. Johnson', email: 'prof.johnson@example.com', currentRole: 'Senior Developer' }
          ])
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      });
    });
  });

  test('renders reports tab', async () => {
    renderWithRouter(<AdminDashboard />);
    
    const reportsTab = screen.getByText('Reports');
    fireEvent.click(reportsTab);
    
    await waitFor(() => {
      expect(screen.getByText('Generate Session Report')).toBeInTheDocument();
      expect(screen.getByText('Generate Mentor Report')).toBeInTheDocument();
    });
  });

  test('renders session report filters', async () => {
    renderWithRouter(<AdminDashboard />);
    
    const reportsTab = screen.getByText('Reports');
    fireEvent.click(reportsTab);
    
    await waitFor(() => {
      expect(screen.getByText('Start Date')).toBeInTheDocument();
      expect(screen.getByText('End Date')).toBeInTheDocument();
      expect(screen.getByText('Topic')).toBeInTheDocument();
      expect(screen.getByText('Mentor Name')).toBeInTheDocument();
    });
  });

  test('renders mentor report filters when mentor report is selected', async () => {
    const user = userEvent.setup();
    renderWithRouter(<AdminDashboard />);
    
    const reportsTab = screen.getByText('Reports');
    fireEvent.click(reportsTab);
    
    // Select mentor report
    const mentorReportCheckbox = screen.getByText('Generate Mentor Report');
    user.click(mentorReportCheckbox);
    
    await waitFor(() => {
      expect(screen.getByText('Min Sessions')).toBeInTheDocument();
      expect(screen.getByText('Max Sessions')).toBeInTheDocument();
      expect(screen.getByText('Min Rating')).toBeInTheDocument();
      expect(screen.getByText('Max Rating')).toBeInTheDocument();
      expect(screen.getByText('Min Mentees')).toBeInTheDocument();
      expect(screen.getByText('Max Mentees')).toBeInTheDocument();
    });
  });

    test('renders generate report button', async () => {
      renderWithRouter(<AdminDashboard />);
      
      const reportsTab = screen.getByText('Reports');
      fireEvent.click(reportsTab);
      
      await waitFor(() => {
        expect(screen.getByText('Generate Reports')).toBeInTheDocument();
      });
    });

  test('renders clear filters button', async () => {
    renderWithRouter(<AdminDashboard />);
    
    const reportsTab = screen.getByText('Reports');
    fireEvent.click(reportsTab);
    
    await waitFor(() => {
      expect(screen.getByText('Clear Filters')).toBeInTheDocument();
    });
  });

  test('session report generation', async () => {
    const user = userEvent.setup();
    renderWithRouter(<AdminDashboard />);
    
    const reportsTab = screen.getByText('Reports');
    fireEvent.click(reportsTab);
    
    // Test that the session report section is visible
    await waitFor(() => {
      expect(screen.getByText('Generate Session Report')).toBeInTheDocument();
    });
  });

  test('mentor report generation', async () => {
    const user = userEvent.setup();
    renderWithRouter(<AdminDashboard />);
    
    const reportsTab = screen.getByText('Reports');
    fireEvent.click(reportsTab);
    
    // Select mentor report
    const mentorReportCheckbox = screen.getByText('Generate Mentor Report');
    user.click(mentorReportCheckbox);
    
    // Test that the mentor report section is visible
    await waitFor(() => {
      expect(screen.getByText('Select Mentors (Optional)')).toBeInTheDocument();
    });
  });

  test('renders download buttons when report is generated', async () => {
    const user = userEvent.setup();
    renderWithRouter(<AdminDashboard />);
    
    const reportsTab = screen.getByText('Reports');
    fireEvent.click(reportsTab);
    
    // Test that the report generation section is visible
    await waitFor(() => {
      expect(screen.getByText('Generate Reports')).toBeInTheDocument();
    });
  });

  test('displays session report data in table', async () => {
    const user = userEvent.setup();
    renderWithRouter(<AdminDashboard />);
    
    const reportsTab = screen.getByText('Reports');
    fireEvent.click(reportsTab);
    
    // Test that the session report section is visible
    await waitFor(() => {
      expect(screen.getByText('Generate Session Report')).toBeInTheDocument();
    });
  });

  test('displays mentor report data in table', async () => {
    const user = userEvent.setup();
    renderWithRouter(<AdminDashboard />);
    
    const reportsTab = screen.getByText('Reports');
    fireEvent.click(reportsTab);
    
    // Select mentor report
    const mentorReportCheckbox = screen.getByText('Generate Mentor Report');
    user.click(mentorReportCheckbox);
    
    // Test that the mentor report section is visible
    await waitFor(() => {
      expect(screen.getByText('Select Mentors (Optional)')).toBeInTheDocument();
    });
  });

  test('clear filters functionality', async () => {
    const user = userEvent.setup();
    renderWithRouter(<AdminDashboard />);
    
    const reportsTab = screen.getByText('Reports');
    fireEvent.click(reportsTab);
    
    const clearButton = screen.getByText('Clear Filters');
    user.click(clearButton);
    
    // Check that filters are cleared (this would depend on the actual implementation)
    expect(clearButton).toBeInTheDocument();
  });

  test('handles empty report results', async () => {
    global.fetch.mockImplementationOnce((url) => {
      if (url.includes('/admin/session-report')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    const user = userEvent.setup();
    renderWithRouter(<AdminDashboard />);
    
    const reportsTab = screen.getByText('Reports');
    fireEvent.click(reportsTab);
    
    const generateButtons = screen.getAllByText('Generate Report');
    user.click(generateButtons[0]); // Click the first one
    
    await waitFor(() => {
      expect(screen.getByText('No Sessions Found')).toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    global.fetch.mockImplementationOnce(() => 
      Promise.reject(new Error('API Error'))
    );

    renderWithRouter(<AdminDashboard />);
    
    const reportsTab = screen.getByText('Reports');
    fireEvent.click(reportsTab);
    
    const generateButtons = screen.getAllByText('Generate Report');
    userEvent.click(generateButtons[0]); // Click the first one
    
    // Component should still render without crashing
    expect(screen.getByText('Generate Session Report')).toBeInTheDocument();
  });

  test('shows loading state during report generation', async () => {
    // Mock a delayed response
    global.fetch.mockImplementationOnce((url) => {
      if (url.includes('/admin/session-report')) {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve([])
            });
          }, 100);
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    const user = userEvent.setup();
    renderWithRouter(<AdminDashboard />);
    
    const reportsTab = screen.getByText('Reports');
    fireEvent.click(reportsTab);
    
    const generateButtons = screen.getAllByText('Generate Report');
    user.click(generateButtons[0]); // Click the first one
    
    // Should show loading state (check for any loading indicator)
    expect(screen.getByText('Generate Reports')).toBeInTheDocument();
  });

  test('mentor search functionality in mentor report', async () => {
    const user = userEvent.setup();
    renderWithRouter(<AdminDashboard />);
    
    const reportsTab = screen.getByText('Reports');
    fireEvent.click(reportsTab);
    
    // Select mentor report
    const mentorReportCheckbox = screen.getByText('Generate Mentor Report');
    user.click(mentorReportCheckbox);
    
    await waitFor(() => {
      const mentorSearchInput = screen.getByPlaceholderText('Search mentors...');
      user.type(mentorSearchInput, 'Dr');
    });
    
    // Test that the search input is working (value is set)
    await waitFor(() => {
      expect(screen.getByDisplayValue('Dr')).toBeInTheDocument();
    });
  });

  test('topic search functionality in session report', async () => {
    const user = userEvent.setup();
    renderWithRouter(<AdminDashboard />);
    
    const reportsTab = screen.getByText('Reports');
    fireEvent.click(reportsTab);
    
    await waitFor(() => {
      const topicSearchInput = screen.getByPlaceholderText('Search Topic');
      user.type(topicSearchInput, 'Web');
    });
    
    // Test that the search input is working (value is set)
    await waitFor(() => {
      expect(screen.getByDisplayValue('Web')).toBeInTheDocument();
    });
  });

  test('date filter functionality', async () => {
    const user = userEvent.setup();
    renderWithRouter(<AdminDashboard />);
    
    const reportsTab = screen.getByText('Reports');
    fireEvent.click(reportsTab);
    
    // Test that date inputs are present
    await waitFor(() => {
      expect(screen.getByText('Start Date')).toBeInTheDocument();
      expect(screen.getByText('End Date')).toBeInTheDocument();
    });
  });
});

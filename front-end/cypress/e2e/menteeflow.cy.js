describe('Mentee Creates and Submits Mentorship Query', () => {
  const mockUser = {
    fullName: 'Test Mentee',
    _id: 'mentee123',
  };

  const mockMentors = [
    {
      _id: 'mentor1',
      fullName: 'John Mentor',
      industry: ['Computer Science'],
      profilePicture: '/images/mentor1.jpg',
    },
  ];

  const mockQueryResponse = {
    _id: 'query123',
    mentorId: 'mentor1',
    topic: 'Computer Science',
    mentorshipHeading: 'Learn React Basics',
    description: 'Need help with React fundamentals',
    communicationMethod: 'video',
    learningGoal: 'Understand React components',
  };

  beforeEach(() => {
    // Mock the authentication token
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'mock-token');
    });

    // Intercept the fetch mentee API call
    cy.intercept('GET', 'http://localhost:5000/mentee/me', {
      statusCode: 200,
      body: mockUser,
    }).as('fetchMentee');

    // Verify server is up
    cy.request('GET', 'http://localhost:5173/mentee').its('status').should('eq', 200);

    // Visit the mentee dashboard
    cy.visit('/mentee');
    cy.wait('@fetchMentee');
  });

  it('should allow mentee to create a mentorship query, submit it, and select a mentor', () => {
    // Verify and click the create query button
    cy.get('[data-testid="create-query-button"]').should('be.visible');
    cy.get('[data-testid="create-query-button"]').click();
    cy.url().should('include', '/new-query');

    // Fill out the mentorship query form
    cy.get('[data-testid="mentorship-heading-input"]').type('Learn React Basics');
    cy.get('[data-testid="description-input"]').type('Need help with React fundamentals');
    cy.get('[data-testid="custom-topic-input"]').type('Computer Science');
    cy.get('[data-testid="experience-select"]').select('0-2');
    cy.get('[data-testid="communication-method-input"][value="video"]').check();
    cy.get('[data-testid="learning-goal-input"]').type('Understand React components');

    // Intercept the suggest mentors API call
    cy.intercept('POST', 'http://localhost:5000/mentee/suggest-mentors', {
      statusCode: 200,
      body: { mentors: mockMentors },
    }).as('suggestMentors');

    // Submit the query
    cy.get('[data-testid="submit-query-button"]').click();
    cy.wait('@suggestMentors');

    // Verify navigation to recommended mentors page
    cy.url().should('include', '/recomend-mentors');

    // Intercept the request mentor API call
    cy.intercept('POST', 'http://localhost:5000/queries/request', {
      statusCode: 200,
      body: mockQueryResponse,
    }).as('requestMentor');

    // Click the "Select Mentor" button
    cy.get('[data-testid="select-mentor-button"]').click();
    cy.wait('@requestMentor');

    // Verify alert for successful request
    cy.on('window:alert', (str) => {
      expect(str).to.equal('Request sent!');
    });
  });
});
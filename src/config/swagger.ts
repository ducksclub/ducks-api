import swaggerJSDoc from 'swagger-jsdoc'

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: "DUCK'S GameClub API",
      version: '1.0.0',
    },
    servers: [{ url: '/api' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
    paths: {
      '/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string' },
                    password: { type: 'string' },
                    name: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { '201': { description: 'Created' } },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login',
          responses: { '200': { description: 'Authenticated' } },
        },
      },
      '/users/me': {
        get: {
          tags: ['Users'],
          security: [{ bearerAuth: [] }],
          summary: 'Current user profile',
          responses: { '200': { description: 'Profile' } },
        },
      },
      '/events': {
        get: {
          tags: ['Events'],
          summary: 'List events',
          parameters: [
            { name: 'gameType', in: 'query', schema: { enum: ['poker', 'darts', 'billiards'] } },
          ],
          responses: { '200': { description: 'Events' } },
        },
        post: {
          tags: ['Events'],
          security: [{ bearerAuth: [] }],
          summary: 'Create event as admin',
          responses: { '201': { description: 'Created' } },
        },
      },
      '/events/{id}': {
        patch: {
          tags: ['Events'],
          security: [{ bearerAuth: [] }],
          summary: 'Update event as admin',
          responses: { '200': { description: 'Updated' } },
        },
        delete: {
          tags: ['Events'],
          security: [{ bearerAuth: [] }],
          summary: 'Delete event as admin',
          responses: { '200': { description: 'Deleted' } },
        },
      },
      '/events/{id}/register': {
        post: {
          tags: ['Events'],
          security: [{ bearerAuth: [] }],
          summary: 'Register current user for event',
          responses: { '201': { description: 'Registered' } },
        },
        delete: {
          tags: ['Events'],
          security: [{ bearerAuth: [] }],
          summary: "Cancel current user's registration",
          responses: { '200': { description: 'Cancelled' } },
        },
      },
      '/ratings/{game}': {
        get: {
          tags: ['Ratings'],
          summary: 'Top players by game',
          responses: { '200': { description: 'Ratings' } },
        },
      },
      '/ratings/points/award': {
        post: {
          tags: ['Ratings'],
          security: [{ bearerAuth: [] }],
          summary: 'Award points as admin',
          responses: { '201': { description: 'Awarded' } },
        },
      },
      '/feedback': {
        post: {
          tags: ['Feedback'],
          summary: 'Submit feedback',
          responses: { '201': { description: 'Created' } },
        },
        get: {
          tags: ['Feedback'],
          security: [{ bearerAuth: [] }],
          summary: 'List feedback as admin',
          responses: { '200': { description: 'Feedback' } },
        },
      },
      '/content/{key}': {
        get: {
          tags: ['Content'],
          summary: 'Get content page',
          responses: { '200': { description: 'Content' } },
        },
      },
      '/register': {
        post: {
          tags: ['Telegram Bot'],
          summary: 'Bot registration endpoint',
          responses: { '201': { description: 'Registered' } },
        },
      },
      '/rules': {
        get: {
          tags: ['Telegram Bot'],
          summary: 'Bot rules endpoint',
          responses: { '200': { description: 'Rules' } },
        },
      },
    },
  },
  apis: [],
})

import { env } from '../config/env';

/**
 * Minimal but valid OpenAPI 3 document served at /api/v1/docs.
 * Extend `paths` as endpoints evolve; the structure is production-ready.
 */
export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Supermarket Enterprise API',
    version: '1.0.0',
    description: 'REST API for the Supermarket Enterprise e-commerce platform.',
  },
  servers: [{ url: env.API_PREFIX }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      cookieAuth: { type: 'apiKey', in: 'cookie', name: 'accessToken' },
    },
    schemas: {
      ApiEnvelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: {},
          meta: { type: 'object' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/health': { get: { tags: ['Health'], summary: 'Health check', responses: { '200': { description: 'OK' } } } },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new customer',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['firstName', 'lastName', 'email', 'password'],
                properties: {
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', format: 'password' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/auth/login': {
      post: { tags: ['Auth'], summary: 'Login', responses: { '200': { description: 'OK' } } },
    },
    '/products': {
      get: {
        tags: ['Products'],
        summary: 'List products with filtering, search, sort & pagination',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'brand', in: 'query', schema: { type: 'string' } },
          { name: 'minPrice', in: 'query', schema: { type: 'number' } },
          { name: 'maxPrice', in: 'query', schema: { type: 'number' } },
          { name: 'sort', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/products/{id}': {
      get: { tags: ['Products'], summary: 'Get product by id or slug', responses: { '200': { description: 'OK' } } },
    },
    '/cart': { get: { tags: ['Cart'], summary: 'Get current cart', responses: { '200': { description: 'OK' } } } },
    '/orders/checkout': {
      post: { tags: ['Orders'], summary: 'Place an order from the cart', responses: { '201': { description: 'Created' } } },
    },
    '/analytics/dashboard': {
      get: { tags: ['Analytics'], summary: 'Admin dashboard KPIs', responses: { '200': { description: 'OK' } } },
    },
  },
} as const;

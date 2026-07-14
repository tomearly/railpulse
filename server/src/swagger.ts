// server/src/swagger.ts
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { swaggerSpec } from './swagger-spec';

export function setupSwagger(app: Express) {
  // Serve the interactive UI documentation at /api-docs
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log('Swagger documentation initialized at http://127.0.0.1:5000/api-docs');
}
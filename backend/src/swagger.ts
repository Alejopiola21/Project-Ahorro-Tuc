import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';

const port = process.env.PORT || 3001;

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Ahorro Tuc API',
            version: '1.0.0',
            description: 'API documentada para la aplicación Ahorro Tuc — Comparador de precios de supermercados en Tucumán.',
        },
        servers: [
            {
                url: `http://localhost:${port}`,
                description: 'Servidor Local',
            },
        ],
    },
    apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Application) => {
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

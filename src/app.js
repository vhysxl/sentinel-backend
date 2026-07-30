import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes/index.js';
import { notFoundHandler } from './middlewares/not-found.middleware.js';
import { errorHandler } from './middlewares/error-handler.middleware.js';
import { config } from './config/env.config.js';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  })
);

// Body Parsing Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// Mount Application Routes
app.use('/', routes);

// 404 Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;

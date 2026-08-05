import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.route.js';
import userRoutes from './routes/user.route.js';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware.js';
import { config } from './config/env.config.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.frontendUrl, credentials: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Sentinel Backend is running' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);

// Must stay last: anything unmatched, or thrown above, lands here.
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

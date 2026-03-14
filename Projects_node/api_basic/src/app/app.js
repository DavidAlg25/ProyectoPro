import express from 'express';
import userRoutes from '../routes/user.routes.js';
import roleRoutes from '../routes/role.routes.js';
import userApiRoutes from '../routes/apiUser.routes.js';

// Create an instance of the Express application
const app = express();
// Define the base path for the API
const NAME_API = '/api/v1';
// Middleware to handle JSON
app.use(express.json());

// Routes for the API
app.use(NAME_API, userRoutes);
app.use(NAME_API, userStatusRoutes);
app.use(NAME_API, roleRoutes);
app.use(NAME_API, userApiRoutes);

// Handle 404 errors for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    message: 'Endpoint losses 404, not found'
  });
});

export default app;
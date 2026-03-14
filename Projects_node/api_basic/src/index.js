import app from './app/app.js';
import dotenv from 'dotenv';

dotenv.config({path:'../env'});
const PORT = process.env.PORT || 3001; // Allow dynamic port configuration

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

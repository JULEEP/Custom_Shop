import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import connectDatabase from './db/connectDatabase.js';
import userRoutes from './Routes/userRoutes.js';
import categoryRoutes from './Routes/categoryRoutes.js';
import productRoutes from './Routes/productRoutes.js';
import adminRoutes from './Routes/adminRoutes.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());


// Database connection
connectDatabase();

// API routes
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin', adminRoutes);

// Default route
app.get("/", (req, res) => {
 res.json({ message: "Hello from Server" });
});

// Start the server
const port = process.env.PORT || 6000; // Use the PORT environment variable if available, or default to 4000

const server = app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import { userRouter } from './routes/user.js';
import { adminRouter } from './routes/admin.js';
import { clientsRouter } from './routes/clients.js';
import { subVendorsRouter } from './routes/sub-vendor.js';
import { jobPostingRouter } from './routes/jobPosting.js';
import { applicationRouter } from './routes/application.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected...'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});
// Middleware
app.use(express.json());

app.use(cors());

// Routes will go here
console.log("User route declared");

app.use("/api/user",userRouter);

console.log("Client route declared");

app.use("/api/client",clientsRouter);

console.log("Sub-Vendor route declared");

app.use("/api/sub-vendor",subVendorsRouter)

console.log("Job Posting route declared");

app.use("/api/jobPosting",jobPostingRouter);

console.log("Application route declared");

app.use("/api/application",applicationRouter);

console.log("Admin route declared");

app.use("/api/admin",adminRouter);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

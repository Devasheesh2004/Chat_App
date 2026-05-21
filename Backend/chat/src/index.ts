import express from 'express'
import dotenv from 'dotenv'
import connectDb from './config/db.js';
import ChatRoutes from './routes/ChatRoutes.js'
import { createServer } from 'http';
import { initSocket } from './socket.js';
import cors from 'cors';

dotenv.config();

const PORT = process.env.PORT || 5002
const app = express();

connectDb();

app.use(cors());
app.use(express.json());

app.use("/api/v1",ChatRoutes);

const server = createServer(app);
initSocket(server);

server.listen(PORT,()=>{
    console.log(`App Listening at PORT: ${PORT}`);
});
import express from 'express'
import dotenv from 'dotenv'
import { startSendOtpConsumer } from './consumer.js';

dotenv.config();

startSendOtpConsumer();

const PORT = process.env.PORT || 5001;

const app = express();

app.listen(PORT,()=>{
    console.log(`App listening at Port :${PORT}`);  
})
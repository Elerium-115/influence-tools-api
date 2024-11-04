import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import {router} from './router.js';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());
app.use('/', router);

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
    console.log(`--- listening on port ${port}`);
});

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { responseFormatter } from './middlewares/responseFormatter';
import { errorHandler } from './middlewares/errorHandler';
import { UploadRouter } from './routers/upload.router';
import { corsOptions } from './constants';
import redis from './redis';
import jobQueue from './queues/main.queue';
import { convertToMp3 } from '././workers/convert.worker'; // export convertToMp3 from worker or reimplement here

const envFile =
  process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.local';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });
dotenv.config();
const app = express();
const PORT = process.env.PORT;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
redis.on('connect', () => {
  console.log('Connected to Redis');
});
app.use(cors(corsOptions));
app.use(responseFormatter);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
const uploadRouterInstance = new UploadRouter();
app.use('/api', uploadRouterInstance.router);
app.use(errorHandler);

// Start processing jobs inside Express server process:
jobQueue.process(async (job) => {
  console.log(`[jobQueue] Processing job id: ${job.id}`);
  const { originalFilePath, yearMonth, newFileName } = job.data;
  try {
    await convertToMp3(originalFilePath, yearMonth, newFileName);
    console.log(`[jobQueue] Job id ${job.id} done`);
  } catch (error) {
    console.error(`[jobQueue] Job id ${job.id} error`, error);
    throw error;
  }
});

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the File Upload API',
  });
});
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

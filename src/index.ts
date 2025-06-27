import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { responseFormatter } from './middlewares/responseFormatter';
import { errorHandler } from './middlewares/errorHandler';
import { UploadRouter } from './routers/upload.router';
import { corsOptions } from './constants';
import jobQueue from './queues/audio-converter.queue';
import { convertToMp3 } from './workers/audio-converter.worker'; // export convertToMp3 from worker or reimplement here
import imageQueue from './queues/image-converter.queue';
import { processImageJob } from './workers/image-converter.worker';

const envFile =
  process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.local';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });
dotenv.config();

const PORT = process.env.PORT;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use(responseFormatter);
app.use(errorHandler);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const uploadRouterInstance = new UploadRouter();
app.use('/api', uploadRouterInstance.router);

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

imageQueue.process(async (job) => {
  const { originalFilePath, yearMonth, newFileName, extension } = job.data;
  try {
    await processImageJob(originalFilePath, yearMonth, newFileName, extension);
    console.log(`[ImageQueue] Successfully processed image job`);
  } catch (err) {
    console.error(`[ImageQueue] Failed to process image job`, err);
    throw err;
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

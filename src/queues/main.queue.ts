import Queue from 'bull';
import { redisOptions } from '../redis'; // export redisOptions from your redis.ts

const jobQueue = new Queue('audioConversionQueue', {
  redis: redisOptions,
});

export function enqueueAudioConversionJob(jobData: {
  originalFilePath: string;
  yearMonth: string;
  newFileName: string;
}) {
  return jobQueue.add(jobData, { delay: 1 * 1000 }); // 10 seconds delay
}

export default jobQueue;

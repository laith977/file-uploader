import Queue from 'bull';
import { redisOptions } from '../constants';

const imageQueue = new Queue('imageProcessingQueue', {
  redis: redisOptions,
});

export function enqueueImageProcessingJob(jobData: {
  originalFilePath: string;
  yearMonth: string;
  newFileName: string;
  extension: string;
}) {
  return imageQueue.add(jobData, { delay: 1 * 1000 });
}

export default imageQueue;

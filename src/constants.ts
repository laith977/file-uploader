import { CorsOptions } from 'cors';

const AUDIO_EXTENSIONS = ['mp3', 'ogg', 'wav', 'flac'];
const IMAGE_EXTENSIONS = ['jpeg', 'jpg', 'png', 'gif'];
const VIDEO_EXTENSIONS = ['mp4', 'avi', 'mov'];
const DOCUMENT_EXTENSIONS = ['pdf', 'docx', 'txt'];

export const constants = {
  AUDIO_EXTENSIONS,
  IMAGE_EXTENSIONS,
  VIDEO_EXTENSIONS,
  DOCUMENT_EXTENSIONS,
};
const whitelist = ['localhost:5000,localhost:3001,localhost:3000'];

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('NOT AUTHORIZED'));
    }
  },
};

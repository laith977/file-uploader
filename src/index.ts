import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { responseFormatter } from './middlewares/responseFormatter';
import { errorHandler } from './middlewares/errorHandler';
import { UploadRouter } from './routers/upload.router';
import { corsOptions } from './constants';
dotenv.config();

const app = express();
const PORT = process.env.PORT;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors(corsOptions));
app.use(responseFormatter);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
const uploadRouterInstance = new UploadRouter();
app.use('/api', uploadRouterInstance.router);
app.use(errorHandler);
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the File Upload API',
  });
});
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

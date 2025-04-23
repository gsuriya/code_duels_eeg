import * as cors from 'cors';
import { Request, Response } from 'express';

const corsHandler = cors({ origin: true });

export const handleCors = (req: Request, res: Response) => {
  return new Promise((resolve, reject) => {
    corsHandler(req, res, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
}; 
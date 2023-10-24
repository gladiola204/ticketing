import express from 'express';
import 'express-async-errors';
import { errorHandler, NotFoundError, currentUser } from '@gladiola/common';
import cookieSession from 'cookie-session';
import { createChargeRouter } from './routes/new';
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();

export const app = express();
app.set('trust proxy', true);
app.use(
    cookieSession({
        signed: false,
        secure: false, //process.env.NODE_ENV !== 'test',
    })
)
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use(currentUser);

app.use(createChargeRouter);

app.all('*', () => {
    throw new NotFoundError();
})

app.use(errorHandler);
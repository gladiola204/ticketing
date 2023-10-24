import express from 'express';
import 'express-async-errors';
import { currentUserRouter } from './routes/current-user';
import { signinRouter } from './routes/signin';
import { signoutRouter } from './routes/signout';
import { signupRouter } from './routes/signup';
import { errorHandler, NotFoundError } from '@gladiola/common';
import cookieSession from 'cookie-session';

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

app.use(currentUserRouter);
app.use(signinRouter);
app.use(signupRouter);
app.use(signoutRouter);

app.all('*', () => {
    throw new NotFoundError();
})

app.use(errorHandler);
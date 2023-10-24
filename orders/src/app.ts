import express from 'express';
import 'express-async-errors';
import { errorHandler, NotFoundError, currentUser } from '@gladiola/common';
import cookieSession from 'cookie-session';
import { indexOrderRouter } from './routes';
import { showOrderRouter } from './routes/show';
import { newOrderRouter } from './routes/new';
import { deleteOrderRouter } from './routes/delete';

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

app.use(indexOrderRouter);
app.use(showOrderRouter);
app.use(newOrderRouter);
app.use(deleteOrderRouter);

app.all('*', () => {
    throw new NotFoundError();
})

app.use(errorHandler);
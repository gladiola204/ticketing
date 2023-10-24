import express from 'express';
import 'express-async-errors';
import { errorHandler, NotFoundError, currentUser } from '@gladiola/common';
import cookieSession from 'cookie-session';
import { createTicketRouter } from './routes/new';
import { showTicketRouter } from './routes/show';
import { indexTicketRouter } from './routes';
import { updateTicketRouter } from './routes/update';

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

app.use(createTicketRouter);
app.use(showTicketRouter);
app.use(indexTicketRouter);
app.use(updateTicketRouter);

app.all('*', () => {
    throw new NotFoundError();
})

app.use(errorHandler);
import request from 'supertest';
import { app } from '../../app';
import mongoose from 'mongoose';

const id = new mongoose.Types.ObjectId().toHexString();

it('returns a 404 if the ticket is not found', async() => {
    await request(app)
        .get(`/api/tickets/${id}`)
        .send()
        .expect(404);
});

it('returns the ticket if the ticket is found', async() => {
    const title = 'Milky Chance Concert';
    const price = 50;

    const createdTicket = await request(app)
        .post('/api/tickets')
        .set('Cookie', global.signin())
        .send({
            title, price
        })
        .expect(201);

    const ticket = await request(app)
        .get(`/api/tickets/${createdTicket.body.id}`)
        .send()
        .expect(200);

    expect(ticket.body.title).toEqual(title);
    expect(ticket.body.price).toEqual(price);
});
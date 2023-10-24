import request from 'supertest';
import { app } from '../../app';
import Ticket from '../../models/ticket';
import natsWrapper from '../../nats-wrapper';

const URL = '/api/tickets';

it('has a route handler listening to /api/tickets for post requests', async () => {
    const { status } = await request(app)
        .post(URL)
        .send({});
    
    expect(status).not.toEqual(404);
});

it('can only be acessed if the user is signed in', async () => {
    await request(app)
        .post(URL)
        .send({})
        .expect(401);
});

it('returns a status other than 401 if the user is signed in', async () => {
    const { status } = await request(app)
        .post(URL)
        .set('Cookie', global.signin())
        .send({});
    
    expect(status).not.toEqual(401);
});
const sendRequestWithBodyAndCookies = async(fields: {}) => {
    const { status } = await request(app)
    .post(URL)
    .set('Cookie', global.signin())
    .send({
        ...fields,
    });

    return { status };
};

it('returns an error if an invalid title is provided', async () => {
    const response1 = await sendRequestWithBodyAndCookies({ title: '', price: 10 });
    const response2 = await sendRequestWithBodyAndCookies({ price: 10 });

    expect(response1.status).toEqual(400);
    expect(response2.status).toEqual(400);
});

it('returns an error if an invalid price is provided', async () => {
    const response1 = await sendRequestWithBodyAndCookies({ title: 'title', price: -10 });
    const response2 = await sendRequestWithBodyAndCookies({ title: 'title' });

    expect(response1.status).toEqual(400);
    expect(response2.status).toEqual(400);
});

it('creates a ticket with valid inputs', async () => {
    // add in a check to make sure a ticket was saved
    let tickets = await Ticket.find({});
    expect(tickets.length).toEqual(0);

    const { status } = await sendRequestWithBodyAndCookies({ title: 'title', price: 10 });
    expect(status).toEqual(201);

    tickets = await Ticket.find({});
    expect(tickets.length).toEqual(1);
});

it('publishes an event', async() => {
    const { status } = await sendRequestWithBodyAndCookies({ title: 'title', price: 10 });
    expect(status).toEqual(201);

    expect(natsWrapper.client.publish).toHaveBeenCalled();
})
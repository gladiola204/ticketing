import request from 'supertest';
import { app } from '../../app';
import mongoose from 'mongoose';
import natsWrapper from '../../nats-wrapper';
import Ticket from '../../models/ticket';

const sendRequest = async (fields: {}, cookies = true, id = new mongoose.Types.ObjectId().toHexString()) => {
    const URL = `/api/tickets/${id}`;

    if (cookies === false) {
        const response = await request(app)
            .put(URL)
            .send({
                ...fields,
            });

        return response;
    }

    const response = await request(app)
        .put(URL)
        .set('Cookie', global.signin())
        .send({
            ...fields,
        });

    return response;
};

it('returns a 404 if the provided id does not exist', async () => {
    const { status } = await sendRequest({
        title: 'dsadsa',
        price: 20,
    });

    expect(status).toEqual(404);
});

it('returns a 401 if the user is not authenticated', async () => {
    const { status } = await sendRequest({
        title: 'dsda',
        price: 20,
    }, false);

    expect(status).toEqual(401);
});

it('returns a 401 if the user does not own the ticket', async () => {
    const response = await request(app)
        .post('/api/tickets')
        .set('Cookie', global.signin())
        .send({
            title: 'dsadsada',
            price: 20,
        });

    const { status } = await sendRequest({
        title: 'dsdsdasd',
        price: 30,
    }, true, response.body.id);

    expect(status).toEqual(401);
});

it('returns a 400 if the user provides an invalid title or price', async () => {
    const cookie = global.signin();

    const createdTicket = await request(app)
        .post('/api/tickets')
        .set('Cookie', cookie)
        .send({
            title: 'dsadsada',
            price: 20,
        });
    expect(createdTicket.status).toEqual(201);

    const response1 = await request(app)
        .put(`/api/tickets/${createdTicket.body.id}`)
        .set('Cookie', cookie)
        .send({
            title: '',
            price: 20
        });

    const response2 = await request(app)
        .put(`/api/tickets/${createdTicket.body.id}`)
        .set('Cookie', cookie)
        .send({
            title: 'dsadsdadsa',
            price: -20
        });

    expect(response1.status).toEqual(400);
    expect(response2.status).toEqual(400);
});

it('updates the ticket provided valid inputs', async () => {
    const cookie = global.signin();

    const createdTicket = await request(app)
        .post('/api/tickets')
        .set('Cookie', cookie)
        .send({
            title: 'dsadsada',
            price: 20,
        });

    await request(app)
        .put(`/api/tickets/${createdTicket.body.id}`)
        .set('Cookie', cookie)
        .send({
            title: 'new title',
            price: 35
        })
        .expect(200);

    const ticketResponse = await request(app)
        .get(`/api/tickets/${createdTicket.body.id}`)
        .send();
    expect(ticketResponse.body.title).toEqual('new title');
    expect(ticketResponse.body.price).toEqual(35);
});

it('publishes an event', async() => {
    const cookie = global.signin();

    const createdTicket = await request(app)
        .post('/api/tickets')
        .set('Cookie', cookie)
        .send({
            title: 'dsadsada',
            price: 20,
        });

    await request(app)
        .put(`/api/tickets/${createdTicket.body.id}`)
        .set('Cookie', cookie)
        .send({
            title: 'new title',
            price: 35
        })
        .expect(200);
        
    expect(natsWrapper.client.publish).toHaveBeenCalled();
});

it('rejects updates if the ticket is reserved', async() => {
    const cookie = global.signin();

    const createdTicket = await request(app)
        .post('/api/tickets')
        .set('Cookie', cookie)
        .send({
            title: 'dsadsada',
            price: 20,
        });

    await Ticket.findByIdAndUpdate(createdTicket.body.id, {
        orderId: new mongoose.Types.ObjectId().toHexString(),
    });

    await request(app)
        .put(`/api/tickets/${createdTicket.body.id}`)
        .set('Cookie', cookie)
        .send({
            title: 'new title',
            price: 35
        })
        .expect(400);
});
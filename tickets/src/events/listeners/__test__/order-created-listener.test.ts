import { OrderCreatedEvent, OrderStatus } from "@gladiola/common";
import { OrderCreatedListener } from "../order-created-listener";
import natsWrapper from "../../../nats-wrapper";
import Ticket from "../../../models/ticket";
import mongoose from 'mongoose';

const setup = async () => {
    // create an instance of the listener
    const listener = new OrderCreatedListener(natsWrapper.client);

    // create and save a ticket 
    const ticket = Ticket.build({
        title: 'concert',
        price: 10,
        userId: new mongoose.Types.ObjectId().toHexString(),
    });
    await ticket.save();

    // create a fake data event
    const data: OrderCreatedEvent['data'] = {
        id: new mongoose.Types.ObjectId().toHexString(),
        version: 0,
        status: OrderStatus.Created,
        ticket: {
            id: ticket.id,
            price: ticket.price,
        },
        expiresAt: 'asdsada',
        userId: new mongoose.Types.ObjectId().toHexString()
    };

    // create a fake message object
    // @ts-ignore
    const msg: Message = {
        ack: jest.fn()
    };

    return { listener, data, msg, ticket };
};

it('sets the orderId of the ticket', async() => {
    const { listener, data, msg, ticket} = await setup();

    // call the onMessage function with the data object + message object
    await listener.onMessage(data, msg);
    
    const updatedTicket = await Ticket.findById(ticket.id);
    expect(updatedTicket!.orderId).toEqual(data.id)


});

it('acks the message', async() => {
    const { listener, data, msg} = await setup();

    // call the onMessage function with the data object + message object
    await listener.onMessage(data, msg);

    // write assertions to make sure ack function is called
    expect(msg.ack).toHaveBeenCalled();
});

it('publishes a ticket updated event', async() => {
    const { listener, data, msg} = await setup();

    // call the onMessage function with the data object + message object
    await listener.onMessage(data, msg);

    expect(natsWrapper.client.publish).toHaveBeenCalled();

    const ticketUpdatedData = JSON.parse((natsWrapper.client.publish as jest.Mock).mock.calls[0][1]);
    expect(ticketUpdatedData.orderId).toEqual(data.id);
});

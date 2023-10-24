import { OrderCancelledEvent, OrderStatus } from "@gladiola/common";
import { OrderCancelledListener } from "../order-cancelled-listener";
import natsWrapper from "../../../nats-wrapper";
import Ticket from "../../../models/ticket";
import mongoose from 'mongoose';

const randomMongooseId = new mongoose.Types.ObjectId().toHexString();

const setup = async () => {
    // create an instance of the listener
    const listener = new OrderCancelledListener(natsWrapper.client);

    // create and save a ticket 
    const ticket = Ticket.build({
        title: 'concert',
        price: 10,
        userId: randomMongooseId,
    });
    ticket.set({ orderId: randomMongooseId });
    await ticket.save();

    // create a fake data event
    const data: OrderCancelledEvent['data'] = {
        id: randomMongooseId,
        version: 0,
        ticket: {
            id: ticket.id,
        },
    };

    // create a fake message object
    // @ts-ignore
    const msg: Message = {
        ack: jest.fn()
    };

    return { listener, data, msg, ticket };
};

it('update the ticket', async() => {
    const { listener, data, msg, ticket} = await setup();

    // call the onMessage function with the data object + message object
    await listener.onMessage(data, msg);
    
    const updatedTicket = await Ticket.findById(ticket.id);
    expect(updatedTicket!.orderId).not.toBeDefined();


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
    expect(ticketUpdatedData.orderId).not.toBeDefined();
});

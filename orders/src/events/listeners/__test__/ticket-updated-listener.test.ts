import { TicketUpdatedEvent } from "@gladiola/common";
import natsWrapper from "../../../nats-wrapper";
import mongoose from "mongoose";
import { Message } from "node-nats-streaming";
import { Ticket } from "../../../models/ticket";
import { TicketUpdatedListener } from "../ticket-updated-listener";

const setup = async () => {
    // create an instance of the listener
    const listener = new TicketUpdatedListener(natsWrapper.client);

    // create and save a ticket
    const ticket = Ticket.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        title: 'concert',
        price: 20,
    });

    await ticket.save();

    // create a fake data event
    const data: TicketUpdatedEvent['data'] = {
        id: ticket.id,
        version: ticket.version + 1,
        title: 'new concert',
        price: 10,
    };

    // create a fake message object
    // @ts-ignore
    const msg: Message = {
        ack: jest.fn()
    };

    return { listener, data, ticket, msg };
};

it('finds, updates and saves a ticket', async() => {
    const { msg, data, ticket, listener } = await setup();

    await listener.onMessage(data, msg);

    const updatedTicket = await Ticket.findById(ticket.id);

    expect(updatedTicket!.title).toEqual(data.title);
    expect(updatedTicket!.version).toEqual(data.version);
});

it('acks the message', async() => {
    const { msg, data, ticket, listener } = await setup();

    await listener.onMessage(data, msg);

    expect(msg.ack).toHaveBeenCalled();
});

it('does not call ack if the event has a skipped version number', async() => {
    const { msg, data, ticket, listener } = await setup();
    data.version = 10;

    try {
        await listener.onMessage(data, msg);
    } catch(err) {

    };

    expect(msg.ack).not.toHaveBeenCalled();
});
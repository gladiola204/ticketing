import { ExpirationCompleteEvent, OrderStatus } from "@gladiola/common";
import natsWrapper from "../../../nats-wrapper";
import mongoose from "mongoose";
import { Message } from "node-nats-streaming";
import { ExpirationCompleteListener } from "../expiration-complete-listener";
import Order from "../../../models/order";
import { Ticket } from "../../../models/ticket";

const setup = async () => {
    // create an instance of the listener
    const listener = new ExpirationCompleteListener(natsWrapper.client);

    const ticket = Ticket.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        title: 'concert',
        price: 20,
    });
    await ticket.save();

    const order = Order.build({
        userId: new mongoose.Types.ObjectId().toHexString(),
        status: OrderStatus.Created,
        expiresAt: new Date(),
        ticket,
    });
    await order.save();


    // create a fake data event
    const data: ExpirationCompleteEvent['data'] = {
        orderId: order.id
    };

    // create a fake message object
    // @ts-ignore
    const msg: Message = {
        ack: jest.fn()
    };

    return { listener, data, msg, order, ticket };
};

it('updates the order status to cancelled', async() => {
    const { listener, data, msg, order } = await setup();

    // call the onMessage function with the data object + message object
    await listener.onMessage(data, msg);

    // write assertions to make sure a ticket was updated
    const updatedOrder = await Order.findById(order.id);

    expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);
});

it('emit an OrderCancelled event', async() => {
    const { listener, data, msg, order } = await setup();

    // call the onMessage function with the data object + message object
    await listener.onMessage(data, msg);

    expect(natsWrapper.client.publish).toHaveBeenCalled();

    const eventData = JSON.parse((natsWrapper.client.publish as jest.Mock).mock.calls[0][1])
    expect(eventData.id).toEqual(order.id)
});

it('acks the message', async() => {
    const { listener, data, msg} = await setup();

    // call the onMessage function with the data object + message object
    await listener.onMessage(data, msg);

    // write assertions to make sure ack function is called
    expect(msg.ack).toHaveBeenCalled();
});
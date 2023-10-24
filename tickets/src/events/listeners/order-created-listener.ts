import { Listener, NotFoundError, OrderCreatedEvent, Subjects } from "@gladiola/common";
import { queueGroupName } from "./queue-group-name";
import { Message } from "node-nats-streaming";
import Ticket from "../../models/ticket";
import { TicketUpdatedPublisher } from "../publishers/ticket-updated-publisher";

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
    readonly subject = Subjects.OrderCreated;
    queueGroupName: string = queueGroupName;

    async onMessage(data: OrderCreatedEvent['data'], msg: Message) {
        const { ticket, id } = data;
        // Find the ticket that the order is reserving
        const reservedTicket = await Ticket.findById(ticket.id);

        // If no ticket, throw an error
        if (!reservedTicket) {
            throw new NotFoundError();
        };

        // Mark the ticket as being reserved by setting its orderId property
        reservedTicket.set({ orderId: id });

        // Save the ticket
        await reservedTicket.save();
        await new TicketUpdatedPublisher(this.client).publish({
            id: reservedTicket.id,
            version: reservedTicket.version,
            title: reservedTicket.title,
            price: reservedTicket.price,
            orderId: reservedTicket.orderId,
        });
        msg.ack()
    }
}
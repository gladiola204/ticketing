import { Listener, NotFoundError, OrderCancelledEvent, Subjects } from "@gladiola/common";
import { queueGroupName } from "./queue-group-name";
import { Message } from "node-nats-streaming";
import Ticket from "../../models/ticket";
import { TicketUpdatedPublisher } from "../publishers/ticket-updated-publisher";

export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
    readonly subject = Subjects.OrderCancelled;
    queueGroupName: string = queueGroupName;

    async onMessage(data: OrderCancelledEvent['data'], msg: Message) {
        const { ticket } = data;

        const reservedTicket = await Ticket.findById(ticket.id);

        // If no ticket, throw an error
        if (!reservedTicket) {
            throw new NotFoundError();
        };

        reservedTicket.set({ orderId: undefined });

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
import { Publisher, OrderCancelledEvent, Subjects } from "@gladiola/common";


export class OrderCancelledPublisher extends Publisher<OrderCancelledEvent> {
    readonly subject = Subjects.OrderCancelled;
}
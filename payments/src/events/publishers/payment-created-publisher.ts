import { PaymentCreatedEvent, Publisher, Subjects } from "@gladiola/common";


export class PaymentCreatedPublisher extends Publisher<PaymentCreatedEvent> {
    readonly subject = Subjects.PaymentCreated;
}
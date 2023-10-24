import { Publisher, Subjects, TicketUpdatedEvent } from '@gladiola/common';

export class TicketUpdatedPublisher extends Publisher<TicketUpdatedEvent> {
    readonly subject = Subjects.TicketUpdated;
}
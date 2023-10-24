import { ExpirationCompleteEvent, Publisher, Subjects } from "@gladiola/common";


export class ExpirationCompletePublisher extends Publisher<ExpirationCompleteEvent> {
    readonly subject = Subjects.ExpirationComplete;
}
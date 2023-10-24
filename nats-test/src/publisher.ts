import nats, { Stan } from 'node-nats-streaming';
import { Subjects, TicketCreatedEvent } from './listener';

console.clear();

const stan = nats.connect('ticketing', 'abc', {
    url: 'http://localhost:4222'
});

stan.on('connect', async() => {
    console.log('Publisher connected to NATS');

    const publisher = new TicketCreatedPublisher(stan);
    await publisher.publish({
        id: '123',
        title: 'dasd',
        price: 20,
    })
})

interface Event {
    subject: Subjects,
    data: any,
};

abstract class Publisher<T extends Event> {
    abstract subject: T['subject'];
    private client: Stan;

    constructor(client: Stan) {
        this.client = client;
    };

    publish(data: T['data']): Promise<void> {
        return new Promise((resolve, reject) => {
            this.client.publish(this.subject, JSON.stringify(data), (err) => {
                if(err) {
                    return reject(err);
                };
                resolve();
            });
        })
    }
};

class TicketCreatedPublisher extends Publisher<TicketCreatedEvent> {
    readonly subject = Subjects.TicketCreated;
}
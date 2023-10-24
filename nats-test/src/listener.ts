import nats, { Message, Stan } from 'node-nats-streaming';
import { randomBytes } from 'crypto';
console.clear();

const stan = nats.connect('ticketing', randomBytes(4).toString('hex'), {
    url: 'http://localhost:4222'
});

stan.on('connect', () => {
    console.log('Listener connected to NATS');

    stan.on('close', () => {
        console.log('NATS connection closed');
        process.exit();
    })
    
    new TicketCreatedListener(stan).listen();
});

process.on('SIGINT', () => stan.close());
process.on('SIGTERM', () => stan.close());

export enum Subjects {
    TicketCreated = 'ticket:created',
    OrderUpdated = 'order:updated',
};

interface Event {
    subject: Subjects,
    data: any,
};

abstract class Listener<T extends Event> {
    private client: Stan;
    abstract subject: T['subject'];
    abstract queueGroupName: string;
    protected ackWait = 5 * 1000;
    abstract onMessage(data: T['data'], msg: Message): void;

    constructor(client: Stan) {
        this.client = client;
    };

    subscriptionOptions() {
        return this.client
        .subscriptionOptions()
        .setDeliverAllAvailable()
        .setDurableName(this.queueGroupName)
        .setManualAckMode(true)
        .setAckWait(this.ackWait);
    }

    listen() {
        const subscription = this.client.subscribe(this.subject, this.queueGroupName, this.subscriptionOptions());

        subscription.on('message', (msg: Message) => {
            console.log(
                `Message received: ${this.subject} / ${this.queueGroupName}`
            )
            const parsedData = this.parseMessage(msg);
            this.onMessage(parsedData, msg);
        })
    };

    parseMessage(msg: Message) {
        const data = msg.getData();
        return typeof data === 'string'
        ? JSON.parse(data)
        : JSON.parse(data.toString('utf8'));
    }
};



export interface TicketCreatedEvent {
    subject: Subjects.TicketCreated;
    data: {
        id: string,
        title: string,
        price: number,
    }
};

class TicketCreatedListener extends Listener<TicketCreatedEvent> {
    readonly subject = Subjects.TicketCreated;
    queueGroupName = 'payment-service';
    onMessage(data: TicketCreatedEvent['data'], msg: nats.Message): void {
        console.log('Event data', data);

        msg.ack();
    }
};
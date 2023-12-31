import mongoose from 'mongoose';
import { OrderStatus } from '@gladiola/common';
import { TicketDoc } from './ticket';

export { OrderStatus };

interface OrderAttrs {
    userId: string;
    status: OrderStatus;
    expiresAt: Date;
    ticket: TicketDoc;
}

interface OrderDoc extends mongoose.Document {
    userId: string;
    status: OrderStatus;
    expiresAt: Date;
    ticket: TicketDoc;
    version: number,
}

interface OrderModel extends mongoose.Model<OrderDoc> {
    build(attrs: OrderAttrs): OrderDoc
};

const orderSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: Object.values(OrderStatus),
        default: OrderStatus.Created,
    },
    expiresAt: {
        type: Date,
    },
    ticket: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket',
        required: true,
    }
}, {
    toJSON: {
        transform(doc, ret)  {
            ret.id = ret._id;
            delete ret._id; 
        }
    }
});

orderSchema.statics.build = (attrs: OrderAttrs) => {
    return new Order(attrs);
};

orderSchema.set('versionKey', 'version');

orderSchema.pre('save', function() {
    if(this.get('version') === 0) {
        return;
    }
    // @ts-ignore
    this.$where = {
        version: this.get('version') - 1
    };
});

const Order = mongoose.model<OrderDoc, OrderModel>('Order', orderSchema);

export default Order;
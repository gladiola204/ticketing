import { BadRequestError, NotAuthorizedError, NotFoundError, requireAuth, validateRequest } from '@gladiola/common';
import { Router, Request, Response } from 'express';
import Ticket from '../models/ticket';
import { body } from 'express-validator';
import { TicketUpdatedPublisher } from '../events/publishers/ticket-updated-publisher';
import natsWrapper from '../nats-wrapper';


const router = Router();

router.put('/api/tickets/:id', requireAuth, [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required'),
    body('price')
        .isFloat({ gt: 0 })
        .withMessage('Price must be greater than 0')
], validateRequest, async(req: Request, res: Response) => {
    const ticket = await Ticket.findById(req.params.id);
    const { title, price } = req.body;
    
    if(!ticket) {
        throw new NotFoundError();
    };

    if(ticket.userId !== req.currentUser!.id) {
        throw new NotAuthorizedError();
    };

    if(ticket.orderId) {
        throw new BadRequestError('Cannot edit a reserved ticket')
    }

    ticket.set({
        title: title, 
        price: price,
    });

    await ticket.save();
    new TicketUpdatedPublisher(natsWrapper.client).publish({
        id: ticket.id,
        version: ticket.version,
        title: ticket.title,
        price: title.price,
    })

    res.send(ticket);
});

export { router as updateTicketRouter };
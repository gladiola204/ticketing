import Ticket from "../ticket"


it('implements optimistic concurrency control', async() => {
    // Create an instance of a ticket
    const ticket = Ticket.build({
        title: 'concert',
        price: 5,
        userId: '123',
    });

    // Save the ticket to the database
    await ticket.save();

    // Fetch the ticket twice
    const fetchedTicket1 = await Ticket.findById(ticket.id);
    const fetchedTicket2 = await Ticket.findById(ticket.id);

    // Make two separate changes to the tickets we fetched
    fetchedTicket1!.set({ price: 10 });
    fetchedTicket2!.set({ price: 15 });

    // Save the first fetched ticket
    await fetchedTicket1!.save();

    // Save the second fetched ticket
    try {
        await fetchedTicket2!.save();
    } catch(err) {
        return;
    };

    throw new Error("Should not reach this point");
});

it('increments the version number on multiple saves', async() => {
    const ticket = Ticket.build({
        title: 'concert',
        price: 5,
        userId: '123',
    });

    await ticket.save();
    expect(ticket.version).toEqual(0);

    await ticket.save();
    expect(ticket.version).toEqual(1);

    await ticket.save();
    expect(ticket.version).toEqual(2);
});
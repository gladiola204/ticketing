import Stripe from 'stripe';
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_KEY!, {
    apiVersion: '2023-10-16'
});

export default stripe
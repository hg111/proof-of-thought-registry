// src/lib/stripe.ts
import Stripe from "stripe";
import { stripeConfig } from "@/lib/config";


let _stripe: Stripe | null = null;

export const getStripe = () => {
  if (!_stripe) {
    _stripe = new Stripe(stripeConfig.secretKey, {
      apiVersion: "2024-06-20",
    });
  }
  return _stripe;
};
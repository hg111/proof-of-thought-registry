import Stripe from "stripe";
import { config } from "@/lib/config";

export const stripe = new Stripe(config.stripeSecretKey, { apiVersion: "2024-06-20" });

import DodoPayments from "dodopayments"
import { env } from "~/env"

// Use live mode for production, test_mode for development
const isProduction = process.env.NODE_ENV === "production"

// Use live API key in production, test key in development
const apiKey =
  isProduction && env.DODO_PAYMENTS_LIVE_API_KEY
    ? env.DODO_PAYMENTS_LIVE_API_KEY
    : env.DODO_PAYMENTS_API_KEY

export const dodo = new DodoPayments({
  bearerToken: apiKey,
  environment: isProduction ? "live_mode" : "test_mode",
})

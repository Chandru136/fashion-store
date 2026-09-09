// Fail closed: use persisted orders and the Razorpay verification flow.
export class OnlinePaymentProvider {
  async processPayment(_amount: number, _orderId: string): Promise<never> {
    throw new Error("Use the Razorpay checkout and verification flow for online payments.");
  }
}

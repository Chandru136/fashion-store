import { OnlinePaymentProvider } from "./online.provider";

export class PaymentService {
  private onlineProvider = new OnlinePaymentProvider();

  async processOrderPayment(method: "ONLINE", amount: number, orderId: string) {
    if (method !== "ONLINE") throw new Error("Only online payment is supported.");
    return this.onlineProvider.processPayment(amount, orderId);
  }
}

export const paymentService = new PaymentService();

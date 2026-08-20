import { CODPaymentProvider } from "./cod.provider";
import { OnlinePaymentProvider } from "./online.provider";

export class PaymentService {
  private codProvider = new CODPaymentProvider();
  private onlineProvider = new OnlinePaymentProvider();

  async processOrderPayment(method: "COD" | "ONLINE", amount: number, orderId: string) {
    if (method === "COD") {
      return this.codProvider.processPayment(amount, orderId);
    } else {
      return this.onlineProvider.processPayment(amount, orderId);
    }
  }
}

export const paymentService = new PaymentService();

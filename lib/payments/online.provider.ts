import { PaymentResponse } from "./cod.provider";

export class OnlinePaymentProvider {
  async processPayment(amount: number, orderId: string): Promise<PaymentResponse> {
    // Simulated Secure Gateway Payment Validation
    const mockTxnId = `ONLINE-ARN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      success: true,
      transactionId: mockTxnId,
      provider: "ONLINE_MOCK",
      status: "PAID",
      message: "Online payment authorized and verified successfully via Secure Gateway.",
    };
  }

  async verifyWebhookSignature(payload: string, signature: string): Promise<boolean> {
    // Webhook signature verification abstraction
    return true;
  }
}

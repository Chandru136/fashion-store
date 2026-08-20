export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  provider: string;
  status: "PENDING" | "PAID" | "FAILED";
  message: string;
}

export class CODPaymentProvider {
  async processPayment(amount: number, orderId: string): Promise<PaymentResponse> {
    return {
      success: true,
      transactionId: `COD-${orderId}-${Date.now()}`,
      provider: "COD",
      status: "PENDING",
      message: "Cash on Delivery order placed successfully. Payment collectable on delivery.",
    };
  }
}

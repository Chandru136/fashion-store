// Plain HTML string builders — no external template engine needed for
// emails this simple. Inline styles throughout since most email clients
// strip <style> blocks or ignore external CSS.

const WINE = "#7a1f3d";
const GOLD = "#c9a227";
const IVORY = "#fdfaf5";

function emailShell(bodyHtml: string): string {
  return `
  <div style="background:${IVORY}; padding:32px 16px; font-family: Georgia, 'Times New Roman', serif;">
    <div style="max-width:520px; margin:0 auto; background:#ffffff; border:1px solid ${GOLD}; border-radius:8px; overflow:hidden;">
      <div style="background:${WINE}; padding:20px; text-align:center;">
        <span style="color:${GOLD}; font-size:20px; font-weight:bold; letter-spacing:2px;">SUDHA COLLECTIONS</span>
      </div>
      <div style="padding:28px;">
        ${bodyHtml}
      </div>
      <div style="padding:16px 28px; background:#f7f3ea; text-align:center; font-size:11px; color:#888;">
        Sudha Collections — Heritage Silks & Ethnic Wear
      </div>
    </div>
  </div>`;
}

export function welcomeEmailHtml(name: string): string {
  return emailShell(`
    <h2 style="color:${WINE}; margin-top:0;">Welcome, ${name}!</h2>
    <p style="color:#444; line-height:1.6; font-size:14px;">
      Thank you for joining Sudha Collections. Your account has been created successfully,
      and you now have access to exclusive collections, order tracking, and member privileges.
    </p>
    <p style="color:#444; line-height:1.6; font-size:14px;">
      Explore our latest arrivals and start building your heritage wardrobe today.
    </p>
  `);
}

interface OrderEmailItem {
  productName: string;
  sku: string;
  quantity: number;
  totalPrice: number;
}

interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  status: string;
  total: number;
  trackingNumber?: string | null;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  items: OrderEmailItem[];
}

function itemsTableHtml(items: OrderEmailItem[]): string {
  const rows = items
    .map(
      (item) => `
    <tr>
      <td style="padding:8px 0; border-bottom:1px solid #eee; font-size:13px; color:#333;">${item.productName}<br/><span style="color:#999; font-size:11px;">SKU: ${item.sku} • Qty: ${item.quantity}</span></td>
      <td style="padding:8px 0; border-bottom:1px solid #eee; font-size:13px; color:#333; text-align:right;">₹${item.totalPrice.toLocaleString("en-IN")}</td>
    </tr>`
    )
    .join("");
  return `<table style="width:100%; border-collapse:collapse; margin:16px 0;">${rows}</table>`;
}

export function orderConfirmationHtml(order: OrderEmailData): string {
  return emailShell(`
    <h2 style="color:${WINE}; margin-top:0;">Thank you for your order, ${order.customerName}!</h2>
    <p style="color:#444; line-height:1.6; font-size:14px;">
      We've received your order and it's being prepared with care.
    </p>
    <p style="font-size:14px; color:#333;"><strong>Order #${order.orderNumber}</strong></p>
    ${itemsTableHtml(order.items)}
    <p style="font-size:15px; font-weight:bold; color:${WINE}; text-align:right;">Total: ₹${order.total.toLocaleString("en-IN")}</p>
    <div style="margin-top:20px; padding:14px; background:#f7f3ea; border-radius:6px; font-size:13px; color:#555;">
      <strong style="color:${WINE};">Delivery Address</strong><br/>
      ${order.shippingAddress}, ${order.shippingCity}, ${order.shippingState} - ${order.shippingPincode}
    </div>
  `);
}

export function orderStatusUpdateHtml(order: OrderEmailData): string {
  const statusLabel = order.status.replace(/_/g, " ");
  return emailShell(`
    <h2 style="color:${WINE}; margin-top:0;">Your order is now ${statusLabel}</h2>
    <p style="color:#444; line-height:1.6; font-size:14px;">
      Hi ${order.customerName}, here's an update on order <strong>#${order.orderNumber}</strong>.
    </p>
    <p style="font-size:14px;">
      <span style="display:inline-block; padding:6px 14px; background:${WINE}; color:${GOLD}; border-radius:4px; font-weight:bold; font-size:12px; letter-spacing:1px;">${statusLabel}</span>
    </p>
    ${order.trackingNumber ? `<p style="font-size:13px; color:#555;">Tracking Number: <strong>${order.trackingNumber}</strong></p>` : ""}
    ${itemsTableHtml(order.items)}
  `);
}

export function adminNewOrderHtml(order: OrderEmailData): string {
  return emailShell(`
    <h2 style="color:${WINE}; margin-top:0;">New Order Received</h2>
    <p style="font-size:14px; color:#333;">
      <strong>Order #${order.orderNumber}</strong> from ${order.customerName}
    </p>
    ${itemsTableHtml(order.items)}
    <p style="font-size:15px; font-weight:bold; color:${WINE}; text-align:right;">Total: ₹${order.total.toLocaleString("en-IN")}</p>
    <div style="margin-top:20px; padding:14px; background:#f7f3ea; border-radius:6px; font-size:13px; color:#555;">
      <strong style="color:${WINE};">Ship To</strong><br/>
      ${order.shippingAddress}, ${order.shippingCity}, ${order.shippingState} - ${order.shippingPincode}
    </div>
  `);
}

import type { Order } from '@/types';

interface TemplateParams {
  order: Order;
  trackingNumber: string;
  carrier: string;
}

export function renderShippingUpdateEmailEn({
  order,
  trackingNumber,
  carrier,
}: TemplateParams): string {
  const shippingAddress = order.shipping_address;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Order Shipped</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f8fafc; font-family: 'Segoe UI', Arial, sans-serif; color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:16px; padding:32px; box-shadow:0 10px 30px rgba(15,23,42,0.06);">
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <div style="width:56px; height:56px; border-radius:28px; background:#0ea5e9; display:flex; align-items:center; justify-content:center; margin-bottom:16px;">
                  <span style="font-size:28px; color:#ffffff;">📦</span>
                </div>
                <h1 style="margin:0; font-size:24px;">Your order has shipped!</h1>
                <p style="margin:8px 0 0; color:#475569;">Your package is on its way and will arrive soon.</p>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:24px;">
                <div style="padding:16px; border-radius:12px; background:#f1f5f9;">
                  <p style="margin:0; color:#475569;">Order Number</p>
                  <p style="margin:4px 0 0; font-weight:600; font-size:18px;">${order.order_number}</p>
                  <p style="margin:12px 0 0; color:#475569;">Tracking Number</p>
                  <p style="margin:4px 0 0; font-weight:600; font-size:18px;">${trackingNumber}</p>
                  <p style="margin:12px 0 0; color:#475569;">Carrier: ${carrier}</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:24px;">
                <h2 style="font-size:18px; margin-bottom:12px;">Shipping To</h2>
                <p style="margin:4px 0; color:#0f172a;"><strong>${shippingAddress.recipient_name}</strong></p>
                <p style="margin:4px 0; color:#475569;">${shippingAddress.address_line1}</p>
                ${
                  shippingAddress.address_line2
                    ? `<p style="margin:4px 0; color:#475569;">${shippingAddress.address_line2}</p>`
                    : ''
                }
                <p style="margin:4px 0; color:#475569;">${shippingAddress.city}, ${shippingAddress.governorate}</p>
                ${
                  shippingAddress.postal_code
                    ? `<p style="margin:4px 0; color:#475569;">${shippingAddress.postal_code}</p>`
                    : ''
                }
                ${
                  shippingAddress.phone
                    ? `<p style="margin:4px 0; color:#475569;">Phone: ${shippingAddress.phone}</p>`
                    : ''
                }
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:24px;">
                <div style="padding:16px; border-radius:12px; background:#f1f5f9;">
                  <p style="margin:0; color:#475569;">Questions about your order?</p>
                  <p style="margin:4px 0 0; color:#475569;">Contact us at <a href="mailto:support@fishweb.iq" style="color:#0ea5e9;">support@fishweb.iq</a></p>
                </div>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-top:16px; color:#94a3b8; font-size:12px;">
                © ${new Date().getFullYear()} FISH WEB. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

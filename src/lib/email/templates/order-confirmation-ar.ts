import type { Order, OrderItem } from '@/types';

interface TemplateParams {
  order: Order;
  items: OrderItem[];
  formatAmount: (value: number) => string;
  deliveryEstimate: string | null;
}

export function renderOrderConfirmationEmailAr({
  order,
  items,
  formatAmount,
  deliveryEstimate,
}: TemplateParams): string {
  const shippingAddress = order.shipping_address;

  const itemsRows = items
    .map(
      (item) => `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
            <strong style="display:block; color:#0f172a;">${item.product_snapshot.name}</strong>
            <span style="font-size: 12px; color:#475569;">الكمية: ${item.quantity}</span>
          </td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; text-align:left; color:#0f172a;">
            ${formatAmount(item.subtotal)}
          </td>
        </tr>
      `
    )
    .join('');

  const deliveryText = deliveryEstimate
    ? `<p style="margin: 4px 0; color:#475569;">التوصيل المتوقع: ${deliveryEstimate}</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>تأكيد الطلب</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f8fafc; font-family: 'Tahoma', 'Arial', sans-serif; color:#0f172a; direction:rtl;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:16px; padding:32px; box-shadow:0 10px 30px rgba(15,23,42,0.06); direction:rtl;">
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <div style="width:56px; height:56px; border-radius:28px; background:#0ea5e9; display:flex; align-items:center; justify-content:center; margin-bottom:16px;">
                  <span style="font-size:28px; color:#ffffff;">✓</span>
                </div>
                <h1 style="margin:0; font-size:24px;">شكراً لطلبك!</h1>
                <p style="margin:8px 0 0; color:#475569;">نقوم الآن بتحضير طلبك وسنخبرك عند الشحن.</p>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:24px;">
                <div style="padding:16px; border-radius:12px; background:#f1f5f9;">
                  <p style="margin:0; color:#475569;">رقم الطلب</p>
                  <p style="margin:4px 0 0; font-weight:600; font-size:18px;">${order.order_number}</p>
                  <p style="margin:12px 0 0; color:#475569;">تاريخ الطلب: ${new Date(order.created_at).toLocaleDateString(
                    'ar-IQ'
                  )}</p>
                  ${deliveryText}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:24px;">
                <h2 style="font-size:18px; margin-bottom:12px;">ملخص الطلب</h2>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${itemsRows}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:6px 0; color:#475569;">المجموع الفرعي</td>
                    <td style="padding:6px 0; text-align:left; color:#0f172a;">${formatAmount(
                      order.subtotal
                    )}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0; color:#475569;">الشحن</td>
                    <td style="padding:6px 0; text-align:left; color:#0f172a;">${
                      order.shipping_cost === 0
                        ? 'مجاني'
                        : formatAmount(order.shipping_cost)
                    }</td>
                  </tr>
                  ${
                    order.discount > 0
                      ? `<tr>
                          <td style="padding:6px 0; color:#475569;">الخصم</td>
                          <td style="padding:6px 0; text-align:left; color:#16a34a;">-${formatAmount(
                            order.discount
                          )}</td>
                        </tr>`
                      : ''
                  }
                  ${
                    order.loyalty_discount > 0
                      ? `<tr>
                          <td style="padding:6px 0; color:#475569;">خصم النقاط</td>
                          <td style="padding:6px 0; text-align:left; color:#16a34a;">-${formatAmount(
                            order.loyalty_discount
                          )}</td>
                        </tr>`
                      : ''
                  }
                  ${
                    order.loyalty_points_used > 0
                      ? `<tr>
                          <td style="padding:6px 0; color:#475569;">النقاط المستبدلة</td>
                          <td style="padding:6px 0; text-align:left; color:#0f172a;">${order.loyalty_points_used}</td>
                        </tr>`
                      : ''
                  }
                  <tr>
                    <td style="padding:12px 0; font-weight:600;">الإجمالي</td>
                    <td style="padding:12px 0; text-align:left; font-weight:600;">${formatAmount(
                      order.total
                    )}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:24px;">
                <h2 style="font-size:18px; margin-bottom:12px;">عنوان الشحن</h2>
                <p style="margin:4px 0; color:#0f172a;"><strong>${
                  shippingAddress.recipient_name
                }</strong></p>
                <p style="margin:4px 0; color:#475569;">${shippingAddress.address_line1}</p>
                ${
                  shippingAddress.address_line2
                    ? `<p style="margin:4px 0; color:#475569;">${shippingAddress.address_line2}</p>`
                    : ''
                }
                <p style="margin:4px 0; color:#475569;">${shippingAddress.city}، ${
                  shippingAddress.governorate
                }</p>
                ${
                  shippingAddress.postal_code
                    ? `<p style="margin:4px 0; color:#475569;">${shippingAddress.postal_code}</p>`
                    : ''
                }
                ${
                  shippingAddress.phone
                    ? `<p style="margin:4px 0; color:#475569;">الهاتف: ${shippingAddress.phone}</p>`
                    : ''
                }
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:24px;">
                <h2 style="font-size:18px; margin-bottom:12px;">طريقة الدفع</h2>
                <p style="margin:4px 0; color:#475569;">${
                  order.payment_method === 'cod'
                    ? 'الدفع عند الاستلام'
                    : order.payment_method
                }</p>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:24px;">
                <div style="padding:16px; border-radius:12px; background:#f1f5f9;">
                  <p style="margin:0; color:#475569;">تحتاج مساعدة؟</p>
                  <p style="margin:4px 0 0; color:#475569;">تواصل مع فريق الدعم عبر <a href="mailto:support@fishweb.iq" style="color:#0ea5e9;">support@fishweb.iq</a></p>
                </div>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-top:16px; color:#94a3b8; font-size:12px;">
                © ${new Date().getFullYear()} FISH WEB. جميع الحقوق محفوظة.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

import type { Order } from '@/types';

interface TemplateParams {
  order: Order;
  trackingNumber: string;
  carrier: string;
}

export function renderShippingUpdateEmailAr({
  order,
  trackingNumber,
  carrier,
}: TemplateParams): string {
  const shippingAddress = order.shipping_address;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>تم شحن الطلب</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f8fafc; font-family: 'Segoe UI', Arial, sans-serif; color:#0f172a; direction:rtl;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:16px; padding:32px; box-shadow:0 10px 30px rgba(15,23,42,0.06);">
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <div style="width:56px; height:56px; border-radius:28px; background:#0ea5e9; display:flex; align-items:center; justify-content:center; margin-bottom:16px;">
                  <span style="font-size:28px; color:#ffffff;">📦</span>
                </div>
                <h1 style="margin:0; font-size:24px;">تم شحن طلبك!</h1>
                <p style="margin:8px 0 0; color:#475569;">طردك في الطريق وسيصل قريبًا.</p>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:24px;">
                <div style="padding:16px; border-radius:12px; background:#f1f5f9;">
                  <p style="margin:0; color:#475569;">رقم الطلب</p>
                  <p style="margin:4px 0 0; font-weight:600; font-size:18px;">${order.order_number}</p>
                  <p style="margin:12px 0 0; color:#475569;">رقم التتبع</p>
                  <p style="margin:4px 0 0; font-weight:600; font-size:18px;">${trackingNumber}</p>
                  <p style="margin:12px 0 0; color:#475569;">شركة الشحن: ${carrier}</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:24px;">
                <h2 style="font-size:18px; margin-bottom:12px;">الشحن إلى</h2>
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
                    ? `<p style="margin:4px 0; color:#475569;">الهاتف: ${shippingAddress.phone}</p>`
                    : ''
                }
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:24px;">
                <div style="padding:16px; border-radius:12px; background:#f1f5f9;">
                  <p style="margin:0; color:#475569;">هل لديك أسئلة حول طلبك؟</p>
                  <p style="margin:4px 0 0; color:#475569;">تواصل معنا على <a href="mailto:support@fishweb.iq" style="color:#0ea5e9;">support@fishweb.iq</a></p>
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

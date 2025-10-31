import type { Product } from '@/types';

interface TemplateParams {
  product: Product;
  productUrl: string;
  formatAmount: (value: number) => string;
}

export function renderStockAlertEmailAr({
  product,
  productUrl,
  formatAmount,
}: TemplateParams): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>المنتج متوفر الآن</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f8fafc; font-family: 'Segoe UI', Arial, sans-serif; color:#0f172a; direction:rtl;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:16px; padding:32px; box-shadow:0 10px 30px rgba(15,23,42,0.06);">
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <div style="width:56px; height:56px; border-radius:28px; background:#16a34a; display:flex; align-items:center; justify-content:center; margin-bottom:16px;">
                  <span style="font-size:28px; color:#ffffff;">🔔</span>
                </div>
                <h1 style="margin:0; font-size:24px;">أخبار سارة! المنتج متوفر الآن</h1>
                <p style="margin:8px 0 0; color:#475569;">المنتج الذي تريده أصبح متاحًا الآن.</p>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="120" style="padding-left:16px; vertical-align:top;">
                      <img src="${product.thumbnail}" alt="${product.name}" style="width:120px; height:120px; border-radius:8px; object-fit:cover;" />
                    </td>
                    <td style="vertical-align:top;">
                      <h2 style="margin:0 0 8px 0; font-size:18px;">${product.name}</h2>
                      <p style="margin:4px 0; color:#475569; font-size:14px;">${product.brand}</p>
                      <p style="margin:8px 0 0; font-size:20px; font-weight:600; color:#0ea5e9;">${formatAmount(product.price)}</p>
                      ${
                        product.originalPrice && product.originalPrice > product.price
                          ? `<p style="margin:4px 0 0; font-size:14px; color:#94a3b8; text-decoration:line-through;">${formatAmount(product.originalPrice)}</p>`
                          : ''
                      }
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <a href="${productUrl}" style="display:inline-block; padding:12px 32px; background:#0ea5e9; color:#ffffff; text-decoration:none; border-radius:8px; font-weight:600;">
                  تسوق الآن
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:24px;">
                <div style="padding:16px; border-radius:12px; background:#fef3c7; border-right:4px solid #f59e0b;">
                  <p style="margin:0; color:#92400e; font-weight:600;">⚡ الكمية محدودة</p>
                  <p style="margin:4px 0 0; color:#92400e; font-size:14px;">اطلب قريبًا لتأمين منتجك قبل نفاد الكمية مرة أخرى!</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:24px;">
                <div style="padding:16px; border-radius:12px; background:#f1f5f9;">
                  <p style="margin:0; color:#475569;">هل تحتاج مساعدة؟</p>
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

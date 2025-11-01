interface NewsletterWelcomeParams {
  email: string;
  unsubscribeToken?: string;
}

/**
 * Newsletter welcome email template (English)
 */
export function renderNewsletterWelcomeEmailEn(params: NewsletterWelcomeParams): string {
  const { email, unsubscribeToken } = params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? '';
  const unsubscribeUrl = unsubscribeToken
    ? `${baseUrl}/newsletter/unsubscribe?email=${encodeURIComponent(email)}&token=${encodeURIComponent(unsubscribeToken)}`
    : `${baseUrl}/newsletter/unsubscribe`;
  const preferencesUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/account?tab=settings`;
  const productsUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/products`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to FISH WEB Newsletter</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                                🐠 Welcome to FISH WEB!
                            </h1>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; color: #1e293b; font-size: 24px;">
                                Thanks for subscribing!
                            </h2>
                            <p style="margin: 0 0 20px 0; color: #475569; font-size: 16px; line-height: 1.6;">
                                You'll now receive updates on new products, special offers, and expert aquarium tips delivered straight to your inbox.
                            </p>

                            <div style="background-color: #f1f5f9; border-left: 4px solid #06b6d4; padding: 20px; margin: 30px 0; border-radius: 4px;">
                                <h3 style="margin: 0 0 15px 0; color: #1e293b; font-size: 18px;">
                                    What to Expect:
                                </h3>
                                <ul style="margin: 0; padding: 0 0 0 20px; color: #475569; font-size: 15px; line-height: 1.8;">
                                    <li>New product announcements</li>
                                    <li>Exclusive discounts and flash sales</li>
                                    <li>Expert tips and care guides</li>
                                    <li>Early access to special offers</li>
                                </ul>
                            </div>

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${productsUrl}" style="display: inline-block; background-color: #06b6d4; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                                            Start Shopping
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 30px 0 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                                Have questions? Reply to this email or visit our support page. We're here to help!
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0 0 10px 0; color: #64748b; font-size: 13px;">
                                FISH WEB - Your Complete Aquarium Solution in Iraq
                            </p>
                            <p style="margin: 0 0 15px 0; color: #94a3b8; font-size: 12px;">
                                Baghdad, Iraq
                            </p>
                            <p style="margin: 0; font-size: 12px;">
                                <a href="${preferencesUrl}?email=${encodeURIComponent(email)}" style="color: #06b6d4; text-decoration: none;">Manage Preferences</a>
                                <span style="color: #cbd5e1; margin: 0 8px;">|</span>
                                <a href="${unsubscribeUrl}" style="color: #64748b; text-decoration: none;">Unsubscribe</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `.trim();
}

'use server';

import { randomBytes } from 'crypto';
import { eq, and, gt } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';

import { db } from '@/server/db';
import { users, passwordResetTokens } from '@/shared/schema';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'orders@fishweb.iq';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://fishweb.iq';

/**
 * Request a password reset - sends email with reset link
 */
export async function requestPasswordResetAction(formData: FormData) {
  try {
    const email = formData.get('email') as string;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return {
        success: false,
        message: 'auth.errors.invalidEmail',
      };
    }

    // Find user by email
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    // Always return success to prevent email enumeration
    if (!user) {
      return {
        success: true,
        message: 'auth.passwordReset.emailSent',
      };
    }

    // Generate reset token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save token to database
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt,
      used: false,
    });

    // Create reset link
    const resetLink = `${SITE_URL}/ar/auth/reset-password?token=${token}`;

    // Send email
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: 'إعادة تعيين كلمة المرور - FISH WEB',
        html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
      direction: rtl;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #0E8FA8 0%, #0a7289 100%);
      padding: 40px 20px;
      text-align: center;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .content p {
      color: #333;
      line-height: 1.8;
      font-size: 16px;
      margin: 0 0 20px 0;
    }
    .button {
      display: inline-block;
      padding: 16px 40px;
      background: #0E8FA8;
      color: white !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      text-align: center;
    }
    .button:hover {
      background: #0a7289;
    }
    .footer {
      background: #f9f9f9;
      padding: 30px;
      text-align: center;
      color: #666;
      font-size: 14px;
      border-top: 1px solid #eee;
    }
    .warning {
      background: #fff3cd;
      border-right: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 6px;
      color: #856404;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🐠 FISH WEB</h1>
    </div>
    <div class="content">
      <h2 style="color: #0E8FA8; margin-top: 0;">إعادة تعيين كلمة المرور</h2>
      <p>مرحباً،</p>
      <p>تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك. انقر على الزر أدناه لإنشاء كلمة مرور جديدة:</p>
      
      <div style="text-align: center;">
        <a href="${resetLink}" class="button">إعادة تعيين كلمة المرور</a>
      </div>

      <div class="warning">
        <strong>⚠️ تنويه هام:</strong> هذا الرابط صالح لمدة ساعة واحدة فقط.
      </div>

      <p>إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذه الرسالة. حسابك آمن تماماً.</p>
      
      <p style="color: #999; font-size: 14px; margin-top: 30px;">
        إذا لم يعمل الزر أعلاه، يمكنك نسخ الرابط التالي ولصقه في متصفحك:<br>
        <a href="${resetLink}" style="color: #0E8FA8; word-break: break-all;">${resetLink}</a>
      </p>
    </div>
    <div class="footer">
      <p>شكراً لاختيارك FISH WEB 🐠</p>
      <p style="margin: 10px 0 0 0;">
        <a href="${SITE_URL}" style="color: #0E8FA8; text-decoration: none;">زيارة الموقع</a> |
        <a href="${SITE_URL}/ar/account" style="color: #0E8FA8; text-decoration: none;">حسابي</a>
      </p>
    </div>
  </div>
</body>
</html>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Continue anyway - token is saved
    }

    return {
      success: true,
      message: 'auth.passwordReset.emailSent',
    };
  } catch (error) {
    console.error('Password reset request error:', error);
    return {
      success: false,
      message: 'auth.errors.serverError',
    };
  }
}

/**
 * Verify if reset token is valid
 */
export async function verifyResetTokenAction(token: string) {
  try {
    if (!token) {
      return { valid: false, message: 'auth.passwordReset.invalidToken' };
    }

    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, false),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!resetToken) {
      return { valid: false, message: 'auth.passwordReset.invalidToken' };
    }

    return { valid: true, userId: resetToken.userId };
  } catch (error) {
    console.error('Token verification error:', error);
    return { valid: false, message: 'auth.errors.serverError' };
  }
}

/**
 * Reset password with valid token
 */
export async function resetPasswordAction(formData: FormData) {
  try {
    const token = formData.get('token') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // Validate inputs
    if (!token || !password || !confirmPassword) {
      return {
        success: false,
        message: 'auth.errors.missingFields',
      };
    }

    if (password !== confirmPassword) {
      return {
        success: false,
        message: 'auth.errors.passwordMismatch',
      };
    }

    if (password.length < 8) {
      return {
        success: false,
        message: 'auth.errors.passwordTooShort',
      };
    }

    // Verify token
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, false),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!resetToken) {
      return {
        success: false,
        message: 'auth.passwordReset.invalidToken',
      };
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update user password
    await db.update(users).set({ passwordHash }).where(eq(users.id, resetToken.userId));

    // Mark token as used
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, resetToken.id));

    return {
      success: true,
      message: 'auth.passwordReset.success',
    };
  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      message: 'auth.errors.serverError',
    };
  }
}

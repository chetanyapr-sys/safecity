import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailOptions {
  to: string;
  subject: string;
  heading: string;
  message: string;
  details?: { label: string; value: string }[];
  actionUrl?: string;
  actionLabel?: string;
}

export const sendEmail = async ({
  to,
  subject,
  heading,
  message,
  details = [],
  actionUrl,
  actionLabel = "View Details",
}: EmailOptions) => {
  try {
    const detailsHtml = details
      .map(
        (d) => `
        <tr>
          <td style="padding: 6px 0; color: #888; font-size: 13px;">${d.label}</td>
          <td style="padding: 6px 0; color: #fff; font-size: 13px; font-weight: 600; text-align: right;">${d.value}</td>
        </tr>
      `
      )
      .join("");

    const buttonHtml = actionUrl
      ? `
        <table role="presentation" style="margin: 24px 0;">
          <tr>
            <td style="border-radius: 8px; background: #3b82f6;">
              <a href="${actionUrl}" style="display: inline-block; padding: 12px 24px; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600;">
                ${actionLabel}
              </a>
            </td>
          </tr>
        </table>
      `
      : "";

    const { error } = await resend.emails.send({
      from: "SafeCity <onboarding@resend.dev>",
      to,
            replyTo: process.env.EMAIL_USER || "",
      subject,
      text: message,
      html: `
        <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; background: #0a0a0a; padding: 32px 16px;">
          <div style="max-width: 480px; margin: 0 auto; background: #111111; border: 1px solid #262626; border-radius: 12px; overflow: hidden;">
            
            <div style="padding: 24px 28px; border-bottom: 1px solid #262626; display: flex; align-items: center;">
              <span style="color: #3b82f6; font-size: 18px; font-weight: 700;">🛡️ SafeCity</span>
            </div>

            <div style="padding: 28px;">
              <h2 style="color: #ffffff; font-size: 18px; margin: 0 0 12px 0;">${heading}</h2>
              <p style="color: #d4d4d4; font-size: 14px; line-height: 1.6; margin: 0;">${message}</p>

              ${
                details.length > 0
                  ? `<table role="presentation" width="100%" style="margin-top: 20px; border-top: 1px solid #262626; padding-top: 12px;">${detailsHtml}</table>`
                  : ""
              }

              ${buttonHtml}
            </div>

            <div style="padding: 16px 28px; border-top: 1px solid #262626;">
              <p style="color: #666; font-size: 11px; margin: 0;">
                This is an automated notification from SafeCity. You're receiving this because of activity related to your account.
              </p>
            </div>

          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Email sending failed:", error);
    } else {
      console.log("Email sent to", to);
    }
  } catch (error) {
    console.error("Email sending failed:", error);
  }
};
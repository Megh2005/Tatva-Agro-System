import { transporter } from "@/lib/mailer";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function translateEmailContent(
  subject: string,
  html: string,
  targetLang: string
): Promise<{ subject: string; html: string }> {
  if (!targetLang || targetLang === "en") {
    return { subject, html };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[Email Translation] GEMINI_API_KEY is not configured. Sending in English.");
    return { subject, html };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

    const langMap: Record<string, string> = {
      hi: "Hindi",
      mr: "Marathi",
      ta: "Tamil",
      bn: "Bengali",
    };
    const targetLangName = langMap[targetLang] || targetLang;

    const prompt = `
You are an expert translator. Translate the following email subject and HTML content into "${targetLangName}".

CRITICAL INSTRUCTIONS:
1. Translate all natural language visible text into "${targetLangName}".
2. Do NOT alter, translate, or delete any HTML tags, structural elements, inline styles, CSS classes, attributes, or variable placeholders (like user names, dates, amounts, percentages, claim IDs, or dynamic values). Leave variables like "${process.env.SMTP_USER}", numbers, claim codes (e.g. #ID), and inline styles EXACTLY as they are.
3. Return ONLY a valid JSON object matching the JSON schema below. No markdown wrappers, no backticks, no code block annotations (do NOT wrap with \`\`\`json). Just the raw JSON string.

JSON Schema:
{
  "subject": "translated subject line",
  "html": "translated HTML body content"
}

Email to translate:
Subject: "${subject}"
HTML:
"${html}"
`;

    const response = await model.generateContent(prompt);
    const responseText = response.response.text().trim();

    // Remove code block ticks if any
    const jsonString = responseText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    const result = JSON.parse(jsonString);

    if (result.subject && result.html) {
      return {
        subject: result.subject,
        html: result.html,
      };
    }
  } catch (error) {
    console.error("[Email Translation] Error during translation:", error);
  }

  return { subject, html };
}

export const sendInsuranceSubmissionEmail = async (claim: any, user: any) => {
  try {
    const userLanguage = user?.language || "en";
    const subject = `Insurance Claim Submitted - #${claim.claimId}`;
    const rawHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #f97316; padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">Claim Submitted Successfully</h1>
          <p style="margin: 10px 0 0; font-size: 14px;">Your PMFBY insurance claim is under review.</p>
        </div>
        
        <div style="padding: 20px;">
          <p>Hi <strong>${user.name}</strong>,</p>
          <p>Your insurance claim for <strong>${claim.plotSnapshot?.name || "your plot"}</strong> has been submitted successfully.</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <p style="margin: 5px 0;"><strong>Claim ID:</strong> <span style="color: #f97316; font-size: 18px; font-weight: bold;">${claim.claimId}</span></p>
            <p style="margin: 5px 0;"><strong>Calamity Type:</strong> <span style="text-transform: capitalize;">${claim.calamityType}</span></p>
            <p style="margin: 5px 0;"><strong>Damaged Area:</strong> ${claim.damagedPercentage}%</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> <span style="text-transform: capitalize;">${claim.status}</span></p>
          </div>
          
          <p>We will notify you of any updates regarding your claim status.</p>
        </div>
        
        <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} Tatva. All rights reserved.</p>
        </div>
      </div>
    `;

    const { subject: transSubject, html: transHtml } = await translateEmailContent(subject, rawHtml, userLanguage);

    const mailOptions = {
      from: `"Tatva Insurance" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: transSubject,
      html: transHtml,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Successfully sent insurance submission email in (${userLanguage}) to: ${user.email}`);
  } catch (error) {
    console.error("Error sending insurance submission email:", error);
  }
};

export const sendInsuranceStatusUpdateEmail = async (claim: any, user: any) => {
  try {
    const userLanguage = user?.language || "en";
    const statusColor = claim.status === 'approved' ? '#10b981' : claim.status === 'rejected' ? '#ef4444' : claim.status === 'cancelled' ? '#64748b' : '#f59e0b';
    
    const subject = `Insurance Claim Update - #${claim.claimId}`;
    const rawHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: ${statusColor}; padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">Claim Status Updated</h1>
          <p style="margin: 10px 0 0; font-size: 14px;">There is an update on your recent claim.</p>
        </div>
        
        <div style="padding: 20px;">
          <p>Hi <strong>${user.name}</strong>,</p>
          <p>Your insurance claim for <strong>${claim.plotSnapshot?.name || "your plot"}</strong> has been updated to <strong>${claim.status}</strong>.</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <p style="margin: 5px 0;"><strong>Claim ID:</strong> <span style="font-weight: bold;">${claim.claimId}</span></p>
            <p style="margin: 5px 0;"><strong>Current Status:</strong> <span style="color: ${statusColor}; font-weight: bold; text-transform: uppercase;">${claim.status}</span></p>
          </div>
        </div>
        
        <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} Tatva. All rights reserved.</p>
        </div>
      </div>
    `;

    const { subject: transSubject, html: transHtml } = await translateEmailContent(subject, rawHtml, userLanguage);

    const mailOptions = {
      from: `"Tatva Insurance" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: transSubject,
      html: transHtml,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Successfully sent insurance status update email in (${userLanguage}) to: ${user.email}`);
  } catch (error) {
    console.error("Error sending insurance status update email:", error);
  }
};

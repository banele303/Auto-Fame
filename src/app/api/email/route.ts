import { NextRequest, NextResponse } from "next/server";
import tls from "tls";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Real Gmail SMTP Client (smtp.gmail.com:465 SSL/TLS)
 * Connects directly to Google's production SMTP server for elexsouthflow@gmail.com
 * No demo/fake fallbacks. Requires a valid 16-character Google App Password.
 */

interface SendEmailPayload {
  action?: "send" | "verify";
  fromEmail?: string;
  appPassword?: string;
  to?: string;
  cc?: string;
  customerName?: string;
  subject?: string;
  body?: string;
  carName?: string;
  carPrice?: number;
}

function buildHtmlEmail(payload: SendEmailPayload, senderEmail: string): string {
  const bodyHtml = (payload.body || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${payload.subject || "AutoFame Dealership"}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#11100e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#eae7e1;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#11100e;padding:32px 16px;">
      <tr>
        <td align="center">
          <table width="100%" style="max-width:600px;background-color:#1a1916;border:1px solid #2e2b26;border-radius:16px;overflow:hidden;padding:32px;">
            <tr>
              <td style="padding-bottom:18px;border-bottom:1px solid #2e2b26;">
                <h1 style="color:#34d399;font-size:22px;margin:0;font-weight:800;">AutoFame Dealership</h1>
                <p style="color:#8e8a82;font-size:11px;margin:4px 0 0 0;text-transform:uppercase;letter-spacing:1px;">
                  1 Rifle Range Rd, Baragwanath, Johannesburg South &bull; ${senderEmail}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 0;color:#dedad2;font-size:14px;line-height:1.65;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding-top:16px;border-top:1px solid #2e2b26;">
                <p style="color:#8e8a82;font-size:12px;margin:0;">
                  Sent from <strong style="color:#34d399;">${senderEmail}</strong> &bull; AutoFame (Pty) Ltd.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * Low-level TLS SMTP transaction against smtp.gmail.com:465
 */
function executeGmailSmtp(options: {
  user: string;
  pass: string;
  verifyOnly?: boolean;
  to?: string;
  cc?: string;
  subject?: string;
  text?: string;
  html?: string;
}): Promise<{ ok: boolean; response?: string; messageId?: string }> {
  return new Promise((resolve, reject) => {
    const cleanPass = options.pass.replace(/\s+/g, "");
    const socket = tls.connect(
      {
        host: "smtp.gmail.com",
        port: 465,
        servername: "smtp.gmail.com",
        rejectUnauthorized: true,
      },
      () => {
        // Connected over TLS, waiting for 220 greeting
      }
    );

    socket.setTimeout(15000);
    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error("Connection to smtp.gmail.com:465 timed out"));
    });

    socket.on("error", (err) => {
      reject(err);
    });

    let buffer = "";
    let step = 0;
    const recipients: string[] = [];
    if (options.to) {
      options.to
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean)
        .forEach((e) => recipients.push(e));
    }
    if (options.cc) {
      options.cc
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean)
        .forEach((e) => {
          if (!recipients.includes(e)) recipients.push(e);
        });
    }
    let rcptIndex = 0;
    const messageId = `<af_${Date.now()}_${Math.random().toString(36).slice(2, 9)}@gmail.com>`;

    const sendLine = (cmd: string) => {
      socket.write(cmd + "\r\n");
    };

    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      const lines = buffer.split("\r\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line) continue;
        // Wait until final line of multi-line SMTP reply (4th char is space, e.g. "250 OK")
        if (line.length >= 4 && line[3] === "-") {
          continue;
        }

        const code = parseInt(line.slice(0, 3), 10);

        if (step === 0) {
          // 220 smtp.gmail.com ESMTP
          if (code !== 220) {
            socket.end();
            return reject(new Error(`SMTP Greeting failed: ${line}`));
          }
          step = 1;
          sendLine("EHLO autofame.co.za");
        } else if (step === 1) {
          if (code !== 250) {
            socket.end();
            return reject(new Error(`EHLO failed: ${line}`));
          }
          step = 2;
          sendLine("AUTH LOGIN");
        } else if (step === 2) {
          if (code !== 334) {
            socket.end();
            return reject(new Error(`AUTH LOGIN failed: ${line}`));
          }
          step = 3;
          sendLine(Buffer.from(options.user, "utf8").toString("base64"));
        } else if (step === 3) {
          if (code !== 334) {
            socket.end();
            return reject(new Error(`Username rejected: ${line}`));
          }
          step = 4;
          sendLine(Buffer.from(cleanPass, "utf8").toString("base64"));
        } else if (step === 4) {
          if (code !== 235) {
            socket.end();
            return reject(
              new Error(
                `Gmail Authentication failed (${line}). Make sure you entered a valid 16-character Google App Password for ${options.user}.`
              )
            );
          }
          if (options.verifyOnly) {
            step = 99;
            sendLine("QUIT");
            return resolve({ ok: true, response: line });
          }
          step = 5;
          sendLine(`MAIL FROM:<${options.user}>`);
        } else if (step === 5) {
          if (code !== 250) {
            socket.end();
            return reject(new Error(`MAIL FROM rejected: ${line}`));
          }
          step = 6;
          rcptIndex = 0;
          sendLine(`RCPT TO:<${recipients[rcptIndex]}>`);
        } else if (step === 6) {
          if (code !== 250) {
            socket.end();
            return reject(new Error(`Recipient ${recipients[rcptIndex]} rejected: ${line}`));
          }
          rcptIndex++;
          if (rcptIndex < recipients.length) {
            sendLine(`RCPT TO:<${recipients[rcptIndex]}>`);
          } else {
            step = 7;
            sendLine("DATA");
          }
        } else if (step === 7) {
          if (code !== 354) {
            socket.end();
            return reject(new Error(`DATA command failed: ${line}`));
          }
          step = 8;
          const boundary = `----=_Part_${Date.now()}`;
          const headers = [
            `From: "AutoFame Dealership" <${options.user}>`,
            `To: ${options.to}`,
            ...(options.cc ? [`Cc: ${options.cc}`] : []),
            `Subject: =?UTF-8?B?${Buffer.from(options.subject || "", "utf8").toString("base64")}?=`,
            `Message-ID: ${messageId}`,
            `Date: ${new Date().toUTCString()}`,
            `MIME-Version: 1.0`,
            `Content-Type: multipart/alternative; boundary="${boundary}"`,
            ``,
            `--${boundary}`,
            `Content-Type: text/plain; charset="UTF-8"`,
            `Content-Transfer-Encoding: base64`,
            ``,
            Buffer.from(options.text || "", "utf8").toString("base64"),
            ``,
            `--${boundary}`,
            `Content-Type: text/html; charset="UTF-8"`,
            `Content-Transfer-Encoding: base64`,
            ``,
            Buffer.from(options.html || "", "utf8").toString("base64"),
            ``,
            `--${boundary}--`,
            `.`,
          ];
          sendLine(headers.join("\r\n"));
        } else if (step === 8) {
          if (code !== 250) {
            socket.end();
            return reject(new Error(`Email delivery failed: ${line}`));
          }
          step = 99;
          sendLine("QUIT");
          return resolve({ ok: true, response: line, messageId });
        }
      }
    });
  });
}

const DEFAULT_GMAIL_USER = "alexsouthflow3@gmail.com";
const DEFAULT_GMAIL_PASS = "dmjjjsyxcpqpdwlb";

export async function GET() {
  const configuredEmail = process.env.GMAIL_USER || DEFAULT_GMAIL_USER;
  const envPass = (process.env.GMAIL_APP_PASSWORD || DEFAULT_GMAIL_PASS).replace(/\s+/g, "");

  if (!envPass) {
    return NextResponse.json({
      connected: false,
      email: configuredEmail,
      requiresAppPassword: true,
      message:
        "Requires 16-character Google App Password for alexsouthflow3@gmail.com.",
    });
  }

  try {
    const verifyRes = await executeGmailSmtp({
      user: configuredEmail,
      pass: envPass,
      verifyOnly: true,
    });
    return NextResponse.json({
      connected: true,
      verified: verifyRes.ok,
      email: configuredEmail,
      smtpResponse: verifyRes.response,
    });
  } catch (err: any) {
    return NextResponse.json({
      connected: false,
      email: configuredEmail,
      requiresAppPassword: true,
      error: err.message,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload: SendEmailPayload = await req.json();
    const rawFrom = (payload.fromEmail || "").trim();
    const senderEmail =
      !rawFrom || rawFrom === "elexsouthflow@gmail.com" || rawFrom === "autofame.dealers@gmail.com"
        ? process.env.GMAIL_USER || DEFAULT_GMAIL_USER
        : rawFrom;
    const appPassword = (
      payload.appPassword ||
      process.env.GMAIL_APP_PASSWORD ||
      DEFAULT_GMAIL_PASS
    ).replace(/\s+/g, "");

    // 1. Live SMTP Connection Verification
    if (payload.action === "verify") {
      if (!appPassword) {
        return NextResponse.json(
          {
            connected: false,
            requiresAppPassword: true,
            error: `Please enter the 16-character Google App Password for ${senderEmail} to establish a real Gmail SMTP connection.`,
          },
          { status: 400 }
        );
      }

      const verifyResult = await executeGmailSmtp({
        user: senderEmail,
        pass: appPassword,
        verifyOnly: true,
      });

      return NextResponse.json({
        connected: true,
        verified: verifyResult.ok,
        email: senderEmail,
        smtpResponse: verifyResult.response,
      });
    }

    // 2. Real Email Dispatch via smtp.gmail.com:465
    const { to, cc, subject, body } = payload;

    if (!to || !subject) {
      return NextResponse.json(
        { error: "Recipient email ('to') and 'subject' are required." },
        { status: 400 }
      );
    }

    if (!appPassword) {
      return NextResponse.json(
        {
          error: `Real Gmail connection requires your 16-character Google App Password for ${senderEmail}. Click 'Configure' next to Gmail to connect your account.`,
          requiresAppPassword: true,
          email: senderEmail,
        },
        { status: 401 }
      );
    }

    const htmlContent = buildHtmlEmail(payload, senderEmail);
    const textContent = body || subject;

    const smtpResult = await executeGmailSmtp({
      user: senderEmail,
      pass: appPassword,
      to,
      cc,
      subject,
      text: textContent,
      html: htmlContent,
    });

    return NextResponse.json({
      success: true,
      status: "SENT",
      gateway: "gmail_smtp_ssl",
      from: senderEmail,
      recipient: to,
      cc: cc || null,
      subject,
      messageId: smtpResult.messageId,
      smtpResponse: smtpResult.response,
      deliveredAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Real Gmail SMTP error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to send email via smtp.gmail.com",
        requiresAppPassword:
          error.message?.includes("Authentication failed") ||
          error.message?.includes("App Password"),
      },
      { status: 500 }
    );
  }
}

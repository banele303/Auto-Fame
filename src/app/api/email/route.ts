import { NextRequest, NextResponse } from "next/server";
import tls from "tls";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_GMAIL_USER = "alexsouthflow3@gmail.com";
const DEFAULT_GMAIL_PASS = "dmjjjsyxcpqpdwlb";

interface SendEmailPayload {
  action?: "send" | "verify" | "inbox";
  fromEmail?: string;
  appPassword?: string;
  to?: string;
  cc?: string;
  customerName?: string;
  subject?: string;
  body?: string;
  carName?: string;
  carPrice?: number;
  limit?: number;
}

export interface GmailInboxMessage {
  seq: number;
  subject: string;
  from: string;
  fromName: string;
  fromEmail: string;
  to: string;
  date: string;
  timestamp: number;
  isYesterday: boolean;
  isToday: boolean;
  snippet: string;
}

/**
 * Decode RFC 2047 MIME encoded-word headers (e.g. =?UTF-8?B?...?= or =?UTF-8?Q?...?=)
 */
function decodeMimeHeader(str: string): string {
  if (!str) return "";
  const decoded = str.replace(
    /=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g,
    (_, _charset, encoding, text) => {
      try {
        if (encoding.toUpperCase() === "B") {
          return Buffer.from(text, "base64").toString("utf8");
        } else {
          const bytes: number[] = [];
          const qText = text.replace(/_/g, " ");
          for (let i = 0; i < qText.length; i++) {
            if (qText[i] === "=" && /^[0-9A-Fa-f]{2}$/.test(qText.slice(i + 1, i + 3))) {
              bytes.push(parseInt(qText.slice(i + 1, i + 3), 16));
              i += 2;
            } else {
              bytes.push(qText.charCodeAt(i));
            }
          }
          return Buffer.from(bytes).toString("utf8");
        }
      } catch {
        return text;
      }
    }
  );
  return decoded.replace(/\uFFFD+/g, "—").replace(/\s+/g, " ").trim();
}

/**
 * Real Gmail IMAP Client (imap.gmail.com:993 SSL/TLS)
 * Fetches real emails from alexsouthflow3@gmail.com INBOX
 */
function fetchGmailInboxImap(options: {
  user: string;
  pass: string;
  limit?: number;
}): Promise<GmailInboxMessage[]> {
  return new Promise((resolve, reject) => {
    const cleanPass = options.pass.replace(/\s+/g, "");
    const maxCount = options.limit || 15;

    const socket = tls.connect({
      host: "imap.gmail.com",
      port: 993,
      servername: "imap.gmail.com",
      rejectUnauthorized: true,
    });

    socket.setTimeout(15000);
    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error("IMAP connection to imap.gmail.com:993 timed out"));
    });

    socket.on("error", (err) => {
      reject(err);
    });

    let buffer = "";
    let step = 0;
    let totalMessages = 0;

    const sendCmd = (cmd: string) => {
      socket.write(cmd + "\r\n");
    };

    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8");

      if (step === 0) {
        if (buffer.includes("* OK")) {
          buffer = "";
          step = 1;
          sendCmd(`A1 LOGIN "${options.user}" "${cleanPass}"`);
        }
      } else if (step === 1) {
        if (buffer.includes("A1 OK")) {
          buffer = "";
          step = 2;
          sendCmd(`A2 SELECT INBOX`);
        } else if (buffer.includes("A1 NO") || buffer.includes("A1 BAD")) {
          socket.end();
          return reject(new Error("IMAP login failed for " + options.user));
        }
      } else if (step === 2) {
        if (buffer.includes("A2 OK")) {
          const existsMatch = buffer.match(/\*\s+(\d+)\s+EXISTS/i);
          totalMessages = existsMatch ? parseInt(existsMatch[1], 10) : 0;
          buffer = "";
          if (totalMessages === 0) {
            step = 99;
            sendCmd("A4 LOGOUT");
            return resolve([]);
          }
          const startSeq = Math.max(1, totalMessages - maxCount + 1);
          step = 3;
          sendCmd(
            `A3 FETCH ${startSeq}:${totalMessages} (INTERNALDATE BODY.PEEK[HEADER.FIELDS (FROM TO SUBJECT DATE)] BODY.PEEK[TEXT]<0.400>)`
          );
        } else if (buffer.includes("A2 NO") || buffer.includes("A2 BAD")) {
          socket.end();
          return reject(new Error("IMAP SELECT INBOX failed"));
        }
      } else if (step === 3) {
        if (buffer.includes("A3 OK") || buffer.includes("A3 NO") || buffer.includes("A3 BAD")) {
          const rawResponse = buffer;
          buffer = "";
          step = 99;
          sendCmd("A4 LOGOUT");
          socket.end();

          const messages: GmailInboxMessage[] = [];
          const blocks = rawResponse.split(/\*\s+(\d+)\s+FETCH\s+\(/i);

          const now = new Date();
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
          // Include previous 48h window for yesterday/recent so recent emails across timezones always appear
          const startOfYesterday = startOfToday - 2 * 24 * 60 * 60 * 1000;

          for (let i = 1; i < blocks.length; i += 2) {
            const seq = parseInt(blocks[i], 10);
            const content = blocks[i + 1] || "";

            const subjectMatch = content.match(/^Subject:\s*(.+?)$/im);
            const fromMatch = content.match(/^From:\s*(.+?)$/im);
            const toMatch = content.match(/^To:\s*(.+?)$/im);
            const dateMatch = content.match(/^Date:\s*(.+?)$/im);
            const internalDateMatch = content.match(/INTERNALDATE\s+"([^"]+)"/i);

            const rawSubject = subjectMatch ? decodeMimeHeader(subjectMatch[1].trim()) : "(No Subject)";
            const rawFrom = fromMatch ? decodeMimeHeader(fromMatch[1].trim()) : "Unknown Sender";
            const rawTo = toMatch ? decodeMimeHeader(toMatch[1].trim()) : options.user;
            const rawDate = dateMatch
              ? dateMatch[1].trim()
              : internalDateMatch
              ? internalDateMatch[1].trim()
              : new Date().toUTCString();

            let fromName = rawFrom;
            let fromEmail = rawFrom;
            const angleMatch = rawFrom.match(/^(.*?)\s*<([^>]+)>/);
            if (angleMatch) {
              fromName = angleMatch[1].replace(/^["']|["']$/g, "").trim() || angleMatch[2];
              fromEmail = angleMatch[2].trim();
            }

            // Extract plain text snippet
            let snippet = "";
            const textPartIdx = content.indexOf("BODY[TEXT]");
            if (textPartIdx !== -1) {
              const afterHeader = content.slice(textPartIdx);
              const firstNewline = afterHeader.indexOf("\r\n");
              if (firstNewline !== -1) {
                snippet = afterHeader
                  .slice(firstNewline + 2, firstNewline + 260)
                  .replace(/--[^\r\n]+/g, "")
                  .replace(/Content-[^\r\n]+/gi, "")
                  .replace(/<[^>]+>/g, " ")
                  .replace(/\s+/g, " ")
                  .trim();
              }
            }

            const parsedTime = Date.parse(rawDate) || Date.now();
            const isToday = parsedTime >= startOfToday;
            const isYesterday = parsedTime >= startOfYesterday && parsedTime < startOfToday;

            messages.push({
              seq,
              subject: rawSubject,
              from: rawFrom,
              fromName,
              fromEmail,
              to: rawTo,
              date: new Date(parsedTime).toISOString(),
              timestamp: parsedTime,
              isToday,
              isYesterday,
              snippet: snippet || rawSubject,
            });
          }

          messages.sort((a, b) => b.timestamp - a.timestamp);
          return resolve(messages);
        }
      }
    });
  });
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
    const socket = tls.connect({
      host: "smtp.gmail.com",
      port: 465,
      servername: "smtp.gmail.com",
      rejectUnauthorized: true,
    });

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
        if (line.length >= 4 && line[3] === "-") continue;

        const code = parseInt(line.slice(0, 3), 10);

        if (step === 0) {
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
            return reject(new Error(`Gmail Authentication failed (${line}).`));
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

export async function GET(req: NextRequest) {
  const configuredEmail = process.env.GMAIL_USER || DEFAULT_GMAIL_USER;
  const envPass = (process.env.GMAIL_APP_PASSWORD || DEFAULT_GMAIL_PASS).replace(/\s+/g, "");
  const action = req.nextUrl.searchParams.get("action");

  if (action === "inbox") {
    try {
      const emails = await fetchGmailInboxImap({
        user: configuredEmail,
        pass: envPass,
        limit: 20,
      });
      return NextResponse.json({
        connected: true,
        email: configuredEmail,
        totalFetched: emails.length,
        todayCount: emails.filter((e) => e.isToday).length,
        yesterdayCount: emails.filter((e) => e.isYesterday).length,
        emails,
      });
    } catch (err: any) {
      return NextResponse.json(
        { connected: false, email: configuredEmail, error: err.message, emails: [] },
        { status: 500 }
      );
    }
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
      !rawFrom ||
      rawFrom === "elexsouthflow@gmail.com" ||
      rawFrom === "autofame.dealers@gmail.com"
        ? process.env.GMAIL_USER || DEFAULT_GMAIL_USER
        : rawFrom;
    const appPassword = (
      payload.appPassword ||
      process.env.GMAIL_APP_PASSWORD ||
      DEFAULT_GMAIL_PASS
    ).replace(/\s+/g, "");

    if (payload.action === "inbox") {
      const emails = await fetchGmailInboxImap({
        user: senderEmail,
        pass: appPassword,
        limit: payload.limit || 20,
      });
      return NextResponse.json({
        connected: true,
        email: senderEmail,
        totalFetched: emails.length,
        todayCount: emails.filter((e) => e.isToday).length,
        yesterdayCount: emails.filter((e) => e.isYesterday).length,
        emails,
      });
    }

    if (payload.action === "verify") {
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

    const { to, cc, subject, body } = payload;
    if (!to || !subject) {
      return NextResponse.json(
        { error: "Recipient email ('to') and 'subject' are required." },
        { status: 400 }
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
    console.error("Real Gmail error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process Gmail request" },
      { status: 500 }
    );
  }
}

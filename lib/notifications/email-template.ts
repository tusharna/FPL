import type { Notification, NotificationSeverity, NotificationType } from "./types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function severityStyles(severity: NotificationSeverity): {
  headerBg: string;
  badge: string;
  badgeText: string;
} {
  switch (severity) {
    case "URGENT":
      return {
        headerBg: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
        badge: "#fef2f2",
        badgeText: "#b91c1c",
      };
    case "IMPORTANT":
      return {
        headerBg: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)",
        badge: "#fffbeb",
        badgeText: "#b45309",
      };
    default:
      return {
        headerBg: "linear-gradient(135deg, #047857 0%, #10b981 100%)",
        badge: "#ecfdf5",
        badgeText: "#047857",
      };
  }
}

function typeLabel(type: NotificationType): string {
  return type.replace(/_/g, " ");
}

function renderRow(label: string, value: string, highlight = false): string {
  const valueHtml = escapeHtml(value);
  const rowStyle = highlight
    ? "background:#fffbeb;border-left:4px solid #f59e0b;padding:12px 14px;border-radius:8px;margin:8px 0;"
    : "padding:10px 0;border-bottom:1px solid #e2e8f0;";

  if (highlight) {
    return `<div style="${rowStyle}">
      <div style="font-size:11px;font-weight:600;color:#92400e;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">${escapeHtml(label)}</div>
      <div style="font-size:15px;font-weight:600;color:#1e293b;">${valueHtml}</div>
    </div>`;
  }

  return `<tr>
    <td style="padding:10px 0;color:#64748b;font-size:13px;width:38%;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:10px 0;color:#0f172a;font-size:14px;font-weight:500;vertical-align:top;">${valueHtml}</td>
  </tr>`;
}

function renderPlayerSwap(outLabel: string, outValue: string, inValue: string): string {
  return `<div style="margin:12px 0;padding:14px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
    <div style="font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;margin-bottom:10px;">${escapeHtml(outLabel)}</div>
    <table cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="width:45%;padding:10px;background:#fef2f2;border-radius:8px;text-align:center;">
          <div style="font-size:10px;color:#b91c1c;font-weight:600;margin-bottom:4px;">OUT</div>
          <div style="font-size:14px;font-weight:600;color:#1e293b;">${escapeHtml(outValue)}</div>
        </td>
        <td style="width:10%;text-align:center;color:#94a3b8;font-size:18px;">→</td>
        <td style="width:45%;padding:10px;background:#ecfdf5;border-radius:8px;text-align:center;">
          <div style="font-size:10px;color:#047857;font-weight:600;margin-bottom:4px;">IN</div>
          <div style="font-size:14px;font-weight:600;color:#1e293b;">${escapeHtml(inValue)}</div>
        </td>
      </tr>
    </table>
  </div>`;
}

function parseMessageBody(message: string): string {
  const lines = message.split("\n").map((line) => line.trim());
  const parts: string[] = [];
  let tableOpen = false;

  const closeTable = () => {
    if (tableOpen) {
      parts.push("</table>");
      tableOpen = false;
    }
  };

  const openTable = () => {
    if (!tableOpen) {
      parts.push('<table cellpadding="0" cellspacing="0" width="100%" style="margin:8px 0;">');
      tableOpen = true;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) {
      closeTable();
      continue;
    }

    if (line === "OUT:" && lines[i + 1] && lines[i + 3] === "IN:" && lines[i + 4]) {
      closeTable();
      parts.push(renderPlayerSwap("Recommended change", lines[i + 1], lines[i + 4]));
      i += 4;
      continue;
    }

    if (line.startsWith("Deadline:")) {
      closeTable();
      const deadlineValue = lines[i + 1] && !lines[i + 1].includes(":") ? lines[i + 1] : line.replace(/^Deadline:\s*/, "");
      if (lines[i + 1] && !lines[i + 1].includes(":")) {
        parts.push(renderRow("Deadline (IST)", lines[i + 1], true));
        i += 1;
      } else {
        parts.push(renderRow("Deadline (IST)", deadlineValue, true));
      }
      continue;
    }

    if (line.startsWith("Key risk:")) {
      closeTable();
      const riskText = line.replace(/^Key risk:\s*/, "") || lines[i + 1] || "None flagged";
      parts.push(`<div style="margin:12px 0;padding:14px;background:#fef2f2;border-radius:10px;border-left:4px solid #ef4444;">
        <div style="font-size:11px;font-weight:600;color:#b91c1c;text-transform:uppercase;margin-bottom:6px;">Key risk</div>
        <div style="font-size:14px;color:#1e293b;line-height:1.5;">${escapeHtml(riskText)}</div>
      </div>`);
      if (line === "Key risk:" && lines[i + 1]) i += 1;
      continue;
    }

    const colonIdx = line.indexOf(":");
    if (colonIdx > 0 && colonIdx < 30) {
      const label = line.slice(0, colonIdx);
      const value = line.slice(colonIdx + 1).trim();
      if (value) {
        openTable();
        const highlight = label === "Deadline";
        if (highlight) {
          closeTable();
          parts.push(renderRow(`${label} (IST)`, value, true));
        } else {
          parts.push(renderRow(label, value));
        }
        continue;
      }
    }

    if (line === "Reason:" && lines[i + 1]) {
      closeTable();
      parts.push(`<div style="margin:12px 0;padding:12px 14px;background:#f8fafc;border-radius:8px;">
        <div style="font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;margin-bottom:6px;">Reason</div>
        <div style="font-size:14px;color:#334155;line-height:1.5;">${escapeHtml(lines[i + 1])}</div>
      </div>`);
      i += 1;
      continue;
    }

    closeTable();
    parts.push(`<p style="margin:8px 0;font-size:14px;color:#334155;line-height:1.6;">${escapeHtml(line)}</p>`);
  }

  closeTable();
  return parts.join("\n");
}

export function renderNotificationEmailHtml(notification: Notification): string {
  const styles = severityStyles(notification.severity);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const body = parseMessageBody(notification.message);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(notification.title)}</title>
</head>
<body style="margin:0;padding:0;background:#eef2f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table cellpadding="0" cellspacing="0" width="100%" style="background:#eef2f0;padding:24px 12px;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);">
          <tr>
            <td style="background:${styles.headerBg};padding:28px 24px;">
              <div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.85);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">FPL Report</div>
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">${escapeHtml(notification.title)}</h1>
              <div style="margin-top:12px;">
                <span style="display:inline-block;padding:4px 10px;border-radius:999px;background:${styles.badge};color:${styles.badgeText};font-size:11px;font-weight:600;text-transform:uppercase;">${escapeHtml(typeLabel(notification.type))}</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              ${body}
              ${notification.actionRequired ? `<div style="margin-top:16px;padding:12px 14px;background:#fff7ed;border-radius:8px;border:1px solid #fed7aa;">
                <span style="font-size:13px;font-weight:600;color:#c2410c;">Action may be required before the deadline.</span>
              </div>` : ""}
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 24px;">
              <a href="${escapeHtml(appUrl)}/report" style="display:block;text-align:center;padding:14px 20px;background:#059669;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;border-radius:10px;">Open FPL Report</a>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 24px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;line-height:1.5;">
                Deterministic FPL analysis — AI explains, never overrides engine decisions.<br />
                Times shown in IST (Asia/Kolkata) where applicable.
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

export interface EmailProvider {
  sendEmail(input: {
    to: string;
    subject: string;
    text: string;
    html?: string;
  }): Promise<{
    providerMessageId?: string;
  }>;
}

class ConsoleEmailProvider implements EmailProvider {
  async sendEmail(input: {
    to: string;
    subject: string;
    text: string;
    html?: string;
  }): Promise<{ providerMessageId?: string }> {
    console.info(`[Email] To: ${input.to} | Subject: ${input.subject}`);
    console.info(input.text);
    return { providerMessageId: `console-${Date.now()}` };
  }
}

class ResendEmailProvider implements EmailProvider {
  constructor(
    private apiKey: string,
    private from: string,
  ) {}

  async sendEmail(input: {
    to: string;
    subject: string;
    text: string;
    html?: string;
  }): Promise<{ providerMessageId?: string }> {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Resend email failed: ${response.status} ${body}`);
    }

    const data = (await response.json()) as { id?: string };
    return { providerMessageId: data.id };
  }
}

class NoOpEmailProvider implements EmailProvider {
  async sendEmail(): Promise<{ providerMessageId?: string }> {
    throw new Error("Email provider is not configured.");
  }
}

export function createEmailProvider(): EmailProvider {
  const provider = (process.env.NOTIFICATION_EMAIL_PROVIDER ?? "console").toLowerCase();

  if (provider === "none" || provider === "off") {
    return new NoOpEmailProvider();
  }

  if (provider === "resend") {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.NOTIFICATION_EMAIL_FROM;
    if (!apiKey || !from) {
      throw new Error("RESEND_API_KEY and NOTIFICATION_EMAIL_FROM are required for Resend.");
    }
    return new ResendEmailProvider(apiKey, from);
  }

  return new ConsoleEmailProvider();
}

export function resolveEmailDestination(
  preferencesDestination?: string,
): string | null {
  return (
    preferencesDestination ??
    process.env.NOTIFICATION_EMAIL_TO ??
    null
  );
}

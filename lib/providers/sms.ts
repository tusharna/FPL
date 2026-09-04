export interface SMSProvider {
  sendSMS(input: {
    to: string;
    message: string;
  }): Promise<{
    providerMessageId?: string;
  }>;
}

class ConsoleSMSProvider implements SMSProvider {
  async sendSMS(input: {
    to: string;
    message: string;
  }): Promise<{ providerMessageId?: string }> {
    console.info(`[SMS] To: ${input.to}`);
    console.info(input.message);
    return { providerMessageId: `console-sms-${Date.now()}` };
  }
}

class TwilioSMSProvider implements SMSProvider {
  constructor(
    private accountSid: string,
    private authToken: string,
    private fromNumber: string,
  ) {}

  async sendSMS(input: {
    to: string;
    message: string;
  }): Promise<{ providerMessageId?: string }> {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
    const body = new URLSearchParams({
      To: input.to,
      From: this.fromNumber,
      Body: input.message,
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Twilio SMS failed: ${response.status} ${text}`);
    }

    const data = (await response.json()) as { sid?: string };
    return { providerMessageId: data.sid };
  }
}

class NoOpSMSProvider implements SMSProvider {
  async sendSMS(): Promise<{ providerMessageId?: string }> {
    throw new Error("SMS provider is not configured.");
  }
}

export function createSMSProvider(): SMSProvider {
  const provider = (process.env.NOTIFICATION_SMS_PROVIDER ?? "none").toLowerCase();

  if (provider === "none" || provider === "off") {
    return new NoOpSMSProvider();
  }

  if (provider === "twilio") {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;
    if (!accountSid || !authToken || !fromNumber) {
      throw new Error(
        "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER are required.",
      );
    }
    return new TwilioSMSProvider(accountSid, authToken, fromNumber);
  }

  return new ConsoleSMSProvider();
}

export function resolveSmsDestination(
  preferencesDestination?: string,
): string | null {
  return (
    preferencesDestination ??
    process.env.NOTIFICATION_SMS_TO ??
    null
  );
}

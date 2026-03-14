export interface EmailConfig {
  id: string;
  profileId: string;
  enabled: boolean;
  gmailAddress: string;
  senderName: string;
  subjectTemplate: string;
  footerText: string;
  downloadUrl: string;
}

export interface EmailSendLogEntry {
  id: string;
  profileId: string;
  shopifyOrderName: string;
  customerEmail: string;
  customerName: string | null;
  status: "sent" | "failed";
  errorMessage: string | null;
  sentAt: string;
}

export interface EmailSendStatusMap {
  [orderName: string]: {
    status: "sent" | "failed";
    sentAt: string;
    errorMessage?: string;
  };
}

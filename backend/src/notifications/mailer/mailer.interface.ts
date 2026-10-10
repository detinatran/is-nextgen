export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  /** Bản HTML (tuỳ chọn); text luôn có để hiển thị ở ứng dụng mail không đọc HTML. */
  html?: string;
}

export interface Mailer {
  send(message: MailMessage): Promise<void>;
}

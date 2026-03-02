export interface TelegramLinkStatus {
  linked: boolean;
  bot_username?: string;
  telegram_username?: string;
  linked_at?: string;
}

export interface TelegramLinkCode {
  code: string;
  bot_username: string;
  expires_in_minutes: number;
}

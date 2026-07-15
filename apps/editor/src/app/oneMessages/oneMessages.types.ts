export type Severity = 'info' | 'warning' | 'critical';

export interface OneMessage {
  id: number;
  severity: Severity;
  title: string;
  body: string | null;
  link_label: string | null;
  link_url: string | null;
  dismissible: boolean;
  starts_at: string | null;
  ends_at: string | null;
}

export interface OneMessagesResponse {
  data: OneMessage[];
}

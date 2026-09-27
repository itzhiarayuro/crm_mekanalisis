export type ContractStatus =
  | "DRAFT"
  | "PROCESSING"
  | "READY"
  | "PENDING"
  | "SIGNED"
  | "EXPIRED"
  | "REVOKED"
  | "FAILED";

export interface Client {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  phone: string | null;
  type: string | null;
  source: string | null;
  status: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  client_id: string;
  title: string;
  status: ContractStatus;
  signer_name: string;
  signer_email: string;
  original_path: string | null;
  pdf_path: string | null;
  signed_path: string | null;
  document_hash: string | null;
  final_hash: string | null;
  public_id: string;
  token_hash: string | null;
  expires_at: string | null;
  otp_hash: string | null;
  otp_expires_at: string | null;
  otp_attempts: number;
  otp_blocked: boolean;
  last_otp_sent_at: string | null;
  first_opened_at: string | null;
  last_opened_at: string | null;
  view_count: number;
  read_at: string | null;
  verified_at: string | null;
  signed_at: string | null;
  revoked_at: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContractEvent {
  id: number;
  contract_id: string;
  type: string;
  metadata: Record<string, unknown>;
  ip: string | null;
  user_agent: string | null;
  prev_hash: string | null;
  hash: string;
  created_at: string;
}

export interface AdminSession {
  email: string;
  role: "admin";
}

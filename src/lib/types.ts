export type CampaignType = "qurban" | "aqiqah";
export type CampaignStatus = "draft" | "open" | "closed";
export type AnimalKind = "cow" | "buffalo" | "camel" | "goat" | "sheep";
export type AnimalStatus = "filling" | "full" | "slaughtered" | "distributed";
export type OrderStatus = "pending" | "awaiting_verification" | "paid" | "failed" | "cancelled";
export type PaymentMethod = "billplz" | "toyyibpay" | "bayarcash" | "senangpay" | "manual" | "demo";

export interface Campaign {
  id: string;
  slug: string;
  title: string;
  type: CampaignType;
  description: string | null;
  location: string | null;
  event_date: string | null;
  status: CampaignStatus;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_no: string | null;
  created_at: string;
}

export interface Package {
  id: string;
  campaign_id: string;
  name: string;
  description: string | null;
  animal_kind: AnimalKind;
  shares_per_animal: number;
  price_per_share: number;
  max_animals: number | null;
  code_prefix: string;
  active: boolean;
  sort_order: number;
}

export interface Animal {
  id: string;
  campaign_id: string;
  package_id: string;
  seq: number;
  code: string;
  status: AnimalStatus;
  notes: string | null;
  slaughtered_at: string | null;
  distributed_at: string | null;
}

export interface Order {
  id: string;
  ref: string;
  campaign_id: string;
  package_id: string;
  buyer_name: string;
  buyer_phone: string;
  buyer_email: string;
  buyer_address: string | null;
  quantity: number;
  participants: string[];
  amount: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  gateway_bill_id: string | null;
  gateway_txn_id: string | null;
  proof_path: string | null;
  paid_at: string | null;
  admin_notes: string | null;
  created_at: string;
}

export interface Share {
  id: string;
  order_id: string;
  animal_id: string;
  slot: number;
  participant_name: string;
}

export interface LedgerAdjustmentPayload {
  branch_id: number;
  amount: number;
  reason: string;
  idempotency_key: string;
}

export interface LedgerAdjustmentEntry {
  id: number;
  customer_id?: number;
  supplier_id?: number;
  branch_id: number;
  entry_type: string;
  amount: string;
  currency_code?: string;
  business_date: string;
  reference: string;
}

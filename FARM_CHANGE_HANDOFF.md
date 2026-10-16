# Farm Change Requests: Implementation Handoff

**Source:** PM review in `docs/read-only/Farm Changes.xlsx`  
**Reviewed:** 14 October 2026  
**Scope:** Route each requested change to the frontend, backend, or both. The live dev system was inspected where noted below.

## Summary

| Area | Frontend | Backend | Review status |
|---|---|---|---|
| Customer payment terms | Remove the field and payload handling | Confirm whether the API/storage contract should also drop payment terms | UI field confirmed |
| Customer opening balance | Collect and explain the opening balance and effective date as needed | Post the opening balance to AR dated today, idempotently and with an audit trail | Posting not verified live |
| Supplier opening balance | Provide opening amount and balance type | Post the opening balance to AP dated today, idempotently and with an audit trail | Current UI has type but no amount field; posting not verified |
| Supplier types | Replace single-select with multi-select and show all supported types | Change API, persistence, validation, resources, and consumers for multiple types | Current API/model contract is single-type |
| Food units | Label base stock unit and purchase/conversion unit clearly | Ensure API exposes unit roles and conversion factor consistently | UOM fields and ratio exist, but roles are unclear |
| Farm housing locations | Replace free-text house/barn and pen/cage inputs with selectors | Provide supported options and validation if there is no suitable existing source | Current fields confirmed as text |
| Warehouse rack/bin | Replace free-text rack/bin input with selectors | Provide supported options and validation if there is no suitable existing source | Current field confirmed as text |
| Multi-item purchase | Support adding, editing, and removing invoice lines | No core change expected: invoice API already accepts a line array; verify constraints during implementation | One-line UI confirmed |
| Purchase cashbook | Show/select a payment cashbook in the appropriate payment workflow | Check cashbook scope, branch/currency eligibility, and invoice currency | Selector exists in Supplier Payments but showed no options for test invoice |
| AP access | Ensure navigation and invoice actions lead to supplier payable records | Confirm permissions, branch scope, payable data, and API access | Route and invoice selector accessible; invoice showed 1,000 outstanding but currency was null |
| Receipt item selection | Select invoice lines by item name/code and show ordered, received, and remaining quantities; remove manual line-ID entry | Return sufficient line/item/remaining data and enforce invoice ownership and remaining limits | Numeric line-ID form confirmed |
| Partial receipts | Allow partial receipt and later receipt of the remainder | No change indicated by live test; preserve over-receipt protection | Passed live dev test: 10 ordered, 4 then 6 received |
| Follow-up receipt | Keep eligible lines available until fully received and show remaining quantity | No change indicated by live test | Passed live dev test |
| Inventory balance breakdown | Display Opening, In, Out, and Closing quantities | Calculate period opening, inbound, outbound, and closing with consistent filters and units | Current screen shows quantity and available only |

## Detailed implementation notes

### 1. Customer

**Remove payment terms**

- **Frontend:** Remove Payment Terms from customer forms, details/list if present, and create/update payloads.
- **Backend:** Review request validation, model, resource, and sales logic that uses payment terms. Remove the API field only if it is no longer part of the agreed customer contract. Coordinate the contract change with frontend deployment.

**Post customer opening balances to AR**

- **Backend:** When a customer is created with a non-zero opening balance, create the corresponding accounts-receivable entry using the current business date. Record customer, amount, date, and source reference; prevent duplicate posting on retries; and preserve a correction/reversal path.
- **Frontend:** Explain the opening amount and its effective date. If the rule always uses today, show that date or explain it without allowing a conflicting date.
- **Acceptance:** A non-zero opening balance appears exactly once in customer AR dated today. None/zero creates no AR entry.

### 2. Supplier

**Post supplier opening balances to AP**

- **Backend:** Add or complete opening-balance posting to supplier accounts payable, dated today, idempotent, auditable, and correctable through the source workflow.
- **Frontend:** The current supplier form has an Opening Balance Type selector but no amount input. Add the amount and explain debit/credit meaning. Saving supplier master data alone must not imply that AP was recorded.
- **Acceptance:** A non-zero opening balance appears exactly once in AP dated today. None/zero creates no payable entry.

**Allow multiple supplier types**

- **Frontend:** Replace Supplier Type single-choice with multi-select for Food, Medicine, Animal, Equipment, and Service. Display all selected types and preserve them on edit.
- **Backend:** Change scalar `type` to a collection or normalized relationship. Update validation, persistence, resources, filtering, default-supplier/item consumers, and category compatibility rules. Map existing scalar values to one-element collections.
- **Acceptance:** Multiple types save, read back intact, filter correctly, and survive editing.

### 3. Food units

- **Frontend:** Identify the stock/base unit and purchase/conversion unit. State the direction of the conversion ratio explicitly (for example, purchase units to stock units). Do not imply consumption UOM is the base unit unless that is the defined business rule.
- **Backend:** Check food API fields and conversion behavior. Expose unit roles and factor clearly; validate positive factors and consistent mappings.
- **Acceptance:** Users can identify the base unit and understand how purchase quantities convert to stock quantities; displayed labels match API semantics.

### 4. Farm housing selectors

- **Frontend:** Replace free-text House/Barn and Pen/Cage/Pond fields with selectors. Scope choices to the branch/housing and reset dependent selections when a parent changes.
- **Backend:** Identify the authoritative housing/location source. If these are controlled master data, provide list endpoints and validate submitted IDs. Avoid hard-coded frontend-only options.
- **Acceptance:** Users choose valid locations for the selected branch; mismatches cannot be saved.

### 5. Warehouse rack/bin selectors

- **Frontend:** Replace Rack/Bin text input with a selector scoped to the selected warehouse/location.
- **Backend:** Provide or identify the rack/bin source, enforce scope, and validate values. If rack/bin is not modeled, agree on master-data and API shape before relying on UI-only options.
- **Acceptance:** Existing rack/bin locations can be selected; invalid or out-of-scope values are rejected.

### 6. Purchase invoices and AP

**Purchase multiple items**

- **Frontend:** Replace the single-line editor with a repeatable line editor. Each line should capture category, item, UOM/conversion, quantity, price, discount/FOC/tax, and receiving destination where applicable. Validate and submit all lines together.
- **Backend:** Invoice validation/service already accepts `lines[]`; preserve that contract. Confirm category/item/UOM compatibility and calculate totals across every line.
- **Acceptance:** An invoice with two distinct items saves, returns two lines, and calculates the correct total. Single-line invoices remain compatible.

**Cashbook selection and AP access**

- **Frontend:** Keep cashbook selection in the supplier-payment workflow, where funds are disbursed. Make the route from purchase invoice to AP/payment clear. Show invoice currency instead of `null`.
- **Backend:** Investigate why Supplier Payments showed no eligible cashbooks for a Yangon invoice although that branch had active MMK cashbooks. Check lookup scope, branch/currency filters, authorization, and default invoice currency. Correct source data/API behavior without bypassing compatibility checks.
- **Acceptance:** Authorized users can open a supplier invoice, see accurate total/paid/outstanding and currency, and select an active compatible cashbook. Cash is not posted until payment confirmation.

### 7. Purchase receipts

**Select items instead of entering a line ID**

- **Frontend:** Replace numeric Purchase Invoice Line ID with a selector populated from the chosen invoice. Show item code/name plus ordered, previously accepted, and remaining quantities. Allow multiple receipt lines for multi-item invoices.
- **Backend:** Return stable line IDs and item labels with ordered, accepted, and remaining quantities. Validate that each line belongs to the selected invoice and does not exceed the remainder.
- **Acceptance:** A user selects by name/code and submits without knowing database IDs.

**Partial and follow-up receipts**

- **Frontend:** Keep invoices/lines eligible while quantities remain, show the remainder, and make another receipt straightforward.
- **Backend:** The live dev test passed: an invoice for 10 units accepted and confirmed a receipt for 4, then another for 6. Delivery status moved from partially received to fully received. Preserve these rules and add regression coverage with the implementation.
- **Acceptance:** Sequential receipts totaling the ordered amount succeed; quantities above the remainder fail; fully received lines are no longer eligible.

### 8. Inventory balance view

- **Frontend:** Add Opening, In, Out, and Closing columns. Provide clear date/period and item/location filters with consistent unit labels.
- **Backend:** Calculate quantities for the same item, lot, location, unit, and period. Define opening as the balance before the period, In and Out as movement totals within it, and Closing as opening + in − out. Classify transfers, adjustments, and reversals consistently.
- **Acceptance:** Opening + In − Out equals Closing and reconciles to the movement ledger. Changing the period updates all four values.

## Verification notes

- Live dev review confirmed the customer Payment Terms field; supplier single-select and missing opening amount; food UOM fields without base/conversion labels; free-text housing and rack/bin fields; a one-line purchase form; numeric receipt line ID; and balance columns without Opening/In/Out/Closing.
- The dev test invoice `QA-PM-20261014-01` ordered 10 units. Confirmed receipts `QA-PM-20261014-R1` (4) and `QA-PM-20261014-R2` (6) moved it to fully received. This test data remains in the dev system and added 10 units to inventory.
- Supplier Payments was accessible and showed 1,000 outstanding for the test invoice. It displayed currency as null, and its cashbook selector had no options even though the branch had active MMK cashbooks. Investigate before marking cashbook/AP behavior complete.
- Opening-balance ledger effects were not verified live. Verify customer AR and supplier AP entries before closing those requests.

## Suggested implementation order

1. Resolve supplier-payment currency and cashbook eligibility.
2. Implement opening AR/AP posting with idempotency, audit trail, and ledger verification.
3. Update purchase and receipt forms for multiple lines and item-based receipt selection.
4. Change supplier type API and UI together.
5. Clarify food base/conversion units and server-side validation.
6. Add authoritative housing and rack/bin sources with scoped selectors.
7. Add period-based inventory movements and Opening/In/Out/Closing balances.
8. Remove customer payment terms after aligning the API contract and downstream use.

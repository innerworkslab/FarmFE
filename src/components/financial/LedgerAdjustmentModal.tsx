"use client";

import { useRef, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useGetBranchesQuery } from "@/redux/features/setup/BranchApiSlice";
import { useCreateCustomerReceivableAdjustmentMutation } from "@/redux/features/setup/CustomerApiSlice";
import { useCreateSupplierPayableAdjustmentMutation } from "@/redux/features/setup/SupplierApiSlice";
import { LedgerAdjustmentEntry } from "@/types/ledgerAdjustment";

export default function LedgerAdjustmentModal({
  kind,
  party,
  onClose,
}: {
  kind: "customer" | "supplier";
  party: { id: number; name: string; preferred_branch_id?: number | null };
  onClose: () => void;
}) {
  const ledger = kind === "customer" ? "AR" : "AP";
  const [branchId, setBranchId] = useState(String(party.preferred_branch_id || ""));
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState("increase");
  const [reason, setReason] = useState("");
  const [currency, setCurrency] = useState("MMK");
  const [savedEntry, setSavedEntry] = useState<LedgerAdjustmentEntry | null>(null);
  const requestKey = useRef<{ signature: string; key: string } | null>(null);
  const submitting = useRef(false);
  const {
    data: branches,
    isLoading: branchesLoading,
    isError: branchesError,
  } = useGetBranchesQuery({ per_page: 100 });
  const [adjustCustomer, customerState] = useCreateCustomerReceivableAdjustmentMutation();
  const [adjustSupplier, supplierState] = useCreateSupplierPayableAdjustmentMutation();
  const isSaving = customerState.isLoading || supplierState.isLoading;
  const close = () => {
    if (!submitting.current) onClose();
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting.current || savedEntry) return;
    const magnitude = Number(amount);
    if (!branchId || !branches?.data.some((branch) => branch.id === Number(branchId))) {
      toast.error("Select a valid branch");
      return;
    }
    if (!Number.isFinite(magnitude) || magnitude <= 0 || !reason.trim()) {
      toast.error("Enter a positive amount and a reason");
      return;
    }
    const currencyCode = currency.trim().toUpperCase();
    if (kind === "supplier" && !/^[A-Z]{3}$/.test(currencyCode)) {
      toast.error("Enter a three-letter currency code");
      return;
    }
    const values = {
      branch_id: Number(branchId),
      amount: direction === "decrease" ? -magnitude : magnitude,
      reason: reason.trim(),
    };
    const signature = JSON.stringify({ kind, id: party.id, ...values, currencyCode });
    if (requestKey.current?.signature !== signature)
      requestKey.current = { signature, key: crypto.randomUUID() };
    const body = { ...values, idempotency_key: requestKey.current.key };
    submitting.current = true;
    try {
      const response =
        kind === "customer"
          ? await adjustCustomer({ id: party.id, body }).unwrap()
          : await adjustSupplier({
              id: party.id,
              body: { ...body, currency_code: currencyCode },
            }).unwrap();
      setSavedEntry(response.data);
      toast.success(`${ledger} adjustment posted`);
    } catch (error: unknown) {
      const failure = error as { data?: { message?: string } };
      toast.error(
        failure.data?.message ||
          "Unable to post adjustment. Retry without changing the fields to reuse the same request key."
      );
    } finally {
      submitting.current = false;
    }
  };

  return (
    <Modal isOpen onClose={close} className="m-4 max-w-lg">
      <div className="space-y-5 p-6 sm:p-8 max-h-[85vh] overflow-y-auto">
        <div className="flex items-start gap-3 pr-8">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
            <SlidersHorizontal size={21} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Adjust {ledger} balance
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{party.name}</p>
          </div>
        </div>
        {savedEntry ? (
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300" role="status">
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              <CheckCircle2 size={20} />
              Adjustment posted successfully
            </div>
            <dl className="grid grid-cols-2 gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <dt>Entry</dt>
              <dd>{savedEntry.id}</dd>
              <dt>Business date</dt>
              <dd>{savedEntry.business_date}</dd>
              <dt>Amount</dt>
              <dd>
                {savedEntry.amount} {savedEntry.currency_code || ""}
              </dd>
              <dt>Reference</dt>
              <dd>{savedEntry.reference}</dd>
            </dl>
            <p>This adjusts the ledger balance. The original opening amount remains unchanged.</p>
            <Button type="button" size="sm" onClick={close}>
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p className="rounded-xl bg-gray-50 p-3 text-xs leading-relaxed text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
              {kind === "customer"
                ? "Increase or decrease the amount owed by this customer."
                : "Increase or decrease the amount owed to this supplier."}{" "}
              Saving posts an adjustment on the current business date.
            </p>
            <fieldset disabled={isSaving} className="space-y-4">
              <label className="block text-sm text-gray-700 dark:text-gray-300">
                Branch *
                <select
                  required
                  className="mt-1.5 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-900"
                  value={branchId}
                  onChange={(event) => setBranchId(event.target.value)}
                >
                  <option value="">Select branch</option>
                  {branches?.data.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </label>
              <fieldset>
                <legend className="mb-2 text-sm text-gray-700 dark:text-gray-300">
                  Adjustment *
                </legend>
                <div className="grid grid-cols-2 gap-3">
                  {(["increase", "decrease"] as const).map((value) => (
                    <label
                      key={value}
                      className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-3 text-sm transition focus-within:ring-2 focus-within:ring-blue-400 ${direction === value ? "border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-950/30 dark:text-blue-300" : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"}`}
                    >
                      <input
                        className="sr-only"
                        type="radio"
                        name="adjustment-direction"
                        value={value}
                        checked={direction === value}
                        onChange={() => setDirection(value)}
                      />
                      {value === "increase" ? (
                        <ArrowUpRight size={17} />
                      ) : (
                        <ArrowDownLeft size={17} />
                      )}
                      <span>{value === "increase" ? "Increase (+)" : "Decrease (−)"}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="block text-sm text-gray-700 dark:text-gray-300">
                Amount *
                <Input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  placeholder="0.00"
                  onChange={(event) => setAmount(event.target.value)}
                />
              </label>
              {kind === "supplier" && (
                <label className="block text-sm text-gray-700 dark:text-gray-300">
                  Currency *
                  <Input
                    required
                    value={currency}
                    maxLength={3}
                    onChange={(event) => setCurrency(event.target.value.toUpperCase())}
                  />
                </label>
              )}
              <label className="block text-sm text-gray-700 dark:text-gray-300">
                Reason *
                <TextArea
                  required
                  rows={3}
                  value={reason}
                  placeholder="Explain why this balance needs to change"
                  onChange={(event) => setReason(event.target.value)}
                />
              </label>
            </fieldset>
            {branchesError && (
              <p className="text-sm text-red-600">Unable to load branches. Reopen to retry.</p>
            )}
            {Number(amount) > 0 && Number.isFinite(Number(amount)) && (
              <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-800/50">
                <span className="text-gray-500">Balance change</span>
                <span
                  className={`font-semibold tabular-nums ${direction === "increase" ? "text-emerald-700 dark:text-emerald-400" : "text-blue-700 dark:text-blue-400"}`}
                >
                  {direction === "increase" ? "+" : "−"}
                  {Number(amount).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  {kind === "supplier" ? currency : ""}
                </span>
              </div>
            )}
            <div className="flex justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
              <Button type="button" size="sm" variant="outline" onClick={close} disabled={isSaving}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSaving || branchesLoading || branchesError}
              >
                {isSaving ? "Posting..." : `Post ${ledger} Adjustment`}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}

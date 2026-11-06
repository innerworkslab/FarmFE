"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/button/Button";
import Loading from "@/components/common/Loading";
import LedgerAdjustmentModal from "@/components/financial/LedgerAdjustmentModal";
import SupplierPayablesPage from "@/components/financial/SupplierPayablesPage";
import { useGetSupplierQuery } from "@/redux/features/setup/SupplierApiSlice";
import { useState } from "react";

export default function SupplierAPDetailRoute() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supplierId = Number(params.id);
  const [adjusting, setAdjusting] = useState(false);
  const { currentData, isFetching, isError, refetch } = useGetSupplierQuery(supplierId, {
    skip: !Number.isInteger(supplierId) || supplierId <= 0,
  });
  const supplier = currentData?.data;
  const returnPath = searchParams.get("from") === "suppliers" ? "/setup/suppliers" : "/setup/supplier-ap";

  if (isFetching) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (isError || !supplier) {
    return (
      <div className="mx-auto max-w-7xl space-y-4">
        <Button type="button" variant="outline" size="sm" onClick={() => router.push(returnPath)}>
          Back to suppliers
        </Button>
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          Unable to load this supplier. <button type="button" className="font-semibold underline" onClick={() => void refetch()}>Try again</button>
        </p>
      </div>
    );
  }

  return (
    <>
      <SupplierPayablesPage
        supplier={supplier}
        onBack={() => router.push(returnPath)}
        onAdjust={() => setAdjusting(true)}
      />
      {adjusting && (
        <LedgerAdjustmentModal
          kind="supplier"
          party={supplier}
          onClose={() => {
            setAdjusting(false);
            void refetch();
          }}
        />
      )}
    </>
  );
}

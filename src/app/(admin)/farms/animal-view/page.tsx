"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, HeartPulse, Pill, Search, Skull, Users } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import TableActionButton from "@/components/ui/table/TableActionButton";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Loading from "@/components/common/Loading";
import {
  FarmAnimalView,
  FarmAnimalViewRow,
  useGetFarmAnimalsQuery,
  useGetFarmAnimalViewSummaryQuery,
  useLazyGetFarmAnimalQuery,
} from "@/redux/features/farms/FarmAnimalViewApiSlice";

const views: { key: FarmAnimalView; label: string }[] = [
  { key: "all", label: "All Animals" },
  { key: "batch", label: "Batch Animals" },
  { key: "individual", label: "Individual Animals" },
];

const labelize = (value?: string | null) =>
  value ? value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "-";
const value = (item?: string | number | null) =>
  item === null || item === undefined || item === "" ? "-" : String(item);
const statusClass = (status?: string | null) =>
  status === "healthy" || status === "active"
    ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300"
    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
const tableHeadClass = "px-5 py-3 text-start text-xs font-medium text-gray-500";
const tableCellClass = "px-5 py-3.5 text-sm text-gray-500";

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </span>
      {children}
    </label>
  );
}

export default function FarmAnimalViewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedView = searchParams.get("view");
  const view: FarmAnimalView =
    requestedView === "batch" || requestedView === "individual" ? requestedView : "all";
  const [farmId, setFarmId] = useState(searchParams.get("farm_id") || "1");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [animalType, setAnimalType] = useState(searchParams.get("animal_type") || "");
  const [breed, setBreed] = useState(searchParams.get("breed") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [selectedAnimal, setSelectedAnimal] = useState<FarmAnimalViewRow | null>(null);
  const numericFarmId = Number(farmId) || 1;
  const activeFarmId = Number(searchParams.get("farm_id")) || 1;
  const activeSearch = searchParams.get("search") || "";
  const activeAnimalType = searchParams.get("animal_type") || "";
  const activeBreed = searchParams.get("breed") || "";
  const activeLocation = searchParams.get("location") || "";

  const summaryQuery = {
    farmId: activeFarmId,
    view,
    search: activeSearch,
    animal_type: activeAnimalType,
    breed: activeBreed,
    location: activeLocation,
  };
  const listQuery = {
    farmId: activeFarmId,
    view,
    per_page: 15,
    ...(view === "individual" && activeSearch ? { search: activeSearch } : {}),
  };
  const {
    data: summaryResponse,
    isLoading: summaryLoading,
    isFetching: summaryFetching,
    isError: summaryError,
  } = useGetFarmAnimalViewSummaryQuery(summaryQuery);
  const {
    data: animalsResponse,
    isLoading: animalsLoading,
    isFetching: animalsFetching,
    isError: animalsError,
  } = useGetFarmAnimalsQuery(listQuery);
  const [getAnimal, { isFetching: detailLoading }] = useLazyGetFarmAnimalQuery();
  const summary = summaryResponse?.data;
  const filters = summary?.filter_options || {};

  useEffect(() => {
    setFarmId(searchParams.get("farm_id") || "1");
    setSearch(searchParams.get("search") || "");
    setAnimalType(searchParams.get("animal_type") || "");
    setBreed(searchParams.get("breed") || "");
    setLocation(searchParams.get("location") || "");
  }, [searchParams]);

  const options = (key: string) =>
    (filters[key] || []).map((item) => ({ value: item, label: labelize(item) }));
  const navigate = (nextView = view) => {
    const params = new URLSearchParams({ view: nextView, farm_id: String(numericFarmId) });
    if (search) params.set("search", search);
    if (animalType) params.set("animal_type", animalType);
    if (breed) params.set("breed", breed);
    if (location) params.set("location", location);
    router.push(`/farms/animal-view?${params.toString()}`);
  };
  const showDetail = async (animal: FarmAnimalViewRow) => {
    try {
      setSelectedAnimal(
        (await getAnimal({ farmId: activeFarmId, animalBalanceId: animal.id }).unwrap()).data
      );
    } catch {
      toast.error("Unable to load the animal detail from the Farm Animal View API.");
    }
  };

  if (summaryLoading || animalsLoading) return <Loading />;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="text-[#15803d] dark:text-emerald-400" size={26} />
            <h1 className="text-2xl font-extrabold tracking-tight text-[#1E293B] dark:text-white">
              Farm Animal View
            </h1>
          </div>
          <p className="mt-1 text-sm text-[#64748B] dark:text-gray-400">
            Farm, batch, and individual animal balances from the Postman view API.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-white/[0.05] dark:bg-white/[0.03]">
          <p className="font-semibold text-gray-900 dark:text-white">
            {summary?.farm?.name || "Farm #" + activeFarmId}
          </p>
          <p className="text-gray-500">
            {summary?.farm?.farm_code || "Farm ID " + activeFarmId}
            {summary?.farm?.branch?.name ? ` · ${summary.farm.branch.name}` : ""}
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {views.map((item) => (
          <div
            key={item.key}
            className={`rounded-xl border p-4 ${view === item.key ? "border-green-200 bg-green-50 dark:border-green-900/60 dark:bg-green-950/30" : "border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]"}`}
          >
            <div className="flex items-center justify-between">
              <p
                className={`text-sm font-semibold ${view === item.key ? "text-green-700 dark:text-green-300" : "text-gray-600 dark:text-gray-300"}`}
              >
                {item.label}
              </p>
              {view === item.key && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-green-700 dark:bg-green-950 dark:text-green-300">
                  Current
                </span>
              )}
            </div>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              {summary?.tabs?.[item.key] ?? 0}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
          Summary filters
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FormField label="Farm ID">
            <Input
              type="number"
              min="1"
              value={farmId}
              onChange={(event) => setFarmId(event.target.value)}
              placeholder="Farm ID"
            />
          </FormField>
          <FormField label="Search">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Animal, RFID, or ear tag"
            />
          </FormField>
          <FormField label="Animal Type">
            <Select
              value={animalType}
              onChange={(event) => setAnimalType(event.target.value)}
              options={options("animal_types")}
              placeholder="All animal types"
            />
          </FormField>
          <FormField label="Breed">
            <Select
              value={breed}
              onChange={(event) => setBreed(event.target.value)}
              options={options("breeds")}
              placeholder="All breeds"
            />
          </FormField>
          <FormField label="Location">
            <Select
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              options={options("locations")}
              placeholder="All locations"
            />
          </FormField>
          <div className="flex items-end gap-2 md:col-span-2 xl:col-span-3">
            <Button size="sm" onClick={() => navigate()}>
              <Search size={16} /> Apply filters
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSearch("");
                setAnimalType("");
                setBreed("");
                setLocation("");
                router.push(`/farms/animal-view?view=${view}&farm_id=${numericFarmId}`);
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      </div>

      {(summaryError || animalsError) && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          Unable to load the Farm Animal View API. Check the Farm ID, login permission, and API base
          URL.
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-white/[0.05]">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {views.find((item) => item.key === view)?.label}
            </h2>
            <p className="text-xs text-gray-500">
              {animalsResponse?.meta?.total ?? animalsResponse?.data.length ?? 0} records
            </p>
          </div>
          {(summaryFetching || animalsFetching) && (
            <span className="text-xs text-gray-400">Refreshing…</span>
          )}
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                {[
                  "No.",
                  "Animal",
                  "Tracking",
                  "Type / Breed",
                  "Location",
                  "Available",
                  "Health",
                  "Actions",
                ].map((heading) => (
                  <TableCell key={heading} isHeader className={tableHeadClass}>
                    {heading}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {animalsResponse?.data.map((animal, index) => (
                <TableRow key={animal.id}>
                  <TableCell className={tableCellClass}>{index + 1}</TableCell>
                  <TableCell className="px-5 py-3.5 text-sm">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {value(animal.display_name || animal.name)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {animal.code || animal.batch_number || animal.rfid || animal.ear_tag || "-"}
                    </p>
                  </TableCell>
                  <TableCell className={tableCellClass}>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {labelize(animal.tracking_type)}
                    </span>
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300">
                    <p>{labelize(animal.animal_type)}</p>
                    <p className="text-xs text-gray-500">{value(animal.breed)}</p>
                  </TableCell>
                  <TableCell className={tableCellClass}>
                    {value(
                      animal.location?.name ||
                        animal.location?.pen_cage_pond ||
                        animal.location?.house_barn
                    )}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm font-semibold text-gray-900 dark:text-white">
                    {value(animal.available_quantity)}
                    <span className="text-xs text-gray-500">
                      {" "}
                      / {value(animal.current_quantity)}
                    </span>
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass(animal.health_status)}`}
                    >
                      {labelize(animal.health_status)}
                    </span>
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <TableActionButton
                        label="View"
                        tone="neutral"
                        icon={<Eye size={14} />}
                        onClick={() => showDetail(animal)}
                      />
                      <TableActionButton
                        label="Food"
                        tone="green"
                        icon={<HeartPulse size={14} />}
                        disabled
                        title="No matching POST API in this Postman collection"
                      />
                      <TableActionButton
                        label="Medicine"
                        tone="blue"
                        icon={<Pill size={14} />}
                        disabled
                        title="No matching POST API in this Postman collection"
                      />
                      <TableActionButton
                        label="Defect / Death"
                        tone="red"
                        icon={<Skull size={14} />}
                        disabled
                        title="No matching POST API in this Postman collection"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!animalsResponse?.data.length && (
            <p className="p-8 text-center text-sm text-gray-500">No animals found for this view.</p>
          )}
        </div>
      </div>

      <AnimalDetailModal
        animal={selectedAnimal}
        isLoading={detailLoading}
        onClose={() => setSelectedAnimal(null)}
      />
    </div>
  );
}

function AnimalDetailModal({
  animal,
  isLoading,
  onClose,
}: {
  animal: FarmAnimalViewRow | null;
  isLoading: boolean;
  onClose: () => void;
}) {
  const fields = animal
    ? [
        ["Animal", animal.display_name || animal.name],
        ["Tracking", labelize(animal.tracking_type)],
        ["Code", animal.code],
        ["RFID", animal.individual?.rfid || animal.rfid],
        ["Ear tag", animal.individual?.ear_tag || animal.ear_tag],
        ["Animal type", animal.animal_type],
        ["Breed", animal.breed],
        ["Gender", animal.gender],
        ["Life stage", animal.life_stage],
        ["Location", animal.location?.name || animal.location?.pen_cage_pond],
        ["Current quantity", animal.current_quantity],
        ["Available quantity", animal.available_quantity],
        ["Health status", animal.health_status],
        ["Animal status", animal.animal_status],
        ["Average weight", animal.average_weight],
        ["Current weight", animal.individual?.current_weight],
      ]
    : [];
  return (
    <Modal isOpen={!!animal || isLoading} onClose={onClose} className="m-4 max-w-3xl">
      <div className="p-6 sm:p-8">
        <div className="mb-5 pr-12">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Animal Details</h2>
            <p className="mt-1 text-sm text-gray-500">
              Read-only response from the Farm Animal View API.
            </p>
          </div>
        </div>
        {isLoading ? (
          <Loading />
        ) : (
          <div className="grid max-h-[65vh] gap-4 overflow-y-auto pr-1 sm:grid-cols-2">
            {fields.map(([label, fieldValue]) => (
              <div
                key={label}
                className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                  {value(fieldValue as string | number | null)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

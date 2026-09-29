"use client";

import React, { useState } from "react";
import { ArrowLeft, Eye, MapPin, Search, Warehouse } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Loading from "@/components/common/Loading";
import TableActionButton from "@/components/ui/table/TableActionButton";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { useGetBranchesQuery } from "@/redux/features/setup/BranchApiSlice";
import {
  useGetNavigationFarmAnimalsQuery,
  useGetNavigationFarmQuery,
  useGetNavigationFarmsQuery,
} from "@/redux/features/farms/FarmNavigationApiSlice";

const trackingOptions = [
  { value: "batch", label: "Batch" },
  { value: "individual", label: "Individual" },
];
const value = (item: unknown) =>
  item === null || item === undefined || item === "" ? "-" : String(item);
const labelize = (item?: string | null) =>
  item ? item.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "-";
const badgeClass = (status?: string | null) =>
  status === "active" || status === "healthy"
    ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300"
    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </span>
      {children}
    </label>
  );
}

export default function FarmsPage() {
  const [filters, setFilters] = useState({
    branch_id: "",
    search: "",
    animal_type: "",
    farm_type: "",
  });
  const [applied, setApplied] = useState(filters);
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);
  const [animalFilters, setAnimalFilters] = useState({
    tracking_type: "",
    search: "",
    animal_type: "",
    breed: "",
    location: "",
  });
  const [appliedAnimalFilters, setAppliedAnimalFilters] = useState(animalFilters);

  const { data: branches } = useGetBranchesQuery({ per_page: 100 });
  const {
    data: farms,
    isLoading,
    isFetching,
    isError,
  } = useGetNavigationFarmsQuery({ ...applied, status: "active", per_page: 15 });
  const {
    data: farmResponse,
    isLoading: farmLoading,
    isError: farmError,
  } = useGetNavigationFarmQuery(selectedFarmId || 0, { skip: !selectedFarmId });
  const {
    data: animals,
    isLoading: animalsLoading,
    isFetching: animalsFetching,
    isError: animalsError,
  } = useGetNavigationFarmAnimalsQuery(
    { farmId: selectedFarmId || 0, ...appliedAnimalFilters, per_page: 15 },
    { skip: !selectedFarmId }
  );
  const farm = farmResponse?.data;
  const clearFarmFilters = () => {
    const empty = { branch_id: "", search: "", animal_type: "", farm_type: "" };
    setFilters(empty);
    setApplied(empty);
  };
  const clearAnimalFilters = () => {
    const empty = { tracking_type: "", search: "", animal_type: "", breed: "", location: "" };
    setAnimalFilters(empty);
    setAppliedAnimalFilters(empty);
  };

  if (selectedFarmId) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <Button size="sm" variant="outline" onClick={() => setSelectedFarmId(null)}>
            <ArrowLeft size={16} /> Back to Farms
          </Button>
        </div>
        {farmLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loading />
          </div>
        ) : farmError ? (
          <ErrorPanel text="Unable to load the selected farm page." />
        ) : (
          farm && (
            <>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Warehouse className="text-[#15803d] dark:text-emerald-400" size={26} />
                    <h1 className="text-2xl font-extrabold tracking-tight text-[#1E293B] dark:text-white">
                      {farm.name}
                    </h1>
                  </div>
                  <p className="mt-1 text-sm text-[#64748B] dark:text-gray-400">
                    {farm.farm_code} · {farm.branch?.name || "No branch"} ·{" "}
                    {[farm.house_barn, farm.pen_cage_pond].filter(Boolean).join(" / ")}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(farm.status)}`}
                >
                  {labelize(farm.status)}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <Metric label="Total Animals" count={farm.metrics?.total_animal_count} />
                <Metric label="Active Batches" count={farm.metrics?.active_batch_count} />
                <Metric label="Individuals" count={farm.metrics?.individual_animal_count} />
                <Metric label="Sick Animals" count={farm.metrics?.sick_animal_count} />
                <Metric label="Deaths" count={farm.metrics?.death_count} />
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                <InfoPanel
                  title="Farm Information"
                  rows={[
                    ["Farm Type", farm.farm_type],
                    ["Branch", farm.branch?.name],
                    ["Manager", farm.farm_manager?.name],
                    ["Manager Email", farm.farm_manager?.email],
                    ["House / Barn", farm.house_barn],
                    ["Pen / Cage / Pond", farm.pen_cage_pond],
                  ]}
                />
                <InfoPanel
                  title="Current Animal Setup"
                  rows={[
                    ["Name", farm.current_animal?.name],
                    ["Code", farm.current_animal?.code],
                    ["Tracking", labelize(farm.current_animal?.tracking_type)],
                    ["Type", farm.current_animal?.type],
                    ["Category", farm.current_animal?.category],
                    ["Breed", farm.current_animal?.breed],
                  ]}
                />
                <InfoPanel
                  title="Today’s Operations"
                  rows={[
                    ["Feed Quantity", farm.metrics?.feed_consumption_summary?.today_quantity],
                    ["Feed Cost", farm.metrics?.feed_consumption_summary?.today_cost],
                    ["Feeding Records", farm.metrics?.feed_consumption_summary?.records_today],
                    ["Medicine Quantity", farm.metrics?.medicine_usage_summary?.today_quantity],
                    ["Medicine Records", farm.metrics?.medicine_usage_summary?.records_today],
                    ["Follow-ups Due", farm.metrics?.medicine_usage_summary?.follow_ups_due],
                  ]}
                />
              </div>
            </>
          )
        )}

        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
            Animal filters
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Field label="Tracking Type">
              <Select
                value={animalFilters.tracking_type}
                onChange={(e) =>
                  setAnimalFilters({ ...animalFilters, tracking_type: e.target.value })
                }
                options={trackingOptions}
                placeholder="All tracking types"
              />
            </Field>
            <Field label="Search">
              <Input
                value={animalFilters.search}
                onChange={(e) => setAnimalFilters({ ...animalFilters, search: e.target.value })}
                placeholder="Animal, RFID, or ear tag"
              />
            </Field>
            <Field label="Animal Type">
              <Input
                value={animalFilters.animal_type}
                onChange={(e) =>
                  setAnimalFilters({ ...animalFilters, animal_type: e.target.value })
                }
                placeholder="e.g. cattle"
              />
            </Field>
            <Field label="Breed">
              <Input
                value={animalFilters.breed}
                onChange={(e) => setAnimalFilters({ ...animalFilters, breed: e.target.value })}
                placeholder="Breed"
              />
            </Field>
            <Field label="Location">
              <Input
                value={animalFilters.location}
                onChange={(e) => setAnimalFilters({ ...animalFilters, location: e.target.value })}
                placeholder="Location"
              />
            </Field>
          </div>
          <div className="mt-4 flex gap-2">
            <Button size="sm" onClick={() => setAppliedAnimalFilters(animalFilters)}>
              <Search size={15} /> Apply Filters
            </Button>
            <Button size="sm" variant="outline" onClick={clearAnimalFilters}>
              Clear
            </Button>
          </div>
        </div>
        {animalsError && <ErrorPanel text="Unable to load animals for this farm." />}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-white/[0.05]">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Farm Animals</h2>
              <p className="text-xs text-gray-500">
                {animals?.meta?.total ?? animals?.data.length ?? 0} records
              </p>
            </div>
            {animalsFetching && <span className="text-xs text-gray-400">Refreshing…</span>}
          </div>
          {animalsLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loading />
            </div>
          ) : (
            <AnimalTable animals={animals?.data || []} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <MapPin className="text-[#15803d] dark:text-emerald-400" size={26} />
          <h1 className="text-2xl font-extrabold tracking-tight text-[#1E293B] dark:text-white">
            Farm Navigation
          </h1>
        </div>
        <p className="mt-1 text-sm text-[#64748B] dark:text-gray-400">
          Browse authorized farms, operational summaries, and active animal stock.
        </p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Branch">
            <Select
              value={filters.branch_id}
              onChange={(e) => setFilters({ ...filters, branch_id: e.target.value })}
              options={(branches?.data || []).map((branch) => ({
                value: String(branch.id),
                label: `${branch.code} - ${branch.name}`,
              }))}
              placeholder="All branches"
            />
          </Field>
          <Field label="Search">
            <Input
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Farm name or code"
            />
          </Field>
          <Field label="Animal Type">
            <Input
              value={filters.animal_type}
              onChange={(e) => setFilters({ ...filters, animal_type: e.target.value })}
              placeholder="e.g. cattle"
            />
          </Field>
          <Field label="Farm Type">
            <Input
              value={filters.farm_type}
              onChange={(e) => setFilters({ ...filters, farm_type: e.target.value })}
              placeholder="Farm type"
            />
          </Field>
        </div>
        <div className="mt-4 flex gap-2">
          <Button size="sm" onClick={() => setApplied(filters)}>
            <Search size={15} /> Apply Filters
          </Button>
          <Button size="sm" variant="outline" onClick={clearFarmFilters}>
            Clear
          </Button>
        </div>
      </div>
      {isError && <ErrorPanel text="Unable to load the Farm Navigation API." />}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-white/[0.05]">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Farms</h2>
            <p className="text-xs text-gray-500">
              {farms?.meta?.total ?? farms?.data.length ?? 0} records
            </p>
          </div>
          {isFetching && <span className="text-xs text-gray-400">Refreshing…</span>}
        </div>
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loading />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  {[
                    "No.",
                    "Farm",
                    "Branch",
                    "Type",
                    "Location",
                    "Animals",
                    "Manager",
                    "Status",
                    "Actions",
                  ].map((head) => (
                    <TableCell
                      key={head}
                      isHeader
                      className={`px-5 py-3 text-xs font-medium text-gray-500 ${["No.", "Animals"].includes(head) ? "text-right" : "text-start"}`}
                    >
                      {head}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {farms?.data.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="px-5 py-3.5 text-right text-sm tabular-nums text-gray-500">
                      {index + 1}
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-sm">
                      <p className="font-semibold text-gray-900 dark:text-white">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.farm_code}</p>
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300">
                      {item.branch?.name || "-"}
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-sm text-gray-500">
                      {labelize(item.farm_type || item.animal_type)}
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-sm text-gray-500">
                      {[item.house_barn, item.pen_cage_pond].filter(Boolean).join(" / ") || "-"}
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-right text-sm tabular-nums">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {item.animal_count ?? 0}
                      </span>
                      <p className="text-xs text-gray-500">
                        {item.active_batch_count ?? 0} batch · {item.individual_animal_count ?? 0}{" "}
                        individual
                      </p>
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-sm text-gray-500">
                      {item.farm_manager?.name || "-"}
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-sm">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass(item.status)}`}
                      >
                        {labelize(item.status)}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-sm">
                      <TableActionButton
                        label="View Farm"
                        icon={<Eye size={14} />}
                        onClick={() => setSelectedFarmId(item.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!farms?.data.length && (
              <p className="p-8 text-center text-sm text-gray-500">No farms found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, count }: { label: string; count?: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03]">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{count ?? 0}</p>
    </div>
  );
}
function InfoPanel({ title, rows }: { title: string; rows: [string, unknown][] }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03]">
      <h2 className="mb-2 font-semibold text-gray-900 dark:text-white">{title}</h2>
      <dl>
        {rows.map(([label, item]) => (
          <div
            key={label}
            className="flex justify-between gap-4 border-b border-gray-100 py-2.5 text-sm last:border-0 dark:border-white/[0.05]"
          >
            <dt className="text-gray-500">{label}</dt>
            <dd className="text-right font-medium text-gray-900 dark:text-white">{value(item)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
function ErrorPanel({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
      {text}
    </div>
  );
}
function AnimalTable({
  animals,
}: {
  animals: import("@/redux/features/farms/FarmAnimalViewApiSlice").FarmAnimalViewRow[];
}) {
  return (
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
              "Status",
            ].map((head) => (
              <TableCell
                key={head}
                isHeader
                className={`px-5 py-3 text-xs font-medium text-gray-500 ${["No.", "Available"].includes(head) ? "text-right" : "text-start"}`}
              >
                {head}
              </TableCell>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
          {animals.map((animal, index) => (
            <TableRow key={animal.id}>
              <TableCell className="px-5 py-3.5 text-right text-sm tabular-nums text-gray-500">
                {index + 1}
              </TableCell>
              <TableCell className="px-5 py-3.5 text-sm">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {animal.display_name || animal.name || "-"}
                </p>
                <p className="text-xs text-gray-500">
                  {animal.code || animal.batch_number || animal.rfid || animal.ear_tag || "-"}
                </p>
              </TableCell>
              <TableCell className="px-5 py-3.5 text-sm text-gray-500">
                {labelize(animal.tracking_type)}
              </TableCell>
              <TableCell className="px-5 py-3.5 text-sm text-gray-500">
                {labelize(animal.animal_type)}
                <p className="text-xs">{value(animal.breed)}</p>
              </TableCell>
              <TableCell className="px-5 py-3.5 text-sm text-gray-500">
                {value(
                  animal.location?.name ||
                    animal.location?.pen_cage_pond ||
                    animal.location?.house_barn
                )}
              </TableCell>
              <TableCell className="px-5 py-3.5 text-right text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                {value(animal.available_quantity)}
              </TableCell>
              <TableCell className="px-5 py-3.5 text-sm">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass(animal.health_status)}`}
                >
                  {labelize(animal.health_status)}
                </span>
              </TableCell>
              <TableCell className="px-5 py-3.5 text-sm">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass(animal.animal_status)}`}
                >
                  {labelize(animal.animal_status)}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {!animals.length && (
        <p className="p-8 text-center text-sm text-gray-500">No animals found for this farm.</p>
      )}
    </div>
  );
}

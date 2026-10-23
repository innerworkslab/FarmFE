"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Eye, Power } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import TableActionButton from "@/components/ui/table/TableActionButton";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import { useGetBranchesQuery } from "@/redux/features/setup/BranchApiSlice";
import {
  FarmInformationRecord,
  HouseBarn,
  PenCagePond,
  useGetHouseBarnsQuery,
  useGetPenCagePondsQuery,
  useGetFarmInformationRecordsQuery,
  useLazyGetHouseBarnQuery,
  useLazyGetPenCagePondQuery,
  useLazyGetFarmInformationRecordQuery,
  useCreateHouseBarnMutation,
  useUpdateHouseBarnMutation,
  useDeleteHouseBarnMutation,
  useToggleHouseBarnStatusMutation,
  useCreatePenCagePondMutation,
  useUpdatePenCagePondMutation,
  useDeletePenCagePondMutation,
  useTogglePenCagePondStatusMutation,
  useCreateFarmInformationRecordMutation,
  useUpdateFarmInformationRecordMutation,
  useDeleteFarmInformationRecordMutation,
} from "@/redux/features/setup/FarmLocationsApiSlice";

type Kind = "farms" | "barns" | "pens";
type Row = HouseBarn | PenCagePond | FarmInformationRecord;
const names = { farms: "Farm information", barns: "Houses / Barns", pens: "Pens / Cages / Ponds" };
const routes = {
  farms: "/setup/farm-information",
  barns: "/setup/house-barns",
  pens: "/setup/pen-cage-ponds",
};
const emptyForm = {
  name: "",
  branch_id: 0,
  house_barn_id: null as number | null,
  pen_cage_pond_id: null as number | null,
};
const errorText = (error: unknown) => {
  const data = (error as { data?: { message?: string; errors?: Record<string, string[]> } })?.data;
  return (
    Object.values(data?.errors || {})
      .flat()
      .join(" ") ||
    data?.message ||
    "Request failed. Please try again."
  );
};
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1 text-sm font-medium text-gray-700 dark:text-gray-300">
      <span>{label}</span>
      {children}
    </label>
  );
}

export default function FarmLocationsManager({ kind }: { kind: Kind }) {
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("");
  const [barnFilter, setBarnFilter] = useState("");
  const [penFilter, setPenFilter] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Row | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [addBarnOpen, setAddBarnOpen] = useState(false);
  const [addPenOpen, setAddPenOpen] = useState(false);
  const [newBarnName, setNewBarnName] = useState("");
  const [newPenName, setNewPenName] = useState("");
  const [locationCreateError, setLocationCreateError] = useState("");
  const [creatingLocation, setCreatingLocation] = useState(false);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [detail, setDetail] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const branchesQuery = useGetBranchesQuery({ per_page: 100 });
  const branches = branchesQuery.data?.data || [];
  const params = {
    search: search || undefined,
    branch_id: branch || undefined,
    page,
    per_page: 20,
  };
  const barnList = useGetHouseBarnsQuery(
    { ...params, status: (status as "active" | "inactive") || undefined },
    { skip: kind !== "barns" }
  );
  const penList = useGetPenCagePondsQuery(
    {
      ...params,
      house_barn_id: barnFilter || undefined,
      status: (status as "active" | "inactive") || undefined,
    },
    { skip: kind !== "pens" }
  );
  const farmList = useGetFarmInformationRecordsQuery(
    { ...params, house_barn_id: barnFilter || undefined, pen_cage_pond_id: penFilter || undefined },
    { skip: kind !== "farms" }
  );
  const list = kind === "farms" ? farmList : kind === "barns" ? barnList : penList;
  const filterBarns = useGetHouseBarnsQuery(
    { branch_id: branch || undefined, per_page: 100 },
    { skip: kind === "barns" }
  );
  const filterPens = useGetPenCagePondsQuery(
    { branch_id: branch || undefined, house_barn_id: barnFilter || undefined, per_page: 100 },
    { skip: kind !== "farms" }
  );
  const barnOptions = useGetHouseBarnsQuery(
    { branch_id: form.branch_id, status: "active", per_page: 100 },
    { skip: !open || !form.branch_id || kind === "barns" }
  );
  const penOptions = useGetPenCagePondsQuery(
    {
      branch_id: form.branch_id,
      house_barn_id: form.house_barn_id || undefined,
      status: "active",
      per_page: 100,
    },
    { skip: !open || !form.branch_id || kind !== "farms" }
  );
  const barns = barnOptions.currentData?.data || [];
  const pens = penOptions.currentData?.data || [];
  const optionsBusy =
    (kind !== "barns" && barnOptions.isFetching) || (kind === "farms" && penOptions.isFetching);
  const optionsError =
    (kind !== "barns" && barnOptions.isError) || (kind === "farms" && penOptions.isError);
  const [createBarn] = useCreateHouseBarnMutation();
  const [updateBarn] = useUpdateHouseBarnMutation();
  const [deleteBarn] = useDeleteHouseBarnMutation();
  const [toggleBarn] = useToggleHouseBarnStatusMutation();
  const [createPen] = useCreatePenCagePondMutation();
  const [updatePen] = useUpdatePenCagePondMutation();
  const [deletePen] = useDeletePenCagePondMutation();
  const [togglePen] = useTogglePenCagePondStatusMutation();
  const [createFarm] = useCreateFarmInformationRecordMutation();
  const [updateFarm] = useUpdateFarmInformationRecordMutation();
  const [deleteFarm] = useDeleteFarmInformationRecordMutation();
  const [getBarn] = useLazyGetHouseBarnQuery();
  const [getPen] = useLazyGetPenCagePondQuery();
  const [getFarm] = useLazyGetFarmInformationRecordQuery();

  const run = async (action: () => Promise<unknown>, message?: string) => {
    setBusy(true);
    try {
      await action();
      if (message) toast.success(message);
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setBusy(false);
    }
  };
  const begin = (row?: Row) => {
    setEditing(row || null);
    setForm(
      row
        ? {
            name: row.name,
            branch_id: row.branch_id,
            house_barn_id: "house_barn_id" in row ? row.house_barn_id : null,
            pen_cage_pond_id: "pen_cage_pond_id" in row ? row.pen_cage_pond_id : null,
          }
        : { ...emptyForm, branch_id: Number(branch) || 0 }
    );
    setFormError("");
    setOpen(true);
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");
    if (!form.name.trim() || !form.branch_id)
      return setFormError("Enter a name and select a branch.");
    if (kind === "farms" && !form.house_barn_id && !form.pen_cage_pond_id)
      return setFormError("Select a house / barn or a pen / cage / pond.");
    if (
      kind !== "barns" &&
      form.house_barn_id &&
      !barns.some((row) => row.id === form.house_barn_id)
    )
      return setFormError("Select an active house / barn in this branch.");
    if (
      kind === "farms" &&
      form.pen_cage_pond_id &&
      !pens.some((row) => row.id === form.pen_cage_pond_id)
    )
      return setFormError("Select an active pen / cage / pond for this branch and barn.");
    const base = { name: form.name.trim(), branch_id: form.branch_id };
    setBusy(true);
    try {
      if (kind === "barns") {
        if (editing) await updateBarn({ id: editing.id, body: base }).unwrap();
        else await createBarn(base).unwrap();
      } else if (kind === "pens") {
        const body = { ...base, house_barn_id: form.house_barn_id };
        if (editing) await updatePen({ id: editing.id, body }).unwrap();
        else await createPen(body).unwrap();
      } else {
        const body = {
          ...base,
          house_barn_id: form.house_barn_id,
          pen_cage_pond_id: form.pen_cage_pond_id,
        };
        if (editing) await updateFarm({ id: editing.id, body }).unwrap();
        else await createFarm(body).unwrap();
      }
      setOpen(false);
      toast.success(editing ? "Updated successfully" : "Created successfully");
    } catch (error) {
      setFormError(errorText(error));
    } finally {
      setBusy(false);
    }
  };
  const addFarmLocation = async (locationKind: "barn" | "pen") => {
    const name = (locationKind === "barn" ? newBarnName : newPenName).trim();
    if (!form.branch_id) return setLocationCreateError("Select a branch first.");
    if (!name) return setLocationCreateError("Enter a name for this location.");
    setCreatingLocation(true);
    setLocationCreateError("");
    try {
      if (locationKind === "barn") {
        const result = await createBarn({ name, branch_id: form.branch_id }).unwrap();
        await barnOptions.refetch();
        setForm((current) => ({
          ...current,
          house_barn_id: result.data.id,
          pen_cage_pond_id: null,
        }));
        setNewBarnName("");
        setAddBarnOpen(false);
      } else {
        const result = await createPen({
          name,
          branch_id: form.branch_id,
          house_barn_id: form.house_barn_id,
        }).unwrap();
        await penOptions.refetch();
        setForm((current) => ({
          ...current,
          house_barn_id: result.data.house_barn_id,
          pen_cage_pond_id: result.data.id,
        }));
        setNewPenName("");
        setAddPenOpen(false);
      }
    } catch (error) {
      setLocationCreateError(errorText(error));
    } finally {
      setCreatingLocation(false);
    }
  };
  const options = (rows: { id: number; name: string }[]) =>
    rows.map((row) => ({ value: String(row.id), label: row.name }));
  const branchName = (row: Row) =>
    branches.find((b) => b.id === row.branch_id)?.name ||
    ("branch" in row ? row.branch?.name : undefined) ||
    `#${row.branch_id}`;
  const locationName = (row: Row, key: "house_barn" | "pen_cage_pond") => {
    if (key in row) return (row as FarmInformationRecord)[key]?.name || "—";
    if (key === "house_barn" && "house_barn_id" in row)
      return (
        filterBarns.data?.data.find((b) => b.id === row.house_barn_id)?.name ||
        (row.house_barn_id ? `#${row.house_barn_id}` : "Standalone")
      );
    return "—";
  };
  return (
    <div className="mx-auto max-w-7xl space-y-6 text-gray-800 dark:text-gray-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{names[kind]}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage farm locations by branch. Pens, cages and ponds may be standalone or belong to a
            barn.
          </p>
        </div>
        <Button size="sm" onClick={() => begin()}>
          <Plus size={16} />
          Add {kind === "farms" ? "farm" : kind === "barns" ? "house / barn" : "pen / cage / pond"}
        </Button>
      </div>
      <nav aria-label="Farm location setup" className="flex flex-wrap gap-2">
        {(Object.keys(names) as Kind[]).map((key) => (
          <Link
            key={key}
            href={routes[key]}
            aria-current={key === kind ? "page" : undefined}
            className={`rounded-lg px-4 py-2 text-sm ${key === kind ? "bg-green-700 text-white" : "border border-gray-200 dark:border-gray-700"}`}
          >
            {names[key]}
          </Link>
        ))}
      </nav>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Input
          aria-label="Search locations"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <Select
          aria-label="Filter branch"
          value={branch}
          options={[{ value: "", label: "All branches" }, ...options(branches)]}
          onChange={(e) => {
            setBranch(e.target.value);
            setBarnFilter("");
            setPenFilter("");
            setPage(1);
          }}
        />
        {kind !== "barns" && (
          <Select
            aria-label="Filter house / barn"
            value={barnFilter}
            options={[
              { value: "", label: "All houses / barns" },
              ...options(filterBarns.currentData?.data || []),
            ]}
            onChange={(e) => {
              setBarnFilter(e.target.value);
              setPenFilter("");
              setPage(1);
            }}
          />
        )}
        {kind === "farms" ? (
          <Select
            aria-label="Filter pen / cage / pond"
            value={penFilter}
            options={[
              { value: "", label: "All pens / cages / ponds" },
              ...options(filterPens.currentData?.data || []),
            ]}
            onChange={(e) => {
              setPenFilter(e.target.value);
              setPage(1);
            }}
          />
        ) : (
          <Select
            aria-label="Filter status"
            value={status}
            options={[
              { value: "", label: "All statuses" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          />
        )}
      </div>
      {(branchesQuery.isError || filterBarns.isError || filterPens.isError) && (
        <p role="alert" className="text-sm text-red-600">
          Some filter options could not be loaded.{" "}
          <button
            className="underline"
            onClick={() => {
              void branchesQuery.refetch();
              if (kind !== "barns") void filterBarns.refetch();
              if (kind === "farms") void filterPens.refetch();
            }}
          >
            Retry
          </button>
        </p>
      )}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        {list.isFetching ? (
          <p className="p-8 text-center">Loading...</p>
        ) : list.isError ? (
          <div role="alert" className="p-8 text-center text-red-600">
            Unable to load records.{" "}
            <button className="underline" onClick={() => void list.refetch()}>
              Retry
            </button>
          </div>
        ) : !list.data?.data.length ? (
          <p className="p-8 text-center text-gray-500">
            No records found. Add a location to get started.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-gray-500 dark:border-gray-700">
              <tr>
                {[
                  "Name",
                  "Branch",
                  ...(kind !== "barns" ? ["House / Barn"] : []),
                  ...(kind === "farms" ? ["Pen / Cage / Pond"] : ["Status"]),
                  "Actions",
                ].map((label) => (
                  <th key={label} className="px-5 py-3 font-medium">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.data.data.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="px-5 py-4 font-medium">{row.name}</td>
                  <td className="px-5 py-4">{branchName(row)}</td>
                  {kind !== "barns" && (
                    <td className="px-5 py-4">{locationName(row, "house_barn")}</td>
                  )}
                  <td className="px-5 py-4">
                    {kind === "farms"
                      ? locationName(row, "pen_cage_pond")
                      : "status" in row
                        ? row.status
                        : "—"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-1.5 min-w-[300px]">
                      <TableActionButton
                        label="View"
                        tone="green"
                        title={`View ${row.name}`}
                        disabled={busy}
                        icon={<Eye size={14} />}
                        onClick={() =>
                          void run(async () => {
                            const result = await (
                              kind === "barns"
                                ? getBarn(row.id)
                                : kind === "pens"
                                  ? getPen(row.id)
                                  : getFarm(row.id)
                            ).unwrap();
                            setDetail(result.data);
                          })
                        }
                      />
                      <TableActionButton
                        label="Edit"
                        tone="neutral"
                        title={`Edit ${row.name}`}
                        disabled={busy}
                        icon={<Pencil size={14} />}
                        onClick={() => begin(row)}
                      />
                      {kind !== "farms" && "status" in row && (
                        <TableActionButton
                          label={row.status === "active" ? "Deactivate" : "Activate"}
                          tone={row.status === "active" ? "amber" : "green"}
                          title={`${row.status === "active" ? "Deactivate" : "Activate"} ${row.name}`}
                          disabled={busy}
                          icon={<Power size={14} />}
                          onClick={() =>
                            void run(async () => {
                              await (
                                kind === "barns" ? toggleBarn(row.id) : togglePen(row.id)
                              ).unwrap();
                            }, "Status updated")
                          }
                        />
                      )}
                      <TableActionButton
                        label="Delete"
                        tone="red"
                        title={`Delete ${row.name}`}
                        disabled={busy}
                        icon={<Trash2 size={14} />}
                        onClick={() => setDeleting(row)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          Page {page} of {list.data?.meta?.last_page || 1}
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1 || list.isFetching}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= (list.data?.meta?.last_page || 1) || list.isFetching}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
      <Modal
        isOpen={open}
        onClose={() => {
          if (!busy) setOpen(false);
        }}
        className="m-4 max-w-lg"
      >
        <form onSubmit={save} className="space-y-4 p-6">
          <h2 className="text-lg font-bold">
            {editing ? "Edit" : "Add"} {names[kind]}
          </h2>
          <Field label="Name *">
            <Input
              required
              maxLength={255}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Branch *">
            <Select
              required
              value={form.branch_id || ""}
              placeholder="Select branch"
              options={options(
                branches.filter((b) => b.status === "active" || b.id === editing?.branch_id)
              )}
              onChange={(e) =>
                setForm({
                  ...form,
                  branch_id: Number(e.target.value),
                  house_barn_id: null,
                  pen_cage_pond_id: null,
                })
              }
            />
          </Field>
          {kind !== "barns" && (
            <Field label="House / Barn">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <Select
                    disabled={!form.branch_id || optionsBusy || !!optionsError}
                    value={form.house_barn_id || ""}
                    options={[
                      {
                        value: "",
                        label: kind === "pens" ? "Standalone (no barn)" : "No house / barn",
                      },
                      ...options(barns),
                      ...(form.house_barn_id && !barns.some((b) => b.id === form.house_barn_id)
                        ? [
                            {
                              value: String(form.house_barn_id),
                              label: `Unavailable barn #${form.house_barn_id} — choose another`,
                            },
                          ]
                        : []),
                    ]}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        house_barn_id: Number(e.target.value) || null,
                        pen_cage_pond_id: null,
                      })
                    }
                  />
                </div>
                <button
                  type="button"
                  aria-label="Add house / barn"
                  title="Add house / barn"
                  disabled={!form.branch_id || creatingLocation}
                  onClick={() => {
                    setLocationCreateError("");
                    setAddBarnOpen((value) => !value);
                    setAddPenOpen(false);
                  }}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300"
                >
                  <Plus size={18} />
                </button>
              </div>
              {addBarnOpen && (
                <div className="mt-2 flex gap-2">
                  <Input
                    autoFocus
                    aria-label="New house / barn name"
                    placeholder="House / barn name"
                    value={newBarnName}
                    onChange={(e) => setNewBarnName(e.target.value)}
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={creatingLocation || !newBarnName.trim()}
                    onClick={() => void addFarmLocation("barn")}
                  >
                    {creatingLocation ? "Adding..." : "Add"}
                  </Button>
                </div>
              )}
            </Field>
          )}
          {kind === "farms" && (
            <Field label="Pen / Cage / Pond">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <Select
                    disabled={!form.branch_id || optionsBusy || !!optionsError}
                    value={form.pen_cage_pond_id || ""}
                    options={[
                      { value: "", label: "No pen / cage / pond" },
                      ...options(pens),
                      ...(form.pen_cage_pond_id && !pens.some((p) => p.id === form.pen_cage_pond_id)
                        ? [
                            {
                              value: String(form.pen_cage_pond_id),
                              label: `Unavailable location #${form.pen_cage_pond_id} — choose another`,
                            },
                          ]
                        : []),
                    ]}
                    onChange={(e) => {
                      const pen = pens.find((p) => p.id === Number(e.target.value));
                      setForm({
                        ...form,
                        pen_cage_pond_id: pen?.id || null,
                        house_barn_id: pen ? pen.house_barn_id : form.house_barn_id,
                      });
                    }}
                  />
                </div>
                <button
                  type="button"
                  aria-label="Add pen / cage / pond"
                  title="Add pen / cage / pond"
                  aria-expanded={addPenOpen}
                  disabled={!form.branch_id || creatingLocation}
                  onClick={() => {
                    setLocationCreateError("");
                    setAddPenOpen((value) => !value);
                    setAddBarnOpen(false);
                  }}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300"
                >
                  <Plus size={18} />
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">Choose a location or add one with +.</p>
              {addPenOpen && (
                <div className="mt-2 flex gap-2">
                  <Input
                    autoFocus
                    aria-label="New pen / cage / pond name"
                    placeholder="Pen / cage / pond name"
                    value={newPenName}
                    onChange={(e) => setNewPenName(e.target.value)}
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={creatingLocation || !newPenName.trim()}
                    onClick={() => void addFarmLocation("pen")}
                  >
                    {creatingLocation ? "Adding..." : "Add"}
                  </Button>
                </div>
              )}
            </Field>
          )}
          {locationCreateError && (
            <p role="alert" className="text-sm text-red-600">
              {locationCreateError}
            </p>
          )}
          {optionsBusy && (
            <p role="status" className="text-sm text-gray-500">
              Loading locations...
            </p>
          )}
          {optionsError && (
            <p role="alert" className="text-sm text-red-600">
              Unable to load locations.{" "}
              <button
                type="button"
                className="underline"
                onClick={() => {
                  void barnOptions.refetch();
                  if (kind === "farms") void penOptions.refetch();
                }}
              >
                Retry
              </button>
            </p>
          )}
          {formError && (
            <p role="alert" className="text-sm text-red-600">
              {formError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={busy || optionsBusy || !!optionsError || branchesQuery.isError}
            >
              {busy ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
      <Modal
        isOpen={!!deleting}
        onClose={() => {
          if (!busy) setDeleting(null);
        }}
        className="m-4 max-w-md"
      >
        <div className="space-y-4 p-6">
          <h2 className="text-lg font-bold">Delete {deleting?.name}?</h2>
          <p className="text-sm text-gray-500">
            Deleting a record removes it from this list. Referenced houses, barns, pens, cages and
            ponds are protected; deactivate them instead.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" disabled={busy} onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  if (!deleting) return;
                  await (
                    kind === "barns"
                      ? deleteBarn(deleting.id)
                      : kind === "pens"
                        ? deletePen(deleting.id)
                        : deleteFarm(deleting.id)
                  ).unwrap();
                  setDeleting(null);
                }, "Deleted successfully")
              }
            >
              {busy ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
      <Modal isOpen={!!detail} onClose={() => setDetail(null)} className="m-4 max-w-lg">
        <div className="space-y-4 p-6">
          <h2 className="text-lg font-bold">{detail?.name}</h2>
          {detail && (
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <dt>Branch</dt>
              <dd>{branchName(detail)}</dd>
              {kind !== "barns" && (
                <>
                  <dt>House / Barn</dt>
                  <dd>{locationName(detail, "house_barn")}</dd>
                </>
              )}
              {kind === "farms" ? (
                <>
                  <dt>Pen / Cage / Pond</dt>
                  <dd>{locationName(detail, "pen_cage_pond")}</dd>
                </>
              ) : (
                "status" in detail && (
                  <>
                    <dt>Status</dt>
                    <dd>{detail.status}</dd>
                  </>
                )
              )}
              <dt>Updated</dt>
              <dd>{detail.updated_at ? new Date(detail.updated_at).toLocaleString() : "—"}</dd>
            </dl>
          )}
          <Button variant="outline" onClick={() => setDetail(null)}>
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
}

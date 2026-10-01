"use client";

import { useState } from "react";
import { Plus, Eye, Pencil, Users } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Loading from "@/components/common/Loading";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import TableActionButton from "@/components/ui/table/TableActionButton";
import { useGetBranchesQuery } from "@/redux/features/setup/BranchApiSlice";
import {
  StaffPayload,
  StaffRecord,
  useCreateStaffMutation,
  useGetStaffQuery,
  useLazyGetStaffMemberQuery,
  useToggleStaffStatusMutation,
  useUpdateStaffMutation,
} from "@/redux/features/setup/StaffApiSlice";

const emptyForm = (): StaffPayload => ({
  staff_code: "",
  name: "",
  phone_number: "",
  branch_id: 0,
  employment_status: "employed",
});
const inputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white";

export default function StaffPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StaffRecord | null>(null);
  const [detail, setDetail] = useState<StaffRecord | null>(null);
  const [form, setForm] = useState<StaffPayload>(emptyForm);
  const { data, isLoading } = useGetStaffQuery({ per_page: 30 });
  const { data: branchesData, isLoading: branchesLoading } = useGetBranchesQuery({ per_page: 100 });
  const branches = branchesData?.data ?? [];
  const [createStaff, createState] = useCreateStaffMutation();
  const [updateStaff, updateState] = useUpdateStaffMutation();
  const [toggleStatus] = useToggleStaffStatusMutation();
  const [getStaff] = useLazyGetStaffMemberQuery();

  const startCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  };
  const startEdit = (staff: StaffRecord) => {
    setEditing(staff);
    setForm({
      staff_code: staff.staff_code,
      name: staff.name,
      phone_number: staff.phone_number ?? "",
      branch_id: Number(staff.branch_id),
      employment_status: staff.employment_status === "terminated" ? "terminated" : "employed",
    });
    setOpen(true);
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const body = {
        ...form,
        staff_code: form.staff_code.trim(),
        name: form.name.trim(),
        phone_number: form.phone_number?.trim() || null,
      };
      if (editing) await updateStaff({ id: editing.id, body }).unwrap();
      else await createStaff(body).unwrap();
      toast.success(editing ? "Staff updated." : "Staff created.");
      setOpen(false);
    } catch (error) {
      toast.error(
        (error as { data?: { message?: string } })?.data?.message || "Could not save staff."
      );
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Users className="text-emerald-700" size={24} />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staff</h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Manage staff records used by financial staff services.
          </p>
        </div>
        <Button onClick={startCreate}>
          <Plus size={16} /> Add staff
        </Button>
      </header>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loading />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {["Staff code", "Name", "Branch", "Phone", "Employment", "Status", "Actions"].map(
                  (h) => (
                    <TableCell
                      key={h}
                      isHeader
                      className="px-4 py-3 text-xs font-semibold text-gray-500"
                    >
                      {h}
                    </TableCell>
                  )
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.data ?? []).map((staff) => (
                <TableRow key={staff.id}>
                  <TableCell className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                    {staff.staff_code}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">
                    {staff.name}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {staff.branch?.name ?? `#${staff.branch_id}`}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {staff.phone_number || "—"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm capitalize text-gray-600 dark:text-gray-300">
                    {staff.employment_status}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                        staff.status === "active"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : staff.status === "inactive"
                            ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                      }`}
                    >
                      {staff.status ?? "Unknown"}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <TableActionButton
                        label="View"
                        tone="neutral"
                        icon={<Eye size={14} />}
                        onClick={() =>
                          void getStaff(staff.id)
                            .unwrap()
                            .then((r) => setDetail(r.data))
                            .catch(() => toast.error("Could not load staff."))
                        }
                      />
                      <TableActionButton
                        label="Edit"
                        tone="neutral"
                        icon={<Pencil size={14} />}
                        onClick={() => startEdit(staff)}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className={
                          staff.status === "active"
                            ? "!bg-red-50 !text-red-700 !ring-red-200 hover:!bg-red-100 dark:!bg-red-950/40 dark:!text-red-300 dark:!ring-red-900"
                            : "!bg-emerald-50 !text-emerald-700 !ring-emerald-200 hover:!bg-emerald-100 dark:!bg-emerald-950/40 dark:!text-emerald-300 dark:!ring-emerald-900"
                        }
                        onClick={async () => {
                          try {
                            await toggleStatus(staff.id).unwrap();
                            toast.success("Staff status updated.");
                          } catch {
                            toast.error("Could not update staff status.");
                          }
                        }}
                      >
                        {staff.status === "active" ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!isLoading && !data?.data.length && (
          <p className="py-12 text-center text-sm text-gray-500">No staff found.</p>
        )}
      </div>
      <Modal isOpen={open} onClose={() => setOpen(false)} className="m-4 max-w-xl">
        <form onSubmit={submit} className="space-y-4 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {editing ? "Edit staff" : "Add staff"}
          </h2>
          <label className="block text-xs font-medium text-gray-600">
            Staff code
            <Input
              required
              value={form.staff_code}
              onChange={(e) => setForm({ ...form, staff_code: e.target.value })}
            />
          </label>
          <label className="block text-xs font-medium text-gray-600">
            Name
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label className="block text-xs font-medium text-gray-600">
            Phone number
            <Input
              value={form.phone_number ?? ""}
              onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
            />
          </label>
          <label className="block text-xs font-medium text-gray-600">
            Branch
            <select
              required
              className={inputClass}
              value={form.branch_id || ""}
              disabled={branchesLoading || branches.length === 0}
              onChange={(e) => setForm({ ...form, branch_id: Number(e.target.value) })}
            >
              <option value="" disabled>
                {branchesLoading ? "Loading branches…" : "Select a branch"}
              </option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} · {branch.code}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-gray-600">
            Employment status
            <select
              className={inputClass}
              value={form.employment_status}
              onChange={(e) =>
                setForm({
                  ...form,
                  employment_status: e.target.value as StaffPayload["employment_status"],
                })
              }
            >
              <option value="employed">Employed</option>
              <option value="terminated">Terminated</option>
            </select>
          </label>
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createState.isLoading || updateState.isLoading}>
              {editing ? "Save changes" : "Create staff"}
            </Button>
          </div>
        </form>
      </Modal>
      <Modal isOpen={!!detail} onClose={() => setDetail(null)} className="m-4 max-w-md">
        <div className="space-y-3 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Staff details</h2>
          {detail && (
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <dt className="text-gray-500">Code</dt>
              <dd>{detail.staff_code}</dd>
              <dt className="text-gray-500">Name</dt>
              <dd>{detail.name}</dd>
              <dt className="text-gray-500">Branch</dt>
              <dd>{detail.branch?.name ?? detail.branch_id}</dd>
              <dt className="text-gray-500">Employment</dt>
              <dd>{detail.employment_status}</dd>
              <dt className="text-gray-500">Status</dt>
              <dd>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                    detail.status === "active"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : detail.status === "inactive"
                        ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                        : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                  }`}
                >
                  {detail.status ?? "Unknown"}
                </span>
              </dd>
            </dl>
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setDetail(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

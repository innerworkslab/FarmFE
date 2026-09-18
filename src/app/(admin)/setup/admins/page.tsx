"use client";

import React, { useState } from "react";
import {
  useGetSetupAdminsQuery,
  useCreateSetupAdminMutation,
  useUpdateSetupAdminMutation,
  useDeleteSetupAdminMutation,
  SetupAdminUser,
  SetupAdminPayload,
} from "@/redux/features/setup/AdminSetupApiSlice";
import { useGetSetupRolesQuery } from "@/redux/features/setup/RoleSetupApiSlice";
import { useGetBranchesQuery } from "@/redux/features/setup/BranchApiSlice";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Loading from "@/components/common/Loading";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, UserCheck } from "lucide-react";

export default function AdminsPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, refetch } = useGetSetupAdminsQuery({ search: search || undefined });
  const { data: rolesData } = useGetSetupRolesQuery();
  const { data: branchesData } = useGetBranchesQuery();

  const admins = data?.data || [];
  const roles = rolesData?.data || [];
  const branches = branchesData?.data || [];

  const [createAdmin, { isLoading: isCreating }] = useCreateSetupAdminMutation();
  const [updateAdmin, { isLoading: isUpdating }] = useUpdateSetupAdminMutation();
  const [deleteAdmin, { isLoading: isDeleting }] = useDeleteSetupAdminMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SetupAdminUser | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [form, setForm] = useState<SetupAdminPayload>({
    name: "",
    email: "",
    username: "",
    password: "",
    account_status: "active",
    two_factor_enabled: false,
    roles: [],
    branch_ids: [],
  });
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<number | "">("");

  const handleOpenAdd = () => {
    setEditingItem(null);
    setForm({
      name: "",
      email: "",
      username: "",
      password: "",
      account_status: "active",
      two_factor_enabled: false,
      roles: [],
      branch_ids: [],
    });
    setSelectedRole("");
    setSelectedBranch("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: SetupAdminUser) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      email: item.email,
      username: item.username,
      account_status: item.account_status || "active",
      two_factor_enabled: !!item.two_factor_enabled,
      roles: item.roles || [],
      branch_ids: item.branch_ids || [],
    });
    setSelectedRole(item.roles?.[0] || "");
    setSelectedBranch(item.branch_ids?.[0] || "");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: SetupAdminPayload = {
      ...form,
      roles: selectedRole ? [selectedRole] : [],
      branch_ids: selectedBranch ? [Number(selectedBranch)] : [],
    };

    try {
      if (editingItem) {
        await updateAdmin({ id: editingItem.id, body: payload }).unwrap();
        toast.success("Admin updated successfully");
      } else {
        await createAdmin(payload).unwrap();
        toast.success("Admin created successfully");
      }
      setIsModalOpen(false);
      refetch();
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteAdmin(deletingId).unwrap();
      toast.success("Admin deleted successfully");
      setDeletingId(null);
      refetch();
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Failed to delete admin");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="text-[#15803d] dark:text-emerald-400" size={26} />
            <h1 className="text-2xl font-extrabold text-[#1E293B] dark:text-white tracking-tight">
              Admins
            </h1>
          </div>
          <p className="text-sm text-[#64748B] dark:text-gray-400 mt-1">
            Manage system administrators, usernames, roles, and branch assignments.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 bg-[#15803d] hover:bg-[#14532d] text-white font-medium text-sm px-4 py-2.5 rounded-lg shadow-sm transition-all"
        >
          <Plus size={18} />
          Add Admin
        </button>
      </div>

      {/* Filter */}
      <div className="w-full sm:w-80">
        <Input
          type="text"
          placeholder="Search admins..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loading />
          </div>
        ) : admins.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No admins found.
          </div>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">No.</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Name</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Email</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Username</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Role</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Status</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {admins.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="px-5 py-3.5 text-gray-500 text-sm">{index + 1}</TableCell>
                    <TableCell className="px-5 py-3.5 font-semibold text-gray-900 dark:text-white text-sm">{item.name}</TableCell>
                    <TableCell className="px-5 py-3.5 text-gray-500 text-sm">{item.email}</TableCell>
                    <TableCell className="px-5 py-3.5 text-gray-500 text-sm">{item.username}</TableCell>
                    <TableCell className="px-5 py-3.5 text-gray-500 text-sm">
                      <div className="flex flex-wrap gap-1">
                        {item.roles && item.roles.length > 0 ? (
                          item.roles.map((r, i) => (
                            <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded font-medium">
                              {r}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">None</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          item.account_status === "active"
                            ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {item.account_status}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-gray-600 hover:text-[#15803d] hover:bg-green-50 dark:hover:bg-green-950/20 rounded-md transition"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setDeletingId(item.id)}
                          className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} className="max-w-[520px] m-4">
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {editingItem ? "Edit Admin" : "Add New Admin"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name *
              </label>
              <Input
                type="text"
                required
                placeholder="e.g. John Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address *
              </label>
              <Input
                type="email"
                required
                placeholder="e.g. admin@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username *
              </label>
              <Input
                type="text"
                required
                placeholder="e.g. admin_john"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </div>

            {!editingItem && (
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password *
                </label>
                <Input
                  type="password"
                  required
                  placeholder="Secret password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <option value="">Select Role</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Branch Assignment
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none"
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value ? Number(e.target.value) : "")}
                >
                  <option value="">All Branches</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Account Status
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none"
                value={form.account_status}
                onChange={(e) => setForm({ ...form, account_status: e.target.value as "active" | "inactive" | "suspended" })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <Button type="button" size="sm" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating ? "Saving..." : editingItem ? "Update Admin" : "Create Admin"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deletingId} onClose={() => setDeletingId(null)} className="max-w-[400px] m-4">
        <div className="p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <Trash2 size={24} />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Delete Admin</h3>
          <p className="text-xs text-gray-500">
            Are you sure you want to delete this admin user?
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button size="sm" variant="outline" onClick={() => setDeletingId(null)}>
              Cancel
            </Button>
            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" disabled={isDeleting} onClick={handleDelete}>
              {isDeleting ? "Deleting..." : "Yes, Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

"use client";

import React, { useMemo, useState } from "react";
import {
  useGetSetupRolesQuery,
  useCreateSetupRoleMutation,
  useUpdateSetupRoleMutation,
  useToggleSetupRoleStatusMutation,
  useDeleteSetupRoleMutation,
  SetupRole,
  SetupRolePayload,
} from "@/redux/features/setup/RoleSetupApiSlice";
import { useGetBranchesQuery } from "@/redux/features/setup/BranchApiSlice";
import { useGetPermissionCatalogQuery } from "@/redux/features/auth/AuthApiSlice";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import TableActionButton from "@/components/ui/table/TableActionButton";
import { Modal } from "@/components/ui/modal";
import { Switch } from "@/components/ui/switch";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Loading from "@/components/common/Loading";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ShieldCheck, X, Search } from "lucide-react";

type PermissionGroup = {
  name: string;
  permissions: { key: string; label: string }[];
};

// Exact canonical permissions seeded in backend Spatie permissions database
const CANONICAL_PERMISSIONS: { key: string; label: string; group: string }[] = [
  // System & Authorization
  { key: "authorization.permissions.view", label: "View System Permissions Catalog", group: "System & Authorization" },
  { key: "setup.view", label: "View Setup Section", group: "System & Authorization" },
  { key: "setup.manage", label: "Full Setup Management", group: "System & Authorization" },

  // Core Foundation: Branches
  { key: "setup.branches.view", label: "View Branches", group: "Core: Branches" },
  { key: "setup.branches.create", label: "Create Branches", group: "Core: Branches" },
  { key: "setup.branches.update", label: "Update Branches", group: "Core: Branches" },
  { key: "setup.branches.delete", label: "Delete Branches", group: "Core: Branches" },

  // Core Foundation: Roles
  { key: "setup.roles.view", label: "View Roles", group: "Core: Roles" },
  { key: "setup.roles.create", label: "Create Roles", group: "Core: Roles" },
  { key: "setup.roles.update", label: "Update Roles", group: "Core: Roles" },
  { key: "setup.roles.delete", label: "Delete Roles", group: "Core: Roles" },

  // Core Foundation: Admins
  { key: "setup.admins.view", label: "View Admin Accounts", group: "Core: Admins" },
  { key: "setup.admins.create", label: "Create Admin Accounts", group: "Core: Admins" },
  { key: "setup.admins.update", label: "Update Admin Accounts", group: "Core: Admins" },
  { key: "setup.admins.delete", label: "Delete Admin Accounts", group: "Core: Admins" },

  // Core Foundation: Audit Logs
  { key: "setup.audit.view", label: "View Activity & Audit Logs", group: "Core: Audit" },

  // Business Masters: Customers
  { key: "setup.customers.view", label: "View Customers", group: "Masters: Customers" },
  { key: "setup.customers.create", label: "Create Customers", group: "Masters: Customers" },
  { key: "setup.customers.update", label: "Update Customers", group: "Masters: Customers" },
  { key: "setup.customers.delete", label: "Delete Customers", group: "Masters: Customers" },

  // Business Masters: Suppliers
  { key: "setup.suppliers.view", label: "View Suppliers", group: "Masters: Suppliers" },
  { key: "setup.suppliers.create", label: "Create Suppliers", group: "Masters: Suppliers" },
  { key: "setup.suppliers.update", label: "Update Suppliers", group: "Masters: Suppliers" },
  { key: "setup.suppliers.delete", label: "Delete Suppliers", group: "Masters: Suppliers" },

  // Business Masters: Foods / Feed
  { key: "setup.foods.view", label: "View Animal Feeds", group: "Masters: Animal Feeds" },
  { key: "setup.foods.create", label: "Create Animal Feeds", group: "Masters: Animal Feeds" },
  { key: "setup.foods.update", label: "Update Animal Feeds", group: "Masters: Animal Feeds" },
  { key: "setup.foods.delete", label: "Delete Animal Feeds", group: "Masters: Animal Feeds" },

  // Business Masters: Medicines
  { key: "setup.medicines.view", label: "View Veterinary Medicines", group: "Masters: Medicines" },
  { key: "setup.medicines.create", label: "Create Veterinary Medicines", group: "Masters: Medicines" },
  { key: "setup.medicines.update", label: "Update Veterinary Medicines", group: "Masters: Medicines" },
  { key: "setup.medicines.delete", label: "Delete Veterinary Medicines", group: "Masters: Medicines" },

  // Business Masters: Animals
  { key: "setup.animals.view", label: "View Livestock Animals", group: "Masters: Animals" },
  { key: "setup.animals.create", label: "Create Livestock Animals", group: "Masters: Animals" },
  { key: "setup.animals.update", label: "Update Livestock Animals", group: "Masters: Animals" },
  { key: "setup.animals.delete", label: "Delete Livestock Animals", group: "Masters: Animals" },

  // Business Masters: Equipment
  { key: "setup.equipment.view", label: "View Farm Equipment", group: "Masters: Equipment" },
  { key: "setup.equipment.create", label: "Create Farm Equipment", group: "Masters: Equipment" },
  { key: "setup.equipment.update", label: "Update Farm Equipment", group: "Masters: Equipment" },
  { key: "setup.equipment.delete", label: "Delete Farm Equipment", group: "Masters: Equipment" },

  // Business Masters: Warehouses / Inventories
  { key: "setup.inventories.view", label: "View Warehouses", group: "Masters: Warehouses" },
  { key: "setup.inventories.create", label: "Create Warehouses", group: "Masters: Warehouses" },
  { key: "setup.inventories.update", label: "Update Warehouses", group: "Masters: Warehouses" },
  { key: "setup.inventories.delete", label: "Delete Warehouses", group: "Masters: Warehouses" },

  // Business Masters: Units of Measure
  { key: "setup.uoms.view", label: "View Units of Measure", group: "Masters: UOMs" },
  { key: "setup.uoms.create", label: "Create Units of Measure", group: "Masters: UOMs" },
  { key: "setup.uoms.update", label: "Update Units of Measure", group: "Masters: UOMs" },
  { key: "setup.uoms.delete", label: "Delete Units of Measure", group: "Masters: UOMs" },

  // Business Masters: Farm Housing / Info
  { key: "setup.farm-information.view", label: "View Farm Housing Info", group: "Masters: Farm Information" },
  { key: "setup.farm-information.create", label: "Create Farm Housing Info", group: "Masters: Farm Information" },
  { key: "setup.farm-information.update", label: "Update Farm Housing Info", group: "Masters: Farm Information" },
  { key: "setup.farm-information.delete", label: "Delete Farm Housing Info", group: "Masters: Farm Information" },

  // Purchasing Foundation
  { key: "purchasing.view", label: "View Purchasing Section", group: "Purchasing Foundation" },
  { key: "purchasing.manage", label: "Full Purchasing Management", group: "Purchasing Foundation" },
  { key: "purchasing.invoices.view", label: "View Purchase Invoices", group: "Purchasing Foundation" },
  { key: "purchasing.invoices.create", label: "Create Purchase Invoices", group: "Purchasing Foundation" },
  { key: "purchasing.invoices.update", label: "Update Purchase Invoices", group: "Purchasing Foundation" },
  { key: "purchasing.invoices.cancel", label: "Cancel Purchase Invoices", group: "Purchasing Foundation" },
  { key: "purchasing.receipts.view", label: "View Goods Receipts", group: "Purchasing Foundation" },
  { key: "purchasing.receipts.create", label: "Create Goods Receipts", group: "Purchasing Foundation" },
  { key: "purchasing.receipts.confirm", label: "Confirm Goods Receipts", group: "Purchasing Foundation" },

  // Inventory Foundation
  { key: "inventory.view", label: "View Inventory Section", group: "Inventory Foundation" },
  { key: "inventory.manage", label: "Full Inventory Management", group: "Inventory Foundation" },
  { key: "inventory.items.view", label: "View Inventory Items", group: "Inventory Foundation" },
  { key: "inventory.balances.view", label: "View Warehouse Balances", group: "Inventory Foundation" },
  { key: "inventory.ledger.view", label: "View Inventory Ledger", group: "Inventory Foundation" },
  { key: "inventory.confirmations.view", label: "View Inventory Confirmations", group: "Inventory Foundation" },
  { key: "inventory.history.export", label: "Export Inventory Movement History", group: "Inventory Foundation" },
  { key: "inventory.adjustments.view", label: "View Stock Adjustments", group: "Inventory Adjustments" },
  { key: "inventory.adjustments.create", label: "Create Stock Adjustments", group: "Inventory Adjustments" },
  { key: "inventory.adjustments.update", label: "Update Stock Adjustments", group: "Inventory Adjustments" },
  { key: "inventory.adjustments.submit", label: "Submit Stock Adjustments", group: "Inventory Adjustments" },
  { key: "inventory.adjustments.confirm", label: "Confirm / Post Adjustments", group: "Inventory Adjustments" },
  { key: "inventory.adjustments.reverse", label: "Reverse Stock Adjustments", group: "Inventory Adjustments" },

  // Operations & Business Modules
  { key: "farms.view", label: "View Farms Section", group: "Operations & Business" },
  { key: "farms.manage", label: "Manage Farms", group: "Operations & Business" },
  { key: "sales.view", label: "View Sales Section", group: "Operations & Business" },
  { key: "sales.manage", label: "Manage Sales", group: "Operations & Business" },
  { key: "financial.view", label: "View Financial Section", group: "Operations & Business" },
  { key: "financial.manage", label: "Manage Financials", group: "Operations & Business" },
];

function formatPermissionLabel(key: string): string {
  const parts = key.split(".");
  const action = parts[parts.length - 1];
  const domain = parts.slice(0, parts.length - 1).join(" ");
  return `${action.toUpperCase()} - ${domain}`;
}

export default function RolesPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, refetch } = useGetSetupRolesQuery({ search: search || undefined });
  const { data: branchesData } = useGetBranchesQuery();
  const { data: catalogData } = useGetPermissionCatalogQuery();

  const roles = data?.data || [];
  const branches = branchesData?.data || [];

  const [createRole, { isLoading: isCreating }] = useCreateSetupRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateSetupRoleMutation();
  const [toggleStatus] = useToggleSetupRoleStatusMutation();
  const [deleteRole, { isLoading: isDeleting }] = useDeleteSetupRoleMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SetupRole | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [viewingRolePermissions, setViewingRolePermissions] = useState<SetupRole | null>(null);

  const [form, setForm] = useState<SetupRolePayload>({
    name: "",
    branch_id: null,
    status: "active",
    permissions: [],
  });

  // Build structured groups strictly from valid permissions
  const allAvailablePermissions = useMemo<PermissionGroup[]>(() => {
    // If backend catalog is available, gather all valid keys
    const apiKeys = (catalogData?.data || []).map((p) => p.name);
    const validKeySet = new Set(apiKeys.length > 0 ? apiKeys : CANONICAL_PERMISSIONS.map((p) => p.key));

    const groupedMap = new Map<string, { key: string; label: string }[]>();

    // 1. Group canonical permissions that are in validKeySet
    for (const item of CANONICAL_PERMISSIONS) {
      if (validKeySet.has(item.key)) {
        if (!groupedMap.has(item.group)) {
          groupedMap.set(item.group, []);
        }
        groupedMap.get(item.group)!.push({ key: item.key, label: item.label });
      }
    }

    // 2. If backend returned extra permissions not in canonical list, place them in Extra group
    const knownKeys = new Set(CANONICAL_PERMISSIONS.map((p) => p.key));
    const extraKeys = apiKeys.filter((k) => !knownKeys.has(k));
    if (extraKeys.length > 0) {
      groupedMap.set(
        "Other API Permissions",
        extraKeys.map((k) => ({ key: k, label: formatPermissionLabel(k) }))
      );
    }

    return Array.from(groupedMap.entries()).map(([name, permissions]) => ({
      name,
      permissions,
    }));
  }, [catalogData]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setForm({
      name: "",
      branch_id: null,
      status: "active",
      permissions: ["setup.branches.view", "setup.admins.view"],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: SetupRole) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      branch_id: item.branch_id || null,
      status: item.status || "active",
      permissions: item.permissions || [],
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: SetupRolePayload = {
      ...form,
      permissions: form.permissions || [],
    };

    try {
      if (editingItem) {
        await updateRole({ id: editingItem.id, body: payload }).unwrap();
        toast.success("Role updated successfully");
      } else {
        await createRole(payload).unwrap();
        toast.success("Role created successfully");
      }
      setIsModalOpen(false);
      refetch();
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Operation failed");
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await toggleStatus(id).unwrap();
      toast.success("Role status toggled");
      refetch();
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Failed to toggle status");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteRole(deletingId).unwrap();
      toast.success("Role deleted successfully");
      setDeletingId(null);
      refetch();
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Failed to delete role");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-[#15803d] dark:text-emerald-400" size={26} />
            <h1 className="text-2xl font-extrabold text-[#1E293B] dark:text-white tracking-tight">
              Roles & Permissions
            </h1>
          </div>
          <p className="text-sm text-[#64748B] dark:text-gray-400 mt-1">
            Manage administrative roles, scopes, and granular access permissions.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 bg-[#15803d] hover:bg-[#14532d] text-white font-medium text-sm px-4 py-2.5 rounded-lg shadow-sm transition-all"
        >
          <Plus size={18} />
          Add Role
        </button>
      </div>

      {/* Filter */}
      <div className="w-full sm:w-80">
        <Input
          type="text"
          placeholder="Search roles..."
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
        ) : roles.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No roles found.
          </div>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">No.</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Role Name</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Branch Scope</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Permissions</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Status</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-xs">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {roles.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="px-5 py-3.5 text-gray-500 text-sm">{index + 1}</TableCell>
                    <TableCell className="px-5 py-3.5 font-semibold text-gray-900 dark:text-white text-sm">{item.name}</TableCell>
                    <TableCell className="px-5 py-3.5 text-gray-500 text-sm">{item.branch?.name || "Global (All Branches)"}</TableCell>
                    <TableCell className="px-5 py-3.5 text-gray-500 text-sm">
                      {item.permissions && item.permissions.length > 0 ? (
                        <div className="flex items-center gap-1.5 flex-wrap max-w-sm">
                          {item.permissions.slice(0, 2).map((p, i) => (
                            <span
                              key={i}
                              className="inline-block px-2 py-0.5 bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-300 text-xs rounded border border-green-200 dark:border-green-800 font-mono truncate max-w-[150px]"
                              title={p}
                            >
                              {p}
                            </span>
                          ))}
                          {item.permissions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => setViewingRolePermissions(item)}
                              className="inline-flex items-center px-2 py-0.5 bg-[#15803d]/10 hover:bg-[#15803d]/20 text-[#15803d] dark:text-emerald-400 text-xs font-semibold rounded border border-[#15803d]/20 transition cursor-pointer"
                              title="Click to view all permissions"
                            >
                              +{item.permissions.length - 2} more ({item.permissions.length} total)
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">0 permissions</span>
                      )}
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          item.status === "active"
                            ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {item.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-sm">
                      <div className="flex items-center gap-2">
                        <TableActionButton label="Edit" tone="neutral" onClick={() => handleOpenEdit(item)} icon={<Pencil size={14} />} />
                        <Switch
                          checked={item.status === "active"}
                          onClick={() => handleToggle(item.id)}
                        />
                        <TableActionButton label="Delete" tone="red" onClick={() => setDeletingId(item.id)} icon={<Trash2 size={14} />} />
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
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} className="max-w-[650px] m-4">
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {editingItem ? "Edit Role" : "Add New Role"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role Name *
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. inventory-manager"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Branch Scope (Optional)
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none"
                  value={form.branch_id || ""}
                  onChange={(e) => setForm({ ...form, branch_id: e.target.value ? Number(e.target.value) : null })}
                >
                  <option value="">Global / All Branches</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <PermissionSelector
                groups={allAvailablePermissions}
                selected={form.permissions || []}
                onChange={(permissions) => setForm((prev) => ({ ...prev, permissions }))}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "inactive" })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <Button type="button" size="sm" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating ? "Saving..." : editingItem ? "Update Role" : "Create Role"}
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
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Delete Role</h3>
          <p className="text-xs text-gray-500">
            Are you sure you want to delete this role? This action cannot be undone.
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

      {/* View All Permissions Modal */}
      <Modal
        isOpen={!!viewingRolePermissions}
        onClose={() => setViewingRolePermissions(null)}
        className="max-w-[600px] m-4"
      >
        <div className="p-6">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="text-[#15803d] dark:text-emerald-400" size={20} />
                {viewingRolePermissions?.name} Permissions
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Total {viewingRolePermissions?.permissions?.length || 0} permissions assigned to this role.
              </p>
            </div>
          </div>

          <div className="my-4 max-h-80 overflow-y-auto pr-1">
            <div className="flex flex-wrap gap-1.5">
              {viewingRolePermissions?.permissions?.map((p, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-300 text-xs rounded-md border border-green-200 dark:border-green-800 font-mono"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-800">
            <Button size="sm" variant="outline" onClick={() => setViewingRolePermissions(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function PermissionSelector({
  groups,
  selected,
  onChange,
}: {
  groups: PermissionGroup[];
  selected: string[];
  onChange: (selected: string[]) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const togglePermission = (key: string) => {
    if (selected.includes(key)) {
      onChange(selected.filter((k) => k !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  const selectAll = () => {
    const allKeys = Array.from(
      new Set(groups.flatMap((g) => g.permissions.map((p) => p.key)))
    );
    onChange(allKeys);
  };

  const clearAll = () => {
    onChange([]);
  };

  const toggleGroup = (group: PermissionGroup) => {
    const groupKeys = group.permissions.map((p) => p.key);
    const allInGroupSelected = groupKeys.every((k) => selected.includes(k));
    if (allInGroupSelected) {
      onChange(selected.filter((k) => !groupKeys.includes(k)));
    } else {
      const combined = Array.from(new Set([...selected, ...groupKeys]));
      onChange(combined);
    }
  };

  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return groups;
    const term = searchTerm.toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        permissions: g.permissions.filter(
          (p) => p.key.toLowerCase().includes(term) || p.label.toLowerCase().includes(term)
        ),
      }))
      .filter((g) => g.permissions.length > 0);
  }, [groups, searchTerm]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
          Permissions ({selected.length} Selected)
        </label>
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={selectAll}
            className="text-[#15803d] dark:text-emerald-400 hover:underline font-medium"
          >
            Select All
          </button>
          <span className="text-gray-300">|</span>
          <button
            type="button"
            onClick={clearAll}
            className="text-gray-500 hover:text-red-500 dark:text-gray-400 font-medium"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Selected tags chip cloud */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 max-h-24 overflow-y-auto">
          {selected.map((key) => (
            <span
              key={key}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#15803d]/10 text-[#15803d] dark:bg-[#15803d]/20 dark:text-emerald-400 text-xs font-medium border border-[#15803d]/20"
            >
              <span>{key}</span>
              <button
                type="button"
                onClick={() => togglePermission(key)}
                className="hover:text-red-600 focus:outline-none"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 text-gray-400" size={15} />
        <input
          type="text"
          placeholder="Search permissions (e.g. branch, invoice, inventory)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 pl-9 pr-3 py-2 text-xs text-gray-800 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#15803d]"
        />
      </div>

      {/* Grouped Permission Checkboxes */}
      <div className="space-y-3 max-h-64 overflow-y-auto pr-1 border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-900/50">
        {filteredGroups.map((group) => {
          const groupKeys = group.permissions.map((p) => p.key);
          const allGroupSelected = groupKeys.length > 0 && groupKeys.every((k) => selected.includes(k));

          return (
            <div key={group.name} className="space-y-1.5 pb-2 border-b border-gray-100 dark:border-gray-800 last:border-0 last:pb-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{group.name}</span>
                <button
                  type="button"
                  onClick={() => toggleGroup(group)}
                  className="text-[11px] font-medium text-[#15803d] dark:text-emerald-400 hover:underline"
                >
                  {allGroupSelected ? "Deselect Group" : "Select Group"}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                {group.permissions.map((p) => {
                  const isChecked = selected.includes(p.key);
                  return (
                    <label
                      key={p.key}
                      className={`flex items-start gap-2 p-1.5 rounded-md text-xs cursor-pointer transition select-none ${
                        isChecked
                          ? "bg-[#15803d]/10 text-gray-900 dark:text-white"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePermission(p.key)}
                        className="mt-0.5 rounded border-gray-300 text-[#15803d] focus:ring-[#15803d] dark:border-gray-700"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-[11px] font-medium truncate">{p.key}</div>
                        <div className="text-[10px] text-gray-500 truncate">{p.label}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

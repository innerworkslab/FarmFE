"use client";

import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { useEffect, useMemo, useState } from "react";
import { useGetAdminsQuery, useToggleAdminStatusMutation, useAssignAdminRolesMutation, AdminUser } from "@/redux/features/admin/AdminApiSlice";
import Pagination from "@/components/tables/Pagination";
import { Switch } from "@/components/ui/switch";
import Loading from "@/components/common/Loading";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import { setCurrentPage } from "@/redux/features/PaginationSlice";
import { useDebounce } from "@/hooks/useDebounce";
import Input from "@/components/form/input/InputField";
import { DEFAULT_PER_PAGE } from "@/lib/constants";
import { useGetRolesQuery } from "@/redux/features/roles/RoleApiSlice";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { Check, Shield } from "lucide-react";

const getRoleApiValue = (role: { slug?: string; name: string }) => role.slug || role.name;

export default function AdminTable() {
  const dispatch = useAppDispatch();
  const currentPage = useAppSelector((state) => state.pagination.currentPage);
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebounce(searchText);

  const { data, isLoading, refetch } = useGetAdminsQuery({
    page: currentPage,
    search: debouncedSearchText || undefined,
  });

  const totalPages = data?.meta?.last_page ?? 1;
  const perPage = data?.meta?.per_page ?? DEFAULT_PER_PAGE;
  const admins: AdminUser[] = data?.data ?? [];

  const [toggleAdminStatus] = useToggleAdminStatusMutation();
  const [assignAdminRoles, { isLoading: isAssigningRoles }] = useAssignAdminRolesMutation();
  const { data: rolesData } = useGetRolesQuery();
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const roles = useMemo(() => rolesData?.data ?? [], [rolesData]);

  useEffect(() => {
    if (selectedAdmin) {
      const normalizedRoles = (selectedAdmin.roles ?? []).map((assignedRole) => {
        const matchedRole = roles.find(
          (role) => role.slug === assignedRole || role.name === assignedRole
        );
        return matchedRole ? getRoleApiValue(matchedRole) : assignedRole;
      });
      setSelectedRoles(normalizedRoles);
    }
  }, [selectedAdmin, roles]);

  const handleToggleActive = async (id: number) => {
    try {
      await toggleAdminStatus(id).unwrap();
      toast.success("Admin status toggled successfully");
      refetch();
    } catch (error) {
      console.log(error);
      toast.error("Failed to update admin status");
    }
  };

  const handleToggleRole = (roleValue: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleValue) ? prev.filter((item) => item !== roleValue) : [...prev, roleValue]
    );
  };

  const handleAssignRoles = async () => {
    if (!selectedAdmin) return;

    try {
      await assignAdminRoles({
        id: selectedAdmin.id,
        roles: selectedRoles,
      }).unwrap();
      toast.success("Admin roles updated successfully");
      setSelectedAdmin(null);
      refetch();
    } catch (error) {
      console.log(error);
      toast.error("Failed to update admin roles");
    }
  };

  return (
    <div className="">
      <div className="flex items-center justify-between mb-4">
        <div className="w-full sm:w-80">
          <Input
            type="text"
            placeholder="Search admins by name or username..."
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-full">
            {isLoading && (
              <div className="flex items-center justify-center h-64">
                <Loading />
              </div>
            )}

            {!isLoading && admins.length === 0 && (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">No admins found</p>
              </div>
            )}
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-theme-xs">
                    No.
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-theme-xs">
                    Admin Name
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-theme-xs">
                    Email
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-theme-xs">
                    Username
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-theme-xs">
                    Roles
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-theme-xs">
                    Status
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start text-gray-500 font-medium text-theme-xs">
                    Action
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {admins.map((admin, index) => (
                  <TableRow key={admin.id}>
                    <TableCell className="px-4 py-3 text-start text-gray-500 text-theme-sm">
                      {(currentPage - 1) * perPage + index + 1}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start text-gray-900 font-medium text-theme-sm dark:text-white">
                      {admin.name}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start text-gray-500 text-theme-sm">
                      {admin.email}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start text-gray-500 text-theme-sm">
                      {admin.username}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start text-gray-500 text-theme-sm">
                      <div className="flex flex-wrap gap-1">
                        {admin.roles && admin.roles.length > 0 ? (
                          admin.roles.map((r, i) => (
                            <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded font-medium">
                              {r}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">None</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start text-gray-500 text-theme-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          admin.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {admin.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-theme-sm text-gray-500">
                      <span className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedAdmin(admin)}
                          className="inline-flex items-center gap-1 rounded-md border border-green-200 px-2 py-1 text-xs font-medium text-[#15803d] hover:bg-green-50 dark:hover:bg-green-950/20"
                        >
                          <Shield size={12} />
                          Roles
                        </button>
                        <Switch
                          checked={admin.is_active}
                          onClick={() => handleToggleActive(admin.id)}
                        />
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-center m-5">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => dispatch(setCurrentPage(page))}
              />
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={!!selectedAdmin}
        onClose={() => setSelectedAdmin(null)}
        className="max-w-[520px] m-4"
      >
        <div className="rounded-3xl bg-white p-6 dark:bg-gray-900">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Assign Roles
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {selectedAdmin?.name} အတွက် roles တွေကို update လုပ်နိုင်ပါတယ်။
            </p>
          </div>

          <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
            {roles.map((role) => {
              const roleValue = getRoleApiValue(role);
              const isSelected = selectedRoles.includes(roleValue);

              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleToggleRole(roleValue)}
                  className={`flex w-full items-start justify-between rounded-xl border px-4 py-3 text-left transition ${
                    isSelected
                      ? "border-[#15803d] bg-green-50 dark:bg-green-950/20"
                      : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50"
                  }`}
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{role.name}</p>
                    {role.description ? (
                      <p className="mt-1 text-xs text-gray-500">{role.description}</p>
                    ) : null}
                  </div>
                  <span
                    className={`ml-4 flex h-5 w-5 items-center justify-center rounded border ${
                      isSelected
                        ? "border-[#15803d] bg-[#15803d] text-white"
                        : "border-gray-300"
                    }`}
                  >
                    {isSelected ? <Check size={12} /> : null}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button size="sm" variant="outline" onClick={() => setSelectedAdmin(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleAssignRoles} disabled={isAssigningRoles}>
              {isAssigningRoles ? "Saving..." : "Save Roles"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

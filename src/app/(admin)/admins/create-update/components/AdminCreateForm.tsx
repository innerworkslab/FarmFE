"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  User,
  Shield,
  Sliders,
  CreditCard,
  Eye,
  EyeOff,
  UserPlus,
  LayoutDashboard,
  BookOpen,
  Users,
  Settings,
  ChevronDown,
  Check,
} from "lucide-react";
import { useCreateAdminMutation } from "@/redux/features/admin/AdminApiSlice";
import { useGetRolesQuery } from "@/redux/features/roles/RoleApiSlice";

type PermissionRow = {
  module: string;
  icon: React.ReactNode;
  read: boolean;
  write: boolean;
  delete?: boolean;
};

const getRoleApiValue = (role: { slug?: string; name: string }) => role.slug || role.name;

export default function AdminCreateForm() {
  const router = useRouter();
  const [createAdmin, { isLoading: isCreating }] = useCreateAdminMutation();
  const { data: rolesData } = useGetRolesQuery();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Permission Matrix State
  const [permissions, setPermissions] = useState<PermissionRow[]>([
    { module: "Dashboard", icon: <LayoutDashboard size={18} className="text-gray-500" />, read: true, write: false },
    { module: "Course Management", icon: <BookOpen size={18} className="text-gray-500" />, read: true, write: false, delete: false },
    { module: "Student Management", icon: <Users size={18} className="text-gray-500" />, read: false, write: false, delete: false },
    { module: "Enrollment & Payment", icon: <CreditCard size={18} className="text-gray-500" />, read: false, write: false, delete: false },
    { module: "System Settings", icon: <Settings size={18} className="text-gray-500" />, read: false, write: false },
  ]);

  const roles = rolesData?.data || [];

  const togglePermission = (index: number, field: "read" | "write" | "delete") => {
    setPermissions((prev) =>
      prev.map((item, i) =>
        i === index && field in item
          ? { ...item, [field]: !item[field] }
          : item
      )
    );
  };

  const handleResetPermissions = () => {
    setPermissions([
      { module: "Dashboard", icon: <LayoutDashboard size={18} className="text-gray-500" />, read: true, write: false },
      { module: "Course Management", icon: <BookOpen size={18} className="text-gray-500" />, read: true, write: false, delete: false },
      { module: "Student Management", icon: <Users size={18} className="text-gray-500" />, read: false, write: false, delete: false },
      { module: "Enrollment & Payment", icon: <CreditCard size={18} className="text-gray-500" />, read: false, write: false, delete: false },
      { module: "System Settings", icon: <Settings size={18} className="text-gray-500" />, read: false, write: false },
    ]);
    toast.info("Permissions reset to default.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const generatedUsername = username || email.split("@")[0] || "admin";

    try {
      await createAdmin({
        name,
        username: generatedUsername,
        email,
        password: password || "Password123!",
        roles: selectedRole ? [selectedRole] : [],
      }).unwrap();
      toast.success("Admin account created successfully");
      router.push("/admins");
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to create admin account";
      toast.error(errorMsg);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-12 font-sans">
      {/* Card 1: Personal Credentials */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100 dark:border-gray-800">
          <User size={20} className="text-gray-700 dark:text-gray-300" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Personal Credentials
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jane Doe"
              required
              className="w-full bg-gray-50/60 dark:bg-gray-800/60 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#15803d]/30 focus:border-[#15803d] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane.doe@breakthrough.edu"
              required
              className="w-full bg-gray-50/60 dark:bg-gray-800/60 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#15803d]/30 focus:border-[#15803d] transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. janedoe"
              className="w-full bg-gray-50/60 dark:bg-gray-800/60 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#15803d]/30 focus:border-[#15803d] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Secure Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter temporary password"
                className="w-full bg-gray-50/60 dark:bg-gray-800/60 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 px-3.5 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#15803d]/30 focus:border-[#15803d] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
          Must be at least 12 characters, including numbers and symbols.
        </p>
      </div>

      {/* Card 2: Access Level */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100 dark:border-gray-800">
          <Shield size={20} className="text-gray-700 dark:text-gray-300" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Access Level
          </h2>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Primary Role
          </label>
          <div className="relative w-full max-w-md">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full appearance-none bg-gray-50/60 dark:bg-gray-800/60 text-sm text-gray-900 dark:text-white px-3.5 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#15803d]/30 focus:border-[#15803d] transition-all cursor-pointer"
            >
              <option value="">Select a role...</option>
              {roles.map((r) => {
                const roleValue = getRoleApiValue(r);
                return (
                  <option key={r.id} value={roleValue}>
                    {r.name}
                  </option>
                );
              })}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
            Selecting a role applies a default permission template below.
          </p>
        </div>
      </div>

      {/* Card 3: Permission Matrix */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <Sliders size={20} className="text-gray-700 dark:text-gray-300" />
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Permission Matrix
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetPermissions}
            className="text-xs font-semibold text-[#15803d] dark:text-emerald-400 hover:underline"
          >
            Reset to Default
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
          Granular control over specific module actions.
        </p>

        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 text-[11px] font-bold uppercase text-gray-400 tracking-wider">
                <th className="pb-3 w-1/2">MODULE</th>
                <th className="pb-3 text-center">READ</th>
                <th className="pb-3 text-center">WRITE</th>
                <th className="pb-3 text-center">DELETE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800 text-sm">
              {permissions.map((row, idx) => (
                <tr key={row.module} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                  <td className="py-3.5 flex items-center gap-3 font-semibold text-gray-800 dark:text-gray-200">
                    {row.icon}
                    <span>{row.module}</span>
                  </td>
                  <td className="py-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => togglePermission(idx, "read")}
                      className={`w-5 h-5 rounded flex items-center justify-center border transition-all mx-auto ${
                        row.read
                          ? "bg-[#15803d] border-[#15803d] text-white"
                          : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                      }`}
                    >
                      {row.read && <Check size={14} strokeWidth={3} />}
                    </button>
                  </td>
                  <td className="py-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => togglePermission(idx, "write")}
                      className={`w-5 h-5 rounded flex items-center justify-center border transition-all mx-auto ${
                        row.write
                          ? "bg-[#15803d] border-[#15803d] text-white"
                          : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                      }`}
                    >
                      {row.write && <Check size={14} strokeWidth={3} />}
                    </button>
                  </td>
                  <td className="py-3.5 text-center">
                    {row.delete !== undefined ? (
                      <button
                        type="button"
                        onClick={() => togglePermission(idx, "delete")}
                        className={`w-5 h-5 rounded flex items-center justify-center border transition-all mx-auto ${
                          row.delete
                            ? "bg-[#15803d] border-[#15803d] text-white"
                            : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                        }`}
                      >
                        {row.delete && <Check size={14} strokeWidth={3} />}
                      </button>
                    ) : (
                      <span className="text-gray-400 font-bold">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Card 4: Account Status */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CreditCard size={20} className="text-gray-700 dark:text-gray-300" />
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Account Status
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Determine if this administrator can log in immediately.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out flex items-center ${
              isActive ? "bg-[#15803d] justify-end" : "bg-gray-300 dark:bg-gray-700 justify-start"
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white shadow-sm flex items-center justify-center text-[10px] text-[#15803d] font-bold">
              {isActive && <Check size={10} strokeWidth={3} />}
            </span>
          </button>
          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
            {isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-4 pt-2">
        <button
          type="button"
          onClick={() => router.push("/admins")}
          className="text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2.5 rounded-lg transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isCreating}
          className="inline-flex items-center gap-2 bg-[#15803d] hover:bg-[#14532d] text-white font-medium text-xs px-5 py-2.5 rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
        >
          <UserPlus size={16} />
          {isCreating ? "Creating Account..." : "Create Admin Account"}
        </button>
      </div>
    </form>
  );
}

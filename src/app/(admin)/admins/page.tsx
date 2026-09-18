import React from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import AdminTable from "./components/adminTable";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Access & Roles | Farm",
  description: "Manage administrative team access and permissions.",
};

export default function AdminPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header matching exact user mockup */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1E293B] dark:text-white tracking-tight">
            Admin Access & Roles
          </h1>
          <p className="text-sm text-[#64748B] dark:text-gray-400 mt-1">
            Manage administrative team access and permissions.
          </p>
        </div>

        <Link
          href="/admins/create-update"
          className="inline-flex items-center gap-2 bg-[#15803d] hover:bg-[#14532d] text-white font-medium text-sm px-4 py-2.5 rounded-lg shadow-sm transition-all"
        >
          <UserPlus size={18} />
          Add New Admin
        </Link>
      </div>

      {/* Admin Table */}
      <AdminTable />
    </div>
  );
}

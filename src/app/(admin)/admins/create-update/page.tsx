import { Metadata } from "next";
import React from "react";
import AdminCreateForm from "./components/AdminCreateForm";

export const metadata: Metadata = {
  title: "Add New Admin | Farm",
  description: "Configure credentials, role, and precise module access levels for the new administrative user.",
};

export default function AdminCreatePage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header matching exact screenshot */}
      <div>
        <h1 className="text-3xl font-extrabold text-[#1E293B] dark:text-white tracking-tight">
          Add New Admin
        </h1>
        <p className="text-sm text-[#64748B] dark:text-gray-400 mt-1">
          Configure credentials, role, and precise module access levels for the new administrative user.
        </p>
      </div>

      <AdminCreateForm />
    </div>
  );
}

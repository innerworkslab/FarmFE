import type { Metadata } from "next";
import React from "react";
import LmsDashboard from "@/components/dashboard/LmsDashboard";

export const metadata: Metadata = {
  title: "Farm - Admin Dashboard",
  description: "Farm Admin Panel",
};

export default function AdminDashboardPage() {
  return <LmsDashboard />;
}


"use client";

import React from "react";
import { useGetBranchesQuery } from "@/redux/features/setup/BranchApiSlice";
import { useGetAnimalsQuery } from "@/redux/features/setup/AnimalApiSlice";
import { useGetFoodsQuery } from "@/redux/features/setup/FoodApiSlice";
import { useGetMedicinesQuery } from "@/redux/features/setup/MedicineApiSlice";
import { useGetCustomersQuery } from "@/redux/features/setup/CustomerApiSlice";
import { useGetSuppliersQuery } from "@/redux/features/setup/SupplierApiSlice";
import { useGetInventoriesQuery } from "@/redux/features/setup/InventoryApiSlice";
import { useGetActivityLogsQuery } from "@/redux/features/setup/ActivityLogApiSlice";
import {
  PawPrint,
  Wheat,
  Pill,
  Warehouse,
  GitBranch,
  Users,
  Truck,
  Plus,
  History,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

export default function LmsDashboard() {
  const { data: branchesData } = useGetBranchesQuery();
  const { data: animalsData } = useGetAnimalsQuery();
  const { data: foodsData } = useGetFoodsQuery();
  const { data: medicinesData } = useGetMedicinesQuery();
  const { data: customersData } = useGetCustomersQuery();
  const { data: suppliersData } = useGetSuppliersQuery();
  const { data: inventoriesData } = useGetInventoriesQuery();
  const { data: logsData } = useGetActivityLogsQuery();

  // REAL API METRICS
  const totalBranches = branchesData?.data?.length ?? 0;
  const totalAnimals = animalsData?.data?.length ?? 0;
  const totalFoods = foodsData?.data?.length ?? 0;
  const totalMedicines = medicinesData?.data?.length ?? 0;
  const totalCustomers = customersData?.data?.length ?? 0;
  const totalSuppliers = suppliersData?.data?.length ?? 0;
  const totalInventories = inventoriesData?.data?.length ?? 0;

  const recentLogs = logsData?.data?.slice(0, 5) || [];
  const recentAnimals = animalsData?.data?.slice(0, 5) || [];
  const recentFoods = foodsData?.data?.slice(0, 5) || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 font-sans animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-2">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Farm Operations Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 flex items-center gap-2 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Livestock ERP • Real-time operational overview
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/setup/animals"
            className="inline-flex items-center gap-2 bg-[#15803d] hover:bg-[#166534] text-white font-semibold text-sm px-4.5 py-2.5 rounded-xl shadow-md shadow-[#15803d]/15 hover:shadow-[#15803d]/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            <Plus size={16} />
            Add Livestock
          </Link>
          <Link
            href="/setup/foods"
            className="inline-flex items-center gap-2 border border-green-200 dark:border-green-900/60 bg-green-50/70 dark:bg-green-950/20 text-green-800 dark:text-green-300 hover:bg-green-100 hover:dark:bg-green-950/40 hover:scale-[1.02] active:scale-[0.98] font-semibold text-sm px-4.5 py-2.5 rounded-xl transition-all duration-200"
          >
            <Wheat size={16} />
            Manage Feed
          </Link>
          <Link
            href="/setup/branches"
            className="inline-flex items-center gap-2 border border-gray-200/80 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 hover:dark:bg-gray-800/80 hover:scale-[1.02] active:scale-[0.98] font-semibold text-sm px-4.5 py-2.5 rounded-xl transition-all duration-200"
          >
            <GitBranch size={16} />
            Branches
          </Link>
        </div>
      </div>

      {/* Top 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: TOTAL LIVESTOCK */}
        <div className="group bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200/50 dark:border-white/5 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-[#15803d]/30 transition-all duration-300 flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-[#15803d]/10 dark:bg-[#15803d]/20 flex items-center justify-center text-[#15803d] dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300">
              <PawPrint size={24} />
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-100/50">
              Livestock
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[11px] leading-[16px] tracking-[1px] uppercase text-gray-400 dark:text-gray-500 font-bold">
              ANIMAL HEADCOUNT / BATCHES
            </p>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1.5 tracking-tight">
              {totalAnimals}
            </p>
          </div>
        </div>

        {/* Card 2: FEED & FOODS */}
        <div className="group bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200/50 dark:border-white/5 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-emerald-500/30 transition-all duration-300 flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-700 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300">
              <Wheat size={24} />
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-100/50">
              Nutrition
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[11px] leading-[16px] tracking-[1px] uppercase text-gray-400 dark:text-gray-500 font-bold">
              FEEDS & SUPPLEMENTS
            </p>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1.5 tracking-tight">
              {totalFoods}
            </p>
          </div>
        </div>

        {/* Card 3: MEDICINES & VACCINES */}
        <div className="group bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200/50 dark:border-white/5 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-teal-500/30 transition-all duration-300 flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center text-teal-700 dark:text-teal-400 group-hover:scale-110 transition-transform duration-300">
              <Pill size={24} />
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-100/50">
              Health
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[11px] leading-[16px] tracking-[1px] uppercase text-gray-400 dark:text-gray-500 font-bold">
              MEDICINES & VACCINES
            </p>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1.5 tracking-tight">
              {totalMedicines}
            </p>
          </div>
        </div>

        {/* Card 4: WAREHOUSES & LOCATIONS */}
        <div className="group bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200/50 dark:border-white/5 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-cyan-500/30 transition-all duration-300 flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 flex items-center justify-center text-cyan-700 dark:text-cyan-400 group-hover:scale-110 transition-transform duration-300">
              <Warehouse size={24} />
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400 border border-cyan-100/50">
              Storage
            </span>
          </div>
          <div className="mt-4">
            <p className="text-[11px] leading-[16px] tracking-[1px] uppercase text-gray-400 dark:text-gray-500 font-bold">
              ACTIVE WAREHOUSES
            </p>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1.5 tracking-tight">
              {totalInventories}
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Metric Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/setup/branches"
          className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800 hover:border-green-500 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 rounded-lg">
              <GitBranch size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Farm Branches</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{totalBranches}</p>
            </div>
          </div>
          <ArrowUpRight size={18} className="text-gray-400" />
        </Link>

        <Link
          href="/setup/customers"
          className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800 hover:border-green-500 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-lg">
              <Users size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Customer Accounts</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{totalCustomers}</p>
            </div>
          </div>
          <ArrowUpRight size={18} className="text-gray-400" />
        </Link>

        <Link
          href="/setup/suppliers"
          className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800 hover:border-green-500 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 rounded-lg">
              <Truck size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Registered Suppliers</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{totalSuppliers}</p>
            </div>
          </div>
          <ArrowUpRight size={18} className="text-gray-400" />
        </Link>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Live Livestock & Feed Tables */}
        <div className="lg:col-span-8 space-y-8">
          {/* Livestock Table */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/50 dark:border-white/5 shadow-sm p-6 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                <div className="w-1.5 h-6 bg-[#15803d] rounded-full"></div>
                Livestock Master Records
              </h2>
              <Link
                href="/setup/animals"
                className="text-xs font-bold text-[#15803d] dark:text-emerald-400 hover:text-[#166534] hover:underline flex items-center gap-1"
              >
                View All Livestock &rarr;
              </Link>
            </div>

            {recentAnimals.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-400">
                No livestock records found. Click &quot;Add Livestock&quot; to register animals.
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800/80 text-[11px] font-bold uppercase text-gray-400 dark:text-gray-500 tracking-wider">
                      <th className="pb-3.5">CODE</th>
                      <th className="pb-3.5">ANIMAL NAME</th>
                      <th className="pb-3.5">TYPE</th>
                      <th className="pb-3.5">BREED</th>
                      <th className="pb-3.5 text-right">TRACKING</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800/40 text-sm">
                    {recentAnimals.map((a) => (
                      <tr key={a.id} className="group/row hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                        <td className="py-3.5 font-mono font-bold text-gray-900 dark:text-white">
                          {a.code}
                        </td>
                        <td className="py-3.5 font-medium text-gray-800 dark:text-gray-200">
                          {a.name}
                        </td>
                        <td className="py-3.5 text-gray-500 capitalize">
                          {a.type}
                        </td>
                        <td className="py-3.5 text-gray-500">
                          {a.breed}
                        </td>
                        <td className="py-3.5 text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400 capitalize border border-green-100">
                            {a.tracking_type}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Feed & Supplements Table */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/50 dark:border-white/5 shadow-sm p-6 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                <div className="w-1.5 h-6 bg-emerald-600 rounded-full"></div>
                Feed & Nutrition Inventory
              </h2>
              <Link
                href="/setup/foods"
                className="text-xs font-bold text-[#15803d] dark:text-emerald-400 hover:text-[#166534] hover:underline flex items-center gap-1"
              >
                Manage Foods &rarr;
              </Link>
            </div>

            {recentFoods.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-400">
                No food or feed records found.
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800/80 text-[11px] font-bold uppercase text-gray-400 dark:text-gray-500 tracking-wider">
                      <th className="pb-3.5">CODE</th>
                      <th className="pb-3.5">FEED NAME</th>
                      <th className="pb-3.5">CATEGORY</th>
                      <th className="pb-3.5">TARGET</th>
                      <th className="pb-3.5 text-right">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800/40 text-sm">
                    {recentFoods.map((f) => (
                      <tr key={f.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                        <td className="py-3.5 font-mono font-bold text-gray-900 dark:text-white">
                          {f.code}
                        </td>
                        <td className="py-3.5 font-medium text-gray-800 dark:text-gray-200">
                          {f.name}
                        </td>
                        <td className="py-3.5 text-gray-500 capitalize">
                          {f.category}
                        </td>
                        <td className="py-3.5 text-gray-500 capitalize">
                          {f.target_animal_type || "All"}
                        </td>
                        <td className="py-3.5 text-right">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                              f.status === "active"
                                ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400 border-green-200"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200"
                            }`}
                          >
                            {f.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Audit Logs Feed & Quick Setup Navigator */}
        <div className="lg:col-span-4 space-y-8">
          {/* Real Activity Logs Feed */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/50 dark:border-white/5 shadow-sm p-6 hover:shadow-md transition-shadow duration-300 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800/80 pb-3.5">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                <History size={18} className="text-[#15803d]" />
                Recent Activity Trail
              </h3>
              <Link href="/setup/activity-logs" className="text-xs text-[#15803d] hover:text-[#166534] hover:underline font-bold">
                View All
              </Link>
            </div>

            {recentLogs.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-400">
                No activity records logged.
              </div>
            ) : (
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-gray-800/30 text-xs space-y-1 border border-gray-100 dark:border-gray-800"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-800 dark:text-gray-200 capitalize">
                        {log.event} • {log.log_name}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 truncate">
                      {log.subject_type?.split("\\").pop()} #{log.subject_id}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Farm Setup Navigation Links */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-850 rounded-2xl border border-green-200/60 dark:border-green-900/40 p-6 space-y-4">
            <div className="flex items-center gap-2 text-green-900 dark:text-green-300 font-bold text-base">
              <Activity size={18} className="text-[#15803d]" />
              <span>Quick Master Setup</span>
            </div>
            <p className="text-xs text-green-800/80 dark:text-gray-400 leading-relaxed">
              Configure your farm infrastructure, animal types, UOMs, and supply lines:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <Link href="/setup/uoms" className="p-2.5 bg-white dark:bg-gray-800 rounded-lg shadow-xs hover:text-green-700 transition">
                📏 Units of Measure
              </Link>
              <Link href="/setup/farm-information" className="p-2.5 bg-white dark:bg-gray-800 rounded-lg shadow-xs hover:text-green-700 transition">
                🏠 Barns & Pens
              </Link>
              <Link href="/setup/equipment" className="p-2.5 bg-white dark:bg-gray-800 rounded-lg shadow-xs hover:text-green-700 transition">
                🔧 Equipment
              </Link>
              <Link href="/setup/inventories" className="p-2.5 bg-white dark:bg-gray-800 rounded-lg shadow-xs hover:text-green-700 transition">
                📦 Warehouses
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

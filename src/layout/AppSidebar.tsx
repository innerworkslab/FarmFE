"use client";

import React, { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import {
  LayoutDashboard,
  UserCheck,
  ShieldCheck,
  History,
  Settings,
  ChevronDown,
  ChevronRight,
  GitBranch,
  Package,
  Pill,
  PawPrint,
  Wrench,
  Home,
  Warehouse,
  ShoppingCart,
  Truck,
  Ruler,
  Wheat,
  ScrollText,
  ClipboardCheck,
  ReceiptText,
} from "lucide-react";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
};

type SetupChild = {
  name: string;
  path: string;
  icon: React.ReactNode;
};

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const [setupOpen, setSetupOpen] = useState(pathname.startsWith("/setup"));

  const mainNavItems: NavItem[] = useMemo(() => [
    { icon: <LayoutDashboard size={20} />, name: "Dashboard", path: "/" },
    { icon: <ClipboardCheck size={20} />, name: "Inventory", path: "/inventory" },
    { icon: <ReceiptText size={20} />, name: "Purchasing", path: "/purchasing" },
  ], []);

  const setupChildren: SetupChild[] = useMemo(() => [
    { name: "Branches",         path: "/setup/branches",         icon: <GitBranch size={14} /> },
    { name: "Roles",            path: "/setup/roles",            icon: <ShieldCheck size={14} /> },
    { name: "Admins",           path: "/setup/admins",           icon: <UserCheck size={14} /> },
    { name: "Customers",        path: "/setup/customers",        icon: <ShoppingCart size={14} /> },
    { name: "Suppliers",        path: "/setup/suppliers",        icon: <Truck size={14} /> },
    { name: "UOMs",             path: "/setup/uoms",             icon: <Ruler size={14} /> },
    { name: "Foods & Feed",     path: "/setup/foods",            icon: <Wheat size={14} /> },
    { name: "Medicines",        path: "/setup/medicines",        icon: <Pill size={14} /> },
    { name: "Animals",          path: "/setup/animals",          icon: <PawPrint size={14} /> },
    { name: "Equipment",        path: "/setup/equipment",        icon: <Wrench size={14} /> },
    { name: "Farm Information", path: "/setup/farm-information", icon: <Home size={14} /> },
    { name: "Inventories",      path: "/setup/inventories",      icon: <Warehouse size={14} /> },
    { name: "Activity Logs",    path: "/setup/activity-logs",    icon: <ScrollText size={14} /> },
  ], []);

  const bottomNavItems: NavItem[] = useMemo(() => [
    { icon: <Settings size={20} />, name: "Profile Settings", path: "/profile" },
  ], []);

  const isActive = useCallback((path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  }, [pathname]);

  const showLabels = isExpanded || isHovered || isMobileOpen;

  const linkClass = (active: boolean) =>
    `flex items-center gap-3 px-3.5 py-3 rounded-sm transition-all duration-300 ease-in-out border-r-2 text-sm font-semibold ${
      active
        ? "bg-[#15803d]/10 dark:bg-[#15803d]/20 text-[#15803d] dark:text-emerald-400 border-[#15803d] shadow-xs"
        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/40 hover:text-gray-900 dark:hover:text-gray-200 border-transparent"
    } ${!isExpanded && !isHovered ? "lg:justify-center lg:px-2" : "justify-start"}`;

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-4 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen ? "w-[240px]" : isHovered ? "w-[240px]" : "w-[75px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Brand */}
      <div className={`py-6 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start px-2"}`}>
        <Link href="/" className="flex flex-col">
          {showLabels ? (
            <div>
              <h1 className="text-xl font-extrabold text-[#15803d] dark:text-emerald-400 tracking-tight leading-none">Farm</h1>
              <p className="text-xs text-gray-400 font-normal mt-1 tracking-wide">Executive Panel</p>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-[#15803d] flex items-center justify-center text-white font-black text-lg">F</div>
          )}
        </Link>
      </div>

      <div className="flex flex-col justify-between flex-1 overflow-y-auto duration-300 ease-linear no-scrollbar pb-6">
        <nav className="space-y-1.5">

          {/* Main nav */}
          {mainNavItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link key={item.name} href={item.path} className={linkClass(active)}>
                <span className={active ? "text-[#15803d] dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"}>{item.icon}</span>
                {showLabels && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}

          {/* Setup collapsible */}
          <div>
            <button
              type="button"
              onClick={() => setSetupOpen((o) => !o)}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-sm transition-all duration-300 border-r-2 border-transparent text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/40 hover:text-gray-900 dark:hover:text-gray-200 ${!isExpanded && !isHovered ? "lg:justify-center lg:px-2" : "justify-between"}`}
            >
              <span className="flex items-center gap-3">
                <Package size={20} className="text-gray-500 dark:text-gray-400 shrink-0" />
                {showLabels && <span className="truncate">Setup</span>}
              </span>
              {showLabels && (setupOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
            </button>

            {/* Expanded: labeled children */}
            {setupOpen && showLabels && (
              <div className="ml-9 mt-1 flex flex-col gap-0.5 border-l border-gray-200 pl-3 dark:border-gray-700">
                {setupChildren.map((child) => {
                  const childActive = pathname.startsWith(child.path);
                  return (
                    <Link
                      key={child.name}
                      href={child.path}
                      className={`flex items-center gap-2 rounded-md px-2.5 py-2 text-xs font-semibold transition-colors ${
                        childActive ? "text-[#15803d] dark:text-emerald-400" : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                      }`}
                    >
                      <span className="shrink-0">{child.icon}</span>
                      {child.name}
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Collapsed: icon-only children */}
            {setupOpen && !showLabels && (
              <div className="flex flex-col gap-0.5 mt-1">
                {setupChildren.map((child) => {
                  const childActive = pathname.startsWith(child.path);
                  return (
                    <Link
                      key={child.name}
                      href={child.path}
                      title={child.name}
                      className={`flex justify-center rounded-md px-2 py-2 text-xs transition-colors ${
                        childActive ? "text-[#15803d] dark:text-emerald-400" : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
                      }`}
                    >
                      {child.icon}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Admin Users quick link */}
          <Link href="/admins" className={linkClass(isActive("/admins"))}>
            <UserCheck size={20} className={isActive("/admins") ? "text-[#15803d] dark:text-emerald-400" : "text-gray-500"} />
            {showLabels && <span className="truncate">Admin Users</span>}
          </Link>

          {/* Audit Trail quick link */}
          <Link href="/audit-trail" className={linkClass(isActive("/audit-trail"))}>
            <History size={20} className={isActive("/audit-trail") ? "text-[#15803d] dark:text-emerald-400" : "text-gray-500"} />
            {showLabels && <span className="truncate">Audit Trail</span>}
          </Link>

        </nav>

        <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
          {bottomNavItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link key={item.name} href={item.path} className={linkClass(active)}>
                <span className={active ? "text-[#15803d] dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"}>{item.icon}</span>
                {showLabels && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;

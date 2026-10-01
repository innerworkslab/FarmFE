"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import {
  LayoutDashboard,
  UserCheck,
  ShieldCheck,
  Settings,
  ChevronDown,
  GitBranch,
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
  Database,
  MapPin,
  Wallet,
  Tags,
  Users,
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

type NavGroup = {
  name: string;
  icon: React.ReactNode;
  children: SetupChild[];
};

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");
  const [inventoryOpen, setInventoryOpen] = useState(pathname.startsWith("/inventory"));
  const [purchasingOpen, setPurchasingOpen] = useState(pathname.startsWith("/purchasing"));
  const [farmAnimalViewOpen, setFarmAnimalViewOpen] = useState(
    pathname.startsWith("/farms/animal-view")
  );
  const [farmFeedingOpen, setFarmFeedingOpen] = useState(pathname.startsWith("/farms/feedings"));
  const [farmNavigationOpen, setFarmNavigationOpen] = useState(pathname === "/farms");
  const [financialOpen, setFinancialOpen] = useState(pathname.startsWith("/financial"));
  const [coreSetupOpen, setCoreSetupOpen] = useState(
    pathname.startsWith("/setup/branches") ||
      pathname.startsWith("/setup/roles") ||
      pathname.startsWith("/setup/admins") ||
      pathname.startsWith("/setup/activity-logs")
  );
  const [businessMastersOpen, setBusinessMastersOpen] = useState(
    pathname.startsWith("/setup/") &&
      !pathname.startsWith("/setup/branches") &&
      !pathname.startsWith("/setup/roles") &&
      !pathname.startsWith("/setup/admins") &&
      !pathname.startsWith("/setup/activity-logs")
  );

  useEffect(() => {
    if (pathname.startsWith("/inventory")) setInventoryOpen(true);
    if (pathname.startsWith("/purchasing")) setPurchasingOpen(true);
    if (pathname.startsWith("/farms/animal-view")) setFarmAnimalViewOpen(true);
    if (pathname.startsWith("/farms/feedings")) setFarmFeedingOpen(true);
    if (pathname === "/farms") setFarmNavigationOpen(true);
    if (pathname.startsWith("/financial")) setFinancialOpen(true);

    if (
      pathname.startsWith("/setup/branches") ||
      pathname.startsWith("/setup/roles") ||
      pathname.startsWith("/setup/admins") ||
      pathname.startsWith("/setup/activity-logs")
    ) {
      setCoreSetupOpen(true);
    }

    if (
      pathname.startsWith("/setup/") &&
      !pathname.startsWith("/setup/branches") &&
      !pathname.startsWith("/setup/roles") &&
      !pathname.startsWith("/setup/admins") &&
      !pathname.startsWith("/setup/activity-logs")
    ) {
      setBusinessMastersOpen(true);
    }
  }, [pathname]);

  const mainNavItems: NavItem[] = useMemo(
    () => [{ icon: <LayoutDashboard size={20} />, name: "Dashboard", path: "/" }],
    []
  );

  const foundationGroups: NavGroup[] = useMemo(
    () => [
      {
        name: "Inventory Foundation API",
        icon: <ClipboardCheck size={20} />,
        children: [
          {
            name: "Adjustments",
            path: "/inventory?tab=adjustments",
            icon: <ClipboardCheck size={14} />,
          },
          { name: "Balances", path: "/inventory?tab=balances", icon: <Database size={14} /> },
          { name: "Ledger", path: "/inventory?tab=ledger", icon: <ScrollText size={14} /> },
          {
            name: "Confirmations",
            path: "/inventory?tab=confirmations",
            icon: <ShieldCheck size={14} />,
          },
        ],
      },
      {
        name: "Purchasing Foundation API",
        icon: <ReceiptText size={20} />,
        children: [
          {
            name: "Purchase Invoices",
            path: "/purchasing?tab=invoices",
            icon: <ReceiptText size={14} />,
          },
          {
            name: "Receipts",
            path: "/purchasing?tab=receipts",
            icon: <ClipboardCheck size={14} />,
          },
          {
            name: "Inventory Checks",
            path: "/purchasing?tab=balances",
            icon: <Database size={14} />,
          },
          {
            name: "Purchase Ledger",
            path: "/purchasing?tab=ledger",
            icon: <ScrollText size={14} />,
          },
        ],
      },
      {
        name: "Farm Navigation API",
        icon: <MapPin size={20} />,
        children: [{ name: "Farms", path: "/farms", icon: <Home size={14} /> }],
      },
      {
        name: "Farm Animal View API",
        icon: <PawPrint size={20} />,
        children: [
          {
            name: "All Animals",
            path: "/farms/animal-view?view=all",
            icon: <PawPrint size={14} />,
          },
          {
            name: "Batch Animals",
            path: "/farms/animal-view?view=batch",
            icon: <Warehouse size={14} />,
          },
          {
            name: "Individual Animals",
            path: "/farms/animal-view?view=individual",
            icon: <UserCheck size={14} />,
          },
        ],
      },
      {
        name: "Farm Feeding API",
        icon: <Wheat size={20} />,
        children: [{ name: "Farm Feedings", path: "/farms/feedings", icon: <Wheat size={14} /> }],
      },
      {
        name: "Financial Cashbook API",
        icon: <Wallet size={20} />,
        children: [
          { name: "Cashbooks", path: "/financial/cashbooks", icon: <Wallet size={14} /> },
          { name: "Categories", path: "/financial/categories", icon: <Tags size={14} /> },
          {
            name: "Transactions",
            path: "/financial/transactions",
            icon: <ReceiptText size={14} />,
          },
          { name: "Ledger", path: "/financial/ledger", icon: <ScrollText size={14} /> },
          {
            name: "Consolidated Balances",
            path: "/financial/consolidated",
            icon: <ReceiptText size={14} />,
          },
          { name: "Daily Summary", path: "/financial/daily-summary", icon: <Database size={14} /> },
          { name: "Staff", path: "/setup/staff", icon: <Users size={14} /> },
          {
            name: "Advance Balances",
            path: "/financial/staff-advance-balances",
            icon: <Database size={14} />,
          },
          {
            name: "Loans & Repayments",
            path: "/financial/staff-advances",
            icon: <Wallet size={14} />,
          },
          {
            name: "Category Summary",
            path: "/financial/category-summary",
            icon: <Tags size={14} />,
          },
        ],
      },
    ],
    []
  );

  const navigationGroups: NavGroup[] = useMemo(
    () => [
      {
        name: "Setup Core Foundation API",
        icon: <Settings size={20} />,
        children: [
          { name: "Branches", path: "/setup/branches", icon: <GitBranch size={14} /> },
          { name: "Roles", path: "/setup/roles", icon: <ShieldCheck size={14} /> },
          { name: "Admins", path: "/setup/admins", icon: <UserCheck size={14} /> },
          { name: "Audit Logs", path: "/setup/activity-logs", icon: <ScrollText size={14} /> },
        ],
      },
      {
        name: "Setup Business Masters API",
        icon: <Database size={20} />,
        children: [
          { name: "Customers", path: "/setup/customers", icon: <ShoppingCart size={14} /> },
          { name: "Staff", path: "/setup/staff", icon: <Users size={14} /> },
          { name: "Suppliers", path: "/setup/suppliers", icon: <Truck size={14} /> },
          { name: "UOMs", path: "/setup/uoms", icon: <Ruler size={14} /> },
          { name: "Foods", path: "/setup/foods", icon: <Wheat size={14} /> },
          { name: "Medicines", path: "/setup/medicines", icon: <Pill size={14} /> },
          { name: "Animals", path: "/setup/animals", icon: <PawPrint size={14} /> },
          { name: "Equipment", path: "/setup/equipment", icon: <Wrench size={14} /> },
          { name: "Farm Information", path: "/setup/farm-information", icon: <Home size={14} /> },
          { name: "Inventories", path: "/setup/inventories", icon: <Warehouse size={14} /> },
        ],
      },
    ],
    []
  );

  const bottomNavItems: NavItem[] = useMemo(
    () => [{ icon: <Settings size={20} />, name: "Profile Settings", path: "/profile" }],
    []
  );

  const isActive = useCallback(
    (path: string) => {
      if (path === "/") return pathname === "/";
      return pathname.startsWith(path);
    },
    [pathname]
  );

  const isChildActive = useCallback(
    (path: string) => {
      const [childPath, query] = path.split("?");
      if (pathname !== childPath) return false;
      if (!query) return true;
      const params = new URLSearchParams(query);
      const tab = params.get("tab");
      if (
        !currentTab &&
        ((childPath === "/inventory" && tab === "adjustments") ||
          (childPath === "/purchasing" && tab === "invoices"))
      ) {
        return true;
      }
      return Array.from(params.entries()).every(
        ([key, itemValue]) =>
          searchParams.get(key) === itemValue ||
          (!searchParams.get(key) &&
            childPath === "/farms/animal-view" &&
            key === "view" &&
            itemValue === "all")
      );
    },
    [currentTab, pathname, searchParams]
  );

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
      <div
        className={`py-6 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start px-2"}`}
      >
        <Link href="/" className="flex flex-col">
          {showLabels ? (
            <div>
              <h1 className="text-xl font-extrabold text-[#15803d] dark:text-emerald-400 tracking-tight leading-none">
                Farm
              </h1>
              <p className="text-xs text-gray-400 font-normal mt-1 tracking-wide">
                Executive Panel
              </p>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-[#15803d] flex items-center justify-center text-white font-black text-lg">
              F
            </div>
          )}
        </Link>
      </div>

      <div className="flex flex-col justify-between flex-1 overflow-y-auto duration-300 ease-linear no-scrollbar pb-6">
        <nav className="space-y-1.5">
          {showLabels && (
            <p className="px-3.5 pb-1 pt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
              Workspace
            </p>
          )}
          {mainNavItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link key={item.name} href={item.path} className={linkClass(active)}>
                <span
                  className={
                    active
                      ? "text-[#15803d] dark:text-emerald-400"
                      : "text-gray-500 dark:text-gray-400"
                  }
                >
                  {item.icon}
                </span>
                {showLabels && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}

          {foundationGroups.map((group) => {
            const groupBasePath = group.children[0].path.split("?")[0];
            const groupActive =
              group.children.some((child) => isChildActive(child.path)) ||
              (groupBasePath === "/farms"
                ? pathname === "/farms"
                : pathname.startsWith(groupBasePath));
            const isOpen =
              group.name === "Inventory Foundation API"
                ? inventoryOpen
                : group.name === "Purchasing Foundation API"
                  ? purchasingOpen
                  : group.name === "Farm Navigation API"
                    ? farmNavigationOpen
                    : group.name === "Farm Animal View API"
                      ? farmAnimalViewOpen
                      : group.name === "Financial Cashbook API"
                        ? financialOpen
                        : farmFeedingOpen;
            const setOpen =
              group.name === "Inventory Foundation API"
                ? setInventoryOpen
                : group.name === "Purchasing Foundation API"
                  ? setPurchasingOpen
                  : group.name === "Farm Navigation API"
                    ? setFarmNavigationOpen
                    : group.name === "Farm Animal View API"
                      ? setFarmAnimalViewOpen
                      : group.name === "Financial Cashbook API"
                        ? setFinancialOpen
                        : setFarmFeedingOpen;

            return (
              <div key={group.name}>
                <button
                  type="button"
                  onClick={() => setOpen((open) => !open)}
                  title={!showLabels ? group.name : undefined}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-sm transition-all duration-300 border-r-2 text-sm font-semibold ${
                    groupActive
                      ? "bg-[#15803d]/10 dark:bg-[#15803d]/20 text-[#15803d] dark:text-emerald-400 border-[#15803d]"
                      : "border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/40 hover:text-gray-900 dark:hover:text-gray-200"
                  } ${!isExpanded && !isHovered ? "lg:justify-center lg:px-2" : "justify-between"}`}
                >
                  <span className="flex min-w-0 flex-1 items-center gap-3">
                    <span
                      className={`shrink-0 ${groupActive ? "text-[#15803d] dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"}`}
                    >
                      {group.icon}
                    </span>
                    {showLabels && <span className="min-w-0 truncate">{group.name}</span>}
                  </span>
                  {showLabels && (
                    <ChevronDown
                      size={16}
                      className={`ml-2 shrink-0 text-gray-400 transition-transform duration-300 ease-in-out dark:text-gray-500 ${isOpen ? "rotate-180" : "rotate-0"}`}
                    />
                  )}
                </button>

                {showLabels && (
                  <div
                    className={`ml-9 grid overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="min-h-0">
                      <div className="mt-1 flex flex-col gap-0.5 border-l border-gray-200 pl-3 dark:border-gray-700">
                        {group.children.map((child) => {
                          const childActive = isChildActive(child.path);
                          return (
                            <Link
                              key={child.name}
                              href={child.path}
                              className={`flex items-center gap-2 rounded-md px-2.5 py-2 text-xs font-semibold transition-colors ${childActive ? "bg-[#15803d]/10 text-[#15803d] dark:bg-[#15803d]/20 dark:text-emerald-400" : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"}`}
                            >
                              <span className="shrink-0">{child.icon}</span>
                              {child.name}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {isOpen && !showLabels && (
                  <div className="mt-1 flex flex-col gap-0.5">
                    {group.children.map((child) => {
                      const childActive = isChildActive(child.path);
                      return (
                        <Link
                          key={child.name}
                          href={child.path}
                          title={child.name}
                          className={`flex justify-center rounded-md px-2 py-2 text-xs transition-colors ${childActive ? "text-[#15803d] dark:text-emerald-400" : "text-gray-500 hover:text-gray-900 dark:text-gray-400"}`}
                        >
                          {child.icon}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {showLabels && (
            <p className="px-3.5 pb-1 pt-5 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
              Set up
            </p>
          )}
          {navigationGroups.map((group) => {
            const groupActive = group.children.some((child) => pathname.startsWith(child.path));
            const isOpen =
              group.name === "Setup Core Foundation API" ? coreSetupOpen : businessMastersOpen;
            const setOpen =
              group.name === "Setup Core Foundation API"
                ? setCoreSetupOpen
                : setBusinessMastersOpen;

            return (
              <div key={group.name}>
                <button
                  type="button"
                  onClick={() => setOpen((open) => !open)}
                  title={!showLabels ? group.name : undefined}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-sm transition-all duration-300 border-r-2 text-sm font-semibold ${
                    groupActive
                      ? "bg-[#15803d]/10 dark:bg-[#15803d]/20 text-[#15803d] dark:text-emerald-400 border-[#15803d]"
                      : "border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/40 hover:text-gray-900 dark:hover:text-gray-200"
                  } ${!isExpanded && !isHovered ? "lg:justify-center lg:px-2" : "justify-between"}`}
                >
                  <span className="flex min-w-0 flex-1 items-center gap-3">
                    <span
                      className={`shrink-0 ${groupActive ? "text-[#15803d] dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"}`}
                    >
                      {group.icon}
                    </span>
                    {showLabels && <span className="min-w-0 truncate">{group.name}</span>}
                  </span>
                  {showLabels && (
                    <ChevronDown
                      size={16}
                      className={`ml-2 shrink-0 text-gray-400 transition-transform duration-300 ease-in-out dark:text-gray-500 ${isOpen ? "rotate-180" : "rotate-0"}`}
                    />
                  )}
                </button>

                {showLabels && (
                  <div
                    className={`ml-9 grid overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="min-h-0">
                      <div className="mt-1 flex flex-col gap-0.5 border-l border-gray-200 pl-3 dark:border-gray-700">
                        {group.children.map((child) => {
                          const childActive = pathname.startsWith(child.path);
                          return (
                            <Link
                              key={child.name}
                              href={child.path}
                              className={`flex items-center gap-2 rounded-md px-2.5 py-2 text-xs font-semibold transition-colors ${childActive ? "bg-[#15803d]/10 text-[#15803d] dark:bg-[#15803d]/20 dark:text-emerald-400" : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"}`}
                            >
                              <span className="shrink-0">{child.icon}</span>
                              {child.name}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {isOpen && !showLabels && (
                  <div className="mt-1 flex flex-col gap-0.5">
                    {group.children.map((child) => {
                      const childActive = pathname.startsWith(child.path);
                      return (
                        <Link
                          key={child.name}
                          href={child.path}
                          title={child.name}
                          className={`flex justify-center rounded-md px-2 py-2 text-xs transition-colors ${childActive ? "text-[#15803d] dark:text-emerald-400" : "text-gray-500 hover:text-gray-900 dark:text-gray-400"}`}
                        >
                          {child.icon}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
          {bottomNavItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link key={item.name} href={item.path} className={linkClass(active)}>
                <span
                  className={
                    active
                      ? "text-[#15803d] dark:text-emerald-400"
                      : "text-gray-500 dark:text-gray-400"
                  }
                >
                  {item.icon}
                </span>
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

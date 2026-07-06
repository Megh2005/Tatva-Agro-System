"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  RiHome5Line,
  RiHome5Fill,
  RiUser3Line,
  RiUser3Fill,
  RiMapPinRangeLine,
  RiMapPinRangeFill,
  RiMapPinAddLine,
  RiMapPinAddFill,
  RiCpuLine,
  RiCpuFill,
  RiTempHotLine,
  RiTempHotFill,
  RiScales3Line,
  RiScales3Fill,
  RiLoginBoxLine,
  RiLogoutBoxLine,
  RiBugLine,
  RiBugFill,
  RiUmbrellaLine,
  RiUmbrellaFill,
  RiInformationLine,
  RiInformationFill,
  RiCustomerService2Line,
  RiCustomerService2Fill,
} from "react-icons/ri";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  shortName: string;
  icon: React.ElementType;
  iconFilled: React.ElementType;
  href: string;
  show: boolean;
}

export default function Navigation() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [hovered, setHovered] = useState<string>("");
  const dockRef = useRef<HTMLDivElement>(null);

  const navItems: NavItem[] = [
    {
      name: "Home",
      shortName: "Home",
      icon: RiHome5Line,
      iconFilled: RiHome5Fill,
      href: "/",
      show: true,
    },
    {
      name: "About",
      shortName: "About",
      icon: RiInformationLine,
      iconFilled: RiInformationFill,
      href: "/about",
      show: true,
    },
    {
      name: "Contact",
      shortName: "Support",
      icon: RiCustomerService2Line,
      iconFilled: RiCustomerService2Fill,
      href: "/contact",
      show: true,
    },
    {
      name: "My Plots",
      shortName: "Plots",
      icon: RiMapPinRangeLine,
      iconFilled: RiMapPinRangeFill,
      href: "/plots",
      show: status === "authenticated",
    },
    {
      name: "Register Plot",
      shortName: "Add Plot",
      icon: RiMapPinAddLine,
      iconFilled: RiMapPinAddFill,
      href: "/plots/create",
      show: status === "authenticated",
    },
    {
      name: "Crop Scan",
      shortName: "Crop Scan",
      icon: RiCpuLine,
      iconFilled: RiCpuFill,
      href: "/tools/discolouration",
      show: status === "authenticated",
    },
    {
      name: "Crop Disease",
      shortName: "Disease",
      icon: RiBugLine,
      iconFilled: RiBugFill,
      href: "/tools/disease",
      show: status === "authenticated",
    },
    {
      name: "Yield Predictor",
      shortName: "Yield",
      icon: RiTempHotLine,
      iconFilled: RiTempHotFill,
      href: "/tools/yield",
      show: status === "authenticated",
    },
    {
      name: "Market Predictor",
      shortName: "Market",
      icon: RiScales3Line,
      iconFilled: RiScales3Fill,
      href: "/tools/market",
      show: status === "authenticated",
    },
    {
      name: "Profile",
      shortName: "Profile",
      icon: RiUser3Line,
      iconFilled: RiUser3Fill,
      href: "/profile",
      show: status === "authenticated",
    },
    {
      name: "Insurance",
      shortName: "Insure",
      icon: RiUmbrellaLine,
      iconFilled: RiUmbrellaFill,
      href: "/insurance",
      show: status === "authenticated",
    },
    {
      name: "Login",
      shortName: "Login",
      icon: RiLoginBoxLine,
      iconFilled: RiLoginBoxLine,
      href: "/auth",
      show: status === "unauthenticated",
    },
  ];

  const activeItems = navItems.filter((item) => item.show);

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
      ref={dockRef}
    >

      {/* Dock Container */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 28, delay: 0.1 }}
        className="flex items-center gap-1 px-5 py-2 rounded-2xl bg-white/90 backdrop-blur-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
      >
        {activeItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onMouseEnter={() => setHovered(item.name)}
              onMouseLeave={() => setHovered("")}
              className="group relative"
            >
              {/* Per-item tooltip */}
              <AnimatePresence>
                {hovered === item.name && (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, y: 4, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.9 }}
                    transition={{ duration: 0.12 }}
                    className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900 text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-xl pointer-events-none border border-slate-700 z-10"
                  >
                    {item.name}
                    <span className="absolute left-1/2 -translate-x-1/2 -bottom-1 border-4 border-transparent border-t-slate-900" />
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                whileTap={{ scale: 0.88 }}
                whileHover={{ scale: 1.12, y: -3 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className={cn(
                  "relative flex items-center justify-center w-16 h-12 rounded-xl transition-colors duration-200",
                  isActive
                    ? "text-orange-500"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon size={26} />

                {/* Active dot */}
                {isActive && (
                  <motion.div
                    layoutId="active-dot"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-orange-500"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}

        {/* Divider before logout */}
        {status === "authenticated" && (
          <>
            <div className="w-px h-8 bg-slate-200 mx-1" />
            <button
              onClick={() => signOut()}
              onMouseEnter={() => setHovered("Logout")}
              onMouseLeave={() => setHovered("")}
              className="group relative"
            >
              {/* Logout tooltip */}
              <AnimatePresence>
                {hovered === "Logout" && (
                  <motion.div
                    key="logout-tip"
                    initial={{ opacity: 0, y: 4, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.9 }}
                    transition={{ duration: 0.12 }}
                    className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl pointer-events-none border border-slate-700 z-10"
                  >
                    Logout
                    <span className="absolute left-1/2 -translate-x-1/2 -bottom-1 border-4 border-transparent border-t-slate-900" />
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.div
                whileTap={{ scale: 0.88 }}
                whileHover={{ scale: 1.12, y: -3 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="flex items-center justify-center w-16 h-12 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
              >
                <RiLogoutBoxLine size={26} />
              </motion.div>
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}

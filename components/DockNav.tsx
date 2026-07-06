"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  RiHome5Line,
  RiHome5Fill,
  RiMapPinRangeLine,
  RiMapPinRangeFill,
  RiMapPinAddLine,
  RiMapPinAddFill,
  RiCpuLine,
  RiCpuFill,
  RiScales3Line,
  RiScales3Fill,
  RiTempHotLine,
  RiTempHotFill,
  RiUser3Line,
  RiUser3Fill,
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
      name: "Discoloration",
      shortName: "Discoloration",
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
      name: "Insurance",
      shortName: "Insure",
      icon: RiUmbrellaLine,
      iconFilled: RiUmbrellaFill,
      href: "/insurance",
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
          const Icon = isActive ? item.iconFilled : item.icon;

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
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-3 py-1.5 rounded-lg bg-black text-white text-[10px] font-black uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap pointer-events-none"
                  >
                    {item.name}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Icon button */}
              <div
                className={cn(
                  "p-3 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center",
                  isActive
                    ? "bg-slate-900 text-white scale-110 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
            </Link>
          );
        })}
      </motion.div>
    </div>
  );
}

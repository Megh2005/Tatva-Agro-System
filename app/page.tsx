"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const redirecttoAuthScreen = () => {
    router.push("/auth");
  };
  return (
    <div className="relative h-screen">
      {/* Hero Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4">
        <div className="max-w-[90vw] text-center">
          <h1 className="mb-6 text-5xl font-extrabold sm:text-8xl bg-linear-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent pb-3 select-none">
            Tatva Agro
          </h1>
          <p className="mx-auto mt-8 capitalize leading-relaxed mb-10 max-w-[50vw] text-xl sm:text-4xl text-slate-600/90 font-medium tracking-tight">
            Empowering & modernizing Indian farmers with modern{" "}
            <span className="font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">technology</span>
          </p>
          <div className="flex flex-wrap justify-center gap-8">
            <button
              onClick={redirecttoAuthScreen}
              className="rounded-xl px-10 py-4 text-lg font-bold tracking-tight bg-linear-to-r from-emerald-600 to-teal-600 text-white hover:shadow-xl hover:shadow-emerald-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer border-none shadow-md"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

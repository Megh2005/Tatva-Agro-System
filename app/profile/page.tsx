"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BackgroundPattern from "@/components/BackgroundPattern";
import Image from "next/image";
import SignOutButton from "@/components/SignOutButton";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";
import {
  Pencil,
  Map as MapIcon,
  MapPin,
  User,
  MapPinned,
  Mail,
  Camera,
} from "lucide-react";
import CompleteProfileSheet from "@/components/CompleteProfileSheet";

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status, router]);

  const fetchUserData = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setName(data.name || "");
        setUserData(data);
      }
    } catch (error) {
      console.error("Failed to fetch user data", error);
    }
  };

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      fetchUserData();
    }
  }, [session]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <BackgroundPattern />
        <p className="text-slate-900 font-medium">Loading...</p>
      </div>
    );
  }

  if (!session?.user) return null;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setLoading(true);
    try {
      let avatarUrl: string | undefined;

      if (avatarFile) {
        const fd = new FormData();
        fd.append("file", avatarFile);
        const uploadRes = await fetch("/api/upload-image", {
          method: "POST",
          body: fd,
        });
        if (!uploadRes.ok) {
          const err = await uploadRes.json();
          throw new Error(err.error || "Avatar upload failed");
        }
        const uploaded = await uploadRes.json();
        avatarUrl = uploaded.secure_url;
      }

      const res = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          ...(avatarUrl ? { avatar: avatarUrl } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");

      await update();
      toast.success("Profile updated successfully!");
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      fetchUserData();
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setName(session.user.name || "");
    setAvatarFile(null);
    setAvatarPreview(null);
    setIsEditing(false);
  };

  const currentAvatar =
    avatarPreview ||
    (session.user as any).avatar ||
    session.user.image ||
    null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <BackgroundPattern />
      <Card className="w-full max-w-4xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-2xl bg-white/95 backdrop-blur-sm overflow-hidden">
        <div className="h-1.5 bg-linear-to-r from-amber-500 via-orange-500 to-emerald-600 w-full" />
        <CardHeader className="text-center relative border-b border-slate-100 pb-4 pt-6">
          <CardTitle className="text-2xl font-extrabold text-slate-800 tracking-tight">
            User Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6 pt-6 px-8">

          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border border-slate-200 shadow-md ring-4 ring-orange-500/10">
              {currentAvatar ? (
                <Image
                  src={currentAvatar}
                  alt="Avatar"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-3xl">
                  {session.user.name?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            {isEditing && (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-orange-500 hover:bg-orange-600 border-2 border-white flex items-center justify-center shadow-md transition-colors duration-200 cursor-pointer"
                  title="Change avatar"
                >
                  <Camera className="h-3.5 w-3.5 text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </>
            )}
          </div>

          <div className="w-full space-y-5 px-2">
            {isEditing ? (
              <>
                {/* Full Name — only editable field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-slate-700 font-semibold text-sm"
                  >
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="border border-black focus-visible:ring-4 focus-visible:ring-orange-500/10 focus-visible:border-orange-500 rounded-xl bg-slate-50/85 h-11 text-sm font-medium text-slate-800 transition-all duration-200"
                  />
                </div>

                {/* Email — shown read-only for reference */}
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-slate-700 font-semibold text-sm"
                  >
                    Email
                  </Label>
                  <Input
                    id="email"
                    value={session.user.email || ""}
                    disabled
                    className="border border-black rounded-xl bg-slate-100/50 text-slate-400 font-medium h-11 text-sm cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-400 font-medium">
                    Email cannot be changed
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold bg-linear-to-r from-emerald-600 to-teal-600 text-white hover:shadow-lg hover:shadow-emerald-500/15 transition-all duration-200 border-none cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 hover:shadow-sm active:shadow-none transition-all duration-200 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* View mode — Name & Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50/50 border-2 border-black rounded-xl p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors duration-200">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200/50">
                      <User className="h-5 w-5 text-slate-500" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Name
                      </p>
                      <p className="text-base font-extrabold text-slate-800">
                        {session.user.name}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50/50 border-2 border-black rounded-xl p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors duration-200">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200/50">
                      <Mail className="h-5 w-5 text-slate-500" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Email
                      </p>
                      <p className="text-base font-extrabold text-slate-800 break-all">
                        {session.user.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Address — read-only, shown only if already set */}
                {userData &&
                  (userData.isAddressUpdated ||
                    (userData.state && userData.city && userData.pincode)) && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="bg-slate-50/50 border-2 border-black rounded-xl p-4 flex flex-col items-center justify-center text-center gap-1 hover:bg-slate-50 transition-colors duration-200">
                        <MapIcon className="h-5 w-5 text-slate-400" />
                        <p className="text-sm font-extrabold text-slate-800 mt-1">
                          {userData.state}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          State
                        </p>
                      </div>
                      <div className="bg-slate-50/50 border-2 border-black rounded-xl p-4 flex flex-col items-center justify-center text-center gap-1 hover:bg-slate-50 transition-colors duration-200">
                        <MapPinned className="h-5 w-5 text-slate-400" />
                        <p className="text-sm font-extrabold text-slate-800 mt-1">
                          {userData.city}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          City
                        </p>
                      </div>
                      <div className="bg-slate-50/50 border-2 border-black rounded-xl p-4 flex flex-col items-center justify-center text-center gap-1 hover:bg-slate-50 transition-colors duration-200">
                        <MapPin className="h-5 w-5 text-slate-400" />
                        <p className="text-sm font-extrabold text-slate-800 mt-1">
                          {userData.pincode}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          Pincode
                        </p>
                      </div>
                    </div>
                  )}
              </>
            )}
          </div>

          <div className="w-full px-2 pt-2 space-y-3">
            {!isEditing && (
              <div className="flex gap-3 w-full">
                <CompleteProfileSheet
                  userData={userData}
                  onUpdate={fetchUserData}
                />
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 font-bold bg-linear-to-r from-amber-500 to-orange-600 text-white hover:shadow-lg hover:shadow-orange-500/15 transition-all duration-200 border-none cursor-pointer whitespace-nowrap"
                >
                  <Pencil className="h-4 w-4" />
                  Edit Profile
                </button>
              </div>
            )}
            {!isEditing && <SignOutButton />}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

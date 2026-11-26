"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, Bell, Shield, Palette, Database, Download, Upload, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "notifications" | "security" | "appearance" | "data">("profile");
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ full_name: "", email: "" });
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchUser();
  }, []);

  async function fetchUser() {
    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (authUser) {
      setUser({
        id: authUser.id,
        email: authUser.email || "",
        full_name: authUser.user_metadata?.full_name || null,
        avatar_url: authUser.user_metadata?.avatar_url || null,
        role: authUser.user_metadata?.role || "staff",
        created_at: authUser.created_at,
      });
      setFormData({
        full_name: authUser.user_metadata?.full_name || "",
        email: authUser.email || "",
      });
    }
    setLoading(false);
  }

  async function updateProfile() {
    setSaving(true);
    setSuccess("");

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: { full_name: formData.full_name },
    });

    if (error) {
      alert(error.message);
    } else {
      setSuccess("Profile updated successfully!");
      fetchUser();
    }
    setSaving(false);
  }

  async function changePassword(formData: FormData) {
    const current = formData.get("current") as string;
    const newPass = formData.get("new") as string;
    const confirm = formData.get("confirm") as string;

    if (newPass !== confirm) {
      alert("New passwords do not match");
      return;
    }

    if (newPass.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPass });

    if (error) {
      alert(error.message);
    } else {
      alert("Password changed successfully!");
      (document.getElementById("password-form") as HTMLFormElement)?.reset();
    }
  }

  async function exportData() {
    const supabase = createClient();
    const [students, inventory, imports] = await Promise.all([
      supabase.from("students").select("*"),
      supabase.from("inventory_items").select("*"),
      supabase.from("import_logs").select("*"),
    ]);

    const data = {
      students: students.data || [],
      inventory: inventory.data || [],
      imports: imports.data || [],
      exported_at: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dept-mgmt-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        const supabase = createClient();

        if (confirm(`This will import ${data.students?.length || 0} students and ${data.inventory?.length || 0} inventory items. Continue?`)) {
          if (data.students?.length) {
            await supabase.from("students").upsert(data.students, { onConflict: "student_id" });
          }
          if (data.inventory?.length) {
            await supabase.from("inventory_items").upsert(data.inventory, { onConflict: "id" });
          }
          alert("Backup imported successfully!");
          window.location.reload();
        }
      } catch (err) {
        alert("Invalid backup file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "data", label: "Data & Backup", icon: Database },
  ];

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <nav className="flex gap-1 px-2" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap",
                  activeTab === tab.id
                    ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <User className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formData.full_name || "No name set"}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Member since {new Date(user?.created_at || "").toLocaleDateString()}
                  </p>
                </div>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); updateProfile(); }} className="space-y-4">
                {success && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg text-sm">
                    {success}
                  </div>
                )}

                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name
                  </label>
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email (cannot be changed here)
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                  <select
                    value={user?.role || "staff"}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="admin">Administrator</option>
                    <option value="staff">Staff</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Contact an administrator to change your role
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notification Preferences</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Configure how you receive alerts about low stock, import results, and system updates.
              </p>

              {[
                { id: "email_low_stock", label: "Low Stock Alerts (Email)", description: "Receive email when inventory falls below threshold" },
                { id: "email_imports", label: "Import Results (Email)", description: "Get notified when bulk imports complete" },
                { id: "in_app_low_stock", label: "Low Stock (In-App)", description: "Show badge on inventory page" },
                { id: "in_app_imports", label: "Import Results (In-App)", description: "Show toast notification on completion" },
              ].map((notif) => (
                <div key={notif.id} className="flex items-center justify-between py-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{notif.label}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{notif.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Change Password</h3>
              <form id="password-form" onSubmit={(e) => { e.preventDefault(); changePassword(new FormData(e.currentTarget)); }} className="space-y-4 max-w-md">
                <div>
                  <label htmlFor="current" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Current Password
                  </label>
                  <input
                    id="current"
                    name="current"
                    type="password"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="new" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    New Password
                  </label>
                  <input
                    id="new"
                    name="new"
                    type="password"
                    required
                    minLength={8}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    id="confirm"
                    name="confirm"
                    type="password"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Update Password</button>
              </form>

              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Active Sessions</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">Manage your active login sessions across devices.</p>
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                  Sign Out Everywhere
                </button>
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === "appearance" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Theme</h3>
              <p className="text-gray-500 dark:text-gray-400">Choose your preferred color scheme.</p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: "light", label: "Light", icon: "☀️" },
                  { id: "dark", label: "Dark", icon: "🌙" },
                  { id: "system", label: "System", icon: "💻" },
                ].map((theme) => (
                  <button
                    key={theme.id}
                    className={cn(
                      "p-4 rounded-xl border-2 text-center transition-colors",
                      theme.id === "system"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    )}
                  >
                    <span className="text-3xl block mb-2">{theme.icon}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{theme.label}</span>
                  </button>
                ))}
              </div>

              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Density</h3>
                <div className="flex gap-4">
                  {["comfortable", "compact"].map((density) => (
                    <button
                      key={density}
                      className={cn(
                        "flex-1 p-4 rounded-xl border-2 text-center transition-colors",
                        density === "comfortable"
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      )}
                    >
                      <span className="font-medium text-gray-900 dark:text-white capitalize">{density}</span>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {density === "comfortable" ? "More spacing" : "Less spacing"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Data & Backup Tab */}
          {activeTab === "data" && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Export Data
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Download a complete backup of all students, inventory, and import logs as JSON.
                </p>
                <button
                  onClick={exportData}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Download className="w-4 h-4" />
                  Export All Data (JSON)
                </button>
              </div>

              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Import Backup
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Restore data from a previously exported JSON backup file.
                </p>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportBackup}
                    id="backup-import"
                  />
                  <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                    <Upload className="w-4 h-4" />
                    Choose Backup File
                  </button>
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Warning: This will merge data and may create duplicates. Review before importing.
                </p>
              </div>

              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-red-600">
                  <Trash2 className="w-5 h-5" />
                  Danger Zone
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  These actions are irreversible. Use with caution.
                </p>
                <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div>
                    <p className="font-medium text-red-800 dark:text-red-200">Delete All Data</p>
                    <p className="text-sm text-red-600 dark:text-red-400">Permanently remove all students, inventory, and logs</p>
                  </div>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                    Delete Everything
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
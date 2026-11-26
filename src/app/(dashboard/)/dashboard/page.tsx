"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import {
  Users,
  Package,
  TrendingUp,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import Link from "next/link";

interface Stats {
  totalStudents: number;
  totalInventory: number;
  lowStockItems: number;
  recentImports: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalInventory: 0,
    lowStockItems: 0,
    recentImports: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient();

      const [
        { count: studentsCount },
        { count: inventoryCount },
        { count: lowStockCount },
        { count: importsCount },
      ] = await Promise.all([
        supabase.from("students").select("*", { count: "exact", head: true }),
        supabase.from("inventory_items").select("*", { count: "exact", head: true }),
        supabase
          .from("inventory_items")
          .select("*", { count: "exact", head: true })
          .lte("quantity", 5),
        supabase
          .from("import_logs")
          .select("*", { count: "exact", head: true })
          .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      ]);

      setStats({
        totalStudents: studentsCount || 0,
        totalInventory: inventoryCount || 0,
        lowStockItems: lowStockCount || 0,
        recentImports: importsCount || 0,
      });
      setLoading(false);
    }

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Students",
      value: stats.totalStudents,
      icon: Users,
      color: "bg-blue-500",
      href: "/students",
      change: "+12%",
      changeType: "increase",
    },
    {
      title: "Inventory Items",
      value: stats.totalInventory,
      icon: Package,
      color: "bg-green-500",
      href: "/inventory",
      change: "+5%",
      changeType: "increase",
    },
    {
      title: "Low Stock Alerts",
      value: stats.lowStockItems,
      icon: TrendingUp,
      color: stats.lowStockItems > 0 ? "bg-red-500" : "bg-gray-500",
      href: "/inventory",
      change: stats.lowStockItems > 0 ? "Needs attention" : "All good",
      changeType: stats.lowStockItems > 0 ? "increase" : "neutral",
    },
    {
      title: "Recent Imports (7d)",
      value: stats.recentImports,
      icon: FileText,
      color: "bg-purple-500",
      href: "/upload",
      change: "+3 this week",
      changeType: "increase",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Overview of your department's records and inventory
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/students/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Users className="w-4 h-4" />
            Add Student
          </Link>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            <FileText className="w-4 h-4" />
            Bulk Import
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Link
            key={stat.title}
            href={stat.href}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {loading ? "—" : stat.value.toLocaleString()}
                </p>
                <p
                  className={`text-sm mt-2 flex items-center gap-1 ${
                    stat.changeType === "increase"
                      ? "text-green-600 dark:text-green-400"
                      : stat.changeType === "decrease"
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {stat.changeType === "increase" && <ArrowUpRight className="w-3.5 h-3.5" />}
                  {stat.changeType === "decrease" && <ArrowDownRight className="w-3.5 h-3.5" />}
                  {stat.changeType === "neutral" && <span className="w-3.5 h-3.5" />}
                  <span>{stat.change}</span>
                </p>
              </div>
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/students/new"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Add New Student</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Single entry form</p>
              </div>
            </Link>
            <Link
              href="/upload"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Bulk Import Students</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Upload Excel/CSV file</p>
              </div>
            </Link>
            <Link
              href="/inventory/new"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Package className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Add Inventory Item</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Track department assets</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Student Type Distribution</h2>
          <StudentTypeChart />
        </div>
      </div>
    </div>
  );
}

function StudentTypeChart() {
  const [data, setData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDistribution() {
      const supabase = createClient();
      const { data: students } = await supabase.from("students").select("student_type");
      if (students) {
        const counts = students.reduce((acc, s) => {
          acc[s.student_type] = (acc[s.student_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        setData(counts);
      }
      setLoading(false);
    }
    fetchDistribution();
  }, []);

  if (loading) return <div className="h-32 flex items-center justify-center text-gray-500">Loading...</div>;

  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (total === 0) return <div className="h-32 flex items-center justify-center text-gray-500">No student data yet</div>;

  const colors = {
    regular: "bg-blue-500",
    irregular: "bg-amber-500",
    transferee: "bg-purple-500",
    graduating: "bg-green-500",
    graduated: "bg-gray-500",
  };

  return (
    <div className="space-y-3">
      {Object.entries(data).map(([type, count]) => (
        <div key={type} className="flex items-center gap-3">
          <div className="w-24 text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
            {type}
          </div>
          <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${colors[type as keyof typeof colors]} rounded-full transition-all duration-500`}
              style={{ width: `${(count / total) * 100}%` }}
            />
          </div>
          <div className="w-16 text-right text-sm text-gray-600 dark:text-gray-400">
            {count} ({(count / total) * 100}%)
          </div>
        </div>
      ))}
    </div>
  );
}
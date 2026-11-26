import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const STUDENT_TYPES = [
  "regular",
  "irregular",
  "transferee",
  "graduating",
  "graduated",
] as const;

export type StudentType = (typeof STUDENT_TYPES)[number];

export function getStudentTypeLabel(type: StudentType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function getStudentTypeColor(type: StudentType): string {
  const colors: Record<StudentType, string> = {
    regular: "bg-blue-100 text-blue-800",
    irregular: "bg-amber-100 text-amber-800",
    transferee: "bg-purple-100 text-purple-800",
    graduating: "bg-green-100 text-green-800",
    graduated: "bg-gray-100 text-gray-800",
  };
  return colors[type] || "bg-gray-100 text-gray-800";
}
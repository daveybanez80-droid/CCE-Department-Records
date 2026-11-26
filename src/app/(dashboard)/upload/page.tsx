"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Loader2, FileSpreadsheet, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import Link from "next/link";
import * as XLSX from "xlsx";

interface ImportResult {
  success: boolean;
  totalRows: number;
  successful: number;
  failed: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
    data: Record<string, unknown>;
  }>;
}

interface PreviewRow {
  student_id: string;
  full_name: string;
  email?: string;
  phone?: string;
  student_type?: string;
  course?: string;
  year_level?: number;
  enrolled_at?: string;
  _valid: boolean;
  _errors: string[];
}

const REQUIRED_FIELDS = ["student_id", "full_name", "student_type"];
const VALID_STUDENT_TYPES = ["regular", "irregular", "transferee", "graduating", "graduated"];

export default function UploadPage() {
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "complete">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewRow[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError("");
      parseFile(selectedFile);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.currentTarget.classList.add("border-blue-500", "bg-blue-50", "dark:bg-blue-900/20");
  }

  function handleDragLeave(e: React.DragEvent) {
    e.currentTarget.classList.remove("border-blue-500", "bg-blue-50", "dark:bg-blue-900/20");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.currentTarget.classList.remove("border-blue-500", "bg-blue-50", "dark:bg-blue-900/20");
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError("");
      parseFile(droppedFile);
    }
  }

  function parseFile(selectedFile: File) {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        const preview = jsonData.map((row: any, index: number) => {
          const normalizedRow: Record<string, unknown> = {};
          Object.keys(row).forEach((key) => {
            const normalizedKey = key.toLowerCase().trim().replace(/\s+/g, "_");
            normalizedRow[normalizedKey] = row[key];
          });

          const errors: string[] = [];
          REQUIRED_FIELDS.forEach((field) => {
            if (!normalizedRow[field] || String(normalizedRow[field]).trim() === "") {
              errors.push(`Missing required field: ${field}`);
            }
          });

          if (normalizedRow.student_type) {
            const type = String(normalizedRow.student_type).toLowerCase().trim();
            if (!VALID_STUDENT_TYPES.includes(type)) {
              errors.push(`Invalid student_type: "${type}". Must be one of: ${VALID_STUDENT_TYPES.join(", ")}`);
            }
          }

          if (normalizedRow.year_level) {
            const year = parseInt(String(normalizedRow.year_level));
            if (isNaN(year) || year < 1 || year > 5) {
              errors.push("year_level must be a number between 1 and 5");
            }
          }

          if (normalizedRow.enrolled_at) {
            const date = new Date(String(normalizedRow.enrolled_at));
            if (isNaN(date.getTime())) {
              errors.push("enrolled_at must be a valid date");
            }
          }

          return {
            student_id: String(normalizedRow.student_id || "").trim(),
            full_name: String(normalizedRow.full_name || "").trim(),
            email: normalizedRow.email ? String(normalizedRow.email).trim() : undefined,
            phone: normalizedRow.phone ? String(normalizedRow.phone).trim() : undefined,
            student_type: normalizedRow.student_type ? String(normalizedRow.student_type).toLowerCase().trim() : undefined,
            course: normalizedRow.course ? String(normalizedRow.course).trim() : undefined,
            year_level: normalizedRow.year_level ? parseInt(String(normalizedRow.year_level)) : undefined,
            enrolled_at: normalizedRow.enrolled_at ? String(normalizedRow.enrolled_at).trim() : undefined,
            _valid: errors.length === 0,
            _errors: errors,
          };
        });

        setPreviewData(preview);
        setStep("preview");
      } catch (err) {
        setError("Failed to parse file. Please ensure it's a valid Excel/CSV file.");
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  }

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setError("");

    const validRows = previewData.filter((row) => row._valid);
    const supabase = createClient();

    const { error } = await supabase.from("import_logs").insert({
      filename: file.name,
      total_rows: previewData.length,
      successful: 0,
      failed: 0,
      errors: [],
    });

    if (error) {
      setError("Failed to create import log: " + error.message);
      setLoading(false);
      return;
    }

    const studentsToInsert = validRows.map((row) => ({
      student_id: row.student_id,
      full_name: row.full_name,
      email: row.email || null,
      phone: row.phone || null,
      student_type: row.student_type || "regular",
      course: row.course || null,
      year_level: row.year_level || null,
      enrolled_at: row.enrolled_at || null,
      status: "active",
    }));

    let successful = 0;
    let failed = 0;
    const errors: ImportResult["errors"] = [];

    for (let i = 0; i < studentsToInsert.length; i++) {
      const student = studentsToInsert[i];
      const { error } = await supabase.from("students").upsert(student, {
        onConflict: "student_id",
      });

      if (error) {
        failed++;
        errors.push({
          row: i + 1,
          field: "database",
          message: error.message,
          data: student,
        });
      } else {
        successful++;
      }
    }

    // Update import log
    await supabase
      .from("import_logs")
      .update({ successful, failed, errors })
      .eq("filename", file.name)
      .order("created_at", { ascending: false })
      .limit(1);

    setImportResult({
      success: failed === 0,
      totalRows: previewData.length,
      successful,
      failed,
      errors,
    });
    setStep("complete");
    setLoading(false);
  }

  function reset() {
    setStep("upload");
    setFile(null);
    setPreviewData([]);
    setImportResult(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bulk Import Students</h1>
          <p className="text-gray-600 dark:text-gray-400">Upload Excel or CSV file to add multiple students at once</p>
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === "upload" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center transition-colors hover:border-blue-400"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              id="file-upload"
              onChange={handleFileSelect}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <FileSpreadsheet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Drag & drop your Excel/CSV file here
              </p>
              <p className="text-gray-500 dark:text-gray-400 mb-4">or click to browse</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Supported formats: .xlsx, .xls, .csv (max 10MB)
              </p>
            </label>
          </div>

          {/* Template download */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Need a template?</p>
            <button
              onClick={() => downloadTemplate()}
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <Download className="w-4 h-4" />
              Download Excel Template
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === "preview" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Preview Import</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {file?.name} • {previewData.length} rows • {previewData.filter((r) => r._valid).length} valid • {previewData.filter((r) => !r._valid).length} errors
                </p>
              </div>
              <button
                onClick={reset}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">#</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Student ID</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Name</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Type</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Course</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Year</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
                  {previewData.map((row, index) => (
                    <tr
                      key={index}
                      className={row._valid ? "" : "bg-red-50 dark:bg-red-900/10"}
                    >
                      <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{index + 1}</td>
                      <td className="px-4 py-2 font-mono text-gray-900 dark:text-white">{row.student_id}</td>
                      <td className="px-4 py-2 text-gray-900 dark:text-white">{row.full_name}</td>
                      <td className="px-4 py-2 capitalize text-gray-700 dark:text-gray-300">{row.student_type}</td>
                      <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{row.course || "—"}</td>
                      <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{row.year_level || "—"}</td>
                      <td className="px-4 py-2">
                        {row._valid ? (
                          <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                            <CheckCircle className="w-4 h-4" />
                            Valid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                            <AlertCircle className="w-4 h-4" />
                            {row._errors.length} error(s)
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {previewData.some((r) => !r._valid) && (
              <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                  <AlertCircle className="w-4 h-4 inline mr-1" /> Some rows have errors and will be skipped during import.
                </p>
                <button
                  onClick={() => downloadErrorReport()}
                  className="text-sm text-amber-700 dark:text-amber-300 underline hover:no-underline"
                >
                  Download error report
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={reset} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              Back
            </button>
            <button
              onClick={handleImport}
              disabled={previewData.filter((r) => r._valid).length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Import {previewData.filter((r) => r._valid).length} Students
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Importing */}
      {step === "importing" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Importing students...</h2>
          <p className="text-gray-500 dark:text-gray-400">Please wait while we process your file</p>
        </div>
      )}

      {/* Step 4: Complete */}
      {step === "complete" && importResult && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-full ${importResult.success ? "bg-green-100 dark:bg-green-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`}>
                {importResult.success ? (
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {importResult.success ? "Import Complete" : "Import Completed with Errors"}
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  {importResult.successful} of {importResult.totalRows} students imported successfully
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Rows" value={importResult.totalRows} icon={FileSpreadsheet} color="blue" />
              <StatCard label="Successful" value={importResult.successful} icon={CheckCircle} color="green" />
              <StatCard label="Failed" value={importResult.failed} icon={XCircle} color="red" />
              <StatCard label="Skipped" value={importResult.totalRows - importResult.successful - importResult.failed} icon={AlertCircle} color="amber" />
            </div>

            {importResult.errors.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Errors</h3>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {importResult.errors.slice(0, 10).map((err, i) => (
                    <div key={i} className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                      Row {err.row}: {err.message}
                    </div>
                  ))}
                  {importResult.errors.length > 10 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                      ... and {importResult.errors.length - 10} more errors
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-center gap-3">
            <button onClick={reset} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Import Another File
            </button>
            <Link
              href="/students"
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              View Students
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  const colors = {
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
    green: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
    red: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
    amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
  };
  return (
    <div className="p-4 rounded-xl text-center">
      <div className={`p-2 rounded-lg ${colors[color as keyof typeof colors]} mx-auto mb-2 w-fit`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

function downloadTemplate() {
  const headers = [
    "student_id",
    "full_name",
    "email",
    "phone",
    "student_type",
    "course",
    "year_level",
    "enrolled_at",
  ];
  const sampleData = [
    {
      student_id: "2024-00001",
      full_name: "Juan Dela Cruz",
      email: "juan@school.edu",
      phone: "+63 912 345 6789",
      student_type: "regular",
      course: "BS Computer Science",
      year_level: 1,
      enrolled_at: "2024-08-15",
    },
    {
      student_id: "2024-00002",
      full_name: "Maria Santos",
      email: "maria@school.edu",
      phone: "+63 917 555 0123",
      student_type: "transferee",
      course: "BS Information Technology",
      year_level: 2,
      enrolled_at: "2024-08-15",
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Students");
  XLSX.writeFile(wb, "student_import_template.xlsx");
}

function downloadErrorReport() {
  // Implementation would use previewData to generate error report
  alert("Error report download would be implemented here");
}
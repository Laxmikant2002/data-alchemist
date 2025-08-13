"use client";
import React, { useState } from "react";
import { useData } from "../../lib/DataContext";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { ClientSchema } from "../../types/client";
import { WorkerSchema } from "../../types/worker";
import { TaskSchema } from "../../types/task";
import { runAllValidations, ValidationError } from "../../lib/validators";
// AI service functions
const callAIService = async (action: string, params: any) => {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...params }),
    });
    
    if (!response.ok) {
      throw new Error(`AI service failed: ${response.status}`);
    }
    
    const result = await response.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error(`AI ${action} failed:`, error);
    return null;
  }
};

export default function UploadPage() {
  const { clients, workers, tasks, rules, setClients, setWorkers, setTasks, setErrors } = useData();
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    clients: { success: boolean; count: number; errors: string[] };
    workers: { success: boolean; count: number; errors: string[] };
    tasks: { success: boolean; count: number; errors: string[] };
  }>({
    clients: { success: false, count: 0, errors: [] },
    workers: { success: false, count: 0, errors: [] },
    tasks: { success: false, count: 0, errors: [] },
  });
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [aiCorrections, setAiCorrections] = useState<Record<string, unknown> | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiCorrections, setShowAiCorrections] = useState(false);

  const parseFile = async (file: File, type: "clients" | "workers" | "tasks") => {
    return new Promise<{ success: boolean; data: Record<string, unknown>[]; errors: string[] }>((resolve) => {
      if (file.name.endsWith(".csv")) {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results: any) => {
            if (results.errors.length > 0) {
              resolve({
                success: false,
                data: [],
                errors: results.errors.map((e: any) => `Row ${e.row + 1}: ${e.message}`),
              });
            } else {
              resolve({
                success: true,
                data: results.data,
                errors: [],
              });
            }
          },
        });
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];
            resolve({
              success: true,
              data: jsonData,
              errors: [],
            });
          } catch (error) {
            resolve({
              success: false,
              data: [],
              errors: [`Failed to parse Excel file: ${error}`],
            });
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        resolve({
          success: false,
          data: [],
          errors: ["Unsupported file format. Please use CSV or Excel files."],
        });
      }
    });
  };

  const validateAndTransformData = (
    data: Record<string, unknown>[],
    type: "clients" | "workers" | "tasks"
  ): { success: boolean; transformed: Record<string, unknown>[]; errors: string[] } => {
    const errors: string[] = [];
    const transformed: Record<string, unknown>[] = [];

    data.forEach((row, index) => {
      try {
        let validatedRow;
        switch (type) {
          case "clients":
            validatedRow = ClientSchema.parse(row);
            break;
          case "workers":
            validatedRow = WorkerSchema.parse(row);
            break;
          case "tasks":
            validatedRow = TaskSchema.parse(row);
            break;
        }
        transformed.push(validatedRow);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Row ${index + 1}: ${errorMessage}`);
      }
    });

    return {
      success: errors.length === 0,
      transformed,
      errors,
    };
  };

  const handleFileUpload = async (files: FileList | null, type: "clients" | "workers" | "tasks") => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const file = files[0];
    
    try {
      // Parse file
      const parseResult = await parseFile(file, type);
      if (!parseResult.success) {
        setUploadStatus(prev => ({
          ...prev,
          [type]: { success: false, count: 0, errors: parseResult.errors }
        }));
        setUploading(false);
        return;
      }

      // Validate and transform data
      const validationResult = validateAndTransformData(parseResult.data, type);
      if (!validationResult.success) {
        setUploadStatus(prev => ({
          ...prev,
          [type]: { success: false, count: 0, errors: validationResult.errors }
        }));
        setUploading(false);
        return;
      }

      // Update state based on type
      switch (type) {
        case "clients":
          setClients(validationResult.transformed as any);
          break;
        case "workers":
          setWorkers(validationResult.transformed as any);
          break;
        case "tasks":
          setTasks(validationResult.transformed as any);
          break;
      }

      setUploadStatus(prev => ({
        ...prev,
        [type]: { success: true, count: validationResult.transformed.length, errors: [] }
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setUploadStatus(prev => ({
        ...prev,
        [type]: { success: false, count: 0, errors: [`Upload failed: ${errorMessage}`] }
      }));
    } finally {
      setUploading(false);
    }
  };

  const runValidation = () => {
    const allErrors = runAllValidations(clients, workers, tasks, rules);
    setValidationErrors(allErrors);
    setErrors(allErrors);
  };

  // AI-powered error correction
  const handleGetAICorrections = async () => {
    if (validationErrors.length === 0) return;
    
    setAiLoading(true);
    setShowAiCorrections(false);
    
    try {
      const errorMessages = validationErrors.map(e => e.message);
      const allData = [...clients, ...workers, ...tasks];
      
      const suggestions = await callAIService('suggestCorrections', {
        data: allData,
        errors: errorMessages
      });
      
      if (suggestions && Array.isArray(suggestions)) {
        setAiCorrections({ suggestions });
        setShowAiCorrections(true);
      }
    } catch (error) {
      console.error("AI correction error:", error);
    } finally {
      setAiLoading(false);
    }
  };

  const applyAICorrection = (suggestion: Record<string, unknown>) => {
    // This would apply the AI suggestion to the data
    // For now, we'll just show an alert
    alert(`AI Suggestion: ${suggestion.reason}\n\nField: ${suggestion.field}\nCurrent: ${suggestion.currentValue}\nSuggested: ${suggestion.suggestedValue}`);
  };

  const getDataSummary = () => {
    return {
      totalClients: clients.length,
      totalWorkers: workers.length,
      totalTasks: tasks.length,
      totalErrors: validationErrors.length,
      hasData: clients.length > 0 || workers.length > 0 || tasks.length > 0
    };
  };

  const summary = getDataSummary();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Upload & Validation</h1>
        <p className="text-gray-600">Upload your CSV or Excel files and validate data integrity</p>
      </div>

      {/* Data Overview */}
      {summary.hasData && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Data Overview</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{summary.totalClients}</div>
              <div className="text-sm text-blue-600">Clients</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{summary.totalWorkers}</div>
              <div className="text-sm text-green-600">Workers</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{summary.totalTasks}</div>
              <div className="text-sm text-purple-600">Tasks</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{summary.totalErrors}</div>
              <div className="text-sm text-red-600">Errors</div>
            </div>
          </div>
        </div>
      )}

      {/* File Upload Section */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Clients Upload */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center mb-4">
            <div className="text-4xl mb-2">👥</div>
            <h3 className="text-lg font-semibold">Clients</h3>
            <p className="text-sm text-gray-600">Upload client data with priorities and task requests</p>
          </div>
          
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => handleFileUpload(e.target.files, "clients")}
            className="hidden"
            id="clients-upload"
          />
          <label
            htmlFor="clients-upload"
            className="block w-full text-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
          >
            {uploading ? "Uploading..." : "Choose File"}
          </label>
          
          {uploadStatus.clients.success && (
            <div className="mt-3 text-center text-sm text-green-600">
              ✅ {uploadStatus.clients.count} clients uploaded
            </div>
          )}
          {uploadStatus.clients.errors.length > 0 && (
            <div className="mt-3 text-center text-sm text-red-600">
              ❌ {uploadStatus.clients.errors.length} errors
            </div>
          )}
        </div>

        {/* Workers Upload */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center mb-4">
            <div className="text-4xl mb-2">👷</div>
            <h3 className="text-lg font-semibold">Workers</h3>
            <p className="text-sm text-gray-600">Upload worker skills and availability data</p>
          </div>
          
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => handleFileUpload(e.target.files, "workers")}
            className="hidden"
            id="workers-upload"
          />
          <label
            htmlFor="workers-upload"
            className="block w-full text-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
          >
            {uploading ? "Uploading..." : "Choose File"}
          </label>
          
          {uploadStatus.workers.success && (
            <div className="mt-3 text-center text-sm text-green-600">
              ✅ {uploadStatus.workers.count} workers uploaded
            </div>
          )}
          {uploadStatus.workers.errors.length > 0 && (
            <div className="mt-3 text-center text-sm text-red-600">
              ❌ {uploadStatus.workers.errors.length} errors
            </div>
          )}
        </div>

        {/* Tasks Upload */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center mb-4">
            <div className="text-4xl mb-2">📋</div>
            <h3 className="text-lg font-semibold">Tasks</h3>
            <p className="text-sm text-gray-600">Upload task definitions and requirements</p>
          </div>
          
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => handleFileUpload(e.target.files, "tasks")}
            className="hidden"
            id="tasks-upload"
          />
          <label
            htmlFor="tasks-upload"
            className="block w-full text-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
          >
            {uploading ? "Uploading..." : "Choose File"}
          </label>
          
          {uploadStatus.tasks.success && (
            <div className="mt-3 text-center text-sm text-green-600">
              ✅ {uploadStatus.tasks.count} tasks uploaded
            </div>
          )}
          {uploadStatus.tasks.errors.length > 0 && (
            <div className="mt-3 text-center text-sm text-red-600">
              ❌ {uploadStatus.tasks.errors.length} errors
            </div>
          )}
        </div>
      </div>

      {/* Validation Section */}
      {summary.hasData && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Data Validation</h2>
            <div className="flex gap-3">
              <button
                onClick={runValidation}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Run Validation
              </button>
              {validationErrors.length > 0 && (
                <button
                  onClick={handleGetAICorrections}
                  disabled={aiLoading}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {aiLoading ? "Getting AI Suggestions..." : "🤖 Get AI Corrections"}
                </button>
              )}
            </div>
          </div>

          {/* AI Corrections */}
          {showAiCorrections && aiCorrections && (
            <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h3 className="font-semibold text-purple-800 mb-3">AI Correction Suggestions</h3>
              
              {/* Data Quality Score */}
              {(aiCorrections as Record<string, unknown>).dataQualityScore && (
                <div className="mb-4 p-3 bg-white rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-purple-800">Data Quality Score:</span>
                    <span className="text-2xl font-bold text-purple-600">
                      {Math.round(((aiCorrections as Record<string, unknown>).dataQualityScore as number) * 100)}%
                    </span>
                  </div>
                  {(aiCorrections as Record<string, unknown>).validationStrategy && (
                    <p className="text-sm text-purple-700">{String((aiCorrections as Record<string, unknown>).validationStrategy)}</p>
                  )}
                </div>
              )}
              
              <div className="space-y-3">
                {((aiCorrections as Record<string, unknown>).corrections as Record<string, unknown>[])?.map((suggestion: Record<string, unknown>, index: number) => (
                  <div key={index} className="bg-white p-3 rounded border border-purple-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                          Confidence: {Math.round((suggestion.confidence as number) * 100)}%
                        </span>
                        {suggestion.impact && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            suggestion.impact === 'high' ? 'bg-red-100 text-red-800' :
                            suggestion.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            Impact: {String(suggestion.impact)}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => applyAICorrection(suggestion)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 mb-1">{String(suggestion.reason)}</p>
                    <p className="text-xs text-gray-600 mb-1">
                      Field: {String(suggestion.field)} | Current: {String(suggestion.currentValue)} | Suggested: {String(suggestion.suggestedValue)}
                    </p>
                    {suggestion.businessRuleCompliance && (
                      <p className="text-xs text-blue-600 mb-1">
                        <strong>Business Impact:</strong> {String(suggestion.businessRuleCompliance)}
                      </p>
                    )}
                    {suggestion.alternativeSolutions && (
                      <div className="text-xs text-gray-600">
                        <strong>Alternatives:</strong> {(suggestion.alternativeSolutions as string[]).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* General Recommendations */}
              {(aiCorrections as Record<string, unknown>).recommendations && (
                <div className="mt-4 bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">General Recommendations</h4>
                  <ul className="list-disc pl-5 text-sm text-blue-700">
                    {((aiCorrections as Record<string, unknown>).recommendations as string[])?.map((rec: string, index: number) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Validation Results */}
          {validationErrors.length === 0 ? (
            <div className="text-green-600 bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <span className="text-2xl mr-2">✅</span>
                <span>All validations passed! Your data is clean and ready for use.</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-red-600 bg-red-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">⚠️</span>
                  <span className="font-semibold">Found {validationErrors.length} validation error(s)</span>
                </div>
                <ul className="list-disc pl-5 space-y-1">
                  {validationErrors.map((err, idx) => (
                    <li key={idx} className="text-sm">
                      <span className={`inline-block px-2 py-1 rounded text-xs mr-2 ${
                        err.severity === "error" ? "bg-red-100 text-red-800" :
                        err.severity === "warning" ? "bg-yellow-100 text-yellow-800" :
                        "bg-blue-100 text-blue-800"
                      }`}>
                        {err.severity.toUpperCase()}
                      </span>
                      {err.message}
                      {err.rowIndex !== undefined ? ` (Row ${err.rowIndex + 1})` : ""}
                      {err.columnId ? ` [${err.columnId}]` : ""}
                      {err.suggestion && (
                        <span className="text-gray-600 ml-2">💡 {err.suggestion}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sample Data */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Sample Data</h2>
        <p className="text-gray-600 mb-4">
          Don&apos;t have data files? Use our sample data to test the system:
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          <a
            href="/samples/sample-clients.csv"
            download
            className="text-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="text-2xl mb-2">📥</div>
            <div className="font-medium">Sample Clients</div>
            <div className="text-sm text-gray-600">5 sample client records</div>
          </a>
          <a
            href="/samples/sample-workers.csv"
            download
            className="text-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="text-2xl mb-2">📥</div>
            <div className="font-medium">Sample Workers</div>
            <div className="text-sm text-gray-600">8 sample worker records</div>
          </a>
          <a
            href="/samples/sample-tasks.csv"
            download
            className="text-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="text-2xl mb-2">📥</div>
            <div className="font-medium">Sample Tasks</div>
            <div className="text-sm text-gray-600">8 sample task records</div>
          </a>
        </div>
      </div>
    </div>
  );
}


"use client";
import React, { useState } from "react";
import Papa from "papaparse";
import { useData } from "../../lib/DataContext";

export default function ExportPage() {
  const { clients, workers, tasks, rules, errors } = useData();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const handleExport = () => {
    setExportError(null);
    setExportSuccess(null);
    
    if (errors.length > 0) {
      setExportError("Please fix all validation errors before exporting.");
      return;
    }
    
    setExporting(true);
    
    try {
      // Create timestamp for export
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      // Download individual CSVs
      const downloadCSV = (data: object[], name: string) => {
        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${name}-${timestamp}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      };
      
      // Download data files
      downloadCSV(clients, "clients");
      downloadCSV(workers, "workers");
      downloadCSV(tasks, "tasks");
      
      // Create combined configuration file
      const config = {
        exportInfo: {
          timestamp: new Date().toISOString(),
          version: "1.0.0",
          application: "Data Alchemist",
          totalRecords: {
            clients: clients.length,
            workers: workers.length,
            tasks: tasks.length,
          },
          validationStatus: "passed",
        },
        data: {
          clients,
          workers,
          tasks,
        },
        rules: {
          businessRules: rules,
          ruleCount: rules.length,
          ruleTypes: [...new Set(rules.map((r: any) => r.type))],
          rulePriorities: rules.map((r: any) => ({ type: r.type, priority: r.priority || 1 }))
        },
        priorities: {
          // This would come from the priorities context in a real implementation
          criteria: {},
          totalWeight: 0,
        },
        metadata: {
          description: "Resource allocation configuration exported from Data Alchemist",
          nextSteps: "Use this configuration with your downstream resource allocation tools",
          notes: "All data has been validated and is ready for processing",
        }
      };
      
      // Download combined config
      const configBlob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
      const configUrl = URL.createObjectURL(configBlob);
      const configLink = document.createElement("a");
      configLink.href = configUrl;
      configLink.download = `data-alchemist-config-${timestamp}.json`;
      configLink.click();
      URL.revokeObjectURL(configUrl);
      
      setExportSuccess(`Export completed successfully! Downloaded ${clients.length + workers.length + tasks.length} records.`);
      
    } catch (error) {
      setExportError("Export failed. Please try again.");
      console.error("Export error:", error);
    } finally {
      setExporting(false);
    }
  };

  const handleIndividualExport = (type: "clients" | "workers" | "tasks") => {
    const data = type === "clients" ? clients : type === "workers" ? workers : tasks;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}-${timestamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getDataSummary = () => {
    const totalRecords = clients.length + workers.length + tasks.length;
    const hasData = totalRecords > 0;
    const hasErrors = errors.length > 0;
    
    return { totalRecords, hasData, hasErrors };
  };

  const { totalRecords, hasData, hasErrors } = getDataSummary();

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Export Data & Configuration</h1>
        <p className="text-gray-600">Download your validated data and business rules for use in downstream resource allocation tools</p>
      </div>

      {/* Data Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Data Overview</h2>
        
        {!hasData ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📤</div>
            <p>No data available for export. Please upload data files first.</p>
            <a href="/upload" className="text-blue-600 hover:underline">Go to Upload →</a>
          </div>
        ) : (
          <div className="grid md:grid-cols-5 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{clients.length}</div>
              <div className="text-sm text-blue-600">Clients</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{workers.length}</div>
              <div className="text-sm text-green-600">Workers</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{tasks.length}</div>
              <div className="text-sm text-purple-600">Tasks</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{rules.length}</div>
              <div className="text-sm text-orange-600">Rules</div>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{errors.length}</div>
              <div className="text-sm text-red-600">Errors</div>
            </div>
          </div>
        )}
        
        {/* Validation Status */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Validation Status</h3>
          {hasErrors ? (
            <div className="text-red-600 bg-red-50 p-4 rounded-lg">
              <div className="flex items-center">
                <span className="text-2xl mr-2">⚠️</span>
                <span>Found {errors.length} validation error(s). Please fix these before exporting.</span>
              </div>
            </div>
          ) : hasData ? (
            <div className="text-green-600 bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <span className="text-2xl mr-2">✅</span>
                <span>All data is valid and ready for export!</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Export Options</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Combined Export */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">🚀 Complete Package Export</h3>
            <p className="text-sm text-gray-600 mb-4">
              Download all data files plus a comprehensive configuration JSON file
            </p>
            <button
              className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              onClick={handleExport}
              disabled={exporting || hasErrors || !hasData}
            >
              {exporting ? "Exporting..." : "Export Complete Package"}
            </button>
          </div>
          
          {/* Individual Exports */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">📁 Individual File Exports</h3>
            <p className="text-sm text-gray-600 mb-4">
              Download specific data files as needed
            </p>
            <div className="space-y-2">
              <button
                onClick={() => handleIndividualExport("clients")}
                disabled={!clients.length}
                className="w-full text-left px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm disabled:opacity-50"
              >
                Clients ({clients.length} records)
              </button>
              <button
                onClick={() => handleIndividualExport("workers")}
                disabled={!workers.length}
                className="w-full text-left px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm disabled:opacity-50"
              >
                Workers ({workers.length} records)
              </button>
              <button
                onClick={() => handleIndividualExport("tasks")}
                disabled={!tasks.length}
                className="w-full text-left px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm disabled:opacity-50"
              >
                Tasks ({tasks.length} records)
              </button>
              <button
                onClick={() => {
                  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                  const blob = new Blob([JSON.stringify(rules, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `business-rules-${timestamp}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                disabled={!rules.length}
                className="w-full text-left px-3 py-2 bg-orange-100 hover:bg-orange-200 rounded text-sm disabled:opacity-50"
              >
                Business Rules ({rules.length} rules)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Export Status */}
      {exportError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <span className="text-red-600 text-xl mr-2">⚠️</span>
            <span className="text-red-800">{exportError}</span>
          </div>
        </div>
      )}
      
      {exportSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <span className="text-green-600 text-xl mr-2">✅</span>
            <span className="text-green-800">{exportSuccess}</span>
          </div>
        </div>
      )}

      {/* Export Preview */}
      {hasData && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Export Preview</h2>
          
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div>
              <h3 className="font-semibold mb-2 text-blue-600">Clients</h3>
              <div className="text-sm text-gray-600 mb-2">
                {clients.length} client records with priorities and task requests
              </div>
              <div className="bg-blue-50 p-3 rounded text-xs">
                <pre className="whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(clients.slice(0, 2), null, 2)}
                  {clients.length > 2 && `\n... and ${clients.length - 2} more records`}
                </pre>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2 text-green-600">Workers</h3>
              <div className="text-sm text-gray-600 mb-2">
                {workers.length} worker records with skills and availability
              </div>
              <div className="bg-green-50 p-3 rounded text-xs">
                <pre className="whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(workers.slice(0, 2), null, 2)}
                  {workers.length > 2 && `\n... and ${workers.length - 2} more records`}
                </pre>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2 text-purple-600">Tasks</h3>
              <div className="text-sm text-gray-600 mb-2">
                {tasks.length} task records with requirements and constraints
              </div>
              <div className="bg-purple-50 p-3 rounded text-xs">
                <pre className="whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(tasks.slice(0, 2), null, 2)}
                  {tasks.length > 2 && `\n... and ${tasks.length - 2} more records`}
                </pre>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2 text-orange-600">Business Rules</h3>
              <div className="text-sm text-gray-600 mb-2">
                {rules.length} business rules with priorities and parameters
              </div>
              <div className="bg-orange-50 p-3 rounded text-xs">
                <pre className="whitespace-pre-wrap overflow-x-auto">
                  {rules.length > 0 ? (
                    JSON.stringify(rules.slice(0, 2), null, 2)
                  ) : "No business rules configured"}
                  {rules.length > 2 && `\n... and ${rules.length - 2} more rules`}
                </pre>
              </div>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            <p><strong>Note:</strong> The complete export package will include:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Individual CSV files for each data type</li>
              <li>A comprehensive JSON configuration file</li>
              <li>Business rules and prioritization settings</li>
              <li>Export metadata and validation status</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

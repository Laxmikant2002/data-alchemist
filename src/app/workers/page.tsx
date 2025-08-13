"use client";
import React, { useState } from "react";
import { DataGrid } from "../../components/DataGrid";
import { Worker, WorkerSchema } from "../../types/worker";
import { useData } from "../../lib/DataContext";
import {
  validateMissingColumns,
  validateDuplicates,
  validateMalformed,
  validateOverloaded,
  validatePhaseSlotSaturation,
  validateSkillCoverage,
  ValidationError,
} from "../../lib/validators";
import { ColumnDef } from "@tanstack/react-table";

const columns: ColumnDef<Worker, unknown>[] = [
  { id: "WorkerID", accessorKey: "WorkerID", header: "Worker ID" },
  { id: "WorkerName", accessorKey: "WorkerName", header: "Worker Name" },
  { id: "Skills", accessorKey: "Skills", header: "Skills" },
  { id: "AvailableSlots", accessorKey: "AvailableSlots", header: "Available Slots" },
  { id: "MaxLoadPerPhase", accessorKey: "MaxLoadPerPhase", header: "Max Load/Phase" },
  { id: "WorkerGroup", accessorKey: "WorkerGroup", header: "Worker Group" },
  { id: "QualificationLevel", accessorKey: "QualificationLevel", header: "Qualification Level" },
];

const WorkersPage: React.FC = () => {
  const { workers, tasks, setWorkers, errors, setErrors } = useData();

  const handleCellEdit = (rowIndex: number, columnId: string, value: string) => {
    const updated = [...workers];
    const worker = { ...updated[rowIndex] };
    
    switch (columnId) {
      case "WorkerID":
        worker.WorkerID = value;
        break;
      case "WorkerName":
        worker.WorkerName = value;
        break;
      case "Skills":
        worker.Skills = value.split(",").map((v) => v.trim()).filter(Boolean);
        break;
      case "AvailableSlots":
        try {
          // Try to parse as JSON first
          worker.AvailableSlots = JSON.parse(value);
        } catch {
          // Handle comma-separated format like "1,3,5"
          worker.AvailableSlots = value.split(",").map((v) => parseInt(v.trim(), 10)).filter((n) => !isNaN(n));
        }
        break;
      case "MaxLoadPerPhase":
        worker.MaxLoadPerPhase = Number(value);
        break;
      case "WorkerGroup":
        worker.WorkerGroup = value;
        break;
      case "QualificationLevel":
        worker.QualificationLevel = Number(value);
        break;
      default:
        break;
    }
    
    updated[rowIndex] = worker;
    setWorkers(updated);
    
    // Run validations and update errors context
    let allErrors: ValidationError[] = [];
    allErrors = allErrors.concat(validateMissingColumns(updated, ["WorkerID", "WorkerName", "Skills", "AvailableSlots", "MaxLoadPerPhase", "WorkerGroup", "QualificationLevel"]));
    allErrors = allErrors.concat(validateDuplicates(updated, "WorkerID"));
    allErrors = allErrors.concat(validateMalformed(updated, ["Skills", "AvailableSlots"], ["MaxLoadPerPhase", "QualificationLevel"]));
    allErrors = allErrors.concat(validateOverloaded(updated));
    allErrors = allErrors.concat(validatePhaseSlotSaturation(tasks, updated));
    allErrors = allErrors.concat(validateSkillCoverage(tasks, updated));
    setErrors(allErrors);
  };

  // Map errors to cell keys for highlighting
  const cellErrors: Record<string, boolean> = {};
  errors.forEach(err => {
    if (err.rowIndex !== undefined && err.columnId) {
      cellErrors[`${err.rowIndex}-${err.columnId}`] = true;
    }
  });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Workers Management</h1>
        <p className="text-gray-600">Manage worker skills, availability, and capacity constraints</p>
      </div>
      
      {workers.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👷</div>
          <h3 className="text-xl font-semibold mb-2">No Workers Data</h3>
          <p className="text-gray-600 mb-4">Upload a workers file to get started</p>
          <a href="/upload" className="text-blue-600 hover:underline">Go to Upload →</a>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <DataGrid 
              data={workers} 
              columns={columns} 
              onCellEdit={handleCellEdit} 
              errors={cellErrors} 
            />
          </div>
          
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Validation Summary</h2>
            {errors.length === 0 ? (
              <div className="text-green-600 bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">✅</span>
                  <span>No validation errors found. Your workers data is clean!</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-red-600 bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">⚠️</span>
                    <span className="font-semibold">Found {errors.length} validation error(s)</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
                    {errors.map((err, idx) => (
                      <li key={idx} className="text-sm">
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
        </>
      )}
    </div>
  );
};

export default WorkersPage;

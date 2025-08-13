"use client";
import React, { useState } from "react";
import { DataGrid } from "../../components/DataGrid";
import { Task, TaskSchema } from "../../types/task";
import { useData } from "../../lib/DataContext";
import {
  validateMissingColumns,
  validateDuplicates,
  validateMalformed,
  ValidationError,
} from "../../lib/validators";
import { ColumnDef } from "@tanstack/react-table";
import { 
  queryDataWithNaturalLanguage, 
  mockQueryDataWithNaturalLanguage,
  type AIResponse 
} from "../../lib/ai-service";

const columns: ColumnDef<Task, unknown>[] = [
  { id: "TaskID", accessorKey: "TaskID", header: "Task ID" },
  { id: "TaskName", accessorKey: "TaskName", header: "Task Name" },
  { id: "Category", accessorKey: "Category", header: "Category" },
  { id: "Duration", accessorKey: "Duration", header: "Duration (Phases)" },
  { id: "RequiredSkills", accessorKey: "RequiredSkills", header: "Required Skills" },
  { id: "PreferredPhases", accessorKey: "PreferredPhases", header: "Preferred Phases" },
  { id: "MaxConcurrent", accessorKey: "MaxConcurrent", header: "Max Concurrent" },
];

const TasksPage: React.FC = () => {
  const { tasks, workers, clients, setTasks, errors, setErrors } = useData();
  const [nlQuery, setNlQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [showQueryResults, setShowQueryResults] = useState(false);

  const handleCellEdit = (rowIndex: number, columnId: string, value: string) => {
    const updated = [...tasks];
    const task = { ...updated[rowIndex] };
    
    switch (columnId) {
      case "TaskID":
        task.TaskID = value;
        break;
      case "TaskName":
        task.TaskName = value;
        break;
      case "Category":
        task.Category = value;
        break;
      case "Duration":
        task.Duration = Number(value);
        break;
      case "RequiredSkills":
        task.RequiredSkills = value.split(",").map((v) => v.trim()).filter(Boolean);
        break;
      case "PreferredPhases":
        try {
          // Try to parse as JSON first
          task.PreferredPhases = JSON.parse(value);
        } catch {
          // Handle range syntax like "1-3" or comma-separated like "1,3,5"
          if (value.includes("-")) {
            const [start, end] = value.split("-").map(v => parseInt(v.trim(), 10));
            if (!isNaN(start) && !isNaN(end)) {
              const phases = [];
              for (let i = start; i <= end; i++) {
                phases.push(i);
              }
              task.PreferredPhases = phases;
            } else {
              task.PreferredPhases = [];
            }
          } else {
            task.PreferredPhases = value.split(",").map((v) => parseInt(v.trim(), 10)).filter((n) => !isNaN(n));
          }
        }
        break;
      case "MaxConcurrent":
        task.MaxConcurrent = Number(value);
        break;
      default:
        break;
    }
    
    updated[rowIndex] = task;
    setTasks(updated);
    
    // Run validations and update errors context
    let allErrors: ValidationError[] = [];
    allErrors = allErrors.concat(validateMissingColumns(updated, ["TaskID", "TaskName", "Category", "Duration", "RequiredSkills", "PreferredPhases", "MaxConcurrent"]));
    allErrors = allErrors.concat(validateDuplicates(updated, "TaskID"));
    allErrors = allErrors.concat(validateMalformed(updated, ["RequiredSkills", "PreferredPhases"], ["Duration", "MaxConcurrent"]));
    setErrors(allErrors);
  };

  // Natural language data query
  const handleAIQuery = async () => {
    if (!nlQuery.trim()) return;
    
    setAiLoading(true);
    setAiError(null);
    setShowQueryResults(false);
    
    try {
      let aiResponse: AIResponse;
      
      if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-api-key-here') {
        aiResponse = await queryDataWithNaturalLanguage(nlQuery, { tasks, workers, clients });
      } else {
        aiResponse = mockQueryDataWithNaturalLanguage(nlQuery);
      }
      
      if (aiResponse.success && aiResponse.data?.results) {
        setQueryResults(aiResponse.data.results);
        setShowQueryResults(true);
      } else {
        setAiError(aiResponse.error || "Could not process your query. Try being more specific.");
      }
    } catch (error) {
      setAiError("AI query failed. Please try again.");
      console.error("AI query error:", error);
    } finally {
      setAiLoading(false);
    }
  };

  // Map errors to cell keys for highlighting
  const cellErrors: Record<string, boolean> = {};
  errors.forEach(err => {
    if (err.rowIndex !== undefined && err.columnId) {
      cellErrors[`${err.rowIndex}-${err.columnId}`] = true;
    }
  });

  // Display data based on query results or all tasks
  const displayData = showQueryResults && queryResults.length > 0 ? queryResults : tasks;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tasks Management</h1>
        <p className="text-gray-600">Manage task definitions, skills, durations, and phase preferences</p>
      </div>

      {/* Natural Language Query */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-200 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">🔍 AI-Powered Data Query</h2>
        <p className="text-gray-600 mb-4">
          Ask questions about your tasks in plain English and get intelligent results.
        </p>
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={nlQuery}
            onChange={(e) => setNlQuery(e.target.value)}
            placeholder="e.g., Show all tasks with duration more than 2 phases, or Find tasks that require JavaScript skills"
            className="flex-1 border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && handleAIQuery()}
          />
          <button
            onClick={handleAIQuery}
            disabled={aiLoading || !nlQuery.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {aiLoading ? "Querying..." : "Ask AI"}
          </button>
        </div>
        
        {aiError && (
          <div className="text-red-600 bg-red-50 p-3 rounded-lg">
            ⚠️ {aiError}
          </div>
        )}
        
        {showQueryResults && queryResults.length > 0 && (
          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-blue-800">
                AI Query Results ({queryResults.length} tasks found)
              </h3>
              <button
                onClick={() => {
                  setShowQueryResults(false);
                  setQueryResults([]);
                  setNlQuery("");
                }}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Show All Tasks
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Query: "{nlQuery}"
            </p>
          </div>
        )}
        
        {(!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-api-key-here') && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              <strong>Note:</strong> OpenAI API key not configured. Using mock AI responses for demonstration.
              To enable real AI features, add your OpenAI API key to the environment variables.
            </p>
          </div>
        )}
        
        <div className="text-sm text-gray-600">
          <p className="mb-2">💡 <strong>Example Queries:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>"Show all development tasks"</li>
            <li>"Find tasks with duration greater than 2 phases"</li>
            <li>"Tasks that require Python skills"</li>
            <li>"High-priority tasks for phase 1"</li>
            <li>"Tasks that can run concurrently"</li>
          </ul>
        </div>
      </div>
      
      {tasks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold mb-2">No Tasks Data</h3>
          <p className="text-gray-600 mb-4">Upload a tasks file to get started</p>
          <a href="/upload" className="text-blue-600 hover:underline">Go to Upload →</a>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <DataGrid 
              data={displayData} 
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
                  <span>No validation errors found. Your tasks data is clean!</span>
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

export default TasksPage;

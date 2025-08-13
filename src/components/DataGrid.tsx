"use client";
import React, { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { ColumnDef } from "@tanstack/react-table";

export interface DataGridProps<T extends object> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  onCellEdit?: (rowIndex: number, columnId: string, value: string) => void;
  errors?: Record<string, boolean>;
  errorDetails?: Record<string, { severity: "error" | "warning" | "info"; message: string; suggestion?: string }>;
}

export function DataGrid<T extends object>({ 
  data, 
  columns, 
  onCellEdit, 
  errors = {},
  errorDetails = {}
}: DataGridProps<T>) {
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; columnId: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  });

  const handleCellClick = (rowIndex: number, columnId: string, currentValue: any) => {
    if (!onCellEdit) return;
    setEditingCell({ rowIndex, columnId });
    setEditValue(String(currentValue || ""));
  };

  const handleCellSave = () => {
    if (!editingCell || !onCellEdit) return;
    onCellEdit(editingCell.rowIndex, editingCell.columnId, editValue);
    setEditingCell(null);
    setEditValue("");
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCellSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCellCancel();
    }
  };

  const formatCellValue = (value: any): string => {
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    if (typeof value === "object" && value !== null) {
      return JSON.stringify(value);
    }
    return String(value || "");
  };

  const getErrorSeverity = (rowIndex: number, columnId: string) => {
    const cellKey = `${rowIndex}-${columnId}`;
    return errorDetails[cellKey]?.severity || "error";
  };

  const getErrorTooltip = (rowIndex: number, columnId: string) => {
    const cellKey = `${rowIndex}-${columnId}`;
    const error = errorDetails[cellKey];
    if (!error) return "";
    
    let tooltip = error.message;
    if (error.suggestion) {
      tooltip += `\n\n💡 Suggestion: ${error.suggestion}`;
    }
    return tooltip;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center space-x-1">
                    <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                    {header.column.getCanSort() && (
                      <span className="text-gray-400">
                        {header.column.getIsSorted() === "asc" ? "↑" : 
                         header.column.getIsSorted() === "desc" ? "↓" : "↕"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {table.getRowModel().rows.map((row, rowIndex) => (
            <tr key={row.id} className="hover:bg-gray-50">
              {row.getVisibleCells().map((cell) => {
                const columnId = cell.column.id as string;
                const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.columnId === columnId;
                const hasError = errors[`${rowIndex}-${columnId}`];
                const errorSeverity = hasError ? getErrorSeverity(rowIndex, columnId) : null;
                const errorTooltip = hasError ? getErrorTooltip(rowIndex, columnId) : "";
                
                return (
                  <td
                    key={cell.id}
                    className={`px-6 py-4 whitespace-nowrap text-sm ${
                      hasError 
                        ? errorSeverity === "error" 
                          ? "bg-red-50 border-l-4 border-red-400" 
                          : errorSeverity === "warning"
                          ? "bg-yellow-50 border-l-4 border-yellow-400"
                          : "bg-blue-50 border-l-4 border-blue-400"
                        : ""
                    } ${onCellEdit ? "cursor-pointer hover:bg-gray-100" : ""}`}
                    onClick={() => onCellEdit && handleCellClick(rowIndex, columnId, cell.getValue())}
                    title={errorTooltip}
                  >
                    {isEditing ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                        <button
                          onClick={handleCellSave}
                          className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                        >
                          ✓
                        </button>
                        <button
                          onClick={handleCellCancel}
                          className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className={hasError ? "font-medium" : ""}>
                          {formatCellValue(cell.getValue())}
                        </span>
                        {hasError && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            errorSeverity === "error" 
                              ? "bg-red-100 text-red-800" 
                              : errorSeverity === "warning"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                          }`}>
                            {errorSeverity === "error" ? "⚠️" : 
                             errorSeverity === "warning" ? "⚡" : "ℹ️"}
                          </span>
                        )}
                        {onCellEdit && (
                          <span className="text-gray-400 text-xs opacity-0 group-hover:opacity-100">
                            Click to edit
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      
      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📊</div>
          <p>No data to display</p>
        </div>
      )}
    </div>
  );
}

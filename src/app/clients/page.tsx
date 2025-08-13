"use client";
import React from "react";
import { DataGrid } from "../../components/DataGrid";
import { Client, ClientSchema } from "../../types/client";
import { useData } from "../../lib/DataContext";
import {
  validateMissingColumns,
  validateDuplicates,
  validateMalformed,
  validateOutOfRange,
  validateBrokenJSON,
  validateUnknownRefs,
  ValidationError,
} from "../../lib/validators";
import { ColumnDef } from "@tanstack/react-table";



const columns: ColumnDef<Client, unknown>[] = [
  { id: "ClientID", accessorKey: "ClientID", header: "Client ID" },
  { id: "ClientName", accessorKey: "ClientName", header: "Client Name" },
  { id: "PriorityLevel", accessorKey: "PriorityLevel", header: "Priority Level" },
  { id: "RequestedTaskIDs", accessorKey: "RequestedTaskIDs", header: "Requested Task IDs" },
  { id: "GroupTag", accessorKey: "GroupTag", header: "Group Tag" },
  { id: "AttributesJSON", accessorKey: "AttributesJSON", header: "Attributes JSON" },
];

const ClientsPage: React.FC = () => {
  const { clients, workers, tasks, setClients, errors, setErrors } = useData();

  const handleCellEdit = (rowIndex: number, columnId: string, value: string) => {
    const updated = [...clients];
    const client = { ...updated[rowIndex] };
    switch (columnId) {
      case "PriorityLevel":
        client.PriorityLevel = Number(value);
        break;
      case "RequestedTaskIDs":
        client.RequestedTaskIDs = value.split(",").map((v) => v.trim());
        break;
      case "AttributesJSON":
        try {
          client.AttributesJSON = JSON.parse(value);
        } catch {
          client.AttributesJSON = {};
        }
        break;
      case "ClientID":
        client.ClientID = value;
        break;
      case "ClientName":
        client.ClientName = value;
        break;
      case "GroupTag":
        client.GroupTag = value;
        break;
      default:
        break;
    }
    updated[rowIndex] = client;
    setClients(updated);
    // Run all validations and update errors context
    let allErrors: ValidationError[] = [];
    allErrors = allErrors.concat(validateMissingColumns(updated, ["ClientID", "ClientName", "PriorityLevel", "RequestedTaskIDs", "GroupTag", "AttributesJSON"]));
    allErrors = allErrors.concat(validateDuplicates(updated, "ClientID"));
    allErrors = allErrors.concat(validateMalformed(updated, ["RequestedTaskIDs"], ["PriorityLevel"]));
    allErrors = allErrors.concat(validateOutOfRange(updated));
    allErrors = allErrors.concat(validateBrokenJSON(updated));
    allErrors = allErrors.concat(validateUnknownRefs(updated, tasks));
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
      <h1 className="text-xl font-bold mb-4">Clients</h1>
      <DataGrid data={clients} columns={columns} onCellEdit={handleCellEdit} errors={cellErrors} />
      <div className="mt-8">
        <h2 className="font-bold mb-2">Validation Summary</h2>
        {errors.length === 0 ? (
          <div className="text-green-600">No validation errors found.</div>
        ) : (
          <ul className="list-disc pl-5 text-red-600">
            {errors.map((err, idx) => (
              <li key={idx}>
                {err.message}
                {err.rowIndex !== undefined ? ` (Row ${err.rowIndex + 1})` : ""}
                {err.columnId ? ` [${err.columnId}]` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ClientsPage;

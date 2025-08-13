"use client";
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Client } from "../types/client";
import { Worker } from "../types/worker";
import { Task } from "../types/task";
import { ValidationError } from "./validators";

interface DataState {
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
  rules: any[]; // Business rules from rules page
  errors: ValidationError[];
}

interface DataContextType extends DataState {
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  setWorkers: React.Dispatch<React.SetStateAction<Worker[]>>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setRules: React.Dispatch<React.SetStateAction<any[]>>;
  setErrors: React.Dispatch<React.SetStateAction<ValidationError[]>>;
  addRule: (rule: any) => void;
  removeRule: (index: number) => void;
  clearData: () => void;
  loadSampleData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  // Load data from localStorage on initialization
  const [clients, setClients] = useState<Client[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('data-alchemist-clients');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  
  const [workers, setWorkers] = useState<Worker[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('data-alchemist-workers');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('data-alchemist-tasks');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  
  const [rules, setRules] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('data-alchemist-rules');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const addRule = (rule: any) => {
    setRules(prev => [...prev, rule]);
  };

  const removeRule = (index: number) => {
    setRules(prev => prev.filter((_, i) => i !== index));
  };

  const clearData = () => {
    setClients([]);
    setWorkers([]);
    setTasks([]);
    setRules([]);
    setErrors([]);
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('data-alchemist-clients');
      localStorage.removeItem('data-alchemist-workers');
      localStorage.removeItem('data-alchemist-tasks');
      localStorage.removeItem('data-alchemist-rules');
    }
  };

  // Load sample data for testing
  const loadSampleData = () => {
    const sampleClients: Client[] = [
      {
        ClientID: "C001",
        ClientName: "Acme Corporation",
        PriorityLevel: 1,
        RequestedTaskIDs: ["T001", "T002", "T003"],
        GroupTag: "Enterprise",
        AttributesJSON: {"industry": "Technology", "budget": "high", "timeline": "urgent"}
      },
      {
        ClientID: "C002",
        ClientName: "Global Solutions",
        PriorityLevel: 2,
        RequestedTaskIDs: ["T004", "T005"],
        GroupTag: "Mid-Market",
        AttributesJSON: {"industry": "Consulting", "budget": "medium", "timeline": "flexible"}
      },
      {
        ClientID: "C003",
        ClientName: "Startup Ventures",
        PriorityLevel: 3,
        RequestedTaskIDs: ["T006"],
        GroupTag: "Startup",
        AttributesJSON: {"industry": "Finance", "budget": "low", "timeline": "moderate"}
      }
    ];

    const sampleWorkers: Worker[] = [
      {
        WorkerID: "W001",
        WorkerName: "John Smith",
        Skills: ["JavaScript", "React", "Node.js"],
        AvailableSlots: [1, 2, 3, 4, 5],
        MaxLoadPerPhase: 2,
        WorkerGroup: "Senior",
        QualificationLevel: 5
      },
      {
        WorkerID: "W002",
        WorkerName: "Sarah Johnson",
        Skills: ["Python", "Data Analysis", "Machine Learning"],
        AvailableSlots: [2, 3, 4, 5, 6],
        MaxLoadPerPhase: 1,
        WorkerGroup: "Expert",
        QualificationLevel: 5
      },
      {
        WorkerID: "W003",
        WorkerName: "Mike Chen",
        Skills: ["Java", "Spring", "Database"],
        AvailableSlots: [1, 2, 3, 4],
        MaxLoadPerPhase: 2,
        WorkerGroup: "Mid-Level",
        QualificationLevel: 3
      },
      {
        WorkerID: "W004",
        WorkerName: "Emily Davis",
        Skills: ["UI/UX", "Figma", "CSS"],
        AvailableSlots: [3, 4, 5, 6],
        MaxLoadPerPhase: 1,
        WorkerGroup: "Designer",
        QualificationLevel: 4
      }
    ];

    const sampleTasks: Task[] = [
      {
        TaskID: "T001",
        TaskName: "Frontend Development",
        Category: "Development",
        Duration: 3,
        RequiredSkills: ["JavaScript", "React"],
        PreferredPhases: [1, 2, 3],
        MaxConcurrent: 2
      },
      {
        TaskID: "T002",
        TaskName: "Backend API",
        Category: "Development",
        Duration: 4,
        RequiredSkills: ["Node.js", "Database"],
        PreferredPhases: [2, 3, 4, 5],
        MaxConcurrent: 1
      },
      {
        TaskID: "T003",
        TaskName: "Data Analysis",
        Category: "Analytics",
        Duration: 2,
        RequiredSkills: ["Python", "Data Analysis"],
        PreferredPhases: [4, 5],
        MaxConcurrent: 1
      },
      {
        TaskID: "T004",
        TaskName: "UI Design",
        Category: "Design",
        Duration: 2,
        RequiredSkills: ["UI/UX", "Figma"],
        PreferredPhases: [1, 2],
        MaxConcurrent: 1
      },
      {
        TaskID: "T005",
        TaskName: "Testing & QA",
        Category: "Quality Assurance",
        Duration: 3,
        RequiredSkills: ["Testing", "Quality Assurance"],
        PreferredPhases: [5, 6, 7],
        MaxConcurrent: 2
      },
      {
        TaskID: "T006",
        TaskName: "Documentation",
        Category: "Documentation",
        Duration: 1,
        RequiredSkills: ["Documentation", "Technical Writing"],
        PreferredPhases: [6, 7],
        MaxConcurrent: 1
      }
    ];

    setClients(sampleClients);
    setWorkers(sampleWorkers);
    setTasks(sampleTasks);
  };

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('data-alchemist-clients', JSON.stringify(clients));
    }
  }, [clients]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('data-alchemist-workers', JSON.stringify(workers));
    }
  }, [workers]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('data-alchemist-tasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('data-alchemist-rules', JSON.stringify(rules));
    }
  }, [rules]);

  const value: DataContextType = {
    clients,
    workers,
    tasks,
    rules,
    errors,
    setClients,
    setWorkers,
    setTasks,
    setRules,
    setErrors,
    addRule,
    removeRule,
    clearData,
    loadSampleData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}

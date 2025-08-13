import { Client, ClientSchema } from "../types/client";
import { Worker, WorkerSchema } from "../types/worker";
import { Task, TaskSchema } from "../types/task";

export interface ValidationError {
  type: string;
  message: string;
  rowIndex?: number;
  columnId?: string;
  severity: "error" | "warning" | "info";
  suggestion?: string;
}

// Core validation functions
export function validateMissingColumns<T extends object>(
  data: T[],
  requiredColumns: string[]
): ValidationError[] {
  if (data.length === 0) return [];
  
  const errors: ValidationError[] = [];
  const firstRow = data[0] as any;
  
  requiredColumns.forEach(column => {
    if (!(column in firstRow)) {
      errors.push({
        type: "missing_column",
        message: `Missing required column: ${column}`,
        severity: "error"
      });
    }
  });
  
  return errors;
}

export function validateDuplicates<T extends object>(
  data: T[],
  idColumn: string
): ValidationError[] {
  const errors: ValidationError[] = [];
  const seen = new Set();
  
  data.forEach((row, index) => {
    const id = (row as any)[idColumn];
    if (seen.has(id)) {
      errors.push({
        type: "duplicate_id",
        message: `Duplicate ${idColumn}: ${id}`,
        rowIndex: index,
        columnId: idColumn,
        severity: "error",
        suggestion: `Ensure each ${idColumn} is unique`
      });
    } else {
      seen.add(id);
    }
  });
  
  return errors;
}

export function validateMalformed<T extends object>(
  data: T[],
  arrayColumns: string[],
  numericColumns: string[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  data.forEach((row, index) => {
    // Check array columns
    arrayColumns.forEach(column => {
      const value = (row as any)[column];
      if (value && !Array.isArray(value)) {
        errors.push({
          type: "malformed_array",
          message: `Column ${column} should be an array, got: ${typeof value}`,
          rowIndex: index,
          columnId: column,
          severity: "error",
          suggestion: `Convert to array format: [value1, value2, ...]`
        });
      }
    });
    
    // Check numeric columns
    numericColumns.forEach(column => {
      const value = (row as any)[column];
      if (value !== undefined && (typeof value !== 'number' || isNaN(value))) {
        errors.push({
          type: "malformed_number",
          message: `Column ${column} should be a number, got: ${value}`,
          rowIndex: index,
          columnId: column,
          severity: "error",
          suggestion: `Enter a valid number`
        });
      }
    });
  });
  
  return errors;
}

export function validateOutOfRange(clients: Client[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  clients.forEach((client, index) => {
    if (client.PriorityLevel < 1 || client.PriorityLevel > 5) {
      errors.push({
        type: "out_of_range",
        message: `PriorityLevel must be between 1-5, got: ${client.PriorityLevel}`,
        rowIndex: index,
        columnId: "PriorityLevel",
        severity: "error",
        suggestion: "Set PriorityLevel to a value between 1 and 5"
      });
    }
  });
  
  return errors;
}

export function validateBrokenJSON(clients: Client[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  clients.forEach((client, index) => {
    try {
      if (client.AttributesJSON && typeof client.AttributesJSON === 'string') {
        JSON.parse(client.AttributesJSON);
      }
    } catch {
      errors.push({
        type: "broken_json",
        message: `Invalid JSON in AttributesJSON: ${client.AttributesJSON}`,
        rowIndex: index,
        columnId: "AttributesJSON",
        severity: "error",
        suggestion: "Fix JSON syntax or use valid JSON object"
      });
    }
  });
  
  return errors;
}

export function validateUnknownRefs(clients: Client[], tasks: Task[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const validTaskIDs = new Set(tasks.map(t => t.TaskID));
  
  clients.forEach((client, index) => {
    client.RequestedTaskIDs.forEach(taskID => {
      if (!validTaskIDs.has(taskID)) {
        errors.push({
          type: "unknown_reference",
          message: `Client references unknown task: ${taskID}`,
          rowIndex: index,
          columnId: "RequestedTaskIDs",
          severity: "error",
          suggestion: `Remove ${taskID} or ensure task exists in tasks data`
        });
      }
    });
  });
  
  return errors;
}

export function validateCircularCoRuns(tasks: Task[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Enhanced circular dependency detection for co-run rules
  // This would check against business rules from the rules context
  // For now, we'll implement a basic check that can be enhanced later
  
  // Build dependency graph (placeholder for co-run rules)
  const taskGraph = new Map<string, string[]>();
  
  // In a real implementation, this would check against business rules
  // and detect circular dependencies like A→B→C→A
  
  return errors;
}

// Enhanced circular dependency detection
export function detectCircularDependencies(
  rules: any[],
  tasks: Task[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Build dependency graph from co-run rules
  const dependencyGraph = new Map<string, Set<string>>();
  
  rules.forEach(rule => {
    if (rule.type === 'coRun' && rule.tasks && Array.isArray(rule.tasks)) {
      rule.tasks.forEach((taskId: string) => {
        if (!dependencyGraph.has(taskId)) {
          dependencyGraph.set(taskId, new Set());
        }
        rule.tasks.forEach((dependentTaskId: string) => {
          if (taskId !== dependentTaskId) {
            dependencyGraph.get(taskId)!.add(dependentTaskId);
          }
        });
      });
    }
  });
  
  // Detect cycles using DFS with cycle detection
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  function hasCycle(taskId: string): boolean {
    if (recursionStack.has(taskId)) {
      return true; // Found a cycle
    }
    
    if (visited.has(taskId)) {
      return false; // Already processed
    }
    
    visited.add(taskId);
    recursionStack.add(taskId);
    
    const dependencies = dependencyGraph.get(taskId) || new Set();
    for (const dependency of dependencies) {
      if (hasCycle(dependency)) {
        return true;
      }
    }
    
    recursionStack.delete(taskId);
    return false;
  }
  
  // Check for cycles in all tasks
  for (const taskId of dependencyGraph.keys()) {
    if (hasCycle(taskId)) {
      errors.push({
        type: "circular_dependency",
        message: `Circular dependency detected involving task: ${taskId}`,
        severity: "error",
        suggestion: "Review co-run rules to eliminate circular dependencies"
      });
    }
  }
  
  return errors;
}

// Enhanced cross-entity validation
export function validateCrossEntityRelationships(
  clients: Client[],
  workers: Worker[],
  tasks: Task[],
  rules: any[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Check client-task-worker skill coverage
  clients.forEach((client, clientIndex) => {
    client.RequestedTaskIDs.forEach(taskID => {
      const task = tasks.find(t => t.TaskID === taskID);
      if (task) {
        // Check if any worker has the required skills for this task
        const qualifiedWorkers = workers.filter(worker => 
          worker.Skills && Array.isArray(worker.Skills) &&
          task.RequiredSkills && Array.isArray(task.RequiredSkills) &&
          task.RequiredSkills.some(skill => worker.Skills!.includes(skill))
        );
        
        if (qualifiedWorkers.length === 0) {
          errors.push({
            type: "skill_coverage_gap",
            message: `Client ${client.ClientID} requests task ${taskID} but no workers have required skills: ${task.RequiredSkills?.join(', ')}`,
            rowIndex: clientIndex,
            columnId: "RequestedTaskIDs",
            severity: "error",
            suggestion: `Add workers with skills: ${task.RequiredSkills?.join(', ')} or modify task requirements`
          });
        }
      }
    });
  });
  
  // Check worker availability vs task phase requirements
  tasks.forEach((task, taskIndex) => {
    if (task.PreferredPhases && Array.isArray(task.PreferredPhases)) {
      const availableWorkersInPhases = new Map<number, number>();
      
      workers.forEach(worker => {
        if (worker.AvailableSlots && Array.isArray(worker.AvailableSlots)) {
          worker.AvailableSlots.forEach(phase => {
            availableWorkersInPhases.set(phase, (availableWorkersInPhases.get(phase) || 0) + 1);
          });
        }
      });
      
      const unavailablePhases = task.PreferredPhases.filter(phase => 
        !availableWorkersInPhases.has(phase) || availableWorkersInPhases.get(phase)! < task.MaxConcurrent
      );
      
      if (unavailablePhases.length > 0) {
        errors.push({
          type: "phase_availability_mismatch",
          message: `Task ${task.TaskID} prefers phases ${unavailablePhases.join(', ')} but insufficient workers available`,
          rowIndex: taskIndex,
          columnId: "PreferredPhases",
          severity: "warning",
          suggestion: `Adjust preferred phases or add more workers for phases: ${unavailablePhases.join(', ')}`
        });
      }
    }
  });
  
  // Check business rule conflicts
  rules.forEach((rule, ruleIndex) => {
    if (rule.type === 'phaseWindow' && rule.phases && Array.isArray(rule.phases)) {
      const task = tasks.find(t => t.TaskID === rule.task);
      if (task && task.PreferredPhases && Array.isArray(task.PreferredPhases)) {
        const hasConflict = !task.PreferredPhases.some(phase => rule.phases.includes(phase));
        if (hasConflict) {
          errors.push({
            type: "rule_conflict",
            message: `Phase window rule conflicts with task ${rule.task} preferred phases`,
            severity: "warning",
            suggestion: `Adjust phase window rule or task preferred phases to resolve conflict`
          });
        }
      }
    }
    
    // Check load limit rules against actual worker capacity
    if (rule.type === 'loadLimit' && rule.workerGroup && rule.maxSlotsPerPhase) {
      const groupWorkers = workers.filter(w => w.WorkerGroup === rule.workerGroup);
      const totalGroupCapacity = groupWorkers.reduce((sum, w) => sum + w.MaxLoadPerPhase, 0);
      
      if (totalGroupCapacity < rule.maxSlotsPerPhase) {
        errors.push({
          type: "rule_capacity_mismatch",
          message: `Load limit rule for group ${rule.workerGroup} exceeds actual worker capacity`,
          severity: "warning",
          suggestion: `Reduce maxSlotsPerPhase to ${totalGroupCapacity} or add more workers to group`
        });
      }
    }
  });
  
  return errors;
}

export function validatePhaseWindowConstraints(tasks: Task[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  tasks.forEach((task, index) => {
    if (task.PreferredPhases && Array.isArray(task.PreferredPhases)) {
      const invalidPhases = task.PreferredPhases.filter(phase => 
        typeof phase !== 'number' || phase < 1 || phase > 10
      );
      
      if (invalidPhases.length > 0) {
        errors.push({
          type: "invalid_phase",
          message: `Invalid phases in PreferredPhases: ${invalidPhases.join(', ')}`,
          rowIndex: index,
          columnId: "PreferredPhases",
          severity: "error",
          suggestion: "Phases must be numbers between 1 and 10"
        });
      }
    }
  });
  
  return errors;
}

export function validateOverloaded(workers: Worker[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  workers.forEach((worker, index) => {
    if (worker.AvailableSlots && Array.isArray(worker.AvailableSlots)) {
      if (worker.AvailableSlots.length < worker.MaxLoadPerPhase) {
        errors.push({
          type: "overloaded_worker",
          message: `Worker ${worker.WorkerID} has ${worker.AvailableSlots.length} available slots but MaxLoadPerPhase is ${worker.MaxLoadPerPhase}`,
          rowIndex: index,
          columnId: "MaxLoadPerPhase",
          severity: "warning",
          suggestion: `Increase AvailableSlots or decrease MaxLoadPerPhase to ${worker.AvailableSlots.length}`
        });
      }
    }
  });
  
  return errors;
}

export function validatePhaseSlotSaturation(tasks: Task[], workers: Worker[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Calculate total worker capacity per phase
  const phaseCapacity = new Map<number, number>();
  workers.forEach(worker => {
    if (worker.AvailableSlots && Array.isArray(worker.AvailableSlots)) {
      worker.AvailableSlots.forEach(phase => {
        phaseCapacity.set(phase, (phaseCapacity.get(phase) || 0) + worker.MaxLoadPerPhase);
      });
    }
  });
  
  // Calculate total task demand per phase
  const phaseDemand = new Map<number, number>();
  tasks.forEach(task => {
    if (task.PreferredPhases && Array.isArray(task.PreferredPhases)) {
      task.PreferredPhases.forEach(phase => {
        phaseDemand.set(phase, (phaseDemand.get(phase) || 0) + task.Duration);
      });
    }
  });
  
  // Check for saturation
  phaseDemand.forEach((demand, phase) => {
    const capacity = phaseCapacity.get(phase) || 0;
    if (demand > capacity) {
      errors.push({
        type: "phase_saturation",
        message: `Phase ${phase} is oversaturated: demand ${demand}, capacity ${capacity}`,
        severity: "warning",
        suggestion: `Add more workers for phase ${phase} or reduce task durations`
      });
    }
  });
  
  return errors;
}

export function validateSkillCoverage(tasks: Task[], workers: Worker[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Get all available skills from workers
  const availableSkills = new Set<string>();
  workers.forEach(worker => {
    if (worker.Skills && Array.isArray(worker.Skills)) {
      worker.Skills.forEach(skill => availableSkills.add(skill));
    }
  });
  
  // Check if each task's required skills are covered
  tasks.forEach((task, index) => {
    if (task.RequiredSkills && Array.isArray(task.RequiredSkills)) {
      const uncoveredSkills = task.RequiredSkills.filter(skill => !availableSkills.has(skill));
      
      if (uncoveredSkills.length > 0) {
        errors.push({
          type: "skill_coverage",
          message: `Task ${task.TaskID} requires skills not available: ${uncoveredSkills.join(', ')}`,
          rowIndex: index,
          columnId: "RequiredSkills",
          severity: "error",
          suggestion: `Add workers with skills: ${uncoveredSkills.join(', ')} or modify required skills`
        });
      }
    }
  });
  
  return errors;
}

export function validateMaxConcurrency(tasks: Task[], workers: Worker[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  tasks.forEach((task, index) => {
    if (task.MaxConcurrent && task.RequiredSkills && Array.isArray(task.RequiredSkills)) {
      // Count workers with required skills
      const qualifiedWorkers = workers.filter(worker => 
        worker.Skills && Array.isArray(worker.Skills) &&
        task.RequiredSkills!.some(skill => worker.Skills!.includes(skill))
      );
      
      if (qualifiedWorkers.length < task.MaxConcurrent) {
        errors.push({
          type: "max_concurrency",
          message: `Task ${task.TaskID} MaxConcurrent (${task.MaxConcurrent}) exceeds qualified workers (${qualifiedWorkers.length})`,
          rowIndex: index,
          columnId: "MaxConcurrent",
          severity: "warning",
          suggestion: `Reduce MaxConcurrent to ${qualifiedWorkers.length} or add more qualified workers`
        });
      }
    }
  });
  
  return errors;
}

export function validateConflictingRules(
  tasks: Task[],
  rules: any[] // Business rules from rules page
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // This would check for conflicts between business rules and task constraints
  // For now, we'll implement basic phase window vs. preferred phases validation
  
  rules.forEach((rule, ruleIndex) => {
    if (rule.type === 'phaseWindow' && rule.phases && Array.isArray(rule.phases)) {
      const task = tasks.find(t => t.TaskID === rule.task);
      if (task && task.PreferredPhases && Array.isArray(task.PreferredPhases)) {
        const hasConflict = !task.PreferredPhases.some(phase => rule.phases.includes(phase));
        if (hasConflict) {
          errors.push({
            type: "rule_conflict",
            message: `Phase window rule conflicts with task ${rule.task} preferred phases`,
            severity: "warning",
            suggestion: `Adjust phase window rule or task preferred phases to resolve conflict`
          });
        }
      }
    }
  });
  
  return errors;
}

// Enhanced validation function that includes new validations
export function runAllValidations(
  clients: Client[],
  workers: Worker[],
  tasks: Task[],
  rules: any[] = []
): ValidationError[] {
  let allErrors: ValidationError[] = [];

  // Core validations
  allErrors = allErrors.concat(validateMissingColumns(clients, ["ClientID", "ClientName", "PriorityLevel", "RequestedTaskIDs", "GroupTag", "AttributesJSON"]));
  allErrors = allErrors.concat(validateMissingColumns(workers, ["WorkerID", "WorkerName", "Skills", "AvailableSlots", "MaxLoadPerPhase", "WorkerGroup", "QualificationLevel"]));
  allErrors = allErrors.concat(validateMissingColumns(tasks, ["TaskID", "TaskName", "Category", "Duration", "RequiredSkills", "PreferredPhases", "MaxConcurrent"]));

  // Duplicate validations
  allErrors = allErrors.concat(validateDuplicates(clients, "ClientID"));
  allErrors = allErrors.concat(validateDuplicates(workers, "WorkerID"));
  allErrors = allErrors.concat(validateDuplicates(tasks, "TaskID"));

  // Data type validations
  allErrors = allErrors.concat(validateMalformed(clients, ["RequestedTaskIDs"], ["PriorityLevel"]));
  allErrors = allErrors.concat(validateMalformed(workers, ["Skills", "AvailableSlots"], ["MaxLoadPerPhase", "QualificationLevel"]));
  allErrors = allErrors.concat(validateMalformed(tasks, ["RequiredSkills", "PreferredPhases"], ["Duration", "MaxConcurrent"]));

  // Business logic validations
  allErrors = allErrors.concat(validateOutOfRange(clients));
  allErrors = allErrors.concat(validateBrokenJSON(clients));
  allErrors = allErrors.concat(validateUnknownRefs(clients, tasks));
  allErrors = allErrors.concat(validateCircularCoRuns(tasks));
  allErrors = allErrors.concat(validatePhaseWindowConstraints(tasks));
  allErrors = allErrors.concat(validateOverloaded(workers));
  allErrors = allErrors.concat(validatePhaseSlotSaturation(tasks, workers));
  allErrors = allErrors.concat(validateSkillCoverage(tasks, workers));
  allErrors = allErrors.concat(validateMaxConcurrency(tasks, workers));
  allErrors = allErrors.concat(validateConflictingRules(tasks, rules));

  // Enhanced validations
  allErrors = allErrors.concat(detectCircularDependencies(rules, tasks));
  allErrors = allErrors.concat(validateCrossEntityRelationships(clients, workers, tasks, rules));

  return allErrors;
}

// Real-time validation for specific entity changes
export function validateEntityChange<T extends object>(
  entity: T,
  entityType: 'client' | 'worker' | 'task',
  allData: { clients: Client[]; workers: Worker[]; tasks: Task[]; rules: any[] }
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  switch (entityType) {
    case 'client':
      errors.push(...validateOutOfRange([entity as Client]));
      errors.push(...validateBrokenJSON([entity as Client]));
      errors.push(...validateUnknownRefs([entity as Client], allData.tasks));
      break;
    case 'worker':
      errors.push(...validateOverloaded([entity as Worker]));
      break;
    case 'task':
      errors.push(...validatePhaseWindowConstraints([entity as Task]));
      break;
  }
  
  // Cross-entity validations
  if (entityType === 'task') {
    errors.push(...validateSkillCoverage([entity as Task], allData.workers));
    errors.push(...validateMaxConcurrency([entity as Task], allData.workers));
  }
  
  if (entityType === 'worker') {
    errors.push(...validatePhaseSlotSaturation(allData.tasks, [entity as Worker]));
  }
  
  return errors;
}

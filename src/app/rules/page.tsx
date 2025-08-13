"use client";
import React, { useState } from "react";
import { useData } from "../../lib/DataContext";

// Rule types
const RULE_TYPES = [
  { value: "coRun", label: "Co-run" },
  { value: "phaseWindow", label: "Phase Window" },
];

type CoRunRule = { type: "coRun"; tasks: string[] };
type PhaseWindowRule = { type: "phaseWindow"; task: string; phases: number[] };
type Rule = CoRunRule | PhaseWindowRule;

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [nlInput, setNlInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const { tasks } = useData();
  const [type, setType] = useState("coRun");
  const [coRunTasks, setCoRunTasks] = useState<string[]>([]);
  const [phaseTask, setPhaseTask] = useState("");
  const [phaseStart, setPhaseStart] = useState(1);
  const [phaseEnd, setPhaseEnd] = useState(1);

  // Add rule
  const handleAddRule = () => {
    if (type === "coRun") {
      setRules([...rules, { type: "coRun", tasks: coRunTasks }]);
      setCoRunTasks([]);
    } else if (type === "phaseWindow") {
      const phases = [];
      for (let i = phaseStart; i <= phaseEnd; i++) phases.push(i);
      setRules([...rules, { type: "phaseWindow", task: phaseTask, phases }]);
      setPhaseTask("");
      setPhaseStart(1);
      setPhaseEnd(1);
    }
  };

  // AI Convert natural language to rule
  const handleAIConvert = async () => {
    if (!nlInput.trim()) return;
    
    setAiLoading(true);
    setAiError(null);
    
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateRule',
          description: nlInput,
          dataContext: { tasks, rules }
        }),
      });

      if (!response.ok) {
        throw new Error(`AI service failed: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        const aiRule = result.data;
        
        // Convert AI rule to our format
        let newRule: Rule | null = null;
        
        if (aiRule.type === 'coRun' && aiRule.parameters?.tasks) {
          newRule = { type: "coRun", tasks: aiRule.parameters.tasks };
        } else if (aiRule.type === 'phaseWindow' && aiRule.parameters?.task && aiRule.parameters?.phases) {
          newRule = { type: "phaseWindow", task: aiRule.parameters.task, phases: aiRule.parameters.phases };
        }
        
        if (newRule) {
          setRules([...rules, newRule]);
          setNlInput("");
        } else {
          setAiError('Could not convert AI rule to supported format');
        }
      } else {
        setAiError('Failed to generate rule from description');
      }
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'AI conversion failed');
    } finally {
      setAiLoading(false);
    }
  };

  // Download rules.json
  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(rules, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rules.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Rule Input</h1>
      <div className="mb-4">
        <label className="block font-semibold mb-1">Natural Language to Rule</label>
        <div className="flex gap-2 mb-2">
          <input
            className="border px-2 py-1 rounded w-full"
            placeholder="e.g. Make tasks T1 and T2 run together"
            value={nlInput}
            onChange={e => setNlInput(e.target.value)}
          />
          <button
            className="bg-purple-600 text-white px-4 py-1 rounded"
            type="button"
            onClick={handleAIConvert}
            disabled={aiLoading}
          >
            {aiLoading ? "Converting..." : "AI Convert"}
          </button>
        </div>
        {aiError && <div className="text-red-500 mb-2">{aiError}</div>}
      </div>
      <div className="mb-4">
        <label className="block font-semibold mb-1">Rule Type</label>
        <select value={type} onChange={e => setType(e.target.value)} className="border px-2 py-1 rounded">
          {RULE_TYPES.map(rt => (
            <option key={rt.value} value={rt.value}>{rt.label}</option>
          ))}
        </select>
      </div>
      {type === "coRun" && (
        <div className="mb-4">
          <label className="block font-semibold mb-1">Co-run Task IDs (comma separated)</label>
          <input
            className="border px-2 py-1 rounded w-full"
            value={coRunTasks.join(",")}
            onChange={e => setCoRunTasks(e.target.value.split(",").map(v => v.trim()).filter(Boolean))}
            placeholder="e.g. T1,T2,T3"
          />
        </div>
      )}
      {type === "phaseWindow" && (
        <div className="mb-4">
          <label className="block font-semibold mb-1">Task ID</label>
          <input
            className="border px-2 py-1 rounded w-full mb-2"
            value={phaseTask}
            onChange={e => setPhaseTask(e.target.value)}
            placeholder="e.g. T1"
          />
          <label className="block font-semibold mb-1">Phase Range (start - end)</label>
          <div className="flex gap-2">
            <input
              type="number"
              className="border px-2 py-1 rounded w-24"
              value={phaseStart}
              min={1}
              onChange={e => setPhaseStart(Number(e.target.value))}
            />
            <span className="self-center">to</span>
            <input
              type="number"
              className="border px-2 py-1 rounded w-24"
              value={phaseEnd}
              min={phaseStart}
              onChange={e => setPhaseEnd(Number(e.target.value))}
            />
          </div>
        </div>
      )}
      <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleAddRule} type="button">
        Add Rule
      </button>
      <button className="ml-4 bg-green-600 text-white px-4 py-2 rounded" onClick={handleDownload} type="button">
        Download rules.json
      </button>
      <div className="mt-8">
        <h2 className="font-bold mb-2">Current Rules</h2>
        <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{JSON.stringify(rules, null, 2)}</pre>
      </div>
    </div>
  );
}

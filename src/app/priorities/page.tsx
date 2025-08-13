"use client";
import React, { useState } from "react";
import { useData } from "../../lib/DataContext";

// Expanded criteria with 8 items
const CRITERIA = [
  { id: "fulfillment", label: "Request Fulfillment", description: "Maximize the number of client requests satisfied" },
  { id: "fairness", label: "Fair Distribution", description: "Ensure equitable workload distribution across workers" },
  { id: "priorityLevel", label: "Priority Compliance", description: "Respect client priority levels (1-5)" },
  { id: "efficiency", label: "Resource Efficiency", description: "Minimize idle time and maximize resource utilization" },
  { id: "skillMatch", label: "Skill Matching", description: "Optimize worker-task skill alignment" },
  { id: "costOptimization", label: "Cost Optimization", description: "Minimize operational costs and resource waste" },
  { id: "timeline", label: "Timeline Adherence", description: "Meet project deadlines and phase constraints" },
  { id: "quality", label: "Quality Assurance", description: "Ensure high-quality deliverables and worker satisfaction" }
];

// Preset prioritization profiles
const PRESET_PROFILES = [
  {
    name: "Maximize Fulfillment",
    description: "Focus on satisfying as many client requests as possible",
    weights: { fulfillment: 0.3, fairness: 0.1, priorityLevel: 0.2, efficiency: 0.1, skillMatch: 0.1, costOptimization: 0.05, timeline: 0.1, quality: 0.05 }
  },
  {
    name: "Fair Distribution",
    description: "Prioritize equitable workload distribution",
    weights: { fulfillment: 0.15, fairness: 0.3, priorityLevel: 0.15, efficiency: 0.1, skillMatch: 0.1, costOptimization: 0.05, timeline: 0.1, quality: 0.05 }
  },
  {
    name: "Priority-Driven",
    description: "Heavily weight client priority levels",
    weights: { fulfillment: 0.2, fairness: 0.1, priorityLevel: 0.4, efficiency: 0.1, skillMatch: 0.1, costOptimization: 0.05, timeline: 0.1, quality: 0.05 }
  },
  {
    name: "Efficiency Focused",
    description: "Maximize resource utilization and efficiency",
    weights: { fulfillment: 0.15, fairness: 0.1, priorityLevel: 0.15, efficiency: 0.3, skillMatch: 0.1, costOptimization: 0.1, timeline: 0.1, quality: 0.05 }
  },
  {
    name: "Cost-Conscious",
    description: "Minimize operational costs and resource waste",
    weights: { fulfillment: 0.15, fairness: 0.1, priorityLevel: 0.15, efficiency: 0.15, skillMatch: 0.1, costOptimization: 0.3, timeline: 0.1, quality: 0.05 }
  },
  {
    name: "Balanced Approach",
    description: "Equal weighting across all criteria",
    weights: { fulfillment: 0.125, fairness: 0.125, priorityLevel: 0.125, efficiency: 0.125, skillMatch: 0.125, costOptimization: 0.125, timeline: 0.125, quality: 0.125 }
  }
];

export default function PrioritiesPage() {
  const { rules } = useData();
  const [prioritizationMethod, setPrioritizationMethod] = useState<"sliders" | "ranking" | "pairwise" | "presets">("sliders");
  
  // Slider-based weights
  const [sliderWeights, setSliderWeights] = useState<Record<string, number>>(
    CRITERIA.reduce((acc, criterion) => ({ ...acc, [criterion.id]: 1 }), {})
  );
  
  // Drag-and-drop ranking
  const [rankedCriteria, setRankedCriteria] = useState<string[]>(CRITERIA.map(c => c.id));
  
  // Pairwise comparison matrix
  const [pairwiseMatrix, setPairwiseMatrix] = useState<Record<string, Record<string, number>>>(
    CRITERIA.reduce((acc, criterion) => ({
      ...acc,
      [criterion.id]: CRITERIA.reduce((innerAcc, innerCriterion) => ({
        ...innerAcc,
        [innerCriterion.id]: criterion.id === innerCriterion.id ? 1 : 0
      }), {})
    }), {})
  );
  
  // Current weights (computed from selected method)
  const [currentWeights, setCurrentWeights] = useState<Record<string, number>>(
    CRITERIA.reduce((acc, criterion) => ({ ...acc, [criterion.id]: 1 }), {})
  );

  // Update weights based on selected method
  const updateWeights = () => {
    let newWeights: Record<string, number> = {};
    
    switch (prioritizationMethod) {
      case "sliders":
        newWeights = { ...sliderWeights };
        break;
      case "ranking":
        // Convert ranking to weights (higher rank = higher weight)
        newWeights = rankedCriteria.reduce((acc, criterionId, index) => ({
          ...acc,
          [criterionId]: CRITERIA.length - index
        }), {});
        break;
      case "pairwise":
        // Calculate weights from pairwise comparison matrix using row sums
        newWeights = CRITERIA.reduce((acc, criterion) => {
          const rowSum = Object.values(pairwiseMatrix[criterion.id]).reduce((sum, val) => sum + val, 0);
          return { ...acc, [criterion.id]: rowSum };
        }, {});
        break;
      case "presets":
        // Use the first preset as default
        newWeights = PRESET_PROFILES[0].weights;
        break;
    }
    
    // Normalize weights to sum to 1
    const totalWeight = Object.values(newWeights).reduce((sum, weight) => sum + weight, 0);
    const normalizedWeights = Object.keys(newWeights).reduce((acc, criterionId) => ({
      ...acc,
      [criterionId]: newWeights[criterionId] / totalWeight
    }), {});
    
    setCurrentWeights(normalizedWeights);
  };

  // Handle slider changes
  const handleSliderChange = (criterionId: string, value: number) => {
    setSliderWeights(prev => ({ ...prev, [criterionId]: value }));
  };

  // Handle drag-and-drop ranking
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(rankedCriteria);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setRankedCriteria(items);
  };

  // Handle pairwise comparison
  const handlePairwiseComparison = (criterion1: string, criterion2: string, value: number) => {
    setPairwiseMatrix(prev => ({
      ...prev,
      [criterion1]: {
        ...prev[criterion1],
        [criterion2]: value
      },
      [criterion2]: {
        ...prev[criterion2],
        [criterion1]: 1 / value
      }
    }));
  };

  // Apply preset profile
  const applyPreset = (preset: typeof PRESET_PROFILES[0]) => {
    setCurrentWeights(preset.weights);
    setPrioritizationMethod("presets");
  };

  // Calculate total weight
  const calculateTotalWeight = (weights: Record<string, number>) => {
    return Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  };

  // Normalize weights
  const normalizeWeights = (weights: Record<string, number>) => {
    const total = calculateTotalWeight(weights);
    if (total === 0) return weights;
    
    return Object.keys(weights).reduce((acc, criterionId) => ({
      ...acc,
      [criterionId]: weights[criterionId] / total
    }), {});
  };

  // Download priorities configuration
  const handleDownload = () => {
    const prioritiesConfig = {
      criteria: CRITERIA.map(c => ({
        id: c.id,
        label: c.label,
        description: c.description,
        weight: currentWeights[c.id]
      })),
      method: prioritizationMethod,
      metadata: {
        generatedAt: new Date().toISOString(),
        totalCriteria: CRITERIA.length,
        totalWeight: calculateTotalWeight(currentWeights),
        normalizedWeights: normalizeWeights(currentWeights),
        rulesIntegration: rules.length > 0 ? `Integrated with ${rules.length} business rules` : "No business rules configured",
        version: "1.0.0"
      }
    };
    
    const blob = new Blob([JSON.stringify(prioritiesConfig, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "priorities.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Update weights when method changes
  React.useEffect(() => {
    updateWeights();
  }, [prioritizationMethod, sliderWeights, rankedCriteria, pairwiseMatrix]);

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Resource Allocation Priorities</h1>
        <p className="text-gray-600">Configure how the system should balance different allocation criteria</p>
      </div>

      {/* Method Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Prioritization Method</h2>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { id: "sliders", label: "Sliders", icon: "🎚️", description: "Adjust weights with sliders" },
            { id: "ranking", label: "Ranking", icon: "📊", description: "Drag and drop to rank criteria" },
            { id: "pairwise", label: "Pairwise", icon: "⚖️", description: "Compare criteria two by two" },
            { id: "presets", label: "Presets", icon: "📋", description: "Use predefined profiles" }
          ].map(method => (
            <button
              key={method.id}
              onClick={() => setPrioritizationMethod(method.id as any)}
              className={`p-4 rounded-lg border-2 transition-all ${
                prioritizationMethod === method.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-2xl mb-2">{method.icon}</div>
              <div className="font-semibold">{method.label}</div>
              <div className="text-sm text-gray-600">{method.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Slider-based Prioritization */}
      {prioritizationMethod === "sliders" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Slider-based Weight Assignment</h2>
          <div className="space-y-6">
            {CRITERIA.map(criterion => (
              <div key={criterion.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="font-semibold">{criterion.label}</label>
                    <p className="text-sm text-gray-600">{criterion.description}</p>
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    {((currentWeights[criterion.id] || 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={sliderWeights[criterion.id] || 0}
                  onChange={(e) => handleSliderChange(criterion.id, parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0</span>
                  <span>5</span>
                  <span>10</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drag-and-Drop Ranking */}
      {prioritizationMethod === "ranking" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Drag-and-Drop Ranking</h2>
          <p className="text-gray-600 mb-4">Drag criteria to reorder them by importance (top = highest priority)</p>
          <div className="space-y-2">
            {rankedCriteria.map((criterionId, index) => {
              const criterion = CRITERIA.find(c => c.id === criterionId);
              if (!criterion) return null;
              
              return (
                <div
                  key={criterionId}
                  className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200 cursor-move hover:bg-gray-100 transition-colors"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", criterionId);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const draggedId = e.dataTransfer.getData("text/plain");
                    const draggedIndex = rankedCriteria.indexOf(draggedId);
                    const newRanked = [...rankedCriteria];
                    newRanked.splice(draggedIndex, 1);
                    newRanked.splice(index, 0, draggedId);
                    setRankedCriteria(newRanked);
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">📋</div>
                    <div className="flex-1">
                      <div className="font-semibold">{criterion.label}</div>
                      <div className="text-sm text-gray-600">{criterion.description}</div>
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                      Rank {index + 1}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pairwise Comparison Matrix */}
      {prioritizationMethod === "pairwise" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Pairwise Comparison Matrix</h2>
          <p className="text-gray-600 mb-4">Compare each criterion against others. Use values: 1 (equal), 3 (moderately more important), 5 (much more important), 7 (very much more important), 9 (extremely more important)</p>
          
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Criterion</th>
                  {CRITERIA.map(c => (
                    <th key={c.id} className="border border-gray-300 px-4 py-2 text-center text-sm">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CRITERIA.map((criterion1, index1) => (
                  <tr key={criterion1.id}>
                    <td className="border border-gray-300 px-4 py-2 font-semibold bg-gray-50">
                      {criterion1.label}
                    </td>
                    {CRITERIA.map((criterion2, index2) => (
                      <td key={criterion2.id} className="border border-gray-300 px-4 py-2 text-center">
                        {index1 === index2 ? (
                          <span className="text-gray-400">1</span>
                        ) : (
                          <select
                            value={pairwiseMatrix[criterion1.id]?.[criterion2.id] || 0}
                            onChange={(e) => handlePairwiseComparison(criterion1.id, criterion2.id, parseFloat(e.target.value))}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value={0}>-</option>
                            <option value={1}>1</option>
                            <option value={3}>3</option>
                            <option value={5}>5</option>
                            <option value={7}>7</option>
                            <option value={9}>9</option>
                          </select>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Preset Profiles */}
      {prioritizationMethod === "presets" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Preset Prioritization Profiles</h2>
          <p className="text-gray-600 mb-4">Choose from predefined prioritization strategies</p>
          
          <div className="grid md:grid-cols-2 gap-4">
            {PRESET_PROFILES.map((preset, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{preset.name}</h3>
                    <p className="text-sm text-gray-600">{preset.description}</p>
                  </div>
                  <button
                    onClick={() => applyPreset(preset)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    Apply
                  </button>
                </div>
                
                <div className="space-y-2">
                  {Object.entries(preset.weights).map(([criterionId, weight]) => {
                    const criterion = CRITERIA.find(c => c.id === criterionId);
                    if (!criterion) return null;
                    
                    return (
                      <div key={criterionId} className="flex justify-between items-center text-sm">
                        <span>{criterion.label}</span>
                        <span className="font-semibold text-blue-600">{(weight * 100).toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Priority Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Priority Summary</h2>
          <button
            onClick={handleDownload}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Download Priorities
          </button>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-3">Current Weights</h3>
            <div className="space-y-2">
              {CRITERIA.map(criterion => (
                <div key={criterion.id} className="flex justify-between items-center">
                  <span className="text-sm">{criterion.label}</span>
                  <span className="font-semibold text-blue-600">
                    {((currentWeights[criterion.id] || 0) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-3">Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Weight:</span>
                <span className="font-semibold">{calculateTotalWeight(currentWeights).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Method Used:</span>
                <span className="font-semibold capitalize">{prioritizationMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Rules Integration:</span>
                <span className="font-semibold">{rules.length > 0 ? `${rules.length} rules` : "None"}</span>
              </div>
              <div className="flex justify-between">
                <span>Top Priority:</span>
                <span className="font-semibold text-blue-600">
                  {CRITERIA.find(c => c.id === Object.keys(currentWeights).reduce((a, b) => 
                    currentWeights[a] > currentWeights[b] ? a : b
                  ))?.label || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

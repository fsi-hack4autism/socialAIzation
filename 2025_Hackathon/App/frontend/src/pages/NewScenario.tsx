import { useState } from 'react';
import ScenarioForm from '../components/ScenarioForm';
import { scenarioApi } from '../utils/api';
import type { ScenarioInput } from '../types/scenario';

export default function NewScenarioPage() {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: ScenarioInput) => {
    try {
      await scenarioApi.createScenario(data);
    } catch (err) {
      console.error("Error creating scenario:", err);
      setError("Failed to create scenario. Please try again.");
      throw err; // Re-throw to let the form component handle it
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create New Scenario</h1>
        <p className="mt-2 text-sm text-gray-700">
          Fill out the form below to create a new scenario for social practice.
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <ScenarioForm
        onSubmit={handleSubmit}
        submitButtonText="Create Scenario"
      />
    </div>
  );
}

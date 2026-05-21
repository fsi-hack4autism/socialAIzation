import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ScenarioCard from '../components/ScenarioCard';
import { scenarioApi } from '../utils/api';
import type { Scenario } from '../types/scenario';

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const response = await scenarioApi.getScenarios(1, 10);
        setScenarios(response.items);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching scenarios:", err);
        setError("Failed to load scenarios. Using mock data instead.");
        // Fallback to mock data if API call fails
        const mockScenarios: Scenario[] = [
          {
            id: "1",
            name: "Virtual Meeting",
            description: "A virtual meeting room for remote teams",
            mediaType: "VR",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "2",
            name: "Social Cafe",
            description: "Practice ordering and small talk in a cafe setting",
            mediaType: "VR",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "3",
            name: "Job Interview",
            description: "Practice job interview skills with AI interviewers",
            mediaType: "web",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
        
        setScenarios(mockScenarios);
        setLoading(false);
      }
    };

    fetchScenarios();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await scenarioApi.deleteScenario(id);
      setScenarios(scenarios.filter(scenario => scenario.id !== id));
    } catch (error) {
      console.error("Error deleting scenario:", error);
      setError("Failed to delete scenario. Please try again later.");
      // For now, just update the local state even if API call fails
      setScenarios(scenarios.filter(scenario => scenario.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
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
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scenarios</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all the scenarios for social practice in the metaverse.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/scenarios/new"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create New Scenario
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {scenarios.length > 0 ? (
          scenarios.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-white rounded-lg shadow">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No scenarios</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new scenario.</p>
            <div className="mt-6">
              <Link
                to="/scenarios/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create New Scenario
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

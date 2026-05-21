import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ScenarioForm from '../components/ScenarioForm';
import { scenarioApi } from '../utils/api';
import type { Scenario, ScenarioInput } from '../types/scenario';

export default function EditScenarioPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScenario = async () => {
      if (!id) return;
      
      try {
        const data = await scenarioApi.getScenario(id);
        setScenario(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching scenario:", err);
        setError("Failed to load scenario details. Please try again.");
        setLoading(false);
        
        // Fallback to mock data if API call fails
        const mockScenario: Scenario = {
          id,
          name: "Sample Scenario",
          description: "This is a sample scenario for demonstration purposes.",
          mediaType: "VR",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        setScenario(mockScenario);
      }
    };

    fetchScenario();
  }, [id]);

  const handleSubmit = async (data: ScenarioInput) => {
    if (!id) return;
    
    try {
      await scenarioApi.updateScenario(id, data);
    } catch (err) {
      console.error("Error updating scenario:", err);
      setError("Failed to update scenario. Please try again.");
      throw err; // Re-throw to let the form component handle it
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error && !scenario) {
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
            <div className="mt-4">
              <button
                onClick={() => navigate('/scenarios')}
                className="text-sm font-medium text-red-700 hover:text-red-600"
              >
                Go back to scenarios
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="text-center py-12">
        <h3 className="mt-2 text-sm font-medium text-gray-900">Scenario not found</h3>
        <p className="mt-1 text-sm text-gray-500">The scenario you're looking for doesn't exist or has been removed.</p>
        <div className="mt-6">
          <button
            onClick={() => navigate('/scenarios')}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Go back to scenarios
          </button>
        </div>
      </div>
    );
  }

  const initialValues: ScenarioInput = {
    name: scenario.name,
    description: scenario.description,
    mediaType: scenario.mediaType,
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Edit Scenario</h1>
        <p className="mt-2 text-sm text-gray-700">
          Update the details of your scenario.
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
        initialValues={initialValues}
        onSubmit={handleSubmit}
        submitButtonText="Update Scenario"
      />
    </div>
  );
}

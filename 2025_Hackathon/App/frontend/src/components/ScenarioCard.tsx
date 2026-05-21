import { Link } from 'react-router-dom';
import type { Scenario } from '../types/scenario';

interface ScenarioCardProps {
  scenario: Scenario;
  onDelete: (id: string) => void;
}

export default function ScenarioCard({ scenario, onDelete }: ScenarioCardProps) {
  const getMediaTypeIcon = (type: 'VR' | 'web' | 'mobile') => {
    switch (type) {
      case 'VR':
        return (
          <svg className="h-5 w-5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'web':
        return (
          <svg className="h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        );
      case 'mobile':
        return (
          <svg className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg border">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {getMediaTypeIcon(scenario.mediaType)}
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">{scenario.name}</h3>
              <p className="text-sm text-gray-500">
                Created on {formatDate(scenario.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Link 
              to={`/scenarios/${scenario.id}/edit`}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Edit
            </Link>
            <button
              onClick={() => onDelete(scenario.id)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Delete
            </button>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-500">{scenario.description}</p>
        </div>
      </div>
      <div className="bg-gray-50 px-4 py-4 sm:px-6">
        <div className="text-sm">
          <Link 
            to={`/scenarios/${scenario.id}`} 
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            View details
          </Link>
        </div>
      </div>
    </div>
  );
}

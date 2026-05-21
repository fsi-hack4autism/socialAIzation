import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
          Welcome to VR Scenario Manager
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Create and manage interactive scenarios for social practice in the metaverse.
        </p>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        <dl className="sm:divide-y sm:divide-gray-200">
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">
              Scenarios
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              Create and manage different social interaction scenarios in VR, web, or mobile environments.
              <div className="mt-4">
                <Link 
                  to="/scenarios"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  View All Scenarios
                </Link>
              </div>
            </dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">
              Create New
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              Start building a new scenario for social interaction practice.
              <div className="mt-4">
                <Link 
                  to="/scenarios/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Create New Scenario
                </Link>
              </div>
            </dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">
              About
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <p>
                The VR Scenario Manager is part of the Metaverse Social Practice project, designed to help people with autism practice social interactions in a safe, immersive environment.
              </p>
              <p className="mt-2">
                Each scenario provides a structured environment for practicing different social skills with AI-generated peers.
              </p>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

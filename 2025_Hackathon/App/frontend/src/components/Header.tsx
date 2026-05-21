import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="bg-indigo-600">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex w-full items-center justify-between border-b border-indigo-500 py-6 lg:border-none">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <svg 
                className="h-8 w-8 text-indigo-200" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
                />
              </svg>
              <span className="ml-2 text-xl font-bold text-white">VR Scenario Manager</span>
            </Link>
            <div className="ml-10 hidden space-x-8 lg:block">
              <Link to="/scenarios" className="text-base font-medium text-white hover:text-indigo-50">
                Scenarios
              </Link>
              <Link to="/scenarios/new" className="text-base font-medium text-white hover:text-indigo-50">
                Create Scenario
              </Link>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-x-6 py-4 lg:hidden">
          <Link to="/scenarios" className="text-base font-medium text-white hover:text-indigo-50">
            Scenarios
          </Link>
          <Link to="/scenarios/new" className="text-base font-medium text-white hover:text-indigo-50">
            Create Scenario
          </Link>
        </div>
      </nav>
    </header>
  );
}

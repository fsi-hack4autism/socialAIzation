import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/Home';
import ScenariosPage from './pages/Scenarios';
import ScenarioDetailsPage from './pages/ScenarioDetails';
import NewScenarioPage from './pages/NewScenario';
import EditScenarioPage from './pages/EditScenario';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="scenarios">
          <Route index element={<ScenariosPage />} />
          <Route path="new" element={<NewScenarioPage />} />
          <Route path=":id" element={<ScenarioDetailsPage />} />
          <Route path=":id/edit" element={<EditScenarioPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;

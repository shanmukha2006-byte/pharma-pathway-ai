import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { ToastProvider } from '@/hooks/useAppToast';
import ToastContainer from '@/components/ui/ToastContainer';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import Dashboard from '@/pages/Dashboard';
import MoleculeExplorer from '@/pages/MoleculeExplorer';
import PathwayBuilder from '@/pages/PathwayBuilder';
import PathwayList from '@/pages/PathwayList';
import RetrosynthesisLogPage from '@/pages/RetrosynthesisLog';
import IndicationPricingPage from '@/pages/IndicationPricing';
import ADMETPage from '@/pages/ADMETPage';
import AIRetrosynthesisPage from '@/pages/AIRetrosynthesisPage';
import InteractionCheckerPage from '@/pages/InteractionCheckerPage';
import AnalyticsDashboard from '@/pages/AnalyticsDashboard';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                {/* Core pages */}
                <Route path="/"               element={<Dashboard />} />
                <Route path="/molecules"      element={<MoleculeExplorer />} />
                <Route path="/pathways"       element={<PathwayList />} />
                <Route path="/pathways/new"   element={<PathwayBuilder />} />
                <Route path="/retrosynthesis" element={<RetrosynthesisLogPage />} />
                <Route path="/pricing"        element={<IndicationPricingPage />} />

                {/* AI Feature pages */}
                <Route path="/ai-retrosynthesis" element={<AIRetrosynthesisPage />} />
                <Route path="/admet"             element={<ADMETPage />} />
                <Route path="/interactions"      element={<InteractionCheckerPage />} />
                <Route path="/analytics" element={<AnalyticsDashboard />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
        <ToastContainer />
      </ToastProvider>
    </AuthProvider>
  );
}
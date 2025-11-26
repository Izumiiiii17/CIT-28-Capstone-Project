import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { AnimatePresence } from 'framer-motion';
import Layout from './components/layout/Layout';

// Pages
import Home from './pages/Home';
import Auth from './pages/Auth';
import ProfileForm from './pages/ProfileForm';
import Results from './pages/Results';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Progress from './pages/Progress';
import MealPlanner from './pages/MealPlanner';
import Notifications from './pages/Notifications';
import Demo from './pages/Demo';
import About from './pages/About';
import Contact from './pages/Contact';

function App() {
  return (
    <AuthProvider>
      {/* ✅ Toast notifications */}
      <Toaster position="top-right" />

      {/* ✅ Router setup */}
      <Router>
        {/* AnimatePresence must wrap *Routes* for smooth transitions */}
        <AnimatePresence mode="wait">
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="auth" element={<Auth />} />
                <Route path="profile" element={<ProfileForm />} />
                <Route path="results" element={<Results />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="settings" element={<Settings />} />
                <Route path="progress" element={<Progress />} />
                <Route path="meal-planner" element={<MealPlanner />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="demo" element={<Demo />} />
                <Route path="about" element={<About />} />
                <Route path="contact" element={<Contact />} />

                {/* ✅ Catch-all route (avoids blank page if route not found) */}
                <Route path="*" element={<Home />} />
              </Route>
            </Routes>
          </div>
        </AnimatePresence>
      </Router>
    </AuthProvider>
  );
}

export default App;
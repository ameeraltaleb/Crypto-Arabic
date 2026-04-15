/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthProvider } from './lib/AuthContext';

// Lazy load pages for better performance (Code Splitting)
const Home = lazy(() => import('./pages/Home'));
const ArticleDetails = lazy(() => import('./pages/ArticleDetails'));
const Market = lazy(() => import('./pages/Market'));
const About = lazy(() => import('./pages/About'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const Contact = lazy(() => import('./pages/Contact'));
const DailySummary = lazy(() => import('./pages/DailySummary'));
const BtcAnalysis = lazy(() => import('./pages/BtcAnalysis'));
const AdminLogin = lazy(() => import('./pages/admin/Login'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const CreateArticle = lazy(() => import('./pages/admin/CreateArticle'));

// A simple loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="article/:slug" element={<ArticleDetails />} />
            <Route path="market" element={<Market />} />
            <Route path="about" element={<About />} />
            <Route path="privacy" element={<Privacy />} />
            <Route path="terms" element={<Terms />} />
            <Route path="contact" element={<Contact />} />
            <Route path="daily-summary" element={<DailySummary />} />
            <Route path="btc-analysis" element={<BtcAnalysis />} />
            
            {/* Admin Routes */}
            <Route path="admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="admin/login" element={<AdminLogin />} />
            <Route path="admin/dashboard" element={<AdminDashboard />} />
            <Route path="admin/articles/new" element={<CreateArticle />} />
          </Route>
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}




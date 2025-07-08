
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import LandingPage from "@/pages/LandingPage";
import Auth from "@/pages/Auth";
import Index from "@/pages/Index";
import Profile from "@/pages/Profile";
import Assessment from "@/pages/Assessment";
import Tasks from "@/pages/Tasks";
import TaskList from "@/pages/TaskList";
import TaskGenerator from "@/pages/TaskGenerator";
import Valuation from "@/pages/Valuation";
import Brochure from "@/pages/Brochure";
import Sharing from "@/pages/Sharing";
import SharingManager from "@/pages/SharingManager";
import SharedView from "@/pages/SharedView";
import AIAssistant from "@/pages/AIAssistant";
import NotFound from "@/pages/NotFound";
import MainLayout from "@/components/MainLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";
import FreeValuation from "@/pages/FreeValuation";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/free-valuation" element={<FreeValuation />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requireCompany={false}>
                  <MainLayout>
                    <Index />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute requireCompany={false}>
                  <MainLayout>
                    <Profile />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessment"
              element={
                <ProtectedRoute requireCompany={true}>
                  <MainLayout>
                    <Assessment />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute requireCompany={true}>
                  <MainLayout>
                    <Tasks />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/task-list"
              element={
                <ProtectedRoute requireCompany={true}>
                  <MainLayout>
                    <TaskList />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/task-generator"
              element={
                <ProtectedRoute requireCompany={true}>
                  <MainLayout>
                    <TaskGenerator />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/valuation"
              element={
                <ProtectedRoute requireCompany={true}>
                  <MainLayout>
                    <Valuation />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/brochure"
              element={
                <ProtectedRoute requireCompany={true}>
                  <MainLayout>
                    <Brochure />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sharing"
              element={
                <ProtectedRoute requireCompany={true}>
                  <MainLayout>
                    <Sharing />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sharing-manager"
              element={
                <ProtectedRoute requireCompany={true}>
                  <MainLayout>
                    <SharingManager />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-assistant"
              element={
                <ProtectedRoute requireCompany={false}>
                  <MainLayout>
                    <AIAssistant />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route path="/shared/:shareId" element={<SharedView />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

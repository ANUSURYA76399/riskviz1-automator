import React from "react";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
// Import future flags to eliminate React Router warnings
import "./router-future-flags.js";
import { AuthProvider } from "./contexts/AuthContext";
import { DataProvider } from "./contexts/DataContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import UploadData from "./pages/UploadData";
import Visualize from "./pages/Visualize";
import Locations from "./pages/Locations";
import TrackProgress from "./pages/TrackProgress";
import Groups from "./pages/Groups";
import AOOverview from "./pages/AOOverview";

const queryClient = new QueryClient();

// Future flags are now configured in router-future-flags.js

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DataProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/upload-data"
                element={
                  <ProtectedRoute>
                    <UploadData />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/visualize"
                element={
                  <ProtectedRoute>
                    <Visualize />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/locations"
                element={
                  <ProtectedRoute>
                    <Locations />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/track-progress"
                element={
                  <ProtectedRoute>
                    <TrackProgress />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/groups"
                element={
                  <ProtectedRoute>
                    <Groups />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ao-overview"
                element={
                  <ProtectedRoute>
                    <AOOverview />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </DataProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

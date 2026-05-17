import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./components/Login";
import Register from "./components/Register";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import UploadCourse from "./components/UploadCourse";
import CourseViewer from "./components/CourseViewer";
import "./App.css";

// Layout pour les pages authentifiées
const AuthenticatedLayout = ({ children }) => (
  <div className="app">
    <Sidebar />
    <main className="main-content">{children}</main>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Routes publiques */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Routes protégées */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppProvider>
                  <AuthenticatedLayout>
                    <Dashboard />
                  </AuthenticatedLayout>
                </AppProvider>
              </ProtectedRoute>
            }
          />

          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <AppProvider>
                  <AuthenticatedLayout>
                    <UploadCourse />
                  </AuthenticatedLayout>
                </AppProvider>
              </ProtectedRoute>
            }
          />

          <Route
            path="/course/:id"
            element={
              <ProtectedRoute>
                <AppProvider>
                  <AuthenticatedLayout>
                    <CourseViewer />
                  </AuthenticatedLayout>
                </AppProvider>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

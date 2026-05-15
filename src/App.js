import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import UploadCourse from "./components/UploadCourse";
import CourseViewer from "./components/CourseViewer";
import "./App.css";

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="app">
          <Sidebar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/upload" element={<UploadCourse />} />
              <Route path="/course/:id" element={<CourseViewer />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;

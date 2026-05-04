import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Home from "./Pages/Home"
import Airtime from "./Pages/Airtime"
import ExamPins from "./Pages/ExamPins"
import Notfound from "./Pages/Notfound"
import Login from "./auth/Login"
import AdminDashboard from "./Pages/AdminDashboard"
import { useState } from "react"
import { Navigate } from "react-router-dom"

const ProtectedAdminRoute = ({ children }) => {
  const token = localStorage.getItem("adminToken");
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

const App = () => {
  const [menu, setMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleMenu = () => {
    setMenu(!menu);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };


  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Home menu={menu} toggleMenu={toggleMenu} isDarkMode={isDarkMode} toggleTheme={toggleTheme}/>} />
          <Route path="/airtime" element={<Airtime menu={menu} toggleMenu={toggleMenu} isDarkMode={isDarkMode} toggleTheme={toggleTheme}/>} />
          <Route path="/exam-pins" element={<ExamPins menu={menu} toggleMenu={toggleMenu} isDarkMode={isDarkMode} toggleTheme={toggleTheme}/>} />
          <Route path="/admin/login" element={<Login />} />
          <Route
            path="/admin/dashboard"
            element={(
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            )}
          />
          <Route path="*" element={<Notfound menu={menu} toggleMenu={toggleMenu} isDarkMode={isDarkMode} toggleTheme={toggleTheme}/>} />
        </Routes>
      </Router>
    </>
  )
}

export default App

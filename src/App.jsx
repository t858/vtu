import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Home from "./Pages/Home"
import Airtime from "./Pages/Airtime"
import ExamPins from "./Pages/ExamPins"
import PaymentSuccess from "./Pages/PaymentSuccess"
import Notfound from "./Pages/Notfound"
import Login from "./auth/Login"
import AdminDashboard from "./Pages/AdminDashboard"
import { useState, useEffect } from "react"
import { Navigate, useLocation } from "react-router-dom"

const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    if (!location.pathname.startsWith('/admin')) {
      fetch('http://localhost:3000/api/track-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: location.pathname })
      }).catch(() => {});
    }
  }, [location.pathname]);

  return null;
};

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
        <AnalyticsTracker />
        <Routes>
          <Route path="/" element={<Home menu={menu} toggleMenu={toggleMenu} isDarkMode={isDarkMode} toggleTheme={toggleTheme}/>} />
          <Route path="/airtime" element={<Airtime menu={menu} toggleMenu={toggleMenu} isDarkMode={isDarkMode} toggleTheme={toggleTheme}/>} />
          <Route path="/exam-pins" element={<ExamPins menu={menu} toggleMenu={toggleMenu} isDarkMode={isDarkMode} toggleTheme={toggleTheme}/>} />
          <Route path="/payment/success" element={<PaymentSuccess menu={menu} toggleMenu={toggleMenu} isDarkMode={isDarkMode} toggleTheme={toggleTheme}/>} />
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

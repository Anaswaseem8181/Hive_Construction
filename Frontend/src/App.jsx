import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import MainLayout from "./layouts/MainLayout";
import HomePage from "./pages/HomePage";
import PropertiesPage from "./pages/PropertiesPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OTPVerifyPage from "./pages/OTPVerifyPage";
import InvestorDashboard from "./pages/InvestorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import InvestmentsPage from "./pages/InvestmentsPage";
import CreatePropertyPage from "./pages/CreatePropertyPage";
import ForgetPassword from "./pages/ForgetPassword";
import Profile from "./pages/Profile"; // Import Profile page
import ProfilePage from "./pages/ProfilePage";
import PropertyInvestorsPage from "./pages/PropertyInvestorsPage";
import ReportsPage from "./pages/ReportsPage";

function App() {
  const isAuthenticated = () => {
    return !!localStorage.getItem("user");
  };

  const isAdmin = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return String(user.role || "").toLowerCase() === "admin";
  };

  // Get user role for conditional rendering
  const getUserRole = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return String(user.role || "").toLowerCase();
  };

  return (
    <>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              <MainLayout>
                <HomePage />
              </MainLayout>
            }
          />
          <Route
            path="/properties"
            element={
              <MainLayout>
                <PropertiesPage />
              </MainLayout>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forget-password" element={<ForgetPassword />} />
          <Route path="/verify-otp" element={<OTPVerifyPage />} />

          {/* Profile Route - Protected for all authenticated users */}
          <Route
            path="/profile"
            element={
              isAuthenticated() ? (
                <MainLayout>
                       <Profile />
                </MainLayout>
              ) : (
                <Navigate to="/" />
              )
            }
          />
          {/* Protected Routes - Investor */}
          <Route
            path="/investor-dashboard"
            element={
              isAuthenticated() && !isAdmin() ? (
                <MainLayout>
                  <InvestorDashboard />
                </MainLayout>
              ) : (
                <Navigate
                  to={isAuthenticated() ? "/investor-dashboard" : "/login"}
                />
              )
            }
          />
          <Route
            path="/investments"
            element={
              isAuthenticated() && !isAdmin() ? (
                <MainLayout>
                  <InvestmentsPage />
                </MainLayout>
              ) : (
                <Navigate
                  to={isAuthenticated() ? "/admin-dashboard" : "/login"}
                />
              )
            }
          />

          {/* Protected Routes - Admin */}
          <Route
            path="/admin-dashboard"
            element={
              isAuthenticated() && isAdmin() ? (
                <MainLayout>
                  <AdminDashboard />
                </MainLayout>
              ) : (
                <Navigate
                  to={isAuthenticated() ? "/admin-dashboard" : "/login"}
                />
              )
            }
          />
          <Route
            path="/admin/properties/create"
            element={
              isAuthenticated() && isAdmin() ? (
                <MainLayout>
                  <CreatePropertyPage />
                </MainLayout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/admin/properties/:id/edit"
            element={
              isAuthenticated() && isAdmin() ? (
                <MainLayout>
                  <CreatePropertyPage />
                </MainLayout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/admin/properties/:propertyId/investors"
            element={
              isAuthenticated() && isAdmin() ? (
                <MainLayout>
                  <PropertyInvestorsPage />
                </MainLayout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/admin/reports"
            element={
              isAuthenticated() && isAdmin() ? (
                <MainLayout>
                  <ReportsPage />
                </MainLayout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;

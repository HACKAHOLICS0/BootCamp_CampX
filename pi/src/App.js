import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Footer from './components/Footer';
import Navbar from './components/navbar';
import Template from './template';
import Signin from './components/user/signin';
import Signup from './components/user/signup';
import VerifyCode from './components/user/VerifyCode';
import ResetPassword from './components/user/ResetPassword';
import ForgotPassword from './components/user/forgetPassword';
import ResetPasswordEmail from './components/user/ResetPasswordEmail';
import VerifyCodeEmail from './components/user/VerifyCodeEmail';
import GoogleRedirectHandler from './components/user/GoogleRedirectHandler';
import UserProfile from './components/user/UserProfile';
import AdminLayout from './components/Admin/AdminLayout';
import VerifyEmailPage from './components/user/VerifyEmailPage';
import UploadVideo from './components/user/UploadVideo';
import CategoryList from './components/categories/CategoryList';
import ModuleList from './components/modules/ModuleList';
import CourseList from './components/courses/CourseList';
import QuizAdmin from './components/Admin/Quizs/QuizAdmin';
import Dashboard from './components/Admin/Dashboard';
import Users from './components/Admin/Users';
import Points from './components/Admin/PointsOfIntrest';
import Categories from './components/Admin/Categories';
import Modules from './components/Admin/Modules';
import Courses from './components/Admin/Courses';
import Products from './components/Admin/Products';
import Analytics from './components/Admin/Analytics';
import Notifications from './components/Admin/Notifications';
import Settings from './components/Admin/Settings';
import CourseView from './components/user/Course/CourseView';
import QuizView from './components/user/Quiz/QuizView';
import QuizResultView from './components/user/Quiz/QuizResultView';

function App() {
  const location = useLocation();
  
  const isAdminRoute = location.pathname.startsWith("/admin");
  const showTemplate = location.pathname === "/" || location.pathname === "/home";

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <div className="App">
        {/* Afficher Navbar uniquement si ce n'est pas une route admin */}
        {!isAdminRoute && <Navbar />}
        
        <Routes>
          <Route path="/" element={<Template />} />
          <Route path="/home" element={<Template />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-code" element={<VerifyCode />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password-email" element={<ResetPasswordEmail />} />
          <Route path="/verify-code-email" element={<VerifyCodeEmail />} />
          <Route path="/oauth/google/callback" element={<GoogleRedirectHandler />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/upload-video" element={<UploadVideo />} />

          {/* Categories, Modules, and Courses Routes */}
          <Route path="/categories" element={<CategoryList />} />
          <Route path="/categories/:categoryId/modules" element={<ModuleList />} />
          <Route path="/categories/:categoryId/modules/:moduleId" element={<CourseList />} />
          <Route path="/categories/:categoryId/modules/:moduleId/courses/:courseId" element={<CourseView />} />
          <Route path="/categories/:categoryId/modules/:moduleId/courses/:courseId/quiz/:quizId" element={<QuizView />} />
          <Route path="/categories/:categoryId/modules/:moduleId/courses/:courseId/quiz/:quizId/result" element={<QuizResultView />} />

          {/* Quiz Routes */}
          <Route path="/quiz/:quizId" element={<QuizView />} />
          <Route path="/quiz/:quizId/result" element={<QuizResultView />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="points" element={<Points />} />
            <Route path="categories" element={<Categories />} />
            <Route path="modules" element={<Modules />} />
            <Route path="courses" element={<Courses />} />
            <Route path="quizs" element={<QuizAdmin />} />
            <Route path="products" element={<Products />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>

        {/* Afficher Template uniquement sur les routes '/' et '/home' */}
        {showTemplate && <Template />}
        
        {/* Ne pas afficher le Footer si c'est une route Admin */}
        {!isAdminRoute && <Footer />}
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;

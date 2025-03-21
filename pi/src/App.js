import React from 'react';
import { Routes, Route, useLocation, matchPath } from 'react-router-dom';
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
import VerifyEmailPage from './components/user/VerifyEmailPage';
import AdminLayout from './components/Admin/AdminLayout';
import Dashboard from './components/Admin/Dashboard';
import Users from './components/Admin/Users';
import Products from './components/Admin/Products';
import Analytics from './components/Admin/Analytics';
import Points from './components/Admin/PointsOfIntrest';
import Settings from './components/Admin/Settings';
import Notifications from './components/Admin/Notifications';
import Quiz from './components/Admin/Quizs/QuizAdmin';
import Categories from './components/Admin/Categories';
import Modules from './components/Admin/Modules';
import Courses from './components/Admin/Courses';
import VideoQuizStats from './components/Admin/VideoQuizStats';
import UploadVideo from './components/user/UploadVideo';
import CategoryList from './components/categories/CategoryList';
import ModuleList from './components/modules/ModuleList';
import CourseList from './components/courses/CourseList';
import CourseView from './components/user/course/CourseView';
import QuizView from './components/user/Quiz/QuizView';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import Chatbot from './components/chatbot/Chatbot';
import ChatbotAdmin from './components/Admin/ChatbotAdmin';
import ChatTest from './components/chatbot/ChatTest';
import QuizResultView from './components/user/Quiz/QuizResultView';

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  // Routes à exclure de l'affichage du Template
  const excludedRoutes = [
    "/signin",
    "/resetpasswordemail",
    "/signup",
    "/forget-password",
    "/profile",
    "/verify-code",
    "/reset-password",
    "/verifycodeEmail",
    "/checkout",
    "/chatbot",
    "/chat"
    ];

  // Vérifier les chemins dynamiques
  const isExcludedDynamic = matchPath("/google/:token", location.pathname) ||
    matchPath("/verify-email/:token", location.pathname);

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <div className="App">
        {/* Afficher Navbar uniquement si ce n'est pas une route admin */}
        {!isAdminRoute && <Navbar />}

        <Routes>
          <Route path="/signin" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forget-password" element={<ForgotPassword />} />
          <Route path="/verify-code" element={<VerifyCode />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/resetpasswordemail" element={<ResetPasswordEmail />} />
          <Route path="/verifycodeEmail" element={<VerifyCodeEmail />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/google/:token" element={<GoogleRedirectHandler />} />
          <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
          <Route path="/upload-video" element={<UploadVideo />} />

          {/* Routes pour les catégories, modules et cours */}
          <Route path="/categories" element={<CategoryList />} />
          <Route path="/categories/:categoryId/modules" element={<ModuleList />} />
          <Route path="/modules/:moduleId/courses" element={<CourseList />} />
          
          {/* Routes pour l'affichage des cours et des quiz */}
          <Route path="/courses/:courseId" element={<CourseView />} />
        
          {/* Quiz Routes */}
          <Route path="/quiz/:quizId" element={<QuizView />} />
          <Route path="/quiz/:quizId/result" element={<QuizResultView />} />
          {/* Routes pour le chat et le chatbot */}
          <Route path="/chatbot" element={<Chatbot />} />
          <Route path="/chat" element={<ChatTest />} />

          {/* Routes Admin protégées */}
          <Route element={<ProtectedAdminRoute />}>
            <Route path="/admin/*" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="users" element={<Users />} />
              <Route path="points" element={<Points />} />
              <Route path="products" element={<Products />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="settings" element={<Settings />} />
              <Route path="quizs" element={<Quiz />} />
              <Route path="categories" element={<Categories />} />
              <Route path="modules" element={<Modules />} />
              <Route path="courses" element={<Courses />} />
              <Route path="videoquiz-stats" element={<VideoQuizStats />} />
              <Route path="chatbot" element={<ChatbotAdmin />} />
            </Route>
          </Route>
        </Routes>

        {/* Affichage conditionnel du Template uniquement sur la page d'accueil */}
        {location.pathname === "/" && <Template />}

        {/* Ne pas afficher le Footer si c'est une route Admin */}
        {!isAdminRoute && <Footer />}

      </div>
    </GoogleOAuthProvider>
  );
}

export default App;

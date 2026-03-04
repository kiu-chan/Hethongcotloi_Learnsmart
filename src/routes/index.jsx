import Home from "../pages/Home/index";
import About from "../pages/About/index";
import LoginPage from "../pages/account/LoginPage";
import RegisterPage from "../pages/account/RegisterPage";
import ForgotPasswordPage from "../pages/account/ForgotPasswordPage";
import ResetPasswordPage from "../pages/account/ResetPasswordPage";
import FeaturesPage from "../pages/Features/index";
import GuidePage from "../pages/Guide/index";
import ContactPage from "../pages/Contact/index";
import AdminDashboard from "../pages/admin/AdminDashboard/index.jsx";
import AdminUsers from "../pages/admin/Users/index.jsx";
import AdminExams from "../pages/admin/Exams/index.jsx";
import AdminReports from "../pages/admin/Reports/index.jsx";
import AdminSettings from "../pages/admin/Settings/index.jsx";
import AdminClasses from "../pages/admin/Classes/index.jsx";
import TeacherDashboard from "../pages/teacher/Dashboard/index.jsx";
import StudentDashboard from "../pages/student/Dashboard/index.jsx";
import DefaultLayout from "../components/Layout/DefaultLayout";
import AdminLayout from "../components/adminLayout/AdminLayout";
import TeacherLayout from "../components/teacherLayout/TeacherLayout";
import TeacherNotebook from "../pages/teacher/Notebook/index.jsx";
import TeacherDocuments from "../pages/teacher/Documents/index.jsx";
import TeacherExams from "../pages/teacher/Exams/index.jsx";
import TeacherGames from "../pages/teacher/Games/index.jsx";
import TeacherStudents from "../pages/teacher/Students/index.jsx";
import TeacherStatistics from "../pages/teacher/Statistics/index.jsx";
import TeacherSettings from "../pages/teacher/Settings/index.jsx";
import TeacherChat from "../pages/teacher/Chat/index.jsx";
import StudentLayout from "../components/studentLayout/StudentLayout";
import StudentClassroom from "../pages/student/Classroom/index.jsx";
import TakeExam from "../pages/student/TakeExam/index.jsx";
import StudentChat from "../pages/student/Chat/index.jsx";
import StudentGames from "../pages/student/Games/index.jsx";
import StudentSettings from "../pages/student/Settings/index.jsx";

// Routes công khai
const publicRoutes = [
  {
    path: "/",
    component: Home,
    layout: DefaultLayout,
  },
  {
    path: "/login",
    component: LoginPage,
    layout: DefaultLayout,
  },
  {
    path: "/register",
    component: RegisterPage,
    layout: DefaultLayout,
  },
  {
    path: "/about",
    component: About,
    layout: DefaultLayout,
  },
  {
    path: "/forgot-password",
    component: ForgotPasswordPage,
    layout: DefaultLayout,
  },
  {
    path: "/reset-password",
    component: ResetPasswordPage,
    layout: DefaultLayout,
  },
  {
    path: "/features",
    component: FeaturesPage,
    layout: DefaultLayout,
  },
  {
    path: "/guide",
    component: GuidePage,
    layout: DefaultLayout,
  },
  {
    path: "/contact",
    component: ContactPage,
    layout: DefaultLayout,
  },
];

// Routes cho các roles
const privateRoutes = [
  // Admin routes
  {
    path: "/admin",
    component: AdminDashboard,
    layout: AdminLayout,
    allowedRoles: ['admin']
  },
  {
    path: "/admin/users",
    component: AdminUsers,
    layout: AdminLayout,
    allowedRoles: ['admin']
  },
  {
    path: "/admin/exams",
    component: AdminExams,
    layout: AdminLayout,
    allowedRoles: ['admin']
  },
  {
    path: "/admin/reports",
    component: AdminReports,
    layout: AdminLayout,
    allowedRoles: ['admin']
  },
  {
    path: "/admin/classes",
    component: AdminClasses,
    layout: AdminLayout,
    allowedRoles: ['admin']
  },
  {
    path: "/admin/settings",
    component: AdminSettings,
    layout: AdminLayout,
    allowedRoles: ['admin']
  },
  // Teacher routes
  {
    path: "/teacher/dashboard",
    component: TeacherDashboard,
    layout: TeacherLayout,
    allowedRoles: ['teacher']
  },
  {
    path: "/teacher/notebook",
    component: TeacherNotebook,
    layout: TeacherLayout,
    allowedRoles: ['teacher']
  },
  {
    path: "/teacher/documents",
    component: TeacherDocuments,
    layout: TeacherLayout,
    allowedRoles: ['teacher']
  },
  {
    path: "/teacher/exams",
    component: TeacherExams,
    layout: TeacherLayout,
    allowedRoles: ['teacher']
  },
  {
    path: "/teacher/games",
    component: TeacherGames,
    layout: TeacherLayout,
    allowedRoles: ['teacher']
  },
  {
    path: "/teacher/students",
    component: TeacherStudents,
    layout: TeacherLayout,
    allowedRoles: ['teacher']
  },
  {
    path: "/teacher/statistics",
    component: TeacherStatistics,
    layout: TeacherLayout,
    allowedRoles: ['teacher']
  },
  {
    path: "/teacher/chat",
    component: TeacherChat,
    layout: TeacherLayout,
    allowedRoles: ['teacher']
  },
  {
    path: "/teacher/settings",
    component: TeacherSettings,
    layout: TeacherLayout,
    allowedRoles: ['teacher']
  },
  // Student routes
  {
    path: "/student/dashboard",
    component: StudentDashboard,
    layout: StudentLayout,
    allowedRoles: ['student']
  },
  {
    path: "/student/classroom",
    component: StudentClassroom,
    layout: StudentLayout,
    allowedRoles: ['student']
  },
  {
    path: "/student/exam/:id",
    component: TakeExam,
    layout: StudentLayout,
    allowedRoles: ['student']
  },
  {
    path: "/student/chat",
    component: StudentChat,
    layout: StudentLayout,
    allowedRoles: ['student']
  },
  {
    path: "/student/games",
    component: StudentGames,
    layout: StudentLayout,
    allowedRoles: ['student']
  },
  {
    path: "/student/settings",
    component: StudentSettings,
    layout: StudentLayout,
    allowedRoles: ['student']
  },
];

export { publicRoutes, privateRoutes };
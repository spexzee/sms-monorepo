import { lazy, Suspense } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import ProtectedRoute from "./RouterProtect";
import PageSkeleton from "../components/ui/PageSkeleton";

// Public Pages
const LoginPage = lazy(() => import("../pages/LoginPage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));
const UnauthorizedPage = lazy(() => import("../pages/UnauthorizedPage"));

// Super Admin Pages
const SuperAdminDashboard = lazy(() => import("../pages/SuperAdmin/Dashboard"));
const Schools = lazy(() => import("../pages/SuperAdmin/Schools"));
const Users = lazy(() => import("../pages/SuperAdmin/Users"));
const Menus = lazy(() => import("../pages/SuperAdmin/Menus"));

// School Admin Pages
const SchoolAdminDashboard = lazy(() => import("../pages/SchoolAdmin/Dashboard"));
const School = lazy(() => import("../pages/SchoolAdmin/School"));
const Teachers = lazy(() => import("../pages/SchoolAdmin/Teachers"));
const SchoolAdminStudents = lazy(() => import("../pages/SchoolAdmin/Students"));
const SchoolAdminNotificationsPage = lazy(() => import("../pages/SchoolAdmin/Notifications"));
const Parents = lazy(() => import("../pages/SchoolAdmin/Parents"));
const SchoolLocation = lazy(() => import("../pages/SchoolAdmin/SchoolLocation"));
const SchoolAdminProfile = lazy(() => import("../pages/SchoolAdmin/Profile"));
const Requests = lazy(() => import("../pages/SchoolAdmin/Requests"));
const SchoolAdminClasses = lazy(() => import("../pages/SchoolAdmin/Classes"));
const SchoolAdminSubjects = lazy(() => import("../pages/SchoolAdmin/Subjects"));
const SchoolAdminAttendance = lazy(() => import("../pages/SchoolAdmin/Attendance"));
const SchoolAdminLeaveRequests = lazy(() => import("../pages/SchoolAdmin/Leave/Requests"));

const TimetableConfig = lazy(() => import("../pages/SchoolAdmin/Timetable/TimetableConfig"));
const TimetableMaster = lazy(() => import("../pages/SchoolAdmin/Timetable/TimetableMaster"));
const ConflictManagement = lazy(() => import("../pages/SchoolAdmin/Timetable/ConflictManagement"));
const SubstituteManagement = lazy(() => import("../pages/SchoolAdmin/Timetable/SubstituteManagement"));

const SchoolAdminAnnouncements = lazy(() => import("../pages/SchoolAdmin/Announcements"));
const EmailTemplateList = lazy(() => import("../pages/SchoolAdmin/EmailTemplates"));
const EmailTemplateEditor = lazy(() => import("../pages/SchoolAdmin/EmailTemplates/Editor"));
const ExamConfiguration = lazy(() => import("../pages/SchoolAdmin/Exam/ExamConfiguration"));
const ExamScheduler = lazy(() => import("../pages/SchoolAdmin/Exam/ExamScheduler"));

// Teacher Pages
const TeacherDashboard = lazy(() => import("../pages/Teacher/Dashboard"));
const TeacherClasses = lazy(() => import("../pages/Teacher/Classes"));
const TeacherStudents = lazy(() => import("../pages/Teacher/Students"));
const TeacherParents = lazy(() => import("../pages/Teacher/Parents"));
const TeacherAttendance = lazy(() => import("../pages/Teacher/Attendance"));
const TeacherProfile = lazy(() => import("../pages/Teacher/Profile"));
const TeacherMyRequests = lazy(() => import("../pages/Teacher/MyRequests"));
const TeacherHomework = lazy(() => import("../pages/Teacher/Homework"));
const CreateHomework = lazy(() => import("../pages/Teacher/Homework/CreateHomework"));
const TeacherAnnouncements = lazy(() => import("../pages/Teacher/Announcements"));
const TeacherApplyLeave = lazy(() => import("../pages/Teacher/Leave/ApplyLeave"));
const TeacherMyLeaves = lazy(() => import("../pages/Teacher/Leave/MyLeaves"));
const TeacherStudentLeaves = lazy(() => import("../pages/Teacher/Leave/StudentLeaves"));
const TeacherTimetable = lazy(() => import("../pages/Teacher/Timetable/MyTimetable"));
const MarksEntry = lazy(() => import("../pages/Teacher/Exam/MarksEntry"));

// Student Pages
const StudentDashboard = lazy(() => import("../pages/Student/Dashboard"));
const StudentClasses = lazy(() => import("../pages/Student/Classes"));
const StudentAttendance = lazy(() => import("../pages/Student/Attendance"));
const StudentAttendanceHistory = lazy(() => import("../pages/Student/Attendance/History"));
const StudentResults = lazy(() => import("../pages/Student/Results"));
const StudentProfile = lazy(() => import("../pages/Student/Profile"));
const StudentMyRequests = lazy(() => import("../pages/Student/MyRequests"));
const StudentApplyLeave = lazy(() => import("../pages/Student/Leave/ApplyLeave"));
const StudentMyLeaves = lazy(() => import("../pages/Student/Leave/MyLeaves"));
const StudentHomework = lazy(() => import("../pages/Student/Homework"));
const StudentAnnouncements = lazy(() => import("../pages/Student/Announcements"));
const StudentTimetable = lazy(() => import("../pages/Student/Timetable/MyTimetable"));
const MyExams = lazy(() => import("../pages/Student/Exam/MyExams"));

// Parent Pages
const ParentDashboard = lazy(() => import("../pages/Parent/Dashboard"));
const ParentChildren = lazy(() => import("../pages/Parent/Children"));
const ChildProfile = lazy(() => import("../pages/Parent/Children/Profile"));
const ParentAnnouncements = lazy(() => import("../pages/Parent/Announcements"));
const ParentHomework = lazy(() => import("../pages/Parent/Homework"));
const ParentAttendance = lazy(() => import("../pages/Parent/Attendance"));
const ParentTeachers = lazy(() => import("../pages/Parent/Teachers"));
const ParentTimetable = lazy(() => import("../pages/Parent/Timetable"));
const ParentApplyLeave = lazy(() => import("../pages/Parent/Leave/ApplyLeave"));
const ParentLeaveHistory = lazy(() => import("../pages/Parent/Leave/History"));
const ParentExamSchedule = lazy(() => import("../pages/Parent/Exam/Schedule"));
const ParentExamResults = lazy(() => import("../pages/Parent/Exam/Results"));

// Shared Pages
const NotificationsPage = lazy(() => import("../pages/Shared/Notifications"));

const MainRouters = () => {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Super Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={["super_admin"]} />}>
          <Route
            path="/super-admin/dashboard"
            element={<SuperAdminDashboard />}
          />
          <Route path="/super-admin/schools" element={<Schools />} />
          <Route path="/super-admin/users" element={<Users />} />
          <Route path="/super-admin/menus" element={<Menus />} />
        </Route>

        {/* School Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={["sch_admin"]} />}>
          <Route
            path="/school-admin/dashboard"
            element={<SchoolAdminDashboard />}
          />
          <Route path="/school-admin/school" element={<School />} />
          <Route path="/school-admin/classes" element={<SchoolAdminClasses />} />
          <Route
            path="/school-admin/subjects"
            element={<SchoolAdminSubjects />}
          />
          <Route path="/school-admin/teachers" element={<Teachers />} />
          <Route
            path="/school-admin/students"
            element={<SchoolAdminStudents />}
          />
          <Route path="/school-admin/parents" element={<Parents />} />
          <Route path="/school-admin/requests" element={<Requests />} />
          <Route
            path="/school-admin/attendance"
            element={<SchoolAdminAttendance />}
          />
          <Route
            path="/school-admin/leaverequest"
            element={<SchoolAdminLeaveRequests />}
          />
          <Route
            path="/school-admin/timetable/config"
            element={<TimetableConfig />}
          />
          <Route
            path="/school-admin/timetable/master"
            element={<TimetableMaster />}
          />
          <Route
            path="/school-admin/timetable/conflicts"
            element={<ConflictManagement />}
          />
          <Route
            path="/school-admin/timetable/substitutes"
            element={<SubstituteManagement />}
          />

          {/* Exam Management Routes (Admin) */}
          <Route path="/school-admin/exam/config" element={<ExamConfiguration />} />
          <Route path="/school-admin/exam/scheduler" element={<ExamScheduler />} />

          {/* Announcements Routes (Admin) */}
          <Route path="/school-admin/announcements" element={<SchoolAdminAnnouncements />} />

          {/* Email Templates Routes (Admin) */}
          <Route path="/school-admin/email-templates" element={<EmailTemplateList />} />
          <Route path="/school-admin/email-templates/:id" element={<EmailTemplateEditor />} />

          {/* Notifications & Activity Logs */}
          <Route path="/school-admin/notifications" element={<SchoolAdminNotificationsPage />} />

          <Route path="/school-admin/location" element={<SchoolLocation />} />
          <Route path="/school-admin/profile" element={<SchoolAdminProfile />} />
        </Route>

        {/* Teacher Routes */}
        <Route element={<ProtectedRoute allowedRoles={["teacher"]} />}>
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/classes" element={<TeacherClasses />} />
          <Route path="/teacher/students" element={<TeacherStudents />} />
          <Route path="/teacher/parents" element={<TeacherParents />} />
          <Route path="/teacher/attendance" element={<TeacherAttendance />} />
          <Route path="/teacher/my-requests" element={<TeacherMyRequests />} />
          <Route path="/teacher/leave/apply" element={<TeacherApplyLeave />} />
          <Route path="/teacher/leave/my" element={<TeacherMyLeaves />} />
          <Route path="/teacher/leave/students" element={<TeacherStudentLeaves />} />
          <Route path="/teacher/timetable" element={<TeacherTimetable />} />
          <Route path="/teacher/exam/marks" element={<MarksEntry />} />

          {/* Homework Routes (Teacher) */}
          <Route path="/teacher/homework" element={<TeacherHomework />} />
          <Route path="/teacher/homework/create" element={<CreateHomework />} />

          {/* Announcements Routes (Teacher) */}
          <Route path="/teacher/announcements" element={<TeacherAnnouncements />} />

          {/* Notifications */}
          <Route path="/teacher/notifications" element={<NotificationsPage />} />

          <Route path="/teacher/profile" element={<TeacherProfile />} />
        </Route>

        {/* Student Routes */}
        <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/classes" element={<StudentClasses />} />
          <Route path="/student/attendance" element={<StudentAttendance />} />
          <Route
            path="/student/attendance/history"
            element={<StudentAttendanceHistory />}
          />
          <Route path="/student/results" element={<StudentResults />} />
          <Route path="/student/my-requests" element={<StudentMyRequests />} />
          <Route path="/student/leave/apply" element={<StudentApplyLeave />} />
          <Route path="/student/leave/my" element={<StudentMyLeaves />} />
          <Route path="/student/timetable" element={<StudentTimetable />} />
          <Route path="/student/exam/my-exams" element={<MyExams />} />
          <Route path="/student/homework" element={<StudentHomework />} />
          <Route path="/student/announcements" element={<StudentAnnouncements />} />
          <Route path="/student/notifications" element={<NotificationsPage />} />
          <Route path="/student/profile" element={<StudentProfile />} />
        </Route>

        {/* Parent Routes */}
        <Route element={<ProtectedRoute allowedRoles={["parent"]} />}>
          <Route path="/parent/dashboard" element={<ParentDashboard />} />
          <Route path="/parent/children" element={<ParentChildren />} />
          <Route path="/parent/children/:studentId" element={<ChildProfile />} />
          <Route path="/parent/announcements" element={<ParentAnnouncements />} />
          <Route path="/parent/homework" element={<ParentHomework />} />
          <Route path="/parent/attendance" element={<ParentAttendance />} />
          <Route path="/parent/teachers" element={<ParentTeachers />} />
          <Route path="/parent/timetable" element={<ParentTimetable />} />
          <Route path="/parent/leave/apply" element={<ParentApplyLeave />} />
          <Route path="/parent/leave/history" element={<ParentLeaveHistory />} />
          <Route path="/parent/exam/scheduler" element={<ParentExamSchedule />} />
          <Route path="/parent/exam/results" element={<ParentExamResults />} />
          <Route path="/parent/notifications" element={<NotificationsPage />} />
        </Route>

        {/* 404 Not Found - Catch All */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default MainRouters;

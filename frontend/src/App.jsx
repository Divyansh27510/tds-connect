// import {
//   useCallback,
//   useEffect,
//   useState,
// } from "react"

// import {
//   BrowserRouter,
//   Navigate,
//   Outlet,
//   Route,
//   Routes,
// } from "react-router-dom"

// import { supabase } from "./lib/supabase"

// // ---------------------------------------------------------
// // LAYOUT
// // ---------------------------------------------------------

// import Sidebar from "./components/Sidebar"
// import Navbar from "./components/Navbar"

// // ---------------------------------------------------------
// // GENERAL PAGES
// // ---------------------------------------------------------

// import Dashboard from "./pages/Dashboard"
// import ClassChat from "./pages/ClassChat"
// import Groups from "./pages/Groups"

// // ---------------------------------------------------------
// // STUDENT PAGES
// // ---------------------------------------------------------

// import StudentAssignments from "./pages/StudentAssignments"
// import TaskOverview from "./pages/TaskOverview"
// import TaskDetail from "./pages/TaskDetail"
// import QuestionWorkspace from "./pages/QuestionWorkspace"
// import MyGroup from "./pages/MyGroup"
// import MyGroupTask from "./pages/MyGroupTask"
// import MyGroupProject from "./pages/MyGroupProject"

// // ---------------------------------------------------------
// // ADMIN PAGES
// // ---------------------------------------------------------

// import Assignments from "./pages/Assignments"
// import AdminAnswers from "./pages/AdminAnswers"
// import AdminAssignmentDetail from "./pages/AdminAssignmentDetail"
// import AdminTaskDetail from "./pages/AdminTaskDetail"

// // =========================================================
// // CONSTANTS
// // =========================================================

// const BACKEND_URL =
//   "http://127.0.0.1:8000"

// const FRONTEND_URL =
//   "http://localhost:5173"

// // =========================================================
// // LOADING SCREEN
// // =========================================================

// function AppLoadingScreen() {
//   return (
//     <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
//       <div className="w-full max-w-sm text-center">

//         <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl font-bold shadow-lg shadow-blue-100">
//           T
//         </div>

//         <h1 className="mt-5 text-xl font-bold text-gray-900">
//           TDS Connect
//         </h1>

//         <p className="mt-2 text-sm text-gray-500">
//           Verifying your account...
//         </p>

//         <div className="mt-5 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
//           <div className="h-full w-1/2 bg-blue-600 rounded-full animate-pulse" />
//         </div>

//       </div>
//     </div>
//   )
// }

// // =========================================================
// // LOGIN SCREEN
// // =========================================================

// function LoginScreen({
//   onGoogleLogin,
//   error = "",
// }) {
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center px-6">

//       <div className="w-full max-w-md">

//         <div className="bg-white border border-gray-200 rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden">

//           <div className="p-8 sm:p-10">

//             <div className="flex items-center gap-3">

//               <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-200">
//                 T
//               </div>

//               <div>
//                 <h1 className="text-xl font-bold text-gray-900">
//                   TDS Connect
//                 </h1>

//                 <p className="text-xs text-gray-500">
//                   IIT Madras collaboration workspace
//                 </p>
//               </div>

//             </div>

//             <div className="mt-10">

//               <h2 className="text-3xl font-bold tracking-tight text-gray-900">
//                 Welcome back
//               </h2>

//               <p className="mt-3 text-sm leading-6 text-gray-500">
//                 Collaborate, solve questions, and work
//                 with your assigned group in one place.
//               </p>

//             </div>

//             {error && (
//               <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
//                 <p className="text-sm leading-5 text-red-700">
//                   {error}
//                 </p>
//               </div>
//             )}

//             <button
//               type="button"
//               onClick={onGoogleLogin}
//               className="mt-8 w-full flex items-center justify-center gap-3 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 hover:shadow-md transition-all"
//             >
//               <span className="w-5 h-5 rounded bg-white text-blue-600 flex items-center justify-center text-xs font-bold">
//                 G
//               </span>

//               Continue with Google
//             </button>

//             <p className="mt-5 text-center text-xs leading-5 text-gray-400">
//               Use your authorized IITM student account
//               or administrator account.
//             </p>

//           </div>

//           <div className="border-t border-gray-100 bg-gray-50/70 px-8 py-4">
//             <p className="text-center text-xs text-gray-400">
//               Secure authentication powered by Supabase
//             </p>
//           </div>

//         </div>

//       </div>
//     </div>
//   )
// }

// // =========================================================
// // ACCESS DENIED SCREEN
// // =========================================================

// function AccessDeniedScreen({
//   onGoogleLogin,
// }) {
//   return (
//     <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">

//       <div className="w-full max-w-md">

//         <div className="bg-white border border-gray-200 rounded-3xl shadow-xl p-8 text-center">

//           <div className="mx-auto w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
//             <span className="text-2xl">
//               🔒
//             </span>
//           </div>

//           <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-blue-600">
//             TDS Connect
//           </p>

//           <h1 className="mt-2 text-2xl font-bold text-gray-900">
//             Access Restricted
//           </h1>

//           <p className="mt-3 text-sm leading-6 text-gray-500">
//             This account is not authorized to access
//             TDS Connect.
//           </p>

//           <div className="mt-6 rounded-xl bg-gray-50 border border-gray-100 p-4 text-left">
//             <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
//               Authorized accounts
//             </p>

//             <p className="mt-2 text-sm text-gray-600">
//               IITM student accounts and the registered
//               administrator account can access this
//               workspace.
//             </p>
//           </div>

//           <button
//             type="button"
//             onClick={onGoogleLogin}
//             className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
//           >
//             Sign in with another Google account
//           </button>

//         </div>

//       </div>
//     </div>
//   )
// }

// // =========================================================
// // APPLICATION SHELL
// // =========================================================

// function AppShell({
//   user,
//   backendUser,
//   onLogout,
// }) {
//   const role = backendUser?.role

//   return (
//     <div className="min-h-screen bg-gray-50">

//       <div className="flex min-h-screen">

//         <Sidebar role={role} />

//         <div className="flex-1 min-w-0">

//           <Navbar role={role} />

//           <div className="border-b border-gray-200 bg-white">

//             <div className="px-6 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

//               <div className="min-w-0">

//                 <div className="flex items-center gap-2">

//                   <span className="w-2 h-2 rounded-full bg-green-500" />

//                   <p className="text-xs font-medium text-gray-500">
//                     Authenticated
//                   </p>

//                 </div>

//                 <p className="mt-0.5 text-sm text-gray-700 truncate">
//                   {user?.email}
//                 </p>

//               </div>

//               <div className="flex items-center gap-3">

//                 {role && (
//                   <span
//                     className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
//                       role === "ADMIN"
//                         ? "bg-purple-50 text-purple-700 border-purple-100"
//                         : "bg-blue-50 text-blue-700 border-blue-100"
//                     }`}
//                   >
//                     {role}
//                   </span>
//                 )}

//                 <button
//                   type="button"
//                   onClick={onLogout}
//                   className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
//                 >
//                   Logout
//                 </button>

//               </div>

//             </div>

//           </div>

//           <div className="min-w-0">
//             <Outlet />
//           </div>

//         </div>

//       </div>

//     </div>
//   )
// }

// // =========================================================
// // ROLE GUARDS
// // =========================================================

// function StudentRoute({
//   role,
// }) {
//   if (role !== "STUDENT") {
//     return (
//       <Navigate
//         to="/"
//         replace
//       />
//     )
//   }

//   return <Outlet />
// }

// function AdminRoute({
//   role,
// }) {
//   if (role !== "ADMIN") {
//     return (
//       <Navigate
//         to="/"
//         replace
//       />
//     )
//   }

//   return <Outlet />
// }

// function AuthenticatedRoute() {
//   return <Outlet />
// }

// // =========================================================
// // APP
// // =========================================================

// function App() {
//   const [user, setUser] = useState(null)

//   const [backendUser, setBackendUser] =
//     useState(null)

//   const [loading, setLoading] =
//     useState(true)

//   const [accessDenied, setAccessDenied] =
//     useState(false)

//   const [authError, setAuthError] =
//     useState("")

//   // =======================================================
//   // BACKEND AUTHENTICATION
//   // =======================================================

//   const checkBackendAuthentication =
//     useCallback(async () => {
//       const {
//         data: { session },
//       } = await supabase.auth.getSession()

//       if (!session?.access_token) {
//         return null
//       }

//       try {
//         const response = await fetch(
//           `${BACKEND_URL}/api/me`,
//           {
//             method: "GET",
//             headers: {
//               Authorization:
//                 `Bearer ${session.access_token}`,
//             },
//           }
//         )

//         if (!response.ok) {
//           const errorData =
//             await response
//               .json()
//               .catch(() => null)

//           console.error(
//             "Backend authentication failed:",
//             errorData?.detail ||
//               response.status
//           )

//           return null
//         }

//         const data =
//           await response.json()

//         setBackendUser(data)

//         return data
//       } catch (error) {
//         console.error(
//           "Backend connection error:",
//           error
//         )

//         return null
//       }
//     }, [])

//   // =======================================================
//   // COMPLETE USER CHECK
//   // =======================================================

//   const checkUser = useCallback(
//     async (currentUser) => {
//       if (!currentUser) {
//         setUser(null)
//         setBackendUser(null)
//         setAccessDenied(false)
//         setLoading(false)
//         return
//       }

//       setUser(currentUser)
//       setAuthError("")

//       const backendUserData =
//         await checkBackendAuthentication()

//       if (!backendUserData) {
//         setUser(null)
//         setBackendUser(null)
//         setAccessDenied(true)
//         setLoading(false)
//         return
//       }

//       setAccessDenied(false)
//       setLoading(false)
//     },
//     [checkBackendAuthentication]
//   )

//   // =======================================================
//   // AUTH INITIALIZATION
//   // =======================================================

//   useEffect(() => {
//     let mounted = true

//     const initializeAuth =
//       async () => {
//         try {
//           const {
//             data: { user: currentUser },
//           } =
//             await supabase.auth.getUser()

//           if (!mounted) {
//             return
//           }

//           await checkUser(
//             currentUser
//           )
//         } catch (error) {
//           console.error(
//             "Initial authentication error:",
//             error
//           )

//           if (mounted) {
//             setAuthError(
//               "Unable to initialize authentication."
//             )

//             setLoading(false)
//           }
//         }
//       }

//     initializeAuth()

//     const {
//       data: { subscription },
//     } =
//       supabase.auth.onAuthStateChange(
//         async (
//           _event,
//           session
//         ) => {
//           if (!mounted) {
//             return
//           }

//           await checkUser(
//             session?.user ?? null
//           )
//         }
//       )

//     return () => {
//       mounted = false
//       subscription.unsubscribe()
//     }
//   }, [checkUser])

//   // =======================================================
//   // GOOGLE LOGIN
//   // =======================================================

//   const handleGoogleLogin =
//     async () => {
//       setAuthError("")
//       setAccessDenied(false)

//       const { error } =
//         await supabase.auth.signInWithOAuth(
//           {
//             provider: "google",

//             options: {
//               redirectTo:
//                 FRONTEND_URL,
//             },
//           }
//         )

//       if (error) {
//         console.error(
//           "Google login error:",
//           error.message
//         )

//         setAuthError(
//           error.message ||
//             "Unable to start Google sign-in."
//         )
//       }
//     }

//   // =======================================================
//   // LOGOUT
//   // =======================================================

//   const handleLogout =
//     async () => {
//       try {
//         await supabase.auth.signOut()
//       } catch (error) {
//         console.error(
//           "Logout error:",
//           error
//         )
//       } finally {
//         setUser(null)
//         setBackendUser(null)
//         setAccessDenied(false)
//         setAuthError("")
//       }
//     }

//   // =======================================================
//   // LOADING
//   // =======================================================

//   if (loading) {
//     return <AppLoadingScreen />
//   }

//   // =======================================================
//   // ACCESS DENIED
//   // =======================================================

//   if (accessDenied) {
//     return (
//       <AccessDeniedScreen
//         onGoogleLogin={
//           handleGoogleLogin
//         }
//       />
//     )
//   }

//   // =======================================================
//   // LOGIN
//   // =======================================================

//   if (!user) {
//     return (
//       <LoginScreen
//         onGoogleLogin={
//           handleGoogleLogin
//         }
//         error={authError}
//       />
//     )
//   }

//   // =======================================================
//   // AUTHENTICATED APPLICATION
//   // =======================================================

//   return (
//     <BrowserRouter>

//       <Routes>

//         {/* =================================================
//             APPLICATION SHELL
//         ================================================= */}

//         <Route
//           element={
//             <AppShell
//               user={user}
//               backendUser={backendUser}
//               onLogout={handleLogout}
//             />
//           }
//         >

//           <Route
//             element={
//               <AuthenticatedRoute />
//             }
//           >

//             {/* =============================================
//                 GENERAL
//             ============================================= */}

//             <Route
//               path="/"
//               element={
//                 <Dashboard />
//               }
//             />

//             <Route
//               path="/class-chat"
//               element={
//                 <ClassChat />
//               }
//             />

//             {/* =============================================
//                 ASSIGNMENTS
//             ============================================= */}

//             <Route
//               path="/assignments"
//               element={
//                 backendUser?.role === "ADMIN"
//                   ? <Assignments />
//                   : <StudentAssignments />
//               }
//             />

//             {/* =============================================
//                 STUDENT ROUTES
//             ============================================= */}

//             <Route
//               element={
//                 <StudentRoute
//                   role={
//                     backendUser?.role
//                   }
//                 />
//               }
//             >

//               {/* =========================================
//                   GENERAL STUDENT TASK FLOW
//               ========================================= */}

//               <Route
//                 path="/assignments/task/:parentTaskId"
//                 element={
//                   <TaskOverview />
//                 }
//               />

//               <Route
//                 path="/assignments/:assignmentId"
//                 element={
//                   <TaskDetail />
//                 }
//               />

//               {/* =========================================
//                   MY GROUP - LEVEL 1

//                   /my-group
//                   Shows ONLY main task cards.
//               ========================================= */}

//               <Route
//                 path="/my-group"
//                 element={
//                   <MyGroup />
//                 }
//               />

//               {/* =========================================
//                   MY GROUP - LEVEL 2

//                   /my-group/task/:parentTaskId
//                   Shows ONLY subsection cards.
//               ========================================= */}

//               <Route
//                 path="/my-group/task/:parentTaskId"
//                 element={
//                   <MyGroupTask />
//                 }
//               />

//               {/* =========================================
//                   MY GROUP - LEVEL 3

//                   /my-group/:assignmentId
//                   Shows assigned questions.
//               ========================================= */}

//               <Route
//                 path="/my-group/:assignmentId"
//                 element={
//                   <MyGroupProject />
//                 }
//               />

//             </Route>

//             {/* =============================================
//                 ADMIN ROUTES
//             ============================================= */}

//             <Route
//               element={
//                 <AdminRoute
//                   role={
//                     backendUser?.role
//                   }
//                 />
//               }
//             >

//               <Route
//                 path="/admin/assignments/:assignmentId"
//                 element={
//                   <AdminAssignmentDetail />
//                 }
//               />

//               <Route
//                 path="/admin-answers"
//                 element={
//                   <AdminAnswers />
//                 }
//               />

//               <Route
//                 path="/admin-answers/:assignmentId"
//                 element={
//                   <AdminTaskDetail />
//                 }
//               />

//               <Route
//                 path="/groups"
//                 element={
//                   <Groups />
//                 }
//               />

//             </Route>

//             {/* =============================================
//                 QUESTION WORKSPACE

//                 Level 4:
//                 Question → Solution Workspace
//             ============================================= */}

//             <Route
//               path="/questions/:questionId"
//               element={
//                 backendUser?.role === "STUDENT" ||
//                 backendUser?.role === "ADMIN" ? (
//                   <QuestionWorkspace />
//                 ) : (
//                   <Navigate
//                     to="/"
//                     replace
//                   />
//                 )
//               }
//             />

//             {/* =============================================
//                 UNKNOWN ROUTE
//             ============================================= */}

//             <Route
//               path="*"
//               element={
//                 <Navigate
//                   to="/"
//                   replace
//                 />
//               }
//             />

//           </Route>

//         </Route>

//       </Routes>

//     </BrowserRouter>
//   )
// }

// export default App











import {
  useCallback,
  useEffect,
  useState,
} from "react"

import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom"

import { supabase } from "./lib/supabase"

// ---------------------------------------------------------
// LAYOUT
// ---------------------------------------------------------

import Sidebar from "./components/Sidebar"
import Navbar from "./components/Navbar"

// ---------------------------------------------------------
// GENERAL PAGES
// ---------------------------------------------------------

import Dashboard from "./pages/Dashboard"
import ClassChat from "./pages/ClassChat"
import Groups from "./pages/Groups"

// ---------------------------------------------------------
// STUDENT PAGES
// ---------------------------------------------------------

import StudentAssignments from "./pages/StudentAssignments"
import TaskOverview from "./pages/TaskOverview"
import TaskDetail from "./pages/TaskDetail"
import QuestionWorkspace from "./pages/QuestionWorkspace"
import MyGroup from "./pages/MyGroup"
import MyGroupTask from "./pages/MyGroupTask"
import MyGroupProject from "./pages/MyGroupProject"

// ---------------------------------------------------------
// ADMIN PAGES
// ---------------------------------------------------------

import Assignments from "./pages/Assignments"
import AdminAnswers from "./pages/AdminAnswers"
import AdminAssignmentDetail from "./pages/AdminAssignmentDetail"
import AdminTaskDetail from "./pages/AdminTaskDetail"

// =========================================================
// CONSTANTS
// =========================================================

const BACKEND_URL =
  "http://127.0.0.1:8000"

const FRONTEND_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:5173"

// =========================================================
// LOADING SCREEN
// =========================================================

function AppLoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">

        <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl font-bold shadow-lg shadow-blue-100">
          T
        </div>

        <h1 className="mt-5 text-xl font-bold text-gray-900">
          TDS Connect
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Verifying your account...
        </p>

        <div className="mt-5 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full w-1/2 bg-blue-600 rounded-full animate-pulse" />
        </div>

      </div>
    </div>
  )
}

// =========================================================
// LOGIN SCREEN
// =========================================================

function LoginScreen({
  onGoogleLogin,
  error = "",
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center px-6">

      <div className="w-full max-w-md">

        <div className="bg-white border border-gray-200 rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden">

          <div className="p-8 sm:p-10">

            <div className="flex items-center gap-3">

              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-200">
                T
              </div>

              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  TDS Connect
                </h1>

                <p className="text-xs text-gray-500">
                  IIT Madras collaboration workspace
                </p>
              </div>

            </div>

            <div className="mt-10">

              <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                Welcome back
              </h2>

              <p className="mt-3 text-sm leading-6 text-gray-500">
                Collaborate, solve questions, and work
                with your assigned group in one place.
              </p>

            </div>

            {error && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm leading-5 text-red-700">
                  {error}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={onGoogleLogin}
              className="mt-8 w-full flex items-center justify-center gap-3 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 hover:shadow-md transition-all"
            >
              <span className="w-5 h-5 rounded bg-white text-blue-600 flex items-center justify-center text-xs font-bold">
                G
              </span>

              Continue with Google
            </button>

            <p className="mt-5 text-center text-xs leading-5 text-gray-400">
              Use your authorized IITM student account
              or administrator account.
            </p>

          </div>

          <div className="border-t border-gray-100 bg-gray-50/70 px-8 py-4">
            <p className="text-center text-xs text-gray-400">
              Secure authentication powered by Supabase
            </p>
          </div>

        </div>

      </div>
    </div>
  )
}

// =========================================================
// ACCESS DENIED SCREEN
// =========================================================

function AccessDeniedScreen({
  onGoogleLogin,
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">

      <div className="w-full max-w-md">

        <div className="bg-white border border-gray-200 rounded-3xl shadow-xl p-8 text-center">

          <div className="mx-auto w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
            <span className="text-2xl">
              🔒
            </span>
          </div>

          <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-blue-600">
            TDS Connect
          </p>

          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            Access Restricted
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-500">
            This account is not authorized to access
            TDS Connect.
          </p>

          <div className="mt-6 rounded-xl bg-gray-50 border border-gray-100 p-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Authorized accounts
            </p>

            <p className="mt-2 text-sm text-gray-600">
              IITM student accounts and the registered
              administrator account can access this
              workspace.
            </p>
          </div>

          <button
            type="button"
            onClick={onGoogleLogin}
            className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Sign in with another Google account
          </button>

        </div>

      </div>
    </div>
  )
}

// =========================================================
// APPLICATION SHELL
// =========================================================

function AppShell({
  user,
  backendUser,
  onLogout,
}) {
  const role = backendUser?.role

  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <Sidebar
        role={role}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        onLogout={onLogout}
      />

      <div
        className="
          min-h-screen
          min-w-0
          overflow-x-hidden
          lg:ml-[272px]
        "
      >
        <Navbar
          role={role}
          user={user}
          onLogout={onLogout}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="min-w-0 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

// =========================================================
// ROLE GUARDS
// =========================================================

function StudentRoute({
  role,
}) {
  if (role !== "STUDENT") {
    return (
      <Navigate
        to="/"
        replace
      />
    )
  }

  return <Outlet />
}

function AdminRoute({
  role,
}) {
  if (role !== "ADMIN") {
    return (
      <Navigate
        to="/"
        replace
      />
    )
  }

  return <Outlet />
}

function AuthenticatedRoute() {
  return <Outlet />
}

// =========================================================
// APP
// =========================================================

function App() {
  const [user, setUser] = useState(null)

  const [backendUser, setBackendUser] =
    useState(null)

  const [loading, setLoading] =
    useState(true)

  const [accessDenied, setAccessDenied] =
    useState(false)

  const [authError, setAuthError] =
    useState("")

  // =======================================================
  // BACKEND AUTHENTICATION
  // =======================================================

  const checkBackendAuthentication =
    useCallback(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        return null
      }

      try {
        const response = await fetch(
          `${BACKEND_URL}/api/me`,
          {
            method: "GET",
            headers: {
              Authorization:
                `Bearer ${session.access_token}`,
            },
          }
        )

        if (!response.ok) {
          const errorData =
            await response
              .json()
              .catch(() => null)

          console.error(
            "Backend authentication failed:",
            errorData?.detail ||
              response.status
          )

          return null
        }

        const data =
          await response.json()

        setBackendUser(data)

        return data
      } catch (error) {
        console.error(
          "Backend connection error:",
          error
        )

        return null
      }
    }, [])

  // =======================================================
  // COMPLETE USER CHECK
  // =======================================================

  const checkUser = useCallback(
    async (currentUser) => {
      if (!currentUser) {
        setUser(null)
        setBackendUser(null)
        setAccessDenied(false)
        setLoading(false)
        return
      }

      setUser(currentUser)
      setAuthError("")

      const backendUserData =
        await checkBackendAuthentication()

      if (!backendUserData) {
        setUser(null)
        setBackendUser(null)
        setAccessDenied(true)
        setLoading(false)
        return
      }

      setAccessDenied(false)
      setLoading(false)
    },
    [checkBackendAuthentication]
  )

  // =======================================================
  // AUTH INITIALIZATION
  // =======================================================

  useEffect(() => {
    let mounted = true

    const initializeAuth =
      async () => {
        try {
          const {
            data: { user: currentUser },
          } =
            await supabase.auth.getUser()

          if (!mounted) {
            return
          }

          await checkUser(
            currentUser
          )
        } catch (error) {
          console.error(
            "Initial authentication error:",
            error
          )

          if (mounted) {
            setAuthError(
              "Unable to initialize authentication."
            )

            setLoading(false)
          }
        }
      }

    initializeAuth()

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        async (
          _event,
          session
        ) => {
          if (!mounted) {
            return
          }

          await checkUser(
            session?.user ?? null
          )
        }
      )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [checkUser])

  // =======================================================
  // GOOGLE LOGIN
  // =======================================================

  const handleGoogleLogin =
    async () => {
      setAuthError("")
      setAccessDenied(false)

      const { error } =
        await supabase.auth.signInWithOAuth(
          {
            provider: "google",

            options: {
              redirectTo:
                FRONTEND_URL,
            },
          }
        )

      if (error) {
        console.error(
          "Google login error:",
          error.message
        )

        setAuthError(
          error.message ||
            "Unable to start Google sign-in."
        )
      }
    }

  // =======================================================
  // LOGOUT
  // =======================================================

  const handleLogout =
    async () => {
      try {
        await supabase.auth.signOut()
      } catch (error) {
        console.error(
          "Logout error:",
          error
        )
      } finally {
        setUser(null)
        setBackendUser(null)
        setAccessDenied(false)
        setAuthError("")
      }
    }

  // =======================================================
  // LOADING
  // =======================================================

  if (loading) {
    return <AppLoadingScreen />
  }

  // =======================================================
  // ACCESS DENIED
  // =======================================================

  if (accessDenied) {
    return (
      <AccessDeniedScreen
        onGoogleLogin={
          handleGoogleLogin
        }
      />
    )
  }

  // =======================================================
  // LOGIN
  // =======================================================

  if (!user) {
    return (
      <LoginScreen
        onGoogleLogin={
          handleGoogleLogin
        }
        error={authError}
      />
    )
  }

  // =======================================================
  // AUTHENTICATED APPLICATION
  // =======================================================

  return (
    <BrowserRouter>

      <Routes>

        {/* =================================================
            APPLICATION SHELL
        ================================================= */}

        <Route
          element={
            <AppShell
              user={user}
              backendUser={backendUser}
              onLogout={handleLogout}
            />
          }
        >

          <Route
            element={
              <AuthenticatedRoute />
            }
          >

            {/* =============================================
                GENERAL
            ============================================= */}

            <Route
              path="/"
              element={
                <Dashboard />
              }
            />

            <Route
              path="/class-chat"
              element={
                <ClassChat />
              }
            />

            {/* =============================================
                ASSIGNMENTS
            ============================================= */}

            <Route
              path="/assignments"
              element={
                backendUser?.role === "ADMIN"
                  ? <Assignments />
                  : <StudentAssignments />
              }
            />

            {/* =============================================
                STUDENT ROUTES
            ============================================= */}

            <Route
              element={
                <StudentRoute
                  role={
                    backendUser?.role
                  }
                />
              }
            >

              {/* =========================================
                  GENERAL STUDENT TASK FLOW
              ========================================= */}

              <Route
                path="/assignments/task/:parentTaskId"
                element={
                  <TaskOverview />
                }
              />

              <Route
                path="/assignments/:assignmentId"
                element={
                  <TaskDetail />
                }
              />

              {/* =========================================
                  MY GROUP - LEVEL 1

                  /my-group
                  Shows ONLY main task cards.
              ========================================= */}

              <Route
                path="/my-group"
                element={
                  <MyGroup />
                }
              />

              {/* =========================================
                  MY GROUP - LEVEL 2

                  /my-group/task/:parentTaskId
                  Shows ONLY subsection cards.
              ========================================= */}

              <Route
                path="/my-group/task/:parentTaskId"
                element={
                  <MyGroupTask />
                }
              />

              {/* =========================================
                  MY GROUP - LEVEL 3

                  /my-group/:assignmentId
                  Shows assigned questions.
              ========================================= */}

              <Route
                path="/my-group/:assignmentId"
                element={
                  <MyGroupProject />
                }
              />

            </Route>

            {/* =============================================
                ADMIN ROUTES
            ============================================= */}

            <Route
              element={
                <AdminRoute
                  role={
                    backendUser?.role
                  }
                />
              }
            >

              <Route
                path="/admin/assignments/:assignmentId"
                element={
                  <AdminAssignmentDetail />
                }
              />

              <Route
                path="/admin-answers"
                element={
                  <AdminAnswers />
                }
              />

              <Route
                path="/admin-answers/:assignmentId"
                element={
                  <AdminTaskDetail />
                }
              />

              <Route
                path="/groups"
                element={
                  <Groups />
                }
              />

            </Route>

            {/* =============================================
                QUESTION WORKSPACE

                Level 4:
                Question → Solution Workspace
            ============================================= */}

            <Route
              path="/questions/:questionId"
              element={
                backendUser?.role === "STUDENT" ||
                backendUser?.role === "ADMIN" ? (
                  <QuestionWorkspace />
                ) : (
                  <Navigate
                    to="/"
                    replace
                  />
                )
              }
            />

            {/* =============================================
                UNKNOWN ROUTE
            ============================================= */}

            <Route
              path="*"
              element={
                <Navigate
                  to="/"
                  replace
                />
              }
            />

          </Route>

        </Route>

      </Routes>

    </BrowserRouter>
  )
}

export default App
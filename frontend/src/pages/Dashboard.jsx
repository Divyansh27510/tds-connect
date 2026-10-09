// import { useEffect, useState } from "react"
// import { supabase } from "../lib/supabase"
// import DashboardCard from "../components/DashboardCard"

// function Dashboard() {
//   const [assignmentCount, setAssignmentCount] = useState(0)
//   const [groupName, setGroupName] = useState("-")
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     const fetchDashboardData = async () => {
//       setLoading(true)

//       const {
//         data: { user },
//         error: userError,
//       } = await supabase.auth.getUser()

//       if (userError || !user) {
//         setLoading(false)
//         return
//       }

//       // Fetch assignments count
//       const { count, error: assignmentError } = await supabase
//         .from("assignments")
//         .select("id", {
//           count: "exact",
//           head: true,
//         })

//       if (assignmentError) {
//         console.error(
//           "Assignment count error:",
//           assignmentError
//         )
//       } else {
//         setAssignmentCount(count || 0)
//       }

//       // Fetch user's active group
//       const { data: membership, error: groupError } =
//         await supabase
//           .from("group_members")
//           .select(`
//             group_id,
//             groups (
//               name
//             )
//           `)
//           .eq("user_id", user.id)
//           .eq("is_active", true)
//           .maybeSingle()

//       if (groupError) {
//         console.error(
//           "Dashboard group error:",
//           groupError
//         )
//       } else if (membership?.groups) {
//         setGroupName(membership.groups.name)
//       }

//       setLoading(false)
//     }

//     fetchDashboardData()
//   }, [])

//   return (
//     <main className="p-8">

//       <h2 className="text-3xl font-bold text-gray-800">
//         Welcome to TDS Connect 👋
//       </h2>

//       <p className="mt-2 text-gray-600">
//         Collaborate, solve, and learn together.
//       </p>

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">

//         <DashboardCard
//           title="Assignments"
//           value={loading ? "..." : assignmentCount}
//         />

//         <DashboardCard
//           title="My Group"
//           value={loading ? "..." : groupName}
//         />

//         <DashboardCard
//           title="Participation"
//           value="0%"
//         />

//       </div>

//     </main>
//   )
// }

// export default Dashboard








// import { useEffect, useState } from "react"
// import { useNavigate } from "react-router-dom"
// import { supabase } from "../lib/supabase"

// // =========================================================
// // DASHBOARD
// // =========================================================

// function Dashboard() {
//   const navigate = useNavigate()

//   const [assignmentCount, setAssignmentCount] =
//     useState(0)

//   const [participation, setParticipation] =
//     useState(0)

//   const [assignedQuestions, setAssignedQuestions] =
//     useState(0)

//   const [solvedQuestions, setSolvedQuestions] =
//     useState(0)

//   const [loading, setLoading] =
//     useState(true)

//   // =======================================================
//   // FETCH DASHBOARD DATA
//   // =======================================================

//   useEffect(() => {
//     let mounted = true

//     const fetchDashboardData = async () => {
//       setLoading(true)

//       try {
//         // ==================================================
//         // CURRENT USER
//         // ==================================================

//         const {
//           data: { user },
//           error: userError,
//         } = await supabase.auth.getUser()

//         if (userError || !user) {
//           return
//         }

//         // ==================================================
//         // 1. ASSIGNMENT COUNT
//         // ==================================================

//         const {
//           count,
//           error: assignmentError,
//         } = await supabase
//           .from("assignments")
//           .select("id", {
//             count: "exact",
//             head: true,
//           })

//         if (assignmentError) {
//           console.error(
//             "Dashboard assignment count error:",
//             assignmentError
//           )
//         } else if (mounted) {
//           setAssignmentCount(count || 0)
//         }

//         // ==================================================
//         // 2. ALL ACTIVE ASSIGNMENT MEMBERSHIPS
//         //
//         // Important:
//         // A student can belong to multiple assignments.
//         // Therefore dashboard should not use only the latest
//         // membership.
//         // ==================================================

//         const {
//           data: memberships,
//           error: membershipError,
//         } = await supabase
//           .from("assignment_group_members")
//           .select(`
//             id,
//             assignment_id,
//             group_id
//           `)
//           .eq("user_id", user.id)
//           .eq("is_active", true)

//         if (membershipError) {
//           console.error(
//             "Dashboard membership error:",
//             membershipError
//           )

//           if (mounted) {
//             setAssignedQuestions(0)
//             setSolvedQuestions(0)
//             setParticipation(0)
//           }

//           return
//         }

//         if (
//           !memberships ||
//           memberships.length === 0
//         ) {
//           if (mounted) {
//             setAssignedQuestions(0)
//             setSolvedQuestions(0)
//             setParticipation(0)
//           }

//           return
//         }

//         // ==================================================
//         // UNIQUE GROUP IDS
//         // ==================================================

//         const groupIds = [
//           ...new Set(
//             memberships
//               .map(
//                 (membership) =>
//                   membership.group_id
//               )
//               .filter(Boolean)
//           ),
//         ]

//         if (groupIds.length === 0) {
//           if (mounted) {
//             setAssignedQuestions(0)
//             setSolvedQuestions(0)
//             setParticipation(0)
//           }

//           return
//         }

//         // ==================================================
//         // 3. QUESTIONS ASSIGNED TO MY GROUPS
//         // ==================================================

//         const {
//           data: questionAssignments,
//           error: questionAssignmentError,
//         } = await supabase
//           .from("question_assignments")
//           .select(`
//             question_id,
//             group_id
//           `)
//           .in("group_id", groupIds)
//           .eq("is_active", true)

//         if (questionAssignmentError) {
//           console.error(
//             "Dashboard question assignment error:",
//             questionAssignmentError
//           )

//           if (mounted) {
//             setAssignedQuestions(0)
//             setSolvedQuestions(0)
//             setParticipation(0)
//           }

//           return
//         }

//         const assignedQuestionIds = [
//           ...new Set(
//             (questionAssignments || [])
//               .map(
//                 (item) =>
//                   item.question_id
//               )
//               .filter(Boolean)
//           ),
//         ]

//         const assignedCount =
//           assignedQuestionIds.length

//         if (mounted) {
//           setAssignedQuestions(
//             assignedCount
//           )
//         }

//         // ==================================================
//         // NO QUESTIONS
//         // ==================================================

//         if (assignedCount === 0) {
//           if (mounted) {
//             setSolvedQuestions(0)
//             setParticipation(0)
//           }

//           return
//         }

//         // ==================================================
//         // 4. FETCH MY SUBMISSIONS
//         // ==================================================

//         const {
//           data: submissions,
//           error: submissionError,
//         } = await supabase
//           .from("submissions")
//           .select(`
//             question_id,
//             status
//           `)
//           .eq(
//             "submitted_by",
//             user.id
//           )
//           .in(
//             "question_id",
//             assignedQuestionIds
//           )
//           .eq(
//             "status",
//             "SUBMITTED"
//           )

//         if (submissionError) {
//           console.error(
//             "Dashboard submission error:",
//             submissionError
//           )

//           if (mounted) {
//             setSolvedQuestions(0)
//             setParticipation(0)
//           }

//           return
//         }

//         // ==================================================
//         // 5. UNIQUE SOLVED QUESTIONS
//         // ==================================================

//         const solvedQuestionIds = [
//           ...new Set(
//             (submissions || [])
//               .map(
//                 (submission) =>
//                   submission.question_id
//               )
//               .filter(Boolean)
//           ),
//         ]

//         const solvedCount =
//           solvedQuestionIds.length

//         // ==================================================
//         // 6. PARTICIPATION
//         // ==================================================

//         const participationPercentage =
//           assignedCount > 0
//             ? Math.min(
//                 100,
//                 Math.round(
//                   (solvedCount /
//                     assignedCount) *
//                     100
//                 )
//               )
//             : 0

//         if (mounted) {
//           setSolvedQuestions(
//             solvedCount
//           )

//           setParticipation(
//             participationPercentage
//           )
//         }
//       } catch (error) {
//         console.error(
//           "Dashboard error:",
//           error
//         )

//         if (mounted) {
//           setAssignedQuestions(0)
//           setSolvedQuestions(0)
//           setParticipation(0)
//         }
//       } finally {
//         if (mounted) {
//           setLoading(false)
//         }
//       }
//     }

//     fetchDashboardData()

//     return () => {
//       mounted = false
//     }
//   }, [])

//   // =======================================================
//   // STAT CARD
//   // =======================================================

//   const StatCard = ({
//     label,
//     value,
//     description,
//     icon,
//     iconClass,
//   }) => {
//     return (
//       <div
//         className="
//           group
//           relative
//           overflow-hidden
//           rounded-3xl
//           border
//           border-slate-200
//           bg-white
//           p-6
//           shadow-sm
//           transition-all
//           duration-300
//           hover:-translate-y-1
//           hover:border-indigo-200
//           hover:shadow-xl
//           hover:shadow-slate-200/50
//         "
//       >
//         {/* subtle hover glow */}

//         <div
//           className="
//             pointer-events-none
//             absolute
//             -right-12
//             -top-12
//             h-28
//             w-28
//             rounded-full
//             bg-indigo-50
//             opacity-0
//             blur-2xl
//             transition-opacity
//             duration-500
//             group-hover:opacity-100
//           "
//         />

//         <div className="relative flex items-start justify-between gap-4">

//           <div>
//             <p className="text-sm font-medium text-slate-500">
//               {label}
//             </p>

//             <p
//               className="
//                 mt-3
//                 text-4xl
//                 font-bold
//                 tracking-tight
//                 text-slate-950
//               "
//             >
//               {loading ? (
//                 <span className="inline-block h-10 w-16 animate-pulse rounded-lg bg-slate-100" />
//               ) : (
//                 value
//               )}
//             </p>

//             <p className="mt-2 text-sm leading-5 text-slate-400">
//               {description}
//             </p>
//           </div>

//           <div
//             className={`
//               flex
//               h-12
//               w-12
//               shrink-0
//               items-center
//               justify-center
//               rounded-2xl
//               text-lg
//               transition-transform
//               duration-300
//               group-hover:scale-110
//               ${iconClass}
//             `}
//           >
//             {icon}
//           </div>

//         </div>
//       </div>
//     )
//   }

//   // =======================================================
//   // UI
//   // =======================================================

//   return (
//     <main className="min-h-screen bg-[#f8fafc]">

//       <div className="mx-auto max-w-7xl px-5 py-7 sm:px-6 lg:px-8 lg:py-9">

//         {/* =================================================
//             HERO
//         ================================================== */}

//         <section
//           className="
//             relative
//             overflow-hidden
//             rounded-[2rem]
//             border
//             border-slate-200
//             bg-white
//             shadow-sm
//           "
//         >

//           {/* Background decoration */}

//           <div
//             className="
//               pointer-events-none
//               absolute
//               -right-20
//               -top-24
//               h-72
//               w-72
//               rounded-full
//               bg-indigo-100/60
//               blur-3xl
//               animate-[pulse_5s_ease-in-out_infinite]
//             "
//           />

//           <div
//             className="
//               pointer-events-none
//               absolute
//               -bottom-28
//               left-1/3
//               h-64
//               w-64
//               rounded-full
//               bg-blue-100/40
//               blur-3xl
//             "
//           />

//           <div
//             className="
//               relative
//               grid
//               gap-8
//               px-6
//               py-8
//               sm:px-8
//               sm:py-10
//               lg:grid-cols-[1fr_auto]
//               lg:items-center
//               lg:px-10
//               lg:py-11
//             "
//           >

//             {/* Hero content */}

//             <div>

//               <div
//                 className="
//                   inline-flex
//                   items-center
//                   gap-2
//                   rounded-full
//                   border
//                   border-indigo-100
//                   bg-indigo-50
//                   px-3.5
//                   py-1.5
//                   text-xs
//                   font-semibold
//                   text-indigo-700
//                   animate-[fadeIn_0.5s_ease-out]
//                 "
//               >
//                 <span className="relative flex h-2 w-2">
//                   <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-60" />
//                   <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
//                 </span>

//                 TDS Connect
//               </div>

//               <h1
//                 className="
//                   mt-5
//                   max-w-3xl
//                   text-3xl
//                   font-bold
//                   tracking-tight
//                   text-slate-950
//                   sm:text-4xl
//                   lg:text-5xl
//                   animate-[fadeInUp_0.6s_ease-out]
//                 "
//               >
//                 Your TDS workspace,
//                 <span className="text-indigo-600">
//                   {" "}all in one place.
//                 </span>
//               </h1>

//               <p
//                 className="
//                   mt-4
//                   max-w-2xl
//                   text-sm
//                   leading-6
//                   text-slate-500
//                   sm:text-base
//                   animate-[fadeInUp_0.7s_ease-out]
//                 "
//               >
//                 Manage your assignments, access assigned
//                 questions, collaborate with your group, and
//                 submit your solutions from one workspace.
//               </p>

//               {/* CTA */}

//               <div
//                 className="
//                   mt-7
//                   flex
//                   flex-col
//                   gap-3
//                   sm:flex-row
//                   animate-[fadeInUp_0.8s_ease-out]
//                 "
//               >

//                 <button
//                   type="button"
//                   onClick={() =>
//                     navigate("/assignments")
//                   }
//                   className="
//                     inline-flex
//                     items-center
//                     justify-center
//                     gap-2
//                     rounded-xl
//                     bg-indigo-600
//                     px-5
//                     py-3
//                     text-sm
//                     font-semibold
//                     text-white
//                     shadow-sm
//                     shadow-indigo-200
//                     transition-all
//                     duration-200
//                     hover:-translate-y-0.5
//                     hover:bg-indigo-700
//                     hover:shadow-lg
//                     hover:shadow-indigo-200
//                     active:translate-y-0
//                   "
//                 >
//                   View assignments

//                   <span className="text-base">
//                     →
//                   </span>
//                 </button>

//                 <button
//                   type="button"
//                   onClick={() =>
//                     navigate("/my-group")
//                   }
//                   className="
//                     inline-flex
//                     items-center
//                     justify-center
//                     gap-2
//                     rounded-xl
//                     border
//                     border-slate-200
//                     bg-white
//                     px-5
//                     py-3
//                     text-sm
//                     font-semibold
//                     text-slate-700
//                     transition-all
//                     duration-200
//                     hover:-translate-y-0.5
//                     hover:border-indigo-200
//                     hover:bg-indigo-50
//                     hover:text-indigo-700
//                     active:translate-y-0
//                   "
//                 >
//                   Open My Group

//                   <span className="text-base">
//                     →
//                   </span>
//                 </button>

//               </div>

//             </div>

//             {/* Workspace visual */}

//             <div
//               className="
//                 hidden
//                 lg:flex
//                 lg:h-52
//                 lg:w-52
//                 xl:h-56
//                 xl:w-56
//                 items-center
//                 justify-center
//               "
//             >

//               <div
//                 className="
//                   relative
//                   flex
//                   h-44
//                   w-44
//                   items-center
//                   justify-center
//                   rounded-[2rem]
//                   border
//                   border-indigo-100
//                   bg-gradient-to-br
//                   from-indigo-50
//                   via-white
//                   to-blue-50
//                   shadow-xl
//                   shadow-indigo-100/60
//                   animate-[float_4s_ease-in-out_infinite]
//                 "
//               >

//                 {/* orbit */}

//                 <div
//                   className="
//                     absolute
//                     inset-4
//                     rounded-[1.5rem]
//                     border
//                     border-dashed
//                     border-indigo-200
//                   "
//                 />

//                 <div
//                   className="
//                     flex
//                     h-20
//                     w-20
//                     items-center
//                     justify-center
//                     rounded-3xl
//                     bg-indigo-600
//                     text-3xl
//                     text-white
//                     shadow-xl
//                     shadow-indigo-200
//                   "
//                 >
//                   T
//                 </div>

//                 <div
//                   className="
//                     absolute
//                     right-2
//                     top-5
//                     flex
//                     h-8
//                     w-8
//                     items-center
//                     justify-center
//                     rounded-xl
//                     bg-white
//                     text-sm
//                     shadow-md
//                   "
//                 >
//                   ✓
//                 </div>

//                 <div
//                   className="
//                     absolute
//                     bottom-5
//                     left-1
//                     flex
//                     h-8
//                     w-8
//                     items-center
//                     justify-center
//                     rounded-xl
//                     bg-white
//                     text-sm
//                     shadow-md
//                   "
//                 >
//                   ?
//                 </div>

//               </div>

//             </div>

//           </div>

//         </section>

//         {/* =================================================
//             STATS
//         ================================================== */}

//         <section className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">

//           <StatCard
//             label="Assignments"
//             value={assignmentCount}
//             description="Tasks currently available in your workspace"
//             icon="▦"
//             iconClass="bg-indigo-50 text-indigo-600"
//           />

//           <StatCard
//             label="Participation"
//             value={`${participation}%`}
//             description={
//               assignedQuestions > 0
//                 ? `${solvedQuestions} of ${assignedQuestions} assigned questions submitted`
//                 : "No questions have been assigned yet"
//             }
//             icon="↗"
//             iconClass="bg-emerald-50 text-emerald-600"
//           />

//         </section>

//         {/* =================================================
//             PROGRESS
//         ================================================== */}

//         <section
//           className="
//             mt-6
//             overflow-hidden
//             rounded-3xl
//             border
//             border-slate-200
//             bg-white
//             p-6
//             shadow-sm
//             sm:p-7
//           "
//         >

//           <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

//             <div>

//               <div className="flex items-center gap-3">

//                 <div
//                   className="
//                     flex
//                     h-10
//                     w-10
//                     items-center
//                     justify-center
//                     rounded-xl
//                     bg-emerald-50
//                     text-lg
//                     text-emerald-600
//                   "
//                 >
//                   ✓
//                 </div>

//                 <div>

//                   <h2 className="text-base font-bold text-slate-900">
//                     Your progress
//                   </h2>

//                   <p className="mt-0.5 text-sm text-slate-500">
//                     Keep your assigned work moving.
//                   </p>

//                 </div>

//               </div>

//             </div>

//             <div className="text-left sm:text-right">

//               <p className="text-2xl font-bold text-slate-900">
//                 {loading ? "..." : `${participation}%`}
//               </p>

//               <p className="text-xs font-medium text-slate-400">
//                 completed
//               </p>

//             </div>

//           </div>

//           {/* Progress bar */}

//           <div className="mt-6">

//             <div className="h-3 overflow-hidden rounded-full bg-slate-100">

//               <div
//                 className="
//                   h-full
//                   rounded-full
//                   bg-gradient-to-r
//                   from-indigo-500
//                   to-indigo-600
//                   transition-all
//                   duration-1000
//                   ease-out
//                 "
//                 style={{
//                   width: loading
//                     ? "0%"
//                     : `${participation}%`,
//                 }}
//               />

//             </div>

//             <div className="mt-3 flex items-center justify-between text-xs text-slate-400">

//               <span>
//                 {solvedQuestions} submitted
//               </span>

//               <span>
//                 {assignedQuestions} assigned
//               </span>

//             </div>

//           </div>

//         </section>

//         {/* =================================================
//             QUICK ACTIONS
//         ================================================== */}

//         <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">

//           {/* Assignments */}

//           <button
//             type="button"
//             onClick={() =>
//               navigate("/assignments")
//             }
//             className="
//               group
//               flex
//               items-center
//               justify-between
//               rounded-2xl
//               border
//               border-slate-200
//               bg-white
//               p-5
//               text-left
//               shadow-sm
//               transition-all
//               duration-300
//               hover:-translate-y-0.5
//               hover:border-indigo-200
//               hover:shadow-lg
//             "
//           >

//             <div className="flex items-center gap-4">

//               <div
//                 className="
//                   flex
//                   h-11
//                   w-11
//                   items-center
//                   justify-center
//                   rounded-xl
//                   bg-indigo-50
//                   text-indigo-600
//                   transition-transform
//                   duration-300
//                   group-hover:scale-110
//                 "
//               >
//                 ▦
//               </div>

//               <div>

//                 <p className="font-semibold text-slate-900">
//                   Browse assignments
//                 </p>

//                 <p className="mt-1 text-xs text-slate-400">
//                   Open tasks and assigned questions
//                 </p>

//               </div>

//             </div>

//             <span
//               className="
//                 text-lg
//                 text-slate-300
//                 transition-all
//                 duration-300
//                 group-hover:translate-x-1
//                 group-hover:text-indigo-500
//               "
//             >
//               →
//             </span>

//           </button>

//           {/* My Group */}

//           <button
//             type="button"
//             onClick={() =>
//               navigate("/my-group")
//             }
//             className="
//               group
//               flex
//               items-center
//               justify-between
//               rounded-2xl
//               border
//               border-slate-200
//               bg-white
//               p-5
//               text-left
//               shadow-sm
//               transition-all
//               duration-300
//               hover:-translate-y-0.5
//               hover:border-indigo-200
//               hover:shadow-lg
//             "
//           >

//             <div className="flex items-center gap-4">

//               <div
//                 className="
//                   flex
//                   h-11
//                   w-11
//                   items-center
//                   justify-center
//                   rounded-xl
//                   bg-violet-50
//                   text-violet-600
//                   transition-transform
//                   duration-300
//                   group-hover:scale-110
//                 "
//               >
//                 ◎
//               </div>

//               <div>

//                 <p className="font-semibold text-slate-900">
//                   Open My Group
//                 </p>

//                 <p className="mt-1 text-xs text-slate-400">
//                   View your group and assigned work
//                 </p>

//               </div>

//             </div>

//             <span
//               className="
//                 text-lg
//                 text-slate-300
//                 transition-all
//                 duration-300
//                 group-hover:translate-x-1
//                 group-hover:text-violet-500
//               "
//             >
//               →
//             </span>

//           </button>

//         </section>

//         {/* =================================================
//             FOOTER NOTE
//         ================================================== */}

//         <div className="pb-4 pt-7 text-center">

//           <p className="text-xs text-slate-400">
//             TDS Connect · IIT Madras Data Science workspace
//           </p>

//         </div>

//       </div>

//       {/* ===================================================
//           ANIMATION KEYFRAMES
//       =================================================== */}

//       <style>{`
//         @keyframes fadeIn {
//           from {
//             opacity: 0;
//           }
//           to {
//             opacity: 1;
//           }
//         }

//         @keyframes fadeInUp {
//           from {
//             opacity: 0;
//             transform: translateY(12px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }

//         @keyframes float {
//           0%,
//           100% {
//             transform: translateY(0);
//           }

//           50% {
//             transform: translateY(-8px);
//           }
//         }
//       `}</style>

//     </main>
//   )
// }

// export default Dashboard





import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"

// =========================================================
// DASHBOARD
// =========================================================

function Dashboard() {
  const navigate = useNavigate()

  const [assignmentCount, setAssignmentCount] = useState(0)
  const [participation, setParticipation] = useState(0)
  const [assignedQuestions, setAssignedQuestions] = useState(0)
  const [solvedQuestions, setSolvedQuestions] = useState(0)
  const [loading, setLoading] = useState(true)

  // =======================================================
  // FETCH DASHBOARD DATA
  // =======================================================

  useEffect(() => {
    let mounted = true

    const fetchDashboardData = async () => {
      setLoading(true)

      try {
        // ==================================================
        // CURRENT USER
        // ==================================================

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          return
        }

        // ==================================================
        // 1. ASSIGNMENT COUNT
        // ==================================================

        const {
          count,
          error: assignmentError,
        } = await supabase
          .from("assignments")
          .select("id", {
            count: "exact",
            head: true,
          })

        if (assignmentError) {
          console.error(
            "Dashboard assignment count error:",
            assignmentError
          )
        } else if (mounted) {
          setAssignmentCount(count || 0)
        }

        // ==================================================
        // 2. ALL ACTIVE ASSIGNMENT MEMBERSHIPS
        // ==================================================

        const {
          data: memberships,
          error: membershipError,
        } = await supabase
          .from("assignment_group_members")
          .select(`
            id,
            assignment_id,
            group_id
          `)
          .eq("user_id", user.id)
          .eq("is_active", true)

        if (membershipError) {
          console.error(
            "Dashboard membership error:",
            membershipError
          )

          if (mounted) {
            setAssignedQuestions(0)
            setSolvedQuestions(0)
            setParticipation(0)
          }

          return
        }

        if (
          !memberships ||
          memberships.length === 0
        ) {
          if (mounted) {
            setAssignedQuestions(0)
            setSolvedQuestions(0)
            setParticipation(0)
          }

          return
        }

        // ==================================================
        // UNIQUE GROUP IDS
        // ==================================================

        const groupIds = [
          ...new Set(
            memberships
              .map(
                (membership) =>
                  membership.group_id
              )
              .filter(Boolean)
          ),
        ]

        if (groupIds.length === 0) {
          if (mounted) {
            setAssignedQuestions(0)
            setSolvedQuestions(0)
            setParticipation(0)
          }

          return
        }

        // ==================================================
        // 3. QUESTIONS ASSIGNED TO MY GROUPS
        // ==================================================

        const {
          data: questionAssignments,
          error: questionAssignmentError,
        } = await supabase
          .from("question_assignments")
          .select(`
            question_id,
            group_id
          `)
          .in("group_id", groupIds)
          .eq("is_active", true)

        if (questionAssignmentError) {
          console.error(
            "Dashboard question assignment error:",
            questionAssignmentError
          )

          if (mounted) {
            setAssignedQuestions(0)
            setSolvedQuestions(0)
            setParticipation(0)
          }

          return
        }

        const assignedQuestionIds = [
          ...new Set(
            (questionAssignments || [])
              .map(
                (item) =>
                  item.question_id
              )
              .filter(Boolean)
          ),
        ]

        const assignedCount =
          assignedQuestionIds.length

        if (mounted) {
          setAssignedQuestions(
            assignedCount
          )
        }

        // ==================================================
        // NO QUESTIONS
        // ==================================================

        if (assignedCount === 0) {
          if (mounted) {
            setSolvedQuestions(0)
            setParticipation(0)
          }

          return
        }

        // ==================================================
        // 4. FETCH MY SUBMISSIONS
        // ==================================================

        const {
          data: submissions,
          error: submissionError,
        } = await supabase
          .from("submissions")
          .select(`
            question_id,
            status
          `)
          .eq(
            "submitted_by",
            user.id
          )
          .in(
            "question_id",
            assignedQuestionIds
          )
          .eq(
            "status",
            "SUBMITTED"
          )

        if (submissionError) {
          console.error(
            "Dashboard submission error:",
            submissionError
          )

          if (mounted) {
            setSolvedQuestions(0)
            setParticipation(0)
          }

          return
        }

        // ==================================================
        // 5. UNIQUE SOLVED QUESTIONS
        // ==================================================

        const solvedQuestionIds = [
          ...new Set(
            (submissions || [])
              .map(
                (submission) =>
                  submission.question_id
              )
              .filter(Boolean)
          ),
        ]

        const solvedCount =
          solvedQuestionIds.length

        // ==================================================
        // 6. PARTICIPATION
        // ==================================================

        const participationPercentage =
          assignedCount > 0
            ? Math.min(
                100,
                Math.round(
                  (solvedCount /
                    assignedCount) *
                    100
                )
              )
            : 0

        if (mounted) {
          setSolvedQuestions(
            solvedCount
          )

          setParticipation(
            participationPercentage
          )
        }
      } catch (error) {
        console.error(
          "Dashboard error:",
          error
        )

        if (mounted) {
          setAssignedQuestions(0)
          setSolvedQuestions(0)
          setParticipation(0)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchDashboardData()

    return () => {
      mounted = false
    }
  }, [])

  // =======================================================
  // STAT CARD
  // =======================================================

  const StatCard = ({
    label,
    value,
    description,
    icon,
    iconClass,
  }) => {
    return (
      <div
        className="
          group
          relative
          overflow-hidden
          rounded-3xl
          border
          border-slate-200/70
          bg-white/95
          backdrop-blur-xl
          p-6
          shadow-xs
          transition-all
          duration-500
          hover:-translate-y-1.5
          hover:border-indigo-400/50
          hover:shadow-2xl
          hover:shadow-indigo-500/10
          animate-[fadeInUp_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]
        "
      >
        {/* Subtle luminous glow background on hover */}
        <div
          className="
            pointer-events-none
            absolute
            -right-12
            -top-12
            h-36
            w-36
            rounded-full
            bg-gradient-to-br
            from-indigo-200/50
            to-violet-200/0
            opacity-0
            blur-3xl
            transition-all
            duration-700
            group-hover:opacity-100
            group-hover:scale-125
          "
        />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {label}
            </p>

            <p
              className="
                mt-3
                text-4xl
                font-black
                tracking-tight
                text-slate-950
                transition-transform
                duration-300
                group-hover:scale-[1.03]
                origin-left
              "
            >
              {loading ? (
                <span className="inline-block h-10 w-16 animate-pulse rounded-xl bg-slate-100" />
              ) : (
                value
              )}
            </p>

            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              {description}
            </p>
          </div>

          <div
            className={`
              flex
              h-12
              w-12
              shrink-0
              items-center
              justify-center
              rounded-2xl
              text-lg
              font-bold
              transition-all
              duration-500
              group-hover:scale-110
              group-hover:rotate-6
              shadow-xs
              ${iconClass}
            `}
          >
            {icon}
          </div>
        </div>
      </div>
    )
  }

  // =======================================================
  // UI
  // =======================================================

  return (
    <main className="min-h-screen bg-[#f8fafc] selection:bg-indigo-500 selection:text-white">
      <div className="mx-auto max-w-7xl px-5 py-7 sm:px-6 lg:px-8 lg:py-9">

        {/* =================================================
            HERO
        ================================================== */}

        <section
          className="
            relative
            overflow-hidden
            rounded-[2rem]
            border
            border-slate-200/70
            bg-white
            shadow-xs
            transition-all
            duration-500
            hover:shadow-xl
            hover:shadow-indigo-500/5
            animate-[fadeIn_0.7s_ease-out]
          "
        >
          {/* Enhanced background organic glow decorations */}
          <div
            className="
              pointer-events-none
              absolute
              -right-20
              -top-24
              h-80
              w-80
              rounded-full
              bg-indigo-300/40
              blur-3xl
              animate-[pulse_7s_ease-in-out_infinite]
            "
          />

          <div
            className="
              pointer-events-none
              absolute
              -bottom-28
              left-1/3
              h-72
              w-72
              rounded-full
              bg-blue-300/30
              blur-3xl
              animate-[pulse_9s_ease-in-out_infinite]
            "
          />

          <div
            className="
              relative
              grid
              gap-8
              px-6
              py-8
              sm:px-8
              sm:py-10
              lg:grid-cols-[1fr_auto]
              lg:items-center
              lg:px-10
              lg:py-11
            "
          >
            {/* Hero content */}
            <div>
              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-indigo-100
                  bg-indigo-50/90
                  backdrop-blur-md
                  px-4
                  py-1.5
                  text-xs
                  font-bold
                  text-indigo-700
                  animate-[fadeInUp_0.5s_ease-out]
                  shadow-xs
                "
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-600" />
                </span>
                TDS Connect Live Workspace
              </div>

              <h1
                className="
                  mt-5
                  max-w-3xl
                  text-3xl
                  font-black
                  tracking-tight
                  text-slate-950
                  sm:text-4xl
                  lg:text-5xl
                  animate-[fadeInUp_0.6s_ease-out]
                "
              >
                Your TDS workspace,
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-600">
                  {" "}all in one place.
                </span>
              </h1>

              <p
                className="
                  mt-4
                  max-w-2xl
                  text-sm
                  leading-relaxed
                  text-slate-600
                  sm:text-base
                  animate-[fadeInUp_0.7s_ease-out]
                "
              >
                Manage your assignments, access assigned questions, collaborate with your group, and submit your solutions from one workspace seamlessly.
              </p>

              {/* CTA */}
              <div
                className="
                  mt-7
                  flex
                  flex-col
                  gap-3
                  sm:flex-row
                  animate-[fadeInUp_0.8s_ease-out]
                "
              >
                <button
                  type="button"
                  onClick={() =>
                    navigate("/assignments")
                  }
                  className="
                    group/btn
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-indigo-600
                    px-5
                    py-3
                    text-sm
                    font-semibold
                    text-white
                    shadow-md
                    shadow-indigo-500/25
                    transition-all
                    duration-300
                    hover:-translate-y-0.5
                    hover:bg-indigo-700
                    hover:shadow-xl
                    hover:shadow-indigo-500/35
                    active:translate-y-0
                  "
                >
                  View assignments
                  <span className="text-base transition-transform duration-300 group-hover/btn:translate-x-1">
                    →
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/my-group")
                  }
                  className="
                    group/btn
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-5
                    py-3
                    text-sm
                    font-semibold
                    text-slate-700
                    shadow-xs
                    transition-all
                    duration-300
                    hover:-translate-y-0.5
                    hover:border-indigo-300
                    hover:bg-indigo-50/50
                    hover:text-indigo-700
                    active:translate-y-0
                  "
                >
                  Open My Group
                  <span className="text-base transition-transform duration-300 group-hover/btn:translate-x-1">
                    →
                  </span>
                </button>
              </div>
            </div>

            {/* Workspace visual with ultra-smooth orbital animation */}
            <div
              className="
                hidden
                lg:flex
                lg:h-52
                lg:w-52
                xl:h-56
                xl:w-56
                items-center
                justify-center
              "
            >
              <div
                className="
                  relative
                  flex
                  h-44
                  w-44
                  items-center
                  justify-center
                  rounded-[2rem]
                  border
                  border-indigo-100
                  bg-gradient-to-br
                  from-indigo-50/90
                  via-white
                  to-blue-50/90
                  shadow-2xl
                  shadow-indigo-200/60
                  animate-[float_6s_ease-in-out_infinite]
                "
              >
                <div
                  className="
                    absolute
                    inset-3
                    rounded-[1.5rem]
                    border
                    border-dashed
                    border-indigo-300/70
                    animate-[spin_25s_linear_infinite]
                  "
                />

                <div
                  className="
                    flex
                    h-20
                    w-20
                    items-center
                    justify-center
                    rounded-3xl
                    bg-gradient-to-br
                    from-indigo-600
                    to-violet-600
                    text-3xl
                    font-black
                    text-white
                    shadow-lg
                    shadow-indigo-500/30
                    transform
                    transition-transform
                    duration-500
                    hover:scale-105
                  "
                >
                  T
                </div>

                <div
                  className="
                    absolute
                    right-2
                    top-5
                    flex
                    h-8
                    w-8
                    items-center
                    justify-center
                    rounded-xl
                    bg-white
                    text-sm
                    font-bold
                    text-emerald-600
                    shadow-md
                    border
                    border-slate-100
                    animate-[bounce_3s_infinite]
                  "
                >
                  ✓
                </div>

                <div
                  className="
                    absolute
                    bottom-5
                    left-1
                    flex
                    h-8
                    w-8
                    items-center
                    justify-center
                    rounded-xl
                    bg-white
                    text-sm
                    font-bold
                    text-indigo-600
                    shadow-md
                    border
                    border-slate-100
                    animate-[bounce_4s_infinite]
                  "
                >
                  ?
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            STATS
        ================================================== */}

        <section className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          <StatCard
            label="Assignments"
            value={assignmentCount}
            description="Tasks currently available in your workspace"
            icon="▦"
            iconClass="bg-indigo-50 text-indigo-600 border border-indigo-100"
          />

          <StatCard
            label="Participation"
            value={`${participation}%`}
            description={
              assignedQuestions > 0
                ? `${solvedQuestions} of ${assignedQuestions} assigned questions submitted`
                : "No questions have been assigned yet"
            }
            icon="↗"
            iconClass="bg-emerald-50 text-emerald-600 border border-emerald-100"
          />
        </section>

        {/* =================================================
            PROGRESS
        ================================================== */}

        <section
          className="
            mt-6
            overflow-hidden
            rounded-3xl
            border
            border-slate-200/70
            bg-white
            p-6
            shadow-xs
            sm:p-7
            transition-all
            duration-300
            hover:shadow-md
          "
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div
                  className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-xl
                    bg-emerald-50
                    text-lg
                    font-bold
                    text-emerald-600
                    border
                    border-emerald-100
                  "
                >
                  ✓
                </div>

                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Your progress
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Keep your assigned work moving forward.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-2xl font-extrabold text-slate-900">
                {loading ? "..." : `${participation}%`}
              </p>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                completed
              </p>
            </div>
          </div>

          {/* Progress bar with glowing smooth transition */}
          <div className="mt-6">
            <div className="h-3 overflow-hidden rounded-full bg-slate-100 p-0.5 border border-slate-200/60">
              <div
                className="
                  h-full
                  rounded-full
                  bg-gradient-to-r
                  from-indigo-500
                  via-indigo-600
                  to-violet-600
                  transition-all
                  duration-1200
                  ease-out
                  shadow-sm
                "
                style={{
                  width: loading
                    ? "0%"
                    : `${participation}%`,
                }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs font-medium text-slate-400">
              <span>
                {solvedQuestions} submitted
              </span>
              <span>
                {assignedQuestions} assigned
              </span>
            </div>
          </div>
        </section>

        {/* =================================================
            QUICK ACTIONS
        ================================================== */}

        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Assignments */}
          <button
            type="button"
            onClick={() =>
              navigate("/assignments")
            }
            className="
              group
              flex
              items-center
              justify-between
              rounded-2xl
              border
              border-slate-200/70
              bg-white
              p-5
              text-left
              shadow-xs
              transition-all
              duration-300
              hover:-translate-y-1
              hover:border-indigo-300
              hover:shadow-xl
              hover:shadow-indigo-500/10
            "
          >
            <div className="flex items-center gap-4">
              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-indigo-50
                  text-indigo-600
                  border
                  border-indigo-100
                  transition-transform
                  duration-300
                  group-hover:scale-110
                  group-hover:rotate-3
                "
              >
                ▦
              </div>

              <div>
                <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Browse assignments
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Open tasks and assigned questions
                </p>
              </div>
            </div>

            <span
              className="
                text-lg
                text-slate-300
                transition-all
                duration-300
                group-hover:translate-x-1.5
                group-hover:text-indigo-600
              "
            >
              →
            </span>
          </button>

          {/* My Group */}
          <button
            type="button"
            onClick={() =>
              navigate("/my-group")
            }
            className="
              group
              flex
              items-center
              justify-between
              rounded-2xl
              border
              border-slate-200/70
              bg-white
              p-5
              text-left
              shadow-xs
              transition-all
              duration-300
              hover:-translate-y-1
              hover:border-violet-300
              hover:shadow-xl
              hover:shadow-violet-500/10
            "
          >
            <div className="flex items-center gap-4">
              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-violet-50
                  text-violet-600
                  border
                  border-violet-100
                  transition-transform
                  duration-300
                  group-hover:scale-110
                  group-hover:-rotate-3
                "
              >
                ◎
              </div>

              <div>
                <p className="font-semibold text-slate-900 group-hover:text-violet-600 transition-colors">
                  Open My Group
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  View your group and assigned work
                </p>
              </div>
            </div>

            <span
              className="
                text-lg
                text-slate-300
                transition-all
                duration-300
                group-hover:translate-x-1.5
                group-hover:text-violet-600
              "
            >
              →
            </span>
          </button>
        </section>

        {/* =================================================
            FOOTER NOTE
        ================================================== */}

        <div className="pb-4 pt-7 text-center">
          <p className="text-xs font-medium text-slate-400">
            TDS Connect · Divyansh Singh workspace
          </p>
        </div>

      </div>

      {/* ===================================================
          ANIMATION KEYFRAMES
      ================================================== */}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-12px) rotate(1deg);
          }
        }
      `}</style>
    </main>
  )
}

export default Dashboard
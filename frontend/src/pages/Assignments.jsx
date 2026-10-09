// import { useEffect, useMemo, useState } from "react"
// import { Link } from "react-router-dom"
// import { supabase } from "../lib/supabase"

// const GROUP_SIZE_MIN = 10
// const GROUP_SIZE_MAX = 50
// const DEFAULT_GROUP_SIZE = 10

// const STATUS_OPTIONS = [
//   "DRAFT",
//   "PUBLISHED",
//   "CLOSED",
//   "ARCHIVED",
// ]

// function formatDate(value) {
//   if (!value) return "—"

//   return new Date(value).toLocaleString("en-IN", {
//     dateStyle: "medium",
//     timeStyle: "short",
//   })
// }

// function getTypeLabel(type) {
//   if (!type) return "No Type"

//   return type
//     .replaceAll("_", " ")
//     .toLowerCase()
//     .replace(/\b\w/g, (char) => char.toUpperCase())
// }

// function getSubsectionName(assignment) {
//   if (assignment.section_name?.trim()) {
//     return assignment.section_name.trim()
//   }

//   if (
//     assignment.week_number !== null &&
//     assignment.week_number !== undefined
//   ) {
//     return `Week ${assignment.week_number}`
//   }

//   return "Subsection"
// }

// function getStatusClasses(status) {
//   if (status === "PUBLISHED") {
//     return "bg-emerald-100 text-emerald-700"
//   }

//   if (status === "CLOSED") {
//     return "bg-red-100 text-red-700"
//   }

//   if (status === "ARCHIVED") {
//     return "bg-slate-200 text-slate-700"
//   }

//   return "bg-amber-100 text-amber-700"
// }

// function StatCard({ label, value, description }) {
//   return (
//     <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
//       <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
//         {label}
//       </p>

//       <p className="mt-1 text-2xl font-bold text-slate-900">
//         {value}
//       </p>

//       {description && (
//         <p className="mt-1 text-xs text-slate-500">
//           {description}
//         </p>
//       )}
//     </div>
//   )
// }

// function StatusBadge({ status }) {
//   return (
//     <span
//       className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
//         status
//       )}`}
//     >
//       {status}
//     </span>
//   )
// }

// function EmptyState({
//   title,
//   description,
//   actionLabel,
//   onAction,
// }) {
//   return (
//     <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
//       <h3 className="text-sm font-bold text-slate-900">
//         {title}
//       </h3>

//       <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
//         {description}
//       </p>

//       {actionLabel && onAction && (
//         <button
//           type="button"
//           onClick={onAction}
//           className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
//         >
//           {actionLabel}
//         </button>
//       )}
//     </div>
//   )
// }

// export default function Assignments() {
//   const [user, setUser] = useState(null)

//   const [parents, setParents] = useState([])
//   const [assignments, setAssignments] = useState([])
//   const [questions, setQuestions] = useState([])
//   const [groups, setGroups] = useState([])
//   const [groupMembers, setGroupMembers] = useState([])
//   const [questionAssignments, setQuestionAssignments] =
//     useState([])

//   const [loading, setLoading] = useState(true)
//   const [saving, setSaving] = useState(false)

//   const [error, setError] = useState("")
//   const [success, setSuccess] = useState("")

//   const [expandedParents, setExpandedParents] = useState({})

//   const [showParentForm, setShowParentForm] =
//     useState(false)

//   const [showSubsectionForm, setShowSubsectionForm] =
//     useState(false)

//   const [showQuestionForm, setShowQuestionForm] =
//     useState(false)

//   const [parentForm, setParentForm] = useState({
//     title: "",
//     description: "",
//     assignmentType: "",
//   })

//   const [subsectionForm, setSubsectionForm] = useState({
//     parentTaskId: "",
//     sectionName: "",
//     totalQuestions: 0,
//     groupSize: DEFAULT_GROUP_SIZE,
//     startAt: "",
//     deadline: "",
//   })

//   const [questionForm, setQuestionForm] = useState({
//     assignmentId: "",
//     questionNumber: "",
//     title: "",
//     questionText: "",
//     points: 1,
//   })

//   useEffect(() => {
//     loadPage()
//   }, [])

//   // =========================================================
//   // DATA LOADING
//   // =========================================================

//   async function loadPage() {
//     try {
//       setLoading(true)
//       setError("")

//       const {
//         data: { user: currentUser },
//         error: authError,
//       } = await supabase.auth.getUser()

//       if (authError) {
//         throw authError
//       }

//       if (!currentUser) {
//         throw new Error(
//           "Admin session was not found."
//         )
//       }

//       setUser(currentUser)

//       await loadAllData()
//     } catch (err) {
//       console.error(err)

//       setError(
//         err.message ||
//           "Failed to load assignment management."
//       )
//     } finally {
//       setLoading(false)
//     }
//   }

//   async function loadAllData() {
//     const [
//       parentResult,
//       assignmentResult,
//       questionResult,
//       groupResult,
//       memberResult,
//       questionAssignmentResult,
//     ] = await Promise.all([
//       supabase
//         .from("parent_tasks")
//         .select(`
//           id,
//           title,
//           description,
//           assignment_type,
//           status,
//           created_by,
//           created_at,
//           updated_at
//         `)
//         .order("created_at", {
//           ascending: false,
//         }),

//       supabase
//         .from("assignments")
//         .select(`
//           id,
//           parent_task_id,
//           title,
//           description,
//           assignment_type,
//           status,
//           section_name,
//           week_number,
//           total_questions,
//           group_size,
//           start_at,
//           deadline,
//           created_by,
//           created_at,
//           updated_at
//         `)
//         .order("created_at", {
//           ascending: true,
//         }),

//       supabase
//         .from("questions")
//         .select(`
//           id,
//           assignment_id,
//           question_number,
//           title,
//           question_text,
//           points,
//           created_at
//         `)
//         .order("question_number", {
//           ascending: true,
//         }),

//       supabase
//         .from("groups")
//         .select(`
//           id,
//           assignment_id,
//           name,
//           max_members,
//           is_active,
//           created_at
//         `)
//         .eq("is_active", true)
//         .order("created_at", {
//           ascending: true,
//         }),

//       supabase
//         .from("assignment_group_members")
//         .select(`
//           id,
//           assignment_id,
//           group_id,
//           user_id,
//           joined_at,
//           left_at,
//           is_active
//         `)
//         .eq("is_active", true),

//       supabase
//         .from("question_assignments")
//         .select(`
//           id,
//           question_id,
//           group_id,
//           assigned_at,
//           assigned_by,
//           is_active
//         `)
//         .eq("is_active", true),
//     ])

//     if (parentResult.error) {
//       throw parentResult.error
//     }

//     if (assignmentResult.error) {
//       throw assignmentResult.error
//     }

//     if (questionResult.error) {
//       throw questionResult.error
//     }

//     if (groupResult.error) {
//       throw groupResult.error
//     }

//     if (memberResult.error) {
//       throw memberResult.error
//     }

//     if (questionAssignmentResult.error) {
//       throw questionAssignmentResult.error
//     }

//     const loadedParents = parentResult.data || []

//     setParents(loadedParents)
//     setAssignments(assignmentResult.data || [])
//     setQuestions(questionResult.data || [])
//     setGroups(groupResult.data || [])
//     setGroupMembers(memberResult.data || [])
//     setQuestionAssignments(
//       questionAssignmentResult.data || []
//     )

//     setExpandedParents((current) => {
//       const next = { ...current }

//       loadedParents.forEach((parent) => {
//         if (next[parent.id] === undefined) {
//           next[parent.id] = true
//         }
//       })

//       return next
//     })
//   }

//   // =========================================================
//   // GENERAL HELPERS
//   // =========================================================

//   function clearMessages() {
//     setError("")
//     setSuccess("")
//   }

//   function toggleParent(parentId) {
//     setExpandedParents((current) => ({
//       ...current,
//       [parentId]: !current[parentId],
//     }))
//   }

//   function getAssignmentsForParent(parentId) {
//     return assignments
//       .filter(
//         (assignment) =>
//           assignment.parent_task_id === parentId
//       )
//       .sort((a, b) => {
//         const aWeek =
//           a.week_number !== null &&
//           a.week_number !== undefined

//         const bWeek =
//           b.week_number !== null &&
//           b.week_number !== undefined

//         if (aWeek && bWeek) {
//           return a.week_number - b.week_number
//         }

//         return (
//           new Date(a.created_at) -
//           new Date(b.created_at)
//         )
//       })
//   }

//   function getQuestionsForAssignment(
//     assignmentId
//   ) {
//     return questions
//       .filter(
//         (question) =>
//           question.assignment_id === assignmentId
//       )
//       .sort(
//         (a, b) =>
//           a.question_number -
//           b.question_number
//       )
//   }

//   function getGroupsForAssignment(
//     assignmentId
//   ) {
//     return groups
//       .filter(
//         (group) =>
//           group.assignment_id === assignmentId &&
//           group.is_active
//       )
//       .sort(
//         (a, b) =>
//           new Date(a.created_at) -
//           new Date(b.created_at)
//       )
//   }

//   function getMembersForGroup(groupId) {
//     return groupMembers.filter(
//       (member) =>
//         member.group_id === groupId &&
//         member.is_active
//     )
//   }

//   function getQuestionAssignmentsForGroup(
//     groupId
//   ) {
//     return questionAssignments.filter(
//       (item) =>
//         item.group_id === groupId &&
//         item.is_active
//     )
//   }

//   function getQuestionAssignmentForQuestion(
//     questionId
//   ) {
//     return questionAssignments.find(
//       (item) =>
//         item.question_id === questionId &&
//         item.is_active
//     )
//   }

//   function getAssignmentStats(assignmentId) {
//     const assignmentQuestions =
//       getQuestionsForAssignment(assignmentId)

//     const assignmentGroups =
//       getGroupsForAssignment(assignmentId)

//     const assignmentMembers =
//       groupMembers.filter(
//         (member) =>
//           member.assignment_id === assignmentId &&
//           member.is_active
//       )

//     const assignmentQuestionAssignments =
//       questionAssignments.filter((item) =>
//         assignmentQuestions.some(
//           (question) =>
//             question.id === item.question_id
//         )
//       )

//     const questionCounts =
//       assignmentGroups.map(
//         (group) =>
//           getQuestionAssignmentsForGroup(
//             group.id
//           ).length
//       )

//     const studentCounts =
//       assignmentGroups.map(
//         (group) =>
//           getMembersForGroup(group.id).length
//       )

//     const maxQuestionCount =
//       questionCounts.length > 0
//         ? Math.max(...questionCounts)
//         : 0

//     const minQuestionCount =
//       questionCounts.length > 0
//         ? Math.min(...questionCounts)
//         : 0

//     const maxStudentCount =
//       studentCounts.length > 0
//         ? Math.max(...studentCounts)
//         : 0

//     const minStudentCount =
//       studentCounts.length > 0
//         ? Math.min(...studentCounts)
//         : 0

//     return {
//       totalStudents: assignmentMembers.length,

//       totalGroups:
//         assignmentGroups.length,

//       totalQuestions:
//         assignmentQuestions.length,

//       distributedQuestions:
//         assignmentQuestionAssignments.length,

//       unassignedQuestions: Math.max(
//         0,
//         assignmentQuestions.length -
//           assignmentQuestionAssignments.length
//       ),

//       questionBalanced:
//         questionCounts.length === 0 ||
//         maxQuestionCount -
//           minQuestionCount <=
//           1,

//       studentsBalanced:
//         studentCounts.length === 0 ||
//         maxStudentCount -
//           minStudentCount <=
//           1,
//     }
//   }

//   const overallStats = useMemo(() => {
//     return {
//       parents: parents.length,

//       subsections:
//         assignments.length,

//       students:
//         new Set(
//           groupMembers.map(
//             (member) => member.user_id
//           )
//         ).size,

//       questions: questions.length,
//     }
//   }, [
//     parents,
//     assignments,
//     groupMembers,
//     questions,
//   ])

//   // =========================================================
//   // PARENT TASK
//   // =========================================================

//   function resetParentForm() {
//     setParentForm({
//       title: "",
//       description: "",
//       assignmentType: "",
//     })
//   }

//   async function createParentTask(event) {
//     event.preventDefault()

//     clearMessages()

//     if (!user?.id) {
//       setError("Admin user not found.")
//       return
//     }

//     const title =
//       parentForm.title.trim()

//     const description =
//       parentForm.description.trim()

//     const assignmentType =
//       parentForm.assignmentType.trim()

//     if (!title) {
//       setError(
//         "Parent task title is required."
//       )
//       return
//     }

//     if (!assignmentType) {
//       setError(
//         "Task type is required."
//       )
//       return
//     }

//     try {
//       setSaving(true)

//       const { data, error } =
//         await supabase
//           .from("parent_tasks")
//           .insert({
//             title,

//             description:
//               description || null,

//             assignment_type:
//               assignmentType,

//             status: "DRAFT",

//             created_by: user.id,
//           })
//           .select()
//           .single()

//       if (error) {
//         throw error
//       }

//       setParents((current) => [
//         data,
//         ...current,
//       ])

//       setExpandedParents((current) => ({
//         ...current,
//         [data.id]: true,
//       }))

//       resetParentForm()
//       setShowParentForm(false)

//       setSuccess(
//         `Parent task "${data.title}" created successfully.`
//       )
//     } catch (err) {
//       console.error(err)

//       setError(
//         err.message ||
//           "Failed to create parent task."
//       )
//     } finally {
//       setSaving(false)
//     }
//   }

//   // =========================================================
//   // SUBSECTION
//   // =========================================================

//   function resetSubsectionForm() {
//     setSubsectionForm({
//       parentTaskId: "",
//       sectionName: "",
//       totalQuestions: 0,
//       groupSize: DEFAULT_GROUP_SIZE,
//       startAt: "",
//       deadline: "",
//     })
//   }

//   function openSubsectionForm(parentId = "") {
//     setSubsectionForm((current) => ({
//       ...current,

//       parentTaskId:
//         parentId ||
//         current.parentTaskId ||
//         parents[0]?.id ||
//         "",
//     }))

//     setShowSubsectionForm(true)

//     window.scrollTo({
//       top: 0,
//       behavior: "smooth",
//     })
//   }

//   async function createSubsection(event) {
//     event.preventDefault()

//     clearMessages()

//     if (!user?.id) {
//       setError("Admin user not found.")
//       return
//     }

//     const parent =
//       parents.find(
//         (item) =>
//           item.id ===
//           subsectionForm.parentTaskId
//       )

//     if (!parent) {
//       setError(
//         "Please select a valid parent task."
//       )
//       return
//     }

//     const sectionName =
//       subsectionForm.sectionName.trim()

//     if (!sectionName) {
//       setError(
//         "Subsection name is required."
//       )
//       return
//     }

//     const totalQuestions = Math.max(
//       0,
//       Number(
//         subsectionForm.totalQuestions
//       ) || 0
//     )

//     const groupSize = Math.min(
//       GROUP_SIZE_MAX,
//       Math.max(
//         GROUP_SIZE_MIN,
//         Number(
//           subsectionForm.groupSize
//         ) || DEFAULT_GROUP_SIZE
//       )
//     )

//     try {
//       setSaving(true)

//       const payload = {
//         parent_task_id: parent.id,

//         title: parent.title,

//         description:
//           parent.description || null,

//         assignment_type:
//           parent.assignment_type,

//         status: "DRAFT",

//         section_name: sectionName,

//         total_questions:
//           totalQuestions,

//         group_size: groupSize,

//         start_at:
//           subsectionForm.startAt || null,

//         deadline:
//           subsectionForm.deadline || null,

//         created_by: user.id,
//       }

//       const { data, error } =
//         await supabase
//           .from("assignments")
//           .insert(payload)
//           .select()
//           .single()

//       if (error) {
//         throw error
//       }

//       setAssignments((current) => [
//         ...current,
//         data,
//       ])

//       setExpandedParents((current) => ({
//         ...current,
//         [parent.id]: true,
//       }))

//       resetSubsectionForm()
//       setShowSubsectionForm(false)

//       setSuccess(
//         `Subsection "${sectionName}" created successfully.`
//       )
//     } catch (err) {
//       console.error(err)

//       setError(
//         err.message ||
//           "Failed to create subsection."
//       )
//     } finally {
//       setSaving(false)
//     }
//   }

//   // =========================================================
//   // QUESTIONS
//   // =========================================================

//   function resetQuestionForm() {
//     setQuestionForm({
//       assignmentId: "",
//       questionNumber: "",
//       title: "",
//       questionText: "",
//       points: 1,
//     })
//   }

//   function openQuestionForm(
//     assignmentId = ""
//   ) {
//     setQuestionForm((current) => ({
//       ...current,

//       assignmentId:
//         assignmentId ||
//         current.assignmentId ||
//         "",
//     }))

//     setShowQuestionForm(true)

//     window.scrollTo({
//       top: 0,
//       behavior: "smooth",
//     })
//   }

//   async function createQuestion(event) {
//     event.preventDefault()

//     clearMessages()

//     if (!questionForm.assignmentId) {
//       setError(
//         "Please select a subsection."
//       )
//       return
//     }

//     const questionNumber = Number(
//       questionForm.questionNumber
//     )

//     if (
//       !Number.isInteger(questionNumber) ||
//       questionNumber <= 0
//     ) {
//       setError(
//         "Enter a valid question number."
//       )
//       return
//     }

//     const questionText =
//       questionForm.questionText.trim()

//     if (!questionText) {
//       setError(
//         "Question text is required."
//       )
//       return
//     }

//     const points =
//       Number(questionForm.points)

//     try {
//       setSaving(true)

//       const { data, error } =
//         await supabase
//           .from("questions")
//           .insert({
//             assignment_id:
//               questionForm.assignmentId,

//             question_number:
//               questionNumber,

//             title:
//               questionForm.title.trim() ||
//               null,

//             question_text:
//               questionText,

//             points:
//               Number.isFinite(points)
//                 ? points
//                 : 1,
//           })
//           .select()
//           .single()

//       if (error) {
//         throw error
//       }

//       setQuestions((current) => [
//         ...current,
//         data,
//       ])

//       resetQuestionForm()
//       setShowQuestionForm(false)

//       await loadAllData()

//       setSuccess(
//         "Question added. Automatic distribution has been refreshed."
//       )
//     } catch (err) {
//       console.error(err)

//       setError(
//         err.message ||
//           "Failed to create question."
//       )
//     } finally {
//       setSaving(false)
//     }
//   }

//   // =========================================================
//   // STATUS
//   // =========================================================

//   async function updateAssignmentStatus(
//     assignmentId,
//     status
//   ) {
//     if (!STATUS_OPTIONS.includes(status)) {
//       return
//     }

//     clearMessages()

//     try {
//       setSaving(true)

//       const { data, error } =
//         await supabase
//           .from("assignments")
//           .update({
//             status,

//             updated_at:
//               new Date().toISOString(),
//           })
//           .eq("id", assignmentId)
//           .select()
//           .single()

//       if (error) {
//         throw error
//       }

//       setAssignments((current) =>
//         current.map((item) =>
//           item.id === assignmentId
//             ? data
//             : item
//         )
//       )

//       setSuccess(
//         `Subsection status changed to ${status}.`
//       )
//     } catch (err) {
//       console.error(err)

//       setError(
//         err.message ||
//           "Failed to update status."
//       )
//     } finally {
//       setSaving(false)
//     }
//   }

//   // =========================================================
//   // DISTRIBUTION
//   // =========================================================

//   async function distributeQuestions(
//     assignmentId
//   ) {
//     clearMessages()

//     try {
//       setSaving(true)

//       const { data, error } =
//         await supabase.rpc(
//           "distribute_assignment_questions",
//           {
//             p_assignment_id:
//               assignmentId,
//           }
//         )

//       if (error) {
//         throw error
//       }

//       await loadAllData()

//       setSuccess(
//         `Questions redistributed successfully${
//           data
//             ? `: ${data.groups ?? 0} groups and ${
//                 data.questions ?? 0
//               } questions processed.`
//             : "."
//         }`
//       )
//     } catch (err) {
//       console.error(err)

//       setError(
//         err.message ||
//           "Failed to redistribute questions."
//       )
//     } finally {
//       setSaving(false)
//     }
//   }

//   // =========================================================
//   // DELETE SUBSECTION
//   // =========================================================

//   async function deleteAssignment(
//     assignmentId
//   ) {
//     const assignment =
//       assignments.find(
//         (item) =>
//           item.id === assignmentId
//       )

//     if (!assignment) {
//       return
//     }

//     const confirmed =
//       window.confirm(
//         `Delete "${getSubsectionName(
//           assignment
//         )}"?\n\nThis will also remove its related questions, groups, memberships and question assignments.`
//       )

//     if (!confirmed) {
//       return
//     }

//     clearMessages()

//     try {
//       setSaving(true)

//       const { error } =
//         await supabase
//           .from("assignments")
//           .delete()
//           .eq("id", assignmentId)

//       if (error) {
//         throw error
//       }

//       const assignmentQuestionIds =
//         questions
//           .filter(
//             (question) =>
//               question.assignment_id ===
//               assignmentId
//           )
//           .map(
//             (question) => question.id
//           )

//       setAssignments((current) =>
//         current.filter(
//           (item) =>
//             item.id !== assignmentId
//         )
//       )

//       setQuestions((current) =>
//         current.filter(
//           (item) =>
//             item.assignment_id !==
//             assignmentId
//         )
//       )

//       setGroups((current) =>
//         current.filter(
//           (item) =>
//             item.assignment_id !==
//             assignmentId
//         )
//       )

//       setGroupMembers((current) =>
//         current.filter(
//           (item) =>
//             item.assignment_id !==
//             assignmentId
//         )
//       )

//       setQuestionAssignments(
//         (current) =>
//           current.filter(
//             (item) =>
//               !assignmentQuestionIds.includes(
//                 item.question_id
//               )
//           )
//       )

//       setSuccess(
//         "Subsection deleted successfully."
//       )
//     } catch (err) {
//       console.error(err)

//       setError(
//         err.message ||
//           "Failed to delete subsection."
//       )
//     } finally {
//       setSaving(false)
//     }
//   }

//   // =========================================================
//   // LOADING UI
//   // =========================================================

//   if (loading) {
//     return (
//       <div className="flex min-h-[70vh] items-center justify-center">
//         <div className="text-center">
//           <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />

//           <p className="mt-4 text-sm text-slate-500">
//             Loading assignment management...
//           </p>
//         </div>
//       </div>
//     )
//   }

//   // =========================================================
//   // PAGE
//   // =========================================================

//   return (
//     <div className="mx-auto max-w-7xl space-y-6 p-6">

//       {/* =====================================================
//           HEADER
//       ====================================================== */}

//       <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
//         <div>
//           <p className="text-sm font-semibold text-indigo-600">
//             ADMIN WORKSPACE
//           </p>

//           <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
//             Assignments
//           </h1>

//           <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
//             Create parent tasks, add custom subsections,
//             manage questions and monitor automatic
//             student/group distribution.
//           </p>
//         </div>

//         <div className="flex flex-wrap gap-2">
//           <button
//             type="button"
//             onClick={() =>
//               setShowParentForm(
//                 (current) => !current
//               )
//             }
//             className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
//           >
//             + Parent Task
//           </button>

//           <button
//             type="button"
//             onClick={() =>
//               openSubsectionForm()
//             }
//             className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
//           >
//             + Subsection
//           </button>

//           <button
//             type="button"
//             onClick={() =>
//               openQuestionForm()
//             }
//             className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
//           >
//             + Question
//           </button>
//         </div>
//       </div>

//       {/* =====================================================
//           MESSAGES
//       ====================================================== */}

//       {error && (
//         <div className="flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
//           <span>{error}</span>

//           <button
//             type="button"
//             onClick={() => setError("")}
//             className="font-bold text-red-500 hover:text-red-700"
//           >
//             ×
//           </button>
//         </div>
//       )}

//       {success && (
//         <div className="flex items-start justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
//           <span>{success}</span>

//           <button
//             type="button"
//             onClick={() => setSuccess("")}
//             className="font-bold text-emerald-500 hover:text-emerald-700"
//           >
//             ×
//           </button>
//         </div>
//       )}

//       {/* =====================================================
//           STATS
//       ====================================================== */}

//       <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
//         <StatCard
//           label="Parent Tasks"
//           value={overallStats.parents}
//           description="Main task containers"
//         />

//         <StatCard
//           label="Subsections"
//           value={overallStats.subsections}
//           description="Custom sections"
//         />

//         <StatCard
//           label="Students"
//           value={overallStats.students}
//           description="Active participants"
//         />

//         <StatCard
//           label="Questions"
//           value={overallStats.questions}
//           description="Total questions"
//         />
//       </div>

//       {/* =====================================================
//           PARENT TASK FORM
//       ====================================================== */}

//       {showParentForm && (
//         <form
//           onSubmit={createParentTask}
//           className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
//         >
//           <div className="mb-6">
//             <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
//               New Parent Task
//             </p>

//             <h2 className="mt-1 text-xl font-bold text-slate-900">
//               Create Parent Task
//             </h2>

//             <p className="mt-1 text-sm text-slate-500">
//               The task type is fully custom. Enter
//               whatever type makes sense for your course.
//             </p>
//           </div>

//           <div className="grid gap-5 md:grid-cols-2">

//             <div className="md:col-span-2">
//               <label className="mb-2 block text-sm font-semibold text-slate-700">
//                 Parent Task Title
//                 <span className="ml-1 text-red-500">
//                   *
//                 </span>
//               </label>

//               <input
//                 type="text"
//                 value={parentForm.title}
//                 onChange={(event) =>
//                   setParentForm(
//                     (current) => ({
//                       ...current,
//                       title:
//                         event.target.value,
//                     })
//                   )
//                 }
//                 placeholder="e.g. Machine Learning Practice"
//                 className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-100"
//               />
//             </div>

//             <div className="md:col-span-2">
//               <label className="mb-2 block text-sm font-semibold text-slate-700">
//                 Description
//               </label>

//               <textarea
//                 rows={3}
//                 value={parentForm.description}
//                 onChange={(event) =>
//                   setParentForm(
//                     (current) => ({
//                       ...current,
//                       description:
//                         event.target.value,
//                     })
//                   )
//                 }
//                 placeholder="Optional description for this parent task..."
//                 className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-100"
//               />
//             </div>

//             <div className="md:col-span-2">
//               <label className="mb-2 block text-sm font-semibold text-slate-700">
//                 Task Type
//                 <span className="ml-1 text-red-500">
//                   *
//                 </span>
//               </label>

//               <input
//                 type="text"
//                 value={
//                   parentForm.assignmentType
//                 }
//                 onChange={(event) =>
//                   setParentForm(
//                     (current) => ({
//                       ...current,
//                       assignmentType:
//                         event.target.value,
//                     })
//                   )
//                 }
//                 placeholder="e.g. Practice, Project, Revision, Workshop, Lab"
//                 className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-100"
//               />

//               <p className="mt-2 text-xs text-slate-500">
//                 Custom text is allowed. There is no
//                 predefined task-type list.
//               </p>
//             </div>
//           </div>

//           <div className="mt-6 flex flex-wrap gap-2">
//             <button
//               type="submit"
//               disabled={saving}
//               className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
//             >
//               {saving
//                 ? "Creating..."
//                 : "Create Parent Task"}
//             </button>

//             <button
//               type="button"
//               onClick={() => {
//                 resetParentForm()
//                 setShowParentForm(false)
//               }}
//               className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
//             >
//               Cancel
//             </button>
//           </div>
//         </form>
//       )}

//       {/* =====================================================
//           SUBSECTION FORM
//       ====================================================== */}

//       {showSubsectionForm && (
//         <form
//           onSubmit={createSubsection}
//           className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-6 shadow-sm"
//         >
//           <div className="mb-6">
//             <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
//               New Subsection
//             </p>

//             <h2 className="mt-1 text-xl font-bold text-slate-900">
//               Create Subsection
//             </h2>

//             <p className="mt-1 text-sm text-slate-500">
//               Subsection names are completely custom.
//               There is no fixed Week structure.
//             </p>
//           </div>

//           <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

//             <div>
//               <label className="mb-2 block text-sm font-semibold text-slate-700">
//                 Parent Task
//                 <span className="ml-1 text-red-500">
//                   *
//                 </span>
//               </label>

//               <select
//                 value={
//                   subsectionForm.parentTaskId
//                 }
//                 onChange={(event) =>
//                   setSubsectionForm(
//                     (current) => ({
//                       ...current,
//                       parentTaskId:
//                         event.target.value,
//                     })
//                   )
//                 }
//                 className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900"
//               >
//                 <option value="">
//                   Select parent task
//                 </option>

//                 {parents.map((parent) => (
//                   <option
//                     key={parent.id}
//                     value={parent.id}
//                   >
//                     {parent.title} ·{" "}
//                     {getTypeLabel(
//                       parent.assignment_type
//                     )}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div>
//               <label className="mb-2 block text-sm font-semibold text-slate-700">
//                 Subsection Name
//                 <span className="ml-1 text-red-500">
//                   *
//                 </span>
//               </label>

//               <input
//                 type="text"
//                 value={
//                   subsectionForm.sectionName
//                 }
//                 onChange={(event) =>
//                   setSubsectionForm(
//                     (current) => ({
//                       ...current,
//                       sectionName:
//                         event.target.value,
//                     })
//                   )
//                 }
//                 placeholder="e.g. Revision Set"
//                 className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900"
//               />
//             </div>

//             <div>
//               <label className="mb-2 block text-sm font-semibold text-slate-700">
//                 Total Questions
//               </label>

//               <input
//                 type="number"
//                 min="0"
//                 value={
//                   subsectionForm.totalQuestions
//                 }
//                 onChange={(event) =>
//                   setSubsectionForm(
//                     (current) => ({
//                       ...current,
//                       totalQuestions:
//                         event.target.value,
//                     })
//                   )
//                 }
//                 className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900"
//               />
//             </div>

//             <div>
//               <label className="mb-2 block text-sm font-semibold text-slate-700">
//                 Target Group Size
//               </label>

//               <input
//                 type="number"
//                 min={GROUP_SIZE_MIN}
//                 max={GROUP_SIZE_MAX}
//                 value={
//                   subsectionForm.groupSize
//                 }
//                 onChange={(event) => {
//                   const value =
//                     Number(
//                       event.target.value
//                     ) || DEFAULT_GROUP_SIZE

//                   setSubsectionForm(
//                     (current) => ({
//                       ...current,
//                       groupSize: Math.min(
//                         GROUP_SIZE_MAX,
//                         Math.max(
//                           GROUP_SIZE_MIN,
//                           value
//                         )
//                       ),
//                     })
//                   )
//                 }}
//                 className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900"
//               />

//               <p className="mt-2 text-xs text-slate-500">
//                 Target is {GROUP_SIZE_MIN}–
//                 {GROUP_SIZE_MAX}. The backend also
//                 considers student and question counts.
//               </p>
//             </div>

//             <div>
//               <label className="mb-2 block text-sm font-semibold text-slate-700">
//                 Start At
//               </label>

//               <input
//                 type="datetime-local"
//                 value={
//                   subsectionForm.startAt
//                 }
//                 onChange={(event) =>
//                   setSubsectionForm(
//                     (current) => ({
//                       ...current,
//                       startAt:
//                         event.target.value,
//                     })
//                   )
//                 }
//                 className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900"
//               />
//             </div>

//             <div>
//               <label className="mb-2 block text-sm font-semibold text-slate-700">
//                 Deadline
//               </label>

//               <input
//                 type="datetime-local"
//                 value={
//                   subsectionForm.deadline
//                 }
//                 onChange={(event) =>
//                   setSubsectionForm(
//                     (current) => ({
//                       ...current,
//                       deadline:
//                         event.target.value,
//                     })
//                   )
//                 }
//                 className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900"
//               />
//             </div>
//           </div>

//           <div className="mt-6 flex flex-wrap gap-2">
//             <button
//               type="submit"
//               disabled={saving}
//               className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
//             >
//               {saving
//                 ? "Creating..."
//                 : "Create Subsection"}
//             </button>

//             <button
//               type="button"
//               onClick={() => {
//                 resetSubsectionForm()
//                 setShowSubsectionForm(false)
//               }}
//               className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
//             >
//               Cancel
//             </button>
//           </div>
//         </form>
//       )}

//       {/* =====================================================
//           QUESTION FORM
//       ====================================================== */}

//       {showQuestionForm && (
//         <form
//           onSubmit={createQuestion}
//           className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6 shadow-sm"
//         >
//           <div className="mb-6">
//             <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
//               New Question
//             </p>

//             <h2 className="mt-1 text-xl font-bold text-slate-900">
//               Add Question
//             </h2>

//             <p className="mt-1 text-sm text-slate-500">
//               The database automatically handles
//               question distribution.
//             </p>
//           </div>

//           <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">

//             <div className="lg:col-span-2">
//               <label className="mb-2 block text-sm font-semibold text-slate-700">
//                 Subsection
//                 <span className="ml-1 text-red-500">
//                   *
//                 </span>
//               </label>

//               <select
//                 value={
//                   questionForm.assignmentId
//                 }
//                 onChange={(event) =>
//                   setQuestionForm(
//                     (current) => ({
//                       ...current,
//                       assignmentId:
//                         event.target.value,
//                     })
//                   )
//                 }
//                 className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900"
//               >
//                 <option value="">
//                   Select subsection
//                 </option>

//                 {parents.map((parent) => {
//                   const children =
//                     getAssignmentsForParent(
//                       parent.id
//                     )

//                   return (
//                     <optgroup
//                       key={parent.id}
//                       label={`${parent.title} · ${getTypeLabel(
//                         parent.assignment_type
//                       )}`}
//                     >
//                       {children.map(
//                         (assignment) => (
//                           <option
//                             key={
//                               assignment.id
//                             }
//                             value={
//                               assignment.id
//                             }
//                           >
//                             {getSubsectionName(
//                               assignment
//                             )}
//                           </option>
//                         )
//                       )}
//                     </optgroup>
//                   )
//                 })}
//               </select>
//             </div>

//             <div>
//               <label className="mb-2 block text-sm font-semibold text-slate-700">
//                 Question Number
//                 <span className="ml-1 text-red-500">
//                   *
//                 </span>
//               </label>

//               <input
//                 type="number"
//                 min="1"
//                 value={
//                   questionForm.questionNumber
//                 }
//                 onChange={(event) =>
//                   setQuestionForm(
//                     (current) => ({
//                       ...current,
//                       questionNumber:
//                         event.target.value,
//                     })
//                   )
//                 }
//                 placeholder="1"
//                 className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900"
//               />
//             </div>

//             <div>
//               <label className="mb-2 block text-sm font-semibold text-slate-700">
//                 Points
//               </label>

//               <input
//                 type="number"
//                 min="0"
//                 step="0.5"
//                 value={questionForm.points}
//                 onChange={(event) =>
//                   setQuestionForm(
//                     (current) => ({
//                       ...current,
//                       points:
//                         event.target.value,
//                     })
//                   )
//                 }
//                 className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900"
//               />
//             </div>

//             <div className="lg:col-span-4">
//               <label className="mb-2 block text-sm font-semibold text-slate-700">
//                 Question Title
//               </label>

//               <input
//                 type="text"
//                 value={questionForm.title}
//                 onChange={(event) =>
//                   setQuestionForm(
//                     (current) => ({
//                       ...current,
//                       title:
//                         event.target.value,
//                     })
//                   )
//                 }
//                 placeholder="Optional title"
//                 className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900"
//               />
//             </div>

//             <div className="lg:col-span-4">
//               <label className="mb-2 block text-sm font-semibold text-slate-700">
//                 Question
//                 <span className="ml-1 text-red-500">
//                   *
//                 </span>
//               </label>

//               <textarea
//                 rows={5}
//                 value={
//                   questionForm.questionText
//                 }
//                 onChange={(event) =>
//                   setQuestionForm(
//                     (current) => ({
//                       ...current,
//                       questionText:
//                         event.target.value,
//                     })
//                   )
//                 }
//                 placeholder="Write the complete question..."
//                 className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900"
//               />
//             </div>
//           </div>

//           <div className="mt-6 flex flex-wrap gap-2">
//             <button
//               type="submit"
//               disabled={saving}
//               className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
//             >
//               {saving
//                 ? "Adding..."
//                 : "Add Question"}
//             </button>

//             <button
//               type="button"
//               onClick={() => {
//                 resetQuestionForm()
//                 setShowQuestionForm(false)
//               }}
//               className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
//             >
//               Cancel
//             </button>
//           </div>
//         </form>
//       )}

//       {/* =====================================================
//           NO PARENT TASKS
//       ====================================================== */}

//       {parents.length === 0 && (
//         <EmptyState
//           title="No parent tasks yet"
//           description="Create your first parent task. Its task type can be completely custom."
//           actionLabel="Create Parent Task"
//           onAction={() =>
//             setShowParentForm(true)
//           }
//         />
//       )}

//       {/* =====================================================
//           PARENT TASKS
//       ====================================================== */}

//       <div className="space-y-5">
//         {parents.map((parent) => {
//           const children =
//             getAssignmentsForParent(
//               parent.id
//             )

//           const expanded =
//             expandedParents[parent.id]

//           return (
//             <section
//               key={parent.id}
//               className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
//             >

//               {/* Parent Header */}

//               <div className="border-b border-slate-200 bg-slate-50 p-5">
//                 <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
//                   <div className="min-w-0">
//                     <button
//                       type="button"
//                       onClick={() =>
//                         toggleParent(parent.id)
//                       }
//                       className="flex items-start gap-3 text-left"
//                     >
//                       <span className="mt-1 text-sm text-slate-500">
//                         {expanded
//                           ? "▼"
//                           : "▶"}
//                       </span>

//                       <div>
//                         <h2 className="text-xl font-bold text-slate-900">
//                           {parent.title}
//                         </h2>

//                         <div className="mt-2 flex flex-wrap items-center gap-2">
//                           <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
//                             {getTypeLabel(
//                               parent.assignment_type
//                             )}
//                           </span>

//                           <StatusBadge
//                             status={
//                               parent.status
//                             }
//                           />

//                           <span className="text-xs text-slate-500">
//                             {children.length}{" "}
//                             subsection
//                             {children.length !==
//                             1
//                               ? "s"
//                               : ""}
//                           </span>
//                         </div>
//                       </div>
//                     </button>

//                     {parent.description && (
//                       <p className="mt-3 ml-7 max-w-3xl text-sm leading-6 text-slate-500">
//                         {parent.description}
//                       </p>
//                     )}
//                   </div>

//                   <button
//                     type="button"
//                     onClick={() =>
//                       openSubsectionForm(
//                         parent.id
//                       )
//                     }
//                     className="shrink-0 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
//                   >
//                     + Add Subsection
//                   </button>
//                 </div>
//               </div>

//               {/* Parent Children */}

//               {expanded && (
//                 <div className="p-5">
//                   {children.length === 0 ? (
//                     <EmptyState
//                       title="No subsections yet"
//                       description="Add a custom subsection such as Revision Set, Quiz 1, Project Phase 1, or any other section."
//                       actionLabel="Add Subsection"
//                       onAction={() =>
//                         openSubsectionForm(
//                           parent.id
//                         )
//                       }
//                     />
//                   ) : (
//                     <div className="space-y-5">
//                       {children.map(
//                         (assignment) => {
//                           const stats =
//                             getAssignmentStats(
//                               assignment.id
//                             )

//                           const assignmentQuestions =
//                             getQuestionsForAssignment(
//                               assignment.id
//                             )

//                           const assignmentGroups =
//                             getGroupsForAssignment(
//                               assignment.id
//                             )

//                           return (
//                             <article
//                               key={
//                                 assignment.id
//                               }
//                               className="overflow-hidden rounded-2xl border border-slate-200"
//                             >

//                               {/* Subsection Header */}

//                               <div className="border-b border-slate-200 p-5">
//                                 <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
//                                   <div>
//                                     <div className="flex flex-wrap items-center gap-2">
//                                       <h3 className="text-lg font-bold text-slate-900">
//                                         {getSubsectionName(
//                                           assignment
//                                         )}
//                                       </h3>

//                                       <StatusBadge
//                                         status={
//                                           assignment.status
//                                         }
//                                       />

//                                       <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
//                                         {getTypeLabel(
//                                           assignment.assignment_type
//                                         )}
//                                       </span>
//                                     </div>

//                                     <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
//                                       <span>
//                                         Created{" "}
//                                         {formatDate(
//                                           assignment.created_at
//                                         )}
//                                       </span>

//                                       {assignment.deadline && (
//                                         <span>
//                                           Deadline{" "}
//                                           {formatDate(
//                                             assignment.deadline
//                                           )}
//                                         </span>
//                                       )}
//                                     </div>
//                                   </div>

//                                   <div className="flex flex-wrap gap-2">
//                                     <Link
//                                       to={`/admin/assignments/${assignment.id}`}
//                                       className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
//                                     >
//                                       View Details
//                                     </Link>

//                                     <button
//                                       type="button"
//                                       onClick={() =>
//                                         openQuestionForm(
//                                           assignment.id
//                                         )
//                                       }
//                                       className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
//                                     >
//                                       + Question
//                                     </button>

//                                     <button
//                                       type="button"
//                                       disabled={
//                                         saving
//                                       }
//                                       onClick={() =>
//                                         distributeQuestions(
//                                           assignment.id
//                                         )
//                                       }
//                                       className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
//                                     >
//                                       Redistribute
//                                     </button>

//                                     {assignment.status ===
//                                       "DRAFT" && (
//                                       <button
//                                         type="button"
//                                         disabled={
//                                           saving
//                                         }
//                                         onClick={() =>
//                                           updateAssignmentStatus(
//                                             assignment.id,
//                                             "PUBLISHED"
//                                           )
//                                         }
//                                         className="rounded-lg bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-200"
//                                       >
//                                         Publish
//                                       </button>
//                                     )}

//                                     {assignment.status ===
//                                       "PUBLISHED" && (
//                                       <button
//                                         type="button"
//                                         disabled={
//                                           saving
//                                         }
//                                         onClick={() =>
//                                           updateAssignmentStatus(
//                                             assignment.id,
//                                             "CLOSED"
//                                           )
//                                         }
//                                         className="rounded-lg bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-200"
//                                       >
//                                         Close
//                                       </button>
//                                     )}

//                                     <button
//                                       type="button"
//                                       disabled={
//                                         saving
//                                       }
//                                       onClick={() =>
//                                         deleteAssignment(
//                                           assignment.id
//                                         )
//                                       }
//                                       className="rounded-lg bg-red-100 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-200"
//                                     >
//                                       Delete
//                                     </button>
//                                   </div>
//                                 </div>

//                                 {/* Stats */}

//                                 <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
//                                   <StatCard
//                                     label="Students"
//                                     value={
//                                       stats.totalStudents
//                                     }
//                                   />

//                                   <StatCard
//                                     label="Groups"
//                                     value={
//                                       stats.totalGroups
//                                     }
//                                   />

//                                   <StatCard
//                                     label="Questions"
//                                     value={
//                                       stats.totalQuestions
//                                     }
//                                   />

//                                   <StatCard
//                                     label="Distributed"
//                                     value={`${stats.distributedQuestions}/${stats.totalQuestions}`}
//                                   />
//                                 </div>

//                                 <div className="mt-4 flex flex-wrap items-center gap-2">
//                                   {stats.totalStudents ===
//                                   0 ? (
//                                     <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
//                                       Waiting for students
//                                     </span>
//                                   ) : stats.totalQuestions ===
//                                     0 ? (
//                                     <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700">
//                                       Add questions
//                                     </span>
//                                   ) : stats.unassignedQuestions >
//                                     0 ? (
//                                     <span className="rounded-full bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700">
//                                       Some questions are unassigned
//                                     </span>
//                                   ) : stats.questionBalanced &&
//                                     stats.studentsBalanced ? (
//                                     <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">
//                                       Balanced distribution
//                                     </span>
//                                   ) : (
//                                     <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700">
//                                       Rebalance recommended
//                                     </span>
//                                   )}

//                                   <span className="text-xs text-slate-500">
//                                     Target group size:{" "}
//                                     {Math.max(
//                                       GROUP_SIZE_MIN,
//                                       assignment.group_size ||
//                                         DEFAULT_GROUP_SIZE
//                                     )}
//                                   </span>
//                                 </div>
//                               </div>

//                               {/* Groups */}

//                               <div className="border-b border-slate-200 p-5">
//                                 <div className="flex items-center justify-between gap-4">
//                                   <div>
//                                     <h4 className="text-sm font-bold text-slate-900">
//                                       Group Distribution
//                                     </h4>

//                                     <p className="mt-1 text-xs text-slate-500">
//                                       Groups and question assignments are handled automatically.
//                                     </p>
//                                   </div>

//                                   <span className="text-xs font-semibold text-slate-500">
//                                     {
//                                       assignmentGroups.length
//                                     }{" "}
//                                     active groups
//                                   </span>
//                                 </div>

//                                 {assignmentGroups.length ===
//                                 0 ? (
//                                   <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
//                                     <p className="text-sm text-slate-500">
//                                       No active groups yet.
//                                     </p>

//                                     <p className="mt-1 text-xs text-slate-400">
//                                       Groups are created when students enroll.
//                                     </p>
//                                   </div>
//                                 ) : (
//                                   <div className="mt-4 grid gap-4 lg:grid-cols-2">
//                                     {assignmentGroups.map(
//                                       (group) => {
//                                         const members =
//                                           getMembersForGroup(
//                                             group.id
//                                           )

//                                         const assignedQuestions =
//                                           getQuestionAssignmentsForGroup(
//                                             group.id
//                                           )

//                                         const groupQuestions =
//                                           assignedQuestions
//                                             .map(
//                                               (
//                                                 item
//                                               ) =>
//                                                 assignmentQuestions.find(
//                                                   (
//                                                     question
//                                                   ) =>
//                                                     question.id ===
//                                                     item.question_id
//                                                 )
//                                             )
//                                             .filter(
//                                               Boolean
//                                             )

//                                         return (
//                                           <div
//                                             key={
//                                               group.id
//                                             }
//                                             className="rounded-xl border border-slate-200 bg-slate-50 p-4"
//                                           >
//                                             <div className="flex items-start justify-between gap-3">
//                                               <div>
//                                                 <h5 className="font-semibold text-slate-900">
//                                                   {
//                                                     group.name
//                                                   }
//                                                 </h5>

//                                                 <p className="mt-1 text-xs text-slate-500">
//                                                   {
//                                                     members.length
//                                                   }{" "}
//                                                   students ·{" "}
//                                                   {
//                                                     groupQuestions.length
//                                                   }{" "}
//                                                   questions
//                                                 </p>
//                                               </div>

//                                               <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-slate-700">
//                                                 {
//                                                   members.length
//                                                 }
//                                                 /
//                                                 {
//                                                   group.max_members
//                                                 }
//                                               </span>
//                                             </div>

//                                             <div className="mt-4">
//                                               <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
//                                                 Assigned Questions
//                                               </p>

//                                               {groupQuestions.length ===
//                                               0 ? (
//                                                 <p className="mt-2 text-xs text-slate-400">
//                                                   No questions assigned.
//                                                 </p>
//                                               ) : (
//                                                 <div className="mt-2 flex flex-wrap gap-2">
//                                                   {groupQuestions.map(
//                                                     (
//                                                       question
//                                                     ) => (
//                                                       <span
//                                                         key={
//                                                           question.id
//                                                         }
//                                                         className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700"
//                                                       >
//                                                         Q
//                                                         {
//                                                           question.question_number
//                                                         }
//                                                       </span>
//                                                     )
//                                                   )}
//                                                 </div>
//                                               )}
//                                             </div>
//                                           </div>
//                                         )
//                                       }
//                                     )}
//                                   </div>
//                                 )}
//                               </div>

//                               {/* Questions */}

//                               <div className="p-5">
//                                 <div className="flex items-center justify-between gap-4">
//                                   <div>
//                                     <h4 className="text-sm font-bold text-slate-900">
//                                       Questions
//                                     </h4>

//                                     <p className="mt-1 text-xs text-slate-500">
//                                       Each question can have one active group assignment.
//                                     </p>
//                                   </div>

//                                   <button
//                                     type="button"
//                                     onClick={() =>
//                                       openQuestionForm(
//                                         assignment.id
//                                       )
//                                     }
//                                     className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
//                                   >
//                                     + Add
//                                   </button>
//                                 </div>

//                                 {assignmentQuestions.length ===
//                                 0 ? (
//                                   <div className="mt-4">
//                                     <EmptyState
//                                       title="No questions"
//                                       description="Add questions to this subsection. They will be automatically distributed."
//                                       actionLabel="Add Question"
//                                       onAction={() =>
//                                         openQuestionForm(
//                                           assignment.id
//                                         )
//                                       }
//                                     />
//                                   </div>
//                                 ) : (
//                                   <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
//                                     <table className="min-w-full divide-y divide-slate-200">
//                                       <thead className="bg-slate-50">
//                                         <tr>
//                                           <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
//                                             #
//                                           </th>

//                                           <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
//                                             Question
//                                           </th>

//                                           <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
//                                             Points
//                                           </th>

//                                           <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
//                                             Group
//                                           </th>
//                                         </tr>
//                                       </thead>

//                                       <tbody className="divide-y divide-slate-200 bg-white">
//                                         {assignmentQuestions.map(
//                                           (
//                                             question
//                                           ) => {
//                                             const assignmentItem =
//                                               getQuestionAssignmentForQuestion(
//                                                 question.id
//                                               )

//                                             const assignedGroup =
//                                               assignmentItem
//                                                 ? assignmentGroups.find(
//                                                     (
//                                                       group
//                                                     ) =>
//                                                       group.id ===
//                                                       assignmentItem.group_id
//                                                   )
//                                                 : null

//                                             return (
//                                               <tr
//                                                 key={
//                                                   question.id
//                                                 }
//                                                 className="hover:bg-slate-50"
//                                               >
//                                                 <td className="whitespace-nowrap px-4 py-3 text-sm font-bold text-slate-700">
//                                                   Q
//                                                   {
//                                                     question.question_number
//                                                   }
//                                                 </td>

//                                                 <td className="max-w-xl px-4 py-3">
//                                                   <p className="truncate text-sm font-medium text-slate-900">
//                                                     {question.title ||
//                                                       question.question_text}
//                                                   </p>
//                                                 </td>

//                                                 <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
//                                                   {
//                                                     question.points
//                                                   }
//                                                 </td>

//                                                 <td className="whitespace-nowrap px-4 py-3">
//                                                   {assignedGroup ? (
//                                                     <span className="rounded-lg bg-emerald-100 px-2.5 py-1.5 text-xs font-semibold text-emerald-700">
//                                                       {
//                                                         assignedGroup.name
//                                                       }
//                                                     </span>
//                                                   ) : (
//                                                     <span className="rounded-lg bg-red-100 px-2.5 py-1.5 text-xs font-semibold text-red-700">
//                                                       Unassigned
//                                                     </span>
//                                                   )}
//                                                 </td>
//                                               </tr>
//                                             )
//                                           }
//                                         )}
//                                       </tbody>
//                                     </table>
//                                   </div>
//                                 )}
//                               </div>
//                             </article>
//                           )
//                         }
//                       )}
//                     </div>
//                   )}
//                 </div>
//               )}
//             </section>
//           )
//         })}
//       </div>
//     </div>
//   )
// }



import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { supabase } from "../lib/supabase"

const GROUP_SIZE_MIN = 1
const GROUP_SIZE_MAX = 50
const DEFAULT_GROUP_SIZE = 10

const STATUS_OPTIONS = [
  "DRAFT",
  "PUBLISHED",
  "CLOSED",
  "ARCHIVED",
]

function formatDate(value) {
  if (!value) return "—"

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function getTypeLabel(type) {
  if (!type) return "No Type"

  return type
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function getSubsectionName(assignment) {
  if (assignment.section_name?.trim()) {
    return assignment.section_name.trim()
  }

  if (
    assignment.week_number !== null &&
    assignment.week_number !== undefined
  ) {
    return `Week ${assignment.week_number}`
  }

  return "Subsection"
}

function getStatusClasses(status) {
  if (status === "PUBLISHED") {
    return "bg-emerald-100 text-emerald-700"
  }

  if (status === "CLOSED") {
    return "bg-red-100 text-red-700"
  }

  if (status === "ARCHIVED") {
    return "bg-slate-200 text-slate-700"
  }

  return "bg-amber-100 text-amber-700"
}

function StatCard({ label, value, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold text-slate-900">
        {value}
      </p>

      {description && (
        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
        status
      )}`}
    >
      {status}
    </span>
  )
}

function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
      <h3 className="text-sm font-bold text-slate-900">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export default function Assignments() {
  const [user, setUser] = useState(null)

  const [parents, setParents] = useState([])
  const [assignments, setAssignments] = useState([])
  const [questions, setQuestions] = useState([])
  const [groups, setGroups] = useState([])
  const [groupMembers, setGroupMembers] = useState([])
  const [questionAssignments, setQuestionAssignments] =
    useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [expandedParents, setExpandedParents] = useState({})

  const [showParentForm, setShowParentForm] =
    useState(false)

  const [showSubsectionForm, setShowSubsectionForm] =
    useState(false)

  const [showQuestionForm, setShowQuestionForm] =
    useState(false)

  const [parentForm, setParentForm] = useState({
    title: "",
    description: "",
    assignmentType: "",
  })

  const [subsectionForm, setSubsectionForm] = useState({
    parentTaskId: "",
    sectionName: "",
    totalQuestions: 0,
    groupSize: DEFAULT_GROUP_SIZE,
    startAt: "",
    deadline: "",
  })

  const [questionForm, setQuestionForm] = useState({
    assignmentId: "",
    questionNumber: "",
    title: "",
    questionText: "",
    points: 1,
  })

  useEffect(() => {
    loadPage()
  }, [])

  // =========================================================
  // DATA LOADING
  // =========================================================

  async function loadPage() {
    try {
      setLoading(true)
      setError("")

      const {
        data: { user: currentUser },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) {
        throw authError
      }

      if (!currentUser) {
        throw new Error(
          "Admin session was not found."
        )
      }

      setUser(currentUser)

      await loadAllData()
    } catch (err) {
      console.error(err)

      setError(
        err.message ||
          "Failed to load assignment management."
      )
    } finally {
      setLoading(false)
    }
  }

  async function loadAllData() {
    const [
      parentResult,
      assignmentResult,
      questionResult,
      groupResult,
      memberResult,
      questionAssignmentResult,
    ] = await Promise.all([
      supabase
        .from("parent_tasks")
        .select(`
          id,
          title,
          description,
          assignment_type,
          status,
          created_by,
          created_at,
          updated_at
        `)
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("assignments")
        .select(`
          id,
          parent_task_id,
          title,
          description,
          assignment_type,
          status,
          section_name,
          week_number,
          total_questions,
          group_size,
          start_at,
          deadline,
          created_by,
          created_at,
          updated_at
        `)
        .order("created_at", {
          ascending: true,
        }),

      supabase
        .from("questions")
        .select(`
          id,
          assignment_id,
          question_number,
          title,
          question_text,
          points,
          created_at
        `)
        .order("question_number", {
          ascending: true,
        }),

      supabase
        .from("groups")
        .select(`
          id,
          assignment_id,
          name,
          max_members,
          is_active,
          created_at
        `)
        .eq("is_active", true)
        .order("created_at", {
          ascending: true,
        }),

      supabase
        .from("assignment_group_members")
        .select(`
          id,
          assignment_id,
          group_id,
          user_id,
          joined_at,
          left_at,
          is_active
        `)
        .eq("is_active", true),

      supabase
        .from("question_assignments")
        .select(`
          id,
          question_id,
          group_id,
          assigned_at,
          assigned_by,
          is_active
        `)
        .eq("is_active", true),
    ])

    if (parentResult.error) {
      throw parentResult.error
    }

    if (assignmentResult.error) {
      throw assignmentResult.error
    }

    if (questionResult.error) {
      throw questionResult.error
    }

    if (groupResult.error) {
      throw groupResult.error
    }

    if (memberResult.error) {
      throw memberResult.error
    }

    if (questionAssignmentResult.error) {
      throw questionAssignmentResult.error
    }

    const loadedParents = parentResult.data || []

    setParents(loadedParents)
    setAssignments(assignmentResult.data || [])
    setQuestions(questionResult.data || [])
    setGroups(groupResult.data || [])
    setGroupMembers(memberResult.data || [])
    setQuestionAssignments(
      questionAssignmentResult.data || []
    )

    setExpandedParents((current) => {
      const next = { ...current }

      loadedParents.forEach((parent) => {
        if (next[parent.id] === undefined) {
          next[parent.id] = true
        }
      })

      return next
    })
  }

  // =========================================================
  // GENERAL HELPERS
  // =========================================================

  function clearMessages() {
    setError("")
    setSuccess("")
  }

  function toggleParent(parentId) {
    setExpandedParents((current) => ({
      ...current,
      [parentId]: !current[parentId],
    }))
  }

  function getAssignmentsForParent(parentId) {
    return assignments
      .filter(
        (assignment) =>
          assignment.parent_task_id === parentId
      )
      .sort((a, b) => {
        const aWeek =
          a.week_number !== null &&
          a.week_number !== undefined

        const bWeek =
          b.week_number !== null &&
          b.week_number !== undefined

        if (aWeek && bWeek) {
          return a.week_number - b.week_number
        }

        return (
          new Date(a.created_at) -
          new Date(b.created_at)
        )
      })
  }

  function getQuestionsForAssignment(
    assignmentId
  ) {
    return questions
      .filter(
        (question) =>
          question.assignment_id === assignmentId
      )
      .sort(
        (a, b) =>
          a.question_number -
          b.question_number
      )
  }

  function getGroupsForAssignment(
    assignmentId
  ) {
    return groups
      .filter(
        (group) =>
          group.assignment_id === assignmentId &&
          group.is_active
      )
      .sort(
        (a, b) =>
          new Date(a.created_at) -
          new Date(b.created_at)
      )
  }

  function getMembersForGroup(groupId) {
    return groupMembers.filter(
      (member) =>
        member.group_id === groupId &&
        member.is_active
    )
  }

  function getQuestionAssignmentsForGroup(
    groupId
  ) {
    return questionAssignments.filter(
      (item) =>
        item.group_id === groupId &&
        item.is_active
    )
  }

  function getQuestionAssignmentForQuestion(
    questionId
  ) {
    return questionAssignments.find(
      (item) =>
        item.question_id === questionId &&
        item.is_active
    )
  }

  function getAssignmentStats(assignmentId) {
    const assignmentQuestions =
      getQuestionsForAssignment(assignmentId)

    const assignmentGroups =
      getGroupsForAssignment(assignmentId)

    const assignmentMembers =
      groupMembers.filter(
        (member) =>
          member.assignment_id === assignmentId &&
          member.is_active
      )

    const assignmentQuestionAssignments =
      questionAssignments.filter((item) =>
        assignmentQuestions.some(
          (question) =>
            question.id === item.question_id
        )
      )

    const questionCounts =
      assignmentGroups.map(
        (group) =>
          getQuestionAssignmentsForGroup(
            group.id
          ).length
      )

    const studentCounts =
      assignmentGroups.map(
        (group) =>
          getMembersForGroup(group.id).length
      )

    const maxQuestionCount =
      questionCounts.length > 0
        ? Math.max(...questionCounts)
        : 0

    const minQuestionCount =
      questionCounts.length > 0
        ? Math.min(...questionCounts)
        : 0

    const maxStudentCount =
      studentCounts.length > 0
        ? Math.max(...studentCounts)
        : 0

    const minStudentCount =
      studentCounts.length > 0
        ? Math.min(...studentCounts)
        : 0

    return {
      totalStudents: assignmentMembers.length,

      totalGroups:
        assignmentGroups.length,

      totalQuestions:
        assignmentQuestions.length,

      distributedQuestions:
        assignmentQuestionAssignments.length,

      unassignedQuestions: Math.max(
        0,
        assignmentQuestions.length -
          assignmentQuestionAssignments.length
      ),

      questionBalanced:
        questionCounts.length === 0 ||
        maxQuestionCount -
          minQuestionCount <=
          1,

      studentsBalanced:
        studentCounts.length === 0 ||
        maxStudentCount -
          minStudentCount <=
          1,
    }
  }

  const overallStats = useMemo(() => {
    return {
      parents: parents.length,

      subsections:
        assignments.length,

      students:
        new Set(
          groupMembers.map(
            (member) => member.user_id
          )
        ).size,

      questions: questions.length,
    }
  }, [
    parents,
    assignments,
    groupMembers,
    questions,
  ])

  // =========================================================
  // PARENT TASK
  // =========================================================

  function resetParentForm() {
    setParentForm({
      title: "",
      description: "",
      assignmentType: "",
    })
  }

  async function createParentTask(event) {
    event.preventDefault()

    clearMessages()

    if (!user?.id) {
      setError("Admin user not found.")
      return
    }

    const title =
      parentForm.title.trim()

    const description =
      parentForm.description.trim()

    const assignmentType =
      parentForm.assignmentType.trim()

    if (!title) {
      setError(
        "Parent task title is required."
      )
      return
    }

    if (!assignmentType) {
      setError(
        "Task type is required."
      )
      return
    }

    try {
      setSaving(true)

      const { data, error } =
        await supabase
          .from("parent_tasks")
          .insert({
            title,

            description:
              description || null,

            assignment_type:
              assignmentType,

            status: "DRAFT",

            created_by: user.id,
          })
          .select()
          .single()

      if (error) {
        throw error
      }

      setParents((current) => [
        data,
        ...current,
      ])

      setExpandedParents((current) => ({
        ...current,
        [data.id]: true,
      }))

      resetParentForm()
      setShowParentForm(false)

      setSuccess(
        `Parent task "${data.title}" created successfully.`
      )
    } catch (err) {
      console.error(err)

      setError(
        err.message ||
          "Failed to create parent task."
      )
    } finally {
      setSaving(false)
    }
  }

  // NEW: DELETE PARENT TASK
  async function deleteParentTask(parentId) {
    const parent = parents.find(
      (item) => item.id === parentId
    )

    if (!parent) {
      setError("Parent task was not found.")
      return
    }

    const children = getAssignmentsForParent(parentId)

    // Avoid accidentally deleting subsections and their related data.
    if (children.length > 0) {
      setError(
        `Cannot delete "${parent.title}" because it has ${children.length} subsection(s). Delete its subsections first.`
      )
      setSuccess("")
      return
    }

    const confirmed = window.confirm(
      `Delete parent task "${parent.title}"?\n\nThis action cannot be undone.`
    )

    if (!confirmed) return

    clearMessages()

    try {
      setSaving(true)

      const { error } = await supabase
        .from("parent_tasks")
        .delete()
        .eq("id", parentId)

      if (error) {
        throw error
      }

      setParents((current) =>
        current.filter((item) => item.id !== parentId)
      )

      setExpandedParents((current) => {
        const next = { ...current }
        delete next[parentId]
        return next
      })

      // Clear the selected parent if the subsection form was open.
      setSubsectionForm((current) =>
        current.parentTaskId === parentId
          ? { ...current, parentTaskId: "" }
          : current
      )

      setSuccess(
        `Parent task "${parent.title}" deleted successfully.`
      )
    } catch (err) {
      console.error(err)

      setError(
        err.message ||
          "Failed to delete parent task. Check whether related records still exist."
      )
    } finally {
      setSaving(false)
    }
  }

  // =========================================================
  // SUBSECTION
  // =========================================================

  function resetSubsectionForm() {
    setSubsectionForm({
      parentTaskId: "",
      sectionName: "",
      totalQuestions: 0,
      groupSize: DEFAULT_GROUP_SIZE,
      startAt: "",
      deadline: "",
    })
  }

  function openSubsectionForm(parentId = "") {
    setSubsectionForm((current) => ({
      ...current,

      parentTaskId:
        parentId ||
        current.parentTaskId ||
        parents[0]?.id ||
        "",
    }))

    setShowSubsectionForm(true)

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  async function createSubsection(event) {
    event.preventDefault()

    clearMessages()

    if (!user?.id) {
      setError("Admin user not found.")
      return
    }

    const parent =
      parents.find(
        (item) =>
          item.id ===
          subsectionForm.parentTaskId
      )

    if (!parent) {
      setError(
        "Please select a valid parent task."
      )
      return
    }

    const sectionName =
      subsectionForm.sectionName.trim()

    if (!sectionName) {
      setError(
        "Subsection name is required."
      )
      return
    }

    const totalQuestions = Math.max(
      0,
      Number(
        subsectionForm.totalQuestions
      ) || 0
    )

    const groupSize = Math.min(
      GROUP_SIZE_MAX,
      Math.max(
        GROUP_SIZE_MIN,
        Number(
          subsectionForm.groupSize
        ) || DEFAULT_GROUP_SIZE
      )
    )

    try {
      setSaving(true)

      const payload = {
        parent_task_id: parent.id,

        title: parent.title,

        description:
          parent.description || null,

        assignment_type:
          parent.assignment_type,

        status: "DRAFT",

        section_name: sectionName,

        total_questions:
          totalQuestions,

        group_size: groupSize,

        start_at:
          subsectionForm.startAt || null,

        deadline:
          subsectionForm.deadline || null,

        created_by: user.id,
      }

      const { data, error } =
        await supabase
          .from("assignments")
          .insert(payload)
          .select()
          .single()

      if (error) {
        throw error
      }

      setAssignments((current) => [
        ...current,
        data,
      ])

      setExpandedParents((current) => ({
        ...current,
        [parent.id]: true,
      }))

      resetSubsectionForm()
      setShowSubsectionForm(false)

      setSuccess(
        `Subsection "${sectionName}" created successfully.`
      )
    } catch (err) {
      console.error(err)

      setError(
        err.message ||
          "Failed to create subsection."
      )
    } finally {
      setSaving(false)
    }
  }

  // =========================================================
  // QUESTIONS
  // =========================================================

  function resetQuestionForm() {
    setQuestionForm({
      assignmentId: "",
      questionNumber: "",
      title: "",
      questionText: "",
      points: 1,
    })
  }

  function openQuestionForm(
    assignmentId = ""
  ) {
    setQuestionForm((current) => ({
      ...current,

      assignmentId:
        assignmentId ||
        current.assignmentId ||
        "",
    }))

    setShowQuestionForm(true)

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  async function createQuestion(event) {
    event.preventDefault()

    clearMessages()

    if (!questionForm.assignmentId) {
      setError(
        "Please select a subsection."
      )
      return
    }

    const questionNumber = Number(
      questionForm.questionNumber
    )

    if (
      !Number.isInteger(questionNumber) ||
      questionNumber <= 0
    ) {
      setError(
        "Enter a valid question number."
      )
      return
    }

    const questionText =
      questionForm.questionText.trim()

    if (!questionText) {
      setError(
        "Question text is required."
      )
      return
    }

    const points =
      Number(questionForm.points)

    try {
      setSaving(true)

      const { data, error } =
        await supabase
          .from("questions")
          .insert({
            assignment_id:
              questionForm.assignmentId,

            question_number:
              questionNumber,

            title:
              questionForm.title.trim() ||
              null,

            question_text:
              questionText,

            points:
              Number.isFinite(points)
                ? points
                : 1,
          })
          .select()
          .single()

      if (error) {
        throw error
      }

      setQuestions((current) => [
        ...current,
        data,
      ])

      resetQuestionForm()
      setShowQuestionForm(false)

      await loadAllData()

      setSuccess(
        "Question added. Automatic distribution has been refreshed."
      )
    } catch (err) {
      console.error(err)

      setError(
        err.message ||
          "Failed to create question."
      )
    } finally {
      setSaving(false)
    }
  }

  // =========================================================
  // STATUS
  // =========================================================

  async function updateAssignmentStatus(
    assignmentId,
    status
  ) {
    if (!STATUS_OPTIONS.includes(status)) {
      return
    }

    clearMessages()

    try {
      setSaving(true)

      const { data, error } =
        await supabase
          .from("assignments")
          .update({
            status,

            updated_at:
              new Date().toISOString(),
          })
          .eq("id", assignmentId)
          .select()
          .single()

      if (error) {
        throw error
      }

      setAssignments((current) =>
        current.map((item) =>
          item.id === assignmentId
            ? data
            : item
        )
      )

      setSuccess(
        `Subsection status changed to ${status}.`
      )
    } catch (err) {
      console.error(err)

      setError(
        err.message ||
          "Failed to update status."
      )
    } finally {
      setSaving(false)
    }
  }

  // =========================================================
  // DISTRIBUTION
  // =========================================================

  async function distributeQuestions(
    assignmentId
  ) {
    clearMessages()

    try {
      setSaving(true)

      const { data, error } =
        await supabase.rpc(
          "distribute_assignment_questions",
          {
            p_assignment_id:
              assignmentId,
          }
        )

      if (error) {
        throw error
      }

      await loadAllData()

      setSuccess(
        `Questions redistributed successfully${
          data
            ? `: ${data.groups ?? 0} groups and ${
                data.questions ?? 0
              } questions processed.`
            : "."
        }`
      )
    } catch (err) {
      console.error(err)

      setError(
        err.message ||
          "Failed to redistribute questions."
      )
    } finally {
      setSaving(false)
    }
  }

  // =========================================================
  // DELETE SUBSECTION
  // =========================================================

  async function deleteAssignment(
    assignmentId
  ) {
    const assignment =
      assignments.find(
        (item) =>
          item.id === assignmentId
      )

    if (!assignment) {
      return
    }

    const confirmed =
      window.confirm(
        `Delete "${getSubsectionName(
          assignment
        )}"?\n\nThis will also remove its related questions, groups, memberships and question assignments.`
      )

    if (!confirmed) {
      return
    }

    clearMessages()

    try {
      setSaving(true)

      const { error } =
        await supabase
          .from("assignments")
          .delete()
          .eq("id", assignmentId)

      if (error) {
        throw error
      }

      const assignmentQuestionIds =
        questions
          .filter(
            (question) =>
              question.assignment_id ===
              assignmentId
          )
          .map(
            (question) => question.id
          )

      setAssignments((current) =>
        current.filter(
          (item) =>
            item.id !== assignmentId
        )
      )

      setQuestions((current) =>
        current.filter(
          (item) =>
            item.assignment_id !==
            assignmentId
        )
      )

      setGroups((current) =>
        current.filter(
          (item) =>
            item.assignment_id !==
            assignmentId
        )
      )

      setGroupMembers((current) =>
        current.filter(
          (item) =>
            item.assignment_id !==
            assignmentId
        )
      )

      setQuestionAssignments(
        (current) =>
          current.filter(
            (item) =>
              !assignmentQuestionIds.includes(
                item.question_id
              )
          )
      )

      setSuccess(
        "Subsection deleted successfully."
      )
    } catch (err) {
      console.error(err)

      setError(
        err.message ||
          "Failed to delete subsection."
      )
    } finally {
      setSaving(false)
    }
  }

  // =========================================================
  // LOADING UI
  // =========================================================

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />

          <p className="mt-4 text-sm text-slate-500">
            Loading assignment management...
          </p>
        </div>
      </div>
    )
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-indigo-600">
            ADMIN WORKSPACE
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Assignments
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Create parent tasks, add custom subsections,
            manage questions and monitor automatic
            student/group distribution.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              setShowParentForm(
                (current) => !current
              )
            }
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            + Parent Task
          </button>

          <button
            type="button"
            onClick={() =>
              openSubsectionForm()
            }
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            + Subsection
          </button>

          <button
            type="button"
            onClick={() =>
              openQuestionForm()
            }
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            + Question
          </button>
        </div>
      </div>

      {/* =====================================================
          MESSAGES
      ====================================================== */}

      {error && (
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            className="font-bold text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <span>{success}</span>

          <button
            type="button"
            onClick={() => setSuccess("")}
            className="font-bold text-emerald-500 hover:text-emerald-700"
          >
            ×
          </button>
        </div>
      )}

      {/* =====================================================
          STATS
      ====================================================== */}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Parent Tasks"
          value={overallStats.parents}
          description="Main task containers"
        />

        <StatCard
          label="Subsections"
          value={overallStats.subsections}
          description="Custom sections"
        />

        <StatCard
          label="Students"
          value={overallStats.students}
          description="Active participants"
        />

        <StatCard
          label="Questions"
          value={overallStats.questions}
          description="Total questions"
        />
      </div>

      {/* =====================================================
          PARENT TASK FORM
      ====================================================== */}

      {showParentForm && (
        <form
          onSubmit={createParentTask}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
              New Parent Task
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Create Parent Task
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              The task type is fully custom. Enter
              whatever type makes sense for your course.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Parent Task Title
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <input
                type="text"
                value={parentForm.title}
                onChange={(event) =>
                  setParentForm(
                    (current) => ({
                      ...current,
                      title:
                        event.target.value,
                    })
                  )
                }
                placeholder="e.g. Machine Learning Practice"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Description
              </label>

              <textarea
                rows={3}
                value={parentForm.description}
                onChange={(event) =>
                  setParentForm(
                    (current) => ({
                      ...current,
                      description:
                        event.target.value,
                    })
                  )
                }
                placeholder="Optional description for this parent task..."
                className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Task Type
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <input
                type="text"
                value={
                  parentForm.assignmentType
                }
                onChange={(event) =>
                  setParentForm(
                    (current) => ({
                      ...current,
                      assignmentType:
                        event.target.value,
                    })
                  )
                }
                placeholder="e.g. Practice, Project, Revision, Workshop, Lab"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-100"
              />

              <p className="mt-2 text-xs text-slate-500">
                Custom text is allowed. There is no
                predefined task-type list.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Creating..."
                : "Create Parent Task"}
            </button>

            <button
              type="button"
              onClick={() => {
                resetParentForm()
                setShowParentForm(false)
              }}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* =====================================================
          SUBSECTION FORM
      ====================================================== */}

      {showSubsectionForm && (
        <form
          onSubmit={createSubsection}
          className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-6 shadow-sm"
        >
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
              New Subsection
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Create Subsection
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Subsection names are completely custom.
              There is no fixed Week structure.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Parent Task
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <select
                value={
                  subsectionForm.parentTaskId
                }
                onChange={(event) =>
                  setSubsectionForm(
                    (current) => ({
                      ...current,
                      parentTaskId:
                        event.target.value,
                    })
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900"
              >
                <option value="">
                  Select parent task
                </option>

                {parents.map((parent) => (
                  <option
                    key={parent.id}
                    value={parent.id}
                  >
                    {parent.title} ·{" "}
                    {getTypeLabel(
                      parent.assignment_type
                    )}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Subsection Name
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <input
                type="text"
                value={
                  subsectionForm.sectionName
                }
                onChange={(event) =>
                  setSubsectionForm(
                    (current) => ({
                      ...current,
                      sectionName:
                        event.target.value,
                    })
                  )
                }
                placeholder="e.g. Revision Set"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Total Questions
              </label>

              <input
                type="number"
                min="0"
                value={
                  subsectionForm.totalQuestions
                }
                onChange={(event) =>
                  setSubsectionForm(
                    (current) => ({
                      ...current,
                      totalQuestions:
                        event.target.value,
                    })
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Target Group Size
              </label>

              <input
                type="number"
                min={GROUP_SIZE_MIN}
                max={GROUP_SIZE_MAX}
                value={
                  subsectionForm.groupSize
                }
                onChange={(event) => {
                  const value =
                    Number(
                      event.target.value
                    ) || DEFAULT_GROUP_SIZE

                  setSubsectionForm(
                    (current) => ({
                      ...current,
                      groupSize: Math.min(
                        GROUP_SIZE_MAX,
                        Math.max(
                          GROUP_SIZE_MIN,
                          value
                        )
                      ),
                    })
                  )
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900"
              />

              <p className="mt-2 text-xs text-slate-500">
                Target is {GROUP_SIZE_MIN}–
                {GROUP_SIZE_MAX}. The backend also
                considers student and question counts.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Start At
              </label>

              <input
                type="datetime-local"
                value={
                  subsectionForm.startAt
                }
                onChange={(event) =>
                  setSubsectionForm(
                    (current) => ({
                      ...current,
                      startAt:
                        event.target.value,
                    })
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Deadline
              </label>

              <input
                type="datetime-local"
                value={
                  subsectionForm.deadline
                }
                onChange={(event) =>
                  setSubsectionForm(
                    (current) => ({
                      ...current,
                      deadline:
                        event.target.value,
                    })
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving
                ? "Creating..."
                : "Create Subsection"}
            </button>

            <button
              type="button"
              onClick={() => {
                resetSubsectionForm()
                setShowSubsectionForm(false)
              }}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* =====================================================
          QUESTION FORM
      ====================================================== */}

      {showQuestionForm && (
        <form
          onSubmit={createQuestion}
          className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6 shadow-sm"
        >
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
              New Question
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Add Question
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              The database automatically handles
              question distribution.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">

            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Subsection
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <select
                value={
                  questionForm.assignmentId
                }
                onChange={(event) =>
                  setQuestionForm(
                    (current) => ({
                      ...current,
                      assignmentId:
                        event.target.value,
                    })
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900"
              >
                <option value="">
                  Select subsection
                </option>

                {parents.map((parent) => {
                  const children =
                    getAssignmentsForParent(
                      parent.id
                    )

                  return (
                    <optgroup
                      key={parent.id}
                      label={`${parent.title} · ${getTypeLabel(
                        parent.assignment_type
                      )}`}
                    >
                      {children.map(
                        (assignment) => (
                          <option
                            key={
                              assignment.id
                            }
                            value={
                              assignment.id
                            }
                          >
                            {getSubsectionName(
                              assignment
                            )}
                          </option>
                        )
                      )}
                    </optgroup>
                  )
                })}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Question Number
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <input
                type="number"
                min="1"
                value={
                  questionForm.questionNumber
                }
                onChange={(event) =>
                  setQuestionForm(
                    (current) => ({
                      ...current,
                      questionNumber:
                        event.target.value,
                    })
                  )
                }
                placeholder="1"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Points
              </label>

              <input
                type="number"
                min="0"
                step="0.5"
                value={questionForm.points}
                onChange={(event) =>
                  setQuestionForm(
                    (current) => ({
                      ...current,
                      points:
                        event.target.value
                    })
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900"
              />
            </div>

            <div className="lg:col-span-4">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Question Title
              </label>

              <input
                type="text"
                value={questionForm.title}
                onChange={(event) =>
                  setQuestionForm(
                    (current) => ({
                      ...current,
                      title:
                        event.target.value
                    })
                  )
                }
                placeholder="Optional title"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900"
              />
            </div>

            <div className="lg:col-span-4">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Question
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <textarea
                rows={5}
                value={
                  questionForm.questionText
                }
                onChange={(event) =>
                  setQuestionForm(
                    (current) => ({
                      ...current,
                      questionText:
                        event.target.value
                    })
                  )
                }
                placeholder="Write the complete question..."
                className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving
                ? "Adding..."
                : "Add Question"}
            </button>

            <button
              type="button"
              onClick={() => {
                resetQuestionForm()
                setShowQuestionForm(false)
              }}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* =====================================================
          NO PARENT TASKS
      ====================================================== */}

      {parents.length === 0 && (
        <EmptyState
          title="No parent tasks yet"
          description="Create your first parent task. Its task type can be completely custom."
          actionLabel="Create Parent Task"
          onAction={() =>
            setShowParentForm(true)
          }
        />
      )}

      {/* =====================================================
          PARENT TASKS
      ====================================================== */}

      <div className="space-y-5">
        {parents.map((parent) => {
          const children =
            getAssignmentsForParent(
              parent.id
            )

          const expanded =
            expandedParents[parent.id]

          return (
            <section
              key={parent.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >

              {/* Parent Header */}

              <div className="border-b border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() =>
                        toggleParent(parent.id)
                      }
                      className="flex items-start gap-3 text-left"
                    >
                      <span className="mt-1 text-sm text-slate-500">
                        {expanded
                          ? "▼"
                          : "▶"}
                      </span>

                      <div>
                        <h2 className="text-xl font-bold text-slate-900">
                          {parent.title}
                        </h2>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                            {getTypeLabel(
                              parent.assignment_type
                            )}
                          </span>

                          <StatusBadge
                            status={
                              parent.status
                            }
                          />

                          <span className="text-xs text-slate-500">
                            {children.length}{" "}
                            subsection
                            {children.length !==
                            1
                              ? "s"
                              : ""}
                          </span>
                        </div>
                      </div>
                    </button>

                    {parent.description && (
                      <p className="mt-3 ml-7 max-w-3xl text-sm leading-6 text-slate-500">
                        {parent.description}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        openSubsectionForm(parent.id)
                      }
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      + Add Subsection
                    </button>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        deleteParentTask(parent.id)
                      }
                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Delete Parent
                    </button>
                  </div>
                </div>
              </div>

              {/* Parent Children */}

              {expanded && (
                <div className="p-5">
                  {children.length === 0 ? (
                    <EmptyState
                      title="No subsections yet"
                      description="Add a custom subsection such as Revision Set, Quiz 1, Project Phase 1, or any other section."
                      actionLabel="Add Subsection"
                      onAction={() =>
                        openSubsectionForm(
                          parent.id
                        )
                      }
                    />
                  ) : (
                    <div className="space-y-5">
                      {children.map(
                        (assignment) => {
                          const stats =
                            getAssignmentStats(
                              assignment.id
                            )

                          const assignmentQuestions =
                            getQuestionsForAssignment(
                              assignment.id
                            )

                          const assignmentGroups =
                            getGroupsForAssignment(
                              assignment.id
                            )

                          return (
                            <article
                              key={
                                assignment.id
                              }
                              className="overflow-hidden rounded-2xl border border-slate-200"
                            >

                              {/* Subsection Header */}

                              <div className="border-b border-slate-200 p-5">
                                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h3 className="text-lg font-bold text-slate-900">
                                        {getSubsectionName(
                                          assignment
                                        )}
                                      </h3>

                                      <StatusBadge
                                        status={
                                          assignment.status
                                        }
                                      />

                                      <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                                        {getTypeLabel(
                                          assignment.assignment_type
                                        )}
                                      </span>
                                    </div>

                                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                      <span>
                                        Created{" "}
                                        {formatDate(
                                          assignment.created_at
                                        )}
                                      </span>

                                      {assignment.deadline && (
                                        <span>
                                          Deadline{" "}
                                          {formatDate(
                                            assignment.deadline
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap gap-2">
                                    <Link
                                      to={`/admin/assignments/${assignment.id}`}
                                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                    >
                                      View Details
                                    </Link>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        openQuestionForm(
                                          assignment.id
                                        )
                                      }
                                      className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                                    >
                                      + Question
                                    </button>

                                    <button
                                      type="button"
                                      disabled={
                                        saving
                                      }
                                      onClick={() =>
                                        distributeQuestions(
                                          assignment.id
                                        )
                                      }
                                      className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                      Redistribute
                                    </button>

                                    {assignment.status ===
                                      "DRAFT" && (
                                      <button
                                        type="button"
                                        disabled={
                                          saving
                                        }
                                        onClick={() =>
                                          updateAssignmentStatus(
                                            assignment.id,
                                            "PUBLISHED"
                                          )
                                        }
                                        className="rounded-lg bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-200"
                                      >
                                        Publish
                                      </button>
                                    )}

                                    {assignment.status ===
                                      "PUBLISHED" && (
                                      <button
                                        type="button"
                                        disabled={
                                          saving
                                        }
                                        onClick={() =>
                                          updateAssignmentStatus(
                                            assignment.id,
                                            "CLOSED"
                                          )
                                        }
                                        className="rounded-lg bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-200"
                                      >
                                        Close
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      disabled={
                                        saving
                                      }
                                      onClick={() =>
                                        deleteAssignment(
                                          assignment.id
                                        )
                                      }
                                      className="rounded-lg bg-red-100 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-200"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>

                                {/* Stats */}

                                <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                                  <StatCard
                                    label="Students"
                                    value={
                                      stats.totalStudents
                                    }
                                  />

                                  <StatCard
                                    label="Groups"
                                    value={
                                      stats.totalGroups
                                    }
                                  />

                                  <StatCard
                                    label="Questions"
                                    value={
                                      stats.totalQuestions
                                    }
                                  />

                                  <StatCard
                                    label="Distributed"
                                    value={`${stats.distributedQuestions}/${stats.totalQuestions}`}
                                  />
                                </div>

                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                  {stats.totalStudents ===
                                  0 ? (
                                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                                      Waiting for students
                                    </span>
                                  ) : stats.totalQuestions ===
                                    0 ? (
                                    <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700">
                                      Add questions
                                    </span>
                                  ) : stats.unassignedQuestions >
                                    0 ? (
                                    <span className="rounded-full bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700">
                                      Some questions are unassigned
                                    </span>
                                  ) : stats.questionBalanced &&
                                    stats.studentsBalanced ? (
                                    <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                                      Balanced distribution
                                    </span>
                                  ) : (
                                    <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700">
                                      Rebalance recommended
                                    </span>
                                  )}

                                  <span className="text-xs text-slate-500">
                                    Target group size:{" "}
                                    {Math.max(
                                      GROUP_SIZE_MIN,
                                      assignment.group_size ||
                                        DEFAULT_GROUP_SIZE
                                    )}
                                  </span>
                                </div>
                              </div>

                              {/* Groups */}

                              <div className="border-b border-slate-200 p-5">
                                <div className="flex items-center justify-between gap-4">
                                  <div>
                                    <h4 className="text-sm font-bold text-slate-900">
                                      Group Distribution
                                    </h4>

                                    <p className="mt-1 text-xs text-slate-500">
                                      Groups and question assignments are handled automatically.
                                    </p>
                                  </div>

                                  <span className="text-xs font-semibold text-slate-500">
                                    {
                                      assignmentGroups.length
                                    }{" "}
                                    active groups
                                  </span>
                                </div>

                                {assignmentGroups.length ===
                                0 ? (
                                  <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
                                    <p className="text-sm text-slate-500">
                                      No active groups yet.
                                    </p>

                                    <p className="mt-1 text-xs text-slate-400">
                                      Groups are created when students enroll.
                                    </p>
                                  </div>
                                ) : (
                                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                                    {assignmentGroups.map(
                                      (group) => {
                                        const members =
                                          getMembersForGroup(
                                            group.id
                                          )

                                        const assignedQuestions =
                                          getQuestionAssignmentsForGroup(
                                            group.id
                                          )

                                        const groupQuestions =
                                          assignedQuestions
                                            .map(
                                              (
                                                item
                                              ) =>
                                                assignmentQuestions.find(
                                                  (
                                                    question
                                                  ) =>
                                                    question.id ===
                                                    item.question_id
                                                )
                                            )
                                            .filter(
                                              Boolean
                                            )

                                        return (
                                          <div
                                            key={
                                              group.id
                                            }
                                            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                                          >
                                            <div className="flex items-start justify-between gap-3">
                                              <div>
                                                <h5 className="font-semibold text-slate-900">
                                                  {
                                                    group.name
                                                  }
                                                </h5>

                                                <p className="mt-1 text-xs text-slate-500">
                                                  {
                                                    members.length
                                                  }{" "}
                                                  students ·{" "}
                                                  {
                                                    groupQuestions.length
                                                  }{" "}
                                                  questions
                                                </p>
                                              </div>

                                              <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-slate-700">
                                                {
                                                  members.length
                                                }
                                                /
                                                {
                                                  group.max_members
                                                }
                                              </span>
                                            </div>

                                            <div className="mt-4">
                                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Assigned Questions
                                              </p>

                                              {groupQuestions.length ===
                                              0 ? (
                                                <p className="mt-2 text-xs text-slate-400">
                                                  No questions assigned.
                                                </p>
                                              ) : (
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                  {groupQuestions.map(
                                                    (
                                                      question
                                                    ) => (
                                                      <span
                                                        key={
                                                          question.id
                                                        }
                                                        className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                                                      >
                                                        Q
                                                        {
                                                          question.question_number
                                                        }
                                                      </span>
                                                    )
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )
                                      }
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Questions */}

                              <div className="p-5">
                                <div className="flex items-center justify-between gap-4">
                                  <div>
                                    <h4 className="text-sm font-bold text-slate-900">
                                      Questions
                                    </h4>

                                    <p className="mt-1 text-xs text-slate-500">
                                      Each question can have one active group assignment.
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      openQuestionForm(
                                        assignment.id
                                      )
                                    }
                                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                  >
                                    + Add
                                  </button>
                                </div>

                                {assignmentQuestions.length ===
                                0 ? (
                                  <div className="mt-4">
                                    <EmptyState
                                      title="No questions"
                                      description="Add questions to this subsection. They will be automatically distributed."
                                      actionLabel="Add Question"
                                      onAction={() =>
                                        openQuestionForm(
                                          assignment.id
                                        )
                                      }
                                    />
                                  </div>
                                ) : (
                                  <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
                                    <table className="min-w-full divide-y divide-slate-200">
                                      <thead className="bg-slate-50">
                                        <tr>
                                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            #
                                          </th>

                                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Question
                                          </th>

                                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Points
                                          </th>

                                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Group
                                          </th>
                                        </tr>
                                      </thead>

                                      <tbody className="divide-y divide-slate-200 bg-white">
                                        {assignmentQuestions.map(
                                          (
                                            question
                                          ) => {
                                            const assignmentItem =
                                              getQuestionAssignmentForQuestion(
                                                question.id
                                              )

                                            const assignedGroup =
                                              assignmentItem
                                                ? assignmentGroups.find(
                                                    (
                                                      group
                                                    ) =>
                                                      group.id ===
                                                      assignmentItem.group_id
                                                  )
                                                : null

                                            return (
                                              <tr
                                                key={
                                                  question.id
                                                }
                                                className="hover:bg-slate-50"
                                              >
                                                <td className="whitespace-nowrap px-4 py-3 text-sm font-bold text-slate-700">
                                                  Q
                                                  {
                                                    question.question_number
                                                  }
                                                </td>

                                                <td className="max-w-xl px-4 py-3">
                                                  <p className="truncate text-sm font-medium text-slate-900">
                                                    {question.title ||
                                                      question.question_text}
                                                  </p>
                                                </td>

                                                <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                                                  {
                                                    question.points
                                                  }
                                                </td>

                                                <td className="whitespace-nowrap px-4 py-3">
                                                  {assignedGroup ? (
                                                    <span className="rounded-lg bg-emerald-100 px-2.5 py-1.5 text-xs font-semibold text-emerald-700">
                                                      {
                                                        assignedGroup.name
                                                      }
                                                    </span>
                                                  ) : (
                                                    <span className="rounded-lg bg-red-100 px-2.5 py-1.5 text-xs font-semibold text-red-700">
                                                      Unassigned
                                                    </span>
                                                  )}
                                                </td>
                                              </tr>
                                            )
                                          }
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </article>
                          )
                        }
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}

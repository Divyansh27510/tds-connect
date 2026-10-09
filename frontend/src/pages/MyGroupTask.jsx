import { useEffect, useState } from "react"
import {
  useNavigate,
  useParams,
} from "react-router-dom"
import { supabase } from "../lib/supabase"

function MyGroupTask() {
  const navigate = useNavigate()
  const { parentTaskId } = useParams()

  const [parentTask, setParentTask] =
    useState(null)

  const [subsections, setSubsections] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  useEffect(() => {
    let mounted = true

    const fetchTask = async () => {
      setLoading(true)
      setError("")

      try {
        // ==================================================
        // 1. CURRENT USER
        // ==================================================

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          throw new Error(
            "Unable to identify the logged-in user."
          )
        }

        // ==================================================
        // 2. PARENT TASK
        // ==================================================

        const {
          data: parentTaskData,
          error: parentTaskError,
        } = await supabase
          .from("parent_tasks")
          .select(`
            id,
            title,
            description,
            assignment_type,
            status,
            created_at,
            updated_at
          `)
          .eq("id", parentTaskId)
          .maybeSingle()

        if (parentTaskError) {
          throw new Error(
            `Parent task fetch failed: ${parentTaskError.message}`
          )
        }

        if (!parentTaskData) {
          throw new Error(
            "Task not found."
          )
        }

        // ==================================================
        // 3. USER MEMBERSHIPS
        // ==================================================

        const {
          data: memberships,
          error: membershipError,
        } = await supabase
          .from("assignment_group_members")
          .select(`
            id,
            assignment_id,
            group_id,
            joined_at,
            is_active
          `)
          .eq("user_id", user.id)
          .eq("is_active", true)

        if (membershipError) {
          throw new Error(
            `Membership fetch failed: ${membershipError.message}`
          )
        }

        // ==================================================
        // 4. ASSIGNMENTS OF THIS PARENT
        // ==================================================

        const {
          data: assignments,
          error: assignmentError,
        } = await supabase
          .from("assignments")
          .select(`
            id,
            title,
            description,
            assignment_type,
            status,
            week_number,
            section_name,
            parent_task_id,
            total_questions,
            group_size,
            start_at,
            deadline,
            created_at
          `)
          .eq("parent_task_id", parentTaskId)
          .order("start_at", {
            ascending: true,
            nullsFirst: false,
          })

        if (assignmentError) {
          throw new Error(
            `Assignment fetch failed: ${assignmentError.message}`
          )
        }

        const assignmentList =
          assignments || []

        // ==================================================
        // 5. GROUPS
        // ==================================================

        const groupIds = [
          ...new Set(
            (memberships || [])
              .filter((membership) =>
                assignmentList.some(
                  (assignment) =>
                    assignment.id ===
                    membership.assignment_id
                )
              )
              .map(
                (membership) =>
                  membership.group_id
              )
          ),
        ]

        let groups = []

        if (groupIds.length > 0) {
          const {
            data: groupData,
            error: groupError,
          } = await supabase
            .from("groups")
            .select(`
              id,
              name,
              max_members,
              assignment_id,
              is_active
            `)
            .in("id", groupIds)

          if (groupError) {
            throw new Error(
              `Group fetch failed: ${groupError.message}`
            )
          }

          groups = groupData || []
        }

        // ==================================================
        // 6. QUESTION ASSIGNMENTS
        // ==================================================

        let questionAssignments = []

        if (groupIds.length > 0) {
          const {
            data: questionAssignmentData,
            error: questionAssignmentError,
          } = await supabase
            .from("question_assignments")
            .select(`
              id,
              question_id,
              group_id,
              assigned_at,
              is_active
            `)
            .in("group_id", groupIds)
            .eq("is_active", true)

          if (questionAssignmentError) {
            throw new Error(
              `Question assignment fetch failed: ${questionAssignmentError.message}`
            )
          }

          questionAssignments =
            questionAssignmentData || []
        }

        // ==================================================
        // 7. QUESTION IDS
        // ==================================================

        const questionIds = [
          ...new Set(
            questionAssignments.map(
              (item) =>
                item.question_id
            )
          ),
        ]

        // ==================================================
        // 8. QUESTIONS
        // ==================================================

        let questions = []

        if (questionIds.length > 0) {
          const {
            data: questionData,
            error: questionError,
          } = await supabase
            .from("questions")
            .select(`
              id,
              assignment_id,
              question_number,
              title,
              question_text,
              points
            `)
            .in("id", questionIds)

          if (questionError) {
            throw new Error(
              `Question fetch failed: ${questionError.message}`
            )
          }

          questions = questionData || []
        }

        // ==================================================
        // 9. MAPS
        // ==================================================

        const membershipMap =
          new Map()

        for (const membership of memberships || []) {
          membershipMap.set(
            membership.assignment_id,
            membership
          )
        }

        const groupMap =
          new Map(
            groups.map((group) => [
              group.id,
              group,
            ])
          )

        const questionMap =
          new Map(
            questions.map((question) => [
              question.id,
              question,
            ])
          )

        // ==================================================
        // 10. BUILD SUBSECTIONS
        // ==================================================

        const subsectionData =
          assignmentList
            .map((assignment) => {
              const membership =
                membershipMap.get(
                  assignment.id
                )

              const group = membership
                ? groupMap.get(
                    membership.group_id
                  )
                : null

              const assignedQuestions =
                questionAssignments.filter(
                  (item) => {
                    if (
                      item.group_id !==
                      membership?.group_id
                    ) {
                      return false
                    }

                    const question =
                      questionMap.get(
                        item.question_id
                      )

                    return (
                      question?.assignment_id ===
                      assignment.id
                    )
                  }
                )

              return {
                assignment,
                membership: membership || null,
                group: group || null,
                questionCount:
                  assignedQuestions.length,
              }
            })
            .filter(
              (item) =>
                item.membership !== null
            )

        // ==================================================
        // 11. SORT
        // ==================================================

        subsectionData.sort(
          (a, b) => {
            const aDate =
              new Date(
                a.assignment.start_at ||
                  a.assignment.created_at ||
                  0
              ).getTime()

            const bDate =
              new Date(
                b.assignment.start_at ||
                  b.assignment.created_at ||
                  0
              ).getTime()

            return aDate - bDate
          }
        )

        if (!mounted) return

        setParentTask(
          parentTaskData
        )

        setSubsections(
          subsectionData
        )

        setLoading(false)
      } catch (fetchError) {
        console.error(
          "MyGroupTask fetch error:",
          fetchError
        )

        if (!mounted) return

        setError(
          fetchError?.message ||
            "Unable to load this task."
        )

        setLoading(false)
      }
    }

    if (parentTaskId) {
      fetchTask()
    }

    return () => {
      mounted = false
    }
  }, [parentTaskId])

  // ==================================================
  // SECTION LABEL
  // ==================================================

  const getSectionLabel = (
    assignment
  ) => {
    if (assignment?.section_name) {
      return assignment.section_name
    }

    if (
      assignment?.week_number !== null &&
      assignment?.week_number !== undefined
    ) {
      return `Subsection ${assignment.week_number}`
    }

    return "Subsection"
  }

  // ==================================================
  // STATUS
  // ==================================================

  const getStatusClasses = (
    status
  ) => {
    if (status === "PUBLISHED") {
      return "bg-emerald-50 text-emerald-700"
    }

    if (status === "CLOSED") {
      return "bg-amber-50 text-amber-700"
    }

    return "bg-slate-100 text-slate-600"
  }

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-6xl">

          <button
            type="button"
            onClick={() =>
              navigate("/my-group")
            }
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            ← Back to My Group
          </button>

          <p className="mt-6 text-slate-500">
            Loading task...
          </p>

        </div>
      </main>
    )
  }

  // ==================================================
  // MAIN
  // ==================================================

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-6xl">

        {/* BACK */}

        <button
          type="button"
          onClick={() =>
            navigate("/my-group")
          }
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← Back to My Group
        </button>

        {/* HEADER */}

        <div className="mt-6">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

            <div>

              <h1 className="text-3xl font-bold text-slate-900">
                {parentTask?.title}
              </h1>

              {parentTask?.description && (
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  {parentTask.description}
                </p>
              )}

            </div>

            <span className="w-fit rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              {parentTask?.assignment_type ||
                "TASK"}
            </span>

          </div>

        </div>

        {/* ERROR */}

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* NO SUBSECTIONS */}

        {subsections.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">

            <h3 className="text-lg font-semibold text-slate-900">
              No Subsections
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              You are not currently enrolled in any subsection of this task.
            </p>

          </div>
        ) : (

          /* ==================================================
             SUBSECTION CARDS
          ================================================== */

          <div className="mt-8 grid gap-5 md:grid-cols-2">

            {subsections.map(
              ({
                assignment,
                group,
                questionCount,
              }) => (

                <button
                  key={assignment.id}
                  type="button"
                  onClick={() =>
                    navigate(
                      `/my-group/${assignment.id}`
                    )
                  }
                  className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                >

                  {/* TOP */}

                  <div className="flex items-start justify-between gap-4">

                    <div>

                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {getSectionLabel(
                          assignment
                        )}
                      </span>

                      <span
                        className={`ml-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                          assignment.status
                        )}`}
                      >
                        {assignment.status}
                      </span>

                    </div>

                    <span className="text-xl text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-blue-500">
                      →
                    </span>

                  </div>

                  {/* TITLE */}

                  <h2 className="mt-5 text-xl font-bold text-slate-900 transition-colors group-hover:text-blue-600">
                    {assignment.title}
                  </h2>

                  {/* DESCRIPTION */}

                  {assignment.description && (
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                      {assignment.description}
                    </p>
                  )}

                  {/* STATS */}

                  <div className="mt-6 grid grid-cols-2 gap-3">

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Your Group
                      </p>

                      <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                        {group?.name ||
                          "Group"}
                      </p>

                    </div>

                    <div className="rounded-xl bg-blue-50 p-4">

                      <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500">
                        Assigned Questions
                      </p>

                      <p className="mt-1 text-2xl font-bold text-blue-600">
                        {questionCount}
                      </p>

                    </div>

                  </div>

                  {/* FOOTER */}

                  <div className="mt-5 border-t border-slate-100 pt-4">

                    <span className="text-xs font-medium text-slate-400 group-hover:text-blue-600">
                      Open subsection →
                    </span>

                  </div>

                </button>

              )
            )}

          </div>
        )}

      </div>
    </main>
  )
}

export default MyGroupTask
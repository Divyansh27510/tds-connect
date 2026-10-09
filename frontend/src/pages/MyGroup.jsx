import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"

function MyGroup() {
  const navigate = useNavigate()

  const [parentProjects, setParentProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true

    const fetchMyParentTasks = async () => {
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
        // 2. CURRENT USER'S ACTIVE MEMBERSHIPS
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
          .order("joined_at", {
            ascending: true,
          })

        if (membershipError) {
          throw new Error(
            `Membership fetch failed: ${membershipError.message}`
          )
        }

        if (!memberships || memberships.length === 0) {
          if (!mounted) return

          setParentProjects([])
          setLoading(false)
          return
        }

        // ==================================================
        // 3. ASSIGNMENT IDS
        // ==================================================

        const assignmentIds = [
          ...new Set(
            memberships.map(
              (membership) =>
                membership.assignment_id
            )
          ),
        ]

        // ==================================================
        // 4. FETCH ASSIGNMENTS
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
            start_at,
            deadline,
            created_at
          `)
          .in("id", assignmentIds)

        if (assignmentError) {
          throw new Error(
            `Assignment fetch failed: ${assignmentError.message}`
          )
        }

        const assignmentList = assignments || []

        if (assignmentList.length === 0) {
          if (!mounted) return

          setParentProjects([])
          setLoading(false)
          return
        }

        // ==================================================
        // 5. PARENT TASK IDS
        // ==================================================

        const parentTaskIds = [
          ...new Set(
            assignmentList
              .map(
                (assignment) =>
                  assignment.parent_task_id
              )
              .filter(Boolean)
          ),
        ]

        // ==================================================
        // 6. FETCH PARENT TASKS
        // ==================================================

        let parentTasks = []

        if (parentTaskIds.length > 0) {
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
            .in("id", parentTaskIds)

          if (parentTaskError) {
            throw new Error(
              `Parent task fetch failed: ${parentTaskError.message}`
            )
          }

          parentTasks = parentTaskData || []
        }

        // ==================================================
        // 7. MAP PARENT TASKS
        // ==================================================

        const parentTaskMap = new Map(
          parentTasks.map((parentTask) => [
            parentTask.id,
            parentTask,
          ])
        )

        // ==================================================
        // 8. GROUP ASSIGNMENTS BY PARENT
        //
        // IMPORTANT:
        // This page ONLY shows parent cards.
        //
        // Subsections are NOT rendered here.
        // ==================================================

        const parentMap = new Map()

        for (const assignment of assignmentList) {
          const parentId =
            assignment.parent_task_id ||
            `legacy-${assignment.id}`

          const parentTask =
            assignment.parent_task_id
              ? parentTaskMap.get(
                  assignment.parent_task_id
                )
              : null

          if (!parentMap.has(parentId)) {
            parentMap.set(parentId, {
              id: parentId,
              parentTask:
                parentTask || {
                  id: parentId,
                  title: assignment.title,
                  description:
                    assignment.description || "",
                  assignment_type:
                    assignment.assignment_type,
                },
              assignments: [],
            })
          }

          parentMap
            .get(parentId)
            .assignments.push(assignment)
        }

        // ==================================================
        // 9. SORT PARENT TASKS
        // ==================================================

        const groupedParents =
          Array.from(parentMap.values())

        groupedParents.sort((a, b) => {
          const aDate = new Date(
            a.assignments[0]?.start_at ||
              a.assignments[0]?.created_at ||
              0
          ).getTime()

          const bDate = new Date(
            b.assignments[0]?.start_at ||
              b.assignments[0]?.created_at ||
              0
          ).getTime()

          return aDate - bDate
        })

        if (!mounted) return

        setParentProjects(groupedParents)
        setLoading(false)
      } catch (fetchError) {
        console.error(
          "MyGroup fetch error:",
          fetchError
        )

        if (!mounted) return

        setError(
          fetchError?.message ||
            "Something went wrong while loading your groups."
        )

        setLoading(false)
      }
    }

    fetchMyParentTasks()

    return () => {
      mounted = false
    }
  }, [])

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-6xl">

          <h2 className="text-3xl font-bold text-slate-900">
            My Group
          </h2>

          <p className="mt-3 text-slate-500">
            Loading your tasks...
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

        {/* HEADER */}

        <div>
          <h2 className="text-3xl font-bold text-slate-900">
            My Group
          </h2>

          <p className="mt-2 text-slate-600">
            Select a task to view its subsections and assigned questions.
          </p>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* EMPTY */}

        {parentProjects.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">

            <h3 className="text-lg font-semibold text-slate-900">
              No Tasks
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              You are not currently enrolled in any task.
            </p>

          </div>
        ) : (

          /* ==================================================
             ONLY MAIN TASK CARDS
          ================================================== */

          <div className="mt-8 grid gap-6 md:grid-cols-2">

            {parentProjects.map((parentProject) => {
              const {
                parentTask,
                assignments,
              } = parentProject

              return (
                <button
                  key={parentProject.id}
                  type="button"
                  onClick={() =>
                    navigate(
                      `/my-group/task/${parentProject.id}`
                    )
                  }
                  className="group w-full rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                >

                  {/* TOP */}

                  <div className="flex items-start justify-between gap-4">

                    <div className="flex min-w-0 items-center gap-4">

                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-lg font-bold text-blue-600">
                        {assignments.length}
                      </div>

                      <div className="min-w-0">

                        <h3 className="truncate text-xl font-bold text-slate-900 transition-colors group-hover:text-blue-600">
                          {parentTask?.title || "Task"}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          {assignments.length === 1
                            ? "1 subsection"
                            : `${assignments.length} subsections`}
                        </p>

                      </div>

                    </div>

                    <span className="text-xl text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-blue-500">
                      →
                    </span>

                  </div>

                  {/* DESCRIPTION */}

                  {parentTask?.description && (
                    <p className="mt-5 line-clamp-3 text-sm leading-6 text-slate-600">
                      {parentTask.description}
                    </p>
                  )}

                  {/* FOOTER */}

                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">

                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {parentTask?.assignment_type ||
                        "TASK"}
                    </span>

                    <span className="text-xs font-medium text-slate-400 group-hover:text-blue-600">
                      View task
                    </span>

                  </div>

                </button>
              )
            })}

          </div>
        )}

      </div>
    </main>
  )
}

export default MyGroup
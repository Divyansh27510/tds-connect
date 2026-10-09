import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"

function StudentAssignments() {
  const navigate = useNavigate()

  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchAssignments()
  }, [])

  // =========================================================
  // FETCH ASSIGNMENTS
  // =========================================================

  const fetchAssignments = async () => {
    setLoading(true)
    setError("")

    try {
      // -------------------------------------------------------
      // CURRENT USER
      // -------------------------------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setError(
          "Unable to identify the logged-in student."
        )
        return
      }

      // -------------------------------------------------------
      // ASSIGNMENTS
      // -------------------------------------------------------

      const {
        data: assignmentData,
        error: assignmentError,
      } = await supabase
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
          deadline,
          created_at,
          questions (
            id,
            question_number
          )
        `)
        .in("status", [
          "PUBLISHED",
          "CLOSED",
        ])
        .order("created_at", {
          ascending: true,
        })

      if (assignmentError) {
        console.error(
          "Assignment fetch error:",
          assignmentError
        )

        setError(
          assignmentError.message
        )

        return
      }

      // -------------------------------------------------------
      // CURRENT USER MEMBERSHIPS
      // -------------------------------------------------------

      const {
        data: memberships,
        error: membershipError,
      } = await supabase
        .from("assignment_group_members")
        .select(`
          assignment_id,
          group_id,
          is_active
        `)
        .eq(
          "user_id",
          user.id
        )
        .eq(
          "is_active",
          true
        )

      if (membershipError) {
        console.error(
          "Membership fetch error:",
          membershipError
        )

        setError(
          membershipError.message
        )

        return
      }

      // -------------------------------------------------------
      // MEMBERSHIP MAP
      // -------------------------------------------------------

      const membershipByAssignment =
        (memberships || []).reduce(
          (
            accumulator,
            membership
          ) => {
            accumulator[
              membership.assignment_id
            ] = membership

            return accumulator
          },
          {}
        )

      // -------------------------------------------------------
      // VISIBLE ASSIGNMENTS
      //
      // PUBLISHED:
      //   visible to students.
      //
      // CLOSED:
      //   visible only if the student is already enrolled.
      // -------------------------------------------------------

      const visibleAssignments =
        (assignmentData || [])
          .map((assignment) => ({
            ...assignment,

            isEnrolled:
              Boolean(
                membershipByAssignment[
                  assignment.id
                ]
              ),

            membership:
              membershipByAssignment[
                assignment.id
              ] || null,
          }))
          .filter((assignment) => {
            if (
              assignment.status ===
              "PUBLISHED"
            ) {
              return true
            }

            if (
              assignment.status ===
              "CLOSED"
            ) {
              return assignment.isEnrolled
            }

            return false
          })

      setAssignments(
        visibleAssignments
      )
    } catch (error) {
      console.error(
        "Student assignments error:",
        error
      )

      setError(
        "Something went wrong while loading assignments."
      )
    } finally {
      setLoading(false)
    }
  }

  // =========================================================
  // HELPERS
  // =========================================================

  const formatType = (type) => {
    if (!type) {
      return "Other"
    }

    return type
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      )
  }

  // =========================================================
  // BUILD PARENT TASKS
  //
  // IMPORTANT:
  // parent_task_id is the actual identity of a task.
  //
  // We do NOT use:
  //   assignment.title
  //
  // as the parent identity.
  //
  // This preserves:
  //
  // Parent Task
  // ├── Revision Set
  // ├── Quiz 1
  // ├── Project Phase 1
  // └── Any custom subsection
  // =========================================================

  const parentTasks = useMemo(() => {
    const map = {}

    assignments.forEach(
      (assignment) => {
        const parentId =
          assignment.parent_task_id

        // -----------------------------------------------------
        // Legacy assignment without parent
        //
        // Keep it visible instead of losing it.
        // -----------------------------------------------------

        if (!parentId) {
          const legacyId =
            `legacy-${assignment.id}`

          if (!map[legacyId]) {
            map[legacyId] = {
              id: legacyId,
              title:
                assignment.title ||
                "Task",
              assignmentType:
                assignment.assignment_type,
              subsections: [],
            }
          }

          map[
            legacyId
          ].subsections.push(
            assignment
          )

          return
        }

        // -----------------------------------------------------
        // NORMAL PARENT TASK
        // -----------------------------------------------------

        if (!map[parentId]) {
          map[parentId] = {
            id: parentId,

            // Temporary title fallback.
            // TaskOverview will resolve the actual parent.
            title:
              assignment.title ||
              "Task",

            assignmentType:
              assignment.assignment_type,

            subsections: [],
          }
        }

        map[parentId].subsections.push(
          assignment
        )
      }
    )

    return Object.values(map)
  }, [assignments])

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="p-8">
        <div className="mx-auto max-w-7xl">

          <div className="animate-pulse">

            <div className="h-9 w-52 rounded-lg bg-gray-200" />

            <div className="mt-3 h-4 w-96 rounded bg-gray-100" />

            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">

              {[1, 2, 3].map(
                (item) => (
                  <div
                    key={item}
                    className="h-64 rounded-2xl border border-gray-100 bg-white"
                  />
                )
              )}

            </div>

          </div>

        </div>
      </main>
    )
  }

  // =========================================================
  // MAIN
  // =========================================================

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-8">

      <div className="mx-auto max-w-7xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">

          <div>

            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              TDS Connect
            </p>

            <h2 className="mt-1 text-3xl font-bold text-gray-900">
              Assignments
            </h2>

            <p className="mt-2 max-w-2xl text-gray-600">
              Choose a task to view its
              subsections, enrollment status
              and assigned work.
            </p>

          </div>

          <div className="rounded-xl border border-gray-200 bg-white px-5 py-3 shadow-sm">

            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Tasks
            </p>

            <p className="mt-1 text-2xl font-bold text-gray-900">
              {parentTasks.length}
            </p>

          </div>

        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* =================================================
            EMPTY
        ================================================= */}

        {parentTasks.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
              📚
            </div>

            <h3 className="mt-5 text-xl font-bold text-gray-800">
              No tasks available
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Published tasks will appear
              here when they become available.
            </p>

          </div>
        ) : (

          // =================================================
          // TASK CARDS
          // =================================================

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">

            {parentTasks.map(
              (parent) => {

                const enrolledCount =
                  parent.subsections.filter(
                    (item) =>
                      item.isEnrolled
                  ).length

                const totalQuestions =
                  parent.subsections.reduce(
                    (
                      total,
                      item
                    ) =>
                      total +
                      (
                        item.questions
                          ?.length ||
                        0
                      ),
                    0
                  )

                return (
                  <button
                    key={parent.id}
                    type="button"
                    onClick={() =>
                      navigate(
                        `/assignments/task/${parent.id}`
                      )
                    }
                    className="group rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
                  >

                    {/* ---------------------------------
                        ICON + TYPE
                    ---------------------------------- */}

                    <div className="flex items-start justify-between gap-4">

                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white shadow-sm">
                        {parent.title
                          ?.charAt(
                            0
                          )
                          ?.toUpperCase() ||
                          "T"}
                      </div>

                      <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                        {formatType(
                          parent.assignmentType
                        )}
                      </span>

                    </div>

                    {/* ---------------------------------
                        TITLE
                    ---------------------------------- */}

                    <h3 className="mt-6 text-xl font-bold text-gray-900 transition-colors group-hover:text-blue-600">
                      {parent.title}
                    </h3>

                    <p className="mt-2 text-sm text-gray-500">
                      Task workspace and
                      subsections
                    </p>

                    {/* ---------------------------------
                        STATS
                    ---------------------------------- */}

                    <div className="mt-6 grid grid-cols-2 gap-3">

                      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">

                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Subsections
                        </p>

                        <p className="mt-1 text-xl font-bold text-gray-800">
                          {
                            parent
                              .subsections
                              .length
                          }
                        </p>

                      </div>

                      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">

                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Enrolled
                        </p>

                        <p className="mt-1 text-xl font-bold text-gray-800">
                          {
                            enrolledCount
                          }
                        </p>

                      </div>

                    </div>

                    {/* ---------------------------------
                        FOOTER
                    ---------------------------------- */}

                    <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-5">

                      <div>

                        <p className="text-xs text-gray-400">
                          Questions
                        </p>

                        <p className="mt-0.5 text-sm font-semibold text-gray-700">
                          {
                            totalQuestions
                          }
                        </p>

                      </div>

                      <span className="text-sm font-semibold text-blue-600 transition-transform group-hover:translate-x-1">
                        View Task →
                      </span>

                    </div>

                  </button>
                )
              }
            )}

          </div>
        )}

      </div>

    </main>
  )
}

export default StudentAssignments
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { supabase } from "../lib/supabase"

function TaskOverview() {
  const { parentTaskId } = useParams()
  const navigate = useNavigate()

  const [task, setTask] = useState(null)
  const [assignments, setAssignments] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [enrollingId, setEnrollingId] = useState(null)

  // =========================================================
  // FETCH TASK
  // =========================================================

  useEffect(() => {
    fetchTask()
  }, [parentTaskId])

  const fetchTask = async () => {
    setLoading(true)
    setError("")
    setTask(null)
    setAssignments([])

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
      // CHILD ASSIGNMENTS / SUBSECTIONS
      //
      // This is the primary source of truth for the student.
      // We do this BEFORE parent_tasks so a parent_tasks RLS
      // restriction cannot make an otherwise valid task
      // appear as "not found".
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
            question_number,
            title,
            points
          )
        `)
        .eq(
          "parent_task_id",
          parentTaskId
        )
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
      // IMPORTANT
      //
      // If the child assignments are not visible, THEN the
      // parent task genuinely cannot be opened from the
      // student side.
      // -------------------------------------------------------

      if (
        !assignmentData ||
        assignmentData.length === 0
      ) {
        setError(
          "No accessible subsections were found for this task."
        )

        return
      }

      // -------------------------------------------------------
      // PARENT TASK
      //
      // Try to fetch the real parent first.
      // If RLS prevents the student from seeing it, we do NOT
      // fail the page. We construct the parent header from
      // the child assignment instead.
      // -------------------------------------------------------

      let parentTask = null

      const {
        data: parentTaskData,
        error: parentError,
      } = await supabase
        .from("parent_tasks")
        .select(`
          id,
          title,
          description,
          assignment_type,
          status
        `)
        .eq("id", parentTaskId)
        .maybeSingle()

      if (parentError) {
        console.warn(
          "Parent task could not be read directly. Using child assignment fallback:",
          parentError
        )
      } else if (parentTaskData) {
        parentTask = parentTaskData
      }

      // -------------------------------------------------------
      // PARENT FALLBACK
      //
      // The first child assignment belongs to this parent, so
      // it is safe to use its metadata for the task header when
      // parent_tasks itself is not visible to the student.
      // -------------------------------------------------------

      if (!parentTask) {
        const firstAssignment =
          assignmentData[0]

        parentTask = {
          id: parentTaskId,
          title:
            firstAssignment.title ||
            "Task",
          description:
            firstAssignment.description ||
            "",
          assignment_type:
            firstAssignment.assignment_type ||
            "OTHER",
          status:
            firstAssignment.status ||
            "PUBLISHED",
        }
      }

      setTask(parentTask)

      // -------------------------------------------------------
      // CURRENT STUDENT MEMBERSHIPS
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
        .eq("user_id", user.id)
        .eq("is_active", true)

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

      const membershipMap =
        (memberships || []).reduce(
          (map, membership) => {
            map[membership.assignment_id] =
              membership

            return map
          },
          {}
        )

      // -------------------------------------------------------
      // PREPARE VISIBLE SUBSECTIONS
      // -------------------------------------------------------

      const visibleAssignments =
        assignmentData
          .map((assignment) => ({
            ...assignment,

            isEnrolled:
              Boolean(
                membershipMap[
                  assignment.id
                ]
              ),

            membership:
              membershipMap[
                assignment.id
              ] || null,
          }))
          .filter((assignment) => {
            // Published tasks are available.
            if (
              assignment.status ===
              "PUBLISHED"
            ) {
              return true
            }

            // Closed tasks are visible only to
            // students already enrolled.
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
        "Task overview error:",
        error
      )

      setError(
        error?.message ||
          "Something went wrong while loading the task."
      )
    } finally {
      setLoading(false)
    }
  }

  // =========================================================
  // HELPERS
  // =========================================================

  const getSubsectionName = (
    assignment
  ) => {
    if (
      assignment.section_name &&
      assignment.section_name.trim()
    ) {
      return assignment.section_name
    }

    // Legacy compatibility only.
    // New subsections should use section_name.
    if (
      assignment.week_number !== null &&
      assignment.week_number !== undefined
    ) {
      return `Week ${assignment.week_number}`
    }

    return "Subsection"
  }

  const getDescription = (
    assignment
  ) => {
    if (
      assignment.description &&
      assignment.description.trim()
    ) {
      return assignment.description
    }

    return "Open this subsection to collaborate, solve questions, and submit your work."
  }

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

  const formatDeadline = (
    deadline
  ) => {
    if (!deadline) {
      return null
    }

    return new Date(
      deadline
    ).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    )
  }

  // =========================================================
  // OPEN TASK
  // =========================================================

  const openTask = (
    assignment
  ) => {
    navigate(
      `/assignments/${assignment.id}`
    )
  }

  // =========================================================
  // ENROLL
  // =========================================================

  const handleEnroll = async (
    assignment
  ) => {
    if (
      enrollingId ||
      assignment.isEnrolled
    ) {
      return
    }

    setEnrollingId(
      assignment.id
    )

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
          "Your session could not be verified. Please sign in again."
        )

        return
      }

      // -------------------------------------------------------
      // ENROLL USING DATABASE RPC
      // -------------------------------------------------------

      const {
        data: enrollmentData,
        error: enrollmentError,
      } = await supabase.rpc(
        "enroll_in_assignment",
        {
          p_assignment_id:
            assignment.id,
        }
      )

      if (enrollmentError) {
        console.error(
          "Enrollment RPC error:",
          enrollmentError
        )

        setError(
          enrollmentError.message ||
            "Unable to enroll in this task."
        )

        return
      }

      console.log(
        "Enrollment RPC result:",
        enrollmentData
      )

      // -------------------------------------------------------
      // VERIFY RPC RETURN
      // -------------------------------------------------------

      if (
        !enrollmentData ||
        !Array.isArray(
          enrollmentData
        ) ||
        enrollmentData.length === 0
      ) {
        console.error(
          "Enrollment RPC returned no membership:",
          enrollmentData
        )

        setError(
          "Enrollment did not return a valid group membership."
        )

        return
      }

      const enrollment =
        enrollmentData[0]

      if (
        !enrollment.group_id
      ) {
        console.error(
          "Enrollment missing group:",
          enrollment
        )

        setError(
          "Enrollment was processed but no group was assigned."
        )

        return
      }

      // -------------------------------------------------------
      // FINAL DATABASE VERIFICATION
      // -------------------------------------------------------

      const {
        data: verifiedMembership,
        error:
          verificationError,
      } = await supabase
        .from(
          "assignment_group_members"
        )
        .select(`
          id,
          assignment_id,
          group_id,
          user_id,
          is_active
        `)
        .eq(
          "assignment_id",
          assignment.id
        )
        .eq(
          "user_id",
          user.id
        )
        .eq(
          "is_active",
          true
        )
        .maybeSingle()

      if (verificationError) {
        console.error(
          "Enrollment verification error:",
          verificationError
        )

        setError(
          "Enrollment may have succeeded, but membership verification failed: " +
            verificationError.message
        )

        return
      }

      if (!verifiedMembership) {
        console.error(
          "No active membership after enrollment."
        )

        setError(
          "Enrollment did not persist. No active membership was found."
        )

        return
      }

      // -------------------------------------------------------
      // SUCCESS
      // -------------------------------------------------------

      navigate(
        `/assignments/${assignment.id}`,
        {
          replace: true,
        }
      )
    } catch (error) {
      console.error(
        "Enrollment exception:",
        error
      )

      setError(
        error?.message ||
          "Unable to enroll in this task."
      )
    } finally {
      setEnrollingId(null)
    }
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="p-8">
        <div className="mx-auto max-w-6xl animate-pulse">

          <div className="h-4 w-28 rounded bg-gray-200" />

          <div className="mt-4 h-10 w-80 rounded-lg bg-gray-200" />

          <div className="mt-3 h-4 w-96 rounded bg-gray-100" />

          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">

            <div className="h-64 rounded-2xl border bg-white" />

            <div className="h-64 rounded-2xl border bg-white" />

          </div>

        </div>
      </main>
    )
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error && !task) {
    return (
      <main className="p-8">
        <div className="mx-auto max-w-5xl">

          <button
            type="button"
            onClick={() =>
              navigate(
                "/assignments"
              )
            }
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            ← Back to Assignments
          </button>

          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">

            <h2 className="text-lg font-bold text-red-800">
              Unable to load task
            </h2>

            <p className="mt-2 text-sm leading-6 text-red-700">
              {error}
            </p>

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

        {/* BACK */}

        <button
          type="button"
          onClick={() =>
            navigate(
              "/assignments"
            )
          }
          className="inline-flex items-center text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
        >
          ← Back to Assignments
        </button>

        {/* TASK HEADER */}

        <div className="mt-6 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">

          <div className="p-7 md:p-8">

            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">

              <div className="max-w-3xl">

                <div className="flex flex-wrap items-center gap-2">

                  <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
                    {formatType(
                      task?.assignment_type
                    )}
                  </span>

                  <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                    {task?.status ||
                      "AVAILABLE"}
                  </span>

                </div>

                <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                  {task?.title}
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 md:text-base">
                  {task?.description ||
                    "Explore the available subsections and choose the task you want to work on."}
                </p>

              </div>

              <div className="shrink-0 rounded-2xl border border-blue-100 bg-blue-50 px-6 py-5">

                <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                  Subsections
                </p>

                <p className="mt-1 text-3xl font-bold text-blue-800">
                  {assignments.length}
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* ERROR BANNER */}

        {error && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">

            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm">
              !
            </div>

            <div>
              <p className="text-sm font-semibold text-red-800">
                Enrollment failed
              </p>

              <p className="mt-1 text-sm leading-5 text-red-700">
                {error}
              </p>
            </div>

          </div>
        )}

        {/* SUBSECTIONS */}

        <section className="mt-8">

          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Subsections
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Enroll in a subsection to start working
              on its questions.
            </p>
          </div>

          {assignments.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-2xl">
                📚
              </div>

              <h3 className="mt-4 text-lg font-bold text-gray-900">
                No subsections available
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                There are currently no accessible
                subsections in this task.
              </p>

            </div>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">

              {assignments.map(
                (assignment) => {
                  const questionCount =
                    assignment.questions
                      ?.length || 0

                  const isEnrolling =
                    enrollingId ===
                    assignment.id

                  const deadline =
                    formatDeadline(
                      assignment.deadline
                    )

                  return (
                    <div
                      key={assignment.id}
                      className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
                    >

                      {/* TOP */}

                      <div className="flex items-start justify-between gap-4">

                        <div className="min-w-0">

                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Subsection
                          </p>

                          <h3 className="mt-1 text-xl font-bold text-gray-900">
                            {getSubsectionName(
                              assignment
                            )}
                          </h3>

                        </div>

                        {assignment.isEnrolled ? (
                          <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                            ENROLLED
                          </span>
                        ) : (
                          <span className="shrink-0 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                            AVAILABLE
                          </span>
                        )}

                      </div>

                      {/* DESCRIPTION */}

                      <p className="mt-4 line-clamp-3 text-sm leading-6 text-gray-600">
                        {getDescription(
                          assignment
                        )}
                      </p>

                      {/* META */}

                      <div className="mt-5 grid grid-cols-2 gap-3">

                        <div className="rounded-xl bg-gray-50 p-3">

                          <p className="text-xs font-medium text-gray-400">
                            Questions
                          </p>

                          <p className="mt-1 text-sm font-bold text-gray-800">
                            {questionCount}
                          </p>

                        </div>

                        <div className="rounded-xl bg-gray-50 p-3">

                          <p className="text-xs font-medium text-gray-400">
                            Status
                          </p>

                          <p className="mt-1 text-sm font-bold text-gray-800">
                            {assignment.status}
                          </p>

                        </div>

                      </div>

                      {/* DEADLINE */}

                      {deadline && (
                        <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">

                          <span>
                            ⏱
                          </span>

                          <span>
                            Deadline:
                          </span>

                          <span className="font-semibold text-gray-700">
                            {deadline}
                          </span>

                        </div>
                      )}

                      {/* ACTION */}

                      <div className="mt-6 border-t border-gray-100 pt-5">

                        {assignment.isEnrolled ? (
                          <button
                            type="button"
                            onClick={() =>
                              openTask(
                                assignment
                              )
                            }
                            className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
                          >
                            Open Task →
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={
                              Boolean(
                                enrollingId
                              )
                            }
                            onClick={() =>
                              handleEnroll(
                                assignment
                              )
                            }
                            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isEnrolling
                              ? "Enrolling..."
                              : "Enroll & Open Task"}
                          </button>
                        )}

                      </div>

                    </div>
                  )
                }
              )}

            </div>
          )}

        </section>

      </div>
    </main>
  )
}

export default TaskOverview
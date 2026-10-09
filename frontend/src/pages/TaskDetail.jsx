import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { supabase } from "../lib/supabase"

function TaskDetail() {
  const { assignmentId } = useParams()
  const navigate = useNavigate()

  const [assignment, setAssignment] =
    useState(null)

  const [questions, setQuestions] =
    useState([])

  const [group, setGroup] =
    useState(null)

  const [assignedQuestionIds, setAssignedQuestionIds] =
    useState(new Set())

  const [questionGroups, setQuestionGroups] =
    useState({})

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  const [showManageModal, setShowManageModal] =
    useState(false)

  const [showUnenrollConfirm, setShowUnenrollConfirm] =
    useState(false)

  const [unenrolling, setUnenrolling] =
    useState(false)

  // ======================================================
  // FETCH TASK DETAILS
  // ======================================================

  useEffect(() => {
    const fetchTaskDetails = async () => {
      setLoading(true)
      setError("")

      try {
        // ==================================================
        // CURRENT USER
        // ==================================================

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          setError(
            "Unable to identify the logged-in student."
          )

          setLoading(false)
          return
        }

        // ==================================================
        // ASSIGNMENT
        //
        // IMPORTANT:
        // PUBLISHED -> accessible
        // CLOSED    -> accessible to already enrolled users
        // ==================================================

        const {
          data: assignmentData,
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
          .eq("id", assignmentId)
          .in("status", [
            "PUBLISHED",
            "CLOSED",
          ])
          .maybeSingle()

        if (assignmentError) {
          console.error(
            "Assignment fetch error:",
            assignmentError
          )

          setError(
            assignmentError.message
          )

          setLoading(false)
          return
        }

        if (!assignmentData) {
          setError(
            "Assignment not found or is not available."
          )

          setLoading(false)
          return
        }

        setAssignment(
          assignmentData
        )

        // ==================================================
        // TASK-SPECIFIC ENROLLMENT
        // ==================================================

        const {
          data: membership,
          error: membershipError,
        } = await supabase
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
          .eq(
            "assignment_id",
            assignmentId
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

        if (membershipError) {
          console.error(
            "Task membership error:",
            membershipError
          )

          setError(
            membershipError.message
          )

          setLoading(false)
          return
        }

        // ==================================================
        // NOT ENROLLED
        // ==================================================

        if (!membership) {
          setGroup(null)
          setQuestions([])
          setAssignedQuestionIds(
            new Set()
          )
          setQuestionGroups({})
          setLoading(false)
          return
        }

        // ==================================================
        // FETCH TASK GROUP
        // ==================================================

        const {
          data: groupData,
          error: groupError,
        } = await supabase
          .from("groups")
          .select(`
            id,
            name,
            max_members
          `)
          .eq(
            "id",
            membership.group_id
          )
          .maybeSingle()

        if (groupError) {
          console.error(
            "Group fetch error:",
            groupError
          )

          setError(
            groupError.message
          )

          setLoading(false)
          return
        }

        setGroup(
          groupData || {
            id: membership.group_id,
            name: "My Group",
            max_members:
              assignmentData.group_size ||
              10,
          }
        )

        // ==================================================
        // QUESTIONS
        // ==================================================

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
          .eq(
            "assignment_id",
            assignmentId
          )
          .order(
            "question_number",
            {
              ascending: true,
            }
          )

        if (questionError) {
          console.error(
            "Questions fetch error:",
            questionError
          )

          setError(
            questionError.message
          )

          setLoading(false)
          return
        }

        const currentQuestions =
          questionData || []

        setQuestions(
          currentQuestions
        )

        // ==================================================
        // QUESTION -> GROUP ASSIGNMENTS
        // ==================================================

        const currentQuestionIds =
          currentQuestions.map(
            (question) =>
              question.id
          )

        let currentGroupAssignedIds =
          new Set()

        if (
          currentQuestionIds.length >
          0
        ) {
          const {
            data: questionAssignments,
            error:
              questionAssignmentError,
          } = await supabase
            .from("question_assignments")
            .select(`
              question_id,
              group_id,
              is_active,
              groups (
                id,
                name
              )
            `)
            .in(
              "question_id",
              currentQuestionIds
            )
            .eq(
              "is_active",
              true
            )

          if (
            questionAssignmentError
          ) {
            console.error(
              "Question assignment fetch error:",
              questionAssignmentError
            )

            setError(
              questionAssignmentError.message
            )

            setLoading(false)
            return
          }

          const groupMap = {}

          ;(
            questionAssignments || []
          ).forEach((item) => {
            if (
              !groupMap[
                item.question_id
              ]
            ) {
              groupMap[
                item.question_id
              ] = []
            }

            const assignedGroup =
              item.groups || {
                id: item.group_id,
                name: "Unknown Group",
              }

            groupMap[
              item.question_id
            ].push(
              assignedGroup
            )
          })

          setQuestionGroups(
            groupMap
          )

          currentGroupAssignedIds =
            new Set(
              (
                questionAssignments ||
                []
              )
                .filter(
                  (item) =>
                    item.group_id ===
                    membership.group_id
                )
                .map(
                  (item) =>
                    item.question_id
                )
            )
        } else {
          setQuestionGroups({})
        }

        setAssignedQuestionIds(
          currentGroupAssignedIds
        )

        setLoading(false)
      } catch (error) {
        console.error(
          "Task detail error:",
          error
        )

        setError(
          "Something went wrong while loading this task."
        )

        setLoading(false)
      }
    }

    fetchTaskDetails()
  }, [assignmentId])

  // ======================================================
  // HELPERS
  // ======================================================

  const formatType = (type) => {
    if (!type) {
      return "Other"
    }

    return type
      .replaceAll(
        "_",
        " "
      )
      .toLowerCase()
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      )
  }

  // ======================================================
  // DYNAMIC SUBSECTION LABEL
  //
  // Do NOT hardcode Week / Quiz / Project.
  // ======================================================

  const getUnitLabel = (
    assignmentData
  ) => {
    if (!assignmentData) {
      return ""
    }

    if (
      assignmentData.section_name
    ) {
      return assignmentData.section_name
    }

    if (
      assignmentData.week_number !==
        null &&
      assignmentData.week_number !==
        undefined
    ) {
      return `Subsection ${assignmentData.week_number}`
    }

    return "Subsection"
  }

  // ======================================================
  // BACK NAVIGATION
  // ======================================================

  const handleBack = () => {
    if (
      assignment?.parent_task_id
    ) {
      navigate(
        `/assignments/task/${assignment.parent_task_id}`
      )

      return
    }

    navigate(
      "/assignments"
    )
  }

  // ======================================================
  // QUESTION
  // ======================================================

  const handleQuestionClick = (
    question
  ) => {
    navigate(
      `/questions/${question.id}`
    )
  }

  const getAssignedGroupNames = (
    questionId
  ) => {
    const groups =
      questionGroups[
        questionId
      ] || []

    return groups.map(
      (item) =>
        item.name
    )
  }

  // ======================================================
  // DATE
  // ======================================================

  const formatDate = (
    date
  ) => {
    if (!date) {
      return "Not specified"
    }

    return new Date(
      date
    ).toLocaleString(
      "en-IN",
      {
        dateStyle:
          "medium",
        timeStyle:
          "short",
      }
    )
  }

  // ======================================================
  // UNENROLL
  // ======================================================

  const handleUnenroll =
    async () => {
      setUnenrolling(
        true
      )

      setError("")

      try {
        const {
          data,
          error:
            unenrollError,
        } =
          await supabase.rpc(
            "unenroll_from_assignment",
            {
              p_assignment_id:
                assignmentId,
            }
          )

        if (
          unenrollError
        ) {
          console.error(
            "Unenroll error:",
            unenrollError
          )

          setError(
            unenrollError.message
          )

          setUnenrolling(
            false
          )

          return
        }

        console.log(
          "Unenroll successful:",
          data
        )

        setShowUnenrollConfirm(
          false
        )

        setShowManageModal(
          false
        )

        navigate(
          "/assignments"
        )
      } catch (error) {
        console.error(
          "Unenroll exception:",
          error
        )

        setError(
          "Unable to unenroll from this task."
        )

        setUnenrolling(
          false
        )
      }
    }

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">

        <div className="mx-auto max-w-6xl">

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">

            <div className="animate-pulse space-y-5">

              <div className="h-8 w-1/3 rounded bg-slate-200" />

              <div className="h-4 w-2/3 rounded bg-slate-200" />

              <div className="h-24 rounded bg-slate-200" />

              <div className="h-16 rounded bg-slate-200" />

              <div className="h-16 rounded bg-slate-200" />

            </div>

          </div>

        </div>

      </div>
    )
  }

  // ======================================================
  // ERROR
  // ======================================================

  if (
    error &&
    !assignment
  ) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">

        <div className="mx-auto max-w-4xl">

          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">

            <h2 className="text-lg font-semibold text-red-800">
              Unable to load task
            </h2>

            <p className="mt-2 text-sm text-red-700">
              {error}
            </p>

            <button
              onClick={() =>
                navigate(
                  "/assignments"
                )
              }
              className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Back to Assignments
            </button>

          </div>

        </div>

      </div>
    )
  }

  // ======================================================
  // NOT ENROLLED
  // ======================================================

  if (
    assignment &&
    !group
  ) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">

        <div className="mx-auto max-w-4xl">

          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <span className="text-2xl">
                🔒
              </span>
            </div>

            <h1 className="mt-5 text-2xl font-bold text-slate-900">
              Task Enrollment Required
            </h1>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
              You are not currently enrolled
              in this task. Enroll from the
              Assignments page to access its
              questions, group, solutions,
              and collaboration features.
            </p>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5 text-left">

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Task
              </p>

              <p className="mt-1 text-lg font-semibold text-slate-900">
                {assignment.title}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {getUnitLabel(
                  assignment
                )}
              </p>

            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">

              <button
                onClick={
                  handleBack
                }
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                ← Back to Task
              </button>

              <button
                onClick={() =>
                  navigate(
                    "/assignments"
                  )
                }
                className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Go to Assignments
              </button>

            </div>

          </div>

        </div>

      </div>
    )
  }

  // ======================================================
  // MAIN PAGE
  // ======================================================

  return (
    <div className="min-h-screen bg-slate-50 p-6">

      <div className="mx-auto max-w-6xl">

        {/* =================================================
            TOP NAVIGATION
        ================================================= */}

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

          <button
            type="button"
            onClick={
              handleBack
            }
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
          >
            <span className="text-base">
              ←
            </span>

            Back to Task
          </button>

          {assignment.status ===
            "CLOSED" && (
            <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700">
              CLOSED
            </span>
          )}

        </div>

        {/* =================================================
            TASK HEADER
        ================================================= */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

            <div>

              <div className="flex flex-wrap items-center gap-2">

                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                  {formatType(
                    assignment.assignment_type
                  )}
                </span>

                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  ENROLLED
                </span>

              </div>

              <h1 className="mt-4 text-3xl font-bold text-slate-900">
                {assignment.title}
              </h1>

              <p className="mt-2 text-sm font-medium text-indigo-600">
                {getUnitLabel(
                  assignment
                )}
              </p>

              {assignment.description && (
                <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
                  {assignment.description}
                </p>
              )}

            </div>

            <button
              onClick={() =>
                setShowManageModal(
                  true
                )
              }
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Manage Task
            </button>

          </div>

          {/* =================================================
              TASK INFO
          ================================================= */}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-xl bg-slate-50 p-4">

              <p className="text-xs font-medium text-slate-500">
                My Group
              </p>

              <p className="mt-1 text-base font-semibold text-slate-900">
                {group?.name ||
                  "Not assigned"}
              </p>

            </div>

            <div className="rounded-xl bg-slate-50 p-4">

              <p className="text-xs font-medium text-slate-500">
                Questions
              </p>

              <p className="mt-1 text-base font-semibold text-slate-900">
                {questions.length}
              </p>

            </div>

            <div className="rounded-xl bg-slate-50 p-4">

              <p className="text-xs font-medium text-slate-500">
                My Assigned Questions
              </p>

              <p className="mt-1 text-base font-semibold text-slate-900">
                {assignedQuestionIds.size}
              </p>

            </div>

            <div className="rounded-xl bg-slate-50 p-4">

              <p className="text-xs font-medium text-slate-500">
                Deadline
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                {formatDate(
                  assignment.deadline
                )}
              </p>

            </div>

          </div>

          {/* =================================================
              GROUP ACTION
          ================================================= */}

          <div className="mt-5 flex flex-wrap gap-3">

            <button
              onClick={() =>
                navigate(
                  `/my-group/${assignmentId}`
                )
              }
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              View My Group
            </button>

          </div>

        </div>

        {/* =================================================
            ERROR BANNER
        ================================================= */}

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">

            <p className="text-sm text-red-700">
              {error}
            </p>

          </div>
        )}

        {/* =================================================
            QUESTIONS
        ================================================= */}

        <div className="mt-6">

          <div className="mb-4">

            <h2 className="text-xl font-bold text-slate-900">
              Questions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Open a question to view its
              workspace, submit a solution,
              and participate in the discussion.
            </p>

          </div>

          {questions.length ===
          0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">

              <p className="text-sm text-slate-500">
                No questions have been
                added to this task yet.
              </p>

            </div>
          ) : (
            <div className="space-y-4">

              {questions.map(
                (question) => {
                  const isAssigned =
                    assignedQuestionIds.has(
                      question.id
                    )

                  const assignedGroups =
                    getAssignedGroupNames(
                      question.id
                    )

                  return (
                    <button
                      key={
                        question.id
                      }
                      onClick={() =>
                        handleQuestionClick(
                          question
                        )
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
                    >

                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2">

                            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                              Q
                              {
                                question.question_number
                              }
                            </span>

                            {isAssigned && (
                              <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                                Assigned to My Group
                              </span>
                            )}

                          </div>

                          <h3 className="mt-3 text-base font-semibold text-slate-900">
                            {question.title ||
                              `Question ${question.question_number}`}
                          </h3>

                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                            {
                              question.question_text
                            }
                          </p>

                        </div>

                        <div className="shrink-0 text-right">

                          {question.points !==
                            null &&
                            question.points !==
                              undefined && (
                              <p className="text-sm font-semibold text-slate-700">
                                {
                                  question.points
                                }{" "}
                                points
                              </p>
                            )}

                          <p className="mt-2 text-xs font-medium text-indigo-600">
                            Open →
                          </p>

                        </div>

                      </div>

                      {assignedGroups.length >
                        0 && (
                        <div className="mt-4 border-t border-slate-100 pt-3">

                          <p className="text-xs text-slate-500">

                            Assigned group
                            {assignedGroups.length >
                            1
                              ? "s"
                              : ""}
                            :{" "}

                            <span className="font-medium text-slate-700">
                              {assignedGroups.join(
                                ", "
                              )}
                            </span>

                          </p>

                        </div>
                      )}

                    </button>
                  )
                }
              )}

            </div>
          )}

        </div>

      </div>

      {/* ====================================================
          MANAGE TASK MODAL
      ==================================================== */}

      {showManageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">

            <div className="flex items-start justify-between gap-4">

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  Manage Task
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Manage your enrollment for
                  this task.
                </p>

              </div>

              <button
                onClick={() =>
                  setShowManageModal(
                    false
                  )
                }
                className="rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ×
              </button>

            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">

              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Current task
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {assignment.title}
              </p>

              <div className="mt-3 grid grid-cols-2 gap-3">

                <div>

                  <p className="text-xs text-slate-500">
                    Group
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {group?.name ||
                      "Not assigned"}
                  </p>

                </div>

                <div>

                  <p className="text-xs text-slate-500">
                    Questions
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {questions.length}
                  </p>

                </div>

              </div>

            </div>

            <div className="mt-6">

              <button
                onClick={() =>
                  setShowUnenrollConfirm(
                    true
                  )
                }
                className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-100"
              >
                Unenroll from Task
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ====================================================
          UNENROLL CONFIRMATION
      ==================================================== */}

      {showUnenrollConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">

              <span className="text-xl">
                !
              </span>

            </div>

            <h2 className="mt-4 text-xl font-bold text-slate-900">
              Unenroll from this task?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Your active access to this task
              will end. Your previous submissions
              and reviews will remain in the system.
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              You can enroll in this task again
              later if enrollment is still open.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

              <button
                onClick={() =>
                  setShowUnenrollConfirm(
                    false
                  )
                }
                disabled={
                  unenrolling
                }
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={
                  handleUnenroll
                }
                disabled={
                  unenrolling
                }
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {unenrolling
                  ? "Unenrolling..."
                  : "Yes, Unenroll"}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  )
}

export default TaskDetail
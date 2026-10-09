import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { supabase } from "../lib/supabase"

function MyGroupProject() {
  const navigate = useNavigate()
  const { assignmentId } = useParams()

  const [currentUser, setCurrentUser] = useState(null)
  const [assignment, setAssignment] = useState(null)
  const [group, setGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [questions, setQuestions] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true

    const fetchProject = async () => {
      if (!assignmentId) {
        setError("Invalid assignment.")
        setLoading(false)
        return
      }

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

        if (!mounted) return

        setCurrentUser(user)

        // ==================================================
        // 2. ASSIGNMENT
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
            deadline
          `)
          .eq("id", assignmentId)
          .maybeSingle()

        if (assignmentError) {
          throw new Error(
            assignmentError.message
          )
        }

        if (!assignmentData) {
          throw new Error(
            "Project not found."
          )
        }

        if (!mounted) return

        setAssignment(assignmentData)

        // ==================================================
        // 3. VERIFY TASK-SPECIFIC ENROLLMENT
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
            is_active
          `)
          .eq("assignment_id", assignmentId)
          .eq("user_id", user.id)
          .eq("is_active", true)
          .maybeSingle()

        if (membershipError) {
          throw new Error(
            membershipError.message
          )
        }

        if (!membership) {
          throw new Error(
            "You are not enrolled in this project."
          )
        }

        // ==================================================
        // 4. FETCH GROUP
        // ==================================================

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
          .eq("id", membership.group_id)
          .eq("assignment_id", assignmentId)
          .eq("is_active", true)
          .maybeSingle()

        if (groupError) {
          throw new Error(
            groupError.message
          )
        }

        if (!groupData) {
          throw new Error(
            "Your group could not be found."
          )
        }

        if (!mounted) return

        setGroup(groupData)

        // ==================================================
        // 5. GROUP MEMBERS
        // ==================================================

        const {
          data: memberData,
          error: memberError,
        } = await supabase
          .from("assignment_group_members")
          .select(`
            id,
            user_id,
            group_id,
            joined_at,
            is_active,
            profiles (
              id,
              full_name,
              email,
              avatar_url
            )
          `)
          .eq("assignment_id", assignmentId)
          .eq("group_id", membership.group_id)
          .eq("is_active", true)
          .order("joined_at", {
            ascending: true,
          })

        if (memberError) {
          throw new Error(
            memberError.message
          )
        }

        if (!mounted) return

        setMembers(memberData || [])

        // ==================================================
        // 6. FETCH QUESTION ASSIGNMENTS
        //
        // IMPORTANT:
        // Do NOT use nested questions(...) here.
        //
        // First get the actual question_assignments
        // belonging to this group's ID.
        // Then fetch questions separately.
        // ==================================================

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
          .eq("group_id", membership.group_id)
          .eq("is_active", true)
          .order("assigned_at", {
            ascending: true,
          })

        if (questionAssignmentError) {
          throw new Error(
            questionAssignmentError.message
          )
        }

        const activeQuestionAssignments =
          questionAssignmentData || []

        // ==================================================
        // 7. GET QUESTION IDS FOR THIS ASSIGNMENT
        // ==================================================

        const questionIds =
          activeQuestionAssignments.map(
            (item) => item.question_id
          )

        if (questionIds.length === 0) {
          if (!mounted) return

          setQuestions([])
          setLoading(false)
          return
        }

        // ==================================================
        // 8. FETCH QUESTIONS SEPARATELY
        //
        // This avoids problems caused by nested Supabase
        // relation/RLS behaviour.
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
            points,
            created_at,
            updated_at
          `)
          .eq("assignment_id", assignmentId)
          .in("id", questionIds)
          .order("question_number", {
            ascending: true,
          })

        if (questionError) {
          throw new Error(
            questionError.message
          )
        }

        const questionMap = new Map(
          (questionData || []).map(
            (question) => [
              question.id,
              question,
            ]
          )
        )

        // ==================================================
        // 9. BUILD FINAL ASSIGNED QUESTION LIST
        // ==================================================

        const finalQuestions =
          activeQuestionAssignments
            .map((questionAssignment) => {
              const question =
                questionMap.get(
                  questionAssignment.question_id
                )

              if (!question) {
                return null
              }

              return {
                ...questionAssignment,
                questions: question,
              }
            })
            .filter(Boolean)

        // ==================================================
        // 10. SET FINAL QUESTIONS
        // ==================================================

        if (!mounted) return

        setQuestions(finalQuestions)
        setLoading(false)
      } catch (fetchError) {
        console.error(
          "MyGroupProject error:",
          fetchError
        )

        if (!mounted) return

        setError(
          fetchError?.message ||
            "Something went wrong while loading this project."
        )

        setLoading(false)
      }
    }

    fetchProject()

    return () => {
      mounted = false
    }
  }, [assignmentId])

  // ==================================================
  // HELPERS
  // ==================================================

  const getSectionLabel = () => {
    if (!assignment) {
      return "Task"
    }

    if (assignment.section_name) {
      return assignment.section_name
    }

    if (
      assignment.week_number !== null &&
      assignment.week_number !== undefined
    ) {
      return `Subsection ${assignment.week_number}`
    }

    return "Subsection"
  }

  const handleBack = () => {
    navigate("/my-group")
  }

  const handleQuestionOpen = (questionId) => {
    if (!questionId) {
      return
    }

    navigate(
      `/questions/${questionId}`,
      {
        state: {
          from: `/my-group/${assignmentId}`,
          assignmentId,
        },
      }
    )
  }

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-6xl">

          <button
            type="button"
            onClick={handleBack}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            ← Back to My Group
          </button>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="animate-pulse space-y-5">

              <div className="h-4 w-32 rounded bg-slate-200" />

              <div className="h-8 w-1/2 rounded bg-slate-200" />

              <div className="h-4 w-2/3 rounded bg-slate-200" />

              <div className="h-28 rounded-2xl bg-slate-200" />

              <div className="h-40 rounded-2xl bg-slate-200" />

            </div>
          </div>

        </div>
      </main>
    )
  }

  // ==================================================
  // ERROR
  // ==================================================

  if (error || !assignment) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-4xl">

          <button
            type="button"
            onClick={handleBack}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            ← Back to My Group
          </button>

          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">

            <div className="flex items-start gap-4">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700 font-bold">
                !
              </div>

              <div>
                <h2 className="font-semibold text-red-900">
                  Unable to open project
                </h2>

                <p className="mt-2 text-sm leading-6 text-red-700">
                  {error ||
                    "Project information could not be loaded."}
                </p>
              </div>

            </div>

          </div>

        </div>
      </main>
    )
  }

  // ==================================================
  // MAIN
  // ==================================================

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">

        {/* ==================================================
            BACK
        ================================================== */}

        <button
          type="button"
          onClick={handleBack}
          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          ← Back to My Group
        </button>

        {/* ==================================================
            PROJECT HEADER
        ================================================== */}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

            <div className="min-w-0">

              <div className="flex flex-wrap items-center gap-2">

                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  {getSectionLabel()}
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    assignment.status === "CLOSED"
                      ? "bg-amber-100 text-amber-700"
                      : assignment.status === "PUBLISHED"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {assignment.status}
                </span>

              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
                {assignment.title}
              </h1>

              {assignment.description && (
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  {assignment.description}
                </p>
              )}

            </div>

            <div className="flex shrink-0 flex-wrap gap-2">

              <span className="rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
                ENROLLED
              </span>

              <span className="rounded-full bg-indigo-100 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                {group?.name || "My Group"}
              </span>

            </div>

          </div>

        </section>

        {/* ==================================================
            GROUP INFORMATION
        ================================================== */}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

            <div>

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Your group
              </p>

              <h2 className="mt-2 text-2xl font-bold text-indigo-600">
                {group?.name || "My Group"}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {members.length}{" "}
                {members.length === 1
                  ? "member"
                  : "members"}
              </p>

            </div>

            <div className="min-w-0 lg:max-w-2xl">

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Group members
              </p>

              <div className="mt-3 flex flex-wrap gap-2">

                {members.length === 0 ? (
                  <span className="text-sm text-slate-500">
                    No active members found.
                  </span>
                ) : (
                  members.map((member) => {

                    const isCurrentUser =
                      member.user_id ===
                      currentUser?.id

                    return (
                      <span
                        key={member.id}
                        className={`rounded-full px-3 py-1.5 text-sm ${
                          isCurrentUser
                            ? "bg-blue-100 font-semibold text-blue-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {member.profiles?.full_name ||
                          member.profiles?.email ||
                          "Member"}

                        {isCurrentUser &&
                          " (You)"}
                      </span>
                    )
                  })
                )}

              </div>

            </div>

          </div>

        </section>

        {/* ==================================================
            QUESTIONS
        ================================================== */}

        <section className="mt-8">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <h2 className="text-2xl font-bold text-slate-900">
                Assigned Questions
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                These questions are specifically assigned
                to your group.
              </p>

            </div>

            <div className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600">
              {questions.length}{" "}
              {questions.length === 1
                ? "Question"
                : "Questions"}
            </div>

          </div>

          {/* ==================================================
              NO QUESTIONS
          ================================================== */}

          {questions.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                ?
              </div>

              <h3 className="mt-4 font-semibold text-slate-800">
                No questions assigned
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                There are currently no active question
                assignments for your group in this
                subsection.
              </p>

            </div>
          ) : (

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

              {questions.map(
                (questionAssignment) => {

                  const question =
                    questionAssignment.questions

                  if (!question) {
                    return null
                  }

                  return (
                    <button
                      key={
                        questionAssignment.id
                      }
                      type="button"
                      onClick={() =>
                        handleQuestionOpen(
                          question.id
                        )
                      }
                      className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                    >

                      <div className="flex items-start justify-between gap-3">

                        <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                          Q
                          {question.question_number}
                        </span>

                        {question.points !== null &&
                          question.points !==
                            undefined && (
                            <span className="text-xs font-medium text-slate-500">
                              {question.points}{" "}
                              points
                            </span>
                          )}

                      </div>

                      <h3 className="mt-4 text-lg font-bold text-slate-900 group-hover:text-blue-600">
                        {question.title ||
                          `Question ${question.question_number}`}
                      </h3>

                      <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-600">
                        {question.question_text}
                      </p>

                      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">

                        <span className="text-xs text-slate-400">
                          Assigned to{" "}
                          {group?.name ||
                            "your group"}
                        </span>

                        <span className="text-sm font-semibold text-blue-600 transition-transform group-hover:translate-x-1">
                          Open →
                        </span>

                      </div>

                    </button>
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

export default MyGroupProject
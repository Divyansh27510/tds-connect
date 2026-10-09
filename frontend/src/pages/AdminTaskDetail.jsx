import { useEffect, useMemo, useState } from "react"
import {
  useNavigate,
  useParams,
} from "react-router-dom"
import { supabase } from "../lib/supabase"

const ADMIN_EMAIL = "divyanshsingh879596@gmail.com"

function AdminTaskDetail() {
  const { assignmentId } = useParams()
  const navigate = useNavigate()

  const [currentUser, setCurrentUser] = useState(null)
  const [assignment, setAssignment] = useState(null)
  const [questions, setQuestions] = useState([])
  const [questionAssignments, setQuestionAssignments] =
    useState([])
  const [submissions, setSubmissions] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchTaskDetails = async () => {
      setLoading(true)
      setError("")

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setError(
          "Unable to identify the logged-in user."
        )
        setLoading(false)
        return
      }

      setCurrentUser(user)

      if (
        user.email?.toLowerCase() !==
        ADMIN_EMAIL
      ) {
        setError(
          "You are not authorized to view student answers."
        )
        setLoading(false)
        return
      }

      const { data: assignmentData, error: assignmentError } =
        await supabase
          .from("assignments")
          .select(`
            id,
            title,
            description,
            assignment_type,
            status,
            week_number,
            total_questions,
            group_size,
            start_at,
            deadline
          `)
          .eq("id", assignmentId)
          .maybeSingle()

      if (assignmentError) {
        console.error(
          "Assignment fetch error:",
          assignmentError
        )

        setError(assignmentError.message)
        setLoading(false)
        return
      }

      if (!assignmentData) {
        setError("Task not found.")
        setLoading(false)
        return
      }

      setAssignment(assignmentData)

      const { data: questionData, error: questionError } =
        await supabase
          .from("questions")
          .select(`
            id,
            assignment_id,
            question_number,
            title,
            question_text,
            points
          `)
          .eq("assignment_id", assignmentId)
          .order("question_number", {
            ascending: true,
          })

      if (questionError) {
        console.error(
          "Questions fetch error:",
          questionError
        )

        setError(questionError.message)
        setLoading(false)
        return
      }

      setQuestions(questionData || [])

      const questionIds = (
        questionData || []
      ).map((question) => question.id)

      if (questionIds.length === 0) {
        setQuestionAssignments([])
        setSubmissions([])
        setLoading(false)
        return
      }

      const [
        questionAssignmentsResult,
        submissionsResult,
      ] = await Promise.all([
        supabase
          .from("question_assignments")
          .select(`
            id,
            question_id,
            group_id,
            assigned_at,
            is_active,
            groups (
              id,
              name
            )
          `)
          .in(
            "question_id",
            questionIds
          )
          .eq("is_active", true),

        supabase
          .from("submissions")
          .select(`
            id,
            question_id,
            group_id,
            submitted_by,
            content,
            status,
            version,
            submitted_at,
            created_at,
            updated_at
          `)
          .in(
            "question_id",
            questionIds
          )
          .order("submitted_at", {
            ascending: false,
            nullsFirst: false,
          }),
      ])

      if (
        questionAssignmentsResult.error
      ) {
        console.error(
          "Question assignments error:",
          questionAssignmentsResult.error
        )

        setError(
          questionAssignmentsResult.error.message
        )
        setLoading(false)
        return
      }

      if (submissionsResult.error) {
        console.error(
          "Submissions error:",
          submissionsResult.error
        )

        setError(
          submissionsResult.error.message
        )
        setLoading(false)
        return
      }

      const rawSubmissions =
        submissionsResult.data || []

      const studentIds = [
        ...new Set(
          rawSubmissions
            .map(
              (submission) =>
                submission.submitted_by
            )
            .filter(Boolean)
        ),
      ]

      let profileData = []

      if (studentIds.length > 0) {
        const {
          data,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select(`
            id,
            full_name,
            email,
            avatar_url
          `)
          .in("id", studentIds)

        if (profileError) {
          console.error(
            "Profiles error:",
            profileError
          )

          setError(profileError.message)
          setLoading(false)
          return
        }

        profileData = data || []
      }

      const profileMap = {}

      profileData.forEach((profile) => {
        profileMap[profile.id] = profile
      })

      const enrichedSubmissions =
        rawSubmissions.map(
          (submission) => ({
            ...submission,
            student:
              profileMap[
                submission.submitted_by
              ] || null,
          })
        )

      setQuestionAssignments(
        questionAssignmentsResult.data || []
      )

      setSubmissions(
        enrichedSubmissions
      )

      setLoading(false)
    }

    fetchTaskDetails()
  }, [assignmentId])

  const formatType = (type) => {
    if (!type) {
      return "Other"
    }

    return type
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      )
  }

  const getUnitLabel = (task) => {
    if (task.assignment_type === "PROJECT") {
      return `Project ${task.week_number}`
    }

    if (task.assignment_type === "QUIZ") {
      return `Quiz ${task.week_number}`
    }

    return `Week ${task.week_number}`
  }

  const getStatusStyle = (status) => {
    if (status === "PUBLISHED") {
      return "bg-green-50 text-green-700 border-green-200"
    }

    if (status === "CLOSED") {
      return "bg-gray-100 text-gray-600 border-gray-200"
    }

    return "bg-yellow-50 text-yellow-700 border-yellow-200"
  }

  const getQuestionAssignment = (
    questionId
  ) => {
    return questionAssignments.find(
      (assignment) =>
        assignment.question_id ===
        questionId
    )
  }

  const latestSubmissions = useMemo(() => {
    const latestMap = {}

    submissions.forEach((submission) => {
      const key = `${submission.question_id}-${submission.submitted_by}`

      const existing = latestMap[key]

      if (!existing) {
        latestMap[key] = submission
        return
      }

      const existingVersion =
        existing.version || 0

      const currentVersion =
        submission.version || 0

      if (
        currentVersion >
        existingVersion
      ) {
        latestMap[key] = submission
        return
      }

      if (
        currentVersion ===
          existingVersion &&
        new Date(
          submission.submitted_at ||
            submission.created_at ||
            0
        ) >
          new Date(
            existing.submitted_at ||
              existing.created_at ||
              0
          )
      ) {
        latestMap[key] = submission
      }
    })

    return Object.values(latestMap)
  }, [submissions])

  const getQuestionSubmissions = (
    questionId
  ) => {
    return latestSubmissions
      .filter(
        (submission) =>
          submission.question_id ===
          questionId
      )
      .sort((a, b) => {
        const dateA = new Date(
          a.submitted_at ||
            a.created_at ||
            0
        )

        const dateB = new Date(
          b.submitted_at ||
            b.created_at ||
            0
        )

        return dateB - dateA
      })
  }

  const openCommunityReview = (
    questionId
  ) => {
    navigate(`/questions/${questionId}`)
  }

  if (loading) {
    return (
      <main className="p-8">
        <p className="text-gray-500">
          Loading task details...
        </p>
      </main>
    )
  }

  if (
    currentUser &&
    currentUser.email?.toLowerCase() !==
      ADMIN_EMAIL
  ) {
    return (
      <main className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-red-700">
            Access Restricted
          </h2>

          <p className="mt-2 text-red-600">
            Only the TDS Connect admin can view student answers.
          </p>
        </div>
      </main>
    )
  }

  if (error || !assignment) {
    return (
      <main className="p-8">

        <button
          type="button"
          onClick={() =>
            navigate("/admin-answers")
          }
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Back to Student Answers
        </button>

        <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-red-700">
            Unable to open task
          </h2>

          <p className="mt-2 text-red-600">
            {error || "Task not found."}
          </p>
        </div>

      </main>
    )
  }

  return (
    <main className="p-8">

      <button
        type="button"
        onClick={() =>
          navigate("/admin-answers")
        }
        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
      >
        ← Back to Student Answers
      </button>

      <div className="mt-5 bg-white rounded-2xl border border-gray-200 shadow-sm p-7">

        <div className="flex items-start justify-between gap-6">

          <div>
            <p className="text-sm font-semibold text-blue-600">
              {formatType(
                assignment.assignment_type
              )}
            </p>

            <h2 className="mt-1 text-3xl font-bold text-gray-800">
              {assignment.title}
            </h2>

            <p className="mt-2 text-gray-500">
              {getUnitLabel(assignment)}
            </p>
          </div>

          <span
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${getStatusStyle(
              assignment.status
            )}`}
          >
            {assignment.status}
          </span>

        </div>

        {assignment.description && (
          <p className="mt-5 text-gray-600">
            {assignment.description}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-4 text-sm text-gray-500">
          <span>
            {questions.length} Questions
          </span>

          <span>
            Group size:{" "}
            {assignment.group_size}
          </span>

          <span>
            Latest submissions:{" "}
            {latestSubmissions.length}
          </span>

          {assignment.deadline && (
            <span>
              Deadline:{" "}
              {new Date(
                assignment.deadline
              ).toLocaleString()}
            </span>
          )}
        </div>

      </div>

      <div className="mt-8">

        <h3 className="text-xl font-semibold text-gray-800">
          Questions
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          All questions are shown in question-number order.
        </p>

      </div>

      {questions.length === 0 ? (
        <div className="mt-5 bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-gray-500">
            No questions have been added to this task.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-6">

          {questions.map((question) => {
            const questionAssignment =
              getQuestionAssignment(
                question.id
              )

            const questionSubmissions =
              getQuestionSubmissions(
                question.id
              )

            return (
              <section
                key={question.id}
                className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
              >

                <div className="bg-gray-50 border-b border-gray-200 px-6 py-5">

                  <div className="flex items-start justify-between gap-5">

                    <div>
                      <div className="flex items-center gap-3">

                        <span className="text-sm font-bold text-blue-600">
                          Q{question.question_number}
                        </span>

                        <h4 className="text-xl font-semibold text-gray-800">
                          {question.title}
                        </h4>

                      </div>

                      <p className="mt-2 text-sm text-gray-500">
                        {question.points} points
                      </p>
                    </div>

                    <div className="flex items-center gap-3">

                      {questionAssignment ? (
                        <span className="shrink-0 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-full text-sm font-medium">
                          Assigned to{" "}
                          {questionAssignment.groups?.name ||
                            "Group"}
                        </span>
                      ) : (
                        <span className="shrink-0 bg-gray-100 text-gray-500 px-3 py-1.5 rounded-full text-sm">
                          Not assigned
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          openCommunityReview(
                            question.id
                          )
                        }
                        className="shrink-0 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                      >
                        Open Community Review
                      </button>

                    </div>

                  </div>

                </div>

                <div className="p-6">

                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      Question
                    </p>

                    <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-700 whitespace-pre-wrap">
                      {question.question_text}
                    </div>
                  </div>

                  <div className="mt-7">

                    <div className="flex items-center justify-between">

                      <div>
                        <h5 className="text-lg font-semibold text-gray-800">
                          Student Submissions
                        </h5>

                        <p className="mt-1 text-sm text-gray-500">
                          Showing the latest submission from each student.
                        </p>
                      </div>

                      <span className="text-sm text-gray-500">
                        {questionSubmissions.length}{" "}
                        {questionSubmissions.length === 1
                          ? "submission"
                          : "submissions"}
                      </span>

                    </div>

                    {questionSubmissions.length ===
                    0 ? (
                      <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-5">
                        <p className="text-sm text-gray-500">
                          No student has submitted an answer yet.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-4">

                        {questionSubmissions.map(
                          (submission) => (
                            <div
                              key={
                                submission.id
                              }
                              className="border border-gray-200 rounded-xl p-5"
                            >

                              <div className="flex items-start justify-between gap-5">

                                <div>
                                  <p className="font-semibold text-gray-800">
                                    {submission.student
                                      ?.full_name ||
                                      "Unknown student"}
                                  </p>

                                  <p className="mt-1 text-sm text-gray-500">
                                    {
                                      submission
                                        .student
                                        ?.email
                                    }
                                  </p>
                                </div>

                                <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-green-50 text-green-700">
                                  {
                                    submission.status
                                  }
                                </span>

                              </div>

                              <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-500">

                                <span>
                                  Version{" "}
                                  {
                                    submission.version
                                  }
                                </span>

                                <span>
                                  Submitted:{" "}
                                  {submission.submitted_at
                                    ? new Date(
                                        submission.submitted_at
                                      ).toLocaleString()
                                    : "Not available"}
                                </span>

                              </div>

                              <div className="mt-4">

                                <p className="text-sm font-semibold text-gray-700">
                                  Answer
                                </p>

                                <div className="mt-2 bg-white border border-gray-300 rounded-lg p-4 text-gray-800 whitespace-pre-wrap">
                                  {submission.content ||
                                    "No answer content."}
                                </div>

                              </div>

                            </div>
                          )
                        )}

                      </div>
                    )}

                  </div>

                </div>

              </section>
            )
          })}

        </div>
      )}

    </main>
  )
}

export default AdminTaskDetail
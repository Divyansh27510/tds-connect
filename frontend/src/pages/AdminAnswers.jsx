import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"

const ADMIN_EMAIL = "divyanshsingh879596@gmail.com"

function AdminAnswers() {
  const navigate = useNavigate()

  const [currentUser, setCurrentUser] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchAssignments = async () => {
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

      const { data, error } = await supabase
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
          deadline,
          created_at,
          questions (
            id,
            question_number,
            title,
            points
          )
        `)
        .order("created_at", {
          ascending: false,
        })

      if (error) {
        console.error(
          "Admin assignments fetch error:",
          error
        )

        setError(error.message)
        setLoading(false)
        return
      }

      setAssignments(data || [])
      setLoading(false)
    }

    fetchAssignments()
  }, [])

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

  const getUnitLabel = (assignment) => {
    if (assignment.assignment_type === "PROJECT") {
      return `Project ${assignment.week_number}`
    }

    if (assignment.assignment_type === "QUIZ") {
      return `Quiz ${assignment.week_number}`
    }

    return `Week ${assignment.week_number}`
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

  if (loading) {
    return (
      <main className="p-8">
        <h2 className="text-3xl font-bold text-gray-800">
          Student Answers
        </h2>

        <p className="mt-4 text-gray-500">
          Loading tasks...
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

  return (
    <main className="p-8">

      <div>
        <h2 className="text-3xl font-bold text-gray-800">
          Student Answers
        </h2>

        <p className="mt-2 text-gray-600">
          Select a task to review its questions,
          assigned groups, and student submissions.
        </p>
      </div>

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 text-red-600 rounded-lg p-4">
          {error}
        </div>
      )}

      {assignments.length === 0 ? (
        <div className="mt-8 bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">

          <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 flex items-center justify-center">
            <span className="text-2xl">📝</span>
          </div>

          <h3 className="mt-4 text-lg font-semibold text-gray-800">
            No tasks created yet
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            Create an assignment or project first.
          </p>

        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

          {assignments.map((assignment) => {
            const questions = [
              ...(assignment.questions || []),
            ].sort(
              (a, b) =>
                a.question_number -
                b.question_number
            )

            return (
              <button
                key={assignment.id}
                type="button"
                onClick={() =>
                  navigate(
                    `/admin-answers/${assignment.id}`
                  )
                }
                className="text-left bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5 transition-all"
              >

                <div className="flex items-start justify-between gap-4">

                  <div>
                    <p className="text-sm font-semibold text-blue-600">
                      {formatType(
                        assignment.assignment_type
                      )}
                    </p>

                    <h3 className="mt-1 text-xl font-bold text-gray-800">
                      {assignment.title}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      {getUnitLabel(assignment)}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border ${getStatusStyle(
                      assignment.status
                    )}`}
                  >
                    {assignment.status}
                  </span>

                </div>

                {assignment.description && (
                  <p className="mt-5 text-sm text-gray-600 line-clamp-3 min-h-[60px]">
                    {assignment.description}
                  </p>
                )}

                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">

                  <div className="flex items-center gap-4 text-sm text-gray-500">

                    <span>
                      {questions.length}{" "}
                      {questions.length === 1
                        ? "Question"
                        : "Questions"}
                    </span>

                    <span>
                      Group size:{" "}
                      {assignment.group_size}
                    </span>

                  </div>

                  <span className="text-blue-600 font-semibold">
                    Review →
                  </span>

                </div>

              </button>
            )
          })}

        </div>
      )}

    </main>
  )
}

export default AdminAnswers
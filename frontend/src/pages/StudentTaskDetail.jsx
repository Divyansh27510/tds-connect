import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"

function StudentAssignments() {
  const navigate = useNavigate()

  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchAssignments = async () => {
      setLoading(true)
      setError("")

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
        .eq("status", "PUBLISHED")
        .order("created_at", {
          ascending: true,
        })

      if (error) {
        console.error(
          "Student assignments error:",
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

  const getTaskDescription = (assignment) => {
    if (assignment.description?.trim()) {
      return assignment.description
    }

    if (assignment.assignment_type === "PROJECT") {
      return "Open project task"
    }

    if (assignment.assignment_type === "QUIZ") {
      return "Course quiz"
    }

    return "Course assignment"
  }

  if (loading) {
    return (
      <main className="p-8">
        <h2 className="text-3xl font-bold text-gray-800">
          Assignments
        </h2>

        <p className="mt-4 text-gray-500">
          Loading assignments...
        </p>
      </main>
    )
  }

  return (
    <main className="p-8">

      <div>
        <h2 className="text-3xl font-bold text-gray-800">
          Assignments
        </h2>

        <p className="mt-2 text-gray-600">
          Select a task to view its questions and your assigned work.
        </p>
      </div>

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 text-red-600 rounded-lg p-4">
          {error}
        </div>
      )}

      {assignments.length === 0 ? (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 flex items-center justify-center">
            <span className="text-2xl">📚</span>
          </div>

          <h3 className="mt-4 text-lg font-semibold text-gray-800">
            No published tasks yet
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            Your assignments, projects and quizzes will appear here once they are published.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

          {assignments.map((assignment) => {
            const questions = [...(assignment.questions || [])].sort(
              (a, b) =>
                a.question_number - b.question_number
            )

            return (
              <button
                key={assignment.id}
                type="button"
                onClick={() =>
                  navigate(
                    `/assignments/${assignment.id}`
                  )
                }
                className="text-left bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-start justify-between gap-4">

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-blue-600">
                      {formatType(
                        assignment.assignment_type
                      )}
                    </p>

                    <h3 className="mt-1 text-xl font-bold text-gray-800 truncate">
                      {assignment.title}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      {getUnitLabel(assignment)}
                    </p>
                  </div>

                  <span className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                    PUBLISHED
                  </span>
                </div>

                <p className="mt-5 text-sm text-gray-600 line-clamp-3 min-h-[60px]">
                  {getTaskDescription(assignment)}
                </p>

                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>
                      {questions.length}{" "}
                      {questions.length === 1
                        ? "Question"
                        : "Questions"}
                    </span>

                    {assignment.deadline && (
                      <span>
                        Deadline:{" "}
                        {new Date(
                          assignment.deadline
                        ).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <span className="text-blue-600 font-semibold">
                    Open →
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

export default StudentAssignments
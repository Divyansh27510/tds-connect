import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { supabase } from "../lib/supabase"

function AdminAssignmentDetail() {
  const { assignmentId } = useParams()
  const navigate = useNavigate()

  const [assignment, setAssignment] = useState(null)
  const [parentTask, setParentTask] = useState(null)
  const [questions, setQuestions] = useState([])
  const [groups, setGroups] = useState([])
  const [groupMembers, setGroupMembers] = useState([])
  const [questionAssignments, setQuestionAssignments] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchAssignmentData = async () => {
    setLoading(true)
    setError("")

    /*
      ============================================================
      ASSIGNMENT
      ============================================================
    */

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
        group_size,
        start_at,
        deadline,
        created_at
      `)
      .eq("id", assignmentId)
      .maybeSingle()

    if (assignmentError) {
      console.error(
        "Admin assignment error:",
        assignmentError
      )

      setError(assignmentError.message)
      setLoading(false)
      return
    }

    if (!assignmentData) {
      setError("Subsection not found.")
      setLoading(false)
      return
    }

    /*
      ============================================================
      PARENT TASK
      ============================================================
    */

    let parentData = null

    if (assignmentData.parent_task_id) {
      const {
        data,
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
        .eq(
          "id",
          assignmentData.parent_task_id
        )
        .maybeSingle()

      if (parentError) {
        console.error(
          "Parent task error:",
          parentError
        )

        setError(parentError.message)
        setLoading(false)
        return
      }

      parentData = data
    }

    /*
      ============================================================
      QUESTIONS
      ============================================================
    */

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
        created_at
      `)
      .eq(
        "assignment_id",
        assignmentId
      )
      .order("question_number", {
        ascending: true,
      })

    if (questionError) {
      console.error(
        "Admin questions error:",
        questionError
      )

      setError(questionError.message)
      setLoading(false)
      return
    }

    /*
      ============================================================
      GROUPS
      ============================================================
    */

    const {
      data: groupData,
      error: groupError,
    } = await supabase
      .from("groups")
      .select(`
        id,
        assignment_id,
        name,
        max_members,
        is_active,
        created_at
      `)
      .eq(
        "assignment_id",
        assignmentId
      )
      .eq(
        "is_active",
        true
      )
      .order("created_at", {
        ascending: true,
      })

    if (groupError) {
      console.error(
        "Admin groups error:",
        groupError
      )

      setError(groupError.message)
      setLoading(false)
      return
    }

    /*
      ============================================================
      GROUP MEMBERS
      ============================================================
    */

    const {
      data: groupMemberData,
      error: groupMemberError,
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
      .eq(
        "assignment_id",
        assignmentId
      )
      .eq(
        "is_active",
        true
      )

    if (groupMemberError) {
      console.error(
        "Admin group members error:",
        groupMemberError
      )

      setError(groupMemberError.message)
      setLoading(false)
      return
    }

    /*
      ============================================================
      QUESTION ASSIGNMENTS
      ============================================================
    */

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
        is_active,
        groups (
          id,
          name
        )
      `)
      .eq(
        "is_active",
        true
      )

    if (questionAssignmentError) {
      console.error(
        "Question assignment error:",
        questionAssignmentError
      )

      setError(
        questionAssignmentError.message
      )

      setLoading(false)
      return
    }

    /*
      ============================================================
      STORE DATA
      ============================================================
    */

    setAssignment(assignmentData)
    setParentTask(parentData)
    setQuestions(questionData || [])
    setGroups(groupData || [])
    setGroupMembers(
      groupMemberData || []
    )
    setQuestionAssignments(
      questionAssignmentData || []
    )

    setLoading(false)
  }

  useEffect(() => {
    fetchAssignmentData()
  }, [assignmentId])

  /*
    ============================================================
    HELPERS
    ============================================================
  */

  const formatType = (type) => {
    if (!type) {
      return "Other"
    }

    return type
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(
        /\b\w/g,
        (letter) => letter.toUpperCase()
      )
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

  const formatDate = (value) => {
    if (!value) {
      return "-"
    }

    return new Date(value).toLocaleString()
  }

  /*
    ============================================================
    QUESTION MAP
    ============================================================
  */

  const questionMap = useMemo(() => {
    const map = new Map()

    questions.forEach((question) => {
      map.set(
        question.id,
        question
      )
    })

    return map
  }, [questions])

  /*
    ============================================================
    ASSIGNMENT MAP
    ============================================================
  */

  const questionAssignmentMap =
    useMemo(() => {
      const map = new Map()

      questionAssignments
        .filter((item) => {
          return questionMap.has(
            item.question_id
          )
        })
        .forEach((item) => {
          map.set(
            item.question_id,
            item
          )
        })

      return map
    }, [
      questionAssignments,
      questionMap,
    ])

  /*
    ============================================================
    GROUP MEMBERS
    ============================================================
  */

  const getGroupMembers = (groupId) => {
    return groupMembers.filter(
      (member) =>
        member.group_id === groupId
    )
  }

  /*
    ============================================================
    GROUP QUESTIONS
    ============================================================
  */

  const getGroupQuestions = (groupId) => {
    return questions
      .filter((question) => {
        const assignment =
          questionAssignmentMap.get(
            question.id
          )

        return (
          assignment?.group_id ===
          groupId
        )
      })
      .sort(
        (a, b) =>
          a.question_number -
          b.question_number
      )
  }

  /*
    ============================================================
    STATS
    ============================================================
  */

  const totalStudents =
    groupMembers.length

  const totalGroups =
    groups.length

  const totalQuestions =
    questions.length

  const distributedQuestions =
    questions.filter((question) =>
      questionAssignmentMap.has(
        question.id
      )
    ).length

  const unassignedQuestions =
    totalQuestions -
    distributedQuestions

  const groupQuestionCounts =
    groups.map((group) => {
      return getGroupQuestions(
        group.id
      ).length
    })

  const groupStudentCounts =
    groups.map((group) => {
      return getGroupMembers(
        group.id
      ).length
    })

  const maxQuestionCount =
    groupQuestionCounts.length > 0
      ? Math.max(
          ...groupQuestionCounts
        )
      : 0

  const minQuestionCount =
    groupQuestionCounts.length > 0
      ? Math.min(
          ...groupQuestionCounts
        )
      : 0

  const maxStudentCount =
    groupStudentCounts.length > 0
      ? Math.max(
          ...groupStudentCounts
        )
      : 0

  const minStudentCount =
    groupStudentCounts.length > 0
      ? Math.min(
          ...groupStudentCounts
        )
      : 0

  const questionBalanceDifference =
    maxQuestionCount -
    minQuestionCount

  const studentBalanceDifference =
    maxStudentCount -
    minStudentCount

  const isQuestionDistributionBalanced =
    totalGroups > 0 &&
    distributedQuestions ===
      totalQuestions &&
    questionBalanceDifference <= 1

  const isStudentDistributionBalanced =
    totalGroups > 0 &&
    studentBalanceDifference <= 1

  /*
    ============================================================
    DISTRIBUTION STATUS
    ============================================================
  */

  const distributionStatus = (() => {
    if (totalStudents === 0) {
      return {
        label: "Waiting for students",
        style:
          "bg-gray-100 text-gray-700 border-gray-200",
      }
    }

    if (totalQuestions === 0) {
      return {
        label: "No questions",
        style:
          "bg-yellow-50 text-yellow-700 border-yellow-200",
      }
    }

    if (
      distributedQuestions <
      totalQuestions
    ) {
      return {
        label: "Distribution pending",
        style:
          "bg-yellow-50 text-yellow-700 border-yellow-200",
      }
    }

    if (
      !isQuestionDistributionBalanced
    ) {
      return {
        label: "Needs rebalance",
        style:
          "bg-red-50 text-red-700 border-red-200",
      }
    }

    return {
      label: "Balanced",
      style:
        "bg-green-50 text-green-700 border-green-200",
    }
  })()

  /*
    ============================================================
    LOADING
    ============================================================
  */

  if (loading) {
    return (
      <main className="p-8">
        <p className="text-gray-500">
          Loading subsection...
        </p>
      </main>
    )
  }

  /*
    ============================================================
    ERROR
    ============================================================
  */

  if (!assignment) {
    return (
      <main className="p-8">

        <button
          type="button"
          onClick={() =>
            navigate("/assignments")
          }
          className="text-blue-600 font-medium hover:text-blue-700"
        >
          ← Back to Assignments
        </button>

        <div className="mt-6 bg-red-50 border border-red-200 text-red-600 rounded-xl p-5">
          {error ||
            "Subsection not found."}
        </div>

      </main>
    )
  }

  return (
    <main className="p-8">

      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="flex items-start justify-between gap-6">

        <div>

          <button
            type="button"
            onClick={() =>
              navigate("/assignments")
            }
            className="text-sm text-blue-600 font-medium hover:text-blue-700"
          >
            ← Back to Assignments
          </button>

          <div className="mt-5 flex items-center gap-3 flex-wrap">

            <span className="text-sm font-semibold text-blue-600">
              {formatType(
                assignment.assignment_type
              )}
            </span>

            <span
              className={`text-xs font-medium px-3 py-1 rounded-full border ${getStatusStyle(
                assignment.status
              )}`}
            >
              {assignment.status}
            </span>

          </div>

          <p className="mt-4 text-sm text-gray-500">
            Parent Task
          </p>

          <h1 className="mt-1 text-2xl font-bold text-gray-800">
            {parentTask?.title ||
              assignment.title}
          </h1>

          <div className="mt-3 flex items-center gap-3">

            <span className="text-gray-400">
              →
            </span>

            <span className="text-2xl font-semibold text-blue-600">
              {assignment.section_name ||
                (
                  assignment.week_number !==
                  null
                    ? `Week ${assignment.week_number}`
                    : "Subsection"
                )}
            </span>

          </div>

        </div>

        <div className="bg-white border border-gray-200 rounded-xl px-6 py-4 text-center shadow-sm">

          <p className="text-sm text-gray-500">
            Questions
          </p>

          <p className="mt-1 text-3xl font-bold text-blue-600">
            {questions.length}
            <span className="text-lg text-gray-400">
              /
              {assignment.total_questions}
            </span>
          </p>

        </div>

      </div>

      {/* ======================================================
          OVERVIEW STATS
          ====================================================== */}

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            Enrolled Students
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-800">
            {totalStudents}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Students currently enrolled
          </p>

        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            Groups
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-800">
            {totalGroups}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Automatically created groups
          </p>

        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            Distributed Questions
          </p>

          <p className="mt-2 text-3xl font-bold text-purple-600">
            {distributedQuestions}
            <span className="text-lg text-gray-400">
              /
              {totalQuestions}
            </span>
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Automatically assigned
          </p>

        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            Distribution
          </p>

          <div className="mt-3">

            <span
              className={`inline-flex text-sm font-medium px-3 py-2 rounded-lg border ${distributionStatus.style}`}
            >
              {distributionStatus.label}
            </span>

          </div>

        </div>

      </div>

      {/* ======================================================
          BALANCE SUMMARY
          ====================================================== */}

      <div className="mt-6 bg-white border border-gray-200 rounded-xl p-6">

        <h2 className="text-lg font-semibold text-gray-800">
          Distribution Summary
        </h2>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-5">

          <div className="bg-gray-50 rounded-lg p-4">

            <p className="text-sm text-gray-500">
              Group Size
            </p>

            <p className="mt-1 text-xl font-semibold text-gray-800">
              {assignment.group_size}
            </p>

          </div>

          <div className="bg-gray-50 rounded-lg p-4">

            <p className="text-sm text-gray-500">
              Student Balance
            </p>

            <p className="mt-1 text-xl font-semibold text-gray-800">

              {totalGroups === 0
                ? "No groups"
                : studentBalanceDifference <=
                  1
                ? "Balanced"
                : "Needs review"}

            </p>

            {totalGroups > 0 && (
              <p className="mt-1 text-xs text-gray-500">
                Difference between largest
                and smallest group:{" "}
                {studentBalanceDifference}
              </p>
            )}

          </div>

          <div className="bg-gray-50 rounded-lg p-4">

            <p className="text-sm text-gray-500">
              Question Balance
            </p>

            <p className="mt-1 text-xl font-semibold text-gray-800">

              {totalGroups === 0
                ? "Waiting for groups"
                : isQuestionDistributionBalanced
                ? "Balanced"
                : "Needs review"}

            </p>

            {totalGroups > 0 && (
              <p className="mt-1 text-xs text-gray-500">
                Difference between largest
                and smallest question load:{" "}
                {questionBalanceDifference}
              </p>
            )}

          </div>

        </div>

        {unassignedQuestions > 0 && (
          <div className="mt-5 bg-yellow-50 border border-yellow-200 rounded-lg p-4">

            <p className="text-sm font-medium text-yellow-800">
              {unassignedQuestions} question
              {unassignedQuestions === 1
                ? ""
                : "s"} currently unassigned.
            </p>

            <p className="mt-1 text-xs text-yellow-700">
              Questions will be distributed
              automatically once active groups
              are available.
            </p>

          </div>
        )}

      </div>

      {/* ======================================================
          SUBSECTION INFORMATION
          ====================================================== */}

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">

        <div className="bg-white border border-gray-200 rounded-xl p-5">

          <p className="text-sm text-gray-500">
            Planned Questions
          </p>

          <p className="mt-1 text-xl font-semibold text-gray-800">
            {assignment.total_questions}
          </p>

        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">

          <p className="text-sm text-gray-500">
            Start
          </p>

          <p className="mt-1 text-sm font-semibold text-gray-800">
            {formatDate(
              assignment.start_at
            )}
          </p>

        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">

          <p className="text-sm text-gray-500">
            Deadline
          </p>

          <p className="mt-1 text-sm font-semibold text-gray-800">
            {formatDate(
              assignment.deadline
            )}
          </p>

        </div>

      </div>

      {/* ======================================================
          DESCRIPTION
          ====================================================== */}

      {assignment.description && (
        <div className="mt-8 bg-white border border-gray-200 rounded-xl p-6">

          <h2 className="text-lg font-semibold text-gray-800">
            Description
          </h2>

          <p className="mt-3 text-gray-600 whitespace-pre-wrap">
            {assignment.description}
          </p>

        </div>
      )}

      {/* ======================================================
          GROUP DISTRIBUTION
          ====================================================== */}

      <div className="mt-8">

        <div>

          <h2 className="text-xl font-semibold text-gray-800">
            Automatic Group Distribution
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Students and questions are distributed
            automatically for this subsection.
          </p>

        </div>

        {groups.length === 0 ? (
          <div className="mt-5 bg-white border border-gray-200 rounded-xl p-8 text-center">

            <div className="text-3xl">
              👥
            </div>

            <h3 className="mt-3 font-semibold text-gray-800">
              No groups yet
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Groups will be created automatically
              when students enroll.
            </p>

          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-5">

            {groups.map((group) => {

              const members =
                getGroupMembers(
                  group.id
                )

              const groupQuestions =
                getGroupQuestions(
                  group.id
                )

              return (
                <div
                  key={group.id}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
                >

                  {/* GROUP HEADER */}

                  <div className="p-5 border-b border-gray-200">

                    <div className="flex items-center justify-between gap-4">

                      <div>

                        <h3 className="text-lg font-bold text-gray-800">
                          {group.name}
                        </h3>

                        <p className="mt-1 text-xs text-gray-500">
                          Maximum{" "}
                          {group.max_members}{" "}
                          members
                        </p>

                      </div>

                      <div className="flex gap-2">

                        <span className="text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 px-3 py-2 rounded-lg">
                          {members.length}{" "}
                          student
                          {members.length ===
                          1
                            ? ""
                            : "s"}
                        </span>

                        <span className="text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 px-3 py-2 rounded-lg">
                          {
                            groupQuestions.length
                          }{" "}
                          question
                          {groupQuestions.length ===
                          1
                            ? ""
                            : "s"}
                        </span>

                      </div>

                    </div>

                  </div>

                  {/* STUDENTS */}

                  <div className="p-5 border-b border-gray-100">

                    <h4 className="text-sm font-semibold text-gray-800">
                      Students
                    </h4>

                    {members.length ===
                    0 ? (
                      <p className="mt-3 text-sm text-gray-500">
                        No students in this
                        group.
                      </p>
                    ) : (
                      <div className="mt-3 space-y-2">

                        {members.map(
                          (member, index) => (
                            <div
                              key={
                                member.id
                              }
                              className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2"
                            >

                              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold">
                                {index +
                                  1}
                              </div>

                              <div className="text-sm text-gray-700">
                                Student{" "}
                                {index +
                                  1}
                              </div>

                            </div>
                          )
                        )}

                      </div>
                    )}

                  </div>

                  {/* QUESTIONS */}

                  <div className="p-5">

                    <h4 className="text-sm font-semibold text-gray-800">
                      Assigned Questions
                    </h4>

                    {groupQuestions.length ===
                    0 ? (
                      <p className="mt-3 text-sm text-gray-500">
                        No questions assigned.
                      </p>
                    ) : (
                      <div className="mt-3 space-y-2">

                        {groupQuestions.map(
                          (question) => (
                            <div
                              key={
                                question.id
                              }
                              className="bg-purple-50 border border-purple-100 rounded-lg p-3"
                            >

                              <p className="text-sm font-medium text-purple-900">
                                Q
                                {
                                  question.question_number
                                }{" "}
                                —{" "}
                                {
                                  question.title
                                }
                              </p>

                              <p className="mt-1 text-xs text-purple-700">
                                {
                                  question.points
                                }{" "}
                                points
                              </p>

                            </div>
                          )
                        )}

                      </div>
                    )}

                  </div>

                </div>
              )
            })}

          </div>
        )}

      </div>

      {/* ======================================================
          QUESTIONS
          ====================================================== */}

      <div className="mt-10">

        <div className="flex items-center justify-between gap-4">

          <div>

            <h2 className="text-xl font-semibold text-gray-800">
              Questions
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Questions belonging to this
              subsection and their automatic
              group assignment.
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/assignments")
            }
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Manage Questions
          </button>

        </div>

        {questions.length === 0 ? (
          <div className="mt-5 bg-white border border-gray-200 rounded-xl p-8 text-center">

            <div className="text-3xl">
              📝
            </div>

            <h3 className="mt-3 font-semibold text-gray-800">
              No questions yet
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Add questions from the assignment
              management page.
            </p>

          </div>
        ) : (
          <div className="mt-5 space-y-4">

            {questions.map((question) => {

              const assignedGroup =
                questionAssignmentMap.get(
                  question.id
                )

              return (
                <div
                  key={question.id}
                  className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
                >

                  <div className="flex items-start justify-between gap-5">

                    <div className="min-w-0">

                      <div className="flex items-center gap-3 flex-wrap">

                        <span className="text-sm font-semibold text-blue-600">
                          Question{" "}
                          {
                            question.question_number
                          }
                        </span>

                        <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                          {question.points}{" "}
                          points
                        </span>

                        {assignedGroup ? (
                          <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full">
                            Assigned to{" "}
                            {assignedGroup
                              .groups
                              ?.name ||
                              "Group"}
                          </span>
                        ) : (
                          <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2.5 py-1 rounded-full">
                            Not Assigned
                          </span>
                        )}

                      </div>

                      <h3 className="mt-3 text-lg font-semibold text-gray-800">
                        {question.title}
                      </h3>

                      <p className="mt-3 text-gray-600 whitespace-pre-wrap">
                        {question.question_text}
                      </p>

                    </div>

                  </div>

                </div>
              )
            })}

          </div>
        )}

      </div>

    </main>
  )
}

export default AdminAssignmentDetail
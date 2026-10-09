import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { supabase } from "../lib/supabase"

function QuestionWorkspace() {
  const { questionId } = useParams()
  const navigate = useNavigate()

  const [currentUser, setCurrentUser] = useState(null)
  const [currentRole, setCurrentRole] = useState(null)

  const [question, setQuestion] = useState(null)
  const [assignment, setAssignment] = useState(null)
  const [group, setGroup] = useState(null)

  const [answer, setAnswer] = useState("")
  const [submission, setSubmission] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [solutions, setSolutions] = useState([])
  const [reviews, setReviews] = useState([])
  const [sortBy, setSortBy] = useState("reliability")

  const [ratingInputs, setRatingInputs] = useState({})
  const [reviewInputs, setReviewInputs] = useState({})
  const [reviewingSolution, setReviewingSolution] = useState(null)
  const [reviewSubmitting, setReviewSubmitting] = useState(false)

  const [feedbackSubmitting, setFeedbackSubmitting] = useState({})

  // =========================================================
  // REPORTING
  // =========================================================

  const [reports, setReports] = useState([])
  const [reportingSolution, setReportingSolution] = useState(null)
  const [reportReason, setReportReason] = useState("")
  const [reportDescription, setReportDescription] = useState("")
  const [reportSubmitting, setReportSubmitting] = useState(false)

  // =========================================================
  // CHAT
  // =========================================================

  const [messages, setMessages] = useState([])
  const [messageInput, setMessageInput] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)

  // =========================================================
  // PAGE STATE
  // =========================================================

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // =========================================================
  // LOAD EVERYTHING
  // =========================================================

  const fetchWorkspace = async () => {
    // Keep the group resolved during this fetch in a local variable.
    // React state updates such as setGroup() are asynchronous.
    let resolvedGroup = null

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // =====================================================
      // CURRENT USER
      // =====================================================

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setError("Unable to identify the logged-in user.")
        setLoading(false)
        return
      }

      setCurrentUser(user)

      // =====================================================
      // CURRENT USER ROLE
      // =====================================================

      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("id, role, is_active")
        .eq("id", user.id)
        .maybeSingle()

      if (profileError) {
        console.error("Profile error:", profileError)
        setError(profileError.message)
        setLoading(false)
        return
      }

      if (!profileData) {
        setError("User profile not found.")
        setLoading(false)
        return
      }

      if (!profileData.is_active) {
        setError("Your account is inactive.")
        setLoading(false)
        return
      }

      setCurrentRole(profileData.role)

      // =====================================================
      // QUESTION
      //
      // Admin:
      //     can see every question.
      //
      // Student:
      //     can see questions only when enrolled in
      //     the corresponding assignment.
      // =====================================================

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
          assignments (
            id,
            title,
            description,
            assignment_type,
            status,
            week_number,
            deadline
          )
        `)
        .eq("id", questionId)
        .maybeSingle()

      if (questionError) {
        console.error("Question error:", questionError)
        setError(questionError.message)
        setLoading(false)
        return
      }

      // RLS can return no row when a student is not
      // enrolled in the task.
      if (!questionData) {
        setError(
          "You are not enrolled in this task, or this question is unavailable."
        )
        setLoading(false)
        return
      }

      if (
        !questionData.assignments ||
        questionData.assignments.status !== "PUBLISHED"
      ) {
        setError("This question is not currently available.")
        setLoading(false)
        return
      }

      setQuestion(questionData)
      setAssignment(questionData.assignments)

      // =====================================================
      // TASK-SPECIFIC GROUP / ENROLLMENT
      // =====================================================

      if (profileData.role === "ADMIN") {
        // Admin can access every task and does not need
        // task enrollment or student group discussion.
        resolvedGroup = null
        setGroup(null)
      } else {
        const {
          data: taskMembership,
          error: taskMembershipError,
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
          .eq("assignment_id", questionData.assignment_id)
          .eq("user_id", user.id)
          .eq("is_active", true)
          .maybeSingle()

        if (taskMembershipError) {
          console.error(
            "Task membership error:",
            taskMembershipError
          )

          setError(taskMembershipError.message)
          setLoading(false)
          return
        }

        if (!taskMembership) {
          setGroup(null)
          setMessages([])
          setError("You are not enrolled in this task.")
          setLoading(false)
          return
        }

        // ===================================================
        // TASK-SPECIFIC GROUP
        // ===================================================

        const {
          data: taskGroup,
          error: taskGroupError,
        } = await supabase
          .from("groups")
          .select(`
            id,
            name,
            max_members
          `)
          .eq("id", taskMembership.group_id)
          .maybeSingle()

        if (taskGroupError) {
          console.error("Task group error:", taskGroupError)
          setError(taskGroupError.message)
          setLoading(false)
          return
        }

        resolvedGroup = taskGroup || {
          id: taskMembership.group_id,
          name: "My Group",
        }

        setGroup(resolvedGroup)
      }

      // =====================================================
      // CURRENT USER'S LATEST SOLUTION
      // =====================================================

      const {
        data: ownSubmissionData,
        error: ownSubmissionError,
      } = await supabase
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
        .eq("question_id", questionId)
        .eq("submitted_by", user.id)
        .order("version", { ascending: false })
        .limit(1)

      if (ownSubmissionError) {
        console.error("Own submission error:", ownSubmissionError)
        setError(ownSubmissionError.message)
        setLoading(false)
        return
      }

      const ownSubmission = ownSubmissionData?.[0] || null

      setSubmission(ownSubmission)

      if (ownSubmission) {
        setAnswer(ownSubmission.content || "")
      }

      // =====================================================
      // ALL COMMUNITY SOLUTIONS
      // =====================================================

      const {
        data: solutionData,
        error: solutionError,
      } = await supabase
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
          updated_at,
          profiles (
            id,
            full_name,
            email
          )
        `)
        .eq("question_id", questionId)
        .order("created_at", { ascending: false })

      if (solutionError) {
        console.error("Solutions error:", solutionError)
        setError(solutionError.message)
        setLoading(false)
        return
      }

      setSolutions(solutionData || [])

      // =====================================================
      // ALL REVIEWS / FEEDBACK
      // =====================================================

      if (solutionData?.length > 0) {
        const solutionIds = solutionData.map((item) => item.id)

        const {
          data: reviewData,
          error: reviewError,
        } = await supabase
          .from("solution_reviews")
          .select(`
            id,
            submission_id,
            reviewer_id,
            rating,
            review_type,
            comment,
            created_at,
            updated_at,
            profiles (
              id,
              full_name,
              email
            )
          `)
          .in("submission_id", solutionIds)
          .order("created_at", { ascending: false })

        if (reviewError) {
          console.error("Reviews error:", reviewError)
          setError(reviewError.message)
          setLoading(false)
          return
        }

        setReviews(reviewData || [])

        // ===================================================
        // SOLUTION REPORTS
        // ===================================================

        const {
          data: reportData,
          error: reportError,
        } = await supabase
          .from("solution_reports")
          .select(`
            id,
            submission_id,
            reporter_id,
            reason,
            description,
            status,
            admin_note,
            created_at,
            updated_at
          `)
          .in("submission_id", solutionIds)
          .order("created_at", { ascending: false })

        if (reportError) {
          console.error("Reports error:", reportError)
          setError(reportError.message)
          setLoading(false)
          return
        }

        setReports(reportData || [])
      } else {
        setReviews([])
        setReports([])
      }

      // =====================================================
      // TASK-SPECIFIC GROUP CHAT
      // =====================================================

      // Use resolvedGroup, not group state, because setGroup()
      // does not update the current render's state immediately.
      if (resolvedGroup?.id) {
        const {
          data: chatData,
          error: chatError,
        } = await supabase
          .from("question_chat_messages")
          .select(`
            id,
            question_id,
            group_id,
            user_id,
            message,
            created_at,
            profiles (
              id,
              full_name,
              email
            )
          `)
          .eq("question_id", questionId)
          .eq("group_id", resolvedGroup.id)
          .order("created_at", { ascending: true })

        if (chatError) {
          console.error("Chat error:", chatError)

          // Chat failure should not prevent the workspace
          // from loading.
          console.warn(
            "Question workspace loaded, but chat could not be loaded."
          )

          setMessages([])
        } else {
          setMessages(chatData || [])
        }
      } else {
        setMessages([])
      }

      setLoading(false)
    } catch (err) {
      console.error("Workspace error:", err)

      setError(
        "Something went wrong while loading this question."
      )

      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkspace()
  }, [questionId])

  // =========================================================
  // CHAT AUTO REFRESH
  // =========================================================

  useEffect(() => {
    if (!group?.id || !questionId) {
      return
    }

    const refreshMessages = async () => {
      const {
        data,
        error,
      } = await supabase
        .from("question_chat_messages")
        .select(`
          id,
          question_id,
          group_id,
          user_id,
          message,
          created_at,
          profiles (
            id,
            full_name,
            email
          )
        `)
        .eq("question_id", questionId)
        .eq("group_id", group.id)
        .order("created_at", { ascending: true })

      if (!error) {
        setMessages(data || [])
      }
    }

    const interval = setInterval(refreshMessages, 3000)

    return () => clearInterval(interval)
  }, [group?.id, questionId])

  // =========================================================
  // HELPERS
  // =========================================================

  const getUnitLabel = () => {
    if (!assignment) {
      return ""
    }

    if (assignment.assignment_type === "PROJECT") {
      return "Project " + assignment.week_number
    }

    if (assignment.assignment_type === "QUIZ") {
      return "Quiz " + assignment.week_number
    }

    return "Week " + assignment.week_number
  }

  const getReviewsForSolution = (submissionId) => {
    return reviews.filter(
      (review) => review.submission_id === submissionId
    )
  }

  const getRating = (submissionId) => {
    const solutionReviews = getReviewsForSolution(submissionId)

    const ratings = solutionReviews
      .filter((review) => review.review_type === "REVIEW")
      .map((review) => Number(review.rating))
      .filter((rating) => !Number.isNaN(rating))

    if (ratings.length === 0) {
      return {
        average: 0,
        count: 0,
      }
    }

    const total = ratings.reduce(
      (sum, rating) => sum + rating,
      0
    )

    return {
      average: total / ratings.length,
      count: ratings.length,
    }
  }

  const getHelpfulCount = (submissionId) => {
    return getReviewsForSolution(submissionId).filter(
      (review) => review.review_type === "HELPFUL"
    ).length
  }

  const getNotHelpfulCount = (submissionId) => {
    return getReviewsForSolution(submissionId).filter(
      (review) => review.review_type === "NOT_HELPFUL"
    ).length
  }

  const getMyReview = (submissionId) => {
    return reviews.find(
      (review) =>
        review.submission_id === submissionId &&
        review.reviewer_id === currentUser?.id &&
        review.review_type === "REVIEW"
    )
  }

  const getMyHelpfulAction = (submissionId) => {
    return reviews.find(
      (review) =>
        review.submission_id === submissionId &&
        review.reviewer_id === currentUser?.id &&
        (
          review.review_type === "HELPFUL" ||
          review.review_type === "NOT_HELPFUL"
        )
    )
  }

  // =========================================================
  // REPORT HELPERS
  // =========================================================

  const getMyReport = (submissionId) => {
    return reports.find(
      (report) =>
        report.submission_id === submissionId &&
        report.reporter_id === currentUser?.id
    )
  }

  const getReportReasonLabel = (reason) => {
    const labels = {
      INCORRECT: "Incorrect",
      MISLEADING: "Misleading",
      SPAM: "Spam",
      COPIED_PLAGIARIZED: "Copied / Plagiarized",
      INAPPROPRIATE: "Inappropriate",
    }

    return labels[reason] || reason
  }

  // =========================================================
  // RELIABILITY
  // =========================================================

  const getReliabilityScore = (submissionId) => {
    const rating = getRating(submissionId)
    const helpful = getHelpfulCount(submissionId)
    const notHelpful = getNotHelpfulCount(submissionId)

    const totalFeedback = helpful + notHelpful

    if (rating.count === 0 && totalFeedback === 0) {
      return 0
    }

    const ratingScore =
      rating.count > 0 ? rating.average / 5 : 0

    const helpfulScore =
      totalFeedback > 0 ? helpful / totalFeedback : 0

    const totalFeedbackCount = rating.count + totalFeedback

    const confidence = Math.min(totalFeedbackCount / 10, 1)

    return (
      (ratingScore * 0.7 + helpfulScore * 0.3) *
      confidence
    )
  }

  const getReliabilityLabel = (submissionId) => {
    const rating = getRating(submissionId)
    const score = getReliabilityScore(submissionId)

    const feedbackCount =
      rating.count +
      getHelpfulCount(submissionId) +
      getNotHelpfulCount(submissionId)

    if (feedbackCount < 3) {
      return {
        label: "New",
        className: "bg-gray-100 text-gray-600 border-gray-200",
      }
    }

    if (
      rating.count >= 10 &&
      rating.average >= 4.5 &&
      score >= 0.75
    ) {
      return {
        label: "Trusted Solution",
        className: "bg-green-50 text-green-700 border-green-200",
      }
    }

    if (
      rating.count >= 5 &&
      rating.average >= 4 &&
      score >= 0.6
    ) {
      return {
        label: "Highly Rated",
        className: "bg-amber-50 text-amber-700 border-amber-200",
      }
    }

    return {
      label: "Community Rated",
      className: "bg-blue-50 text-blue-700 border-blue-200",
    }
  }

  // =========================================================
  // SORT
  // =========================================================

  const sortedSolutions = useMemo(() => {
    const list = [...solutions]

    if (sortBy === "highest-rated") {
      return list.sort(
        (a, b) =>
          getRating(b.id).average -
          getRating(a.id).average
      )
    }

    if (sortBy === "most-helpful") {
      return list.sort(
        (a, b) =>
          getHelpfulCount(b.id) -
          getHelpfulCount(a.id)
      )
    }

    if (sortBy === "newest") {
      return list.sort(
        (a, b) =>
          new Date(b.created_at) -
          new Date(a.created_at)
      )
    }

    return list.sort(
      (a, b) =>
        getReliabilityScore(b.id) -
        getReliabilityScore(a.id)
    )
  }, [solutions, reviews, sortBy])

  // =========================================================
  // SUBMIT / RESUBMIT SOLUTION
  // =========================================================

  const handleSubmit = async () => {
    const cleanAnswer = answer.trim()

    if (!cleanAnswer) {
      setError("Please write a solution before submitting.")
      return
    }

    if (!currentUser || !question) {
      setError("Required information is unavailable.")
      return
    }

    if (currentRole !== "ADMIN" && !group?.id) {
      setError(
        "You must be enrolled in this task before submitting a solution."
      )
      return
    }

    setSubmitting(true)
    setError("")
    setSuccess("")

    const newVersion = submission
      ? (submission.version || 0) + 1
      : 1

    // =======================================================
    // FIRST SOLUTION
    // =======================================================

    if (!submission) {
      const {
        data,
        error: submissionError,
      } = await supabase
        .from("submissions")
        .insert({
          question_id: question.id,
          group_id: group?.id || null,
          submitted_by: currentUser.id,
          content: cleanAnswer,
          status: "SUBMITTED",
          version: 1,
          submitted_at: new Date().toISOString(),
        })
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
          updated_at,
          profiles (
            id,
            full_name,
            email
          )
        `)
        .single()

      if (submissionError) {
        console.error("Submission error:", submissionError)
        setError(submissionError.message)
        setSubmitting(false)
        return
      }

      setSubmission(data)

      setSolutions((previous) => [
        data,
        ...previous,
      ])

      setAnswer(data.content || "")
      setSuccess("Your solution was submitted successfully.")
      setSubmitting(false)
      return
    }

    // =======================================================
    // RESUBMIT
    // =======================================================

    const {
      data,
      error: updateError,
    } = await supabase
      .from("submissions")
      .update({
        content: cleanAnswer,
        status: "SUBMITTED",
        version: newVersion,
        submitted_at: new Date().toISOString(),
      })
      .eq("id", submission.id)
      .eq("submitted_by", currentUser.id)
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
        updated_at,
        profiles (
          id,
          full_name,
          email
        )
      `)
      .single()

    if (updateError) {
      console.error("Update solution error:", updateError)
      setError(updateError.message)
      setSubmitting(false)
      return
    }

    setSubmission(data)

    setSolutions((previous) =>
      previous.map((item) =>
        item.id === data.id ? data : item
      )
    )

    setAnswer(data.content || "")
    setSuccess("Your solution was updated successfully.")
    setSubmitting(false)
  }

  // =========================================================
  // RATING / WRITTEN REVIEW
  // =========================================================

  const handleReviewSubmit = async (solution) => {
    if (
      !currentUser ||
      solution.submitted_by === currentUser.id
    ) {
      return
    }

    const rating = Number(ratingInputs[solution.id] || 0)
    const comment = (reviewInputs[solution.id] || "").trim()

    if (rating < 1 || rating > 5) {
      setError("Please select a rating between 1 and 5 stars.")
      return
    }

    setReviewSubmitting(true)
    setError("")
    setSuccess("")

    const existingReview = getMyReview(solution.id)

    // =======================================================
    // UPDATE EXISTING REVIEW
    // =======================================================

    if (existingReview) {
      const {
        data,
        error: updateReviewError,
      } = await supabase
        .from("solution_reviews")
        .update({
          rating,
          review_type: "REVIEW",
          comment: comment || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingReview.id)
        .eq("reviewer_id", currentUser.id)
        .select(`
          id,
          submission_id,
          reviewer_id,
          rating,
          review_type,
          comment,
          created_at,
          updated_at,
          profiles (
            id,
            full_name,
            email
          )
        `)
        .single()

      if (updateReviewError) {
        console.error("Update review error:", updateReviewError)
        setError(updateReviewError.message)
        setReviewSubmitting(false)
        return
      }

      setReviews((previous) =>
        previous.map((item) =>
          item.id === data.id ? data : item
        )
      )

      setSuccess("Your review was updated.")
    } else {
      const {
        data,
        error: insertReviewError,
      } = await supabase
        .from("solution_reviews")
        .insert({
          submission_id: solution.id,
          reviewer_id: currentUser.id,
          rating,
          review_type: "REVIEW",
          comment: comment || null,
        })
        .select(`
          id,
          submission_id,
          reviewer_id,
          rating,
          review_type,
          comment,
          created_at,
          updated_at,
          profiles (
            id,
            full_name,
            email
          )
        `)
        .single()

      if (insertReviewError) {
        console.error("Insert review error:", insertReviewError)
        setError(insertReviewError.message)
        setReviewSubmitting(false)
        return
      }

      setReviews((previous) => [
        data,
        ...previous,
      ])

      setSuccess("Your review was added.")
    }

    setReviewingSolution(null)
    setReviewSubmitting(false)
  }

  // =========================================================
  // HELPFUL / NOT HELPFUL
  // =========================================================

  const handleHelpful = async (solution, type) => {
    if (
      !currentUser ||
      solution.submitted_by === currentUser.id
    ) {
      return
    }

    setFeedbackSubmitting((previous) => ({
      ...previous,
      [solution.id]: true,
    }))

    setError("")
    setSuccess("")

    const existingFeedback = getMyHelpfulAction(solution.id)

    if (existingFeedback) {
      if (existingFeedback.review_type === type) {
        setFeedbackSubmitting((previous) => ({
          ...previous,
          [solution.id]: false,
        }))

        return
      }

      const {
        data,
        error: updateFeedbackError,
      } = await supabase
        .from("solution_reviews")
        .update({
          review_type: type,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingFeedback.id)
        .eq("reviewer_id", currentUser.id)
        .select(`
          id,
          submission_id,
          reviewer_id,
          rating,
          review_type,
          comment,
          created_at,
          updated_at,
          profiles (
            id,
            full_name,
            email
          )
        `)
        .single()

      if (updateFeedbackError) {
        console.error("Update feedback error:", updateFeedbackError)
        setError(updateFeedbackError.message)

        setFeedbackSubmitting((previous) => ({
          ...previous,
          [solution.id]: false,
        }))

        return
      }

      setReviews((previous) =>
        previous.map((item) =>
          item.id === data.id ? data : item
        )
      )

      setSuccess(
        type === "HELPFUL"
          ? "Marked as helpful."
          : "Marked as not helpful."
      )

      setFeedbackSubmitting((previous) => ({
        ...previous,
        [solution.id]: false,
      }))

      return
    }

    const {
      data,
      error,
    } = await supabase
      .from("solution_reviews")
      .insert({
        submission_id: solution.id,
        reviewer_id: currentUser.id,
        rating: 1,
        review_type: type,
        comment: null,
      })
      .select(`
        id,
        submission_id,
        reviewer_id,
        rating,
        review_type,
        comment,
        created_at,
        updated_at,
        profiles (
          id,
          full_name,
          email
        )
      `)
      .single()

    if (error) {
      console.error("Helpful action error:", error)
      setError(error.message)

      setFeedbackSubmitting((previous) => ({
        ...previous,
        [solution.id]: false,
      }))

      return
    }

    setReviews((previous) => [
      data,
      ...previous,
    ])

    setSuccess(
      type === "HELPFUL"
        ? "Marked as helpful."
        : "Marked as not helpful."
    )

    setFeedbackSubmitting((previous) => ({
      ...previous,
      [solution.id]: false,
    }))
  }

  // =========================================================
  // REPORT SOLUTION
  // =========================================================

  const openReportForm = (solution) => {
    setReportingSolution(solution.id)
    setReportReason("")
    setReportDescription("")
    setError("")
    setSuccess("")
  }

  const closeReportForm = () => {
    if (reportSubmitting) {
      return
    }

    setReportingSolution(null)
    setReportReason("")
    setReportDescription("")
  }

  const handleReportSubmit = async (solution) => {
    if (
      !currentUser ||
      solution.submitted_by === currentUser.id
    ) {
      return
    }

    if (!reportReason) {
      setError("Please select a reason for reporting this solution.")
      return
    }

    setReportSubmitting(true)
    setError("")
    setSuccess("")

    const existingReport = getMyReport(solution.id)

    if (existingReport) {
      setError("You have already reported this solution.")
      setReportSubmitting(false)
      return
    }

    const {
      data,
      error: reportError,
    } = await supabase
      .from("solution_reports")
      .insert({
        submission_id: solution.id,
        reporter_id: currentUser.id,
        reason: reportReason,
        description: reportDescription.trim() || null,
      })
      .select(`
        id,
        submission_id,
        reporter_id,
        reason,
        description,
        status,
        admin_note,
        created_at,
        updated_at
      `)
      .single()

    if (reportError) {
      console.error("Report solution error:", reportError)

      if (reportError.code === "23505") {
        setError("You have already reported this solution.")
      } else {
        setError(reportError.message)
      }

      setReportSubmitting(false)
      return
    }

    setReports((previous) => [
      data,
      ...previous,
    ])

    setReportingSolution(null)
    setReportReason("")
    setReportDescription("")
    setReportSubmitting(false)

    setSuccess(
      "Solution reported successfully. Thank you for helping keep the community reliable."
    )
  }

  // =========================================================
  // SEND CHAT MESSAGE
  // =========================================================

  const handleSendMessage = async () => {
    const message = messageInput.trim()

    if (!message) {
      return
    }

    if (!currentUser || !group) {
      setError(
        "You must be enrolled in this task to participate in group discussion."
      )
      return
    }

    setSendingMessage(true)
    setError("")
    setSuccess("")

    const {
      data,
      error: chatError,
    } = await supabase
      .from("question_chat_messages")
      .insert({
        question_id: questionId,
        group_id: group.id,
        user_id: currentUser.id,
        message,
      })
      .select(`
        id,
        question_id,
        group_id,
        user_id,
        message,
        created_at,
        profiles (
          id,
          full_name,
          email
        )
      `)
      .single()

    if (chatError) {
      console.error("Chat send error:", chatError)
      setError(chatError.message)
      setSendingMessage(false)
      return
    }

    setMessages((previous) => [
      ...previous,
      data,
    ])

    setMessageInput("")
    setSendingMessage(false)
  }

  // =========================================================
  // LOADING UI
  // =========================================================

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <button
            type="button"
            onClick={() => navigate("/assignments")}
            className="text-sm font-medium text-gray-600 hover:text-blue-600"
          >
            ← Back to Assignments
          </button>

          <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-5 bg-gray-200 rounded w-32" />
              <div className="h-8 bg-gray-200 rounded w-2/3" />
              <div className="h-24 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </main>
    )
  }

  // =========================================================
  // ERROR / QUESTION UNAVAILABLE
  // =========================================================

  if (!question) {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-gray-50">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <button
            type="button"
            onClick={() => navigate("/assignments")}
            className="text-sm font-medium text-blue-600"
          >
            ← Back to Assignments
          </button>

          <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-red-700">
              Question unavailable
            </h2>

            <p className="mt-2 text-sm text-red-600">
              {error || "This question could not be loaded."}
            </p>

            <button
              type="button"
              onClick={() => navigate("/assignments")}
              className="mt-5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
            >
              Go to Assignments
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* BACK */}

        <button
          type="button"
          onClick={() => navigate(`/assignments/${assignment?.id}`)}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition"
        >
          <span className="text-lg">←</span>
          Back to Questions
        </button>

        {/* ERROR */}

        {error && (
          <div className="mt-5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="mt-5 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
            {success}
          </div>
        )}

        {/* ==================================================
            QUESTION HEADER
        ================================================== */}

        <section className="mt-6 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-7">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                    {assignment?.title}
                  </span>

                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                    {getUnitLabel()}
                  </span>

                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-medium">
                    Question {question.question_number}
                  </span>
                </div>

                <h1 className="mt-4 text-3xl font-bold text-gray-900 tracking-tight">
                  {question.title}
                </h1>
              </div>

              <div className="shrink-0 flex flex-col items-end gap-2">
                <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
                  {question.points} points
                </span>

                <span className="text-xs text-gray-400">
                  Community Solutions
                </span>
              </div>
            </div>

            {/* QUESTION */}

            <div className="mt-7 pt-6 border-t border-gray-100">
              <p className="text-sm font-semibold text-gray-700">
                Question
              </p>

              <div className="mt-3 rounded-xl bg-gray-50 border border-gray-200 p-5 text-gray-700 leading-7 whitespace-pre-wrap">
                {question.question_text}
              </div>
            </div>

            {/* STATS */}

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl bg-blue-50 border border-blue-100 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                  Solutions
                </p>

                <p className="mt-1 text-2xl font-bold text-blue-800">
                  {solutions.length}
                </p>
              </div>

              <div className="rounded-xl bg-purple-50 border border-purple-100 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">
                  Reviews
                </p>

                <p className="mt-1 text-2xl font-bold text-purple-800">
                  {
                    reviews.filter(
                      (review) => review.review_type === "REVIEW"
                    ).length
                  }
                </p>
              </div>

              <div className="rounded-xl bg-green-50 border border-green-100 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-green-500">
                  My Group
                </p>

                <p className="mt-1 text-lg font-bold text-green-800 truncate">
                  {group?.name || "Admin Access"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================
            YOUR SOLUTION
        ================================================== */}

        <section className="mt-8 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-7 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {submission ? "Your Solution" : "Submit Your Solution"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {submission
                    ? "You can improve your solution and resubmit it anytime."
                    : "Share your approach with the community."}
                </p>
              </div>

              {submission && (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-200 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Version {submission.version}
                </span>
              )}
            </div>
          </div>

          <div className="p-7">
            <textarea
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              rows={10}
              placeholder="Write your solution here..."
              className="w-full border border-gray-300 rounded-xl px-4 py-4 text-gray-800 leading-7 outline-none resize-y focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-xs text-gray-400">
                {submission?.submitted_at
                  ? `Last submitted: ${new Date(
                      submission.submitted_at
                    ).toLocaleString()}`
                  : "Your solution will be visible to other students after submission."}
              </p>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition shadow-sm"
              >
                {submitting
                  ? "Submitting..."
                  : submission
                  ? "Update Solution"
                  : "Submit Solution"}
              </button>
            </div>
          </div>
        </section>

        {/* ==================================================
            COMMUNITY SOLUTIONS
        ================================================== */}

        <section className="mt-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Community Solutions
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Compare approaches, rate solutions, and help identify reliable answers.
              </p>
            </div>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="border border-gray-300 bg-white rounded-lg px-4 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="reliability">Most Reliable</option>
              <option value="highest-rated">Highest Rated</option>
              <option value="most-helpful">Most Helpful</option>
              <option value="newest">Newest</option>
            </select>
          </div>

          {sortedSolutions.length === 0 ? (
            <div className="mt-5 bg-white border border-gray-200 rounded-2xl p-10 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 flex items-center justify-center">
                <span className="text-2xl">💡</span>
              </div>

              <h3 className="mt-4 text-lg font-semibold text-gray-800">
                No solutions yet
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Be the first student to share a solution.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              {sortedSolutions.map((solution) => {
                const isMine =
                  solution.submitted_by === currentUser?.id

                const rating = getRating(solution.id)
                const helpful = getHelpfulCount(solution.id)
                const notHelpful = getNotHelpfulCount(solution.id)
                const reliability = getReliabilityScore(solution.id)
                const reliabilityInfo = getReliabilityLabel(solution.id)
                const myReview = getMyReview(solution.id)
                const myHelpfulAction = getMyHelpfulAction(solution.id)
                const myReport = getMyReport(solution.id)

                const solutionReviews = getReviewsForSolution(
                  solution.id
                ).filter((review) => review.review_type === "REVIEW")

                const displayName =
                  solution.profiles?.full_name ||
                  solution.profiles?.email ||
                  "Student"

                return (
                  <article
                    key={solution.id}
                    className={`bg-white border rounded-2xl shadow-sm overflow-hidden ${
                      isMine
                        ? "border-blue-300 ring-1 ring-blue-100"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="px-6 py-5 border-b border-gray-100">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="shrink-0 w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                            {displayName.charAt(0).toUpperCase()}
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-gray-900">
                                {isMine ? "You" : displayName}
                              </h3>

                              {isMine && (
                                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-[11px] font-semibold">
                                  Your Solution
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-xs text-gray-400">
                              Version {solution.version || 1}
                              {" · "}
                              {solution.created_at
                                ? new Date(
                                    solution.created_at
                                  ).toLocaleString()
                                : ""}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-full border text-[11px] font-bold ${reliabilityInfo.className}`}
                          >
                            {reliabilityInfo.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="px-6 py-6">
                      <div className="rounded-xl bg-gray-50 border border-gray-200 p-5">
                        <p className="text-sm text-gray-700 leading-7 whitespace-pre-wrap">
                          {solution.content}
                        </p>
                      </div>

                      <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
                          <p className="text-[11px] uppercase tracking-wide font-semibold text-amber-600">
                            Rating
                          </p>

                          <p className="mt-1 text-lg font-bold text-amber-800">
                            {rating.count > 0
                              ? `${rating.average.toFixed(1)}/5`
                              : "No ratings"}
                          </p>

                          {rating.count > 0 && (
                            <p className="text-[11px] text-amber-600">
                              {rating.count} rating
                              {rating.count !== 1 ? "s" : ""}
                            </p>
                          )}
                        </div>

                        <div className="rounded-xl bg-green-50 border border-green-100 px-4 py-3">
                          <p className="text-[11px] uppercase tracking-wide font-semibold text-green-600">
                            Helpful
                          </p>

                          <p className="mt-1 text-lg font-bold text-green-800">
                            {helpful}
                          </p>

                          <p className="text-[11px] text-green-600">
                            {notHelpful} not helpful
                          </p>
                        </div>

                        <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
                          <p className="text-[11px] uppercase tracking-wide font-semibold text-blue-600">
                            Reviews
                          </p>

                          <p className="mt-1 text-lg font-bold text-blue-800">
                            {solutionReviews.length}
                          </p>
                        </div>

                        <div className="rounded-xl bg-purple-50 border border-purple-100 px-4 py-3">
                          <p className="text-[11px] uppercase tracking-wide font-semibold text-purple-600">
                            Reliability
                          </p>

                          <p className="mt-1 text-lg font-bold text-purple-800">
                            {reliability > 0
                              ? `${Math.round(reliability * 100)}%`
                              : "New"}
                          </p>
                        </div>
                      </div>

                      {!isMine && (
                        <div className="mt-5 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleHelpful(solution, "HELPFUL")
                            }
                            disabled={feedbackSubmitting[solution.id]}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition ${
                              myHelpfulAction?.review_type === "HELPFUL"
                                ? "bg-green-100 text-green-700 border-green-200"
                                : "bg-white text-gray-700 border-gray-200 hover:bg-green-50 hover:border-green-200"
                            }`}
                          >
                            👍 Helpful {helpful > 0 && `(${helpful})`}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleHelpful(solution, "NOT_HELPFUL")
                            }
                            disabled={feedbackSubmitting[solution.id]}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition ${
                              myHelpfulAction?.review_type === "NOT_HELPFUL"
                                ? "bg-red-100 text-red-700 border-red-200"
                                : "bg-white text-gray-700 border-gray-200 hover:bg-red-50 hover:border-red-200"
                            }`}
                          >
                            👎 Not Helpful {notHelpful > 0 && `(${notHelpful})`}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setReviewingSolution(solution.id)

                              if (myReview) {
                                setRatingInputs((previous) => ({
                                  ...previous,
                                  [solution.id]: myReview.rating,
                                }))

                                setReviewInputs((previous) => ({
                                  ...previous,
                                  [solution.id]: myReview.comment || "",
                                }))
                              } else {
                                setRatingInputs((previous) => ({
                                  ...previous,
                                  [solution.id]: 0,
                                }))

                                setReviewInputs((previous) => ({
                                  ...previous,
                                  [solution.id]: "",
                                }))
                              }
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition"
                          >
                            ⭐ {myReview ? "Edit Review" : "Rate & Review"}
                          </button>

                          <button
                            type="button"
                            onClick={() => openReportForm(solution)}
                            disabled={Boolean(myReport)}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition ${
                              myReport
                                ? "bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed"
                                : "bg-white text-gray-700 border-gray-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                            }`}
                          >
                            🚩 {myReport ? "Reported" : "Report"}
                          </button>
                        </div>
                      )}

                      {reportingSolution === solution.id &&
                        !isMine &&
                        !myReport && (
                          <div className="mt-5 border border-red-200 bg-red-50/50 rounded-xl p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h4 className="font-semibold text-gray-800">
                                  Report this solution
                                </h4>

                                <p className="mt-1 text-xs text-gray-500">
                                  Report a solution if it contains a serious problem or violates community standards.
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={closeReportForm}
                                disabled={reportSubmitting}
                                className="text-gray-400 hover:text-gray-600 text-xl disabled:cursor-not-allowed"
                              >
                                ×
                              </button>
                            </div>

                            <div className="mt-5">
                              <label className="text-sm font-medium text-gray-700">
                                Reason
                              </label>

                              <select
                                value={reportReason}
                                onChange={(event) =>
                                  setReportReason(event.target.value)
                                }
                                disabled={reportSubmitting}
                                className="mt-2 w-full border border-gray-300 rounded-lg px-4 py-3 text-sm bg-white outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400"
                              >
                                <option value="">Select a reason</option>
                                <option value="INCORRECT">Incorrect</option>
                                <option value="MISLEADING">Misleading</option>
                                <option value="SPAM">Spam</option>
                                <option value="COPIED_PLAGIARIZED">
                                  Copied / Plagiarized
                                </option>
                                <option value="INAPPROPRIATE">
                                  Inappropriate
                                </option>
                              </select>
                            </div>

                            <div className="mt-4">
                              <label className="text-sm font-medium text-gray-700">
                                Additional details{" "}
                                <span className="font-normal text-gray-400">
                                  (optional)
                                </span>
                              </label>

                              <textarea
                                value={reportDescription}
                                onChange={(event) =>
                                  setReportDescription(event.target.value)
                                }
                                disabled={reportSubmitting}
                                rows={4}
                                placeholder="Explain briefly why you think this solution should be reviewed..."
                                className="mt-2 w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none resize-none focus:ring-2 focus:ring-red-400"
                              />
                            </div>

                            <div className="mt-4 flex justify-end gap-3">
                              <button
                                type="button"
                                onClick={closeReportForm}
                                disabled={reportSubmitting}
                                className="px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:bg-gray-100"
                              >
                                Cancel
                              </button>

                              <button
                                type="button"
                                onClick={() => handleReportSubmit(solution)}
                                disabled={reportSubmitting}
                                className="px-5 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:bg-gray-400"
                              >
                                {reportSubmitting
                                  ? "Reporting..."
                                  : "Submit Report"}
                              </button>
                            </div>
                          </div>
                        )}

                      {myReport && (
                        <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-gray-700">
                                You reported this solution
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                Reason: {getReportReasonLabel(myReport.reason)}
                              </p>
                            </div>

                            <span className="inline-flex self-start sm:self-auto px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200 text-[11px] font-semibold">
                              {myReport.status}
                            </span>
                          </div>
                        </div>
                      )}

                      {reviewingSolution === solution.id && !isMine && (
                        <div className="mt-5 border border-blue-200 bg-blue-50/50 rounded-xl p-5">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-800">
                                Review this solution
                              </h4>

                              <p className="text-xs text-gray-500 mt-1">
                                Your feedback helps the community identify reliable solutions.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => setReviewingSolution(null)}
                              className="text-gray-400 hover:text-gray-600 text-xl"
                            >
                              ×
                            </button>
                          </div>

                          <div className="mt-5">
                            <p className="text-sm font-medium text-gray-700">
                              Your Rating
                            </p>

                            <div className="mt-2 flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => {
                                const selected =
                                  Number(ratingInputs[solution.id] || 0) >= star

                                return (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() =>
                                      setRatingInputs((previous) => ({
                                        ...previous,
                                        [solution.id]: star,
                                      }))
                                    }
                                    className={`text-3xl transition ${
                                      selected
                                        ? "text-amber-400"
                                        : "text-gray-300 hover:text-amber-300"
                                    }`}
                                  >
                                    ★
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          <textarea
                            value={reviewInputs[solution.id] || ""}
                            onChange={(event) =>
                              setReviewInputs((previous) => ({
                                ...previous,
                                [solution.id]: event.target.value,
                              }))
                            }
                            rows={4}
                            placeholder="What is correct, useful, or unclear about this solution?"
                            className="mt-4 w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none resize-none focus:ring-2 focus:ring-blue-500"
                          />

                          <div className="mt-4 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleReviewSubmit(solution)}
                              disabled={reviewSubmitting}
                              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:bg-gray-400"
                            >
                              {reviewSubmitting
                                ? "Saving..."
                                : myReview
                                ? "Update Review"
                                : "Submit Review"}
                            </button>
                          </div>
                        </div>
                      )}

                      {solutionReviews.length > 0 && (
                        <div className="mt-6">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-gray-800">
                              Community Reviews
                            </h4>

                            <span className="text-xs text-gray-400">
                              {solutionReviews.length} review
                              {solutionReviews.length !== 1 ? "s" : ""}
                            </span>
                          </div>

                          <div className="mt-3 space-y-3">
                            {solutionReviews.slice(0, 5).map((review) => (
                              <div
                                key={review.id}
                                className="bg-gray-50 border border-gray-100 rounded-xl p-4"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold text-gray-800">
                                      {review.profiles?.full_name ||
                                        review.profiles?.email ||
                                        "Student"}
                                    </p>

                                    <div className="mt-1 flex items-center gap-2">
                                      <span className="text-amber-400 text-sm">
                                        {"★".repeat(Number(review.rating))}
                                      </span>

                                      <span className="text-xs text-gray-400">
                                        {review.rating}/5
                                      </span>
                                    </div>
                                  </div>

                                  <span className="text-[11px] text-gray-400">
                                    {new Date(
                                      review.created_at
                                    ).toLocaleDateString()}
                                  </span>
                                </div>

                                {review.comment && (
                                  <p className="mt-3 text-sm text-gray-600 leading-6">
                                    {review.comment}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        {/* ==================================================
            GROUP DISCUSSION
        ================================================== */}

        <section className="mt-8 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-7 py-5 border-b border-gray-200">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Group Discussion
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Discuss this question with your group.
                </p>
              </div>

              {group && (
                <span className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                  {group.name}
                </span>
              )}
            </div>
          </div>

          <div className="p-6">
            {!group ? (
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-5">
                <h3 className="font-semibold text-blue-900">
                  Admin Access
                </h3>

                <p className="mt-1 text-sm text-blue-800 leading-6">
                  Admins can review this question and its solutions, but do not
                  participate in the student group discussion.
                </p>
              </div>
            ) : (
              <>
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-3xl">💬</div>

                      <p className="mt-2 text-sm text-gray-500">
                        No discussion yet.
                      </p>

                      <p className="text-xs text-gray-400">
                        Start the conversation with your group.
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isMine =
                        message.user_id === currentUser?.id

                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            isMine ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-xl px-4 py-3 ${
                              isMine
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            <p
                              className={`text-xs font-semibold ${
                                isMine
                                  ? "text-blue-100"
                                  : "text-gray-500"
                              }`}
                            >
                              {isMine
                                ? "You"
                                : message.profiles?.full_name ||
                                  "Group member"}
                            </p>

                            <p className="mt-1 text-sm whitespace-pre-wrap leading-6">
                              {message.message}
                            </p>

                            <p
                              className={`mt-1 text-[10px] ${
                                isMine
                                  ? "text-blue-100"
                                  : "text-gray-400"
                              }`}
                            >
                              {new Date(
                                message.created_at
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                <div className="mt-5 flex gap-3">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(event) =>
                      setMessageInput(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        !event.shiftKey
                      ) {
                        event.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    placeholder="Discuss this question with your group..."
                    className="flex-1 border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={sendingMessage}
                    className="px-5 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition"
                  >
                    {sendingMessage ? "Sending..." : "Send"}
                  </button>
                </div>
              </>
            )}
          </div>
        </section>

        <div className="h-10" />
      </div>
    </main>
  )
}

export default QuestionWorkspace
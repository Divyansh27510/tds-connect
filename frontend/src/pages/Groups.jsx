import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

function Groups() {
  const [groups, setGroups] = useState([])
  const [students, setStudents] = useState([])
  const [members, setMembers] = useState([])

  const [name, setName] = useState("")
  const [maxMembers, setMaxMembers] = useState(5)

  const [selectedStudent, setSelectedStudent] = useState("")
  const [selectedGroup, setSelectedGroup] = useState("")

  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [autoAssigning, setAutoAssigning] = useState(false)
  const [creating, setCreating] = useState(false)

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const fetchGroups = async () => {
    const { data, error } = await supabase
      .from("groups")
      .select("id, name, max_members, is_active, created_at")
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching groups:", error)
      setError(error.message)
    } else {
      setGroups(data || [])
    }
  }

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, is_active")
      .eq("role", "STUDENT")
      .eq("is_active", true)
      .order("full_name", { ascending: true })

    if (error) {
      console.error("Error fetching students:", error)
      setError(error.message)
    } else {
      setStudents(data || [])
    }
  }

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from("group_members")
      .select("id, group_id, user_id, joined_at, is_active")
      .eq("is_active", true)
      .order("joined_at", { ascending: true })

    if (error) {
      console.error("Error fetching group members:", error)
      setError(error.message)
    } else {
      setMembers(data || [])
    }
  }

  const loadData = async () => {
    setLoading(true)
    setError("")

    await Promise.all([
      fetchGroups(),
      fetchStudents(),
      fetchMembers(),
    ])

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const createGroup = async (event) => {
    event.preventDefault()

    setError("")
    setSuccess("")

    if (!name.trim()) {
      setError("Please enter a group name.")
      return
    }

    if (Number(maxMembers) < 1) {
      setError("Maximum members must be at least 1.")
      return
    }

    setCreating(true)

    const { error } = await supabase
      .from("groups")
      .insert({
        name: name.trim(),
        max_members: Number(maxMembers),
        is_active: true,
      })

    if (error) {
      console.error("FULL SUPABASE ERROR:", error)
      setError(`Supabase Error: ${error.message}`)
      setCreating(false)
      return
    }

    setName("")
    setMaxMembers(5)
    setCreating(false)

    setSuccess("Group created successfully.")

    await fetchGroups()
  }

  const assignStudent = async (event) => {
    event.preventDefault()

    setError("")
    setSuccess("")

    if (!selectedStudent) {
      setError("Please select a student.")
      return
    }

    if (!selectedGroup) {
      setError("Please select a group.")
      return
    }

    setAssigning(true)

    const { data: existingMember, error: existingError } =
      await supabase
        .from("group_members")
        .select("id, group_id")
        .eq("user_id", selectedStudent)
        .eq("is_active", true)
        .maybeSingle()

    if (existingError) {
      console.error(
        "Error checking existing membership:",
        existingError
      )

      setError(existingError.message)
      setAssigning(false)
      return
    }

    if (existingMember) {
      setError("This student is already assigned to a group.")
      setAssigning(false)
      return
    }

    const selectedGroupData = groups.find(
      (group) => group.id === selectedGroup
    )

    const currentMembers = members.filter(
      (member) => member.group_id === selectedGroup
    ).length

    if (
      selectedGroupData &&
      currentMembers >= selectedGroupData.max_members
    ) {
      setError("This group is already full.")
      setAssigning(false)
      return
    }

    const { error } = await supabase
      .from("group_members")
      .insert({
        group_id: selectedGroup,
        user_id: selectedStudent,
        is_active: true,
      })

    if (error) {
      console.error("FULL SUPABASE ERROR:", error)

      setError(`Supabase Error: ${error.message}`)
      setAssigning(false)
      return
    }

    setSelectedStudent("")
    setSelectedGroup("")
    setAssigning(false)

    setSuccess("Student assigned to group successfully.")

    await fetchMembers()
  }

  const autoAssignStudents = async () => {
    setError("")
    setSuccess("")

    setAutoAssigning(true)

    try {
      const activeGroups = groups
        .filter((group) => group.is_active)
        .map((group) => ({
          ...group,
          currentMembers: members.filter(
            (member) => member.group_id === group.id
          ).length,
        }))

      if (activeGroups.length === 0) {
        setError("No active groups are available.")
        setAutoAssigning(false)
        return
      }

      const assignedUserIds = new Set(
        members.map((member) => member.user_id)
      )

      const unassignedStudents = students.filter(
        (student) => !assignedUserIds.has(student.id)
      )

      if (unassignedStudents.length === 0) {
        setSuccess("All students are already assigned to groups.")
        setAutoAssigning(false)
        return
      }

      const availableCapacity = activeGroups.reduce(
        (total, group) =>
          total +
          Math.max(
            group.max_members - group.currentMembers,
            0
          ),
        0
      )

      if (availableCapacity === 0) {
        setError("All groups are already full.")
        setAutoAssigning(false)
        return
      }

      const studentsToAssign = unassignedStudents.slice(
        0,
        availableCapacity
      )

      const assignments = []

      let groupIndex = 0

      for (const student of studentsToAssign) {
        let assigned = false

        for (
          let attempt = 0;
          attempt < activeGroups.length;
          attempt++
        ) {
          const group =
            activeGroups[
              (groupIndex + attempt) % activeGroups.length
            ]

          if (group.currentMembers < group.max_members) {
            assignments.push({
              group_id: group.id,
              user_id: student.id,
              is_active: true,
            })

            group.currentMembers += 1

            groupIndex =
              (groupIndex + attempt + 1) %
              activeGroups.length

            assigned = true
            break
          }
        }

        if (!assigned) {
          break
        }
      }

      if (assignments.length === 0) {
        setError("No students could be assigned.")
        setAutoAssigning(false)
        return
      }

      const { error } = await supabase
        .from("group_members")
        .insert(assignments)

      if (error) {
        console.error(
          "Automatic assignment error:",
          error
        )

        setError(`Supabase Error: ${error.message}`)
        setAutoAssigning(false)
        return
      }

      const remainingStudents =
        unassignedStudents.length - assignments.length

      if (remainingStudents > 0) {
        setSuccess(
          `${assignments.length} students assigned. ${remainingStudents} students could not be assigned because group capacity is full.`
        )
      } else {
        setSuccess(
          `${assignments.length} students assigned automatically.`
        )
      }

      await fetchMembers()
    } catch (error) {
      console.error(
        "Automatic assignment failed:",
        error
      )

      setError(
        "Something went wrong during automatic assignment."
      )
    }

    setAutoAssigning(false)
  }

  const getStudentName = (userId) => {
    const student = students.find(
      (item) => item.id === userId
    )

    return (
      student?.full_name ||
      student?.email ||
      "Unknown student"
    )
  }

  const getStudentEmail = (userId) => {
    const student = students.find(
      (item) => item.id === userId
    )

    return student?.email || ""
  }

  return (
    <main className="p-8">

      <div>
        <h2 className="text-3xl font-bold text-gray-800">
          Groups
        </h2>

        <p className="mt-2 text-gray-600">
          Create groups and assign students.
        </p>
      </div>

      {error && (
        <div className="mt-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-6 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
          {success}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Create Group */}

        <div className="bg-white rounded-xl shadow-sm p-6">

          <h3 className="text-lg font-semibold text-gray-800">
            Create Group
          </h3>

          <form
            onSubmit={createGroup}
            className="mt-5 space-y-4"
          >

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Group 4"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Members
              </label>

              <input
                type="number"
                min="1"
                value={maxMembers}
                onChange={(event) =>
                  setMaxMembers(event.target.value)
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {creating
                ? "Creating..."
                : "Create Group"}
            </button>

          </form>

        </div>

        {/* Assign Student */}

        <div className="bg-white rounded-xl shadow-sm p-6">

          <h3 className="text-lg font-semibold text-gray-800">
            Assign Student
          </h3>

          <form
            onSubmit={assignStudent}
            className="mt-5 space-y-4"
          >

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student
              </label>

              <select
                value={selectedStudent}
                onChange={(event) =>
                  setSelectedStudent(event.target.value)
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              >

                <option value="">
                  Select student
                </option>

                {students.map((student) => (
                  <option
                    key={student.id}
                    value={student.id}
                  >
                    {student.full_name || student.email}
                  </option>
                ))}

              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group
              </label>

              <select
                value={selectedGroup}
                onChange={(event) =>
                  setSelectedGroup(event.target.value)
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              >

                <option value="">
                  Select group
                </option>

                {groups
                  .filter((group) => group.is_active)
                  .map((group) => (
                    <option
                      key={group.id}
                      value={group.id}
                    >
                      {group.name}
                    </option>
                  ))}

              </select>
            </div>

            <button
              type="submit"
              disabled={assigning}
              className="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {assigning
                ? "Assigning..."
                : "Assign Student"}
            </button>

          </form>

        </div>

      </div>

      {/* Automatic Assignment */}

      <div className="mt-6 bg-white rounded-xl shadow-sm p-6">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Automatic Assignment
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Automatically distribute unassigned students across
              available groups.
            </p>
          </div>

          <button
            type="button"
            onClick={autoAssignStudents}
            disabled={autoAssigning}
            className="bg-purple-600 text-white px-5 py-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
          >
            {autoAssigning
              ? "Assigning..."
              : "Auto Assign Students"}
          </button>

        </div>

      </div>

      {/* Existing Groups */}

      <div className="mt-8 bg-white rounded-xl shadow-sm p-6">

        <h3 className="text-lg font-semibold text-gray-800">
          Existing Groups
        </h3>

        {loading ? (
          <p className="mt-6 text-gray-500">
            Loading groups...
          </p>
        ) : groups.length === 0 ? (
          <p className="mt-6 text-gray-500">
            No groups created yet.
          </p>
        ) : (
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">

            {groups.map((group) => {

              const groupMembers = members.filter(
                (member) =>
                  member.group_id === group.id
              )

              return (
                <div
                  key={group.id}
                  className="border border-gray-200 rounded-lg p-5"
                >

                  <div className="flex items-center justify-between">

                    <div>
                      <h4 className="font-semibold text-gray-800">
                        {group.name}
                      </h4>

                      <p className="text-sm text-gray-500 mt-1">
                        {groupMembers.length} /{" "}
                        {group.max_members} members
                      </p>
                    </div>

                    <span
                      className={`text-xs font-medium px-3 py-1 rounded-full ${
                        group.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {group.is_active
                        ? "Active"
                        : "Inactive"}
                    </span>

                  </div>

                  {groupMembers.length > 0 && (
                    <div className="mt-4 space-y-2">

                      {groupMembers.map((member) => (
                        <div
                          key={member.id}
                          className="bg-gray-50 rounded-lg p-3"
                        >

                          <p className="text-sm font-medium text-gray-800">
                            {getStudentName(member.user_id)}
                          </p>

                          <p className="text-xs text-gray-500 mt-1">
                            {getStudentEmail(member.user_id)}
                          </p>

                        </div>
                      ))}

                    </div>
                  )}

                </div>
              )
            })}

          </div>
        )}

      </div>

    </main>
  )
}

export default Groups
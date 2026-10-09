// import { useLocation } from "react-router-dom"

// function Navbar({ role }) {
//   const location = useLocation()

//   const userName =
//     role === "ADMIN"
//       ? "Divyansh Singh"
//       : "24F3002874 DIVYAN SINGH"

//   const firstLetter =
//     userName.charAt(0).toUpperCase()

//   const getPageTitle = () => {
//     const pathname = location.pathname

//     if (pathname === "/") {
//       return "Dashboard"
//     }

//     if (pathname === "/assignments") {
//       return role === "ADMIN"
//         ? "Assignments Management"
//         : "Assignments"
//     }

//     if (
//       pathname.startsWith(
//         "/assignments/"
//       )
//     ) {
//       return "Task Details"
//     }

//     if (
//       pathname.startsWith(
//         "/questions/"
//       )
//     ) {
//       return "Question Workspace"
//     }

//     if (pathname === "/my-group") {
//       return "My Group"
//     }

//     if (pathname === "/groups") {
//       return "Groups"
//     }

//     if (
//       pathname === "/admin-answers"
//     ) {
//       return "Student Answers"
//     }

//     if (
//       pathname.startsWith(
//         "/admin-answers/"
//       )
//     ) {
//       return "Task Review"
//     }

//     if (pathname === "/class-chat") {
//       return "Class Chat"
//     }

//     return "TDS Connect"
//   }

//   return (
//     <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">

//       <div>
//         <h2 className="text-lg font-semibold text-gray-800">
//           {getPageTitle()}
//         </h2>
//       </div>

//       <div className="flex items-center gap-3">

//         <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
//           {firstLetter}
//         </div>

//         <div>
//           <p className="text-sm font-medium text-gray-800">
//             {userName}
//           </p>

//           <p className="text-xs text-gray-500">
//             {role === "ADMIN"
//               ? "Admin"
//               : "Student"}
//           </p>
//         </div>

//       </div>

//     </header>
//   )
// }

// export default Navbar




import {
  useEffect,
  useRef,
  useState,
} from "react"

import {
  useLocation,
} from "react-router-dom"

// =========================================================
// ICON
// =========================================================

function Icon({
  name,
  className = "h-5 w-5",
}) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  }

  switch (name) {
    case "menu":
      return (
        <svg {...common}>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </svg>
      )

    case "bell":
      return (
        <svg {...common}>
          <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>
      )

    case "chevron":
      return (
        <svg {...common}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      )

    case "logout":
      return (
        <svg {...common}>
          <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
          <path d="m14 8 4 4-4 4" />
          <path d="M18 12H9" />
        </svg>
      )

    case "user":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c.8-3.4 3.1-5 7-5s6.2 1.6 7 5" />
        </svg>
      )

    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      )
  }
}

// =========================================================
// PAGE META
// =========================================================

function getPageMeta(pathname) {
  if (pathname === "/") {
    return {
      title: "Dashboard",
      description: "Your TDS workspace overview",
    }
  }

  if (
    pathname === "/assignments" ||
    pathname.startsWith("/assignments/")
  ) {
    return {
      title: "Assignments",
      description: "Manage and complete your tasks",
    }
  }

  if (
    pathname === "/my-group" ||
    pathname.startsWith("/my-group/")
  ) {
    return {
      title: "My Group",
      description: "Your collaborative workspace",
    }
  }

  if (
    pathname === "/class-chat"
  ) {
    return {
      title: "Class Chat",
      description: "Connect with your TDS class",
    }
  }

  if (
    pathname === "/groups" ||
    pathname.startsWith("/groups/")
  ) {
    return {
      title: "Groups",
      description: "Manage assignment groups",
    }
  }

  if (
    pathname === "/admin-answers" ||
    pathname.startsWith("/admin-answers/")
  ) {
    return {
      title: "Answers",
      description: "Review student submissions",
    }
  }

  if (
    pathname.startsWith("/questions/")
  ) {
    return {
      title: "Question Workspace",
      description: "Solve and collaborate",
    }
  }

  if (
    pathname.startsWith("/admin/assignments/")
  ) {
    return {
      title: "Assignment Details",
      description: "Assignment management",
    }
  }

  return {
    title: "TDS Connect",
    description: "IIT Madras Data Science workspace",
  }
}

// =========================================================
// NAVBAR
// =========================================================

function Navbar({
  role,
  user,
  onLogout,
  onMenuClick = () => {},
}) {
  const location = useLocation()

  const [profileOpen, setProfileOpen] =
    useState(false)

  const profileRef = useRef(null)

  const page =
    getPageMeta(location.pathname)

  // -------------------------------------------------------
  // Close dropdown outside
  // -------------------------------------------------------

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(
          event.target
        )
      ) {
        setProfileOpen(false)
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    )

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      )
    }
  }, [])

  // -------------------------------------------------------
  // Initials
  // -------------------------------------------------------

  const getInitials = () => {
    const name =
      user?.user_metadata?.full_name ||
      user?.email ||
      "TDS"

    const parts = name
      .trim()
      .split(/\s+/)

    if (parts.length >= 2) {
      return (
        parts[0][0] +
        parts[parts.length - 1][0]
      ).toUpperCase()
    }

    return name
      .slice(0, 2)
      .toUpperCase()
  }

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "TDS User"

  return (
    <header
      className="
        sticky
        top-0
        z-30
        border-b
        border-slate-200
        bg-white/90
        backdrop-blur-xl
      "
    >

      <div
        className="
          flex
          h-[76px]
          items-center
          justify-between
          gap-4
          px-4
          sm:px-6
          lg:px-8
        "
      >

        {/* =================================================
            LEFT
        ================================================== */}

        <div className="flex min-w-0 items-center gap-3">

          {/* Mobile menu */}

          <button
            type="button"
            onClick={onMenuClick}
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              border-slate-200
              bg-white
              text-slate-500
              shadow-sm
              transition-all
              duration-200
              hover:border-indigo-200
              hover:bg-indigo-50
              hover:text-indigo-600
              lg:hidden
            "
            aria-label="Open navigation"
          >
            <Icon
              name="menu"
              className="h-5 w-5"
            />
          </button>

          <div className="min-w-0">

            <div className="flex items-center gap-2">

              <h1 className="truncate text-lg font-bold tracking-tight text-slate-950 sm:text-xl">
                {page.title}
              </h1>

              {role === "ADMIN" && (
                <span
                  className="
                    hidden
                    rounded-full
                    border
                    border-violet-100
                    bg-violet-50
                    px-2
                    py-0.5
                    text-[9px]
                    font-bold
                    uppercase
                    tracking-wide
                    text-violet-600
                    sm:inline-flex
                  "
                >
                  Admin
                </span>
              )}

            </div>

            <p className="hidden truncate text-xs text-slate-400 sm:block">
              {page.description}
            </p>

          </div>

        </div>

        {/* =================================================
            RIGHT
        ================================================== */}

        <div className="flex items-center gap-2 sm:gap-3">

          {/* Status */}

          <div
            className="
              hidden
              items-center
              gap-2
              rounded-full
              border
              border-emerald-100
              bg-emerald-50
              px-3
              py-1.5
              md:flex
            "
          >
            <span className="relative flex h-2 w-2">

              <span
                className="
                  absolute
                  inline-flex
                  h-full
                  w-full
                  animate-ping
                  rounded-full
                  bg-emerald-400
                  opacity-60
                "
              />

              <span
                className="
                  relative
                  inline-flex
                  h-2
                  w-2
                  rounded-full
                  bg-emerald-500
                "
              />

            </span>

            <span className="text-[10px] font-semibold text-emerald-700">
              Online
            </span>
          </div>

          {/* Notification */}

          <button
            type="button"
            className="
              relative
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              border
              border-transparent
              text-slate-400
              transition-all
              duration-200
              hover:border-slate-200
              hover:bg-slate-50
              hover:text-slate-700
            "
            aria-label="Notifications"
          >
            <Icon
              name="bell"
              className="h-[19px] w-[19px]"
            />

            <span
              className="
                absolute
                right-2.5
                top-2
                h-1.5
                w-1.5
                rounded-full
                bg-indigo-500
                ring-2
                ring-white
              "
            />
          </button>

          {/* Divider */}

          <div className="hidden h-8 w-px bg-slate-200 sm:block" />

          {/* =================================================
              PROFILE
          ================================================== */}

          <div
            ref={profileRef}
            className="relative"
          >

            <button
              type="button"
              onClick={() =>
                setProfileOpen(
                  (value) => !value
                )
              }
              className="
                group
                flex
                items-center
                gap-2
                rounded-xl
                p-1.5
                transition-all
                duration-200
                hover:bg-slate-50
              "
            >

              <div
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-xl
                  bg-indigo-600
                  text-xs
                  font-bold
                  text-white
                  shadow-sm
                  transition-transform
                  duration-200
                  group-hover:scale-105
                "
              >
                {getInitials()}
              </div>

              <div className="hidden max-w-[150px] text-left sm:block">

                <p className="truncate text-xs font-semibold text-slate-800">
                  {displayName}
                </p>

                <p className="mt-0.5 truncate text-[10px] text-slate-400">
                  {role === "ADMIN"
                    ? "Administrator"
                    : "Student"}
                </p>

              </div>

              <Icon
                name="chevron"
                className={`
                  hidden
                  h-4
                  w-4
                  text-slate-400
                  transition-transform
                  duration-200
                  sm:block
                  ${
                    profileOpen
                      ? "rotate-180"
                      : ""
                  }
                `}
              />

            </button>

            {/* =================================================
                DROPDOWN
            ================================================== */}

            {profileOpen && (
              <div
                className="
                  absolute
                  right-0
                  top-[calc(100%+10px)]
                  w-72
                  origin-top-right
                  animate-[profileDrop_0.18s_ease-out]
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  p-2
                  shadow-2xl
                  shadow-slate-900/10
                "
              >

                {/* Account header */}

                <div className="rounded-xl bg-slate-50 p-3">

                  <div className="flex items-center gap-3">

                    <div
                      className="
                        flex
                        h-10
                        w-10
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        bg-indigo-600
                        text-xs
                        font-bold
                        text-white
                      "
                    >
                      {getInitials()}
                    </div>

                    <div className="min-w-0">

                      <p className="truncate text-sm font-semibold text-slate-900">
                        {displayName}
                      </p>

                      <p className="mt-0.5 truncate text-[11px] text-slate-400">
                        {user?.email}
                      </p>

                    </div>

                  </div>

                  <div className="mt-3 flex items-center justify-between">

                    <span className="text-[10px] font-medium text-slate-400">
                      Account type
                    </span>

                    <span
                      className={`
                        rounded-full
                        px-2.5
                        py-1
                        text-[9px]
                        font-bold
                        uppercase
                        tracking-wide
                        ${
                          role === "ADMIN"
                            ? "bg-violet-100 text-violet-700"
                            : "bg-indigo-100 text-indigo-700"
                        }
                      `}
                    >
                      {role || "USER"}
                    </span>

                  </div>

                </div>

                {/* Logout */}

                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false)
                    onLogout()
                  }}
                  className="
                    mt-2
                    flex
                    w-full
                    items-center
                    gap-3
                    rounded-xl
                    px-3
                    py-2.5
                    text-left
                    text-sm
                    font-medium
                    text-slate-600
                    transition-colors
                    hover:bg-red-50
                    hover:text-red-600
                  "
                >
                  <span
                    className="
                      flex
                      h-8
                      w-8
                      items-center
                      justify-center
                      rounded-lg
                      bg-slate-100
                    "
                  >
                    <Icon
                      name="logout"
                      className="h-4 w-4"
                    />
                  </span>

                  <span>
                    Sign out
                  </span>
                </button>

              </div>
            )}

          </div>

        </div>

      </div>

      <style>{`
        @keyframes profileDrop {
          from {
            opacity: 0;
            transform: translateY(-4px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

    </header>
  )
}

export default Navbar
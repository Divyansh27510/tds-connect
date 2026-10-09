// import {
//   useEffect,
// } from "react"

// import {
//   Link,
//   useLocation,
// } from "react-router-dom"

// // =========================================================
// // ICONS
// // =========================================================

// function Icon({
//   name,
//   className = "h-5 w-5",
// }) {
//   const common = {
//     className,
//     viewBox: "0 0 24 24",
//     fill: "none",
//     stroke: "currentColor",
//     strokeWidth: "1.8",
//     strokeLinecap: "round",
//     strokeLinejoin: "round",
//     "aria-hidden": true,
//   }

//   switch (name) {
//     case "dashboard":
//       return (
//         <svg {...common}>
//           <rect x="3" y="3" width="7" height="7" rx="1.5" />
//           <rect x="14" y="3" width="7" height="7" rx="1.5" />
//           <rect x="3" y="14" width="7" height="7" rx="1.5" />
//           <rect x="14" y="14" width="7" height="7" rx="1.5" />
//         </svg>
//       )

//     case "assignments":
//       return (
//         <svg {...common}>
//           <path d="M8 3.5h8" />
//           <path d="M9 3.5a2 2 0 0 0-2 2v.5h10v-.5a2 2 0 0 0-2-2" />
//           <rect x="4" y="6" width="16" height="15" rx="2.5" />
//           <path d="M8 11h8" />
//           <path d="M8 15h5" />
//         </svg>
//       )

//     case "group":
//       return (
//         <svg {...common}>
//           <circle cx="9" cy="8" r="3" />
//           <circle cx="17" cy="9" r="2.5" />
//           <path d="M3.5 19c.6-3.2 2.4-5 5.5-5s4.9 1.8 5.5 5" />
//           <path d="M14.5 14.5c2.8-.1 4.8 1.4 5.5 4.5" />
//         </svg>
//       )

//     case "chat":
//       return (
//         <svg {...common}>
//           <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H8l-4 2 1.5-4.1A7.5 7.5 0 1 1 20 11.5Z" />
//           <path d="M8 11h.01" />
//           <path d="M12 11h.01" />
//           <path d="M16 11h.01" />
//         </svg>
//       )

//     case "answers":
//       return (
//         <svg {...common}>
//           <path d="M6 4h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H11l-5 3v-3.5A2 2 0 0 1 4 14V6a2 2 0 0 1 2-2Z" />
//           <path d="M8 8h8" />
//           <path d="M8 12h5" />
//         </svg>
//       )

//     case "close":
//       return (
//         <svg {...common}>
//           <path d="m6 6 12 12" />
//           <path d="M18 6 6 18" />
//         </svg>
//       )

//     case "logout":
//       return (
//         <svg {...common}>
//           <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
//           <path d="m14 8 4 4-4 4" />
//           <path d="M18 12H9" />
//         </svg>
//       )

//     case "chevron":
//       return (
//         <svg {...common}>
//           <path d="m9 18 6-6-6-6" />
//         </svg>
//       )

//     default:
//       return (
//         <svg {...common}>
//           <circle cx="12" cy="12" r="8" />
//         </svg>
//       )
//   }
// }

// // =========================================================
// // NAVIGATION CONFIG
// // =========================================================

// const studentNavigation = [
//   {
//     label: "Overview",
//     items: [
//       {
//         label: "Dashboard",
//         path: "/",
//         icon: "dashboard",
//       },
//     ],
//   },
//   {
//     label: "Workspace",
//     items: [
//       {
//         label: "Assignments",
//         path: "/assignments",
//         icon: "assignments",
//       },
//       {
//         label: "My Group",
//         path: "/my-group",
//         icon: "group",
//       },
//       {
//         label: "Class Chat",
//         path: "/class-chat",
//         icon: "chat",
//       },
//     ],
//   },
// ]

// const adminNavigation = [
//   {
//     label: "Overview",
//     items: [
//       {
//         label: "Dashboard",
//         path: "/",
//         icon: "dashboard",
//       },
//     ],
//   },
//   {
//     label: "Management",
//     items: [
//       {
//         label: "Assignments",
//         path: "/assignments",
//         icon: "assignments",
//       },
//       {
//         label: "Groups",
//         path: "/groups",
//         icon: "group",
//       },
//       {
//         label: "Answers",
//         path: "/admin-answers",
//         icon: "answers",
//       },
//       {
//         label: "Class Chat",
//         path: "/class-chat",
//         icon: "chat",
//       },
//     ],
//   },
// ]

// // =========================================================
// // SIDEBAR
// // =========================================================

// function Sidebar({
//   role,
//   open = false,
//   onClose = () => {},
//   user = null,
//   onLogout = () => {},
// }) {
//   const location = useLocation()

//   const navigation =
//     role === "ADMIN"
//       ? adminNavigation
//       : studentNavigation

//   // -------------------------------------------------------
//   // Close mobile sidebar on route change
//   // -------------------------------------------------------

//   useEffect(() => {
//     onClose()
//   }, [location.pathname])

//   // -------------------------------------------------------
//   // Active route
//   // -------------------------------------------------------

//   const isActive = (path) => {
//     if (path === "/") {
//       return location.pathname === "/"
//     }

//     return (
//       location.pathname === path ||
//       location.pathname.startsWith(
//         `${path}/`
//       )
//     )
//   }

//   // -------------------------------------------------------
//   // User initials
//   // -------------------------------------------------------

//   const getInitials = () => {
//     const name =
//       user?.user_metadata?.full_name ||
//       user?.email ||
//       "TDS"

//     const parts = name
//       .trim()
//       .split(/\s+/)

//     if (parts.length >= 2) {
//       return (
//         parts[0][0] +
//         parts[parts.length - 1][0]
//       ).toUpperCase()
//     }

//     return name
//       .slice(0, 2)
//       .toUpperCase()
//   }

//   return (
//     <>
//       {/* ==================================================
//           MOBILE OVERLAY
//       ================================================== */}

//       <div
//         className={`
//           fixed
//           inset-0
//           z-40
//           bg-slate-950/30
//           backdrop-blur-[2px]
//           transition-opacity
//           duration-300
//           lg:hidden
//           ${
//             open
//               ? "pointer-events-auto opacity-100"
//               : "pointer-events-none opacity-0"
//           }
//         `}
//         onClick={onClose}
//       />

//       {/* ==================================================
//           SIDEBAR
//       ================================================== */}

//       <aside
//         className={`
//           fixed
//           inset-y-0
//           left-0
//           z-50
//           flex
//           w-[272px]
//           flex-col
//           border-r
//           border-slate-200
//           bg-white
//           shadow-xl
//           shadow-slate-900/5
//           transition-transform
//           duration-300
//           ease-out
//           lg:translate-x-0
//           lg:shadow-none
//           ${
//             open
//               ? "translate-x-0"
//               : "-translate-x-full"
//           }
//         `}
//       >

//         {/* =================================================
//             BRAND
//         ================================================= */}

//         <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-slate-100 px-5">

//           <Link
//             to="/"
//             className="group flex items-center gap-3"
//           >

//             <div
//               className="
//                 relative
//                 flex
//                 h-10
//                 w-10
//                 items-center
//                 justify-center
//                 overflow-hidden
//                 rounded-xl
//                 bg-indigo-600
//                 text-sm
//                 font-bold
//                 text-white
//                 shadow-lg
//                 shadow-indigo-200
//                 transition-transform
//                 duration-300
//                 group-hover:scale-105
//               "
//             >
//               T

//               <span
//                 className="
//                   absolute
//                   -right-3
//                   -top-3
//                   h-7
//                   w-7
//                   rounded-full
//                   bg-white/20
//                 "
//               />
//             </div>

//             <div>
//               <p className="text-[15px] font-bold tracking-tight text-slate-950">
//                 TDS Connect
//               </p>

//               <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">
//                 IIT Madras
//               </p>
//             </div>

//           </Link>

//           {/* Mobile close */}

//           <button
//             type="button"
//             onClick={onClose}
//             className="
//               flex
//               h-9
//               w-9
//               items-center
//               justify-center
//               rounded-xl
//               text-slate-400
//               transition-colors
//               hover:bg-slate-100
//               hover:text-slate-700
//               lg:hidden
//             "
//             aria-label="Close navigation"
//           >
//             <Icon
//               name="close"
//               className="h-5 w-5"
//             />
//           </button>

//         </div>

//         {/* =================================================
//             NAVIGATION
//         ================================================= */}

//         <nav className="flex-1 overflow-y-auto px-3 py-5">

//           {navigation.map((section) => (
//             <div
//               key={section.label}
//               className="mb-7 last:mb-0"
//             >

//               <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
//                 {section.label}
//               </p>

//               <div className="space-y-1">

//                 {section.items.map((item) => {
//                   const active =
//                     isActive(item.path)

//                   return (
//                     <Link
//                       key={item.path}
//                       to={item.path}
//                       className={`
//                         group
//                         relative
//                         flex
//                         items-center
//                         gap-3
//                         rounded-xl
//                         px-3
//                         py-2.5
//                         text-sm
//                         font-medium
//                         transition-all
//                         duration-200
//                         ${
//                           active
//                             ? "bg-indigo-50 text-indigo-700"
//                             : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
//                         }
//                       `}
//                     >

//                       {/* active indicator */}

//                       {active && (
//                         <span
//                           className="
//                             absolute
//                             -left-3
//                             top-1/2
//                             h-6
//                             w-1
//                             -translate-y-1/2
//                             rounded-r-full
//                             bg-indigo-600
//                           "
//                         />
//                       )}

//                       <span
//                         className={`
//                           flex
//                           h-9
//                           w-9
//                           shrink-0
//                           items-center
//                           justify-center
//                           rounded-lg
//                           transition-all
//                           duration-200
//                           ${
//                             active
//                               ? "bg-white text-indigo-600 shadow-sm"
//                               : "bg-transparent text-slate-400 group-hover:bg-white group-hover:text-slate-700"
//                           }
//                         `}
//                       >
//                         <Icon
//                           name={item.icon}
//                           className="h-[18px] w-[18px]"
//                         />
//                       </span>

//                       <span className="flex-1">
//                         {item.label}
//                       </span>

//                       {active && (
//                         <Icon
//                           name="chevron"
//                           className="h-4 w-4 text-indigo-400"
//                         />
//                       )}

//                     </Link>
//                   )
//                 })}

//               </div>

//             </div>
//           ))}

//         </nav>

//         {/* =================================================
//             USER AREA
//         ================================================= */}

//         <div className="shrink-0 border-t border-slate-100 p-3">

//           <div
//             className="
//               rounded-2xl
//               bg-slate-50
//               p-3
//             "
//           >

//             <div className="flex items-center gap-3">

//               <div
//                 className="
//                   flex
//                   h-9
//                   w-9
//                   shrink-0
//                   items-center
//                   justify-center
//                   rounded-xl
//                   bg-indigo-600
//                   text-xs
//                   font-bold
//                   text-white
//                 "
//               >
//                 {getInitials()}
//               </div>

//               <div className="min-w-0 flex-1">

//                 <p className="truncate text-xs font-semibold text-slate-800">
//                   {user?.user_metadata?.full_name ||
//                     user?.email ||
//                     "TDS User"}
//                 </p>

//                 <div className="mt-1 flex items-center gap-1.5">

//                   <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

//                   <span className="text-[10px] font-medium text-slate-400">
//                     {role === "ADMIN"
//                       ? "Administrator"
//                       : "Student"}
//                   </span>

//                 </div>

//               </div>

//               <button
//                 type="button"
//                 onClick={onLogout}
//                 title="Logout"
//                 className="
//                   flex
//                   h-8
//                   w-8
//                   shrink-0
//                   items-center
//                   justify-center
//                   rounded-lg
//                   text-slate-400
//                   transition-all
//                   duration-200
//                   hover:bg-red-50
//                   hover:text-red-600
//                 "
//               >
//                 <Icon
//                   name="logout"
//                   className="h-4 w-4"
//                 />
//               </button>

//             </div>

//           </div>

//           <p className="px-2 pt-3 text-center text-[9px] font-medium tracking-wide text-slate-300">
//             TDS CONNECT • v1.0
//           </p>

//         </div>

//       </aside>
//     </>
//   )
// }

// export default Sidebar






import {
  useEffect,
} from "react"

import {
  Link,
  useLocation,
} from "react-router-dom"

// =========================================================
// ICONS
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
    case "dashboard":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      )

    case "assignments":
      return (
        <svg {...common}>
          <path d="M8 3.5h8" />
          <path d="M9 3.5a2 2 0 0 0-2 2v.5h10v-.5a2 2 0 0 0-2-2" />
          <rect x="4" y="6" width="16" height="15" rx="2.5" />
          <path d="M8 11h8" />
          <path d="M8 15h5" />
        </svg>
      )

    case "group":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M3.5 19c.6-3.2 2.4-5 5.5-5s4.9 1.8 5.5 5" />
          <path d="M14.5 14.5c2.8-.1 4.8 1.4 5.5 4.5" />
        </svg>
      )

    case "chat":
      return (
        <svg {...common}>
          <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H8l-4 2 1.5-4.1A7.5 7.5 0 1 1 20 11.5Z" />
          <path d="M8 11h.01" />
          <path d="M12 11h.01" />
          <path d="M16 11h.01" />
        </svg>
      )

    case "answers":
      return (
        <svg {...common}>
          <path d="M6 4h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H11l-5 3v-3.5A2 2 0 0 1 4 14V6a2 2 0 0 1 2-2Z" />
          <path d="M8 8h8" />
          <path d="M8 12h5" />
        </svg>
      )

    case "close":
      return (
        <svg {...common}>
          <path d="m6 6 12 12" />
          <path d="M18 6 6 18" />
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

    case "chevron":
      return (
        <svg {...common}>
          <path d="m9 18 6-6-6-6" />
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
// NAVIGATION CONFIG
// =========================================================

const studentNavigation = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        path: "/",
        icon: "dashboard",
      },
    ],
  },
  {
    label: "Workspace",
    items: [
      {
        label: "Assignments",
        path: "/assignments",
        icon: "assignments",
      },
      {
        label: "My Group",
        path: "/my-group",
        icon: "group",
      },
      {
        label: "Class Chat",
        path: "/class-chat",
        icon: "chat",
      },
    ],
  },
]

const adminNavigation = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        path: "/",
        icon: "dashboard",
      },
    ],
  },
  {
    label: "Management",
    items: [
      {
        label: "Assignments",
        path: "/assignments",
        icon: "assignments",
      },
      {
        label: "Groups",
        path: "/groups",
        icon: "group",
      },
      {
        label: "Answers",
        path: "/admin-answers",
        icon: "answers",
      },
      {
        label: "Class Chat",
        path: "/class-chat",
        icon: "chat",
      },
    ],
  },
]

// =========================================================
// SIDEBAR
// =========================================================

function Sidebar({
  role,
  open = false,
  onClose = () => {},
  user = null,
  onLogout = () => {},
}) {
  const location = useLocation()

  const navigation =
    role === "ADMIN"
      ? adminNavigation
      : studentNavigation

  // -------------------------------------------------------
  // Close mobile sidebar on route change
  // -------------------------------------------------------

  useEffect(() => {
    onClose()
  }, [location.pathname])

  // -------------------------------------------------------
  // Active route
  // -------------------------------------------------------

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/"
    }

    return (
      location.pathname === path ||
      location.pathname.startsWith(
        `${path}/`
      )
    )
  }

  // -------------------------------------------------------
  // User initials
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

  return (
    <>
      {/* ==================================================
          MOBILE OVERLAY
      ================================================== */}

      <div
        className={`
          fixed
          inset-0
          z-40
          bg-slate-950/40
          backdrop-blur-xs
          transition-opacity
          duration-300
          lg:hidden
          ${
            open
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
          }
        `}
        onClick={onClose}
      />

      {/* ==================================================
          SIDEBAR
      ================================================== */}

      <aside
        className={`
          fixed
          inset-y-0
          left-0
          z-50
          flex
          w-[272px]
          flex-col
          border-r
          border-slate-200/80
          bg-white/95
          backdrop-blur-xl
          shadow-2xl
          shadow-slate-900/10
          transition-transform
          duration-300
          ease-out
          lg:translate-x-0
          lg:shadow-none
          ${
            open
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >

        {/* =================================================
            BRAND
        ================================================= */}

        <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-slate-100 px-5">

          <Link
            to="/"
            className="group flex items-center gap-3"
          >

            <div
              className="
                relative
                flex
                h-10
                w-10
                items-center
                justify-center
                overflow-hidden
                rounded-xl
                bg-gradient-to-br
                from-indigo-600
                to-violet-600
                text-sm
                font-black
                text-white
                shadow-md
                shadow-indigo-500/30
                transition-transform
                duration-300
                group-hover:scale-105
              "
            >
              T

              <span
                className="
                  absolute
                  -right-3
                  -top-3
                  h-7
                  w-7
                  rounded-full
                  bg-white/20
                "
              />
            </div>

            <div>
              <p className="text-[15px] font-extrabold tracking-tight text-slate-950 group-hover:text-indigo-600 transition-colors">
                TDS Connect
              </p>

              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Divyansh Singh
              </p>
            </div>

          </Link>

          {/* Mobile close */}

          <button
            type="button"
            onClick={onClose}
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-xl
              text-slate-400
              transition-all
              duration-200
              hover:bg-slate-100
              hover:text-slate-700
              lg:hidden
            "
            aria-label="Close navigation"
          >
            <Icon
              name="close"
              className="h-5 w-5"
            />
          </button>

        </div>

        {/* =================================================
            NAVIGATION
        ================================================== */}

        <nav className="flex-1 overflow-y-auto px-3 py-5">

          {navigation.map((section) => (
            <div
              key={section.label}
              className="mb-7 last:mb-0"
            >

              <p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
                {section.label}
              </p>

              <div className="space-y-1.5">

                {section.items.map((item) => {
                  const active =
                    isActive(item.path)

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`
                        group
                        relative
                        flex
                        items-center
                        gap-3
                        rounded-xl
                        px-3
                        py-2.5
                        text-sm
                        font-semibold
                        transition-all
                        duration-300
                        ${
                          active
                            ? "bg-indigo-50/90 text-indigo-700 shadow-xs"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                        }
                      `}
                    >

                      {/* active indicator */}

                      {active && (
                        <span
                          className="
                            absolute
                            -left-3
                            top-1/2
                            h-6
                            w-1
                            -translate-y-1/2
                            rounded-r-full
                            bg-indigo-600
                            shadow-xs
                          "
                        />
                      )}

                      <span
                        className={`
                          flex
                          h-9
                          w-9
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl
                          transition-all
                          duration-300
                          ${
                            active
                              ? "bg-white text-indigo-600 shadow-sm border border-indigo-100"
                              : "bg-transparent text-slate-400 group-hover:bg-white group-hover:text-slate-700 group-hover:shadow-xs group-hover:scale-105"
                          }
                        `}
                      >
                        <Icon
                          name={item.icon}
                          className="h-[18px] w-[18px]"
                        />
                      </span>

                      <span className="flex-1">
                        {item.label}
                      </span>

                      {active && (
                        <Icon
                          name="chevron"
                          className="h-4 w-4 text-indigo-400 animate-pulse"
                        />
                      )}

                    </Link>
                  )
                })}

              </div>

            </div>
          ))}

        </nav>

        {/* =================================================
            USER AREA
        ================================================== */}

        <div className="shrink-0 border-t border-slate-100 p-3">

          <div
            className="
              rounded-2xl
              bg-slate-50/80
              border
              border-slate-100
              p-3
              transition-all
              duration-200
              hover:bg-slate-100/70
            "
          >

            <div className="flex items-center gap-3">

              <div
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-gradient-to-br
                  from-indigo-600
                  to-violet-600
                  text-xs
                  font-bold
                  text-white
                  shadow-xs
                "
              >
                {getInitials()}
              </div>

              <div className="min-w-0 flex-1">

                <p className="truncate text-xs font-bold text-slate-900">
                  {user?.user_metadata?.full_name ||
                    user?.email ||
                    "TDS User"}
                </p>

                <div className="mt-1 flex items-center gap-1.5">

                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />

                  <span className="text-[10px] font-semibold text-slate-400">
                    {role === "ADMIN"
                      ? "Administrator"
                      : "Student"}
                  </span>

                </div>

              </div>

              <button
                type="button"
                onClick={onLogout}
                title="Logout"
                className="
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  text-slate-400
                  transition-all
                  duration-200
                  hover:bg-red-50
                  hover:text-red-600
                  active:scale-95
                "
              >
                <Icon
                  name="logout"
                  className="h-4 w-4"
                />
              </button>

            </div>

          </div>

          <p className="px-2 pt-3 text-center text-[9px] font-bold tracking-wider text-slate-300">
            TDS CONNECT • v1.0
          </p>

        </div>

      </aside>
    </>
  )
}

export default Sidebar
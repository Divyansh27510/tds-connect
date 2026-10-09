// import { useEffect, useRef, useState } from "react"
// import { supabase } from "../lib/supabase"

// function ClassChat() {
//   const [user, setUser] = useState(null)
//   const [profile, setProfile] = useState(null)

//   const [messages, setMessages] = useState([])
//   const [message, setMessage] = useState("")

//   const [loading, setLoading] = useState(true)
//   const [sending, setSending] = useState(false)

//   const messagesEndRef = useRef(null)

//   // --------------------------------------------------
//   // INITIAL LOAD
//   // --------------------------------------------------

//   useEffect(() => {
//     initializeChat()
//   }, [])

//   async function initializeChat() {
//     try {
//       setLoading(true)

//       const {
//         data: { user: currentUser },
//         error: userError,
//       } = await supabase.auth.getUser()

//       if (userError) {
//         throw userError
//       }

//       if (!currentUser) {
//         return
//       }

//       setUser(currentUser)

//       // ----------------------------------------------
//       // PROFILE
//       // ----------------------------------------------

//       const { data: currentProfile, error: profileError } =
//         await supabase
//           .from("profiles")
//           .select("id, full_name, email, avatar_url, role")
//           .eq("id", currentUser.id)
//           .maybeSingle()

//       if (profileError) {
//         throw profileError
//       }

//       setProfile(currentProfile)

//       // ----------------------------------------------
//       // LOAD MESSAGES
//       // ----------------------------------------------

//       await loadMessages()
//     } catch (error) {
//       console.error("Class chat initialization error:", error)
//     } finally {
//       setLoading(false)
//     }
//   }

//   // --------------------------------------------------
//   // LOAD MESSAGES
//   // --------------------------------------------------

//   async function loadMessages() {
//     const { data, error } = await supabase
//       .from("question_chat_messages")
//       .select(`
//         id,
//         question_id,
//         group_id,
//         user_id,
//         message,
//         created_at,
//         profiles (
//           id,
//           full_name,
//           email,
//           avatar_url
//         )
//       `)
//       .is("question_id", null)
//       .order("created_at", {
//         ascending: true,
//       })

//     if (error) {
//       console.error("Error loading class chat:", error)
//       return
//     }

//     setMessages(data || [])
//   }

//   // --------------------------------------------------
//   // REALTIME
//   // --------------------------------------------------

//   useEffect(() => {
//     const channel = supabase
//       .channel("class-chat-messages")
//       .on(
//         "postgres_changes",
//         {
//           event: "INSERT",
//           schema: "public",
//           table: "question_chat_messages",
//         },
//         async (payload) => {
//           const newMessage = payload.new

//           // Only class-chat messages.
//           // Question-specific messages are ignored.
//           if (newMessage.question_id !== null) {
//             return
//           }

//           // Fetch profile for the new message.
//           const { data: messageWithProfile } =
//             await supabase
//               .from("question_chat_messages")
//               .select(`
//                 id,
//                 question_id,
//                 group_id,
//                 user_id,
//                 message,
//                 created_at,
//                 profiles (
//                   id,
//                   full_name,
//                   email,
//                   avatar_url
//                 )
//               `)
//               .eq("id", newMessage.id)
//               .maybeSingle()

//           if (!messageWithProfile) {
//             return
//           }

//           setMessages((currentMessages) => {
//             const alreadyExists = currentMessages.some(
//               (item) => item.id === messageWithProfile.id
//             )

//             if (alreadyExists) {
//               return currentMessages
//             }

//             return [
//               ...currentMessages,
//               messageWithProfile,
//             ]
//           })
//         }
//       )
//       .subscribe()

//     return () => {
//       supabase.removeChannel(channel)
//     }
//   }, [])

//   // --------------------------------------------------
//   // AUTO SCROLL
//   // --------------------------------------------------

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({
//       behavior: "smooth",
//     })
//   }, [messages])

//   // --------------------------------------------------
//   // SEND MESSAGE
//   // --------------------------------------------------

//   async function sendMessage(event) {
//     event?.preventDefault()

//     const trimmedMessage = message.trim()

//     if (!trimmedMessage) {
//       return
//     }

//     if (!user) {
//       return
//     }

//     try {
//       setSending(true)

//       const { data, error } = await supabase
//         .from("question_chat_messages")
//         .insert({
//           question_id: null,
//           group_id: null,
//           user_id: user.id,
//           message: trimmedMessage,
//         })
//         .select(`
//           id,
//           question_id,
//           group_id,
//           user_id,
//           message,
//           created_at,
//           profiles (
//             id,
//             full_name,
//             email,
//             avatar_url
//           )
//         `)
//         .single()

//       if (error) {
//         throw error
//       }

//       // Realtime normally handles this.
//       // This fallback makes the sender see the
//       // message immediately even if realtime is delayed.
//       setMessages((currentMessages) => {
//         const alreadyExists = currentMessages.some(
//           (item) => item.id === data.id
//         )

//         if (alreadyExists) {
//           return currentMessages
//         }

//         return [...currentMessages, data]
//       })

//       setMessage("")
//     } catch (error) {
//       console.error("Error sending class chat message:", error)
//       alert(
//         error?.message ||
//           "Unable to send message. Please try again."
//       )
//     } finally {
//       setSending(false)
//     }
//   }

//   // --------------------------------------------------
//   // FORMAT TIME
//   // --------------------------------------------------

//   function formatMessageTime(timestamp) {
//     if (!timestamp) {
//       return ""
//     }

//     return new Date(timestamp).toLocaleTimeString([], {
//       hour: "2-digit",
//       minute: "2-digit",
//     })
//   }

//   // --------------------------------------------------
//   // GET USER NAME
//   // --------------------------------------------------

//   function getUserName(chatMessage) {
//     if (
//       chatMessage.user_id === user?.id &&
//       profile?.full_name
//     ) {
//       return profile.full_name
//     }

//     return (
//       chatMessage.profiles?.full_name ||
//       chatMessage.profiles?.email ||
//       "Student"
//     )
//   }

//   // --------------------------------------------------
//   // LOADING
//   // --------------------------------------------------

//   if (loading) {
//     return (
//       <main className="min-h-screen bg-[#f8fafc] p-4 sm:p-6 lg:p-8">
//         <div className="mx-auto max-w-5xl">

//           <div className="animate-pulse space-y-5">
//             <div className="h-8 w-48 rounded-lg bg-slate-200" />

//             <div className="h-[600px] rounded-2xl bg-slate-200" />
//           </div>

//         </div>
//       </main>
//     )
//   }

//   // --------------------------------------------------
//   // UI
//   // --------------------------------------------------

//   return (
//     <main className="min-h-screen bg-[#f8fafc] p-4 sm:p-6 lg:p-8">

//       <div className="mx-auto max-w-5xl">

//         {/* HEADER */}

//         <div className="mb-6">
//           <p className="mb-1 text-sm font-medium text-slate-500">
//             TDS Connect
//           </p>

//           <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
//             Class Chat
//           </h2>

//           <p className="mt-2 text-sm text-slate-500">
//             Discuss course topics with your classmates.
//           </p>
//         </div>

//         {/* CHAT CARD */}

//         <div className="flex h-[calc(100vh-210px)] min-h-[520px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

//           {/* CHAT HEADER */}

//           <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

//             <div>
//               <h3 className="text-sm font-bold text-slate-900">
//                 Class Discussion
//               </h3>

//               <p className="mt-0.5 text-xs text-slate-400">
//                 Everyone in the class can participate
//               </p>
//             </div>

//             <div className="flex items-center gap-2">

//               <span className="h-2 w-2 rounded-full bg-emerald-500" />

//               <span className="text-xs font-medium text-slate-500">
//                 Live
//               </span>

//             </div>

//           </div>

//           {/* MESSAGES */}

//           <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">

//             {messages.length === 0 ? (
//               <div className="flex h-full flex-col items-center justify-center text-center">

//                 <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
//                   💬
//                 </div>

//                 <h3 className="mt-4 text-sm font-bold text-slate-800">
//                   No messages yet
//                 </h3>

//                 <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
//                   Start the discussion by sending the first
//                   message to your classmates.
//                 </p>

//               </div>
//             ) : (
//               <div className="space-y-4">

//                 {messages.map((chatMessage) => {
//                   const isOwnMessage =
//                     chatMessage.user_id === user?.id

//                   return (
//                     <div
//                       key={chatMessage.id}
//                       className={`flex ${
//                         isOwnMessage
//                           ? "justify-end"
//                           : "justify-start"
//                       }`}
//                     >

//                       <div
//                         className={`max-w-[85%] sm:max-w-[70%] ${
//                           isOwnMessage
//                             ? "items-end"
//                             : "items-start"
//                         }`}
//                       >

//                         {/* USER */}

//                         <div
//                           className={`mb-1 flex items-center gap-2 ${
//                             isOwnMessage
//                               ? "justify-end"
//                               : "justify-start"
//                           }`}
//                         >

//                           <span className="text-xs font-semibold text-slate-500">
//                             {isOwnMessage
//                               ? "You"
//                               : getUserName(chatMessage)}
//                           </span>

//                           <span className="text-[10px] text-slate-400">
//                             {formatMessageTime(
//                               chatMessage.created_at
//                             )}
//                           </span>

//                         </div>

//                         {/* MESSAGE */}

//                         <div
//                           className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
//                             isOwnMessage
//                               ? "rounded-br-md bg-slate-900 text-white"
//                               : "rounded-bl-md bg-slate-100 text-slate-700"
//                           }`}
//                         >
//                           {chatMessage.message}
//                         </div>

//                       </div>

//                     </div>
//                   )
//                 })}

//                 <div ref={messagesEndRef} />

//               </div>
//             )}

//           </div>

//           {/* INPUT */}

//           <form
//             onSubmit={sendMessage}
//             className="border-t border-slate-200 bg-white p-4 sm:p-5"
//           >

//             <div className="flex gap-3">

//               <input
//                 type="text"
//                 value={message}
//                 onChange={(event) =>
//                   setMessage(event.target.value)
//                 }
//                 placeholder="Write a message..."
//                 disabled={sending}
//                 className="
//                   min-w-0
//                   flex-1
//                   rounded-xl
//                   border
//                   border-slate-200
//                   bg-slate-50
//                   px-4
//                   py-3
//                   text-sm
//                   text-slate-900
//                   outline-none
//                   transition
//                   placeholder:text-slate-400
//                   focus:border-slate-400
//                   focus:bg-white
//                   focus:ring-2
//                   focus:ring-slate-100
//                   disabled:cursor-not-allowed
//                   disabled:opacity-60
//                 "
//               />

//               <button
//                 type="submit"
//                 disabled={
//                   sending ||
//                   !message.trim()
//                 }
//                 className="
//                   shrink-0
//                   rounded-xl
//                   bg-slate-900
//                   px-5
//                   py-3
//                   text-sm
//                   font-semibold
//                   text-white
//                   transition
//                   hover:bg-slate-800
//                   active:scale-[0.98]
//                   disabled:cursor-not-allowed
//                   disabled:opacity-50
//                 "
//               >
//                 {sending ? "Sending..." : "Send"}
//               </button>

//             </div>

//           </form>

//         </div>

//       </div>

//     </main>
//   )
// }

// export default ClassChat










import { useEffect, useRef, useState } from "react"
import { supabase } from "../lib/supabase"

function ClassChat() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)

  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState("")

  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const messagesEndRef = useRef(null)

  // --------------------------------------------------
  // INITIAL LOAD
  // --------------------------------------------------

  useEffect(() => {
    initializeChat()
  }, [])

  async function initializeChat() {
    try {
      setLoading(true)

      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        throw userError
      }

      if (!currentUser) {
        return
      }

      setUser(currentUser)

      // ----------------------------------------------
      // PROFILE
      // ----------------------------------------------

      const { data: currentProfile, error: profileError } =
        await supabase
          .from("profiles")
          .select("id, full_name, email, avatar_url, role")
          .eq("id", currentUser.id)
          .maybeSingle()

      if (profileError) {
        throw profileError
      }

      setProfile(currentProfile)

      // ----------------------------------------------
      // LOAD MESSAGES
      // ----------------------------------------------

      await loadMessages()
    } catch (error) {
      console.error("Class chat initialization error:", error)
    } finally {
      setLoading(false)
    }
  }

  // --------------------------------------------------
  // LOAD MESSAGES (With 3-Day / 10-Min Filter)
  // --------------------------------------------------

  async function loadMessages() {
    // Testing ke liye abhi 10 minutes rakha hai (Testing ke baad '3 * 24 * 60 * 60 * 1000' kar dena 3 days ke liye)
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
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
          email,
          avatar_url
        )
      `)
      .is("question_id", null)
      .gte("created_at", cutoffTime) // Sirf pichle kuch samay ke messages filter honge
      .order("created_at", {
        ascending: true,
      })

    if (error) {
      console.error("Error loading class chat:", error)
      return
    }

    setMessages(data || [])
  }

  // --------------------------------------------------
  // REALTIME
  // --------------------------------------------------

  useEffect(() => {
    const channel = supabase
      .channel("class-chat-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "question_chat_messages",
        },
        async (payload) => {
          const newMessage = payload.new

          // Only class-chat messages.
          // Question-specific messages are ignored.
          if (newMessage.question_id !== null) {
            return
          }

          // Fetch profile for the new message.
          const { data: messageWithProfile } =
            await supabase
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
                  email,
                  avatar_url
                )
              `)
              .eq("id", newMessage.id)
              .maybeSingle()

          if (!messageWithProfile) {
            return
          }

          setMessages((currentMessages) => {
            const alreadyExists = currentMessages.some(
              (item) => item.id === messageWithProfile.id
            )

            if (alreadyExists) {
              return currentMessages
            }

            return [
              ...currentMessages,
              messageWithProfile,
            ]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // --------------------------------------------------
  // AUTO SCROLL
  // --------------------------------------------------

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    })
  }, [messages])

  // --------------------------------------------------
  // SEND MESSAGE
  // --------------------------------------------------

  async function sendMessage(event) {
    event?.preventDefault()

    const trimmedMessage = message.trim()

    if (!trimmedMessage) {
      return
    }

    if (!user) {
      return
    }

    try {
      setSending(true)

      const { data, error } = await supabase
        .from("question_chat_messages")
        .insert({
          question_id: null,
          group_id: null,
          user_id: user.id,
          message: trimmedMessage,
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
            email,
            avatar_url
          )
        `)
        .single()

      if (error) {
        throw error
      }

      // Realtime normally handles this.
      // This fallback makes the sender see the
      // message immediately even if realtime is delayed.
      setMessages((currentMessages) => {
        const alreadyExists = currentMessages.some(
          (item) => item.id === data.id
        )

        if (alreadyExists) {
          return currentMessages
        }

        return [...currentMessages, data]
      })

      setMessage("")
    } catch (error) {
      console.error("Error sending class chat message:", error)
      alert(
        error?.message ||
          "Unable to send message. Please try again."
      )
    } finally {
      setSending(false)
    }
  }

  // --------------------------------------------------
  // FORMAT TIME
  // --------------------------------------------------

  function formatMessageTime(timestamp) {
    if (!timestamp) {
      return ""
    }

    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // --------------------------------------------------
  // GET USER NAME
  // --------------------------------------------------

  function getUserName(chatMessage) {
    if (
      chatMessage.user_id === user?.id &&
      profile?.full_name
    ) {
      return profile.full_name
    }

    return (
      chatMessage.profiles?.full_name ||
      chatMessage.profiles?.email ||
      "Student"
    )
  }

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8fafc] p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl">

          <div className="animate-pulse space-y-5">
            <div className="h-8 w-48 rounded-lg bg-slate-200" />

            <div className="h-[600px] rounded-2xl bg-slate-200" />
          </div>

        </div>
      </main>
    )
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <main className="min-h-screen bg-[#f8fafc] p-4 sm:p-6 lg:p-8">

      <div className="mx-auto max-w-5xl">

        {/* HEADER */}

        <div className="mb-6">
          <p className="mb-1 text-sm font-medium text-slate-500">
            TDS Connect
          </p>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Class Chat
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Discuss course topics with your classmates.
          </p>
        </div>

        {/* CHAT CARD */}

        <div className="flex h-[calc(100vh-210px)] min-h-[520px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* CHAT HEADER */}

          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Class Discussion
              </h3>

              <p className="mt-0.5 text-xs text-slate-400">
                Everyone in the class can participate
              </p>
            </div>

            <div className="flex items-center gap-2">

              <span className="h-2 w-2 rounded-full bg-emerald-500" />

              <span className="text-xs font-medium text-slate-500">
                Live
              </span>

            </div>

          </div>

          {/* MESSAGES */}

          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">

            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                  💬
                </div>

                <h3 className="mt-4 text-sm font-bold text-slate-800">
                  No messages yet
                </h3>

                <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
                  Start the discussion by sending the first
                  message to your classmates.
                </p>

              </div>
            ) : (
              <div className="space-y-4">

                {messages.map((chatMessage) => {
                  const isOwnMessage =
                    chatMessage.user_id === user?.id

                  return (
                    <div
                      key={chatMessage.id}
                      className={`flex ${
                        isOwnMessage
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >

                      <div
                        className={`max-w-[85%] sm:max-w-[70%] ${
                          isOwnMessage
                            ? "items-end"
                            : "items-start"
                        }`}
                      >

                        {/* USER */}

                        <div
                          className={`mb-1 flex items-center gap-2 ${
                            isOwnMessage
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >

                          <span className="text-xs font-semibold text-slate-500">
                            {isOwnMessage
                              ? "You"
                              : getUserName(chatMessage)}
                          </span>

                          <span className="text-[10px] text-slate-400">
                            {formatMessageTime(
                              chatMessage.created_at
                            )}
                          </span>

                        </div>

                        {/* MESSAGE */}

                        <div
                          className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                            isOwnMessage
                              ? "rounded-br-md bg-slate-900 text-white"
                              : "rounded-bl-md bg-slate-100 text-slate-700"
                          }`}
                        >
                          {chatMessage.message}
                        </div>

                      </div>

                    </div>
                  )
                })}

                <div ref={messagesEndRef} />

              </div>
            )}

          </div>

          {/* INPUT */}

          <form
            onSubmit={sendMessage}
            className="border-t border-slate-200 bg-white p-4 sm:p-5"
          >

            <div className="flex gap-3">

              <input
                type="text"
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                placeholder="Write a message..."
                disabled={sending}
                className="
                  min-w-0
                  flex-1
                  rounded-xl
                  border
                  border-slate-200
                  bg-slate-50
                  px-4
                  py-3
                  text-sm
                  text-slate-900
                  outline-none
                  transition
                  placeholder:text-slate-400
                  focus:border-slate-400
                  focus:bg-white
                  focus:ring-2
                  focus:ring-slate-100
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              />

              <button
                type="submit"
                disabled={
                  sending ||
                  !message.trim()
                }
                className="
                  shrink-0
                  rounded-xl
                  bg-slate-900
                  px-5
                  py-3
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-slate-800
                  active:scale-[0.98]
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {sending ? "Sending..." : "Send"}
              </button>

            </div>

          </form>

        </div>

      </div>

    </main>
  )
}

export default ClassChat
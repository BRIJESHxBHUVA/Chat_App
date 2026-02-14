import React, { useContext, useEffect, useRef, useState } from 'react'
import './Dashboard.css'
import { useUser } from '../../redux/reducers/authReducer'
import { CallSvgIcon, ChatSvgIcon, MicroPhoneSvgIcon, PlusSvgIcon, SendSvgIcon, SettingSvgIcon, StatusSvgIcon, VideoCallSvgIcon, ReplySvgIcon, ForwardSvgIcon, CopySvgIcon, DeleteSvgIcon } from '../../Utils/SVG';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllUsers, useAllUserData, userDataActions } from '../../redux/reducers/userDataReducer';
import { AppContext } from '../../Context';
import { fetchMessages, messagesDataActions, useAllMessagesData } from '../../redux/reducers/messagesDataReducer';
import _ from 'lodash';
import { io } from "socket.io-client";
import api from '../../Utils/api';
import ConfirmModal from '../../Components/ConfirmModal/ConfirmModal';

const Dashboard = () => {

    const dispatch = useDispatch();
    const { data: allUsers, loading: usersLoading } = useSelector((state) => state.userData);
    const { messages, loading: messagesLoading } = useSelector((state) => state.messagesData);
    const userData = useSelector((state) => state.auth.user);

    const allUsersData = useAllUserData();
    const allMessagesData = useAllMessagesData();
    const { allUsersList, setAllUsersList, showToast } = useContext(AppContext)
    const [searchTerm, setSearchTerm] = useState("");

    const [selectedChatUser, setSelectedChatUser] = useState(null);
    const socketRef = useRef(null);
    const [messageText, setMessageText] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [enlargedImage, setEnlargedImage] = useState(null);
    const fileInputRef = useRef(null);
    const messageEndRef = useRef(null);
    const [actionMenuId, setActionMenuId] = useState(null);
    const [isForwardingMode, setIsForwardingMode] = useState(false);
    const [selectedMessageIds, setSelectedMessageIds] = useState([]);
    const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
    const [forwardSearchTerm, setForwardSearchTerm] = useState("");
    const [selectedUserIdsForForward, setSelectedUserIdsForForward] = useState([]);
    const [deleteConfirmInfo, setDeleteConfirmInfo] = useState({ show: false, msg: null, type: 'me' });
    const [replyingToMessage, setReplyingToMessage] = useState(null);

    useEffect(() => {
        dispatch(fetchAllUsers());
    }, [dispatch]);

    useEffect(() => {
        if (!selectedChatUser || !userData?._id) return;

        dispatch(
            fetchMessages({
                senderId: userData._id,
                receiverId: selectedChatUser._id,
            })
        );
    }, [selectedChatUser, userData?._id, dispatch]);


    useEffect(() => {
        if (searchTerm.trim() === "") {
            setAllUsersList(allUsersData);
        } else {
            const filtered = allUsersData.filter(user =>
                `${user.firstname} ${user.lastname}`.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setAllUsersList(filtered);
        }
    }, [searchTerm, allUsersData, setAllUsersList]);

    useEffect(() => {
        if (!userData?._id) return;

        socketRef.current = io(process.env.REACT_APP_SOCKET_URL, {
            query: {
                userId: userData._id
            },
            transports: ["websocket"]
        });

        return () => {
            socketRef.current.disconnect();
        };
    }, [userData?._id]);

    useEffect(() => {
        if (!socketRef.current) return;

        socketRef.current.on("receiveMessage", (message) => {
            const isCurrentChat =
                selectedChatUser &&
                (
                    (message.sender_Id === selectedChatUser._id &&
                        message.reciever_Id === userData._id) ||
                    (message.sender_Id === userData._id &&
                        message.reciever_Id === selectedChatUser._id)
                );

            // 1️⃣ Update open chat window
            if (isCurrentChat) {
                if (message.sender_Id === userData._id) {
                    // Update my own message (replace optimistic with real)
                    dispatch(messagesDataActions.updateOptimisticMessage(message));
                } else {
                    // Receive message from others
                    dispatch(messagesDataActions.addMessage(message));

                    // Mark as seen immediately since chat is open
                    socketRef.current.emit("messageSeen", {
                        messageIds: [message._id],
                        senderId: selectedChatUser._id,
                        receiverId: userData._id
                    });
                }
            }

            // 2️⃣ Update sidebar last message
            dispatch(
                userDataActions.updateLastMessage({
                    message,
                    loggedInUserId: userData._id,
                    isChatOpen: isCurrentChat
                })
            );
        });

        socketRef.current.on("messageStatusUpdate", (data) => {
            dispatch(messagesDataActions.updateMessageStatus(data));
        });

        socketRef.current.on("messagesDeleted", (data) => {
            dispatch(messagesDataActions.removeMessages(data));
        });

        return () => {
            socketRef.current.off("receiveMessage");
            socketRef.current.off("messageStatusUpdate");
            socketRef.current.off("messagesDeleted");
        };
    }, [selectedChatUser, userData?._id, dispatch]);


    useEffect(() => {
        if (!socketRef.current) return;

        socketRef.current.on("user_online", ({ userId }) => {
            dispatch(userDataActions.setUserOnline(userId));
        });

        socketRef.current.on("user_offline", ({ userId }) => {
            dispatch(userDataActions.setUserOffline(userId));
        });

        return () => {
            socketRef.current.off("user_online");
            socketRef.current.off("user_offline");
        };
    }, [dispatch]);

    // Close action menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (actionMenuId && !event.target.closest('.message_actions_wrapper')) {
                setActionMenuId(null);
            }
        };

        if (actionMenuId) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [actionMenuId]);

    // Mark messages as seen when opening a chat
    useEffect(() => {
        if (!socketRef.current || !selectedChatUser || !userData?._id || _.isEmpty(messages)) return;

        const unseenMessages = messages.filter(
            msg => msg.sender_Id === selectedChatUser._id && msg.status !== "seen"
        );

        if (unseenMessages.length > 0) {
            const messageIds = unseenMessages.map(msg => msg._id);

            socketRef.current.emit("messageSeen", {
                messageIds,
                senderId: selectedChatUser._id,
                receiverId: userData._id
            });

            // Optimistically update locally in Redux
            dispatch(messagesDataActions.updateMessageStatus({
                messageIds,
                status: "seen"
            }));

            // Reset unread count locally
            dispatch(userDataActions.resetUnreadCount(selectedChatUser._id));
        }
    }, [selectedChatUser, messages, userData?._id, dispatch]);

    // Auto scroll to bottom
    useEffect(() => {
        if (messageEndRef.current) {
            messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);


    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            if (file.type.startsWith("image/")) {
                setPreviewUrl(URL.createObjectURL(file));
            } else {
                setPreviewUrl(null);
            }
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSendMessage = async () => {
        if ((!messageText.trim() && !selectedFile) || !selectedChatUser) return;

        let fileData = {};

        if (selectedFile) {
            const formData = new FormData();
            formData.append("file", selectedFile);
            try {
                const response = await api.post("/chat/upload", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                if (response.data.success) {
                    fileData = {
                        fileUrl: response.data.fileUrl,
                        fileType: response.data.fileType,
                        fileName: response.data.originalName,
                    };
                    if (response.data.fileType.startsWith("image/")) {
                        fileData.image = response.data.fileUrl; // Keep compatibility with existing image field if needed
                    }
                }
            } catch (error) {
                console.error("File upload failed", error);
                return;
            }
        }

        const payload = {
            sender_Id: userData._id,
            reciever_Id: selectedChatUser._id,
            message: messageText,
            replyTo: replyingToMessage?._id,
            ...fileData
        };

        socketRef.current.emit("sendMessage", payload);

        dispatch(
            messagesDataActions.addMessage({
                ...payload,
                replyTo: replyingToMessage, // Pass the whole object for local state update
                _id: Date.now(),
                createdAt: new Date().toISOString(),
                status: "sent",
            })
        );

        dispatch(
            userDataActions.updateLastMessage({
                message: {
                    ...payload,
                    createdAt: new Date().toISOString(),
                },
                loggedInUserId: userData._id,
            })
        );

        setMessageText("");
        handleRemoveFile();
        setReplyingToMessage(null);
    };



    const handleSelectUser = (data) => {
        setSelectedChatUser(data);
        dispatch(userDataActions.resetUnreadCount(data._id));
        setIsForwardingMode(false);
        setSelectedMessageIds([]);
        setReplyingToMessage(null);
    }

    const handleMessageAction = async (action, msg) => {
        setActionMenuId(null);

        switch (action) {
            case 'reply':
                setReplyingToMessage(msg);
                break;
            case 'copy':
                if (msg.message) {
                    navigator.clipboard.writeText(msg.message);
                    showToast("Message copied!");
                }
                break;
            case 'delete':
                if (msg.sender_Id === userData._id) {
                    setDeleteConfirmInfo({ show: true, msg, type: 'everyone' });
                } else {
                    setDeleteConfirmInfo({ show: true, msg, type: 'me' });
                }
                break;
            case 'forward':
                setIsForwardingMode(true);
                setSelectedMessageIds([msg._id]);
                break;
            default:
                break;
        }
    };

    const toggleMessageSelection = (id) => {
        setSelectedMessageIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleForwardMessages = async () => {
        if (selectedUserIdsForForward.length === 0) {
            showToast("Select at least one user", "error");
            return;
        }

        try {
            await api.post("/chat/forward", {
                messageIds: selectedMessageIds,
                receiverIds: selectedUserIdsForForward
            });
            setIsForwardModalOpen(false);
            setIsForwardingMode(false);
            setSelectedMessageIds([]);
            setSelectedUserIdsForForward([]);
            showToast("Messages forwarded!");
        } catch (error) {
            console.error("Forward error", error);
        }
    };

    const handleConfirmDelete = async () => {
        const { msg, type } = deleteConfirmInfo;
        try {
            await api.delete("/chat/deletemessages", {
                data: { messagesIds: [msg._id], deleteType: type }
            });
            dispatch(messagesDataActions.removeMessages({ messageIds: [msg._id] }));
            showToast("Message deleted");
        } catch (error) {
            console.error("Delete error", error);
            showToast("Failed to delete message", "error");
        } finally {
            setDeleteConfirmInfo({ show: false, msg: null, type: 'me' });
        }
    };

    function formatTime(timestamp) {
        const date = new Date(timestamp);

        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    }

    const renderMessageStatus = (status) => {
        if (status === "sent") {
            return <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="#8a8a8a"
            >
                <path d="M1.5 12.5l4 4 8.5-8.5-1.5-1.5-7 7-2.5-2.5z" />
            </svg>

        }

        if (status === "delivered") {
            return <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="#8a8a8a"
            >
                <path d="M1.5 12.5l4 4 8.5-8.5-1.5-1.5-7 7-2.5-2.5z" />
                <path d="M7.5 12.5l4 4 10.5-10.5-1.5-1.5-9 9-2.5-2.5z" />
            </svg>
        }

        if (status === "seen") {
            return <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="#4fc3f7"
            >
                <path d="M1.5 12.5l4 4 8.5-8.5-1.5-1.5-7 7-2.5-2.5z" />
                <path d="M7.5 12.5l4 4 10.5-10.5-1.5-1.5-9 9-2.5-2.5z" />
            </svg>
        }

        return null;
    };


    return (
        <div className='dashboard'>
            <div className='dashboard_wrapper'>
                <div className='action_side_bar'>
                    <div className='action_menu_bar'>
                        <button className='menu_button svg_btn'>
                            <ChatSvgIcon />
                        </button>
                        <button className='menu_button svg_btn'>
                            <StatusSvgIcon />
                        </button>
                        <button className='menu_button svg_btn'>
                            <SettingSvgIcon />
                        </button>
                    </div>
                    <img src={`${process.env.REACT_APP_IMAGE_URL}/user/${userData?.image}`} className='user_profile' alt="" />
                </div>
                <div className='dashboard_sidebar'>
                    <div className='user_details_header'>
                        <div className='chat_heading'>
                            <b>Chat</b>
                        </div>
                        <div className='search_bar'>
                            <input
                                type="search"
                                className='search_input'
                                placeholder='Search Chat'
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className='chats_list'>
                        {usersLoading && <p>Loading users...</p>}
                        {allUsersList && allUsersList?.map((user, index) => (
                            <div className={`chat_wrapper ${selectedChatUser?._id === user._id ? 'active_chat' : ''}`} key={index} onClick={() => handleSelectUser(user)}>
                                <img src={`${process.env.REACT_APP_IMAGE_URL}/user/${user?.image}`} className='chat_user_image' alt="" />
                                <div className='chat_details'>
                                    <div className='chat_user_name'>
                                        {user?.firstname} {user?.lastname}
                                        <div className='chat_last_message_time'>{formatTime(user?.lastMessageTime ? user?.lastMessageTime : Date.now())}</div>
                                    </div>
                                    <div className='chat_last_message_row'>
                                        <div className='chat_last_message'>{user?.lastMessage ? user?.lastMessage : 'Start messaging'}</div>
                                        {user?.unreadCount > 0 && selectedChatUser?._id !== user._id && (
                                            <div className='unread_count_badge'>{user.unreadCount}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className='selected_chat_wrapper'>
                    {!selectedChatUser ? (
                        <div className="welcome_screen">
                            <h2>Welcome to Chat App 💬</h2>
                            <p>Select a user to start a conversation</p>
                        </div>
                    ) : (
                        <>
                            <div className='selected_chat_header'>
                                <div className='selected_user_info'>
                                    <img src={`${process.env.REACT_APP_IMAGE_URL}/user/${selectedChatUser?.image}`} className='selected_chat_user_image' alt="" />
                                    <div className='selected_chat_user_details'>
                                        <div className='selected_chat_user_name'>
                                            {selectedChatUser?.firstname} {selectedChatUser?.lastname}
                                            <div className='selected_chat_user_extra_info'>
                                                {selectedChatUser?.is_online
                                                    ? "online"
                                                    : selectedChatUser?.last_seen
                                                        ? `last seen ${formatTime(selectedChatUser.last_seen)}`
                                                        : ""}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className='selected_chat_action'>
                                    <button className='action_button svg_btn '>
                                        <CallSvgIcon />
                                    </button>
                                    <button className='action_button svg_btn'>
                                        <VideoCallSvgIcon />
                                    </button>
                                </div>
                            </div>
                            <div className='barrier_line'></div>
                            <div className='message_diaplay_area' style={{ position: `${messagesLoading ? 'relative' : 'static'}` }}>
                                {messagesLoading ? (
                                    <div className='custom_spinner'></div>
                                ) : (
                                    _.isEmpty(messages) ? (
                                        <div className="no_messages_yet">Start messaging now</div>
                                    ) : (
                                        <div className='chat_section'>
                                            {messages.map((msg) => {
                                                const isSender = msg.sender_Id === userData?._id;
                                                const hasFile = msg.fileUrl || msg.image;
                                                console.log(msg);

                                                return (
                                                    <div
                                                        key={msg._id}
                                                        className={`message_bubble ${isSender ? "sent" : "received"} ${(msg.image || msg.fileUrl) && msg.message ? 'message_bubble_with_image' : ''}`}
                                                        style={{ padding: `${(msg.image || msg.fileUrl) && !msg.message ? '4px' : '6px 8px 20px 8px'}`, alignItems: `${msg.replyTo ? 'end' : 'center'}` }}
                                                    >
                                                        {msg.isForwarded && (
                                                            <div className="forwarded_label">
                                                                <i>Forwarded</i>
                                                            </div>
                                                        )}
                                                        {msg.replyTo && (
                                                            <div className="quoted_reply">
                                                                <span className="quoted_user">{msg.replyTo?.sender_Id === userData._id ? "You" : selectedChatUser?.firstname}</span>
                                                                <p className="quoted_text">{msg.replyTo?.message || (msg.replyTo?.image ? "Photo" : "File")}</p>
                                                            </div>
                                                        )}
                                                        {msg.image && (
                                                            <img
                                                                src={`${process.env.REACT_APP_IMAGE_URL}/${msg.fileUrl ? 'chatFiles' : 'chatImage'}/${msg.image}`}
                                                                className="message_image"
                                                                alt=""
                                                                onClick={() => setEnlargedImage(`${process.env.REACT_APP_IMAGE_URL}/${msg.fileUrl ? 'chatFiles' : 'chatImage'}/${msg.image}`)}
                                                                style={{ cursor: 'pointer' }}
                                                            />
                                                        )}

                                                        {msg.fileUrl && !msg.fileType?.startsWith("image/") && (
                                                            <div className="file_attachment_card">
                                                                <div className="file_info">
                                                                    <div className="file_icon">📄</div>
                                                                    <div className="file_details">
                                                                        <span className="file_name">{msg.fileName || "File"}</span>
                                                                        <span className="file_size">{msg.fileType?.split('/')[1]?.toUpperCase()}</span>
                                                                    </div>
                                                                </div>
                                                                <a
                                                                    href={`${process.env.REACT_APP_IMAGE_URL}/chatFiles/${msg.fileUrl}`}
                                                                    download={msg.fileName}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="download_link"
                                                                >
                                                                    Download
                                                                </a>
                                                            </div>
                                                        )}

                                                        {msg.message && (
                                                            <p className="message_text">{msg.message}</p>
                                                        )}

                                                        <span className={`message_meta ${hasFile && !msg.message ? 'image_meta_time' : ''} ${hasFile && msg.message ? 'image_with_message_meta_time' : ''}`}>
                                                            <span className="message_time">
                                                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                })}
                                                            </span>
                                                            {isSender && renderMessageStatus(msg?.status)}
                                                        </span>

                                                        <div className={`message_actions_wrapper ${isSender ? "sent" : ""}`}>
                                                            {!isForwardingMode ? (
                                                                <div className="action_trigger" onClick={() => setActionMenuId(actionMenuId === msg._id ? null : msg._id)}>
                                                                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
                                                                </div>
                                                            ) : (
                                                                <input
                                                                    type="checkbox"
                                                                    className="message_checkbox"
                                                                    checked={selectedMessageIds.includes(msg._id)}
                                                                    onChange={() => toggleMessageSelection(msg._id)}
                                                                />
                                                            )}

                                                            {actionMenuId === msg._id && (
                                                                <div className="action_menu_popup">
                                                                    <button onClick={() => handleMessageAction('reply', msg)}>
                                                                        <ReplySvgIcon /> Reply
                                                                    </button>
                                                                    <button onClick={() => handleMessageAction('forward', msg)}>
                                                                        <ForwardSvgIcon /> Forward
                                                                    </button>
                                                                    {(!msg.image && !msg.fileUrl) && (
                                                                        <button onClick={() => handleMessageAction('copy', msg)}>
                                                                            <CopySvgIcon /> Copy
                                                                        </button>
                                                                    )}
                                                                    <button className="delete_action" onClick={() => handleMessageAction('delete', msg)}>
                                                                        <DeleteSvgIcon /> Delete
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                );
                                            })
                                            }
                                            <div ref={messageEndRef} />
                                        </div>
                                    )

                                )}

                                {isForwardingMode && (
                                    <div className="forwarding_options_bar">
                                        <span>{selectedMessageIds.length} message(s) selected</span>
                                        <div className="forward_bar_actions">
                                            <button className="cancel_forward_btn" onClick={() => setIsForwardingMode(false)}>Cancel</button>
                                            <button className="forward_btn_trigger" disabled={selectedMessageIds.length === 0} onClick={() => setIsForwardModalOpen(true)}>
                                                <svg viewBox="0 0 24 24" width="20" height="20" fill="white"><path d="M15 5l-1.41 1.41L18.17 11H2v2h16.17l-4.59 4.59L15 19l7-7-7-7z"></path></svg>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {!isForwardingMode && (
                                <div className='user_chat_area_container'>
                                    {replyingToMessage && (
                                        <div className="reply_preview_bar">
                                            <div className="reply_content_preview">
                                                <span className="reply_owner">Replying to {replyingToMessage?.sender_Id === userData?._id ? "yourself" : (selectedChatUser?.firstname)}</span>
                                                <p className="reply_text_preview">{replyingToMessage?.message || (replyingToMessage?.image ? "Photo" : "File")}</p>
                                            </div>
                                            <button className="cancel_reply_btn" onClick={() => setReplyingToMessage(null)}>✕</button>
                                        </div>
                                    )}
                                    {selectedFile && (
                                        <div className="file_preview_container">
                                            {previewUrl ? (
                                                <div className="image_preview_wrapper">
                                                    <img src={previewUrl} alt="Preview" className="image_preview" />
                                                    <button className="remove_file_btn" onClick={handleRemoveFile}>✕</button>
                                                </div>
                                            ) : (
                                                <div className="file_name_preview">
                                                    <span>{selectedFile.name}</span>
                                                    <button className="remove_file_btn" onClick={handleRemoveFile}>✕</button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div className='user_chat_area'>
                                        <button className='upload_document_button svg_btn' onClick={() => fileInputRef.current.click()}>
                                            <PlusSvgIcon />
                                        </button>
                                        <input
                                            type="file"
                                            style={{ display: 'none' }}
                                            ref={fileInputRef}
                                            onChange={handleFileSelect}
                                        />
                                        <textarea
                                            className='message_input'
                                            placeholder='Type a message'
                                            value={messageText}
                                            onChange={(e) => setMessageText(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage();
                                                }
                                            }}
                                            name=""
                                            id=""
                                        >
                                        </textarea>
                                        {(messageText.trim() === '' && !selectedFile)
                                            ?
                                            <button className='micro_phone_button svg_btn'>
                                                <MicroPhoneSvgIcon />
                                            </button>
                                            :
                                            <button className='send_message_button svg_btn' onClick={handleSendMessage}>
                                                <SendSvgIcon />
                                            </button>
                                        }
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
            {enlargedImage && (
                <div className="image_modal" onClick={() => setEnlargedImage(null)}>
                    <div className="modal_content">
                        <img src={enlargedImage} alt="Enlarged" />
                        <button className="close_modal">✕</button>
                    </div>
                </div>
            )}

            {isForwardModalOpen && (
                <div className="forward_modal_overlay">
                    <div className="forward_modal_content">
                        <h3>Forward to...</h3>
                        <div className="forward_search">
                            <input
                                type="text"
                                placeholder="Search users"
                                value={forwardSearchTerm}
                                onChange={(e) => setForwardSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="forward_user_list">
                            {allUsersData
                                .filter(u => `${u.firstname} ${u.lastname}`.toLowerCase().includes(forwardSearchTerm.toLowerCase()))
                                .map(u => (
                                    <div key={u._id} className="forward_user_item">
                                        <div className="user_core_info">
                                            <img src={`${process.env.REACT_APP_IMAGE_URL}/user/${u.image}`} alt="" />
                                            <span>{u.firstname} {u.lastname}</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={selectedUserIdsForForward.includes(u._id)}
                                            onChange={() => {
                                                setSelectedUserIdsForForward(prev =>
                                                    prev.includes(u._id) ? prev.filter(id => id !== u._id) : [...prev, u._id]
                                                );
                                            }}
                                        />
                                    </div>
                                ))}
                        </div>
                        <div className="forward_modal_footer">
                            <button className="close_btn" onClick={() => setIsForwardModalOpen(false)}>Cancel</button>
                            <button className="confirm_forward_btn" onClick={handleForwardMessages}>Forward ({selectedUserIdsForForward.length})</button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={deleteConfirmInfo.show}
                title="Delete Message"
                message={deleteConfirmInfo.type === 'everyone'
                    ? "Are you sure you want to delete this message for everyone?"
                    : "Are you sure you want to delete this message for yourself?"}
                confirmText={deleteConfirmInfo.type === 'everyone' ? "Delete for Everyone" : "Delete for Me"}
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteConfirmInfo({ show: false, msg: null, type: 'me' })}
            />
        </div>
    )
}

export default Dashboard
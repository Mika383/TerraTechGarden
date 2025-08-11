import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageOutlined, 
  SendOutlined, 
  UserOutlined, 
  CustomerServiceOutlined,
  SearchOutlined,
  PhoneOutlined,
  VideoCameraOutlined,
  InfoCircleOutlined,
  SmileOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
  CheckOutlined,
  EllipsisOutlined
} from '@ant-design/icons';

interface User {
  userId: number;
  username: string;
  fullName: string;
  email: string;
  roleId: number;
  roleName: string;
  status: string;
  hasExistingChat: boolean;
  existingChatId: number | null;
}

interface Chat {
  chatId: number;
  user1Id: number;
  user2Id: number;
  user1Name: string;
  user2Name: string;
  user1Role: string;
  user2Role: string;
  createdAt: string;
  updatedAt: string | null;
  isActive: boolean;
  lastMessage: Message | null;
}

interface Message {
  messageId: number;
  chatId: number;
  senderId: number;
  senderName: string;
  senderRole: string;
  content: string;
  sentAt: string;
  isRead: boolean;
  isDeleted: boolean;
}

interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

const ChatWithStaff: React.FC = () => {
  const navigate = useNavigate();
  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const [myChats, setMyChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number>(2);
  const [currentUserFullName, setCurrentUserFullName] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set([1, 3]));
  const [hasLoadedChats, setHasLoadedChats] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const getAuthToken = () => {
    return localStorage.getItem('authToken') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyIiwidW5pcXVlX25hbWUiOiJhZG1pbiIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkFkbWluIiwiZW1haWwiOiJzdHJpbmdAZ21haWwuY29tIiwiZnVsbE5hbWUiOiJOWFF1YW5nbmciLCJwaG9uZU51bWJlciI6InN0cmluZyIsImdlbmRlciI6Im1hbGUiLCJzdGF0dXMiOiJBY3RpdmUiLCJleHAiOjE3NTQ1NzkxNjEsImlzcyI6IlRlcnJhcml1bUdhcmRlblRlY2hBUEkiLCJhdWQiOiJUZXJyYXJpdW1HYXJkZW5UZWNoQ2xpZW50In0.acoY5Elcd1FnqR8bIzQPso52QkxkIN2uPfQocV8PvfY';
  };

  // Hàm decode JWT để lấy thông tin user
  const decodeToken = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  // Lấy thông tin user từ token khi component mount
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      const decoded = decodeToken(token);
      if (decoded) {
        setCurrentUserFullName(decoded.fullName || decoded.name || '');
        if (decoded.userId) {
          setCurrentUserId(decoded.userId);
        }
      }
    }
  }, []);

  // Hàm xác định tên cuộc trò chuyện dựa trên fullName từ token
  const getChatDisplayName = (chat: Chat) => {
    if (chat.user1Name === currentUserFullName) {
      return chat.user2Name;
    } else if (chat.user2Name === currentUserFullName) {
      return chat.user1Name;
    }
    // Fallback nếu không khớp với fullName từ token
    return chat.user1Id === currentUserId ? chat.user2Name : chat.user1Name;
  };

  // Hàm xác định thông tin user khác trong chat
  const getOtherUser = (chat: Chat) => {
    if (chat.user1Name === currentUserFullName) {
      return {
        id: chat.user2Id,
        name: chat.user2Name,
        role: chat.user2Role
      };
    } else if (chat.user2Name === currentUserFullName) {
      return {
        id: chat.user1Id,
        name: chat.user1Name,
        role: chat.user1Role
      };
    }
    // Fallback nếu không khớp với fullName từ token
    return chat.user1Id === currentUserId ? 
      { 
        id: chat.user2Id,
        name: chat.user2Name, 
        role: chat.user2Role 
      } :
      { 
        id: chat.user1Id,
        name: chat.user1Name, 
        role: chat.user1Role 
      };
  };

  // Hàm scroll xuống cuối tin nhắn - chỉ trong khung chat
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Scroll xuống khi có tin nhắn mới
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [newMessage]);

  // Fetch my chats - chỉ load một lần
  useEffect(() => {
    const fetchMyChats = async () => {
      try {
        const response = await fetch('https://terarium.shop/api/Chat/my-chats', {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const result: ApiResponse<Chat[]> = await response.json();
          const sortedChats = result.data.sort((a, b) => {
            const timeA = new Date(a.updatedAt || a.createdAt).getTime();
            const timeB = new Date(b.updatedAt || b.createdAt).getTime();
            return timeB - timeA;
          });
          setMyChats(sortedChats);
          setHasLoadedChats(true);
        } else {
          setHasLoadedChats(true);
        }
      } catch (error) {
        console.error('Error fetching chats:', error);
        setHasLoadedChats(true);
      }
    };

    fetchMyChats();
    const chatListInterval = setInterval(fetchMyChats, 30000);
    return () => clearInterval(chatListInterval);
  }, []);

  // Fetch danh sách staff - chỉ gọi khi đã load chats và không có chat nào
  useEffect(() => {
    const fetchAvailableUsers = async () => {
      if (!hasLoadedChats || myChats.length > 0) {
        return;
      }

      try {
        const response = await fetch('https://terarium.shop/api/Chat/available-users', {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const result: ApiResponse<User[]> = await response.json();
          const staffOnly = result.data.filter(user => 
            user.roleName === 'Staff' || user.roleName === 'Manager'
          );
          setStaffUsers(staffOnly);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchAvailableUsers();
  }, [hasLoadedChats, myChats.length]);

  const handleOpenChat = async (chat: Chat) => {
    setSelectedChat(chat);
    await fetchMessages(chat.chatId);
    await markChatAsRead(chat.chatId);
    startMessagePolling(chat.chatId);
  };

  // Tạo hoặc mở chat với staff
  const handleChatWithStaff = async (staff: User) => {
    setLoading(true);
    try {
      if (staff.hasExistingChat && staff.existingChatId) {
        await openExistingChat(staff.existingChatId);
      } else {
        const response = await fetch('https://terarium.shop/api/Chat/create', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            targetUserId: staff.userId
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.data && result.data.chatId) {
            await openExistingChat(result.data.chatId);
            await refreshMyChats();
          }
        }
      }
    } catch (error) {
      console.error('Error creating/opening chat:', error);
    } finally {
      setLoading(false);
    }
  };

  // Hàm refresh danh sách chats
  const refreshMyChats = async () => {
    try {
      const response = await fetch('https://terarium.shop/api/Chat/my-chats', {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result: ApiResponse<Chat[]> = await response.json();
        const sortedChats = result.data.sort((a, b) => {
          const timeA = new Date(a.updatedAt || a.createdAt).getTime();
          const timeB = new Date(b.updatedAt || b.createdAt).getTime();
          return timeB - timeA;
        });
        setMyChats(sortedChats);
      }
    } catch (error) {
      console.error('Error refreshing chats:', error);
    }
  };

  // Mở chat đã có
  const openExistingChat = async (chatId: number) => {
    try {
      const chat = myChats.find(c => c.chatId === chatId);
      
      if (chat) {
        setSelectedChat(chat);
        await fetchMessages(chatId);
        await markChatAsRead(chatId);
        startMessagePolling(chatId);
      }
    } catch (error) {
      console.error('Error opening chat:', error);
    }
  };

  const fetchMessages = async (chatId: number) => {
    try {
      const response = await fetch(`https://terarium.shop/api/Chat/${chatId}/messages?page=1&pageSize=50`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result: ApiResponse<Message[]> = await response.json();
        const sortedMessages = result.data.sort((a, b) => 
          new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
        );
        setMessages(sortedMessages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || loading) return;

    const tempMessage: Message = {
      messageId: Date.now(),
      chatId: selectedChat.chatId,
      senderId: currentUserId,
      senderName: currentUserFullName || 'Bạn',
      senderRole: 'Customer',
      content: newMessage.trim(),
      sentAt: new Date().toISOString(),
      isRead: false,
      isDeleted: false
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    setLoading(true);

    try {
      const response = await fetch('https://terarium.shop/api/Chat/send-message', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: selectedChat.chatId,
          content: tempMessage.content
        }),
      });

      if (response.ok) {
        await fetchMessages(selectedChat.chatId);
        
        const updatedChats = myChats.map(chat => {
          if (chat.chatId === selectedChat.chatId) {
            return {
              ...chat,
              updatedAt: new Date().toISOString(),
              lastMessage: tempMessage
            };
          }
          return chat;
        });
        
        const sortedChats = updatedChats.sort((a, b) => {
          const timeA = new Date(a.updatedAt || a.createdAt).getTime();
          const timeB = new Date(b.updatedAt || b.createdAt).getTime();
          return timeB - timeA;
        });
        
        setMyChats(sortedChats);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(msg => msg.messageId !== tempMessage.messageId));
    } finally {
      setLoading(false);
    }
  };

  const markChatAsRead = async (chatId: number) => {
    try {
      await fetch(`https://terarium.shop/api/Chat/${chatId}/mark-read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Error marking chat as read:', error);
    }
  };

  const startMessagePolling = (chatId: number) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      fetchMessages(chatId);
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [selectedChat]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleBackToChatList = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setSelectedChat(null);
    setMessages([]);
  };

  // Cập nhật hàm formatTime để sử dụng múi giờ Việt Nam
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Ho_Chi_Minh'
    });
  };

  // Cập nhật hàm formatChatTime để sử dụng múi giờ Việt Nam
  const formatChatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // Chuyển đổi sang múi giờ Việt Nam
    const vnDate = new Date(date.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}));
    const vnNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}));
    
    const diffTime = vnNow.getTime() - vnDate.getTime();
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Vừa xong';
    if (diffMinutes < 60) return `${diffMinutes}p`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays} ngày`;
    
    return vnDate.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      timeZone: 'Asia/Ho_Chi_Minh'
    });
  };

  const getUnreadCount = (chat: Chat) => {
    return chat.lastMessage && !chat.lastMessage.isRead && chat.lastMessage.senderId !== currentUserId ? 1 : 0;
  };

  const isOnline = (userId: number) => {
    return onlineUsers.has(userId);
  };

  // Hàm kiểm tra tin nhắn có phải của user hiện tại không
  const isMyMessage = (message: Message) => {
    return currentUserFullName && message.senderName === currentUserFullName;
  };

  const filteredChats = myChats.filter(chat => {
    const displayName = getChatDisplayName(chat);
    return displayName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredStaff = staffUsers.filter(staff =>
    staff.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!hasLoadedChats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (selectedChat) {
    const otherUser = getOtherUser(selectedChat);

    return (
      <div className="flex h-screen bg-white">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-gray-900">Chats</h2>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
                  <PlusOutlined className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
                  <EllipsisOutlined className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="relative">
              <SearchOutlined className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm kiếm trong Messenger"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full border-none outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
          
          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {filteredChats.map((chat) => {
              const otherUserInList = getOtherUser(chat);
              const displayName = getChatDisplayName(chat);
              const unreadCount = getUnreadCount(chat);
              
              return (
                <div
                  key={chat.chatId}
                  onClick={() => handleOpenChat(chat)}
                  className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedChat?.chatId === chat.chatId ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    {isOnline(otherUserInList.id) && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 ml-3 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 truncate text-sm">
                        {displayName}
                      </h3>
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {formatChatTime(chat.updatedAt || chat.createdAt)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1 min-w-0 flex-1">
                        {chat.lastMessage && (
                          <>
                            {chat.lastMessage.senderId === currentUserId && (
                              <div className="flex-shrink-0">
                                <CheckOutlined className={`w-3 h-3 ${
                                  chat.lastMessage.isRead ? 'text-blue-500' : 'text-gray-400'
                                }`} />
                              </div>
                            )}
                            <span className={`text-sm truncate ${
                              unreadCount > 0 ? 'text-gray-900 font-semibold' : 'text-gray-600'
                            }`}>
                              {chat.lastMessage.content}
                            </span>
                          </>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <div className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                          {unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Available Staff for New Chats */}
            {filteredStaff.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-t">
                  Staff có sẵn
                </div>
                {filteredStaff.map((staff) => (
                  <div
                    key={`staff-${staff.userId}`}
                    onClick={() => handleChatWithStaff(staff)}
                    className="flex items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                        {staff.fullName.charAt(0).toUpperCase()}
                      </div>
                      {staff.status === 'Active' && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 ml-3 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate text-sm">
                        {staff.fullName}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{staff.roleName}</span>
                        {!staff.hasExistingChat && (
                          <span className="text-xs text-blue-600 font-medium">Chat mới</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleBackToChatList}
                  className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                >
                  <ArrowLeftOutlined className="w-5 h-5" />
                </button>
                
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {otherUser.name.charAt(0).toUpperCase()}
                  </div>
                  {isOnline(otherUser.id) && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900">{otherUser.name}</h3>
                  <p className="text-xs text-gray-500">{otherUser.role}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 bg-gray-50"
            >
            <div className="max-w-4xl mx-auto">
              {messages.map((message, index) => {
                const messageIsMyMessage = isMyMessage(message);
                const nextMessage = messages[index + 1];
                const isLastInGroup = !nextMessage || 
                  nextMessage.senderName !== message.senderName ||
                  (new Date(nextMessage.sentAt).getTime() - new Date(message.sentAt).getTime()) > 300000;

                return (
                  <div
                    key={message.messageId}
                    className={`flex ${messageIsMyMessage ? 'justify-end' : 'justify-start'} ${
                      index === 0 || messages[index - 1].senderName !== message.senderName ? 'mt-4' : 'mt-1'
                    }`}
                  >
                    <div className={`max-w-xs lg:max-w-md ${messageIsMyMessage ? 'order-2' : 'order-1'}`}>
                      {!messageIsMyMessage && (index === 0 || messages[index - 1].senderName !== message.senderName) && (
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                            {message.senderName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs text-gray-600 font-medium">{message.senderName}</span>
                        </div>
                      )}
                      
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          messageIsMyMessage
                            ? 'bg-green-600 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        } ${
                          isLastInGroup 
                            ? messageIsMyMessage ? 'rounded-br-md' : 'rounded-bl-md'
                            : ''
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      </div>
                      
                      {isLastInGroup && (
                        <div className={`flex items-center space-x-1 mt-1 ${
                          messageIsMyMessage ? 'justify-end' : 'justify-start'
                        }`}>
                          <span className="text-xs text-gray-500">
                            {formatTime(message.sentAt)}
                          </span>
                          {messageIsMyMessage && (
                            <CheckOutlined className={`w-3 h-3 ${
                              message.isRead ? 'text-green-500' : 'text-gray-400'
                            }`} />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {isTyping && (
                <div className="flex justify-start mt-4">
                  <div className="bg-white rounded-2xl px-4 py-3 border border-gray-200">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input */}
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-end space-x-3">
                <button className="p-2 text-green-600 hover:bg-green-50 rounded-full flex-shrink-0">
                  <PlusOutlined className="w-5 h-5" />
                </button>
                
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Aa"
                    className="w-full px-4 py-2 bg-gray-100 rounded-2xl border-none outline-none focus:bg-white focus:ring-2 focus:ring-green-500 resize-none max-h-32 text-sm"
                    rows={1}
                    disabled={loading}
                  />
                  <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-600">
                    <SmileOutlined className="w-5 h-5" />
                  </button>
                </div>
                
                {newMessage.trim() ? (
                  <button
                    onClick={handleSendMessage}
                    disabled={loading}
                    className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    <SendOutlined className="w-5 h-5" />
                  </button>
                ) : (
                  <button className="p-2 text-green-600 hover:bg-green-50 rounded-full flex-shrink-0">
                    <div className="w-5 h-5 bg-green-600 rounded-full"></div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main chat list view (when no chat is selected)
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-sm">
          {/* Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <MessageOutlined className="text-2xl text-green-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Trò chuyện với Staff</h1>
                  <p className="text-gray-600">Liên hệ với đội ngũ hỗ trợ</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/customer-dashboard')}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ← Quay lại Dashboard
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-6 border-b border-gray-200">
            <div className="relative max-w-md">
              <SearchOutlined className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
              />
            </div>
          </div>

          {/* Existing Chats */}
          {myChats.length > 0 && (
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cuộc trò chuyện của bạn</h3>
              <div className="grid gap-1 max-w-3xl">
                {filteredChats.map((chat) => {
                  const otherUser = getOtherUser(chat);
                  const displayName = getChatDisplayName(chat);
                  const unreadCount = getUnreadCount(chat);
                  
                  return (
                    <div
                      key={chat.chatId}
                      onClick={() => handleOpenChat(chat)}
                      className="flex items-center p-4 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        {isOnline(otherUser.id) && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-3 border-white rounded-full"></div>
                        )}
                      </div>
                      
                      <div className="flex-1 ml-4 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 truncate text-lg">
                            {displayName}
                          </h3>
                          <span className="text-sm text-gray-500 flex-shrink-0 ml-3">
                            {formatChatTime(chat.updatedAt || chat.createdAt)}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                            <span className="text-sm text-gray-500 px-2 py-1 bg-gray-100 rounded-full">
                              {otherUser.role}
                            </span>
                            {chat.lastMessage && (
                              <>
                                {chat.lastMessage.senderId === currentUserId && (
                                  <CheckOutlined className={`w-4 h-4 flex-shrink-0 ${
                                    chat.lastMessage.isRead ? 'text-green-500' : 'text-gray-400'
                                  }`} />
                                )}
                                <span className={`text-gray-600 truncate ${
                                  unreadCount > 0 ? 'font-semibold text-gray-900' : ''
                                }`}>
                                  {chat.lastMessage.content}
                                </span>
                              </>
                            )}
                          </div>
                          {unreadCount > 0 && (
                            <div className="w-6 h-6 bg-green-600 text-white text-sm rounded-full flex items-center justify-center flex-shrink-0 ml-3">
                              {unreadCount}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Available Staff */}
          {(myChats.length === 0 || searchTerm) && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {myChats.length === 0 ? 'Bắt đầu trò chuyện với Staff' : 'Staff có sẵn'}
              </h3>
              {filteredStaff.length === 0 && myChats.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserOutlined className="text-3xl text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Không có staff nào</h3>
                  <p className="text-gray-600">Hiện tại không có staff nào có sẵn để trò chuyện</p>
                </div>
              ) : filteredStaff.length === 0 && myChats.length > 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Không tìm thấy staff phù hợp</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-5xl">
                  {filteredStaff.map((staff) => (
                    <div
                      key={staff.userId}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer hover:border-green-300"
                      onClick={() => handleChatWithStaff(staff)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="bg-green-100 p-3 rounded-full">
                            <UserOutlined className="text-green-600 text-xl" />
                          </div>
                          {staff.status === 'Active' && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">{staff.fullName}</h3>
                          <p className="text-gray-600 text-sm">@{staff.username}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm text-gray-500 px-2 py-1 bg-gray-100 rounded-full">
                              {staff.roleName}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              staff.status === 'Active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {staff.status === 'Active' ? 'Trực tuyến' : 'Offline'}
                            </span>
                          </div>
                          {staff.hasExistingChat && (
                            <div className="mt-2">
                              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                Đã có cuộc trò chuyện
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-center">
                        <MessageOutlined className="text-green-600 mr-2" />
                        <span className="text-green-600 font-medium text-sm">
                          {staff.hasExistingChat ? 'Tiếp tục trò chuyện' : 'Bắt đầu trò chuyện'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatWithStaff;
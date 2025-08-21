import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageOutlined, 
  SendOutlined, 
  CustomerServiceOutlined,
  SearchOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
  CheckOutlined,
  EllipsisOutlined,
  PictureOutlined,
  CloseOutlined,
  SmileOutlined
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

const ImageMessage: React.FC<{ src: string; alt?: string; maxHeight?: string }> = ({ src, alt = "Shared image", maxHeight = '300px' }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  return (
    <div className="relative">
      {imageLoading && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}
      {imageError ? (
        <div className="bg-gray-100 rounded-lg p-4 text-center">
          <span className="text-gray-500 text-sm">Không thể tải hình ảnh</span>
        </div>
      ) : (
        <img 
          src={src} 
          alt={alt}
          className={`max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity ${
            imageLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={() => setImageLoading(false)}
          onError={() => {
            setImageLoading(false);
            setImageError(true);
          }}
          onClick={() => window.open(src, '_blank')}
          style={{ maxHeight }}
        />
      )}
    </div>
  );
};

const ChatWithCustomer: React.FC = () => {
  const navigate = useNavigate();
  const [myChats, setMyChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number>(1);
  const [currentUserFullName, setCurrentUserFullName] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers] = useState<Set<number>>(new Set([2, 3]));
  const [dragOver, setDragOver] = useState(false);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAuthToken = () => localStorage.getItem('authToken') || '';

  const decodeToken = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      const decoded = decodeToken(token);
      if (decoded) {
        setCurrentUserFullName(decoded.fullName || decoded.name || '');
        if (decoded.userId) setCurrentUserId(decoded.userId);
      }
    }
  }, []);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [newMessage]);

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
          const sortedChats = result.data.sort((a, b) => 
            new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
          );
          setMyChats(sortedChats);
        }
      } catch (error) {
        console.error('Error fetching chats:', error);
      }
    };

    fetchMyChats();
    const chatListInterval = setInterval(fetchMyChats, 30000);
    return () => clearInterval(chatListInterval);
  }, []);

  const handleOpenChat = async (chat: Chat) => {
    setSelectedChat(chat);
    setPendingImageUrl(null); // Reset pending image when switching chats
    await fetchMessages(chat.chatId);
    await markChatAsRead(chat.chatId);
    startMessagePolling(chat.chatId);
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
    let content = newMessage.trim();
    if (pendingImageUrl) {
      content = content ? `${content}\n${pendingImageUrl}` : pendingImageUrl;
    }
    if (!content || !selectedChat || loading) return;

    setLoading(true);
    const tempMessage: Message = {
      messageId: Date.now(),
      chatId: selectedChat.chatId,
      senderId: currentUserId,
      senderName: currentUserFullName || 'Bạn',
      senderRole: 'Staff',
      content,
      sentAt: new Date().toISOString(),
      isRead: false,
      isDeleted: false
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    setPendingImageUrl(null);

    try {
      const response = await fetch('https://terarium.shop/api/Chat/send-message', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: selectedChat.chatId,
          content
        }),
      });

      if (response.ok) {
        await fetchMessages(selectedChat.chatId);
        const updatedChats = myChats.map(chat => 
          chat.chatId === selectedChat.chatId 
            ? { ...chat, updatedAt: new Date().toISOString(), lastMessage: tempMessage }
            : chat
        );
        setMyChats(updatedChats.sort((a, b) => 
          new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
        ));
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(msg => msg.messageId !== tempMessage.messageId));
      alert('Gửi tin nhắn thất bại!');
    } finally {
      setLoading(false);
    }
  };

  const isImageUrl = (content: string) => {
    return /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(content) ||
           (content.includes('res.cloudinary.com') && content.includes('/image/upload/')) ||
           (content.startsWith('http') && (content.includes('/image/') || content.includes('image')));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    await handleImageUploadDirect(event.target.files[0]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    if (files.length > 0) await handleImageUploadDirect(files[0]);
  };

  const handleImageUploadDirect = async (file: File) => {
    if (!selectedChat || loading) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File quá lớn! Vui lòng chọn file nhỏ hơn 5MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chỉ chọn file hình ảnh!');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('File', file); // Changed from 'image' to 'File' to match server expectation

    try {
      const response = await fetch('https://terarium.shop/api/Image/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        const imageUrl = result.url;
        if (!imageUrl) throw new Error('No URL in response');
        setPendingImageUrl(imageUrl);
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Upload hình ảnh thất bại!');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Có lỗi xảy ra khi upload hình ảnh!');
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
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => fetchMessages(chatId), 3000);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleBackToChatList = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSelectedChat(null);
    setMessages([]);
    setPendingImageUrl(null);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatChatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    if (diffMinutes < 1) return 'Vừa xong';
    if (diffMinutes < 60) return `${diffMinutes}p`;
    if (diffMinutes < 24 * 60) return `${Math.floor(diffMinutes / 60)}h`;
    if (diffMinutes < 7 * 24 * 60) return `${Math.floor(diffMinutes / (24 * 60))} ngày`;
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  const getUnreadCount = (chat: Chat) => {
    return chat.lastMessage && !chat.lastMessage.isRead && chat.lastMessage.senderId !== currentUserId ? 1 : 0;
  };

  const isOnline = (userId: number) => onlineUsers.has(userId);

  const isMyMessage = (message: Message) => currentUserFullName && message.senderName === currentUserFullName;

  const filteredChats = myChats.filter(chat => {
    const otherUserName = chat.user1Id === currentUserId ? chat.user2Name : chat.user1Name;
    return otherUserName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (selectedChat) {
    const otherUser = selectedChat.user1Id === currentUserId 
      ? { id: selectedChat.user2Id, name: selectedChat.user2Name, role: selectedChat.user2Role }
      : { id: selectedChat.user1Id, name: selectedChat.user1Name, role: selectedChat.user1Role };

    return (
      <div className="flex h-screen bg-white">
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
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
          
          <div className="flex-1 overflow-y-auto">
            {filteredChats.map((chat) => {
              const otherUserInList = chat.user1Id === currentUserId 
                ? { id: chat.user2Id, name: chat.user2Name, role: chat.user2Role }
                : { id: chat.user1Id, name: chat.user1Name, role: chat.user1Role };
              
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
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      {otherUserInList.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="flex-1 ml-3 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 truncate text-sm">
                        {otherUserInList.name}
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
                              {isImageUrl(chat.lastMessage.content) ? '[Hình ảnh]' : chat.lastMessage.content}
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
          </div>
        </div>

        <div className="flex-1 flex flex-col relative">
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
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {otherUser.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">{otherUser.name}</h2>
                </div>
              </div>
            </div>
          </div>

          <div 
            ref={messagesContainerRef}
            className={`flex-1 overflow-y-auto p-4 bg-gray-50 relative ${
              dragOver ? 'bg-blue-50 border-2 border-dashed border-blue-300' : ''
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {dragOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-blue-50 bg-opacity-90 z-10">
                <div className="text-center">
                  <PictureOutlined className="text-4xl text-blue-600 mb-2" />
                  <p className="text-blue-600 font-semibold">Thả hình ảnh để gửi</p>
                </div>
              </div>
            )}
            
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
                          <div className="w-6 h-6 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                            {message.senderName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs text-gray-600 font-medium">{message.senderName}</span>
                        </div>
                      )}
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          messageIsMyMessage
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        } ${isLastInGroup ? (messageIsMyMessage ? 'rounded-br-md' : 'rounded-bl-md') : ''}`}
                      >
                        {isImageUrl(message.content) ? (
                          <ImageMessage src={message.content} alt="Shared image" />
                        ) : (
                          <p className="text-sm leading-relaxed">{message.content}</p>
                        )}
                      </div>
                      {isLastInGroup && (
                        <div className={`flex items-center space-x-1 mt-1 ${
                          messageIsMyMessage ? 'justify-end' : 'justify-start'
                        }`}>
                          <span className="text-xs text-gray-500">{formatTime(message.sentAt)}</span>
                          {messageIsMyMessage && (
                            <CheckOutlined className={`w-3 h-3 ${
                              message.isRead ? 'text-blue-500' : 'text-gray-400'
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

          <div className="bg-white border-t border-gray-200 p-4">
            <div className="max-w-4xl mx-auto">
              {pendingImageUrl && (
                <div className="mb-3 p-3 bg-gray-100 rounded-xl relative max-w-xs">
                  <ImageMessage src={pendingImageUrl} alt="Image preview" maxHeight="150px" />
                  <button 
                    onClick={() => setPendingImageUrl(null)}
                    className="absolute top-1 right-1 p-1 bg-white rounded-full text-gray-600 hover:text-red-500 shadow-sm"
                  >
                    <CloseOutlined className="w-4 h-4" />
                  </button>
                  <p className="text-xs text-gray-600 mt-1">Hình ảnh xem trước - Nhấn gửi để chia sẻ</p>
                </div>
              )}
              <div className="flex items-end space-x-3">
                <div className="flex items-center space-x-2">
                  <button 
                    className={`p-2 rounded-full flex-shrink-0 transition-colors ${
                      loading ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    title="Gửi hình ảnh"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
                    ) : (
                      <PictureOutlined className="w-5 h-5" />
                    )}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                    disabled={loading}
                  />
                  <button 
                    className={`p-2 rounded-full flex-shrink-0 transition-colors ${
                      loading ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'
                    }`}
                    disabled={loading}
                  >
                    <PlusOutlined className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Aa"
                    className="w-full px-4 py-2 bg-gray-100 rounded-2xl border-none outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 resize-none max-h-32 text-sm"
                    rows={1}
                    disabled={loading}
                  />
                  <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600">
                    <SmileOutlined className="w-5 h-5" />
                  </button>
                </div>
                {(newMessage.trim() || pendingImageUrl) ? (
                  <button
                    onClick={handleSendMessage}
                    disabled={loading}
                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  >
3                    <SendOutlined className="w-5 h-5" />
                  </button>
                ) : (
                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-full flex-shrink-0">
                    <div className="w-5 h-5 bg-blue-600 rounded-full"></div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-sm">
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <CustomerServiceOutlined className="text-2xl text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Hỗ trợ khách hàng</h1>
                  <p className="text-gray-600">Quản lý các cuộc trò chuyện với khách hàng</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/staff-dashboard')}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ← Quay lại Dashboard
              </button>
            </div>
          </div>

          <div className="p-6">
            {myChats.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justifying-center mx-auto mb-4">
                  <MessageOutlined className="text-3xl text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có tin nhắn</h3>
                <p className="text-gray-600">Khách hàng sẽ liên hệ với bạn khi cần hỗ trợ</p>
              </div>
            ) : (
              <div className="grid gap-1 max-w-3xl">
                {myChats.map((chat) => {
                  const otherUser = chat.user1Id === currentUserId 
                    ? { id: chat.user2Id, name: chat.user2Name, role: chat.user2Role }
                    : { id: chat.user1Id, name: chat.user1Name, role: chat.user1Role };
                  
                  const unreadCount = getUnreadCount(chat);
                  
                  return (
                    <div
                      key={chat.chatId}
                      onClick={() => handleOpenChat(chat)}
                      className="flex items-center p-4 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                          {otherUser.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-3 border-white rounded-full"></div>
                      </div>
                      <div className="flex-1 ml-4 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 truncate text-lg">
                            {otherUser.name}
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
                                    chat.lastMessage.isRead ? 'text-blue-500' : 'text-gray-400'
                                  }`} />
                                )}
                                <span className={`text-gray-600 truncate ${
                                  unreadCount > 0 ? 'font-semibold text-gray-900' : ''
                                }`}>
3                                  {isImageUrl(chat.lastMessage.content) ? '[Hình ảnh]' : chat.lastMessage.content}
                                </span>
                              </>
                            )}
                          </div>
                          {unreadCount > 0 && (
                            <div className="w-6 h-6 bg-blue-600 text-white text-sm rounded-full flex items-center justify-center flex-shrink-0 ml-3">
                              {unreadCount}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
5    </div>
  );
};

export default ChatWithCustomer;
'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';

interface UseSocketOptions {
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const { autoConnect = true, onConnect, onDisconnect, onError } = options;

  const connect = () => {
    console.log('🚀 [useSocket] connect() called!');
    console.log('🚀 [useSocket] Current socket state:', socketRef.current?.connected);
    
    if (socketRef.current?.connected) {
      console.log('⚠️ [useSocket] Socket already connected, skipping');
      return;
    }

    const token = Cookies.get('token');
    console.log('🔑 [useSocket] Token from cookies:', token ? 'Found ✅' : 'Not found ❌');
    
    if (!token) {
      console.error('❌ [useSocket] No authentication token found');
      setError('No authentication token found');
      return;
    }

    try {
      // Socket.IO precisa conectar na URL base, sem /api
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
      const socketUrl = apiUrl.replace('/api', ''); // Remove /api para Socket.IO
      
      console.log('🔌 [useSocket] Connecting to:', socketUrl);
      
      const socket = io(socketUrl, {
        auth: {
          token
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
      });

      socket.on('connect', () => {
        console.log('🔌 Connected to server');
        setIsConnected(true);
        setError(null);
        
        // Authenticate with user ID
        const userString = Cookies.get('user');
        if (userString) {
          try {
            const user = JSON.parse(userString);
            socket.emit('authenticate', {
              token,
              userId: user._id || user.id
            });
          } catch (e) {
            console.error('Error parsing user data:', e);
          }
        }
        
        onConnect?.();
      });

      socket.on('disconnect', (reason) => {
        console.log('🔌 Disconnected from server:', reason);
        setIsConnected(false);
        onDisconnect?.();
      });

      socket.on('connect_error', (err) => {
        console.error('❌ Connection error:', err);
        setError(err.message);
        setIsConnected(false);
        onError?.(err);
      });

      socket.on('authenticated', (data) => {
        console.log('✅ Authenticated:', data);
        setIsAuthenticated(true);
      });

      socket.on('authentication_error', (data) => {
        console.error('❌ Authentication error:', data);
        setError(data.message);
        setIsAuthenticated(false);
      });

      socket.on('joined_conversation', (data) => {
        console.log('✅ [useSocket] Successfully joined conversation:', data.conversationId);
      });

      socket.on('left_conversation', (data) => {
        console.log('👋 [useSocket] Successfully left conversation:', data.conversationId);
      });

      socketRef.current = socket;
    } catch (err: any) {
      console.error('❌ Socket initialization error:', err);
      setError(err.message);
      onError?.(err);
    }
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  };

  const emit = (event: string, data?: any) => {
    if (socketRef.current?.connected) {
      console.log(`📤 [useSocket] Emitting event: ${event}`, data);
      socketRef.current.emit(event, data);
    } else {
      console.warn(`⚠️ [useSocket] Socket not connected, cannot emit: ${event}`, {
        socketExists: !!socketRef.current,
        isConnected: socketRef.current?.connected
      });
    }
  };

  const on = (event: string, handler: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler);
      
      // Return cleanup function
      return () => {
        socketRef.current?.off(event, handler);
      };
    }
  };

  const off = (event: string, handler?: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.off(event, handler);
    }
  };

  // Join conversation room
  const joinConversation = (conversationId: string) => {
    console.log('📱 [useSocket] Attempting to join conversation:', conversationId);
    console.log('📱 [useSocket] Socket connected:', socketRef.current?.connected);
    emit('join_conversation', conversationId);
  };

  // Leave conversation room  
  const leaveConversation = (conversationId: string) => {
    console.log('🚪 [useSocket] Leaving conversation:', conversationId);
    emit('leave_conversation', conversationId);
  };

  // Typing indicators
  const startTyping = (conversationId: string) => {
    emit('typing_start', { conversationId });
  };

  const stopTyping = (conversationId: string) => {
    emit('typing_stop', { conversationId });
  };

  // Mark message as read
  const markAsRead = (conversationId: string, messageId: string) => {
    emit('mark_as_read', { conversationId, messageId });
  };

  // Request human takeover
  const requestHumanTakeover = (conversationId: string) => {
    emit('request_human_takeover', { conversationId });
  };

  // Assign conversation
  const assignConversation = (conversationId: string, assignedTo: string) => {
    emit('assign_conversation', { conversationId, assignedTo });
  };

  useEffect(() => {
    console.log('🔌 [useSocket] useEffect triggered, autoConnect:', autoConnect);
    
    if (autoConnect) {
      console.log('🔌 [useSocket] Calling connect()...');
      connect();
    }

    return () => {
      console.log('🔌 [useSocket] Cleanup: disconnecting...');
      disconnect();
    };
  }, []); // Conectar apenas uma vez

  return {
    socket: socketRef.current,
    isConnected,
    isAuthenticated,
    error,
    connect,
    disconnect,
    emit,
    on,
    off,
    joinConversation,
    leaveConversation,
    startTyping,
    stopTyping,
    markAsRead,
    requestHumanTakeover,
    assignConversation
  };
};
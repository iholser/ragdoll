import { create } from 'zustand';
import { ChatMessage, UploadProgress } from '../types';

interface ChatStore {
  // State
  messages: ChatMessage[];
  isLoading: boolean;
  conversationId: string | null;
  uploadProgress: UploadProgress[];
  
  // Actions
  addMessage: (message: ChatMessage) => void;
  setLoading: (loading: boolean) => void;
  setConversationId: (id: string) => void;
  clearMessages: () => void;
  addUploadProgress: (progress: UploadProgress) => void;
  updateUploadProgress: (fileId: string, updates: Partial<UploadProgress>) => void;
  removeUploadProgress: (fileId: string) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  // Initial state
  messages: [],
  isLoading: false,
  conversationId: null,
  uploadProgress: [],
  
  // Actions
  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },
  
  setLoading: (loading) => {
    set({ isLoading: loading });
  },
  
  setConversationId: (id) => {
    set({ conversationId: id });
  },
  
  clearMessages: () => {
    set({ messages: [], conversationId: null });
  },
  
  addUploadProgress: (progress) => {
    set((state) => ({
      uploadProgress: [...state.uploadProgress, progress],
    }));
  },
  
  updateUploadProgress: (fileId, updates) => {
    set((state) => ({
      uploadProgress: state.uploadProgress.map((item) =>
        item.file.name === fileId ? { ...item, ...updates } : item
      ),
    }));
  },
  
  removeUploadProgress: (fileId) => {
    set((state) => ({
      uploadProgress: state.uploadProgress.filter((item) => item.file.name !== fileId),
    }));
  },
}));

// Selectors
export const useMessages = () => useChatStore((state) => state.messages);
export const useIsLoading = () => useChatStore((state) => state.isLoading);
export const useConversationId = () => useChatStore((state) => state.conversationId);
export const useUploadProgress = () => useChatStore((state) => state.uploadProgress);

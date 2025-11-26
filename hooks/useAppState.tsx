import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { createContext, useContext, useState } from 'react';
import { Alert, Platform } from 'react-native';

// ==========================================
// CONFIGURATION
// ==========================================
// Android Emulator uses 10.0.2.2, iOS uses localhost.
// If using a physical device, use your computer's LAN IP (e.g., http://192.168.1.5:8000/api)
const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000/api' : 'http://127.0.0.1:8000/api';
const GEMINI_API_KEY = ""; // 🔴 PASTE YOUR GOOGLE GEMINI API KEY HERE

// ==========================================
// 1. API UTILITIES (Gemini & Laravel)
// ==========================================

// Call Gemini for "Vibe Checks" and "Rizz Lines"
export const callGemini = async (prompt: string) => {
  if (!GEMINI_API_KEY) return "Please set API Key in hooks/useAppState.tsx";
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "AI Error";
  } catch (error) {
    return "AI Offline";
  }
};

export const queryClient = new QueryClient();

// Fetch Profiles from Laravel Backend
export const fetchProfiles = async (token: string | null) => {
  if (!token) return []; // Return empty if not logged in
  
  try {
    const response = await fetch(`${BASE_URL}/profiles`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch profiles');
    const data = await response.json();
    return data.data || []; // Laravel pagination returns data in 'data' key
  } catch (e) {
    console.error("Fetch Profiles Error:", e);
    return [];
  }
};

// ==========================================
// 2. CONTEXT SETUP (Global State)
// ==========================================

const AppContext = createContext<any>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  // State
  const [likedProfiles, setLikedProfiles] = useState<any[]>([]);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);

  // --- Authentication Actions ---

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setUserToken(data.access_token);
        setUserData(data.user);
        return true;
      } else {
        Alert.alert('Login Failed', data.message || 'Check credentials');
        return false;
      }
    } catch (error) {
      Alert.alert('Network Error', 'Could not connect to server. Is Laravel running?');
      return false;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      
      const data = await response.json();

      if (response.ok) {
        setUserToken(data.access_token);
        setUserData(data.user);
        return true;
      } else {
        Alert.alert('Registration Failed', data.message || 'Invalid data');
        return false;
      }
    } catch (error) {
      Alert.alert('Network Error', 'Could not connect to server. Is Laravel running?');
      return false;
    }
  };

  const logout = () => {
    setUserToken(null);
    setUserData(null);
    setLikedProfiles([]);
  };

  return (
    
    <AppContext.Provider value={{ 
      // State
      likedProfiles, 
      setLikedProfiles, 
      userToken, 
      userData, 
      // Actions
      login, 
      register, 
      logout 
    }}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </AppContext.Provider>
  );
};

// Custom Hook for accessing state anywhere
export const useAppState = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppState must be used within an <AppProvider>. Check your _layout.tsx.");
  }
  return context;
};
import { Tabs } from 'expo-router';
import { Flame, Star } from 'lucide-react-native';
import React from 'react';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#ec4899', // Tinder Pink
        tabBarInactiveTintColor: '#d1d5db',
        tabBarStyle: {
          height: Platform.OS === 'android' ? 60 : 90,
          paddingTop: 10,
          paddingBottom: Platform.OS === 'android' ? 10 : 30,
          borderTopWidth: 1,
          borderTopColor: '#f3f4f6',
          elevation: 0, // Remove shadow on Android for cleaner look
          shadowOpacity: 0, // Remove shadow on iOS
        },
        tabBarShowLabel: false,
      }}>
      
      {/* 1. Home Tab (Flame) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Flame size={28} color={color} fill={color === '#ec4899' ? color : 'none'} />,
        }}
      />

      {/* 2. Liked Tab (Star) */}
      <Tabs.Screen
        name="liked"
        options={{
          title: 'Liked',
          tabBarIcon: ({ color }) => <Star size={28} color={color === '#ec4899' ? '#eab308' : color} fill={color === '#ec4899' ? '#eab308' : 'none'} />,
        }}
      />
    </Tabs>
  );
}
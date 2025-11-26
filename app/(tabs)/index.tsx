import React, { useState, useRef, useEffect, useCallback, createContext, useContext } from 'react';
import { 
  StyleSheet, View, Text, Image, Dimensions, Animated, 
  PanResponder, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, ScrollView, Platform
} from 'react-native';
// Note: We use React Context instead of Recoil here to prevent version conflicts in Expo
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, X, MapPin, Star, Flame, Sparkles, MessageCircle } from 'lucide-react-native';

// ==========================================
// 0. CONFIG & UTILS (Gemini API)
// ==========================================

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 120;
const API_KEY = ""; // 🔴 PASTE YOUR  API KEY HERE

const callGemini = async (prompt: string) => {
  if (!API_KEY) return "Set API Key in code.";
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`,
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

// ==========================================
// 1. STATE MANAGEMENT (Context API)
// ==========================================

// Context Definition
const AppContext = createContext<any>(null);

// Provider Component
const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [tab, setTab] = useState('main'); // 'main' | 'liked'
  const [likedProfiles, setLikedProfiles] = useState<any[]>([]);

  return (
    <AppContext.Provider value={{ tab, setTab, likedProfiles, setLikedProfiles }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom Hook
const useAppState = () => useContext(AppContext);

// ==========================================
// 2. REACT QUERY (Data Fetching)
// ==========================================

const queryClient = new QueryClient();

const fetchProfiles = async () => {
  // Simulate API Network Delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // MOCK DATA (Replace with your Laravel API endpoint in the future)
  return [
    {
      id: 1,
      name: "Esther",
      age: 30,
      distance: "24km away",
      bio: "Gym rat & foodie. 🏋️‍♀️🍔 looking for someone to spot me.",
      images: [
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600&h=800",
        "https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&q=80&w=600&h=800",
      ]
    },
    {
      id: 2,
      name: "Ji-hoon",
      age: 27,
      distance: "5km away",
      bio: "Developer life. 💻 I speak Python better than English.",
      images: [
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=600&h=800",
      ]
    },
    {
      id: 3,
      name: "Min-woo",
      age: 29,
      distance: "3km away",
      bio: "Hiking on weekends. Nature lover 🌲",
      images: [
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600&h=800"
      ]
    },
    {
      id: 4,
      name: "Sarah",
      age: 24,
      distance: "8km away",
      bio: "Art student. 🎨 I will paint you like one of my french girls.",
      images: [
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600&h=800"
      ]
    }
  ];
};

// ==========================================
// 3. ATOMIC COMPONENTS
// ==========================================

const ActionButton = ({ type, onPress, size = 60 }: any) => {
  const isLike = type === 'like';
  return (
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={0.8}
      style={[
        styles.actionButton, 
        { width: size, height: size, borderColor: isLike ? '#4ade80' : '#f87171' }
      ]}
    >
      {isLike ? <Heart color="#4ade80" size={30} fill="#4ade80" /> : <X color="#f87171" size={35} strokeWidth={3} />}
    </TouchableOpacity>
  );
};

const AIButton = ({ onPress, loading, text }: any) => (
  <TouchableOpacity 
    onPress={onPress} 
    disabled={loading}
    style={styles.aiButton}
  >
    {loading ? <ActivityIndicator size="small" color="#FFF" /> : <Sparkles size={16} color="#FFF" />}
    <Text style={styles.aiButtonText}>{text}</Text>
  </TouchableOpacity>
);

// ==========================================
// 4. MOLECULES (Card Logic)
// ==========================================

const ProfileCard = ({ profile, isFirst, onSwipe }: any) => {
  // Animation Values
  const position = useRef(new Animated.ValueXY()).current;
  const [imgIndex, setImgIndex] = useState(0);
  
  // AI State
  const [vibeResult, setVibeResult] = useState<string | null>(null);
  const [loadingVibe, setLoadingVibe] = useState(false);

  // Pan Responder for Gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          forceSwipe('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          forceSwipe('left');
        } else {
          resetPosition();
        }
      }
    })
  ).current;

  const forceSwipe = (direction: string) => {
    const x = direction === 'right' ? SCREEN_WIDTH + 100 : -SCREEN_WIDTH - 100;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: 250,
      useNativeDriver: false
    }).start(() => onSwipe(direction));
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 4,
      useNativeDriver: false
    }).start();
  };

  const handleVibeCheck = async () => {
    setLoadingVibe(true);
    const res = await callGemini(`Humorous 1-sentence vibe check for dating profile: ${profile.name}, Bio: ${profile.bio}`);
    setVibeResult(res);
    setLoadingVibe(false);
  };

  // Interpolations for rotation and opacity
  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp'
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 4],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });

  const cardStyle = {
    transform: isFirst ? [...position.getTranslateTransform(), { rotate }] : [{ scale: 0.95 }],
    opacity: isFirst ? 1 : 0.5,
    top: isFirst ? 0 : 10,
    zIndex: isFirst ? 10 : 0,
  };

  // Image Navigation
  const nextImg = () => { if (imgIndex < profile.images.length - 1) setImgIndex(i => i + 1); };
  const prevImg = () => { if (imgIndex > 0) setImgIndex(i => i - 1); };

  if (!profile) return null;

  return (
    <Animated.View 
      style={[styles.cardContainer, cardStyle]} 
      {...(isFirst ? panResponder.panHandlers : {})}
    >
      {/* Stamps */}
      {isFirst && (
        <>
          <Animated.View style={[styles.stamp, styles.stampLike, { opacity: likeOpacity }]}>
            <Text style={styles.stampTextLike}>LIKE</Text>
          </Animated.View>
          <Animated.View style={[styles.stamp, styles.stampNope, { opacity: nopeOpacity }]}>
            <Text style={styles.stampTextNope}>NOPE</Text>
          </Animated.View>
        </>
      )}

      {/* Image Area */}
      <View style={{ flex: 1, position: 'relative' }}>
        <Image source={{ uri: profile.images[imgIndex] }} style={styles.cardImage} />
        
        {/* Vibe Check Bubble */}
        {vibeResult && (
          <View style={styles.vibeBubble}>
            <View style={{flexDirection:'row', alignItems:'flex-start', gap: 8}}>
              <Sparkles size={16} color="#7c3aed" style={{marginTop: 4}}/>
              <Text style={styles.vibeText}>{vibeResult}</Text>
              <TouchableOpacity onPress={() => setVibeResult(null)}>
                <X size={16} color="#999" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Tappable Areas for Image Nav */}
        <View style={styles.touchAreaContainer}>
          <TouchableOpacity style={styles.touchArea} onPress={prevImg} />
          <TouchableOpacity style={styles.touchArea} onPress={nextImg} />
        </View>

        {/* Pagination Dots */}
        <View style={styles.paginationRow}>
          {profile.images.map((_: any, i: number) => (
            <View key={i} style={[styles.paginationDot, i === imgIndex ? styles.paginationDotActive : styles.paginationDotInactive]} />
          ))}
        </View>

        {/* Gradient & Info */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.9)']}
          style={styles.cardGradient}
        >
          <View>
            <Text style={styles.cardName}>{profile.name}, <Text style={styles.cardAge}>{profile.age}</Text></Text>
            <View style={styles.cardDistanceRow}>
              <MapPin size={14} color="#FFF" />
              <Text style={styles.cardDistance}>{profile.distance}</Text>
            </View>
            <Text numberOfLines={2} style={styles.cardBio}>{profile.bio}</Text>
            
            <View style={{ marginTop: 12 }}>
               <AIButton text="Vibe Check" onPress={handleVibeCheck} loading={loadingVibe} />
            </View>
          </View>
        </LinearGradient>
      </View>
    </Animated.View>
  );
};

// ==========================================
// 5. ORGANISMS (Screens)
// ==========================================

const MainScreen = () => {
  const { data: profiles, isLoading } = useQuery({ queryKey: ['profiles'], queryFn: fetchProfiles });
  const [deck, setDeck] = useState<any[]>([]);
  
  // Use Context
  const { setLikedProfiles } = useAppState();

  // Sync React Query data to local deck state
  useEffect(() => {
    if (profiles) setDeck(profiles);
  }, [profiles]);

  const handleSwipe = useCallback((direction: string) => {
    const currentProfile = deck[0];
    if (direction === 'right') {
      setLikedProfiles((prev: any) => [currentProfile, ...prev]);
    }
    setDeck(prev => prev.slice(1));
  }, [deck, setLikedProfiles]);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ec4899" />
        <Text style={{color:'#888', marginTop: 10}}>Finding matches...</Text>
      </View>
    );
  }

  if (deck.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.emptyIcon}>
          <Flame size={40} color="#ddd" />
        </View>
        <Text style={{color:'#666', fontWeight:'600'}}>No more profiles nearby.</Text>
      </View>
    );
  }

  // Render Stack (Reverse order so first index is on top)
  return (
    <View style={styles.mainContainer}>
      {deck.map((profile, index) => {
        if (index > 1) return null; // Only render top 2 for performance
        return (
          <ProfileCard 
            key={profile.id}
            profile={profile}
            isFirst={index === 0}
            onSwipe={handleSwipe}
          />
        );
      }).reverse()}

      {/* Floating Buttons */}
      <View style={styles.buttonRow}>
        <ActionButton type="nope" onPress={() => handleSwipe('left')} />
        <ActionButton type="like" onPress={() => handleSwipe('right')} />
      </View>
    </View>
  );
};

const LikedScreen = () => {
  const { likedProfiles } = useAppState();
  const [rizzLines, setRizzLines] = useState<Record<number, string>>({});
  const [loadingRizz, setLoadingRizz] = useState<number | null>(null);

  const handleRizz = async (profile: any) => {
    setLoadingRizz(profile.id);
    const res = await callGemini(`Generate a pick-up line for: ${profile.bio}`);
    setRizzLines(prev => ({ ...prev, [profile.id]: res }));
    setLoadingRizz(null);
  };

  return (
    <View style={styles.screenContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Liked Opponents</Text>
        <Text style={styles.headerCount}>{likedProfiles.length}</Text>
      </View>
      
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {likedProfiles.length === 0 ? (
          <View style={{ marginTop: 100, alignItems: 'center' }}>
            <Text style={{ color: '#aaa' }}>No likes yet. Start swiping!</Text>
          </View>
        ) : (
          likedProfiles.map((p: any) => (
            <View key={p.id} style={styles.matchCard}>
              <Image source={{ uri: p.images[0] }} style={styles.matchImage} />
              <View style={styles.matchInfo}>
                <Text style={styles.matchName}>{p.name}, {p.age}</Text>
                <Text numberOfLines={1} style={styles.matchBio}>{p.bio}</Text>
                
                <View style={{ alignItems: 'flex-start', marginTop: 8 }}>
                  <AIButton 
                    text="Rizz Me Up" 
                    onPress={() => handleRizz(p)} 
                    loading={loadingRizz === p.id} 
                  />
                </View>

                {rizzLines[p.id] && (
                  <View style={styles.rizzBox}>
                    <Text style={styles.rizzText}>"{rizzLines[p.id]}"</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

// ==========================================
// 6. MAIN APP ENTRY
// ==========================================

const AppContent = () => {
  const { tab, setTab } = useAppState();
  const [splash, setSplash] = useState(true);

  useEffect(() => {
    setTimeout(() => setSplash(false), 2000);
  }, []);

  if (splash) {
    return (
      <LinearGradient colors={['#ec4899', '#f97316']} style={styles.splashContainer}>
        <View style={styles.splashIcon}>
          <Flame size={50} color="#ec4899" fill="#ec4899" />
        </View>
        <Text style={styles.splashText}>TINDER</Text>
      </LinearGradient>
    );
  }

  return (
    <SafeAreaView style={styles.appContainer}>
      <StatusBar barStyle="dark-content" />
      
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 5}}>
          <Flame color="#ec4899" fill="#ec4899" size={24} />
          <Text style={styles.topHeaderTitle}>tinder</Text>
        </View>
      </View>

      {/* Screen Content */}
      <View style={{ flex: 1 }}>
        {tab === 'main' ? <MainScreen /> : <LikedScreen />}
      </View>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => setTab('main')} style={styles.navItem}>
          <Flame size={28} color={tab === 'main' ? '#ec4899' : '#d1d5db'} fill={tab === 'main' ? '#ec4899' : 'none'} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('liked')} style={styles.navItem}>
          <Star size={28} color={tab === 'liked' ? '#eab308' : '#d1d5db'} fill={tab === 'liked' ? '#eab308' : 'none'} />
        </TouchableOpacity>
        {/* Disabled Tabs */}
        <View style={styles.navItemDisabled}><MessageCircle size={28} color="#e5e7eb" /></View>
      </View>
    </SafeAreaView>
  );
};

// Default export for Expo Router
export default function App() {
  return (
    <AppProvider>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </AppProvider>
  );
}

// ==========================================
// 7. STYLES
// ==========================================

const styles = StyleSheet.create({
  // Containers
  appContainer: { flex: 1, backgroundColor: '#f3f4f6', paddingTop: Platform.OS === 'android' ? 30 : 0 },
  splashContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mainContainer: { flex: 1, alignItems: 'center', marginHorizontal: 10, marginTop: 10 },
  screenContainer: { flex: 1, backgroundColor: '#FFF' },

  // Header
  topHeader: { height: 50, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  topHeaderTitle: { fontSize: 24, fontWeight: '800', color: '#1f2937', letterSpacing: -1 },

  // Splash
  splashIcon: { width: 100, height: 100, backgroundColor: '#FFF', borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  splashText: { fontSize: 32, fontWeight: 'bold', color: '#FFF', letterSpacing: 4 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },

  // Card
  cardContainer: { width: SCREEN_WIDTH - 20, height: '82%', borderRadius: 20, position: 'absolute', backgroundColor: '#000', shadowColor: "#000", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 8 },
  cardImage: { width: '100%', height: '100%', borderRadius: 20 },
  cardGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', justifyContent: 'flex-end', padding: 20, borderRadius: 20 },
  
  // Card Text
  cardName: { fontSize: 32, fontWeight: '800', color: '#FFF' },
  cardAge: { fontSize: 24, fontWeight: '400' },
  cardDistanceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  cardDistance: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  cardBio: { fontSize: 14, color: '#e5e7eb', marginTop: 8 },

  // Interactive Elements
  touchAreaContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row' },
  touchArea: { flex: 1 },
  paginationRow: { position: 'absolute', top: 10, left: 10, right: 10, flexDirection: 'row', gap: 4 },
  paginationDot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' },
  paginationDotActive: { backgroundColor: '#FFF' },
  paginationDotInactive: { backgroundColor: 'rgba(255,255,255,0.3)' },

  // Buttons
  buttonRow: { position: 'absolute', bottom: 20, flexDirection: 'row', gap: 40 },
  actionButton: { backgroundColor: '#FFF', borderRadius: 50, justifyContent: 'center', alignItems: 'center', borderWidth: 1, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, elevation: 5 },
  aiButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#7c3aed', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, alignSelf: 'flex-start', gap: 6 },
  aiButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },

  // Stamps
  stamp: { position: 'absolute', top: 40, borderWidth: 4, borderRadius: 10, paddingHorizontal: 10, zIndex: 100 },
  stampLike: { borderColor: '#4ade80', left: 40, transform: [{ rotate: '-15deg' }] },
  stampNope: { borderColor: '#f87171', right: 40, transform: [{ rotate: '15deg' }] },
  stampTextLike: { color: '#4ade80', fontSize: 32, fontWeight: '900', letterSpacing: 2 },
  stampTextNope: { color: '#f87171', fontSize: 32, fontWeight: '900', letterSpacing: 2 },

  // Liked Screen
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  headerCount: { marginLeft: 'auto', color: '#9ca3af' },
  matchCard: { flexDirection: 'row', marginBottom: 16, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#f3f4f6', overflow: 'hidden' },
  matchImage: { width: 100, height: 140 },
  matchInfo: { flex: 1, padding: 12 },
  matchName: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  matchBio: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  rizzBox: { marginTop: 8, padding: 8, backgroundColor: '#e0e7ff', borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#6366f1' },
  rizzText: { fontSize: 12, fontStyle: 'italic', color: '#3730a3' },

  // Vibe Bubble
  vibeBubble: { position: 'absolute', top: 60, left: 20, right: 20, backgroundColor: 'rgba(255,255,255,0.95)', padding: 12, borderRadius: 12, zIndex: 50, borderLeftWidth: 4, borderLeftColor: '#7c3aed' },
  vibeText: { flex: 1, fontSize: 13, color: '#1f2937', fontStyle: 'italic' },

  // Nav
  bottomNav: { height: 60, flexDirection: 'row', backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#f3f4f6', justifyContent: 'space-around', alignItems: 'center' },
  navItem: { padding: 10 },
  navItemDisabled: { padding: 10, opacity: 0.5 },
});
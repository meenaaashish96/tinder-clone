import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame, Heart, LogOut, MapPin, RefreshCw, Sparkles, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  PanResponder,
  Platform,
  SafeAreaView, StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
// Updated import to use the alias '@' which is standard in Expo Router
import { callGemini, fetchProfiles, useAppState } from '@/hooks/useAppState';
import { useRouter } from 'expo-router';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 120;

// --- Components ---

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
  <TouchableOpacity onPress={onPress} disabled={loading} style={styles.aiButton}>
    {loading ? <ActivityIndicator size="small" color="#FFF" /> : <Sparkles size={16} color="#FFF" />}
    <Text style={styles.aiButtonText}>{text}</Text>
  </TouchableOpacity>
);

const TinderSplash = () => (
  <LinearGradient colors={['#ec4899', '#f97316']} style={styles.splashContainer}>
    <View style={styles.splashIcon}>
      <Flame size={50} color="#ec4899" fill="#ec4899" />
    </View>
    <Text style={styles.splashText}>tinder</Text>
  </LinearGradient>
);

const ProfileCard = ({ profile, isFirst, onSwipe }: any) => {
  const position = useRef(new Animated.ValueXY()).current;
  const [imgIndex, setImgIndex] = useState(0);
  const [vibeResult, setVibeResult] = useState<string | null>(null);
  const [loadingVibe, setLoadingVibe] = useState(false);

  // Use first image from array or the single image_url depending on API structure
  const images = profile.images && profile.images.length > 0
    ? profile.images.map((img: any) => typeof img === 'string' ? img : img.image_url)
    : [profile.image_url || "https://via.placeholder.com/400"];

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => { position.setValue({ x: gesture.dx, y: gesture.dy }); },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) forceSwipe('right');
        else if (gesture.dx < -SWIPE_THRESHOLD) forceSwipe('left');
        else resetPosition();
      }
    })
  ).current;

  const forceSwipe = (direction: string) => {
    const x = direction === 'right' ? SCREEN_WIDTH + 100 : -SCREEN_WIDTH - 100;
    Animated.timing(position, { toValue: { x, y: 0 }, duration: 250, useNativeDriver: false }).start(() => onSwipe(direction));
  };

  const resetPosition = () => {
    Animated.spring(position, { toValue: { x: 0, y: 0 }, friction: 4, useNativeDriver: false }).start();
  };

  const handleVibeCheck = async () => {
    setLoadingVibe(true);
    const res = await callGemini(`Humorous 1-sentence vibe check: ${profile.name}, Bio: ${profile.bio}`);
    setVibeResult(res);
    setLoadingVibe(false);
  };

  const rotate = position.x.interpolate({ inputRange: [-SCREEN_WIDTH/2, 0, SCREEN_WIDTH/2], outputRange: ['-10deg', '0deg', '10deg'], extrapolate: 'clamp' });
  const likeOpacity = position.x.interpolate({ inputRange: [0, SCREEN_WIDTH/4], outputRange: [0, 1], extrapolate: 'clamp' });
  const nopeOpacity = position.x.interpolate({ inputRange: [-SCREEN_WIDTH/4, 0], outputRange: [1, 0], extrapolate: 'clamp' });

  const nextImg = () => { if (imgIndex < images.length - 1) setImgIndex(i => i + 1); };
  const prevImg = () => { if (imgIndex > 0) setImgIndex(i => i - 1); };

  return (
    <Animated.View style={[styles.cardContainer, { transform: isFirst ? [...position.getTranslateTransform(), { rotate }] : [{ scale: 0.95 }], opacity: isFirst ? 1 : 0.5, top: isFirst ? 0 : 10, zIndex: isFirst ? 10 : 0 }]} {...(isFirst ? panResponder.panHandlers : {})}>
      {isFirst && (
        <>
          <Animated.View style={[styles.stamp, styles.stampLike, { opacity: likeOpacity }]}><Text style={styles.stampTextLike}>LIKE</Text></Animated.View>
          <Animated.View style={[styles.stamp, styles.stampNope, { opacity: nopeOpacity }]}><Text style={styles.stampTextNope}>NOPE</Text></Animated.View>
        </>
      )}

      <View style={{ flex: 1, position: 'relative' }}>
        <Image source={{ uri: images[imgIndex] }} style={styles.cardImage} />
        
        {vibeResult && (
          <View style={styles.vibeBubble}>
            <View style={{flexDirection:'row', gap: 8}}>
              <Sparkles size={16} color="#7c3aed" style={{marginTop:4}}/>
              <Text style={styles.vibeText}>{vibeResult}</Text>
              <TouchableOpacity onPress={() => setVibeResult(null)}><X size={16} color="#999" /></TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.touchAreaContainer}>
          <TouchableOpacity style={styles.touchArea} onPress={prevImg} />
          <TouchableOpacity style={styles.touchArea} onPress={nextImg} />
        </View>

        <View style={styles.paginationRow}>
          {images.map((_: any, i: number) => (
            <View key={i} style={[styles.paginationDot, i === imgIndex ? styles.paginationDotActive : styles.paginationDotInactive]} />
          ))}
        </View>

        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.cardGradient}>
          <View>
            <Text style={styles.cardName}>{profile.name}, <Text style={styles.cardAge}>{profile.age}</Text></Text>
            <View style={styles.cardDistanceRow}><MapPin size={14} color="#FFF" /><Text style={styles.cardDistance}>{profile.location || 'Nearby'}</Text></View>
            <Text numberOfLines={2} style={styles.cardBio}>{profile.bio}</Text>
            <View style={{ marginTop: 12 }}><AIButton text="Vibe Check" onPress={handleVibeCheck} loading={loadingVibe} /></View>
          </View>
        </LinearGradient>
      </View>
    </Animated.View>
  );
};

// --- Main Screen ---

export default function MainScreen() {
  const { userToken, setLikedProfiles, logout } = useAppState();
  const router = useRouter();
  const [isSplash, setIsSplash] = useState(true);
  
  // Check Auth & Splash Logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplash(false);
      if (!userToken) {
        router.replace('/login');
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [userToken]);

  const { data: profiles, isLoading, refetch } = useQuery({ 
    queryKey: ['profiles', userToken], 
    queryFn: () => fetchProfiles(userToken),
    enabled: !!userToken 
  });

  const [deck, setDeck] = useState<any[]>([]);

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

  if (isSplash) return <TinderSplash />;

  return (
    <SafeAreaView style={styles.appContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header is now ALWAYS visible */}
      <View style={styles.topHeader}>
        <Flame color="#ec4899" fill="#ec4899" size={28} />
        <Text style={styles.topHeaderTitle}>tinder</Text>
      </View>

      {/* Main Content */}
      <View style={styles.mainContainer}>
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#ec4899" />
          </View>
        ) : deck.length === 0 ? (
          <View style={styles.centerContainer}>
            <View style={styles.emptyIconBg}>
              <Flame size={50} color="#d1d5db" fill="#f3f4f6" />
            </View>
            <Text style={styles.emptyTitle}>No more profiles</Text>
            <Text style={styles.emptySubtitle}>Check back later for more matches.</Text>
            
            <TouchableOpacity onPress={() => refetch()} style={styles.refreshButton}>
              <RefreshCw size={20} color="#ec4899" />
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { logout(); router.replace('/login'); }} style={styles.logoutButton}>
              <LogOut size={20} color="#6b7280" />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {deck.map((profile, index) => {
              if (index > 1) return null;
              return <ProfileCard key={profile.id} profile={profile} isFirst={index === 0} onSwipe={handleSwipe} />;
            }).reverse()}
            <View style={styles.buttonRow}>
              <ActionButton type="nope" onPress={() => handleSwipe('left')} />
              <ActionButton type="like" onPress={() => handleSwipe('right')} />
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  appContainer: { flex: 1, backgroundColor: '#FFF', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  topHeader: { height: 60, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', zIndex: 50 },
  topHeaderTitle: { fontSize: 28, fontWeight: '800', color: '#ec4899', letterSpacing: -1.5, marginBottom: 4 },
  mainContainer: { flex: 1, position: 'relative' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 50 },
  
  // Empty State Styles
  emptyIconBg: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFF', borderWidth: 4, borderColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#374151', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#9ca3af', marginBottom: 30 },
  refreshButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: '#fdf2f8', borderRadius: 30 },
  refreshText: { color: '#ec4899', fontWeight: '700', fontSize: 16 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20 },
  logoutText: { color: '#6b7280', fontWeight: '600', fontSize: 14 },

  // Card Styles
  cardContainer: { width: SCREEN_WIDTH - 20, height: '85%', borderRadius: 20, position: 'absolute', alignSelf: 'center', marginTop: 10, backgroundColor: '#000', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5 },
  cardImage: { width: '100%', height: '100%', borderRadius: 20 },
  cardGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', justifyContent: 'flex-end', padding: 20, borderRadius: 20 },
  cardName: { fontSize: 32, fontWeight: '800', color: '#FFF' },
  cardAge: { fontSize: 24, fontWeight: '400' },
  cardDistanceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  cardDistance: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  cardBio: { fontSize: 14, color: '#e5e7eb', marginTop: 8 },
  touchAreaContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row' },
  touchArea: { flex: 1 },
  paginationRow: { position: 'absolute', top: 10, left: 10, right: 10, flexDirection: 'row', gap: 4 },
  paginationDot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' },
  paginationDotActive: { backgroundColor: '#FFF' },
  paginationDotInactive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  
  buttonRow: { position: 'absolute', bottom: 30, flexDirection: 'row', gap: 40, alignSelf: 'center' },
  actionButton: { backgroundColor: '#FFF', borderRadius: 50, justifyContent: 'center', alignItems: 'center', borderWidth: 1, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  aiButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#7c3aed', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, alignSelf: 'flex-start', gap: 6 },
  aiButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  stamp: { position: 'absolute', top: 40, borderWidth: 4, borderRadius: 10, paddingHorizontal: 10, zIndex: 100 },
  stampLike: { borderColor: '#4ade80', left: 40, transform: [{ rotate: '-15deg' }] },
  stampNope: { borderColor: '#f87171', right: 40, transform: [{ rotate: '15deg' }] },
  stampTextLike: { color: '#4ade80', fontSize: 32, fontWeight: '900', letterSpacing: 2 },
  stampTextNope: { color: '#f87171', fontSize: 32, fontWeight: '900', letterSpacing: 2 },
  vibeBubble: { position: 'absolute', top: 60, left: 20, right: 20, backgroundColor: 'rgba(255,255,255,0.95)', padding: 12, borderRadius: 12, zIndex: 50, borderLeftWidth: 4, borderLeftColor: '#7c3aed' },
  vibeText: { flex: 1, fontSize: 13, color: '#1f2937', fontStyle: 'italic' },
  
  splashContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  splashIcon: { width: 100, height: 100, backgroundColor: '#FFF', borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  splashText: { fontSize: 40, fontWeight: '800', color: '#FFF', letterSpacing: -1 },
});
import React, { useState } from 'react';
import { ActivityIndicator, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// We use the '@' alias which points to your project root in Expo Router
import { callGemini, useAppState } from '@/hooks/useAppState';
import { Sparkles, Star } from 'lucide-react-native';

const AIButton = ({ onPress, loading, text }: any) => (
  <TouchableOpacity onPress={onPress} disabled={loading} style={styles.aiButton}>
    {loading ? <ActivityIndicator size="small" color="#FFF" /> : <Sparkles size={16} color="#FFF" />}
    <Text style={styles.aiButtonText}>{text}</Text>
  </TouchableOpacity>
);

export default function LikedScreen() {
  const { likedProfiles } = useAppState();
  const [rizzLines, setRizzLines] = useState<Record<number, string>>({});
  const [loadingRizz, setLoadingRizz] = useState<number | null>(null);

  const handleRizz = async (profile: any) => {
    setLoadingRizz(profile.id);
    const res = await callGemini(`Generate a pick-up line for: ${profile.bio}`);
    setRizzLines(prev => ({ ...prev, [profile.id]: res }));
    setLoadingRizz(null);
  };

  // Helper to safely get the first image from the Laravel API response
  const getImage = (p: any) => {
    // Check if images array exists and has elements
    if (p.images && Array.isArray(p.images) && p.images.length > 0) {
      // Access the image_url property of the first image object
      return p.images[0].image_url;
    }
    // Fallback or direct image_url property
    return p.image_url || "https://via.placeholder.com/150";
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{flexDirection:'row', alignItems:'center', gap:5}}>
           <Star size={24} color="#eab308" fill="#eab308" />
           <Text style={styles.headerTitle}>Liked Opponents</Text>
        </View>
        <Text style={styles.headerCount}>{likedProfiles.length}</Text>
      </View>
      
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {likedProfiles.length === 0 ? (
          <View style={{ marginTop: 100, alignItems: 'center' }}>
            <Text style={{ color: '#aaa' }}>No likes yet. Start swiping!</Text>
          </View>
        ) : (
          likedProfiles.map((p: any) => (
            <View key={p.id} style={styles.matchCard}>
              <Image source={{ uri: getImage(p) }} style={styles.matchImage} />
              <View style={styles.matchInfo}>
                <Text style={styles.matchName}>{p.name}, {p.age}</Text>
                <Text numberOfLines={1} style={styles.matchBio}>{p.bio}</Text>
                
                <View style={{ alignItems: 'flex-start', marginTop: 8 }}>
                  <AIButton text="Rizz Me Up" onPress={() => handleRizz(p)} loading={loadingRizz === p.id} />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', flexDirection: 'row', alignItems: 'center', justifyContent:'space-between' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  headerCount: { color: '#9ca3af', fontWeight:'bold' },
  matchCard: { flexDirection: 'row', marginBottom: 16, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#f3f4f6', overflow: 'hidden' },
  matchImage: { width: 100, height: 140 },
  matchInfo: { flex: 1, padding: 12 },
  matchName: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  matchBio: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  rizzBox: { marginTop: 8, padding: 8, backgroundColor: '#e0e7ff', borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#6366f1' },
  rizzText: { fontSize: 12, fontStyle: 'italic', color: '#3730a3' },
  aiButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#7c3aed', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, alignSelf: 'flex-start', gap: 6 },
  aiButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
});
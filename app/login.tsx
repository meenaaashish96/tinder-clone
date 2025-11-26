import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Flame } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAppState } from '../hooks/useAppState';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAppState();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    
    if (success) {
      // Correctly navigating to the tabs route
      router.replace('/(tabs)'); 
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.iconBg}>
            <Flame size={40} color="#ec4899" fill="#ec4899" />
          </View>
          <Text style={styles.title}>tinder clone</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput 
            style={styles.input} 
            placeholder="enter your email" 
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput 
            style={styles.input} 
            placeholder="enter your password" 
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity onPress={handleLogin} disabled={loading}>
            <LinearGradient
              colors={['#ec4899', '#f97316']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>LOG IN</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/register')} style={styles.linkButton}>
            <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkBold}>Sign Up</Text></Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  content: { flex: 1, justifyContent: 'center', padding: 30 },
  logoContainer: { alignItems: 'center', marginBottom: 50 },
  iconBg: { width: 80, height: 80, backgroundColor: '#fce7f3', borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#ec4899', letterSpacing: -1 },
  form: { width: '100%' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginLeft: 4 },
  input: { backgroundColor: '#f3f4f6', padding: 16, borderRadius: 30, marginBottom: 20, fontSize: 16, color: '#1f2937' },
  button: { padding: 16, borderRadius: 30, alignItems: 'center', marginTop: 10, shadowColor: '#ec4899', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
  linkButton: { marginTop: 20, alignItems: 'center' },
  linkText: { color: '#6b7280' },
  linkBold: { color: '#ec4899', fontWeight: 'bold' },
});
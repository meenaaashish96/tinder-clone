import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAppState } from '../hooks/useAppState';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAppState();
  const router = useRouter();

  const handleRegister = async () => {
    if (!name || !email || !password) return;
    setLoading(true);
    const success = await register(name, email, password);
    setLoading(false);
    
    if (success) {
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={30} color="#374151" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Sign up to start swiping!</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput 
            style={styles.input} 
            placeholder="John Doe" 
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput 
            style={styles.input} 
            placeholder="john@example.com" 
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput 
            style={styles.input} 
            placeholder="min 8 characters" 
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity onPress={handleRegister} disabled={loading}>
            <LinearGradient
              colors={['#ec4899', '#f97316']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>SIGN UP</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { padding: 20 },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  content: { flex: 1, paddingHorizontal: 30, paddingTop: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#1f2937', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#6b7280', marginBottom: 40 },
  form: { width: '100%' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginLeft: 4 },
  input: { backgroundColor: '#f3f4f6', padding: 16, borderRadius: 30, marginBottom: 20, fontSize: 16, color: '#1f2937' },
  button: { padding: 16, borderRadius: 30, alignItems: 'center', marginTop: 10, shadowColor: '#ec4899', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
});
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";

import { useGoogleAuth } from "../hooks/useGoogleAuth";
import { colors } from "../../../theme";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

const GOOGLE_MARK = "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg";

export function LoginScreen() {
  const { isReady, promptAsync } = useGoogleAuth();
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Background with Image Overlay */}
      <Image
        source={require('../../../../assets/Personal finance savings concept with stacked coins.png')}
        style={styles.backgroundImage}
        blurRadius={8}
      />
      
      {/* Dark Overlay */}
      <LinearGradient
        colors={['rgba(18, 14, 1, 0.95)', 'rgba(0, 0, 0, 0.98)', 'rgba(18, 14, 1, 0.95)']}
        style={StyleSheet.absoluteFill}
      />

      {/* Floating Orbs */}
      <View style={[styles.orb, styles.orb1]} />
      <View style={[styles.orb, styles.orb2]} />
      <View style={[styles.orb, styles.orb3]} />
      
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoWrapper}>
              <LinearGradient
                colors={['rgba(251, 204, 51, 0.2)', 'rgba(251, 204, 51, 0.05)']}
                style={styles.logoGlow}
              />
              <Image
                source={require('../../../../assets/MOVA-logo-white.png')}
                style={styles.logo}
                resizeMode="contain"
                accessibilityLabel="MOVA Logo"
              />
              />
            </View>
            
            <View style={styles.badgeContainer}>
              <LinearGradient
                colors={['rgba(251, 204, 51, 0.15)', 'rgba(251, 204, 51, 0.05)']}
                style={styles.badge}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.badgeDot} />
                <Text style={styles.badgeText}>Trusted by 100,000+ users worldwide</Text>
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              </LinearGradient>
            </View>
          </View>

          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>
              Smart money{'\n'}
              <Text style={styles.heroGradientText}>starts here</Text>
            </Text>
            <Text style={styles.heroSubtitle}>
              Join thousands of users managing their finances smarter. Track spending, save more, and achieve your financial goals.
            </Text>
          </View>

          {/* Stats Section */}
          <View style={styles.statsSection}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>$2.5B+</Text>
              <Text style={styles.statLabel}>Managed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>100K+</Text>
              <Text style={styles.statLabel}>Active Users</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>4.9★</Text>
              <Text style={styles.statLabel}>App Rating</Text>
            </View>
          </View>

          {/* Features */}
          <View style={styles.featuresSection}>
            <View style={styles.featureRow}>
              <View style={styles.featureIconContainer}>
                <LinearGradient
                  colors={['rgba(251, 204, 51, 0.2)', 'rgba(251, 204, 51, 0.05)']}
                  style={styles.featureIconBg}
                >
                  <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
                </LinearGradient>
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Bank-grade security</Text>
                <Text style={styles.featureDescription}>256-bit encryption & biometric protection</Text>
              </View>
            </View>

            <View style={styles.featureRow}>
              <View style={styles.featureIconContainer}>
                <LinearGradient
                  colors={['rgba(251, 204, 51, 0.2)', 'rgba(251, 204, 51, 0.05)']}
                  style={styles.featureIconBg}
                >
                  <Ionicons name="analytics" size={20} color={colors.primary} />
                </LinearGradient>
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>AI-powered insights</Text>
                <Text style={styles.featureDescription}>Smart recommendations for better savings</Text>
              </View>
            </View>

            <View style={styles.featureRow}>
              <View style={styles.featureIconContainer}>
                <LinearGradient
                  colors={['rgba(251, 204, 51, 0.2)', 'rgba(251, 204, 51, 0.05)']}
                  style={styles.featureIconBg}
                >
                  <Ionicons name="flash" size={20} color={colors.primary} />
                </LinearGradient>
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Real-time sync</Text>
                <Text style={styles.featureDescription}>Instant updates across all devices</Text>
              </View>
            </View>
          </View>

          {/* CTA Section */}
          <View style={styles.ctaSection}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Continue with Google"
              disabled={!isReady}
              onPress={() => promptAsync()}
              style={({ pressed }) => [
                styles.primaryButton,
                !isReady && styles.buttonDisabled,
                pressed && styles.buttonPressed,
              ]}
            >
              <LinearGradient
                colors={[colors.primary, '#FFD966', colors.primary]}
                style={styles.primaryButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {!isReady ? (
                  <ActivityIndicator color={colors.secondary} size="small" />
                ) : (
                  <>
                    <Image source={{ uri: GOOGLE_MARK }} style={styles.googleIcon} />
                    <Text style={styles.primaryButtonText}>Continue with Google</Text>
                    <View style={styles.arrowContainer}>
                      <Ionicons name="arrow-forward" size={20} color={colors.secondary} />
                    </View>
                  </>
                )}
              </LinearGradient>
            </Pressable>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.secondaryButtonsRow}>
              <Pressable disabled style={[styles.secondaryButton, styles.buttonDisabled]}>
                <Ionicons name="logo-apple" size={24} color="rgba(255,255,255,0.3)" />
              </Pressable>
              <Pressable disabled style={[styles.secondaryButton, styles.buttonDisabled]}>
                <Ionicons name="mail-outline" size={22} color="rgba(255,255,255,0.3)" />
              </Pressable>
              <Pressable disabled style={[styles.secondaryButton, styles.buttonDisabled]}>
                <Ionicons name="call-outline" size={22} color="rgba(255,255,255,0.3)" />
              </Pressable>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing, you agree to our{' '}
              <Text style={styles.footerLink}>Terms of Service</Text> and{' '}
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundImage: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    opacity: 0.15,
  },
  
  // Floating Orbs
  orb: {
    position: 'absolute',
    borderRadius: 1000,
    opacity: 0.6,
  },
  orb1: {
    width: 300,
    height: 300,
    backgroundColor: 'rgba(251, 204, 51, 0.1)',
    top: -100,
    right: -100,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 50,
  },
  orb2: {
    width: 200,
    height: 200,
    backgroundColor: 'rgba(251, 204, 51, 0.08)',
    bottom: 100,
    left: -50,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
  },
  orb3: {
    width: 150,
    height: 150,
    backgroundColor: 'rgba(251, 204, 51, 0.06)',
    top: '40%',
    right: -30,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
  },

  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
  },

  // Logo Section
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoGlow: {
    position: 'absolute',
    width: 200,
    height: 80,
    borderRadius: 40,
  },
  logo: {
    width: 150,
    height: 50,
    zIndex: 1,
  },
  badgeContainer: {
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(251, 204, 51, 0.3)',
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Hero Section
  heroSection: {
    marginBottom: 32,
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 56,
    letterSpacing: -1,
    marginBottom: 16,
  },
  heroGradientText: {
    color: colors.primary,
  },
  heroSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 24,
  },

  // Stats Section
  statsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Features Section
  featuresSection: {
    gap: 16,
    marginBottom: 40,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  featureIconBg: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251, 204, 51, 0.2)',
    borderRadius: 24,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 18,
  },

  // CTA Section
  ctaSection: {
    gap: 20,
  },
  primaryButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  googleIcon: {
    width: 24,
    height: 24,
  },
  primaryButtonText: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: colors.secondary,
    letterSpacing: 0.5,
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(18, 14, 1, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 2,
  },

  // Secondary Buttons
  secondaryButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // States
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },

  // Footer
  footer: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    fontWeight: '700',
    color: colors.primary,
  },
});

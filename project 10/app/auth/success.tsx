import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Crown, CircleCheck as CheckCircle, Star } from 'lucide-react-native';
import CosmicBackground from '../../components/CosmicBackground';
import CosmicButton from '../../components/CosmicButton';

export default function SuccessScreen() {
  const { type } = useLocalSearchParams<{ type?: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionActive, setSubscriptionActive] = useState(false);

  const checkSubscriptionStatus = useCallback(async () => {
    try {
      console.log('[success] Checking subscription status...');
      
      // Poll up to ~10s for the DB mirror to reflect the subscription
      for (let i = 0; i < 5; i++) {
        const { getSubscriptionStatus } = await import('@/utils/billing');
        const s = await getSubscriptionStatus();
        console.log(`[success] Poll ${i + 1}/5:`, { active: s.active, status: s.status });
        
        if (s.active) {
          setSubscriptionActive(true);
          break;
        }
        
        // Wait 2 seconds before next poll
        if (i < 4) {
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    } catch (e) {
      console.error('Error checking subscription:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (type === 'subscription') {
      checkSubscriptionStatus();
    } else {
      // For one-off purchases, no need to poll
      setIsLoading(false);
    }
  }, [type, checkSubscriptionStatus]);

  const handleContinue = () => {
    router.replace('/(tabs)/horoscope');
  };

  const isSubscription = type === 'subscription';
  const isOneOff = type === 'oneoff';

  return (
    <View style={styles.container}>
      <CosmicBackground />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.successIcon}>
            <CheckCircle size={80} color="#8bc34a" />
          </View>

          <Text style={styles.title}>
            {isSubscription ? 'Welcome to Astral Plane!' : 'Purchase Complete!'}
          </Text>

          {isLoading && isSubscription ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#d4af37" />
              <Text style={styles.loadingText}>
                Activating your cosmic subscription...
              </Text>
              <Text style={styles.loadingSubtext}>
                This may take a few moments
              </Text>
            </View>
          ) : (
            <LinearGradient
              colors={['rgba(139, 195, 74, 0.2)', 'rgba(139, 195, 74, 0.1)']}
              style={styles.successCard}
            >
              {isSubscription && (
                <>
                  <View style={styles.featureHeader}>
                    <Crown size={24} color="#d4af37" />
                    <Text style={styles.featureTitle}>
                      {subscriptionActive ? 'Subscription Active!' : 'Subscription Processing'}
                    </Text>
                  </View>

                  {subscriptionActive ? (
                    <View style={styles.activeFeatures}>
                      <View style={styles.featureItem}>
                        <Star size={16} color="#8bc34a" />
                        <Text style={styles.featureText}>Daily Astral Plane insights</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <Star size={16} color="#8bc34a" />
                        <Text style={styles.featureText}>Monthly cosmic forecasts</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <Star size={16} color="#8bc34a" />
                        <Text style={styles.featureText}>Cusp-specific guidance</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <Star size={16} color="#8bc34a" />
                        <Text style={styles.featureText}>Astronomical context</Text>
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.processingText}>
                      Your subscription is being activated. You'll have access to all premium features shortly.
                    </Text>
                  )}
                </>
              )}

              {isOneOff && (
                <>
                  <View style={styles.featureHeader}>
                    <Star size={24} color="#8b9dc3" />
                    <Text style={styles.featureTitle}>Reading Purchased!</Text>
                  </View>
                  <Text style={styles.oneOffText}>
                    Your comprehensive cusp analysis is now available. Explore your detailed 
                    cosmic profile and personalized insights.
                  </Text>
                </>
              )}
            </LinearGradient>
          )}

          <CosmicButton
            title={isSubscription ? 'Explore Your Horoscope' : 'View Your Reading'}
            onPress={handleContinue}
            style={styles.continueButton}
          />

          <Text style={styles.thankYouText}>
            Thank you for joining the cosmic journey! ✨
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  successIcon: {
    marginBottom: 32,
    shadowColor: '#8bc34a',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#e8e8e8',
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: '#d4af37',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#8b9dc3',
    marginTop: 8,
    textAlign: 'center',
  },
  successCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(139, 195, 74, 0.3)',
    width: '100%',
    maxWidth: 400,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  featureTitle: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#e8e8e8',
    marginLeft: 12,
  },
  activeFeatures: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  featureText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#e8e8e8',
    marginLeft: 12,
  },
  processingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#8b9dc3',
    textAlign: 'center',
    lineHeight: 24,
  },
  oneOffText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#e8e8e8',
    textAlign: 'center',
    lineHeight: 24,
  },
  continueButton: {
    minWidth: 200,
    marginBottom: 24,
  },
  thankYouText: {
    fontSize: 16,
    fontFamily: 'Vazirmatn-Regular',
    color: '#8b9dc3',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
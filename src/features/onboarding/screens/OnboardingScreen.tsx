import { Pressable, Text, View, StyleSheet, ImageBackground, Dimensions } from "react-native";

import { colors } from "../../../theme";

interface OnboardingScreenProps {
  onComplete?: () => void;
}

const { height } = Dimensions.get("window");

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../../../assets/old-man.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        
        <View style={styles.content}>
          <View style={styles.textContainer}>
            <Text style={styles.welcomeText}>WELCOME</Text>
            <View style={styles.toContainer}>
              <View style={styles.toBox}>
                <Text style={styles.toText}>TO</Text>
              </View>
              <Text style={styles.appName}>DENARI</Text>
            </View>
            <Text style={styles.subtitle}>
              Take control of your money, track your spending, and understand your finances.
            </Text>
          </View>

          <Pressable
            onPress={onComplete}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </Pressable>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.secondary,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: height,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: height * 0.55,
    paddingBottom: 40,
  },
  textContainer: {
    alignItems: 'flex-start',
  },
  welcomeText: {
    fontSize: 52,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 3,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  toContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  toBox: {
    backgroundColor: '#FF5733',
    paddingHorizontal: 18,
    paddingVertical: 6,
    marginRight: 16,
  },
  toText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  appName: {
    fontSize: 52,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#FFFFFF',
    opacity: 0.95,
    maxWidth: '95%',
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 20,
    borderRadius: 50,
    alignItems: 'center',
    width: '100%',
    marginTop: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  buttonText: {
    color: colors.secondary,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

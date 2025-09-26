import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="reset" />
      <Stack.Screen name="success" />
      <Stack.Screen name="verify" />
      <Stack.Screen name="callback" />
    </Stack>
  );
}
// components/GlobalFontDefault.tsx
import React, { useEffect } from 'react';
import { Platform, Text, TextInput } from 'react-native';

let applied = false;

export default function GlobalFontDefault() {
  useEffect(() => {
    if (applied) return;
    applied = true;

    // Set default font for all <Text/> and <TextInput/> across the app
    const base = { fontFamily: 'Vazirmatn-Regular' as const };

    // Preserve any existing default styles
    Text.defaultProps = Text.defaultProps || {};
    Text.defaultProps.style = Array.isArray(Text.defaultProps.style)
      ? [...Text.defaultProps.style, base]
      : Text.defaultProps.style
      ? [Text.defaultProps.style, base]
      : base;

    TextInput.defaultProps = TextInput.defaultProps || {};
    TextInput.defaultProps.style = Array.isArray(TextInput.defaultProps.style)
      ? [...TextInput.defaultProps.style, base]
      : TextInput.defaultProps.style
      ? [TextInput.defaultProps.style, base]
      : base;
  }, []);

  // On web, also set a CSS baseline so any plain DOM text (outside RN components) uses Vazirmatn
  if (Platform.OS === 'web') {
    return (
      <style
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: `
            html, body, #root { font-family: Vazirmatn-Regular, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"; }
            * { font-family: Vazirmatn-Regular, inherit; }
          `,
        }}
      />
    );
  }

  return null;
}

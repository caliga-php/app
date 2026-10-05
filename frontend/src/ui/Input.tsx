import { Eye, EyeOff } from "lucide-react-native";
import { forwardRef, useState } from "react";
import { Pressable, Text, TextInput, View, type TextInputProps } from "react-native";

import { fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string | null;
  hint?: string;
  secure?: boolean;
  testID?: string;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, hint, secure, testID, style, ...rest },
  ref,
) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [hidden, setHidden] = useState(!!secure);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[styles.inputWrap, focused && styles.inputFocused, !!error && styles.inputError]}
      >
        <TextInput
          ref={ref}
          testID={testID}
          style={[styles.input, style]}
          placeholderTextColor={colors.muted}
          secureTextEntry={hidden}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCapitalize="none"
          {...rest}
        />
        {secure ? (
          <Pressable onPress={() => setHidden((v) => !v)} hitSlop={10} testID={`${testID}-toggle`}>
            {hidden ? <EyeOff size={20} color={colors.muted} /> : <Eye size={20} color={colors.muted} />}
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text style={styles.error} testID={`${testID}-error`}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
});

const useStyles = makeStyles((colors) => ({
  wrap: {
    gap: spacing.xs + 2,
  },
  label: {
    color: colors.onSurfaceSecondary,
    fontSize: fontSize.base,
    fontWeight: "600",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  inputFocused: {
    borderColor: colors.brandPrimary,
  },
  inputError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    color: colors.onSurface,
    fontSize: fontSize.lg,
    paddingVertical: spacing.md + 2,
  },
  error: {
    color: colors.error,
    fontSize: fontSize.sm,
  },
  hint: {
    color: colors.muted,
    fontSize: fontSize.sm,
  },
}));

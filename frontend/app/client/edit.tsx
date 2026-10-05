import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ApiError, messageForError } from "@/src/api/errors";
import { useClient, useUpdateClient } from "@/src/api/hooks";
import { fontSize, makeStyles, spacing, useTheme } from "@/src/theme";
import { TextField } from "@/src/ui/Input";
import { Button } from "@/src/ui/primitives";
import { LoadingState } from "@/src/ui/states";
import { useToast } from "@/src/ui/Toast";

export default function EditClient() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const client = useClient(id);
  const update = useUpdateClient(id);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (client.data) {
      setFullName(client.data.full_name ?? "");
      setEmail(client.data.email ?? "");
      setPhone(client.data.phone ?? "");
      setCompany(client.data.company_name ?? "");
    }
  }, [client.data]);

  const save = async () => {
    setErrors({});
    const body: Record<string, unknown> = {
      full_name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      company_name: company.trim(),
    };
    try {
      await update.mutateAsync(body);
      toast.show("Müşteri güncellendi", "success");
      router.back();
    } catch (e) {
      if (e instanceof ApiError && e.details) setErrors(e.details);
      toast.show(messageForError(e), "error");
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Müşteriyi Düzenle</Text>
        <Pressable onPress={() => router.back()} hitSlop={10} testID="edit-client-close">
          <X size={24} color={colors.onSurface} />
        </Pressable>
      </View>
      {client.isLoading ? (
        <LoadingState />
      ) : (
        <KeyboardAwareScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
          bottomOffset={spacing.xl}
          keyboardShouldPersistTaps="handled"
        >
          <TextField label="Ad Soyad" value={fullName} onChangeText={setFullName} error={errors.full_name} autoCapitalize="words" testID="edit-client-fullname" />
          <TextField label="E-posta" value={email} onChangeText={setEmail} keyboardType="email-address" error={errors.email} testID="edit-client-email" />
          <TextField label="Telefon" value={phone} onChangeText={setPhone} keyboardType="phone-pad" error={errors.phone} testID="edit-client-phone" />
          <TextField label="Firma Adı" value={company} onChangeText={setCompany} error={errors.company_name} autoCapitalize="words" testID="edit-client-company" />
          <View style={{ marginTop: spacing.sm }}>
            <Button label="Kaydet" icon={Check} onPress={save} loading={update.isPending} full testID="edit-client-submit" />
          </View>
        </KeyboardAwareScrollView>
      )}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { color: colors.onSurface, fontSize: fontSize.xl, fontWeight: "800" },
  content: { padding: spacing.lg, gap: spacing.lg },
}));

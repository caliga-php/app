import { useRouter } from "expo-router";
import { CircleUser, ChevronRight, KeyRound, LifeBuoy, LogOut, Plus, ServerCog, ShieldCheck, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usesNativeTabs } from "@/src/navigation";
import { useAuth, type PanelProfile } from "@/src/store/connection";
import { fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { ActionList, Sheet } from "@/src/ui/Sheet";
import { Header, Screen } from "@/src/ui/Screen";
import { Button, FieldRow } from "@/src/ui/primitives";
import { useToast } from "@/src/ui/Toast";

export default function More() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const {
    activeProfile,
    profiles,
    permissions,
    adminName,
    lockEnabled,
    setLockEnabled,
    switchProfile,
    removeProfile,
    disconnect,
    can,
  } = useAuth();

  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<PanelProfile | null>(null);
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;

  const host = activeProfile?.baseUrl.replace(/^https?:\/\//, "").replace(/\/api\/v1\/admin$/, "");

  return (
    <Screen>
      <Header title="Diğer" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomChrome + spacing["2xl"] }]} showsVerticalScrollIndicator={false}>
        {/* Active panel */}
        <View style={styles.card} testID="active-panel-card">
          <View style={styles.cardHead}>
            <View style={styles.iconBox}>
              <CircleUser size={22} color={colors.onBrandPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {adminName ?? "Admin"}
              </Text>
              <Text style={styles.cardSub} numberOfLines={1}>
                {host}
              </Text>
            </View>
          </View>
          <FieldRow label="Yetki sayısı" value={`${permissions.length}`} />
          <FieldRow label="Bağlı panel" value={host} />
        </View>

        {/* Management */}
        {can("Tickets/GetTickets") || can("Services/GetServices") ? (
          <>
            <Text style={styles.sectionLabel}>Yönetim</Text>
            <View style={styles.listCard}>
              {can("Tickets/GetTickets") ? (
                <Pressable style={styles.navRow} onPress={() => router.push("/tickets")} testID="nav-tickets">
                  <LifeBuoy size={20} color={colors.onSurfaceSecondary} />
                  <Text style={styles.navLabel}>Destek Talepleri</Text>
                  <ChevronRight size={18} color={colors.muted} />
                </Pressable>
              ) : null}
              {can("Services/GetServices") ? (
                <Pressable style={[styles.navRow, styles.navBorder]} onPress={() => router.push("/services")} testID="nav-services">
                  <ServerCog size={20} color={colors.onSurfaceSecondary} />
                  <Text style={styles.navLabel}>Hizmetler</Text>
                  <ChevronRight size={18} color={colors.muted} />
                </Pressable>
              ) : null}
            </View>
          </>
        ) : null}

        {/* Panels */}
        <Text style={styles.sectionLabel}>Paneller</Text>
        <View style={styles.listCard}>
          {profiles.map((p) => {
            const active = p.id === activeProfile?.id;
            return (
              <View key={p.id} style={styles.profileRow}>
                <Pressable style={styles.profileMain} onPress={() => switchProfile(p.id)} testID={`profile-${p.id}`}>
                  <View style={[styles.dot, { backgroundColor: active ? colors.success : colors.border }]} />
                  <Text style={styles.profileName} numberOfLines={1}>
                    {p.name}
                  </Text>
                </Pressable>
                {profiles.length > 1 ? (
                  <Pressable onPress={() => setRemoveTarget(p)} hitSlop={8} testID={`profile-remove-${p.id}`}>
                    <Trash2 size={18} color={colors.error} />
                  </Pressable>
                ) : null}
              </View>
            );
          })}
          <Pressable style={styles.addRow} onPress={() => router.push("/connect")} testID="add-panel-button">
            <Plus size={18} color={colors.brandPrimary} />
            <Text style={styles.addLabel}>Panel Ekle</Text>
          </Pressable>
        </View>

        {/* Security */}
        <Text style={styles.sectionLabel}>Güvenlik</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <ShieldCheck size={20} color={colors.onSurfaceSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.switchTitle}>Uygulama Kilidi</Text>
                <Text style={styles.switchSub}>Uygulama arka plana alındığında biyometrik doğrulama iste.</Text>
              </View>
            </View>
            <Switch
              value={lockEnabled}
              onValueChange={(v) => {
                setLockEnabled(v);
                toast.show(v ? "Uygulama kilidi açık" : "Uygulama kilidi kapalı", "success");
              }}
              trackColor={{ true: colors.brandPrimary, false: colors.border }}
              testID="lock-toggle"
            />
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <KeyRound size={18} color={colors.onBrandTertiary} />
          <Text style={styles.infoText}>
            Güvenliğiniz için admin API anahtarını düzenli aralıklarla panelden (Ayarlar → API Kimlik Bilgileri)
            yenileyin. Anahtara yalnızca ihtiyaç duyduğu izinleri verin.
          </Text>
        </View>

        <View style={styles.disconnect}>
          <Button label="Bağlantıyı Kes" variant="danger" icon={LogOut} onPress={() => setConfirmDisconnect(true)} full testID="disconnect-button" />
        </View>
      </ScrollView>

      <Sheet visible={confirmDisconnect} onClose={() => setConfirmDisconnect(false)} title="Bağlantıyı kes">
        <Text style={styles.sheetText}>
          Bu paneli kaldırmak üzeresiniz. Kayıtlı API anahtarı cihazdan silinecek. Devam edilsin mi?
        </Text>
        <ActionList
          actions={[
            {
              label: "Evet, bağlantıyı kes",
              icon: LogOut,
              tone: "error",
              testID: "confirm-disconnect",
              onPress: async () => {
                setConfirmDisconnect(false);
                await disconnect();
                router.replace("/connect");
              },
            },
          ]}
        />
      </Sheet>

      <Sheet visible={!!removeTarget} onClose={() => setRemoveTarget(null)} title="Paneli kaldır">
        <Text style={styles.sheetText}>{removeTarget?.name} panelini kaldırmak istiyor musunuz?</Text>
        <ActionList
          actions={[
            {
              label: "Kaldır",
              icon: Trash2,
              tone: "error",
              testID: "confirm-remove-profile",
              onPress: async () => {
                const target = removeTarget;
                setRemoveTarget(null);
                if (target) await removeProfile(target.id);
              },
            },
          ]}
        />
      </Sheet>
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    color: colors.onSurface,
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  cardSub: {
    color: colors.muted,
    fontSize: fontSize.sm,
  },
  sectionLabel: {
    color: colors.muted,
    fontSize: fontSize.sm,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: spacing.sm,
    marginLeft: spacing.xs,
  },
  listCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: spacing.md,
  },
  profileMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  profileName: {
    color: colors.onSurface,
    fontSize: fontSize.base,
    fontWeight: "600",
    flex: 1,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  addLabel: {
    color: colors.brandPrimary,
    fontSize: fontSize.base,
    fontWeight: "700",
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  navLabel: {
    flex: 1,
    color: colors.onSurface,
    fontSize: fontSize.base,
    fontWeight: "600",
  },
  navBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  switchText: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  switchTitle: {
    color: colors.onSurface,
    fontSize: fontSize.base,
    fontWeight: "600",
  },
  switchSub: {
    color: colors.muted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  infoCard: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.brandTertiary,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  infoText: {
    flex: 1,
    color: colors.onBrandTertiary,
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
  disconnect: {
    marginTop: spacing.sm,
  },
  sheetText: {
    color: colors.onSurfaceSecondary,
    fontSize: fontSize.base,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
}));

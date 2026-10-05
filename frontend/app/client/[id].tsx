import { useLocalSearchParams } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useClient, useClientSummary, useCurrencyCode } from "@/src/api/hooks";
import { formatDateTime, formatMoney, initials, trustScoreLabel } from "@/src/lib/format";
import { fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { Header, Screen } from "@/src/ui/Screen";
import { Avatar, Card, FieldRow, SectionTitle, StatusPill } from "@/src/ui/primitives";
import { ErrorState, LoadingState } from "@/src/ui/states";

const BADGE_LABELS: Record<string, string> = {
  loyal: "Sadık Müşteri",
  revenue: "Gelir",
  multi_service: "Çoklu Hizmet",
  experienced: "Deneyimli",
  new: "Yeni",
};

export default function ClientDetail() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const codeOf = useCurrencyCode();

  const client = useClient(id);
  const summary = useClientSummary(id);

  if (client.isLoading) {
    return (
      <Screen>
        <Header title="Müşteri" back />
        <LoadingState message="Yükleniyor..." />
      </Screen>
    );
  }
  if (client.isError || !client.data) {
    return (
      <Screen>
        <Header title="Müşteri" back />
        <ErrorState error={client.error} onRetry={() => client.refetch()} />
      </Screen>
    );
  }

  const c = client.data;
  const s = summary.data;
  const badges = s?.badges ? Object.entries(s.badges).filter(([, v]) => v) : [];

  return (
    <Screen>
      <Header title="Müşteri Detayı" back />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing["2xl"] }]} showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <View style={styles.profile}>
          <Avatar text={initials(c.full_name)} size={64} />
          <View style={styles.profileInfo}>
            <Text style={styles.name} numberOfLines={1}>
              {c.full_name}
            </Text>
            {c.company_name ? (
              <Text style={styles.company} numberOfLines={1}>
                {c.company_name}
              </Text>
            ) : null}
            <View style={styles.pillRow}>
              <StatusPill status={c.status} testID="client-status-pill" />
              {s?.trust_score ? (
                <View style={styles.trustTag}>
                  <Text style={styles.trustTagText}>Güven {s.trust_score.total}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {badges.length ? (
          <View style={styles.badgeRow}>
            {badges.map(([key, val]) => (
              <View key={key} style={styles.badge}>
                <Text style={styles.badgeText}>
                  {BADGE_LABELS[key] ?? key}
                  {typeof val === "string" ? `: ${val}` : ""}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Summary */}
        {s ? (
          <View style={styles.section}>
            <SectionTitle title="Özet" />
            <Card>
              <FieldRow label="Toplam Gelir" value={formatMoney(s.total_revenue, codeOf(s.revenue_currency))} />
              <FieldRow label="Ödenmiş Fatura" value={`${s.paid_invoices ?? 0}`} />
              <FieldRow label="Aktif Hizmet" value={`${s.active_services ?? 0}`} />
              <FieldRow label="Pasif Hizmet" value={`${s.inactive_services ?? 0}`} />
              <FieldRow label="Toplam Talep" value={`${s.total_tickets ?? 0}`} />
            </Card>
          </View>
        ) : null}

        {/* Trust score */}
        {s?.trust_score ? (
          <View style={styles.section}>
            <SectionTitle title="Güven Skoru" />
            <Card>
              <View style={styles.trustHead}>
                <Text style={styles.trustTotal}>{s.trust_score.total}</Text>
                <Text style={styles.trustLabel}>{trustScoreLabel(s.trust_score.label)}</Text>
              </View>
              <FieldRow label="Hizmetler" value={`${s.trust_score.services ?? 0}`} />
              <FieldRow label="Gelir" value={`${s.trust_score.revenue ?? 0}`} />
              <FieldRow label="Hesap Yaşı" value={`${s.trust_score.age ?? 0}`} />
              <FieldRow label="Talepler" value={`${s.trust_score.tickets ?? 0}`} />
            </Card>
          </View>
        ) : null}

        {/* Details */}
        <View style={styles.section}>
          <SectionTitle title="Bilgiler" />
          <Card>
            <FieldRow label="E-posta" value={c.email} />
            <FieldRow label="Telefon" value={c.phone} />
            <FieldRow label="Bakiye" value={formatMoney(c.balance, codeOf(c.currency_id))} />
            <FieldRow label="Dil" value={c.language?.toUpperCase()} />
            <FieldRow label="E-posta Onayı" valueNode={<VerifyText ok={c.email_verified} colors={colors} />} />
            <FieldRow label="Telefon Onayı" valueNode={<VerifyText ok={c.phone_verified} colors={colors} />} />
            <FieldRow label="Kayıt" value={formatDateTime(c.created_at)} />
            <FieldRow label="Son Giriş" value={formatDateTime(c.last_login_at)} />
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}

function VerifyText({ ok, colors }: { ok?: boolean; colors: ReturnType<typeof useTheme>["colors"] }) {
  return <Text style={{ color: ok ? colors.success : colors.muted, fontWeight: "700", fontSize: fontSize.base }}>{ok ? "Onaylı" : "Onaysız"}</Text>;
}

const useStyles = makeStyles((colors) => ({
  content: {
    padding: spacing.lg,
    gap: spacing.xl,
  },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  profileInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    color: colors.onSurface,
    fontSize: fontSize.xl,
    fontWeight: "800",
  },
  company: {
    color: colors.muted,
    fontSize: fontSize.base,
  },
  pillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  trustTag: {
    backgroundColor: colors.brandTertiary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
  },
  trustTagText: {
    color: colors.onBrandTertiary,
    fontSize: fontSize.sm,
    fontWeight: "700",
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  badge: {
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  badgeText: {
    color: colors.onSurfaceTertiary,
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  section: {
    gap: spacing.sm,
  },
  trustHead: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  trustTotal: {
    color: colors.brandPrimary,
    fontSize: fontSize["3xl"],
    fontWeight: "800",
  },
  trustLabel: {
    color: colors.muted,
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
}));

import { useLocalSearchParams, useRouter } from "expo-router";
import { Ban, FileText, Pencil, Play, ServerCog, SlidersHorizontal, XCircle } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { messageForError } from "@/src/api/errors";
import {
  useClient,
  useClientCredits,
  useClientNotes,
  useClientServiceAction,
  useClientSummary,
  useCreateClientNote,
  useCurrencyCode,
  useRemindClientInvoices,
  useSetClientBlock,
} from "@/src/api/hooks";
import { formatDateTime, formatMoney, initials, trustScoreLabel } from "@/src/lib/format";
import { useAuth } from "@/src/store/connection";
import { fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { TextField } from "@/src/ui/Input";
import { LinkRow } from "@/src/ui/detail";
import { ActionList, Sheet, type SheetAction } from "@/src/ui/Sheet";
import { Header, Screen } from "@/src/ui/Screen";
import { Avatar, Button, Card, FieldRow, SectionTitle, StatusPill } from "@/src/ui/primitives";
import { ErrorState, LoadingState } from "@/src/ui/states";
import { useToast } from "@/src/ui/Toast";

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
  const router = useRouter();
  const toast = useToast();
  const { can } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const codeOf = useCurrencyCode();

  const client = useClient(id);
  const summary = useClientSummary(id);
  const notes = useClientNotes(id);
  const credits = useClientCredits(id);
  const block = useSetClientBlock(id);
  const remind = useRemindClientInvoices(id);
  const svcAction = useClientServiceAction(id);
  const addNote = useCreateClientNote(id);

  const [sheet, setSheet] = useState(false);
  const [noteSheet, setNoteSheet] = useState(false);
  const [noteText, setNoteText] = useState("");

  const act = async (fn: () => Promise<unknown>, label: string) => {
    setSheet(false);
    try {
      await fn();
      toast.show(`${label} başarılı`, "success");
    } catch (e) {
      toast.show(messageForError(e), "error");
    }
  };

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
  const isBlocked = c.status === "blocked";

  const actions: SheetAction[] = [];
  if (can("Clients/UpdateClient"))
    actions.push({ label: "Düzenle", icon: Pencil, testID: "act-edit", onPress: () => { setSheet(false); router.push(`/client/edit?id=${id}`); } });
  if (can("Clients/SetClientBlock"))
    actions.push({
      label: isBlocked ? "Engeli Kaldır" : "Engelle",
      icon: Ban,
      tone: isBlocked ? "success" : "warning",
      testID: "act-block",
      onPress: () => act(() => block.mutateAsync(!isBlocked), isBlocked ? "Engel kaldırma" : "Engelleme"),
    });
  if (can("Clients/RemindClientInvoices"))
    actions.push({ label: "Fatura Hatırlat", icon: FileText, testID: "act-remind", onPress: () => act(() => remind.mutateAsync(), "Hatırlatma") });
  if (can("Clients/SuspendClientServices"))
    actions.push({ label: "Hizmetleri Askıya Al", icon: Ban, tone: "warning", testID: "act-suspend", onPress: () => act(() => svcAction.mutateAsync("suspend"), "Askıya alma") });
  if (can("Clients/UnsuspendClientServices"))
    actions.push({ label: "Hizmetleri Yeniden Aç", icon: Play, tone: "success", testID: "act-unsuspend", onPress: () => act(() => svcAction.mutateAsync("unsuspend"), "Yeniden açma") });
  if (can("Clients/CancelClientServices"))
    actions.push({ label: "Hizmetleri İptal Et", icon: XCircle, tone: "error", testID: "act-cancel", onPress: () => act(() => svcAction.mutateAsync("cancel"), "İptal") });

  return (
    <Screen>
      <Header
        title="Müşteri Detayı"
        back
        right={
          actions.length ? (
            <Pressable onPress={() => setSheet(true)} hitSlop={10} testID="client-actions-button">
              <SlidersHorizontal size={22} color={colors.onSurface} />
            </Pressable>
          ) : undefined
        }
      />
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

        {/* Services link */}
        {can("Services/GetServices") ? (
          <View style={styles.section}>
            <SectionTitle title="Hizmetler" />
            <Card>
              <LinkRow
                title="Hizmetleri Görüntüle"
                subtitle={s ? `${s.active_services ?? 0} aktif · ${s.inactive_services ?? 0} pasif` : undefined}
                right={<ServerCog size={18} color={colors.muted} />}
                onPress={() => router.push(`/services?client_id=${id}`)}
              />
            </Card>
          </View>
        ) : null}

        {/* Credits */}
        {can("Clients/GetClientCredits") && credits.data && credits.data.length ? (
          <View style={styles.section}>
            <SectionTitle title="Kredi Hareketleri" />
            <Card>
              {credits.data.map((cr) => (
                <FieldRow
                  key={cr.id}
                  label={`${cr.type === "up" ? "+" : "-"} ${cr.description || "Kredi"}`}
                  value={formatMoney(cr.amount, codeOf(cr.currency_id))}
                />
              ))}
            </Card>
          </View>
        ) : null}

        {/* Notes */}
        {can("Clients/GetClientNotes") ? (
          <View style={styles.section}>
            <SectionTitle
              title="Notlar"
              action={
                can("Clients/CreateClientNote") ? (
                  <Text style={styles.addNote} onPress={() => setNoteSheet(true)} testID="add-note-button">
                    + Not Ekle
                  </Text>
                ) : undefined
              }
            />
            <Card>
              {notes.data && notes.data.length ? (
                notes.data.map((n) => (
                  <FieldRow key={n.id} label={formatDateTime(n.created_at)} value={n.note ?? n.message} />
                ))
              ) : (
                <Text style={styles.emptyNote}>Henüz not yok.</Text>
              )}
            </Card>
          </View>
        ) : null}
      </ScrollView>

      <Sheet visible={sheet} onClose={() => setSheet(false)} title="Müşteri İşlemleri">
        <ActionList actions={actions} />
      </Sheet>

      <Sheet visible={noteSheet} onClose={() => setNoteSheet(false)} title="Not Ekle">
        <TextField
          placeholder="Not metni..."
          value={noteText}
          onChangeText={setNoteText}
          multiline
          testID="note-input"
          style={{ minHeight: 80 }}
        />
        <View style={{ marginTop: spacing.md }}>
          <Button
            label="Kaydet"
            onPress={async () => {
              if (!noteText.trim()) return;
              try {
                await addNote.mutateAsync(noteText.trim());
                setNoteText("");
                setNoteSheet(false);
                toast.show("Not eklendi", "success");
              } catch (e) {
                toast.show(messageForError(e), "error");
              }
            }}
            loading={addNote.isPending}
            full
            testID="note-save-button"
          />
        </View>
      </Sheet>
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
  addNote: {
    color: colors.brandPrimary,
    fontSize: fontSize.base,
    fontWeight: "700",
  },
  emptyNote: {
    color: colors.muted,
    fontSize: fontSize.base,
    paddingVertical: spacing.xs,
  },
}));

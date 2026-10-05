import { useLocalSearchParams, useRouter } from "expo-router";
import { Send, SlidersHorizontal } from "lucide-react-native";
import { useRef, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { messageForError } from "@/src/api/errors";
import {
  useAddTicketNote,
  useReplyTicket,
  useTicket,
  useTicketMessages,
  useTicketNotes,
  useTicketPriorities,
  useTicketStatusDefs,
  useUpdateTicket,
} from "@/src/api/hooks";
import { formatDateTime, priorityLabel, priorityTone } from "@/src/lib/format";
import { fontSize, makeStyles, radius, spacing, useTheme } from "@/src/theme";
import { ActionList, Sheet } from "@/src/ui/Sheet";
import { Header, Screen } from "@/src/ui/Screen";
import { Card, FieldRow, SectionTitle, StatusPill, toneColors } from "@/src/ui/primitives";
import { ErrorState, LoadingState } from "@/src/ui/states";
import { useToast } from "@/src/ui/Toast";

type Mode = "reply" | "note";

export default function TicketDetail() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const scrollRef = useRef<ScrollView>(null);

  const ticket = useTicket(id);
  const messages = useTicketMessages(id);
  const notes = useTicketNotes(id);
  const statusDefs = useTicketStatusDefs();
  const priorities = useTicketPriorities();
  const reply = useReplyTicket(id);
  const addNote = useAddTicketNote(id);
  const update = useUpdateTicket(id);

  const [mode, setMode] = useState<Mode>("reply");
  const [text, setText] = useState("");
  const [actionsOpen, setActionsOpen] = useState(false);
  const [statusSheet, setStatusSheet] = useState(false);
  const [prioritySheet, setPrioritySheet] = useState(false);

  if (ticket.isLoading) {
    return (
      <Screen>
        <Header title="Talep" back />
        <LoadingState message="Yükleniyor..." />
      </Screen>
    );
  }
  if (ticket.isError || !ticket.data) {
    return (
      <Screen>
        <Header title="Talep" back />
        <ErrorState error={ticket.error} onRetry={() => ticket.refetch()} />
      </Screen>
    );
  }

  const t = ticket.data;
  const pr = toneColors(colors, priorityTone(t.priority));

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    try {
      if (mode === "reply") {
        await reply.mutateAsync({ message: body, hidden: false });
        toast.show("Yanıt gönderildi", "success");
      } else {
        await addNote.mutateAsync(body);
        toast.show("Dahili not eklendi", "success");
      }
      setText("");
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
    } catch (e) {
      toast.show(messageForError(e), "error");
    }
  };

  const changeStatus = async (key: string) => {
    setStatusSheet(false);
    try {
      await update.mutateAsync({ status: key });
      toast.show("Durum güncellendi", "success");
    } catch (e) {
      toast.show(messageForError(e), "error");
    }
  };

  const changePriority = async (value: number) => {
    setPrioritySheet(false);
    try {
      await update.mutateAsync({ priority: value });
      toast.show("Öncelik güncellendi", "success");
    } catch (e) {
      toast.show(messageForError(e), "error");
    }
  };

  const sending = reply.isPending || addNote.isPending;

  return (
    <Screen>
      <Header
        title={t.subject || "Talep"}
        subtitle={t.reference}
        back
        right={
          <Pressable onPress={() => setActionsOpen(true)} hitSlop={10} testID="ticket-actions-button">
            <SlidersHorizontal size={22} color={colors.onSurface} />
          </Pressable>
        }
      />
      <KeyboardAvoidingView behavior="padding" style={styles.flex} keyboardVerticalOffset={0}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Info */}
          <Card>
            <FieldRow label="Durum" valueNode={<StatusPill status={t.status} />} />
            <FieldRow
              label="Öncelik"
              valueNode={
                <View style={[styles.priorityPill, { backgroundColor: pr.bg }]}>
                  <Text style={[styles.priorityText, { color: pr.fg }]}>{priorityLabel(t.priority)}</Text>
                </View>
              }
            />
            <FieldRow label="Departman" value={t.department?.name} />
            <FieldRow
              label="Müşteri"
              valueNode={
                t.client ? (
                  <Pressable onPress={() => router.push(`/client/${t.client!.id}`)}>
                    <Text style={styles.link}>{t.client.full_name}</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.value}>-</Text>
                )
              }
            />
            <FieldRow label="Atanan" value={t.assigned?.full_name ?? "-"} />
            <FieldRow label="Oluşturma" value={formatDateTime(t.created_at)} />
            <FieldRow label="Son Yanıt" value={formatDateTime(t.last_reply_at)} />
          </Card>

          {/* Internal notes */}
          {Array.isArray(notes.data) && notes.data.length ? (
            <View style={styles.section}>
              <SectionTitle title="Dahili Notlar" />
              <Card>
                {notes.data.map((n) => (
                  <View key={n.id} style={styles.note}>
                    <Text style={styles.noteText}>{n.message ?? n.note}</Text>
                    <Text style={styles.noteMeta}>
                      {n.author_name ?? "Personel"} · {formatDateTime(n.created_at)}
                    </Text>
                  </View>
                ))}
              </Card>
            </View>
          ) : null}

          {/* Messages */}
          <View style={styles.section}>
            <SectionTitle title="Mesajlar" />
            {messages.isLoading ? (
              <LoadingState />
            ) : (
              <View style={styles.thread}>
                {(messages.data ?? []).map((m) => (
                  <View key={m.id} style={[styles.bubbleRow, m.is_admin ? styles.rowRight : styles.rowLeft]}>
                    <View style={[styles.bubble, m.is_admin ? styles.bubbleAdmin : styles.bubbleClient]}>
                      <Text style={[styles.bubbleAuthor, m.is_admin && { color: colors.onBrandPrimary }]}>
                        {m.author_name}
                      </Text>
                      <Text style={[styles.bubbleText, m.is_admin && { color: colors.onBrandPrimary }]}>
                        {m.message}
                      </Text>
                      <Text style={[styles.bubbleTime, m.is_admin && { color: colors.onBrandPrimary }]}>
                        {formatDateTime(m.created_at)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Composer */}
        <View style={[styles.composer, { paddingBottom: insets.bottom + spacing.sm }]}>
          <View style={styles.modeRow}>
            <ModeTab label="Yanıt" active={mode === "reply"} onPress={() => setMode("reply")} testID="mode-reply" />
            <ModeTab label="Dahili Not" active={mode === "note"} onPress={() => setMode("note")} testID="mode-note" />
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder={mode === "reply" ? "Yanıtınızı yazın..." : "Dahili not (müşteri görmez)..."}
              placeholderTextColor={colors.muted}
              multiline
              testID="ticket-composer-input"
            />
            <Pressable
              onPress={send}
              disabled={sending || !text.trim()}
              style={[styles.sendBtn, (sending || !text.trim()) && styles.sendDisabled]}
              testID="ticket-send-button"
            >
              <Send size={20} color={colors.onBrandPrimary} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Actions sheet */}
      <Sheet visible={actionsOpen} onClose={() => setActionsOpen(false)} title="İşlemler">
        <ActionList
          actions={[
            { label: "Durumu Değiştir", testID: "action-change-status", onPress: () => { setActionsOpen(false); setStatusSheet(true); } },
            { label: "Önceliği Değiştir", testID: "action-change-priority", onPress: () => { setActionsOpen(false); setPrioritySheet(true); } },
          ]}
        />
      </Sheet>

      <Sheet visible={statusSheet} onClose={() => setStatusSheet(false)} title="Durum Seç">
        <ActionList
          actions={(statusDefs.data ?? []).map((s) => ({
            label: s.name,
            testID: `status-${s.key}`,
            tone: t.status === s.key ? "info" : undefined,
            onPress: () => changeStatus(s.key),
          }))}
        />
      </Sheet>

      <Sheet visible={prioritySheet} onClose={() => setPrioritySheet(false)} title="Öncelik Seç">
        <ActionList
          actions={(priorities.data ?? []).map((p) => ({
            label: p.label,
            testID: `priority-${p.value}`,
            tone: t.priority === p.value ? "info" : undefined,
            onPress: () => changePriority(p.value),
          }))}
        />
      </Sheet>
    </Screen>
  );
}

function ModeTab({ label, active, onPress, testID }: { label: string; active: boolean; onPress: () => void; testID: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} testID={testID} style={[styles.modeTab, active && { backgroundColor: colors.brandTertiary }]}>
      <Text style={{ color: active ? colors.onBrandTertiary : colors.muted, fontSize: fontSize.sm, fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.xl },
  section: { gap: spacing.sm },
  link: { color: colors.brandPrimary, fontSize: fontSize.base, fontWeight: "700" },
  value: { color: colors.onSurface, fontSize: fontSize.base, fontWeight: "600" },
  priorityPill: { paddingHorizontal: spacing.sm + 2, paddingVertical: 4, borderRadius: radius.pill },
  priorityText: { fontSize: fontSize.sm, fontWeight: "700" },
  note: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider },
  noteText: { color: colors.onSurface, fontSize: fontSize.base },
  noteMeta: { color: colors.muted, fontSize: fontSize.sm, marginTop: 4 },
  thread: { gap: spacing.md },
  bubbleRow: { flexDirection: "row" },
  rowRight: { justifyContent: "flex-end" },
  rowLeft: { justifyContent: "flex-start" },
  bubble: { maxWidth: "85%", borderRadius: radius.md, padding: spacing.md, gap: 4 },
  bubbleAdmin: { backgroundColor: colors.brandPrimary, borderBottomRightRadius: 4 },
  bubbleClient: { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
  bubbleAuthor: { color: colors.onSurfaceSecondary, fontSize: fontSize.sm, fontWeight: "700" },
  bubbleText: { color: colors.onSurface, fontSize: fontSize.base, lineHeight: 20 },
  bubbleTime: { color: colors.muted, fontSize: 11, marginTop: 2 },
  composer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  modeRow: { flexDirection: "row", gap: spacing.sm },
  modeTab: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.surfaceTertiary },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    color: colors.onSurface,
    fontSize: fontSize.base,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: { opacity: 0.4 },
}));

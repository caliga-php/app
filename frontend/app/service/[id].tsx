import { useLocalSearchParams, useRouter } from "expo-router";
import { Ban, FileText, Play, RefreshCw, SlidersHorizontal, XCircle } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { messageForError } from "@/src/api/errors";
import { useCurrencyCode, useService, useServiceAction, useServiceRenewalInvoice } from "@/src/api/hooks";
import { formatDateTime, formatMoney } from "@/src/lib/format";
import { spacing, useTheme } from "@/src/theme";
import { ActionList, Sheet, type SheetAction } from "@/src/ui/Sheet";
import { Header, Screen } from "@/src/ui/Screen";
import { Card, FieldRow, SectionTitle, StatusPill } from "@/src/ui/primitives";
import { LinkRow } from "@/src/ui/detail";
import { ErrorState, LoadingState } from "@/src/ui/states";
import { useToast } from "@/src/ui/Toast";

export default function ServiceDetailScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const codeOf = useCurrencyCode();

  const service = useService(id);
  const action = useServiceAction(id);
  const renewal = useServiceRenewalInvoice(id);
  const [sheet, setSheet] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (service.isLoading) {
    return (<Screen><Header title="Hizmet" back /><LoadingState message="Yükleniyor..." /></Screen>);
  }
  if (service.isError || !service.data) {
    return (<Screen><Header title="Hizmet" back /><ErrorState error={service.error} onRetry={() => service.refetch()} /></Screen>);
  }

  const s = service.data;
  const code = codeOf(s.currency_id);
  const cap = s.capabilities ?? {};

  const run = async (act: "suspend" | "unsuspend" | "reinstall", label: string) => {
    setSheet(false);
    try {
      await action.mutateAsync(act);
      toast.show(`${label} başarılı`, "success");
    } catch (e) {
      toast.show(messageForError(e), "error");
    }
  };

  const actions: SheetAction[] = [];
  if (cap.can_suspend) actions.push({ label: "Askıya Al", icon: Ban, tone: "warning", testID: "svc-suspend", onPress: () => run("suspend", "Askıya alma") });
  if (cap.can_unsuspend) actions.push({ label: "Yeniden Aç", icon: Play, tone: "success", testID: "svc-unsuspend", onPress: () => run("unsuspend", "Yeniden açma") });
  if (cap.can_reinstall) actions.push({ label: "Yeniden Kur", icon: RefreshCw, testID: "svc-reinstall", onPress: () => run("reinstall", "Yeniden kurma") });
  actions.push({ label: "Yenileme Faturası Oluştur", icon: FileText, testID: "svc-renewal", onPress: async () => {
    setSheet(false);
    try { await renewal.mutateAsync(); toast.show("Yenileme faturası oluşturuldu", "success"); } catch (e) { toast.show(messageForError(e), "error"); }
  } });
  if (cap.can_cancel) actions.push({ label: "İptal Et", icon: XCircle, tone: "error", testID: "svc-cancel", onPress: () => { setSheet(false); setConfirmCancel(true); } });

  return (
    <Screen>
      <Header title={s.name} subtitle={s.product?.title} back right={
        actions.length ? (
          <Text onPress={() => setSheet(true)} testID="service-actions-button">
            <SlidersHorizontal size={22} color={colors.onSurface} />
          </Text>
        ) : undefined
      } />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl, paddingBottom: insets.bottom + spacing["2xl"] }} showsVerticalScrollIndicator={false}>
        <Card>
          <FieldRow label="Durum" valueNode={<StatusPill status={s.status} />} />
          <FieldRow label="Ürün" value={s.product?.title} />
          <FieldRow label="Tutar" value={formatMoney(s.amount, code)} />
          <FieldRow label="Döngü" value={s.cycle} />
          <FieldRow label="Alan Adı" value={s.domain ?? "-"} />
          <FieldRow label="Oluşturma" value={formatDateTime(s.created_at)} />
          <FieldRow label="Bitiş / Yenileme" value={formatDateTime(s.due_at)} />
        </Card>

        {s.client ? (
          <View style={{ gap: spacing.sm }}>
            <SectionTitle title="Müşteri" />
            <Card>
              <LinkRow title={s.client.full_name} subtitle={s.client.email} onPress={() => router.push(`/client/${s.client!.id}`)} />
            </Card>
          </View>
        ) : null}

        {s.order ? (
          <View style={{ gap: spacing.sm }}>
            <SectionTitle title="Sipariş" />
            <Card>
              <LinkRow title={`#${s.order.number}`} right={<StatusPill status={s.order.status} />} onPress={() => router.push(`/order/${s.order!.id}`)} />
            </Card>
          </View>
        ) : null}
      </ScrollView>

      <Sheet visible={sheet} onClose={() => setSheet(false)} title="Hizmet İşlemleri">
        <ActionList actions={actions} />
      </Sheet>

      <Sheet visible={confirmCancel} onClose={() => setConfirmCancel(false)} title="Hizmeti iptal et">
        <Text style={{ color: colors.onSurfaceSecondary, marginBottom: spacing.md }}>
          {s.name} hizmetini iptal etmek üzeresiniz. Bu işlem geri alınamaz.
        </Text>
        <ActionList actions={[{ label: "Evet, iptal et", icon: XCircle, tone: "error", testID: "svc-confirm-cancel", onPress: async () => {
          setConfirmCancel(false);
          try { await action.mutateAsync("cancel"); toast.show("Hizmet iptal edildi", "success"); } catch (e) { toast.show(messageForError(e), "error"); }
        } }]} />
      </Sheet>
    </Screen>
  );
}

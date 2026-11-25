import { useEffect, useState, type ReactNode } from "react";
import { Alert, Platform, StyleSheet, View } from "react-native";
import type { Basilica } from "../../data/basilicas";
import { isOnline, OFFLINE_WRITE, readCache, reviewLater, transient, writeCache, type GReview, type Source } from "../../lib/gallery";
import { C } from "../../theme";
import { T } from "../ui";
import { Box, gs, Link, Msg, SmallButton, StatusChip } from "./bits";

/** Ask before something can't be undone (window.confirm on the web preview, where Alert has no buttons). */
export function confirm(title: string, body: string, yes: string, run: () => void) {
  if (Platform.OS === "web") { if ((globalThis as any).confirm?.(`${title}\n\n${body}`.trim())) run(); return; }
  Alert.alert(title, body, [{ text: "Cancel", style: "cancel" }, { text: yes, style: "destructive", onPress: run }]);
}

/** The member's own review of a basilica (members/visit.js reviewBlock). Members are asked for one only once they've
 *  logged the visit and added at least one photo; the database enforces the same rule. Reviews are checked before
 *  other members see them, and an edit sends an approved review back for a quick review (requeue_on_edit). */
export default function ReviewBlock({ b, src, photos, ineligible }: {
  b: Basilica; src: Source; photos: number; ineligible?: ReactNode;
}) {
  const [r, setR] = useState<GReview | null | undefined>(undefined);       // undefined: not known yet
  const [editing, setEditing] = useState<"new" | "edit" | null>(null);
  const [later, setLater] = useState(reviewLater.has(b.id));
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ t: string; k: "ok" | "err" | "" } | null>(null);
  const key = `review.${b.id}`;

  useEffect(() => {
    let live = true;
    (async () => {
      const c = await readCache<GReview | null>(src.uid, key);
      if (live && c) setR(c.data);
      try { const x = await src.myReview(b.id); if (live) { setR(x); writeCache(src.uid, key, x); } }
      catch (e) { if (live && !c) setR(transient(e) ? undefined : null); }
    })();
    return () => { live = false; };
  }, [b.id, src, key]);

  const save = async () => {
    setMsg(null);
    if (!(await isOnline())) { setMsg({ t: `${OFFLINE_WRITE} Your words are still here.`, k: "err" }); return; }
    setBusy(true);
    try {
      const existing = editing === "edit" ? r : null;
      const saved = await src.saveReview(b.id, text, existing?.id);
      setR(saved); writeCache(src.uid, key, saved); setEditing(null);
      setMsg({ t: existing ? "Saved. Your review shows in the gallery again once it’s been checked." : "Thank you! Your review will appear in the members’ gallery once it’s been checked.", k: "ok" });
    } catch (e: any) { setMsg({ t: transient(e) ? `${OFFLINE_WRITE} Your words are still here.` : e?.message || String(e), k: "err" }); }
    setBusy(false);
  };
  const del = () => confirm(`Delete your review of ${b.name}?`, "", "Delete", async () => {
    if (!(await isOnline())) { setMsg({ t: OFFLINE_WRITE, k: "err" }); return; }
    try { await src.deleteReview(r!.id); setR(null); writeCache(src.uid, key, null); setMsg(null); }
    catch (e: any) { setMsg({ t: e?.message || String(e), k: "err" }); }
  });

  if (r === undefined) return null;

  if (editing || (!r && photos > 0 && !later)) {
    const isEdit = editing === "edit";
    const n = text.trim().length;
    return (
      <View style={s.form}>
        <T w="bold" style={gs.h}>{isEdit ? "Edit your review" : "How was your visit?"}</T>
        {!isEdit ? (
          <T style={[gs.text, { marginTop: 4 }]}>
            Leave a review to tell other members what you enjoyed at {b.name} — the art, the music, a Mass worth catching, something not to miss nearby.
          </T>
        ) : null}
        <Box value={text} onChangeText={setText} maxLength={2000} placeholder="What did you enjoy most?" accessibilityLabel="Your review" style={{ marginTop: 10 }} />
        <T style={[gs.hint, { marginTop: 4 }]}>{n < 20 ? `${n} / 2,000 characters · at least 20` : `${n.toLocaleString("en-US")} / 2,000 characters`}</T>
        <View style={s.row}>
          <SmallButton solid label={busy ? "Saving…" : isEdit ? "Save changes" : "Post review"} onPress={save} disabled={busy || n < 20} />
          <SmallButton label={isEdit ? "Cancel" : "Not now"} onPress={() => {
            if (!isEdit) { reviewLater.add(b.id); setLater(true); }
            setEditing(null); setMsg(null);
          }} />
        </View>
        <T style={[gs.hint, { marginTop: 8 }]}>
          Shown with your display name in the members’ gallery once approved.{isEdit && r?.status === "approved" ? " Edits go back for a quick review." : ""}
        </T>
        <Msg text={msg?.t || null} kind={msg?.k} />
      </View>
    );
  }

  if (r) {
    return (
      <View style={s.mine}>
        <View style={s.head}>
          <T w="bold" style={gs.h}>Your review</T>
          <StatusChip status={r.status} />
          {r.status === "approved" ? <T style={[gs.hint, { color: C.red }]} accessibilityLabel={`${r.like_count} likes from other members`}>♥ {r.like_count}</T> : null}
        </View>
        <T style={[gs.text, { marginTop: 6 }]}>{r.body}</T>
        <View style={s.row}>
          <SmallButton label="Edit" onPress={() => { setText(r.body); setEditing("edit"); setMsg(null); }} />
          <SmallButton danger label="Delete" onPress={del} />
        </View>
        <Msg text={msg?.t || null} kind={msg?.k} />
      </View>
    );
  }

  if (!(photos > 0)) return <>{ineligible || null}</>;
  return (
    <View>
      <T style={gs.hint}><Link onPress={() => { reviewLater.delete(b.id); setLater(false); setText(""); setEditing("new"); }}>Write a review</Link> to tell other members what you enjoyed.</T>
      <Msg text={msg?.t || null} kind={msg?.k} />
    </View>
  );
}

const s = StyleSheet.create({
  form: { backgroundColor: "#fbf3dc", borderWidth: 1, borderColor: "#d9bf72", borderRadius: 9, padding: 12 },
  mine: { backgroundColor: "#fffdf8", borderWidth: 1, borderColor: "#d3c3a0", borderRadius: 9, padding: 12 },
  head: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  row: { flexDirection: "row", gap: 10, marginTop: 10 },
});

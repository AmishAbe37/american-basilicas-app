import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { isOnline, OFFLINE_WRITE, transient, when, who, type GAnswer, type GQuestion, type Source } from "../../lib/gallery";
import { C } from "../../theme";
import { T } from "../ui";
import { Box, gs, Msg, SmallButton, StatusChip } from "./bits";
import { confirm } from "./ReviewBlock";

type M = { t: string; k: "ok" | "err" | "" } | null;
const plural = (n: number, w: string) => `${n.toLocaleString("en-US")} ${w}${n === 1 ? "" : "s"}`;
const failed = (e: any) => (transient(e) ? `${OFFLINE_WRITE} Your words are still here.` : e?.message || String(e));

/** "Ask members about this basilica" (bview.js askBox). Needs gallery access; checked before others see it. */
export function AskBox({ bid, src, myName, onAsked }: { bid: string; src: Source; myName: string | null; onAsked: (q: GQuestion) => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<M>(null);
  async function post() {
    setMsg(null);
    if (!(await isOnline())) { setMsg({ t: `${OFFLINE_WRITE} Your words are still here.`, k: "err" }); return; }
    setBusy(true);
    try {
      const q = await src.ask(bid, text);
      q.profiles = { display_name: myName || "You" };
      setText(""); onAsked(q);
      setMsg({ t: "Thank you. Your question will appear for other members once it’s approved.", k: "ok" });
    } catch (e) { setMsg({ t: failed(e), k: "err" }); }
    setBusy(false);
  }
  return (
    <View style={s.ask}>
      <T w="black" style={s.fld}>Ask members about this basilica</T>
      <Box value={text} onChangeText={setText} maxLength={500} accessibilityLabel="Ask members about this basilica"
        placeholder="Parking, Mass times, tours, the best time for photos, what not to miss…" style={{ marginTop: 6 }} />
      <View style={s.row}>
        <SmallButton solid label={busy ? "Posting…" : "Post question"} onPress={post} disabled={busy || !text.trim()} />
      </View>
      <T style={[gs.hint, { marginTop: 6 }]}>Questions are checked before other members see them.</T>
      <Msg text={msg?.t || null} kind={msg?.k} />
    </View>
  );
}

function Visited({ on }: { on: boolean }) {
  return on ? <T w="semibold" style={s.visited} accessibilityLabel="Had checked off this basilica when posting">  ✓ Has visited</T> : null;
}

function AnswerRow({ a, src, onDeleted, onMsg }: { a: GAnswer; src: Source; onDeleted: () => void; onMsg: (m: M) => void }) {
  const own = a.user_id === src.uid;
  return (
    <View style={[s.answer, a.status !== "approved" && s.answerMine]}>
      <View style={s.head}>
        <T style={s.who} numberOfLines={1}><T w="bold" style={s.who}>{who(a)}</T><Visited on={a.author_visited} /></T>
        <T style={gs.hint}>{when(a)}</T>
      </View>
      {a.status !== "approved" ? <View style={{ marginTop: 4 }}><StatusChip qa status={a.status} /></View> : null}
      <T style={[gs.text, { marginTop: 4 }]}>{a.body}</T>
      {own ? (
        <T w="semibold" style={s.lnk} accessibilityRole="button" onPress={() => confirm("Delete your answer?", "", "Delete", async () => {
          if (!(await isOnline())) { onMsg({ t: OFFLINE_WRITE, k: "err" }); return; }
          try { await src.deleteAnswer(a.id); onDeleted(); } catch (e: any) { onMsg({ t: e?.message || String(e), k: "err" }); }
        })}>Delete my answer</T>
      ) : null}
    </View>
  );
}

/** One question with its answers (bview.js questionCard). Members see approved posts plus their own, which carry
 *  "Waiting for approval" until checked. Only approved questions can be answered (the database's rule too). */
export function QuestionCard({ q, answers: initial, src, myName, onDeleted }: {
  q: GQuestion; answers: GAnswer[]; src: Source; myName: string | null; onDeleted: () => void;
}) {
  const [answers, setAnswers] = useState(initial);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<M>(null);
  const approved = q.status === "approved", n = q.answer_count || 0, own = q.user_id === src.uid;

  async function post() {
    setMsg(null);
    if (!(await isOnline())) { setMsg({ t: `${OFFLINE_WRITE} Your words are still here.`, k: "err" }); return; }
    setBusy(true);
    try {
      const a = await src.answer(q.id, text);
      a.profiles = { display_name: myName || "You" };
      setAnswers((x) => [...x, a]); setText(""); setOpen(false);
      setMsg({ t: "Thank you. Your answer will appear for other members once it’s approved.", k: "ok" });
    } catch (e) { setMsg({ t: failed(e), k: "err" }); }
    setBusy(false);
  }

  return (
    <View style={s.card}>
      <View style={s.head}>
        <T style={s.who} numberOfLines={1}><T w="bold" style={s.who}>{who(q)}</T><Visited on={q.author_visited} /></T>
        <T style={gs.hint}>{when(q)}</T>
      </View>
      {q.status !== "approved" ? <View style={{ marginTop: 5 }}><StatusChip qa status={q.status} /></View> : null}
      <T w="semibold" style={s.q}>{q.body}</T>
      {answers.length ? (
        <View style={{ gap: 8, marginTop: 8 }}>
          {answers.map((a) => <AnswerRow key={a.id} a={a} src={src} onMsg={setMsg} onDeleted={() => setAnswers((x) => x.filter((y) => y.id !== a.id))} />)}
        </View>
      ) : null}
      <View style={s.foot}>
        <T style={[gs.hint, { flex: 1 }]}>{approved ? (n ? plural(n, "answer") : "No answers yet") : "Answers open once it’s approved"}</T>
        {approved && !open ? <SmallButton label="Answer" onPress={() => setOpen(true)} /> : null}
      </View>
      {own ? (
        <T w="semibold" style={s.lnk} accessibilityRole="button" onPress={() => confirm(`Delete your question${n ? " and its answers" : ""}?`, "", "Delete", async () => {
          if (!(await isOnline())) { setMsg({ t: OFFLINE_WRITE, k: "err" }); return; }
          try { await src.deleteQuestion(q.id); onDeleted(); } catch (e: any) { setMsg({ t: e?.message || String(e), k: "err" }); }
        })}>Delete question</T>
      ) : null}
      {open ? (
        <View style={{ marginTop: 10 }}>
          <T w="black" style={s.fld}>Your answer</T>
          <Box value={text} onChangeText={setText} maxLength={1500} placeholder="Share what you know from your visit…" accessibilityLabel="Your answer" style={{ marginTop: 6 }} autoFocus />
          <View style={s.row}>
            <SmallButton solid label={busy ? "Posting…" : "Post answer"} onPress={post} disabled={busy || !text.trim()} />
            <SmallButton label="Cancel" onPress={() => setOpen(false)} />
          </View>
          <T style={[gs.hint, { marginTop: 6 }]}>Answers are checked before other members see them.</T>
        </View>
      ) : null}
      <Msg text={msg?.t || null} kind={msg?.k} />
    </View>
  );
}

const s = StyleSheet.create({
  ask: { backgroundColor: "#fbf3dc", borderWidth: 1, borderColor: "#d9bf72", borderRadius: 9, padding: 12 },
  fld: { fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: "#4a4030" },
  row: { flexDirection: "row", gap: 10, marginTop: 10 },
  card: { backgroundColor: "#fffdf8", borderWidth: 1, borderColor: "#d3c3a0", borderRadius: 9, padding: 12 },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 8 },
  who: { flexShrink: 1, fontSize: 14, color: "#2a2318" },
  visited: { fontSize: 12, color: "#2f6b3a" },
  q: { fontSize: 15.5, lineHeight: 22, color: "#241d12", marginTop: 6 },
  answer: { borderLeftWidth: 3, borderLeftColor: C.gold, paddingLeft: 10, paddingVertical: 2 },
  answerMine: { borderLeftColor: "#c9b98f" },
  foot: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#e3d8bd", borderStyle: "dotted" },
  lnk: { color: "#7a1f1f", fontSize: 13, marginTop: 8, alignSelf: "flex-start" },
});

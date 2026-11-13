import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { Image, ImageBackground, Pressable, StyleSheet, Text, View, type StyleProp, type TextProps, type TextStyle, type ViewProps, type ViewStyle } from "react-native";
import { C, F } from "../theme";

// The site's materials (texture/texture.css): paper, gilt, enamel, lacquer, Cosmatesque mosaic.
const GRAIN = require("../../assets/texture/grain.webp");
const VALANCE = require("../../assets/ui/valance.png");
const COSMATI = require("../../assets/ui/cosmati.png");
const MEDALLION = require("../../assets/texture/medallion.webp");
export const OMB = require("../../assets/ui/ombrellino.png");

export const GILT = ["#fbeab0", "#e3b84a", "#c7951f", "#9a7016"] as const;
export const GILT_DIAG = ["#f8e4a0", "#c9971f", "#f3d77f", "#a87b16", "#e7c35a"] as const;
const GILT_DIAG_AT = [0, 0.28, 0.5, 0.74, 1] as const;
export const ENAMEL = ["#c94436", "#9c2420", "#6e1111"] as const;
const LACQUER = ["#36312b", "#15120f", "#050404"] as const;

export const letterpress: TextStyle = { textShadowColor: "rgba(255,255,255,.65)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 0 };
export const engraved: TextStyle = { textShadowColor: "rgba(0,0,0,.85)", textShadowOffset: { width: 0, height: -1 }, textShadowRadius: 0 };

/** Paper with the site's fibre grain. */
export function Paper({ style, children, color = C.paper, ...rest }: ViewProps & { color?: string }) {
  return (
    <ImageBackground source={GRAIN} resizeMode="repeat" style={[{ flex: 1, backgroundColor: color }, style]} {...rest}>
      {children}
    </ImageBackground>
  );
}

/** A card of heavier stock, like the grouped lists of the first iPhone apps (the site's phone index). */
export function Card({ style, children }: { style?: StyleProp<ViewStyle>; children: ReactNode }) {
  return (
    <View style={[s.cardShadow, style]}>
      <ImageBackground source={GRAIN} resizeMode="repeat" style={s.card} imageStyle={{ borderRadius: 9 }}>
        {children}
      </ImageBackground>
    </View>
  );
}

/** The ombrellino's red-and-gold scalloped valance, tiled across. */
export function Valance({ style }: { style?: ViewProps["style"] }) {
  return (
    <View style={[{ height: 16, overflow: "hidden", zIndex: 4 }, style]} pointerEvents="none">
      <Image source={VALANCE} resizeMode="repeat" style={{ width: "100%", height: 16 }} />
    </View>
  );
}

/** A strip of Cosmatesque pavement: porphyry and serpentine set in marble between gilt fillets. */
export function Cosmati({ style }: { style?: ViewProps["style"] }) {
  return (
    <View style={[{ height: 14, overflow: "hidden" }, style]} pointerEvents="none">
      <Image source={COSMATI} resizeMode="repeat" style={{ width: "100%", height: 14 }} />
    </View>
  );
}

export function Ombrellino({ size = 24 }: { size?: number }) {
  return <Image source={OMB} style={{ width: (size * 2) / 3, height: size }} resizeMode="contain" />;
}

/** The ombrellino on its mosaic roundel: lapis field, gold rim. */
export function Medallion({ size = 58 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, shadowColor: "#000", shadowOpacity: 0.6, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 4 }}>
      <ImageBackground source={MEDALLION} style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }} imageStyle={{ borderRadius: size / 2 }}>
        <Ombrellino size={size * 0.62} />
      </ImageBackground>
    </View>
  );
}

/** Black lacquer. */
export function Lacquer({ style, children }: { style?: StyleProp<ViewStyle>; children?: ReactNode }) {
  return <LinearGradient colors={LACQUER} locations={[0, 0.48, 1]} style={style}>{children}</LinearGradient>;
}

/** The lacquered title band from the site's header, with the medallion and gilt lettering. */
export function Band({ kicker, title, thin }: { kicker?: string; title: string; thin?: string }) {
  return (
    <Lacquer style={s.band}>
      <Medallion size={54} />
      <View style={{ flex: 1 }}>
        {kicker ? <Text style={s.kicker} numberOfLines={1}>{kicker}</Text> : null}
        <Text style={s.h1} numberOfLines={2}>
          {title}
          {thin ? <Text style={s.thin}> {thin}</Text> : null}
        </Text>
      </View>
    </Lacquer>
  );
}

/** A photograph in a gilt frame. */
export function GiltFrame({ width = 7, children, style }: { width?: number; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[s.frameShadow, style]}>
      <LinearGradient colors={GILT_DIAG} locations={GILT_DIAG_AT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: width, borderWidth: 1, borderColor: "rgba(60,40,8,.6)" }}>
        {children}
      </LinearGradient>
    </View>
  );
}

/** A count in red enamel, set in a gilt bezel. */
export function Enamel({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <LinearGradient colors={ENAMEL} locations={[0, 0.48, 1]} style={[s.enamel, style]}>
      <Text style={s.enamelText}>{children}</Text>
    </LinearGradient>
  );
}

/** An illuminated initial: gold leaf behind a red letter, as in a missal. */
export function Lead({ children }: { children: string }) {
  const first = children.slice(0, 1), rest = children.slice(1);
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 6 }}>
      <LinearGradient colors={GILT_DIAG} locations={GILT_DIAG_AT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.initial}>
        <Text style={s.initialText}>{first}</Text>
      </LinearGradient>
      <Text style={s.lead}>{rest}</Text>
    </View>
  );
}

/** Buttons: red enamel in a gilt bezel, or white porcelain. */
export function EnamelButton({ label, onPress, icon }: { label: string; onPress: () => void; icon?: ReactNode }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [s.btnShadow, pressed && { opacity: 0.85 }]}>
      <LinearGradient colors={GILT} style={{ borderRadius: 9, padding: 2 }}>
        <LinearGradient colors={ENAMEL} locations={[0, 0.48, 1]} style={s.btnInner}>
          {icon}
          <Text style={s.btnText}>{label}</Text>
        </LinearGradient>
      </LinearGradient>
    </Pressable>
  );
}
export function PorcelainButton({ label, onPress, style }: { label: string; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="link" style={({ pressed }) => [{ flex: 1 }, s.btnShadow, style, pressed && { opacity: 0.85 }]}>
      <LinearGradient colors={["#fffef9", "#f3ead6"]} style={s.porcelain}>
        <Text style={s.porcelainText}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

/** Small capitals, as on a printed guide. */
export function Kicker({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[s.smallcaps, style]}>{children}</Text>;
}

export function T({ style, w = "regular", ...rest }: TextProps & { w?: keyof typeof F }) {
  return <Text style={[{ fontFamily: F[w], color: C.text, fontSize: 16 }, style]} {...rest} />;
}

const s = StyleSheet.create({
  band: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 16 },
  kicker: { fontFamily: F.black, color: "#e3b84a", fontSize: 10.5, letterSpacing: 2.2, textTransform: "uppercase", textShadowColor: "rgba(0,0,0,.9)", textShadowOffset: { width: 0, height: -1 }, textShadowRadius: 0 },
  h1: { fontFamily: F.bold, color: "#fff", fontSize: 22, lineHeight: 26, ...engraved },
  thin: { fontFamily: F.regular, color: "#fff" },
  cardShadow: { borderRadius: 9, backgroundColor: "#fbf8f0", shadowColor: "#46320f", shadowOpacity: 0.18, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  card: { borderRadius: 9, borderWidth: 1, borderColor: "#d3c3a0", backgroundColor: "#fbf8f0", paddingHorizontal: 12, paddingTop: 9, paddingBottom: 4 },
  frameShadow: { shadowColor: "#281905", shadowOpacity: 0.45, shadowRadius: 5, shadowOffset: { width: 0, height: 3 }, elevation: 5, backgroundColor: "#c9971f" },
  enamel: { borderRadius: 9, borderWidth: 1, borderColor: "#c99a2e", paddingHorizontal: 7, minWidth: 22, alignItems: "center", shadowColor: "#281405", shadowOpacity: 0.35, shadowRadius: 1, shadowOffset: { width: 0, height: 1 } },
  enamelText: { fontFamily: F.black, color: "#fff", fontSize: 11, lineHeight: 16, textShadowColor: "rgba(0,0,0,.45)", textShadowOffset: { width: 0, height: -1 }, textShadowRadius: 0 },
  initial: { borderWidth: 1, borderColor: "#8a6514", paddingHorizontal: 6, paddingTop: 1, marginTop: 3, shadowColor: "#3c280a", shadowOpacity: 0.35, shadowRadius: 1, shadowOffset: { width: 0, height: 1 } },
  initialText: { fontFamily: F.black, fontSize: 24, lineHeight: 28, color: "#7d1515", textShadowColor: "rgba(255,240,190,.6)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 0 },
  lead: { flex: 1, fontFamily: F.regular, fontSize: 14, lineHeight: 22, color: "#4f4636" },
  btnShadow: { borderRadius: 9, shadowColor: "#3c280a", shadowOpacity: 0.3, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  btnInner: { borderRadius: 7, paddingVertical: 12, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  btnText: { fontFamily: F.bold, color: "#fff", fontSize: 17, ...engraved, textShadowColor: "rgba(0,0,0,.45)" },
  porcelain: { borderRadius: 9, borderWidth: 1, borderColor: "#c9b98f", paddingVertical: 11, alignItems: "center" },
  porcelainText: { fontFamily: F.semibold, color: "#7a1f1f", fontSize: 15 },
  smallcaps: { fontFamily: F.black, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: C.text, ...letterpress },
});

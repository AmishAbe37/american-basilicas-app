import { Image, ImageBackground, Platform, StyleSheet, Text, View, type TextProps, type ViewProps } from "react-native";
import { C, F } from "../theme";

const GRAIN = require("../../assets/texture/grain.webp");
const VALANCE = require("../../assets/ui/valance.png");
export const OMB = require("../../assets/ui/ombrellino.png");

/** Paper with the site's fibre grain. */
export function Paper({ style, children, ...rest }: ViewProps) {
  return (
    <ImageBackground source={GRAIN} resizeMode="repeat" style={[{ flex: 1, backgroundColor: C.paper }, style]}
      imageStyle={{ opacity: 0.9 }} {...rest}>
      {children}
    </ImageBackground>
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

export function Ombrellino({ size = 24 }: { size?: number }) {
  return <Image source={OMB} style={{ width: (size * 2) / 3, height: size }} resizeMode="contain" />;
}

/** The black title band from the site's header. */
export function Band({ kicker, title, thin }: { kicker?: string; title: string; thin?: string }) {
  return (
    <View style={s.band}>
      <Ombrellino size={44} />
      <View style={{ flex: 1 }}>
        {kicker ? <Text style={s.kicker}>{kicker}</Text> : null}
        <Text style={s.h1} numberOfLines={2}>
          {title}
          {thin ? <Text style={s.thin}> {thin}</Text> : null}
        </Text>
      </View>
    </View>
  );
}

export function T({ style, w = "regular", ...rest }: TextProps & { w?: keyof typeof F }) {
  return <Text style={[{ fontFamily: F[w], color: C.text, fontSize: 16 }, style]} {...rest} />;
}

const s = StyleSheet.create({
  band: { backgroundColor: C.ink, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14 },
  kicker: { fontFamily: F.bold, color: C.gold, fontSize: 11, letterSpacing: 1.6, textTransform: "uppercase" },
  h1: { fontFamily: F.bold, color: "#fff", fontSize: 22, lineHeight: 26, ...(Platform.OS === "web" ? {} : {}) },
  thin: { fontFamily: F.regular, color: "#fff" },
});

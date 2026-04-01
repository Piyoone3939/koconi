import { Image, type StyleProp, type ImageStyle } from "react-native";

type IconProps = { color: string; size?: number };

const tintStyle = (color: string, size: number): StyleProp<ImageStyle> => ({
  width: size,
  height: size,
  tintColor: color,
});

export function MapIcon({ color, size = 24 }: IconProps) {
  return <Image source={require("../../../assets/map.png")} style={tintStyle(color, size)} />;
}

export function PhotoIcon({ color, size = 24 }: IconProps) {
  return <Image source={require("../../../assets/photo.png")} style={tintStyle(color, size)} />;
}

export function FriendsIcon({ color, size = 24 }: IconProps) {
  return <Image source={require("../../../assets/friend.png")} style={tintStyle(color, size)} />;
}

export function ProfileIcon({ color, size = 24 }: IconProps) {
  return <Image source={require("../../../assets/account.png")} style={tintStyle(color, size)} />;
}

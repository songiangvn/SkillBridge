import { Image, View } from "react-native";

type AvatarProps = {
  size: number;
  image?: string;
};

const Avatar = ({ size, image }: AvatarProps) => {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: "hidden",
        borderWidth: 3,
        borderColor: "#FFD600",
      }}
    >
      <Image
        style={{ width: "100%", height: "100%" }}
        source={{
          uri:
            image ||
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1887&auto=format&fit=crop",
        }}
      />
    </View>
  );
};
export default Avatar;

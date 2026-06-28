import { Avatar } from "@mui/material";
import type { AvatarProps } from "@mui/material";

const getInitials = (name?: string | null) =>
  (name ?? "?").split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2);

interface UserAvatarProps extends Omit<AvatarProps, "children"> {
  name?: string | null;
  avatar?: string | null;
}

export const UserAvatar = ({ name, avatar, sx, ...rest }: UserAvatarProps) => {
  return (
    <Avatar
      src={avatar || undefined}
      sx={sx}
      {...rest}
    >
      {getInitials(name)}
    </Avatar>
  );
};

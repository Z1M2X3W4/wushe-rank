"use client";

import type { ComponentPropsWithoutRef } from "react";
import { avatar, idText } from "@/lib/member-display";

type Props = Omit<ComponentPropsWithoutRef<"img">, "src" | "onError"> & { member: number };
export default function MemberAvatar({ member, alt, ...props }: Props) {
  return <img {...props} src={avatar(member)} alt={alt ?? idText(member) + " 号群友头像"} onError={event => {
    const image = event.currentTarget;
    if (image.getAttribute("src") !== "/default-avatar.svg") image.src = "/default-avatar.svg";
  }}/>;
}

"use client";

import { use } from "react";
import { RoomTemplate } from "@/rooms/templates/pages/RoomTemplate";

type Props = {
  params: Promise<{ id: string }>;
};

export default function RoomPage({ params }: Props) {
  const { id } = use(params);
  return <RoomTemplate roomId={id} />;
}

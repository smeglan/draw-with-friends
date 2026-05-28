"use client";

import { useUsername } from "@/shared/context/UsernameContext";
import { NamePrompt } from "@/shared/components/NamePrompt";
import { LandingHero } from "@/shared/components/LandingHero";
import { useState } from "react";

export default function Home() {
  const { username, setUsername } = useUsername();
  const [dismissed, setDismissed] = useState(false);

  const showPrompt = !username && !dismissed;

  return (
    <>
      <LandingHero />
      {showPrompt && (
        <NamePrompt
          onSubmit={(name) => {
            setUsername(name);
            setDismissed(true);
          }}
        />
      )}
    </>
  );
}

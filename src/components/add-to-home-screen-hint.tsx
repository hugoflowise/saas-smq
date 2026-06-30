"use client";

import { Smartphone } from "lucide-react";
import { useEffect, useState } from "react";

type Platform = "ios" | "android" | "other";

/**
 * Aide « Ajouter à l'écran d'accueil » affichée sous les formulaires publics
 * (signalement, suivis). Objectif : que le BM / consultant garde le formulaire
 * sous la main au quotidien sans repasser par un lien ou un QR code.
 */
export function AddToHomeScreenHint() {
  const [platform, setPlatform] = useState<Platform>("other");

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/i.test(ua)) setPlatform("ios");
    else if (/Android/i.test(ua)) setPlatform("android");
  }, []);

  const instructions =
    platform === "ios"
      ? "Touchez l'icône Partager (↑) en bas de Safari, puis « Sur l'écran d'accueil »."
      : platform === "android"
        ? "Ouvrez le menu (⋮) du navigateur, puis « Ajouter à l'écran d'accueil »."
        : "Depuis votre téléphone : menu du navigateur, puis « Ajouter à l'écran d'accueil ».";

  return (
    <div className="mt-6 flex items-start gap-3 rounded-2xl bg-muted/50 p-4 text-sm">
      <Smartphone className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
      <div>
        <p className="font-medium">Gardez ce formulaire sous la main</p>
        <p className="mt-1 text-muted-foreground">
          Ajoutez-le à l'écran d'accueil de votre téléphone pour y accéder en un geste.{" "}
          {instructions}
        </p>
      </div>
    </div>
  );
}

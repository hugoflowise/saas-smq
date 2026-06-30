/**
 * Compresse une image côté navigateur avant envoi (redimensionnement + JPEG).
 * Renvoie un `File` JPEG allégé. Utile pour les captures d'écran, qui dépassent
 * vite la limite de corps de requête de la plateforme (~4,5 Mo sur Vercel) et
 * font échouer silencieusement les uploads via Server Action.
 *
 * Les fichiers non-images sont renvoyés tels quels (rien à compresser ici).
 */
export async function compresserImage(file: File, maxLargeur = 1600): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new window.Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });

  const ratio = Math.min(1, maxLargeur / img.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * ratio);
  canvas.height = Math.round(img.height * ratio);
  const ctx = canvas.getContext("2d");
  if (!ctx) return file; // pas de canvas : on renvoie l'original plutôt que d'échouer

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.82),
  );
  if (!blob || blob.size >= file.size) return file; // compression non bénéfique

  const nom = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], nom, { type: "image/jpeg" });
}

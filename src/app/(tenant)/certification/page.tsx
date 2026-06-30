import { redirect } from "next/navigation";

// Le cycle de certification est désormais un onglet du Planning qualité
// (/calendrier). On conserve cette route en redirection pour les liens existants.
export default function CertificationPage() {
  redirect("/calendrier");
}

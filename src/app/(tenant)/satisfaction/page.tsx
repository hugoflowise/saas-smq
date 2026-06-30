import { redirect } from "next/navigation";

// La satisfaction client est désormais portée par le module « Suivi de
// prestation » (le compte rendu BM alimente le NPS, les notes et les
// réclamations). On redirige l'ancienne URL pour ne casser aucun lien.
export default function SatisfactionPage() {
  redirect("/suivi-prestation");
}

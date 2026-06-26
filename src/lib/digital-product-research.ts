/**
 * NORA — Digital Product Research Sheet (Wissensbasis für PROJ-9: Produkt-Chancen)
 *
 * Kuratierte Liste bereits VERKAUFTER digitaler Produktformate ("Proof of demand").
 * NORA leitet daraus täglich genau eine konkrete, nachfrage-validierte Produkt-Chance ab
 * und nennt das belegende Format als Nachweis.
 *
 * Menschenlesbare Quelle: docs/research/digital-product-research.md
 * Pflege: Stefan (oder Claude Code) editiert diese Konstante und deployed neu.
 * Bewusst als gebündelte Konstante (analog NORA_COMPANY_CONTEXT) statt FS-Read/Notion,
 * damit sie in der Serverless-Umgebung garantiert verfügbar ist (Architecture 2026-06-17).
 *
 * Best-effort: Ist diese Konstante leer, überspringt generateProductOpportunity() still.
 */
export const DIGITAL_PRODUCT_RESEARCH = `
# Digital Product Research Sheet — bereits verkaufte Formate (Nachfrage-Belege)

Jede Zeile ist ein marktbewährtes digitales Produktformat. Felder:
Format · Preisrahmen · Versprechen · Zielgruppe · gelöstes Problem · Verkaufsplattformen · Nachfrage-Signal.

1. **Digitaler Budget-/Finanz-Planner** (GoodNotes + Google Sheets, undatiert) · 5–25 $ ·
   „Bring deine Finanzen in Minuten pro Tag unter Kontrolle" · junge Berufstätige, Paare, Schulden-Abbau ·
   Geld-Angst, kein Tracking-System · Etsy, Gumroad, TikTok, Pinterest ·
   Top-Etsy-Digital-Kategorie, immergrünes hohes Suchvolumen.

2. **All-in-One Digital-Planner 2026** (verlinkt, iPad/GoodNotes/Notability) · 10–35 $ ·
   „Steuere dein ganzes Jahr vom iPad" · Tablet-Nutzer, Studierende, Organisations-Typen ·
   verstreute To-dos über Apps & Papier · Etsy, TikTok, Instagram ·
   dominante Etsy-Planner-Kategorie pro Neujahrs-Zyklus.

3. **Notion Business-/Creator-OS-Template** (Startup OS, Client CRM, Content-Kalender) · 19–99 $ ·
   „Führe dein Business aus einem Notion-Workspace" · Gründer, Freelancer, Creator, kleine Teams ·
   Tool-Wildwuchs, keine zentrale Wahrheit · Gumroad, Notion-Gallery, YouTube, X ·
   Top-Creator 500–10.000 $/Monat; Thomas Frank ~1 Mio $.

4. **Fitness- + Meal-Planner-Bundle** (Workout-Log, Makros, Einkaufsliste, 70+ Seiten) · 8–13 $ ·
   „Werde fit ohne Rätselraten bei Training & Ernährung" · Anfänger, Neujahrs-Vorsätze, beschäftigte Eltern ·
   Überforderung beim Start einer Routine · Gumroad, Etsy, TikTok, Instagram ·
   starke TikTok-Discovery; Bundles 7,99–12,97 $.

5. **Printable Wall Art** (abstrakt / botanisch / minimalistische Zitate) · 2–35 $ (Sets höher) ·
   „Designer-Wandkunst, sofort herunterladen, zuhause drucken" · Mieter, Erstbezieher, Geschenke-Käufer ·
   günstige Deko sofort, ohne Versandwartezeit · Etsy, Pinterest, Instagram ·
   Etsys volumenstärkste Digital-Kategorie — 400k+ Suchen/Monat, 90–95% Marge.

6. **AI-/ChatGPT-Prompt-Pack** (Nischen-Workflow-Packs, z. B. für Marketer) · 5–47 $ ·
   „Überspring die Lernkurve — copy-paste Prompts, die funktionieren" · Solopreneure, Marketer, AI-Neugierige ·
   wissen nicht, wie man gute AI-Outputs erzeugt · Gumroad, Etsy ·
   schnell wachsende 2026-Nische; spezialisierte Packs (27–47 $) schlagen generische.

7. **Social-Media Canva-Template-Pack** (Instagram, Branding-Kits) · 8–35 $ ·
   „On-Brand-Posts in Minuten, ohne Designer" · Kleinunternehmer, Coaches, Content-Creator ·
   inkonsistentes Branding, keine Zeit/Skill zum Designen · Etsy, Pinterest, Instagram ·
   Median-Etsy-Template ~5,50 $; Top-Verkäufer 3.000–10.000+ $/Monat.

8. **Kleinunternehmer-Finanz-Templates** (GuV, Rechnung, Steuer-Tracker-Sheets) · 19–49 $ ·
   „Wirke professionell und bleib steuerbereit" · Solo-Gründer, Etsy-Verkäufer, Freelancer ·
   Buchhaltungs-Graus, unprofessioneller Auftritt · Etsy, Gumroad ·
   hohe Zahlungsbereitschaft (19–49 $).

9. **Self-Help-/Fitness-/Finanz-eBook** (Lead-Magnet oder bezahlt) · 7–29 $ ·
   „Die Abkürzung zu [Ergebnis] in einem Buch" · Selbstoptimierer, Nischen-Hobbyisten ·
   wollen schnelle, vertrauenswürdige Antwort auf ein Ziel · Amazon KDP, Gumroad ·
   nahezu 100% Marge; durchgängig Top-Format mit niedriger Einstiegshürde.

10. **ATS-freundliches Resume-/CV-Template** (Word + Google Docs + Anschreiben) · 4–19 $ ·
    „Mehr Interviews mit einem recruiter-tauglichen Lebenslauf" · Jobsuchende, Quereinsteiger, Absolventen ·
    Lebensläufe von ATS aussortiert, Design-Angst · Etsy ·
    5.000+ Resume-Template-Listings auf Etsy; stabile Star-Seller-Kategorie.

11. **Lehrer-/Homeschool-Printables** (Stundenplaner, Arbeitsblätter) · 4–19 $ ·
    „Spar Vorbereitungs-Stunden mit fertigen Unterrichtsmaterialien" · Lehrkräfte, Homeschool-Eltern, Nachhilfe ·
    keine Zeit, Material selbst zu bauen · Etsy, TpT-artige Marktplätze ·
    durchgängig hohe, stabile Nachfrage (4–19 $).

12. **Self-Care-/Wellness-Journal** (Tages-Prompts, Habit- + Mood-Tracking) · 5–18 $ ·
    „5 Minuten am Tag für mehr Kontrolle" · wellness-orientierte Millennials/Gen Z ·
    Stress, Burnout, keine Reflexions-Routine · Etsy, TikTok, Instagram, Pinterest ·
    häufig in viralem Self-Care-Planner-Content; Printable- + GoodNotes-Varianten.

## Stärkste Multi-Plattform-Nachfrage (mehrere Kanäle + Reaktionen)
Budget-/Finanz-Planner, Fitness-+Meal-Planner-Bundle, Printable Wall Art, Notion-Templates, Canva-Templates.
`.trim()

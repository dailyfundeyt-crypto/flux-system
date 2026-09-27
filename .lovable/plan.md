# Flux Warenhandels-App

## Ziel
Eine mobil optimierte Warenhandels-App mit vier direkt nutzbaren Bereichen: Ankauf, Verkauf, Lieferung und Umsatz. Die obere Navigation funktioniert per Antippen und durch horizontales Wischen zwischen den Bereichen.

## Umsetzung
- Das bereitgestellte Flux-Logo als App-Logo und daraus abgeleitetes App-Symbol einbinden.
- Eine kompakte Kopfzeile mit Logo, Datum und einer vierteiligen Tab-Leiste erstellen; der aktive Tab erhält einen gleitenden Indikator.
- Horizontales Wischen mit Einrasten zwischen den vier Ansichten umsetzen und die Tab-Auswahl synchron halten.
- **Ankauf:** Kennzahlen, letzte Einkäufe und Formular für Lieferant, Artikel, Menge und Einkaufspreis.
- **Verkauf:** Kennzahlen, letzte Verkäufe und Formular für Kunde, Artikel, Menge und Verkaufspreis.
- **Lieferung:** Statusübersicht, anstehende Lieferungen und Formular für Empfänger, Adresse, Termin und Status.
- **Umsatz:** Gesamtumsatz, Entwicklung, Gewinnspanne, einfache Balkendarstellung und jüngste Buchungen.
- Formulareingaben lokal in der laufenden Sitzung ergänzen, Summen aktualisieren und Erfolgsmeldungen anzeigen; dauerhafte Speicherung ist nicht Teil dieser Version.
- Layout für kleine Smartphones bis Desktop sauber anpassen, mit gut lesbaren Tabellen und touchfreundlichen Bedienelementen.
- Seitentitel und Vorschautexte passend zu Flux setzen.

## Gestaltung
- Präzise, moderne Handelsoberfläche mit hellem Grund, dunkler Schrift und dem kräftigen Blau des Logos als Akzent.
- Klare Hierarchie, kompakte Kennzahlen und zurückhaltende Bewegung beim Wechsel der Bereiche.
- Keine Marketingseite: Die App öffnet direkt im Arbeitsbereich.

## Technische Hinweise
- React/TanStack-Oberfläche mit semantischen Designfarben.
- Native Pointer-/Touch-Gesten und CSS-Snap für zuverlässiges Wischen.
- Das hochgeladene Logo wird als optimiertes Projektbild eingebunden; das App-Symbol wird daraus erzeugt.

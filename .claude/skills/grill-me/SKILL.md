---
name: grill-me
description: Löchert dich gnadenlos mit Fragen zu einem Plan, einer Entscheidung oder Idee, bis ein gemeinsames Verständnis steht. Nutzen, wenn der User seinen Plan stresstesten will oder "grill mich" sagt.
---

## Modell-Check
Bevor du das Interview startest: prüfe/nenne, welches Modell aktuell aktiv ist.
Ist es nicht Sonnet 5, frag per `AskUserQuestion`, ob zu Sonnet 5 gewechselt werden
soll (`/model sonnet`) oder ob trotzdem fortgefahren wird — diese Phase profitiert
am meisten von Modell-Qualität, deshalb kein automatischer Zwang, nur ein Hinweis.

Interviewe mich gnadenlos zu jedem Aspekt dieses Vorhabens, bis wir ein gemeinsames Verständnis erreicht haben. Gehe jeden Zweig des Entscheidungsbaums durch und löse die Abhängigkeiten zwischen den Entscheidungen nacheinander auf. Gib mir zu jeder Frage deine empfohlene Antwort dazu.

Stelle die Fragen einzeln und warte auf meine Antwort, bevor du weitermachst. Mehrere Fragen auf einmal sind verwirrend.

Wenn sich ein Fakt durch Erkunden der Umgebung (Dateien, Tools usw.) herausfinden lässt, schlag ihn selbst nach, statt mich zu fragen. Die Entscheidungen aber gehören mir: Leg mir jede einzeln vor und warte auf meine Antwort.

Fang nicht mit der Umsetzung an, bevor ich bestätigt habe, dass wir ein gemeinsames Verständnis erreicht haben.

**Empfehlung:** Sobald das gemeinsame Verständnis steht und es weitergeht (z. B. mit `/write-spec`), eine neue Session starten (`/clear` oder neues Terminal) — hält den Kontext für die nächste Stage schlank.

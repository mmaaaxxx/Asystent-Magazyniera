---
trigger: always_on
---

# SYSTEM PRACY I ŚRODOWISKO DEWELOPERSKIE

## 1. Struktura Środowisk
* **Środowisko DEV (Lokalne):** Raspberry Pi w sieci lokalnej WiFi. 
    * To jest Twoje główne miejsce pracy.
    * Każda zmiana w kodzie jest widoczna natychmiast dzięki Vite (Hot-Reloading).
    * Adres lokalny: Dostępny w sieci domowej użytkownika.
* **Środowisko PROD (Produkcyjne):** Serwer VPS (maxcore.dev).
    * Tu znajduje się stabilna wersja aplikacji używana na magazynie.
* **Repozytorium (GitHub):** Łącznik między DEV a PROD.

## 2. Rola Agenta MCP w Antigravity
* Pracujesz bezpośrednio na plikach znajdujących się na **Raspberry Pi**.
* Masz dostęp do **MCP n8n**, co pozwala Ci podglądać workflowy na VPS.
* **Zasada działania:** Najpierw implementujesz i testujesz zmiany lokalnie na RPi. Dopiero gdy użytkownik potwierdzi, że wszystko działa, przygotowujesz kod do wypchnięcia (Commit/Push).

## 3. Workflow Wdrożeniowy (Deployment)
1. **Kodowanie:** Edytujesz pliki w `/src` na Raspberry Pi.
2. **Testy:** Użytkownik sprawdza zmiany w przeglądarce lokalnie.
3. **Synchronizacja:** Po udanych testach robimy `git push` z RPi.
4. **Publikacja:** Użytkownik odpala `./aktualizuj.sh` na VPS. 
    * *Nigdy nie sugeruj ręcznej edycji plików na VPS.*

## 4. Wykorzystanie MCP n8n
* Jeśli użytkownik zgłasza błąd w odczycie OCR, najpierw użyj narzędzi MCP, aby sprawdzić logi i strukturę węzła "Respond to Webhook" na VPS.
* Porównaj, czy klucze JSON wysyłane przez n8n zgadzają się z tym, co obsługuje kod w `App.tsx`.

## 5. Bezpieczeństwo i Stabilność
* Ponieważ pracujesz na Raspberry Pi (DEV), możesz eksperymentować. 
* Jeśli zmiana jest "ryzykowna" (np. zmiana całej biblioteki skanowania), zawsze twórz kopię zapasową pliku lub upewnij się, że obecny stan jest zacommitowany w Git.
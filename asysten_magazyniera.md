\# wWersja pierwsza instrukcji:



Projekt: Asystent Magazyniera v3.0 🎯 Cel projektu Aplikacja typu PWA (Progressive Web App) przeznaczona dla pracowników magazynu, mająca na celu maksymalne uproszczenie ewidencji i zarządzania zgłoszeniami odbioru sprzętu (OST) oraz kontroli stanów magazynowych (ZAPAS). Program stawia na szybkość działania dzięki integracji ze sztuczną inteligencją i automatyzacją. 💻 Stack Technologiczny Frontend: React 19, TypeScript, Vite, Tailwind CSS. Ikony: Lucide-react. Komunikacja API: Axios. Skanowanie: html5-qrcode (tradycyjne kody kreskowe). Backend \& Automatyzacja: n8n (self-hosted na VPS). Sztuczna Inteligencja: Google Gemini 1.5 Flash (używany jako silnik OCR przez n8n). Infrastruktura: Serwer VPS, Nginx (Reverse Proxy, SSL), GitHub. 🛠️ Architektura i API (Webhooks n8n) Aplikacja komunikuje się z serwerem n8n pod domeną n8n.maxcore.dev za pomocą dedykowanych webhooków: GET /pobierz-zgloszenia: Pobiera listę aktywnych i archiwalnych zamówień. POST /dodaj-zgloszenie: Dodaje nową referencję do bazy danych. POST /zatwierdz-zgloszenie: Archiwizuje zgłoszenie. POST /kasuj-zgloszenie: Trwale usuwa rekord. POST /ocr-analiza: Wysyła zdjęcie do Gemini 1.5 Flash, które zwraca odczytany tekst (referencję). 🚀 Kluczowe Funkcjonalności Dashboard: Statystyki zgłoszeń (łącznie, niepotwierdzone, archiwum). Zarządzanie listą: Przeglądanie, filtrowanie (Search), zatwierdzanie i usuwanie zgłoszeń. Wielokanałowe dodawanie zgłoszeń: Wpis ręczny. Skaner Barcode: Szybkie czytanie kodów kamerą z obsługą Zoomu i latarki. AI Foto Skaner (OCR): Innowacyjna funkcja – robisz zdjęcie etykiety, Gemini wyciąga z niego czysty numer referencyjny i automatycznie uzupełnia formularz. UX Magazynowy: Automatyczne przenoszenie focusu na pole "Ilość" po udanym skanie/OCR oraz sukcesywne powiadomienia Toast. 📂 Repozytorium i Środowisko GitHub: mmaaaxxx/asystent-magazyniera. Deploy: Aplikacja działa na VPS, aktualizowana skryptem ./aktualizuj.sh. Wskazówka dla ChatGPT Projects: "Używaj powyższych informacji jako stałego kontekstu. Przy generowaniu nowych funkcji w App.tsx pamiętaj o zachowaniu spójności ze stylem Tailwind CSS oraz strukturą danych n8n (zawsze sprawdzaj, czy dane przychodzą jako tablica json czy płaski obiekt)." czekaj wiecej ifnromacji na temat projketu AI Asystent Magazyniera



\# Wersja druga w celu uzupełnienia info o projekcie:



Oto kompletny, rozszerzony dokument techniczny projektu. Został przygotowany tak, aby po wklejeniu do ChatGPT Projects lub jako Custom Instructions, AI miało pełną wiedzę o każdym aspekcie Twojej aplikacji – od kodu, przez infrastrukturę, aż po logikę n8n.Możesz nazwać ten plik ASISTENT\_MAGAZYNIERA\_MASTER\_DOC.md.📘 DOKUMENTACJA MASTER: ASYSTENT MAGAZYNIERA V3.01. WIZJA I CEL PROJEKTUAplikacja mobilna typu PWA stworzona dla usprawnienia procesów magazynowych (głównie dla produktów marki Hager). Głównym zadaniem jest eliminacja ręcznego wpisywania numerów referencyjnych poprzez wykorzystanie skanera kodów kreskowych oraz AI Foto Skanera (OCR) opartego na modelu Gemini 1.5 Flash.2. STACK TECHNOLOGICZNY (FULL-STACK)Frontend (Aplikacja):Framework: React 19 (TypeScript) + Vite.Stylizacja: Tailwind CSS (Mobile-first, Dark Mode).Ikony: Lucide-react.Komunikacja: Axios (pancerna obsługa błędów i asynchroniczność).Skanowanie: html5-qrcode (tradycyjne kody).PWA: Service Workers + Manifest.json (instalacja jako natywna apka na iPhone/Android).Backend (Automatyzacja):Silnik: n8n (wersja Self-hosted na VPS).Logika: Workflowy oparte na Webhookach.AI: Google Gemini 1.5 Flash (analiza obrazu i wyodrębnianie tekstu).Infrastruktura:Serwer: VPS (Linux Ubuntu/Debian).WWW: Nginx (jako Reverse Proxy z certyfikatem SSL Let's Encrypt).Deployment: Git -> GitHub -> skrypt ./aktualizuj.sh na serwerze.3. MAPA INFRASTRUKTURY I BEZPIECZEŃSTWASzczegóły VPS:Domena główna: n8n.maxcore.dev (obsługuje panel n8n oraz webhooki).Zabezpieczenia Nginx:client\_max\_body\_size 50M: Pozwala na przesyłanie zdjęć wysokiej rozdzielczości do AI bez błędu 413.SSL: Pełne szyfrowanie HTTPS dla wszystkich połączeń.Zarządzanie procesami: Usługi n8n zarządzane przez PM2 lub Docker, co zapewnia automatyczny restart po awarii.4. SPECYFIKACJA API (WEBHOOKI n8n)Wszystkie zapytania kierowane są na https://n8n.maxcore.dev/webhook/.EndpointMetodaOpis/pobierz-zgloszeniaGETPobiera wszystkie rekordy z bazy./dodaj-zgloszeniePOSTDodaje nowy rekord (referencja, ilosc, typ)./zatwierdz-zgloszeniePOSTPrzenosi rekord do archiwum (status: ZATWIERDZONE)./kasuj-zgloszeniePOSTTrwale usuwa rekord z bazy danych./ocr-analizaPOSTPrzyjmuje plik (klucz data) i zwraca odczytany tekst.5. LOGIKA AI FOTO SKANER (OCR)To najbardziej krytyczny element aplikacji.Wysyłka: Plik ze zdjęcia systemowego wysyłany jest jako FormData z kluczem data.Workflow n8n: Webhook -> Basic LLM Chain (Gemini 1.5 Flash) -> Respond to Webhook.Struktura odpowiedzi: n8n zwraca tablicę obiektów: \[{ "text": "KOD" }].Implementacja w React:TypeScriptconst result = Array.isArray(response.data) ? response.data\[0]?.text : response.data?.text;

Automatyzacja UI: Po otrzymaniu kodu, system:Wpisuje kod do pola referencja.Ustawia typ na OST.Focus: Automatycznie przenosi kursor do pola ilosc.6. MODELE DANYCH (TYPESCRIPT)TypeScriptexport type OrderType = 'OST' | 'ZAPAS';



export interface Order {

  id: number;

  referencja: string;

  ilosc: number;

  typ: OrderType;

  status: 'UTWORZONE' | 'ZATWIERDZONE';

  data\_utworzenia: string;

}

7\. ZASADY UX I DESIGNU (DLA CHATGPT)Kolory: Tło aplikacji slate-50, tło Sidebaru slate-900. Akcenty: blue-600 (akcja), orange-600 (logo Hager).Responsywność: Wszystkie przyciski muszą być łatwo klikalne kciukiem. Używamy padding-bottom: env(safe-area-inset-bottom) dla iPhone'ów.Komunikaty: Używamy komponentu Toast (sukcesy na zielono, błędy na czerwono).Ładowanie: Podczas pracy AI (isAnalyzingAI), przycisk aparatu zmienia się w kręcący się spinner (Loader2).8. INSTRUKCJE DLA DEWELOPERA (PROMPT)Gdy prosisz ChatGPT o modyfikację kodu, oczekuj, że:Zawsze używa TypeScript (żadnego czystego JS).Tailwind CSS jest jedynym sposobem stylowania.Zachowuje stan newOrderForm podczas aktualizacji poszczególnych pól.Pamięta o strukturze danych z n8n (zawsze sprawdzaj, czy dane są w tablicy).Dodaje console.log dla kluczowych operacji API, aby ułatwić debugowanie na VPS.9. ROADMAPA (PLANY ROZWOJU)\[ ] Automatyczne tworzenie kopii zapasowej bazy danych przez n8n.\[ ] Moduł "Przypomnienia" – powiadomienia o starych, niezatwierdzonych zgłoszeniach.\[ ] Dashboard z wykresami (ilość skanowań dziennie).





App.tsx jest głównym sercem aplikacji i tam znajduje się 90% logiki. Agent powinien zawsze zaczynać od analizy tego pliku, zanim zaproponuje zmiany w innych częściach systemu.



2\. Wykorzystanie narzędzi MCP Skoro agent ma dostęp do MCP dla n8n, dodaj mu instrukcję:



"Jeśli napotkasz błąd komunikacji z API (np. 502 lub 404), użyj swoich narzędzi MCP, aby sprawdzić stan workflowów w n8n przed edycją kodu w React." To sprawi, że agent najpierw "naprawi wtyczkę w gniazdku" (n8n), zamiast niepotrzebnie psuć działający kod aplikacji.





UX/UI Integrity Guardrails (Nienaruszalność Designu)

Spójność Tailwind: Nigdy nie wprowadzaj nowych kolorów spoza palety slate i blue-600 / orange-600. Jeśli potrzebujesz koloru ostrzegawczego, używaj red-600.



Komponenty Lucide: Nie zmieniaj rozmiarów ikon (w-5 h-5) ani ich stylu bez wyraźnej prośby.



Mobile-First Safety: Pamiętaj, że aplikacja jest używana na iPhone. Każda zmiana w UI musi uwzględniać:



Touch Targets: Przyciski muszą mieć min. h-12 lub odpowiedni padding, aby łatwo było w nie trafić kciukiem.



Zasada "Kciuka": Najważniejsze akcje powinny być w zasięgu dolnej połowy ekranu.



Brak "Latających" Elementów: Wszystkie nowe pola muszą być wyrównane do istniejącej siatki (używaj space-y-4 w formularzach i rounded-xl dla kontenerów).



Stan Wizualny: Każda operacja asynchroniczna (API) musi mieć odzwierciedlenie w UI (spinner, zablokowany przycisk lub Toast).


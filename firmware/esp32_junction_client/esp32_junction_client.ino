// SIH25022 - ESP32 junction client firmware
// -----------------------------------------------------------------------------
// Decision-support prototype.  The ESP32 reports sensor events and displays the
// backend's ADVISORY aspect.  It makes no local movement decision once connected.
//
// Hardware contract (locked - see docs/hardware_contract.md):
//   A1 GPIO 22  Train A approaching   block A: free -> occupied
//   A2 GPIO 19  Train A cleared       block A: occupied -> free
//   B1 GPIO 21  Train B approaching   block B: free -> occupied
//   B2 GPIO 18  Train B cleared       block B: occupied -> free
//
// Debouncing is done here (hardware team's design).  The backend additionally
// de-duplicates on `seq`.
//
// Wokwi note: Wokwi cannot reach your laptop's localhost.  Either use the
// machine's LAN IP (e.g. http://192.168.1.50:8000) or a tunnel, and add that
// origin to ALLOWED_ORIGINS in backend/main.py.

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ---------------------------------------------------------------- configuration
static const char* WIFI_SSID     = "YOUR_WIFI_SSID";
static const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Wokwi: use the LAN IP or a tunnel URL, NOT localhost.
static const char* BACKEND_BASE  = "http://192.168.1.50:8000";

static const int PIN_A1 = 22;   // Train A approaching
static const int PIN_A2 = 19;   // Train A cleared
static const int PIN_B1 = 21;   // Train B approaching
static const int PIN_B2 = 18;   // Train B cleared

// Signal LEDs (set to -1 if your board has none).
static const int LED_PROCEED = 2;
static const int LED_HOLD    = 4;
static const int LED_LINK    = 5;   // distinct blink = backend unreachable / stale

static const unsigned long POLL_INTERVAL_MS   = 1500;  // spec: poll every 1-2 s
static const unsigned long DEBOUNCE_MS        = 250;   // hardware debounce
static const unsigned long BACKOFF_MIN_MS     = 1000;
static const unsigned long BACKOFF_MAX_MS     = 16000;
static const unsigned long STALE_AFTER_MS     = 10000; // mirrors the backend default

// ------------------------------------------------------------------- state
struct SensorConfig {
  int pin;
  const char* sensorId;   // A1 / A2 / B1 / B2
  const char* state;      // occupied / free
  const char* source;
  uint32_t  seq;          // monotonically increasing per source
  int       lastLevel;
  unsigned long lastChangeMs;
};

SensorConfig sensors[4] = {
  { PIN_A1, "A1", "occupied", "sensor_A1", 0, HIGH, 0 },
  { PIN_A2, "A2", "free",     "sensor_A2", 0, LOW,  0 },
  { PIN_B1, "B1", "occupied", "sensor_B1", 0, HIGH, 0 },
  { PIN_B2, "B2", "free",     "sensor_B2", 0, LOW,  0 },
};

unsigned long lastPollMs       = 0;
unsigned long lastSuccessMs    = 0;
unsigned long backoffMs        = BACKOFF_MIN_MS;
bool          linkHealthy      = false;
bool          dataStale       = true;
String        lastReason      = "No data yet";


// ------------------------------------------------------------------ helpers
// Seed `seq` at boot so a reboot can never be rejected as a stale sequence.
// Documented alternative: POST /sensor-event/reset.
static void seedSequenceNumbers() {
  uint32_t seed = (uint32_t)(millis() / 1000ULL) + 1;
  for (auto& s : sensors) { s.seq = seed; }
  Serial.printf("[boot] seq seeded at %lu\n", (unsigned long)seed);
}

static void setLed(int pin, bool on) {
  if (pin >= 0) { digitalWrite(pin, on ? HIGH : LOW); }
}

static void blinkLinkLed(int times) {
  if (LED_LINK < 0) return;
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_LINK, HIGH); delay(120);
    digitalWrite(LED_LINK, LOW);  delay(120);
  }
}

// Safe state used whenever the backend is unreachable or the data is stale.
// Conservative default: both aspects HOLD, plus a distinct link blink.
static void safeSignalState() {
  setLed(LED_PROCEED, false);
  setLed(LED_HOLD, true);
  blinkLinkLed(3);
}

// ------------------------------------------------------------------ setup
void setup() {
  Serial.begin(115200);
  delay(400);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("[wifi] connecting");
  while (WiFi.status() != WL_CONNECTED) { delay(400); Serial.print("."); }
  Serial.printf("\n[wifi] connected, ip=%s\n", WiFi.localIP().toString().c_str());

  for (auto& s : sensors) {
    pinMode(s.pin, INPUT_PULLUP);
    s.lastLevel = digitalRead(s.pin);
  }
  for (int pin : { LED_PROCEED, LED_HOLD, LED_LINK }) {
    if (pin >= 0) { pinMode(pin, OUTPUT); digitalWrite(pin, LOW); }
  }

  seedSequenceNumbers();   // contract section 3.3
  lastSuccessMs = millis();
}

// ------------------------------------------------- POST /sensor-event
static void postSensorEvent(SensorConfig& s) {
  if (WiFi.status() != WL_CONNECTED) { safeSignalState(); return; }

  JsonDocument doc;
  doc["block_id"]   = s.sensorId;
  doc["state"]      = s.state;
  doc["event_type"] = "sensor_triggered";
  doc["timestamp"]  = (uint64_t)millis() + 1732500000000ULL;  // epoch millis
  doc["source"]     = s.source;
  doc["seq"]        = s.seq;

  String body;
  serializeJson(doc, body);

  HTTPClient http;
  http.setTimeout(4000);
  http.begin(String(BACKEND_BASE) + "/sensor-event");
  http.addHeader("Content-Type", "application/json");
  int code = http.POST(body);
  String response = (code > 0) ? http.getString() : "";
  http.end();

  if (code == 200) {
    linkHealthy = true;
    lastSuccessMs = millis();
    backoffMs = BACKOFF_MIN_MS;
    Serial.printf("[event] %s seq=%lu -> %s\n", s.sensorId,
                  (unsigned long)s.seq, response.c_str());
  } else {
    linkHealthy = false;
    Serial.printf("[event] %s FAILED http=%d\n", s.sensorId, code);
    safeSignalState();
  }
  s.seq++;   // advance only after the event has been dispatched
}

// ------------------------------------------------- GET /block-state
static void pollBlockState() {
  if (WiFi.status() != WL_CONNECTED) { safeSignalState(); return; }

  HTTPClient http;
  http.setTimeout(4000);
  http.begin(String(BACKEND_BASE) + "/block-state");
  int code = http.GET();
  if (code != 200) {
    linkHealthy = false;
    http.end();
    safeSignalState();
    return;
  }

  String payload = http.getString();
  http.end();

  JsonDocument doc;
  if (deserializeJson(doc, payload)) { linkHealthy = false; safeSignalState(); return; }

  linkHealthy = true;
  lastSuccessMs = millis();
  backoffMs = BACKOFF_MIN_MS;
  dataStale = doc["stale"] | false;
  lastReason = doc["reason"] | "";

  // `blocks` is [{block_id, signal}] - tiny and stable so parsing stays cheap.
  bool aProceed = false, bProceed = false;
  for (JsonObject block : doc["blocks"].as<JsonArray>()) {
    String id  = block["block_id"] | "";
    String sig = block["signal"]  | "";
    bool proceed = (sig == "PROCEED");
    if (id == "A") aProceed = proceed;
    if (id == "B") bProceed = proceed;
  }

  // If the data is stale we do NOT trust a previous PROCEED.
  if (dataStale) { aProceed = false; bProceed = false; }

  setLed(LED_PROCEED, aProceed || bProceed);
  setLed(LED_HOLD,    !dataStale && (!aProceed || !bProceed));
  if (dataStale) blinkLinkLed(3);

  Serial.printf("[state] A=%s B=%s stale=%s | %s\n",
                aProceed ? "PROCEED" : "HOLD",
                bProceed ? "PROCEED" : "HOLD",
                dataStale ? "true" : "false",
                lastReason.c_str());
}

// ------------------------------------------------------------------- loop
void loop() {
  unsigned long now = millis();

  // -- debounced sensor edges -> sensor events
  for (auto& s : sensors) {
    int level = digitalRead(s.pin);
    if (level != s.lastLevel && (now - s.lastChangeMs) > DEBOUNCE_MS) {
      s.lastLevel = level;
      s.lastChangeMs = now;
      postSensorEvent(s);
    }
  }

  // -- poll the advisory aspect, with exponential backoff after failures
  if (linkHealthy && (now - lastPollMs) >= POLL_INTERVAL_MS) {
    lastPollMs = now;
    pollBlockState();
  } else if (!linkHealthy && (now - lastPollMs) >= backoffMs) {
    lastPollMs = now;
    pollBlockState();
    backoffMs = min(backoffMs * 2, (unsigned long)BACKOFF_MAX_MS);
  }

  // -- local staleness guard: the backend may simply have gone away
  if (linkHealthy && (now - lastSuccessMs) > STALE_AFTER_MS) {
    linkHealthy = false;
    safeSignalState();
  }

  delay(20);
}

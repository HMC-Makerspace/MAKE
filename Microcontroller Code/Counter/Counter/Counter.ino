#include <WiFiClientSecure.h>
#include <Adafruit_AW9523.h>

Adafruit_AW9523 aw;

// Enter your WiFi SSID and password
char ssid[] = "Claremont-ETC";             // your network SSID (name)
char pass[] = "Cl@remontI0T";    // your network password (use for WPA, or use as key for WEP)
int keyIndex = 0;                      // your network key Index number (needed only for WEP)

int status = WL_IDLE_STATUS;
// if you don't want to use DNS (and reduce your sketch size)
// use the numeric IP instead of the name for the server:
//IPAddress server(74,125,232,128);  // numeric IP for Google (no DNS)

#define SERVER "make.hmc.edu"
#define PATH   "/api/v1/usage/add_button_log/{admin_key}"

// Initialize the SSL client library
// with the IP address and port of the server
// that you want to connect to (port 443 is default for HTTPS):
WiFiClientSecure client;

// Button pinouts
// aw pins have are over 100
int r[] = {109, 108, 14, 8, 17, 16, 15};
int g[] = {104, 103, 111, 110, 102, 101, 100};
int b[] = {115, 114, 106, 105, 113, 112, 107};


void setup() {
  //Initialize serial and wait for port to open:
  Serial.begin(115200);
  while (!Serial) {
    ; // wait for serial port to connect. Needed for native USB port only
  }

  Serial.println("Adafruit AW9523 GPIO Expander test!");

  if (! aw.begin(0x58)) {
    Serial.println("AW9523 not found? Check wiring!");
    while (1) delay(10);  // halt forever
  }

  Serial.println("AW9523 found!");

  for (int i = 0; i < 16; i++) {
      aw.pinMode(i, AW9523_LED_MODE); // set to constant current drive!
  }

  pinMode(14,OUTPUT);
  pinMode(8,OUTPUT);
  pinMode(17,OUTPUT);
  pinMode(16,OUTPUT);
  pinMode(15,OUTPUT);
    
  // attempt to connect to Wifi network:
  Serial.print("Attempting to connect to SSID: ");
  Serial.println(ssid);

  WiFi.begin(ssid, pass);
  while (WiFi.status() != WL_CONNECTED) {
      setAllColor(0, 0, 255);
      delay(200);
      setAllColor(0, 0, 100);
      delay(100);
  }

  Serial.println("");
  Serial.println("Connected to WiFi");
  printWifiStatus();

  client.setInsecure(); // don't use a root cert

  Serial.println("\nStarting connection to server...");
  // if you get a connection, report back via serial:
  if (client.connect(SERVER, 443)) {
    Serial.println("connected to server");
    // Make a HTTP request:
    client.println("POST " PATH " HTTP/1.1");
    client.println("Host: " SERVER);
    client.println("Connection: close");
    client.println();
  }
}

uint32_t bytes = 0;

void aWrite(int pin, int val) {
  if (pin >= 100) {
    aw.analogWrite(pin - 100, val);
  } else {
    analogWrite(pin, val - 255);
  }
}

void setAllColor(int r_val, int g_val, int b_val) {
  for (int i = 0; i < 7; i++) {
    setBtnColor(i, r_val, g_val, b_val);
  }
}

void setBtnColor(int button_index, int r_val, int g_val, int b_val) {
  aWrite(r[button_index], r_val);
  aWrite(g[button_index], g_val);
  aWrite(b[button_index], b_val);
}

void loop() {
  int x = 0;
  
  while (true) {
    for (int i = 0; i < 7; i++) {
          setBtnColor(i, 255, 0, 0);
          delay(500);
          setBtnColor(i, 0, 255, 0);
          delay(500);
          setBtnColor(i, 0, 0, 255);
          delay(500);
    }
  }
  
  // if there are incoming bytes available
  // from the server, read them and print them:
  while (client.available()) {
    char c = client.read();
    Serial.write(c);
    bytes++;
  }

  // if the server's disconnected, stop the client:
  if (!client.connected()) {
    Serial.println();
    Serial.println("disconnecting from server.");
    client.stop();
    Serial.print("Read "); Serial.print(bytes); Serial.println(" bytes");

    // do nothing forevermore:
    while (true);
  }
}


void printWifiStatus() {
  // print the SSID of the network you're attached to:
  Serial.print("SSID: ");
  Serial.println(WiFi.SSID());

  // print your board's IP address:
  IPAddress ip = WiFi.localIP();
  Serial.print("IP Address: ");
  Serial.println(ip);

  // print the received signal strength:
  long rssi = WiFi.RSSI();
  Serial.print("signal strength (RSSI):");
  Serial.print(rssi);
  Serial.println(" dBm");
}

# SolarBridge ESP32 — Inverter WebApp

Web app demo completa per creare un gateway ESP32 collegato a un inverter tramite RJ45/RS485/Modbus, UART, CAN o API locale.

## Cosa contiene

- Dashboard produzione FV, consumo casa, rete e batteria
- Flusso energia visuale
- Telemetria live in JSON
- Storico esportabile CSV
- Pagina profilo inverter
- Configurazione Modbus/RS485
- Placeholder registri Modbus
- Regole batteria
- Automazioni carichi smart
- Allarmi e notifiche
- Tema scuro/chiaro/alto contrasto
- Endpoint previsti per ESP32/backend

## Come provarla

Apri `index.html` nel browser.

## Come usarla davvero con ESP32

La web app è già separata dal layer dati. Al momento `js/app.js` genera dati demo nella funzione `makeData()`.

Per usarla realmente devi sostituire `makeData()` con una chiamata API:

```js
async function makeDataReal() {
  const res = await fetch('/api/status');
  return await res.json();
}
```

Su ESP32 gli endpoint consigliati sono:

```txt
GET  /api/status
GET  /api/history
POST /api/settings
POST /api/modbus/test
POST /api/load/rule
POST /api/ota/update
```

## Dati JSON attesi

```json
{
  "timestamp": "2026-05-28T12:00:00Z",
  "connection": "MODBUS_RTU",
  "inverter": { "status": "OK", "temperature_c": 38, "frequency_hz": 50, "mode": "zero_export" },
  "pv": { "power_w": 3200, "voltage_v": 330, "current_a": 9.7, "energy_today_kwh": 12.4 },
  "load": { "power_w": 1800, "energy_today_kwh": 8.1 },
  "grid": { "power_w": 0, "import_today_kwh": 0.4, "export_w": 0 },
  "battery": { "soc_percent": 82, "voltage_v": 52.4, "current_a": 18.2, "power_w": 950, "energy_today_kwh": 4.6 },
  "alarms": []
}
```

## Nota importante

Prima di collegare fisicamente ESP32 alla porta RJ45 dell'inverter bisogna identificare il pinout reale. Una porta RJ45 su inverter spesso NON è Ethernet: può essere RS485, UART, CAN o protocollo proprietario.

Firma: Stephan Winckler

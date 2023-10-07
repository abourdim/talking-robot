// app.js
import { MicrobitUart } from "./ble-uart.js";

const logEl = document.getElementById("log");
function log(msg) {
  const d = document.createElement("div");
  d.textContent = msg;
  logEl.appendChild(d);
}

const ble = new MicrobitUart({
  onRx: (t) => log("RX: " + t),
  onConnectionChange: (c) => log(c ? "Connected" : "Disconnected"),
});

document.getElementById("bleConnectBtn").onclick = () => ble.connect();
document.getElementById("bleDisconnectBtn").onclick = () => ble.disconnect();
document.getElementById("bleSendBtn").onclick = async () => {
  const txt = document.getElementById("text").value;
  await ble.sendLine(txt);
};

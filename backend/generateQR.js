const QRCode = require("qrcode");

QRCode.toFile("table1.png", "http://192.168.1.44:5173/menu?table=1", function (err) {
  if (err) throw err;
  console.log("QR Code generated!");
});

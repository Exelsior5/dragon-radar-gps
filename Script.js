const canvas = document.getElementById('radar');
const ctx = canvas.getContext('2d');
const form = document.getElementById('destination-form');
let destination = null;

const centerX = canvas.width / 2;
const centerY = canvas.height / 2;

function drawTriangle() {
  const size = 10;
  ctx.fillStyle = 'red';
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - size);
  ctx.lineTo(centerX - size, centerY + size);
  ctx.lineTo(centerX + size, centerY + size);
  ctx.closePath();
  ctx.fill();
}

function drawDot(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fillStyle = 'yellow';
  ctx.fill();
}

function updatePosition() {
  if (!destination) return;

  navigator.geolocation.getCurrentPosition(position => {
    const { latitude: lat1, longitude: lon1 } = position.coords;
    const { latitude: lat2, longitude: lon2 } = destination;

    const dx = (lon2 - lon1) * 100000; // Rough conversion for longitude
    const dy = (lat2 - lat1) * -100000; // Negative to invert Y axis

    let x = centerX + dx;
    let y = centerY + dy;

    // Clamp within radar
    const maxRadius = canvas.width / 2 - 10;
    const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    if (dist > maxRadius) {
      const angle = Math.atan2(y - centerY, x - centerX);
      x = centerX + Math.cos(angle) * maxRadius;
      y = centerY + Math.sin(angle) * maxRadius;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTriangle();
    if (Date.now() % 1000 < 500) drawDot(x, y); // Blink every 500ms
  });
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const lat = parseFloat(document.getElementById('latitude').value);
  const lon = parseFloat(document.getElementById('longitude').value);
  destination = { latitude: lat, longitude: lon };
});

drawTriangle();
setInterval(updatePosition, 1000);

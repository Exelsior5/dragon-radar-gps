const canvas = document.getElementById('radar');
const ctx = canvas.getContext('2d');
const form = document.getElementById('destination-form');
let destination = null;

const centerX = canvas.width / 2;
const centerY = canvas.height / 2;

let dotX = centerX;
let dotY = centerY;
let shouldDrawDot = true;

// Fonction pour dessiner le triangle rouge (ton emplacement)
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

// Fonction pour dessiner le point jaune
function drawDot(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fillStyle = 'yellow';
  ctx.fill();
}

// Clignotement toutes les 500ms
setInterval(() => {
  shouldDrawDot = !shouldDrawDot;
}, 500);

// Met à jour la position toutes les secondes
function updatePosition() {
  if (!destination) return;

  navigator.geolocation.getCurrentPosition(position => {
    const { latitude: lat1, longitude: lon1 } = position.coords;
    const { latitude: lat2, longitude: lon2 } = destination;

    const dx = (lon2 - lon1) * 100000;
    const dy = (lat2 - lat1) * -100000;

    let x = centerX + dx;
    let y = centerY + dy;

    const maxRadius = canvas.width / 2 - 10;
    const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    if (dist > maxRadius) {
      const angle = Math.atan2(y - centerY, x - centerX);
      x = centerX + Math.cos(angle) * maxRadius;
      y = centerY + Math.sin(angle) * maxRadius;
    }

    // Sauvegarde les coordonnées pour les utiliser pendant le clignotement
    dotX = x;
    dotY = y;
  });
}

// Animation continue du radar
function animateRadar() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawTriangle();
  if (destination && shouldDrawDot) {
    drawDot(dotX, dotY);
  }
  requestAnimationFrame(animateRadar);
}

// Gestion du formulaire
form.addEventListener('submit', e => {
  e.preventDefault();
  const lat = parseFloat(document.getElementById('latitude').value);
  const lon = parseFloat(document.getElementById('longitude').value);
  destination = { latitude: lat, longitude: lon };
});

// Lancer les mises à jour GPS + animation
setInterval(updatePosition, 1000);
animateRadar();

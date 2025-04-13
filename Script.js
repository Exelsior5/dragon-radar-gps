const canvas = document.getElementById('radar');
const ctx = canvas.getContext('2d');
const scanButton = document.getElementById('scan-button');
const codeForm = document.getElementById('code-form');
const codeInput = document.getElementById('destination-code');
const validateButton = document.getElementById('set-destination');
const distanceDisplay = document.getElementById('distance');

let destination = null;
let dotX = canvas.width / 2;
let dotY = canvas.height / 2;
let shouldDrawDot = true;

const centerX = canvas.width / 2;
const centerY = canvas.height / 2;

// Code -> adresse
const codeToAddress = {
  'test': "École maternelle publique Louise Michel, 21 Rue de la Concorde, 94400 Vitry-sur-Seine, France"
};

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

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c); // en mètres
}

setInterval(() => {
  shouldDrawDot = !shouldDrawDot;
}, 500);

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

    dotX = x;
    dotY = y;

    const distance = calculateDistance(lat1, lon1, lat2, lon2);
    distanceDisplay.textContent = `Distance restante : ${distance} m`;
  });
}

function animateRadar() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawTriangle();
  if (destination && shouldDrawDot) {
    drawDot(dotX, dotY);
  }
  requestAnimationFrame(animateRadar);
}

scanButton.addEventListener('click', () => {
  codeForm.style.display = 'block';
});

validateButton.addEventListener('click', () => {
  const code = codeInput.value.trim().toLowerCase();
  const address = codeToAddress[code];
  if (!address) {
    alert("Code invalide ou inconnu.");
    return;
  }

  fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(address)}`)
    .then(res => res.json())
    .then(data => {
      if (data.features.length === 0) {
        alert("Adresse non trouvée.");
        return;
      }
      const [lon, lat] = data.features[0].geometry.coordinates;
      destination = { latitude: lat, longitude: lon };
    })
    .catch(err => {
      alert("Erreur lors de la récupération de l'adresse.");
      console.error(err);
    });
});

setInterval(updatePosition, 1000);
animateRadar();

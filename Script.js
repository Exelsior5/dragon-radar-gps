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
let positionHistory = [];
const maxHistory = 5;
let previousPosition = null;
let currentHeading = 0;
let headingSine = 0;
let headingCosine = 0;
let headingSamples = 0;

const centerX = canvas.width / 2;
const centerY = canvas.height / 2;

const codeToAddress = {
  'test': "École maternelle publique Louise Michel, 21 Rue de la Concorde, 94400 Vitry-sur-Seine, France",
  'test2': "50 rue Champollion, 94400 Vitry-sur-Seine, France",
  'test3': "11 rue Saint Paul, 75004 Paris, France"
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

function drawRotatedDot(x, y, angle) {
  const dx = x - centerX;
  const dy = y - centerY;
  const rad = angle * Math.PI / 180;
  const rotatedX = dx * Math.cos(rad) - dy * Math.sin(rad);
  const rotatedY = dx * Math.sin(rad) + dy * Math.cos(rad);

  ctx.beginPath();
  ctx.arc(centerX + rotatedX, centerY + rotatedY, 5, 0, Math.PI * 2);
  ctx.fillStyle = 'yellow';
  ctx.fill();
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

setInterval(() => {
  shouldDrawDot = !shouldDrawDot;
}, 500);

function smoothPosition(position) {
  positionHistory.push(position);
  if (positionHistory.length > maxHistory) {
    positionHistory.shift();
  }
  const avgLat = positionHistory.reduce((sum, p) => sum + p.latitude, 0) / positionHistory.length;
  const avgLon = positionHistory.reduce((sum, p) => sum + p.longitude, 0) / positionHistory.length;
  return { latitude: avgLat, longitude: avgLon };
}

function computeHeading(from, to) {
  const y = Math.sin(to.longitude - from.longitude) * Math.cos(to.latitude);
  const x = Math.cos(from.latitude) * Math.sin(to.latitude) -
            Math.sin(from.latitude) * Math.cos(to.latitude) * Math.cos(to.longitude - from.longitude);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

function handlePosition(position) {
  if (!destination) return;

  const { latitude, longitude, accuracy } = position.coords;
  if (accuracy > 30) return;

  const newPos = { latitude, longitude };

  if (previousPosition) {
    const jump = calculateDistance(latitude, longitude, previousPosition.latitude, previousPosition.longitude);
    if (jump < 100) {
      const rawHeading = computeHeading(previousPosition, newPos);
      const rad = rawHeading * Math.PI / 180;
      headingSine += Math.sin(rad);
      headingCosine += Math.cos(rad);
      headingSamples++;
      const avgRad = Math.atan2(headingSine / headingSamples, headingCosine / headingSamples);
      currentHeading = (avgRad * 180 / Math.PI + 360) % 360;
    }
  }
  previousPosition = newPos;

  const smoothed = smoothPosition(newPos);
  const lat1 = smoothed.latitude;
  const lon1 = smoothed.longitude;
  const lat2 = destination.latitude;
  const lon2 = destination.longitude;

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
}

function animateRadar() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawTriangle();
  if (destination && shouldDrawDot) {
    drawRotatedDot(dotX, dotY, currentHeading);
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

navigator.geolocation.watchPosition(handlePosition, console.error, {
  enableHighAccuracy: true,
  maximumAge: 1000,
  timeout: 5000
});

animateRadar();

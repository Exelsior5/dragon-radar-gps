const canvas = document.getElementById('radar');
const ctx = canvas.getContext('2d');
const scanButton = document.getElementById('scan-button');
const codeForm = document.getElementById('code-form');
const codeInput = document.getElementById('destination-code');
const validateButton = document.getElementById('set-destination');
const distanceDisplay = document.getElementById('distance');

let destination = null;
let dotRelativeAngle = 0;
let shouldDrawDot = true;
let currentDistance = 0;
let referencePosition = null;
let lastHeading = null;

const centerX = canvas.width / 2;
const centerY = canvas.height / 2;

const codeToAddress = {
  'test': "École maternelle publique Louise Michel, 21 Rue de la Concorde, 94400 Vitry-sur-Seine, France",
  'test2': "50 rue Champollion, 94400 Vitry-sur-Seine, France",
  'test3': "11 rue Saint Paul, 75004 Paris, France"
};

// Affiche le triangle rouge au centre
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

// Affiche la boule jaune à un angle relatif
function drawDotAtRelativeAngle(angle) {
  let radiusFactor = 1;
  if (currentDistance >= 500) radiusFactor = 1;
  else if (currentDistance >= 400) radiusFactor = 0.9;
  else if (currentDistance >= 300) radiusFactor = 0.8;
  else if (currentDistance >= 200) radiusFactor = 0.7;
  else if (currentDistance >= 100) radiusFactor = 0.6;
  else if (currentDistance >= 80) radiusFactor = 0.5;
  else if (currentDistance >= 60) radiusFactor = 0.4;
  else if (currentDistance >= 40) radiusFactor = 0.3;
  else if (currentDistance >= 20) radiusFactor = 0.2;
  else if (currentDistance > 7) radiusFactor = 0.1;
  else radiusFactor = 0;

  const radius = (canvas.width / 2 - 20) * radiusFactor;
  const rad = (angle - 90) * Math.PI / 180;
  const x = centerX + radius * Math.cos(rad);
  const y = centerY + radius * Math.sin(rad);

  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fillStyle = 'yellow';
  ctx.fill();
}

// Calcule la distance entre deux coordonnées
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

// Calcule le cap (angle en degrés) entre deux points GPS
function calculateBearing(lat1, lon1, lat2, lon2) {
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) -
            Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  return (θ * 180 / Math.PI + 360) % 360;
}

// Gère la mise à jour de position
function handlePosition(position) {
  const { latitude, longitude, accuracy } = position.coords;
  if (accuracy > 50 || !destination) return;

  currentDistance = calculateDistance(latitude, longitude, destination.latitude, destination.longitude);
  distanceDisplay.textContent = `Distance restante : ${currentDistance} m — Précision GPS : ${Math.round(accuracy)} m`;

  if (referencePosition) {
    const moved = calculateDistance(referencePosition.latitude, referencePosition.longitude, latitude, longitude);
    if (moved >= 10) {
      // Cap de déplacement
      const heading = calculateBearing(referencePosition.latitude, referencePosition.longitude, latitude, longitude);
      lastHeading = heading;
      referencePosition = { latitude, longitude };
    }
  } else {
    referencePosition = { latitude, longitude };
  }

  // Cap vers la cible
  const bearingToTarget = calculateBearing(latitude, longitude, destination.latitude, destination.longitude);

  // Angle relatif (entre direction actuelle et destination)
  if (lastHeading !== null) {
    let relativeAngle = (bearingToTarget - lastHeading + 360) % 360;
    dotRelativeAngle = relativeAngle;
  }
}

// Animation principale
function animateRadar() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawTriangle();
  if (destination && shouldDrawDot) {
    drawDotAtRelativeAngle(dotRelativeAngle);
  }
  requestAnimationFrame(animateRadar);
}

// Interface
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
      referencePosition = null;
      lastHeading = null;
    })
    .catch(err => {
      alert("Erreur lors de la récupération de l'adresse.");
      console.error(err);
    });
});

navigator.geolocation.watchPosition(handlePosition, console.error, {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 10000
});

setInterval(() => {
  shouldDrawDot = !shouldDrawDot;
}, 500);

animateRadar();

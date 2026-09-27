/*
 * City Bank — page de téléchargement.
 *
 * Le lien et le numéro de version se mettent à jour tout seuls : ils sont lus
 * sur la dernière Release GitHub. Il n'y a plus rien à modifier ici quand une
 * nouvelle version sort.
 */
const RELEASES_REPO = 'bisrikarim/city-bank-releases';
const APK_URL = 'https://github.com/' + RELEASES_REPO + '/releases/latest/download/city-bank.apk';
const LATEST_API = 'https://api.github.com/repos/' + RELEASES_REPO + '/releases/latest';

// Affiché tant que GitHub n'a pas répondu, et s'il ne répond pas du tout.
const FALLBACK_VERSION = '1.0.1';

const TAKEN_KEY = 'city-bank:version-telechargee';
const DISMISSED_KEY = 'city-bank:maj-masquee';

function readStore(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function writeStore(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    // Navigation privée ou stockage refusé : on s'en passe.
  }
}

// Compare deux numéros du type 1.2.3. Positif si « a » est plus récent.
function compareVersions(a, b) {
  const left = String(a).split('.');
  const right = String(b).split('.');
  for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
    const diff = (Number(left[i]) || 0) - (Number(right[i]) || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function showVersion(version) {
  document.querySelectorAll('.js-version').forEach(function (node) {
    node.textContent = 'Version ' + version;
  });
}

// Le bouton mémorise ce que le visiteur emporte : c'est ce qui permet, à sa
// prochaine visite, de savoir qu'une version plus récente est sortie depuis.
function rememberDownloads(version) {
  document.querySelectorAll('.js-apk').forEach(function (link) {
    link.addEventListener('click', function () {
      writeStore(TAKEN_KEY, version);
    });
  });
}

function announceUpdate(latest) {
  const taken = readStore(TAKEN_KEY);
  if (!taken || compareVersions(latest, taken) <= 0) return;
  if (readStore(DISMISSED_KEY) === latest) return;

  const card = document.querySelector('.js-update');
  if (!card) return;

  card.querySelector('.js-update-version').textContent = latest;
  card.querySelector('.js-update-previous').textContent = taken;
  card.hidden = false;

  card.querySelector('.js-update-close').addEventListener('click', function () {
    card.hidden = true;
    writeStore(DISMISSED_KEY, latest);
  });
}

function loadLatestVersion() {
  fetch(LATEST_API, { headers: { Accept: 'application/vnd.github+json' } })
    .then(function (response) {
      return response.ok ? response.json() : Promise.reject(response.status);
    })
    .then(function (release) {
      const latest = String(release.tag_name || '').replace(/^v/, '');
      if (!latest) return;
      showVersion(latest);
      rememberDownloads(latest);
      announceUpdate(latest);
    })
    .catch(function () {
      // GitHub injoignable : la page garde le numéro écrit plus haut.
      rememberDownloads(FALLBACK_VERSION);
    });
}

// Sur ordinateur, un QR code envoie cette page vers le téléphone. Masqué sur
// mobile (rien à scanner) et si la bibliothèque n'a pas pu se charger.
function drawQrCode() {
  const isDesktop = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1021px)').matches;
  const card = document.querySelector('.js-qr-card');
  const target = document.querySelector('.js-qr');
  if (!isDesktop || !card || !target || typeof window.QRCode !== 'function') return;

  try {
    new window.QRCode(target, {
      text: window.location.href.split('#')[0],
      width: 216,
      height: 216,
      colorDark: '#17392C',
      colorLight: '#FFFFFF',
      correctLevel: window.QRCode.CorrectLevel.M,
    });
    card.hidden = false;
  } catch (error) {
    // Pas de QR code vaut mieux qu'un QR code cassé.
  }
}

(function () {
  document.querySelectorAll('.js-apk').forEach(function (link) {
    link.setAttribute('href', APK_URL);
  });
  document.querySelectorAll('.js-year').forEach(function (node) {
    node.textContent = String(new Date().getFullYear());
  });

  showVersion(FALLBACK_VERSION);
  drawQrCode();
  loadLatestVersion();
})();

/* ═══════════════════════════════════════════════════════════
   MINDKING — Application Core v4.0
   State Management · Rendering · Navigation · All Screens
   ═══════════════════════════════════════════════════════════ */

import { supabase } from './supabase.js'
import './style.css';
import logoMindking from './assets/logo_mindking_trp.jpg';
import fondHome from './assets/fond_home.png';
import fondHomeNeutre from './assets/fond mindking neutre.png';
import orbeForge from './assets/orbe-forge1_trp.png';
import fondSouffle from './assets/fond_souffle_alchimique.png';
import orbeSouffle from './assets/orbe_souffle_trp.png';
import breathZenSrc from './assets/breath_zen.mp3';


const TEST_MODE = false; // false en prod
const getDuration = (realSec, testSec) => TEST_MODE ? testSec : realSec;

const TEMP_MAX = { neophyte: 205, disciple: 599, alchimiste: 1499, maitre_ka: 2999, ka_1: 2999, ka_2: 2999, ka_3: 2999 };
const RESERVE_MAX = { neophyte: 200, disciple: 300, alchimiste: 400, maitre_ka: 500, ka_1: 500, ka_2: 500, ka_3: 500 };

const STATE_BY_TEMP = [
    { min: 2999, state: 'ka' },
    { min: 1499, state: 'forge' },
    { min: 599, state: 'incandescent' },
    { min: 199, state: 'awakening' },
    { min: -10, state: 'cold' },
    { min: -Infinity, state: 'frozen' },
];

const MAX_STATE_BY_GRADE = {
    neophyte: 'awakening',
    disciple: 'incandescent',
    alchimiste: 'forge',
    maitre_ka: 'ka', ka_1: 'ka', ka_2: 'ka', ka_3: 'ka',
};

const HEARTS_ORDER = ['frozen', 'cold', 'awakening', 'incandescent', 'forge', 'ka'];

const TEMP_GAINS = {
    focus_15: 30, focus_30: 60, focus_45: 90,
    coherence: 100, vague_zen: 60, stop_panique: 20
};

// ─── Remove white background from logo PNG ───
function removeWhiteBg(img, threshold = 215) {
    if (!img) return;

    const process = () => {
        if (img.dataset.bgRemoved === "true") return;
        try {
            if (!img.naturalWidth) return;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                if (data[i] >= threshold && data[i + 1] >= threshold && data[i + 2] >= threshold) {
                    data[i + 3] = 0;
                }
            }
            ctx.putImageData(imageData, 0, 0);
            img.src = canvas.toDataURL();
            img.dataset.bgRemoved = "true";
        } catch (e) {
            console.error("White BG removal error:", e);
        }
    };

    if (img.complete) {
        process();
    } else {
        img.onload = process;
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function showToast(message, type = 'error') {
    const toast = document.createElement('div');
    toast.className = `mk-toast mk-toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ═══════ APPLICATION STATE ═══════
const state = {
    user: null,
    children: null, 
    selectedChild: null,
    authLoading: false,
    authError: null,
    plan: 'free',
    selectedBackground: 'default', // 'default' ou 'neutre'

    name: 'Jeune Alchimiste',
    xp: 3001,
    dailyXp: 120,
    xpCap: 300,
    childName: "Guillaume",
    grade: 2,
    heartState: 'frozen', // frozen, cold, awakening, incandescent, forge, ka
    temperature: 0,
    temperature_reserve: 0,
    mercuryQty: 3,  // Perles (illimité)
    sulfurQty: 3,   // Braises (illimité)
    saltQty: 5,     // Sel (0-7)
    kaActivationsToday: 0,
    kaActive: false,
    kaSessionType: null,
    activeTab: 'home',
    lastActiveDay: null,

    // Forge timer
    forgeDuration: null, // null = écran sélection, 15/30/45 = timer actif
    sulfurHalf: 0,
    mercuryHalf: 0,
    forgeActive: false,
    forgePaused: false,
    forgeSeconds: 0, // Elapsed seconds
    forgeInterval: null,
    forgeCooldown: false,
    forgeCooldownSeconds: 0,
    forgeCooldownInterval: null,
    forgeCompleted: false,
    forgeCompletedGains: null,

    // Souffle
    souffleCompleted: false,
    souffleCompletedGains: null,
    souffleVagueCount: 0,
    saltToday: false,
    souffleCoherenceLastTime: null,
    souffleActive: false,
    souffleType: null, // 'stop_panique', 'vague_zen', 'coherence'
    souffleSeconds: 0,
    souffleInterval: null,
    soufflePhase: 'inhale', // inhale, hold, exhale
    soufflePhaseSeconds: 0,

    gradeThresholds: [
        { min: 0,     max: 600,   display: 600   }, // 0: Néophyte
        { min: 600,   max: 3000,  display: 2400  }, // 1: Disciple
        { min: 3000,  max: 12000, display: 9000  }, // 2: Alchimiste
        { min: 12000, max: 22000, display: 10000 }, // 3: Maître KA
        { min: 22000, max: 32000, display: 10000 }, // 4: KA I
        { min: 32000, max: 42000, display: 10000 }, // 5: KA II
        { min: 42000, max: 52000, display: 10000 }, // 6: KA III
    ]
};

// ─── Constants ───
const KA_MODE_COST = { perles: 1, braises: 1 };
const KA_ACTIVATIONS_MAX = 3;
const KA_XP_BONUS = 0.2; // +20%

const FORGE_DURATIONS = {
    15: { seconds: getDuration(15 * 60, 15), label: '15 min', xp: '+15 XP', xpValue: 15, braises: '½ Braise', perles: '—', temp: '+30°C' },
    30: { seconds: getDuration(30 * 60, 30), label: '30 min', xp: '+30 XP', xpValue: 30, braises: '1 Braise', perles: '—', temp: '+60°C' },
    45: { seconds: getDuration(45 * 60, 45), label: '45 min', xp: '+45 XP', xpValue: 45, braises: '1 Braise', perles: '+½ Perle', temp: '+90°C' },
};
const FORGE_COOLDOWN = 5 * 60;  // 5min cooldown

const heartMessages = {
    frozen: { icon: '(•)', text: 'Respirer pour dégeler — Perle requise' },
    cold: { icon: '◇', text: 'Démarrer la Culture (+1 XP/min)' },
    awakening: { icon: '🔥', text: 'Braise en formation... continuez !' },
    incandescent: { icon: '💥', text: 'Braise en formation... continuez !' },
    forge: { icon: '☀️', text: 'Forge accomplie — Braise générée !' },
    ka: { icon: '🌌', text: 'Mode KA actif — +20% XP 🔥' },
};

const souffleExercises = {
    stop_panique: { name: 'Stop Panique', rythm: '4s / 2s / 6s', duration: getDuration(60, 10), xp: 10, inhale: 4, hold: 2, exhale: 6, color: 'var(--color-stop-panique)', perles: 0.5, cooldown: 0, maxPerDay: Infinity, desc: 'Ancrez-vous dans le calme' },
    vague_zen: { name: 'Vague Zen', rythm: '4s / 7s', duration: getDuration(180, 30), xp: 30, inhale: 4, hold: 0, exhale: 7, color: 'var(--color-vague-zen)', perles: 0.5, cooldown: 0, maxPerDay: 2, desc: 'Surfez la vague de sérénité' },
    coherence: { name: 'Cohérence Cardiaque', rythm: '5s / 5s', duration: getDuration(300, 50), xp: 50, inhale: 5, hold: 0, exhale: 5, color: 'var(--color-coherence)', perles: 1, cooldown: 3.5 * 60 * 60 * 1000, maxPerDay: Infinity, desc: 'Inspirez… Expirez… en harmonie' },
};

function toggleBackground() {
    state.selectedBackground = state.selectedBackground === 'default' ? 'neutre' : 'default';
    render();
    syncChildData();
}

// ═══════ HELPERS ═══════
function updateGrade() {
    const thresholds = [0, 600, 3000, 12000, 22000, 32000, 42000];
    let newGrade = 0;
    for (let i = 0; i < thresholds.length; i++) {
        if (state.xp >= thresholds[i]) newGrade = i;
    }
    if (newGrade !== state.grade) {
        state.grade = newGrade;
    }
}

function getGradeName(grade) {
    let g = grade;
    if (typeof grade === 'string') {
        const lower = grade.toLowerCase();
        if (lower.includes('ka_3') || lower === 'ka iii') g = 42000;
        else if (lower.includes('ka_2') || lower === 'ka ii') g = 32000;
        else if (lower.includes('ka_1') || lower === 'ka i') g = 22000;
        else if (lower.includes('maitre') || lower.includes('ka')) g = 12000;
        else if (lower.includes('alchimiste')) g = 3000;
        else if (lower.includes('disciple')) g = 600;
        else g = 0;
    }

    if (g >= 42000) return 'KA III';
    if (g >= 32000) return 'KA II';
    if (g >= 22000) return 'KA I';
    if (g >= 12000) return 'Maître KA';
    if (g >= 3000) return 'Alchimiste';
    if (g >= 600) return 'Disciple';
    return 'Néophyte';
}

function getNextGradeDisplay() {
    if (state.xp >= 42000) return 'CONSCIENCE ABSOLUE';
    if (state.xp >= 32000) return 'KA III (42 000 XP)';
    if (state.xp >= 22000) return 'KA II (32 000 XP)';
    if (state.xp >= 12000) return 'KA I (22 000 XP)';
    if (state.xp >= 3000) return 'Maître KA (12 000 XP)';
    if (state.xp >= 600) return 'Alchimiste (3 000 XP)';
    return 'Disciple (600 XP)';
}


function getXpDisplay() {
    const currentTotal = state.xp;
    const dailyProg = state.dailyXp;
    const dailyCap = state.xpCap;
    const t = state.gradeThresholds[state.grade];

    // Si pas de seuil trouvé, on renvoie une structure par défaut propre
    if (!t) {
        return {
            daily: dailyProg,
            dailyCap: dailyCap,
            total: currentTotal,
            target: 600,
            percent: 5,
            dailyPercent: Math.max(5, (dailyProg / dailyCap) * 100)
        };
    }

    const targetTotal = t.max || 600;
    const percent = Math.max(5, Math.min(100, ((currentTotal - t.min) / (targetTotal - t.min)) * 100));
    const dailyPercent = Math.max(5, Math.min(100, (dailyProg / dailyCap) * 100));

    return {
        daily: dailyProg,
        dailyCap: dailyCap,
        total: currentTotal,
        target: targetTotal,
        percent: percent,
        dailyPercent: dailyPercent
    };
}

function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}


function addXp(amount) {
    if (state.heartState === 'frozen') return 0;
    if (state.dailyXp >= state.xpCap) return 0;

    // Correction : Utilisation du slug de grade pour le multiplicateur
    const gradeSlug = getGradeString();
    const isKaGrade = ['maitre_ka', 'ka_1', 'ka_2', 'ka_3'].includes(gradeSlug);
    const multiplier = isKaGrade ? 1.2 : (gradeSlug === 'alchimiste' ? 1.1 : 1.0);

    const effective = Math.round(amount * multiplier);
    const remaining = state.xpCap - state.dailyXp;
    const gained = Math.min(effective, remaining);

    state.dailyXp += gained;
    state.xp += gained;

    updateGrade(); // Mise à jour du grade numérique pour l'UI
    syncChildData(); // Envoi du nouveau grade (via getGradeString) à Supabase
    return gained;
}

function giveDailySalt() {
    if (!state.saltToday) {
        if (state.saltQty < 7) {
            state.saltQty++;
        }
        state.saltToday = true;
    }
}

function addTemperature(gain) {
    const gradeStr = getGradeString();
    const maxTemp = TEMP_MAX[gradeStr] || TEMP_MAX.neophyte;
    const maxRes = RESERVE_MAX[gradeStr] || RESERVE_MAX.neophyte;

    let remainingGain = gain;

    if (state.temperature < maxTemp) {
        const space = maxTemp - state.temperature;
        if (remainingGain <= space) {
            state.temperature += remainingGain;
            remainingGain = 0;
        } else {
            state.temperature = maxTemp;
            remainingGain -= space;
        }
    }

    if (remainingGain > 0 && state.temperature_reserve < maxRes) {
        const spaceRes = maxRes - state.temperature_reserve;
        if (remainingGain <= spaceRes) {
            state.temperature_reserve += remainingGain;
            remainingGain = 0;
        } else {
            state.temperature_reserve = maxRes;
            remainingGain -= spaceRes;
        }
    }

    // Stocker l'arrondi directement dans l'état local
    state.temperature = Math.round(state.temperature);
    state.temperature_reserve = Math.round(state.temperature_reserve);

    updateHeartState();
}

function updateHeartState() {
    if (state.heartState === 'frozen') {
        // Le coeur est gelé, la température n'a plus d'effet tant qu'il n'est pas dégelé
        syncChildData();
        render();
        return;
    }

    const gradeStr = getGradeString();
    const temp = state.temperature;
    const maxTemp = TEMP_MAX[gradeStr] || TEMP_MAX.neophyte;

    // Transvaser la réserve vers la température principale si de l'espace est disponible (ex: nouveau plafond)
    if (state.temperature < maxTemp && state.temperature_reserve > 0) {
        const space = maxTemp - state.temperature;
        const transfer = Math.min(space, state.temperature_reserve);
        state.temperature += transfer;
        state.temperature_reserve -= transfer;
    }

    let calculatedState = 'frozen';
    const roundedTemp = Math.round(temp);
    for (const entry of STATE_BY_TEMP) {
        if (roundedTemp >= entry.min) {
            calculatedState = entry.state;
            break;
        }
    }

    const maxAllowed = MAX_STATE_BY_GRADE[gradeStr] || 'awakening';

    const calcIdx = HEARTS_ORDER.indexOf(calculatedState);
    const maxIdx = HEARTS_ORDER.indexOf(maxAllowed);

    state.heartState = HEARTS_ORDER[Math.min(calcIdx, maxIdx)];

    syncChildData();
    render();
}

function startCoolingLoop() {
    setInterval(() => {
        if (!state.selectedChild || state.forgeActive || state.souffleActive) return;

        const now = new Date();
        const hour = now.getHours();
        const isNight = hour >= 22 || hour < 7;
        const isPlanFamily = state.plan === 'family';

        let coolPerMin = 0;
        if (isPlanFamily) {
            coolPerMin = isNight ? 0 : 10 / 60;
        } else {
            coolPerMin = 15 / 60;
        }

        // Consommer réserve d'abord
        if (state.temperature_reserve > 0) {
            if (state.temperature_reserve >= coolPerMin) {
                state.temperature_reserve -= coolPerMin;
            } else {
                const perteRestante = coolPerMin - state.temperature_reserve;
                state.temperature_reserve = 0;
                state.temperature = Math.max(-10, state.temperature - perteRestante);
            }
        } else {
            state.temperature = Math.max(-10, state.temperature - coolPerMin);
        }

        // Calcul inline du heartState sans render()
        if (state.heartState !== 'frozen') {
            const gradeStr = getGradeString();

            let calculatedState = 'frozen';
            const roundedTemp = Math.round(state.temperature);
            for (const entry of STATE_BY_TEMP) {
                if (roundedTemp >= entry.min) {
                    calculatedState = entry.state;
                    break;
                }
            }

            const maxAllowed = MAX_STATE_BY_GRADE[gradeStr] || 'awakening';

            const calcIdx = HEARTS_ORDER.indexOf(calculatedState);
            const maxIdx = HEARTS_ORDER.indexOf(maxAllowed);

            state.heartState = HEARTS_ORDER[Math.min(calcIdx, maxIdx)];
        }

        syncChildData().catch(e => console.error('[COOLING SYNC ERROR]', e));
    }, 60000); // toutes les minutes
}

function createSparkles() {
    const c = document.createElement('div');
    c.className = 'sparkles-container gold-paillettes'; c.id = 'sparkles';
    for (let i = 0; i < 20; i++) {
        const s = document.createElement('div');
        s.className = 'floating-sparkle gold';
        s.style.left = `${Math.random() * 100}%`;
        s.style.top = `${Math.random() * 100}%`;
        s.style.animationDelay = `${Math.random() * 8}s`;
        s.style.animationDuration = `${5 + Math.random() * 7}s`;
        const sz = 2 + Math.random() * 4;
        s.style.width = `${sz}px`; s.style.height = `${sz}px`;
        c.appendChild(s);
    }
    return c;
}

// ═══════ RENDER: AUTH ═══════
function renderAuth() {
    return `
    <div class="auth-screen">
      <div class="auth-card">
        <div class="auth-logo-wrap">
          <img src="${logoMindking}" class="auth-logo" alt="Logo MindKing" />
        </div>
        <h2 class="auth-title">Espace Parent</h2>
        <p class="auth-subtitle">Connectez-vous pour accéder aux profils</p>

        <div class="auth-form">
          <label for="auth-email" class="sr-only">Email</label>
          <input type="email" id="auth-email" placeholder="Email" class="auth-input" />
          <label for="auth-password" class="sr-only">Mot de passe</label>
          <input type="password" id="auth-password" placeholder="Mot de passe" class="auth-input" />
        </div>

        ${state.authError ? `<div class="auth-error">${escapeHtml(state.authError)}</div>` : ''}

        <div class="auth-actions">
          <button class="btn-pill" onclick="handleLogin()" ${state.authLoading ? 'disabled' : ''}>
            ${state.authLoading ? 'Connexion...' : 'Se connecter'}
          </button>

          <div style="text-align:center; margin:1rem 0; color:#0F172A80; font-size:0.85rem">
            — ou —
          </div>

          <button class="btn-pill google-btn" onclick="loginWithGoogle()">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              width="20" height="20" style="margin-right:8px; vertical-align:middle">
            Continuer avec Google
          </button>
          
          <button class="btn-pill btn-outline" onclick="handleSignup()" ${state.authLoading ? 'disabled' : ''}>
            Créer un compte
          </button>
        </div>
      </div>
    </div>
  `;
}

// ═══════ RENDER: SELECTION ═══════
function renderSelection() {
    if (!state.children) {
        return `<div class="loading-screen"><div class="alch-loader"></div><p>Récupération de la lignée...</p></div>`;
    }

    return `
    <div class="selection-screen">
      <div class="selection-header">
        <h1 class="selection-title">Qui va pratiquer ?</h1>
        <p class="selection-subtitle">Choisissez un profil pour commencer</p>
      </div>

      <div class="children-grid">
        ${state.children.map(c => `
          <button class="child-card" onclick="selectChild('${c.id}')" aria-label="Sélectionner ${escapeHtml(c.name)}">
            <div class="child-avatar">${c.gender === 'boy' ? '🤴' : '👸'}</div>
            <div class="child-meta">
              <span class="child-name">${escapeHtml(c.name)}</span>
              <span class="child-grade">${getGradeName(c.grade)} · ${c.xp} XP</span>
            </div>
          </button>
        `).join('')}
      </div>

      <button class="btn-logout-minimal" onclick="logout()">Déconnexion</button>
    </div>
  `;
}

// ═══════ RENDER: HOME ═══════
function renderHome() {
    const cls = `state-${state.heartState}`;
    const msg = heartMessages[state.heartState] || heartMessages.cold;
    const xpD = getXpDisplay();
    
    // Sécurité sur l'image de fond
    const bgUrl = state.selectedBackground === 'neutre' ? fondHomeNeutre : fondHome;
    const bgStyle = bgUrl ? `background-image: url('${bgUrl}');` : '';

    return `
    <div class="page-content home-page" style="${bgStyle} background-size: cover; background-position: center; background-repeat: no-repeat;">
      <div class="gold-shimmer-bg"></div>
      
      <div class="top-bar glass-profile-card">
        <div class="home-header">
          <div class="profile-info">
            <div class="avatar-wrap" style="width: 40px; height: 40px; margin-bottom: 0;">
              <img src="/avatar.png" alt="Avatar" style="width: 100%; height: 100%;" />
            </div>
            <div class="name-grade" style="font-weight: 800; font-size: 14px; color: var(--anchor); text-transform: uppercase; letter-spacing: 0.5px;">
              ${state.selectedChild ? state.selectedChild.name : 'MINDKING'} | <span style="color: var(--royal-gold);">${getGradeName(getGradeString())}</span>
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button id="toggle-bg" class="btn-toggle-bg" title="Changer de fond">🎨</button>
          </div>
        </div>
        
        <div class="xp-bar-container" style="padding: 0; margin-top: 10px;">
          <div class="xp-bar-track custom-jauge-xp" style="margin: 5px auto !important; width: 100% !important; --xp-percent: ${xpD.percent}">
            <div class="alch-jauge-tube" style="height: 14px;">
              <div class="alch-jauge-liquid"></div>
              <div class="alch-jauge-glass-glare" style="height: 3px;"></div>
            </div>
          </div>
          <div class="xp-stats-bottom" style="margin-top: 12px;">
            <span class="xp-next-level" style="color: var(--anchor); font-weight: 800; font-size: 11px;">PROCHAIN GRADE : <b style="color: var(--anchor);">${getNextGradeDisplay()}</b> (${xpD.total} XP)</span>
          </div>

          <div class="xp-stats">
            <div class="xp-jour">
              <span class="xp-label">Aujourd'hui</span>
              <span class="xp-value">${state.dailyXp} / ${state.xpCap}</span>
            </div>
            <div class="xp-total">
              <span class="xp-label">Total</span>
              <span class="xp-value">${state.xp} XP</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="center-zone home-hero" style="margin-top: 10px;">
        <div class="heart-stage-row floating">
          <div class="heart-stage ${cls}"><img src="${logoMindking}" alt="MindKing" class="logo-crown" style="width: 320px; height: auto; animation: crownFloat 6s ease-in-out infinite;" /></div>
        </div>
        
        <div class="home-actions-pill">
          <button class="home-btn-half btn-souffle" id="orb-breathe" title="Respirer">
            <img src="${orbeSouffle}" class="home-btn-icon-img" alt="Souffle" /> SOUFFLE
          </button>
          <div class="home-btn-divider"></div>
          <button class="home-btn-half btn-forge" id="orb-forge" title="Forger">
            FORGE <img src="${orbeForge}" class="home-btn-icon-img" alt="Forge" />
          </button>
        </div>

        <div class="context-message" style="background: rgba(255,255,255,0.85); border: 1px solid rgba(255,255,255,0.6); margin-top: 20px; margin-bottom: 90px; width: 90%; max-width: 350px;">
          <span class="ctx-icon">${msg.icon}</span>${msg.text}
        </div>
      </div>
    </div>`;
}

// ═══════ WEB AUDIO API ═══════
let audioCtx = null;
let breathAudio = null;
let wakeLock = null;

function getAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
}

// Gong cristallin — fin de Focus (528 Hz)
function playFocusComplete() {
    try {
        const ctx = getAudioCtx();
        ctx.resume().then(() => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(528, ctx.currentTime);
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.01);
            gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.31);
            gain.gain.setValueAtTime(0.4, ctx.currentTime + 1.0);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 3.0);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 3.0);
        });
    } catch (e) {
        console.warn('Audio non disponible :', e);
    }
}

// Musique ambiante respiration — breath_zen.mp3
function startBreathMusic() {
    try {
        if (!breathAudio) {
            breathAudio = new Audio(breathZenSrc);
            breathAudio.loop = true;
        }
        breathAudio.currentTime = 0;
        breathAudio.volume = 0;
        breathAudio.play().catch(e => console.warn('Audio breath non disponible :', e));
        let vol = 0;
        const fadeIn = setInterval(() => {
            vol = Math.min(vol + 0.05, 0.3);
            breathAudio.volume = vol;
            if (vol >= 0.3) clearInterval(fadeIn);
        }, 150);
    } catch(e) {
        console.warn('startBreathMusic error :', e);
    }
}

function stopBreathMusic() {
    try {
        if (breathAudio) {
            breathAudio.pause();
            breathAudio.currentTime = 0;
        }
    } catch(e) {
        console.warn('stopBreathMusic error :', e);
    }
}

// ─── Wake Lock API ───
async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
    }
  } catch(e) {
    console.warn('Wake Lock non disponible :', e);
  }
}

function releaseWakeLock() {
  if (wakeLock) {
    wakeLock.release();
    wakeLock = null;
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && state.forgeActive) {
    requestWakeLock();
  }
});

// ═══════ RENDER: FORGE ═══════
function renderForge() {
    const active = state.forgeActive;
    const durConfig = state.forgeDuration ? FORGE_DURATIONS[state.forgeDuration] : null;

    // 1. PHASE: SÉLECTION (Si aucune durée choisie)
    if (!active && state.forgeDuration === null) {
        if (state.forgeCooldown) {
            const remainMin = Math.ceil(state.forgeCooldownSeconds / 60);
            return `
        <div class="page-content forge-container">
          <img src="${logoMindking}" class="main-logo" alt="Logo MindKing" />
          <div class="forge-title-section">
            <h1 class="alchemic-title">LA FORGE</h1>
            <p class="alchemic-subtitle">L'Athanor refroidit...</p>
          </div>
          <div style="text-align:center; margin: 40px 0; font-family:'Nunito',sans-serif;">
            <div style="font-size:48px; font-weight:900; color: var(--color-gel, #FF6B35);">${remainMin} min</div>
            <div style="font-size:14px; color: var(--color-cool-text); margin-top:8px;">Reposez votre esprit</div>
          </div>
          <div style="text-align:center; margin-top:16px;">
            <button class="btn-pill btn-outline" id="forge-back-home">Retour</button>
          </div>
        </div>`;
        }
        return `
      <div class="page-content forge-container" style="background-image: url('${fondHome}'); background-size: cover; background-position: center;">
        <img src="${logoMindking}" class="main-logo" alt="Logo MindKing" />

        <div class="forge-title-section">
          <h1 class="alchemic-title">LA FORGE</h1>
          <p class="alchemic-subtitle">Alchimie du Focus</p>
          ${state.kaActive ? '<div style="background:var(--color-or); color:white; padding:4px 12px; border-radius:12px; font-weight:bold; font-size:12px; display:inline-block; margin-top:10px;">🌟 MODE KA ACTIF (+20% XP)</div>' : ''}
        </div>

        <div class="braise-status-label" style="text-align: center; margin-top: 20px;">CHOISISSEZ VOTRE DURÉE</div>
        
        <div class="forge-choices">
          <div class="forge-choice-card" id="forge-choice-15">
            <div class="forge-choice-left">
              <span class="forge-choice-title">Focus 15 min</span>
              <span class="forge-choice-desc">Session rapide</span>
            </div>
            <div class="forge-choice-right">
              <span class="forge-choice-gains">+15 XP • ½ Braise</span>
              <span class="forge-choice-temp">+30°C</span>
            </div>
          </div>
          
          <div class="forge-choice-card" id="forge-choice-30">
            <div class="forge-choice-left">
              <span class="forge-choice-title">Focus 30 min</span>
              <span class="forge-choice-desc">Session équilibrée</span>
            </div>
            <div class="forge-choice-right">
              <span class="forge-choice-gains">+30 XP • 1 Braise</span>
              <span class="forge-choice-temp">+60°C</span>
            </div>
          </div>
          
          <div class="forge-choice-card" id="forge-choice-45">
            <div class="forge-choice-left">
              <span class="forge-choice-title">Focus 45 min</span>
              <span class="forge-choice-desc">Session profonde</span>
            </div>
            <div class="forge-choice-right">
              <span class="forge-choice-gains">+45 XP • 1 Braise • ½ Perle</span>
              <span class="forge-choice-temp">+90°C</span>
            </div>
          </div>
        </div>
        <div style="text-align:center; margin-top:16px;">
          <button class="btn-pill btn-outline" id="forge-back-home">Retour</button>
        </div>
      </div>
    `;
    }

    // 2. PHASE: FÉLICITATIONS
    if (state.forgeCompleted && state.forgeCompletedGains) {
        const g = state.forgeCompletedGains;
        const rankNames = { neophyte: 'Néophyte', disciple: 'Disciple', alchimiste: 'Alchimiste', maitre_ka: 'Maître KA', ka_1: 'KA I', ka_2: 'KA II', ka_3: 'KA III' };
        const rank = rankNames[getGradeString()] || 'Alchimiste';
        return `
      <div class="page-content forge-container" style="background-image: url('${fondHome}'); background-size: cover; background-position: center;">
        <img src="${logoMindking}" class="main-logo" alt="Logo MindKing" />
        <div class="forge-title-section">
          <h1 class="alchemic-title" style="font-size: 24px;">FORGE ACCOMPLIE</h1>
          <p class="alchemic-subtitle">Félicitations, ${rank} !</p>
        </div>
        <div class="forge-rewards">
          <div class="reward-item"><span class="reward-icon">⚡</span><span class="reward-text">+${g.xp} XP</span></div>
          <div class="reward-item"><span class="reward-icon">🔥</span><span class="reward-text">${g.braises}</span></div>
          ${g.perles ? `<div class="reward-item"><span class="reward-icon">🔵</span><span class="reward-text">${g.perles}</span></div>` : ''}
          ${g.temp ? `<div class="reward-item"><span class="reward-icon">🌡️</span><span class="reward-text">${g.temp}</span></div>` : ''}
          <div class="reward-item"><span class="reward-icon">⏱️</span><span class="reward-text">${g.duration} de Focus</span></div>
        </div>
        <div style="text-align:center; margin-top:24px;">
          <button class="btn-pill btn-start" id="forge-complete-ok">Retour</button>
        </div>
      </div>`;
    }

    // 3. PHASE: TIMER ACTIF OU PAUSE
    if (!durConfig) return '';

    const paused = state.forgePaused;
    const elapsed = state.forgeSeconds;
    const totalSeconds = durConfig.seconds;
    const remaining = Math.max(0, totalSeconds - elapsed);
    const progress = (remaining / totalSeconds) * 100;

    // Braise labels
    const braiseLabels = ['ÉTINCELLES FROIDES', 'ROUGEOIE', 'OR PUR'];
    const labelIdx = Math.min(2, Math.floor(elapsed / (10 * 60)));
    const currentLabel = active ? braiseLabels[labelIdx] : 'PRÊT À FORGER';

    // Ring offset for the countdown animation
    const radius = 95;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return `
    <div class="page-content forge-container">
      <img src="${logoMindking}" class="main-logo" alt="Logo MindKing" />

      <div class="forge-title-section">
        <h1 class="alchemic-title">LA FORGE</h1>
        <p class="alchemic-subtitle">Alchimie du Focus</p>
      </div>

      <div class="timer-area">
        <div class="braise-status-label">${currentLabel}</div>
        
        <div class="central-orb-wrap pulsating-container">
          <div class="fire-particles" id="forge-fire-particles"></div>
          <svg class="ring-svg" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="95" fill="none" stroke="url(#forge-gradient-blue)" stroke-width="6"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="${offset}"
              stroke-linecap="round"
              transform="rotate(-90 100 100)"
              class="timer-progress-ring"
            />
            <defs>
              <linearGradient id="forge-gradient-blue" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#3B82F6" />
                <stop offset="100%" stop-color="#2563EB" />
              </linearGradient>
            </defs>
          </svg>
          
          <div class="blue-orb">
            <img src="${orbeForge}" alt="Orb" class="orb-img-base" id="forge-orb-img" />
          </div>
        </div>
        
        <div class="external-total-timer" aria-live="polite" aria-atomic="true">${formatTime(remaining)}</div>
      </div>

      <div class="forge-controls">
        ${!active ?
            `<div class="controls-row"><button class="btn-pill btn-start" id="forge-start">Démarrer</button></div>` :
            `<div class="controls-row">
            <button class="btn-pill btn-outline" id="${paused ? 'forge-resume' : 'forge-pause'}">${paused ? 'Reprendre' : 'Pause'}</button>
            <button class="btn-pill btn-danger" id="forge-abandon">Abandonner</button>
          </div>`
        }
        ${active ? `<div class="forge-warning-text">VOTRE BRAISE SERA PERDUE <br/> SI VOUS ABANDONNEZ</div>` : ''}
      </div>
    </div>`;
}

// ═══════ RENDER: SOUFFLE ═══════
function renderSouffle() {
    const active = state.souffleActive;
    const type = state.souffleType; // can be null

    if (state.souffleCompleted && state.souffleCompletedGains) {
        const g = state.souffleCompletedGains;
        return `
  <div class="page-content forge-container" style="background-image: url('${fondSouffle}') !important; text-align: center;">
    <div class="gold-shimmer-bg" style="opacity: 0.4;"></div>
    
    <div class="success-header" style="position: relative; z-index: 10; margin-bottom: 30px; display: flex; flex-direction: column; align-items: center; animation: crownFloat 4s ease-in-out infinite;">
      <img src="${logoMindking}" class="logo-crown" style="width: 120px; height: auto; margin-bottom: 10px; position: static; transform: none;" />
      <h1 class="souffle-alchemic-title" style="font-size: 26px; margin: 0; text-align: center; width: 100%;">SOUFFLE ACCOMPLI</h1>
      <p class="souffle-alchemic-subtitle" style="margin-top: 5px; opacity: 0.8; text-align: center;">Félicitations, Alchimiste !</p>
    </div>

    <div class="rewards-stack" style="display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 300px; position: relative; z-index: 10;">
      <div class="reward-item" style="border: 1px solid ${g.color}33; background: rgba(255,255,255,0.92);">
        <img src="${orbeSouffle}" style="width: 32px; height: 32px; filter: drop-shadow(0 0 5px ${g.color}66);" />
        <span class="reward-text" style="font-size: 16px;">${g.name}</span>
      </div>
      
      <div class="reward-item" style="background: rgba(255,255,255,0.92);">
        <span class="reward-icon" style="font-size: 24px;">⚡</span>
        <span class="reward-text" style="font-size: 16px;">+${g.xp} XP Alchimique</span>
      </div>

      ${g.perlesText ? `
      <div class="reward-item" style="background: rgba(255,255,255,0.92);">
        <img src="/pearl.png" style="width: 28px; height: 28px;" />
        <span class="reward-text" style="font-size: 16px;">${g.perlesText}</span>
      </div>` : ''}
      
      ${g.temp ? `
      <div class="reward-item" style="background: rgba(255,255,255,0.92);">
        <span class="reward-icon" style="font-size: 24px;">🌡️</span>
        <span class="reward-text" style="font-size: 16px;">${g.temp}</span>
      </div>` : ''}

      <div class="reward-item" style="background: rgba(255,255,255,0.92);">
        <span class="reward-icon" style="font-size: 24px;">⏱️</span>
        <span class="reward-text" style="font-size: 16px;">${g.duration} de Concentration</span>
      </div>
    </div>

    <button class="btn-pill btn-start-souffle" id="souffle-complete-ok" style="margin-top: 40px; width: 200px; box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);">
      RETOUR
    </button>
  </div>`;
    }

    // 1. PHASE: SÉLECTION (Si aucun exercice choisi)
    if (!type) {
        return `
      <div class="page-content souffle-container-immersive" style="background-image: url('${fondHome}'); background-size: cover; background-position: center;">
        <img src="${logoMindking}" class="main-logo" alt="Logo MindKing" style="pointer-events: none;" />
        <div class="souffle-title-section" style="pointer-events: none; position: relative; z-index: 1;">
          <h1 class="souffle-alchemic-title">LE SOUFFLE</h1>
          <p class="souffle-alchemic-subtitle">Culture de l'Éther</p>
          ${state.kaActive ? '<div style="background:var(--color-or); color:white; padding:4px 12px; border-radius:12px; font-weight:bold; font-size:12px; display:inline-block; margin-top:10px;">🌟 MODE KA ACTIF (+20% XP)</div>' : ''}
        </div>
        <div class="souffle-selection-phase">
          <div class="souffle-status-label">CHOISISSEZ VOTRE RYTHME</div>
          <div class="souffle-exercises-grid">
            ${Object.entries(souffleExercises).map(([key, ex]) => {
            let gainsText = `+${ex.xp} XP`;
            if (key === 'coherence') gainsText += ' • 1 Perle';
            else if (key === 'vague_zen') gainsText += ' • ½ Perle';
            else if (key === 'stop_panique') gainsText += ' • ½ Perle';

            let statusText = '';
            let isLocked = false;
            if (key === 'coherence' && state.souffleCoherenceLastTime) {
                const elapsed = Date.now() - state.souffleCoherenceLastTime;
                if (elapsed < souffleExercises.coherence.cooldown) {
                    const remainMin = Math.ceil((souffleExercises.coherence.cooldown - elapsed) / 60000);
                    statusText = `<span class="souffle-card-cooldown">Disponible dans ${remainMin} min</span>`;
                    isLocked = true;
                }
            }
            if (key === 'vague_zen' && state.souffleVagueCount >= 2) {
                statusText = '<span class="souffle-card-cooldown">Pratique libre</span>';
            }

            return `
                <div class="souffle-card ${isLocked ? 'cooldown-locked' : ''}" id="souffle-card-${key}" data-type="${key}" style="${isLocked ? 'opacity:0.5;pointer-events:none;filter:grayscale(0.7)' : ''}">
                  <div class="souffle-card-info" style="pointer-events: none;">
                    <span class="souffle-card-name">${ex.name}</span>
                    <span class="souffle-card-desc">${ex.desc}</span>
                    ${statusText}
                  </div>
                  <div class="souffle-card-right" style="pointer-events: none;">
                    <span class="souffle-card-gains">${gainsText}</span>
                    <span class="souffle-card-meta">${ex.rythm}</span>
                  </div>
                </div>`;
        }).join('')}
          </div>
        </div>
      </div>`;
    }

    // 2. PHASE: PRÉVISUALISATION OU SESSION ACTIVE
    const exercise = souffleExercises[type];
    const elapsed = state.souffleSeconds;
    const remaining = Math.max(0, exercise.duration - elapsed);
    const progress = (remaining / exercise.duration) * 100;

    const radius = 95;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    let orbScale = 1;
    let transitionStyle = 'transform 1s ease-out';

    // Par défaut (non actif), on affiche juste le temps total d'exercice au centre.
    let orbTextHtml = `
      <div class="orb-timer-content">
        <span class="orb-timer-text">${formatTime(exercise.duration)}</span>
      </div>
    `;

    if (active) {
        const label = state.soufflePhase === 'inhale' ? 'INSPIRER' : (state.soufflePhase === 'hold' ? 'BLOQUER' : 'EXPIRER');

        const phaseDur = state.soufflePhase === 'inhale' ? exercise.inhale : (state.soufflePhase === 'hold' ? exercise.hold : exercise.exhale);
        const phaseRemaining = Math.max(0, phaseDur - state.soufflePhaseSeconds);

        orbTextHtml = `
        <div class="orb-timer-content">
          <span class="orb-timer-text action-text">${label}</span>
          <span class="orb-timer-text chrono-text">${phaseRemaining}</span>
      `;

        // ─── ⚖️ MASTER SYNC CALCULATION ───
        if (state.soufflePhase === 'inhale') {
            if (state.souffleSeconds === 0 && state.soufflePhaseSeconds === 0) {
                orbScale = 1.0;
            } else {
                orbScale = 1.12;
            }
            transitionStyle = `transform ${exercise.inhale}s ease-in-out`;
        } else if (state.soufflePhase === 'hold') {
            orbScale = 1.12;
            transitionStyle = `transform 0.5s ease`;
        } else {
            orbScale = 1.0;
            transitionStyle = `transform ${exercise.exhale}s ease-in-out`;
        }
    }

    return `
    <div class="page-content souffle-container-immersive" style="background-image: url('${fondHome}'); background-size: cover; background-position: center;">
      <img src="${logoMindking}" class="main-logo" alt="Logo MindKing" style="pointer-events: none;" />

      <div class="souffle-title-section" style="pointer-events: none; position: relative; z-index: 1;">
        <h1 class="souffle-alchemic-title">${exercise ? exercise.name.toUpperCase() : 'LE SOUFFLE'}</h1>
        <p class="souffle-alchemic-subtitle">Culture de l'Éther</p>
      </div>

      <div class="souffle-main-zone">
        <div class="central-orb-wrap" style="transform: scale(${orbScale}); transition: ${transitionStyle};">
          <svg class="ring-svg souffle-ring" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="95" fill="none" stroke="url(#souffle-gradient-${type})" stroke-width="3"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="${offset}"
              stroke-linecap="round"
              transform="rotate(-90 100 100)"
              class="timer-progress-ring"
            />
            <defs>
              <linearGradient id="souffle-gradient-${type}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="${exercise.color}88" />
                <stop offset="100%" stop-color="${exercise.color}" />
              </linearGradient>
            </defs>
          </svg>
          
          <div class="blue-orb" style="background: radial-gradient(circle, ${exercise.color}33 0%, transparent 75%)">
            <img src="${orbeSouffle}" alt="Orb" class="orb-img-base" />
            ${orbTextHtml}
          </div>
        </div>
        ${!active ? `<div class="souffle-status-label">${exercise.desc}</div>` : ''}
      </div>

      <div class="souffle-controls" style="margin-top: 45px;">
        ${active ? `<div class="external-total-timer" aria-live="polite" aria-atomic="true" style="text-align:center; font-size:32px; font-weight:950; color: #000000 !important; margin-bottom: 20px; letter-spacing: 2px; position: relative; z-index: 100; font-family: 'Nunito', sans-serif;">${formatTime(remaining)}</div>` : ''}
        ${!active ?
            `<div class="controls-row">
            <button class="btn-pill btn-outline" id="souffle-change">Changer</button>
            <button class="btn-pill btn-start-souffle" id="souffle-start">Démarrer</button>
          </div>` :
            `<div class="controls-row">
            <button class="btn-pill btn-danger" id="souffle-stop">Arrêter</button>
          </div>`
        }
      </div>
    </div>`;
}

// ═══════ RENDER: ÉCRIN ═══════
function renderEcrin() {
    const hs = state.heartState;
    const heartImages = {
        frozen: new URL('./assets/Coeur/coeurgélée_trp.png', import.meta.url).href,
        cold: new URL('./assets/Coeur/coeurfroid_trp.png', import.meta.url).href,
        awakening: new URL('./assets/Coeur/coeurréveil_trp.png', import.meta.url).href,
        incandescent: new URL('./assets/Coeur/coeurIncandescent_trp.png', import.meta.url).href,
        forge: new URL('./assets/Coeur/coeurForge_trp.png', import.meta.url).href,
        ka: new URL('./assets/Coeur/coeurKA_trp.png', import.meta.url).href,
    };
    const heartConfig = {
        frozen: { emoji: '❄️', name: 'Gelé', color: '#93C5FD', desc: 'Inactivité > 24h — XP bloqué', bg: 'linear-gradient(135deg, #DBEAFE 0%, #93C5FD 100%)' },
        cold: { emoji: '🪨', name: 'Froid', color: '#94A3B8', desc: 'État neutre — prêt à agir', bg: 'linear-gradient(135deg, #F1F5F9 0%, #CBD5E1 100%)' },
        awakening: { emoji: '🔥', name: 'Réveil', color: '#F97316', desc: '0-10 min focus — rougeoiement doux', bg: 'linear-gradient(135deg, #FED7AA 0%, #FB923C 100%)' },
        incandescent: { emoji: '💥', name: 'Incandescent', color: '#EF4444', desc: '10-29 min focus — feu vif', bg: 'linear-gradient(135deg, #FECACA 0%, #EF4444 100%)' },
        forge: { emoji: '☀️', name: 'Forge', color: '#F59E0B', desc: '30 min atteintes — or flamboyant', bg: 'linear-gradient(135deg, #FEF3C7 0%, #F59E0B 100%)' },
        ka: { emoji: '🌌', name: 'Actif KA', color: '#8B5CF6', desc: 'Maître KA — aura solaire dorée', bg: 'linear-gradient(135deg, #EDE9FE 0%, #8B5CF6 100%)' },
    };

    const current = heartConfig[hs] || heartConfig.cold;

    // All states list
    const statesList = Object.entries(heartConfig).map(([key, cfg]) => `
    <div class="ecrin-state-item ${key === hs ? 'current' : ''}">
      <div class="ecrin-state-emoji">${cfg.emoji}</div>
      <div class="ecrin-state-info">
        <div class="ecrin-state-name">${cfg.name}</div>
        <div class="ecrin-state-desc">${cfg.desc}</div>
      </div>
      ${key === hs ? '<div class="ecrin-state-badge">Actuel</div>' : ''}
    </div>`).join('');

    // Dégel action
    const canThaw = hs === 'frozen' && state.mercuryQty > 0;

    return `
    <div class="page-content" style="background-image: url('${fondHome}'); background-size: cover; background-position: center;">
      <div class="ecrin-screen">
        <div class="ecrin-header">
          <span class="ecrin-title">❤️ L'Écrin</span>
          <span class="ecrin-subtitle">Sanctuaire du Cœur</span>
        </div>

        <!-- Current Heart State -->
        <div class="ecrin-current" style="background: ${current.bg}">
          <div class="ecrin-current-image" style="display: flex; justify-content: center; padding: 20px 0;">
            <img src="${heartImages[hs]}" style="width: 220px; height: auto;" />
          </div>
          <div class="ecrin-current-name">${current.name}</div>
          <div class="ecrin-current-desc">${current.desc}</div>
          <div class="ecrin-temp">${Math.round(state.temperature)}°C</div>
          <div class="ecrin-reserve">Réserve : ${Math.round(state.temperature_reserve)}°C</div>
          ${canThaw ? `<button class="ecrin-thaw-btn" id="thaw-btn">
            <img src="/pearl.png" alt="Perle" class="ecrin-thaw-pearl" /> Consommer 1 Perle — Dégeler
          </button>` : ''}
          ${hs === 'frozen' && !canThaw ? `<div class="ecrin-no-pearl">Aucune Perle disponible — Respirez pour en gagner</div>` : ''}
        </div>

        ${!state.kaActive ? `
        <div style="margin-top:20px; text-align:center;">
          <button id="btn-activate-ka" class="btn-pill" style="background: linear-gradient(135deg, #FF6B35 0%, #F59E0B 100%); color:white; width:100%; border:none; box-shadow: 0 4px 15px rgba(255, 107, 53, 0.4);" ${state.mercuryQty >= KA_MODE_COST.perles && state.sulfurQty >= KA_MODE_COST.braises && state.kaActivationsToday < KA_ACTIVATIONS_MAX ? '' : 'disabled'}>
             Activer Mode KA — 1 Perle + 1 Braise (confirmer)
          </button>
          <div style="font-size:11px; color:#64748B; margin-top:8px;">${state.kaActivationsToday}/${KA_ACTIVATIONS_MAX} activations aujourd'hui</div>
        </div>
        ` : `
        <div style="margin-top:20px; text-align:center;">
          <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid var(--color-or); padding: 12px; border-radius: 12px; color: var(--color-or); font-weight: bold;">
            🌟 Mode KA Actif pour la prochaine session !
          </div>
        </div>
        `}

        <!-- Resources Overview -->
        <div class="ecrin-resources">
          <div class="ecrin-res-card">
            <img src="/pearl.png" alt="Perle" class="ecrin-res-img" />
            <div class="ecrin-res-info">
              <span class="ecrin-res-value">${state.mercuryQty}</span>
              <span class="ecrin-res-label">Perles de Nacre</span>
            </div>
          </div>
          <div class="ecrin-res-card">
            <img src="/braise.png" alt="Braise" class="ecrin-res-img" />
            <div class="ecrin-res-info">
              <span class="ecrin-res-value">${state.sulfurQty}</span>
              <span class="ecrin-res-label">Braises</span>
            </div>
          </div>
          <div class="ecrin-res-card">
            <img src="/salt.png" alt="Sel" class="ecrin-res-img" />
            <div class="ecrin-res-info">
              <span class="ecrin-res-value">${state.saltQty}/7</span>
              <span class="ecrin-res-label">Grains de Sel</span>
            </div>
          </div>
        </div>

        <!-- All Heart States -->
        <div class="ecrin-states-section">
          <div class="section-label">Les 6 États du Cœur</div>
          <div class="ecrin-states-list">${statesList}</div>
        </div>
      </div>
    </div>`;
}

// ═══════ BOTTOM NAV ═══════
function renderBottomNav() {
    const tabs = [
        { id: 'home', label: 'Sanctuaire' },
        { id: 'forge', label: 'Forge' },
        { id: 'souffle', label: 'Souffle' },
        { id: 'ecrin', label: 'Écrin' },
    ];
    return `
    <nav class="bottom-nav" id="bottom-nav">
      ${tabs.map(t => `
        <button class="nav-item ${state.activeTab === t.id ? 'active' : ''}" data-tab="${t.id}" id="nav-${t.id}" aria-label="${t.label}" aria-current="${state.activeTab === t.id ? 'page' : 'false'}">
          <span class="nav-icon-3d" aria-hidden="true"></span>
        </button>
      `).join('')}
    </nav>`;
}

// ═══════ FORGE LOGIC ═══════
function startForge() {
    state.forgeCompleted = false;
    state.forgeCompletedGains = null;
    if (state.forgeCooldown || state.forgeActive) return;
    state.forgeActive = true;
    state.forgePaused = false;
    state.forgeSeconds = 0;
    requestWakeLock();
    updateHeartState();

    runForgeTimer();
    render();
}

function runForgeTimer() {
    state.forgeInterval = setInterval(() => {
        if (state.forgePaused) return;

        state.forgeSeconds++;

        // +1 XP per minute
        if (state.forgeSeconds % 60 === 0) {
            addXp(1);
        }

        const totalSeconds = FORGE_DURATIONS[state.forgeDuration].seconds;
        if (state.forgeSeconds >= totalSeconds) {
            completeForge();
            return;
        }

        updateForgeDisplay();
    }, 1000);
}

function pauseForge() {
    state.forgePaused = true;
    render();
}

function resumeForge() {
    state.forgePaused = false;
    render();
}

async function abandonForge() {
    if (state.forgeInterval) clearInterval(state.forgeInterval);
    const elapsedSeconds = state.forgeSeconds;
    const xpEarned = Math.floor(state.forgeSeconds / 60);
    state.forgeActive = false;
    state.forgePaused = false;
    releaseWakeLock();
    updateHeartState();
    state.activeTab = 'home';
    state.forgeSeconds = 0;
    state.forgeDuration = null;
    render();
    // Sync en arrière-plan après le render
    saveSession('focus', elapsedSeconds, xpEarned, false).catch(e => console.error(e));
    syncChildData().catch(e => console.error(e));
}

async function completeForge() {
    const completedDuration = state.forgeDuration;
    clearInterval(state.forgeInterval);
    state.forgeActive = false;
    state.forgePaused = false;
    releaseWakeLock();
    // heartState sera mis à jour via addTemperature() / updateHeartState()

    playFocusComplete();

    // Braises logic
    if (state.forgeDuration === 15) {
        addTemperature(TEMP_GAINS.focus_15);
        state.sulfurHalf = (state.sulfurHalf || 0) + 1;
        if (state.sulfurHalf >= 2) {
            state.sulfurQty++;
            state.sulfurHalf = 0;
        }
    } else {
        // 30 min ou 45 min
        if (state.forgeDuration === 30) {
            addTemperature(TEMP_GAINS.focus_30);
        } else if (state.forgeDuration === 45) {
            addTemperature(TEMP_GAINS.focus_45);
        }
        state.sulfurQty++;
    }

    // Bonus Perles (45 min)
    if (state.forgeDuration === 45) {
        state.mercuryHalf = (state.mercuryHalf || 0) + 1;
        if (state.mercuryHalf >= 2) {
            state.mercuryQty++;
            state.mercuryHalf = 0;
        }
    }

    let finalXp = FORGE_DURATIONS[completedDuration].xpValue;
    if (state.kaActive) {
        finalXp = Math.floor(finalXp * (1 + KA_XP_BONUS));
        const extraXp = finalXp - FORGE_DURATIONS[completedDuration].xpValue;
        addXp(extraXp); // Donner le bonus
        addTemperature(100);
        state.kaActive = false;
        state.kaSessionType = null;
    }

    // Show completion screen
    state.forgeCompleted = true;
    state.forgeCompletedGains = {
        xp: finalXp,
        braises: completedDuration === 15 ? '½ Braise' : '1 Braise',
        perles: completedDuration === 45 ? '½ Perle' : null,
        temp: FORGE_DURATIONS[completedDuration].temp,
        duration: FORGE_DURATIONS[completedDuration].label,
    };

    // Start cooldown
    state.forgeCooldown = true;
    state.forgeCooldownSeconds = FORGE_COOLDOWN;
    state.forgeCooldownInterval = setInterval(() => {
        state.forgeCooldownSeconds--;
        if (state.forgeCooldownSeconds <= 0) {
            clearInterval(state.forgeCooldownInterval);
            state.forgeCooldown = false;
            state.heartState = 'cold';
            state.forgeSeconds = 0;
            state.forgeDuration = null;
            render();
        }
        updateForgeDisplay();
    }, 1000);

    giveDailySalt();
    render();
    saveSession('focus', FORGE_DURATIONS[completedDuration].seconds, finalXp, true)
        .catch(e => { console.error('[FORGE SAVE ERROR]', e); showToast('Erreur de sauvegarde de session'); });
    syncChildData()
        .catch(e => console.error('[FORGE SYNC ERROR]', e));
}
function updateForgeDisplay() {
    if (state.activeTab !== 'forge') return;
    const app = document.getElementById('app');
    const timerText = app.querySelector('.external-total-timer');
    if (timerText && state.forgeDuration) {
        const elapsed = state.forgeSeconds;
        const totalSeconds = FORGE_DURATIONS[state.forgeDuration].seconds;
        const remaining = Math.max(0, Math.floor(totalSeconds - elapsed));
        const progress = (remaining / totalSeconds) * 100;

        timerText.textContent = formatTime(remaining);

        const ring = app.querySelector('.timer-progress-ring');
        if (ring) {
            const radius = 95;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (progress / 100) * circumference;
            ring.setAttribute('stroke-dashoffset', offset);
        }

        const statusLabel = app.querySelector('.braise-status-label');
        if (statusLabel) {
            const braiseLabels = ['ÉTINCELLES FROIDES', 'ROUGEOIE', 'OR PUR'];
            const labelIdx = Math.min(2, Math.floor(elapsed / (10 * 60)));
            statusLabel.textContent = state.forgeActive ? braiseLabels[labelIdx] : 'PRÊT À FORGER';
        }
        // Note: We no longer update forge-controls here to prevent interrupting click events (mousedown/mouseup element replacement bug).
        // Button states are updated via a full render() when pause/resume is toggled.
    }
}

// ═══════ SOUFFLE LOGIC ═══════
// SOUFFLE ACTIONS
function startSouffle() {
    state.souffleCompleted = false;
    state.souffleCompletedGains = null;
    const type = state.souffleType || 'stop_panique';
    const ex = souffleExercises[type] || souffleExercises.stop_panique;

    // Vérifier cooldown Cohérence
    if (type === 'coherence' && state.souffleCoherenceLastTime) {
        const elapsed = Date.now() - state.souffleCoherenceLastTime;
        if (elapsed < souffleExercises.coherence.cooldown) {
            return;
        }
    }

    // Vérifier limite Vague Zen
    if (type === 'vague_zen' && state.souffleVagueCount >= 2) {
        // Session 3+ : pratique libre, on prévient
        // On laisse démarrer mais completeSouffle ne donnera pas de Perle
    }

    const lockedType = state.souffleType || 'stop_panique';
    state.souffleActive = true;
    startBreathMusic();
    state.souffleSeconds = 0;
    state.soufflePhase = 'inhale';
    state.soufflePhaseSeconds = 0;

    if (state.souffleInterval) clearInterval(state.souffleInterval);
    state.souffleInterval = setInterval(() => {
        state.souffleSeconds++;
        state.soufflePhaseSeconds++;

        // Current phase dur
        const curDur = state.soufflePhase === 'inhale' ? ex.inhale : (state.soufflePhase === 'hold' ? ex.hold : ex.exhale);

        if (state.soufflePhaseSeconds >= curDur) {
            state.soufflePhaseSeconds = 0;
            if (state.soufflePhase === 'inhale') {
                state.soufflePhase = ex.hold > 0 ? 'hold' : 'exhale';
            } else if (state.soufflePhase === 'hold') {
                state.soufflePhase = 'exhale';
            } else {
                state.soufflePhase = 'inhale';
            }
        }

        const currentEx = souffleExercises[lockedType] || souffleExercises.stop_panique;
        if (state.souffleSeconds >= currentEx.duration) {
            completeSouffle();
        } else {
            updateSouffleDisplay();
        }
    }, 1000);

    render(); // L'orbe apparaît à l'écran (taille 1.0)

    // Une fraction de seconde après l'apparition à l'écran (50ms),
    // on ordonne de passer à la taille 1.12 pour lancer la cinématique d'inspiration
    setTimeout(() => {
        updateSouffleDisplay();
    }, 50);
}

function updateSouffleDisplay() {
    if (state.activeTab !== 'souffle') return;
    const app = document.getElementById('app');

    const type = state.souffleType || 'stop_panique';
    const exercise = souffleExercises[type] || souffleExercises.stop_panique;
    const elapsed = state.souffleSeconds;
    const remaining = Math.max(0, exercise.duration - elapsed);

    const phaseDur = state.soufflePhase === 'inhale' ? exercise.inhale : (state.soufflePhase === 'hold' ? exercise.hold : exercise.exhale);
    const phaseRemaining = Math.max(0, phaseDur - state.soufflePhaseSeconds);
    const phaseLabelText = state.soufflePhase === 'inhale' ? 'INSPIRER' : (state.soufflePhase === 'hold' ? 'BLOQUER' : 'EXPIRER');

    const contentWrap = app.querySelector('.orb-timer-content');
    if (contentWrap) {
        if (state.souffleActive) {
            contentWrap.innerHTML = `
        <span class="orb-timer-text action-text">${phaseLabelText}</span>
        <span class="orb-timer-text chrono-text">${phaseRemaining}</span>
      `;
        } else {
            contentWrap.innerHTML = `
        <span class="orb-timer-text">${formatTime(remaining)}</span>
      `;
        }
    }

    const ring = app.querySelector('.timer-progress-ring');
    if (ring) {
        const progress = (remaining / exercise.duration) * 100;
        const radius = 95;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (progress / 100) * circumference;
        ring.setAttribute('stroke-dashoffset', offset);
    }

    const externalTimer = app.querySelector('.external-total-timer');
    if (externalTimer && state.souffleActive) {
        externalTimer.textContent = formatTime(remaining);
    }

    // Animation CSS native continue
    const orbWrap = app.querySelector('.central-orb-wrap');
    if (orbWrap && state.souffleActive) {
        let orbScale = 1;
        let transitionStyle = 'transform 1s ease-out';
        if (state.soufflePhase === 'inhale') {
            orbScale = 1.12;
            transitionStyle = `transform ${exercise.inhale}s ease-in-out`;
        } else if (state.soufflePhase === 'hold') {
            orbScale = 1.12;
            transitionStyle = `transform 0.5s ease`;
        } else {
            orbScale = 1.0;
            transitionStyle = `transform ${exercise.exhale}s ease-in-out`;
        }

        orbWrap.style.transform = `scale(${orbScale})`;
        orbWrap.style.transition = transitionStyle;
    }
}

function stopSouffle() {
    if (state.souffleInterval) {
        clearInterval(state.souffleInterval);
        state.souffleInterval = null;
    }
    state.souffleActive = false;
    stopBreathMusic();
    state.souffleSeconds = 0;
    state.souffleType = null; // Retour au menu de sélection
    render();
}

async function completeSouffle() {
    if (state.souffleInterval) clearInterval(state.souffleInterval);
    state.souffleInterval = null;
    state.souffleActive = false;
    stopBreathMusic();

    const type = state.souffleType || 'stop_panique';
    const ex = souffleExercises[type] || souffleExercises.stop_panique;
    let xp = ex.xp || 10;
    
    if (state.kaActive) {
        xp = Math.floor(xp * (1 + KA_XP_BONUS));
        addTemperature(100);
        state.kaActive = false;
        state.kaSessionType = null;
    }
    addXp(xp);

    let rewardMsg = `Souffle ${ex.name} terminé ! +${xp} XP.`;

    // Perles selon le type et Température
    if (type === 'coherence') {
        addTemperature(TEMP_GAINS.coherence);
        // Cohérence : +1 Perle entière
        state.mercuryQty++;
        state.souffleCoherenceLastTime = Date.now();
        rewardMsg += ' +1 Perle de Nacre.';
    } else if (type === 'vague_zen') {
        addTemperature(TEMP_GAINS.vague_zen);
        // Vague Zen : +½ Perle, max 2 fertiles/jour
        if (state.souffleVagueCount < 2) {
            state.souffleVagueCount++;
            state.mercuryHalf = (state.mercuryHalf || 0) + 1;
            if (state.mercuryHalf >= 2) {
                state.mercuryQty++;
                state.mercuryHalf = 0;
            }
            rewardMsg += ' +½ Perle.';
        } else {
            rewardMsg += ' Pratique libre — pas de Perle.';
        }
    } else if (type === 'stop_panique') {
        addTemperature(TEMP_GAINS.stop_panique);
        // Stop Panique : +½ Perle, illimité
        state.mercuryHalf = (state.mercuryHalf || 0) + 1;
        if (state.mercuryHalf >= 2) {
            state.mercuryQty++;
            state.mercuryHalf = 0;
        }
        rewardMsg += ' +½ Perle.';
    }

    state.souffleCompleted = true;
    state.souffleCompletedGains = {
        name: ex.name,
        xp: xp,
        perlesText: type === 'coherence' ? '1 Perle de Nacre' : (rewardMsg.includes('½ Perle') ? '½ Perle' : null),
        temp: `+${TEMP_GAINS[type]}°C`,
        duration: formatTime(ex.duration),
        color: ex.color || '#3B82F6'
    };
    
    giveDailySalt();
    render();
    saveSession(type, ex.duration, xp, true)
        .catch(e => { console.error('[SOUFFLE SAVE ERROR]', e); showToast('Erreur de sauvegarde de session'); });
    syncChildData()
        .catch(e => console.error('[SOUFFLE SYNC ERROR]', e));
}

// ═══════ HEART LOGIC ═══════
function thawHeart() {
    if (state.heartState !== 'frozen' || state.mercuryQty < 1) return;
    state.mercuryQty--;
    state.heartState = 'cold';
    syncChildData().catch(err => {
        console.error('Erreur sync dégel:', err);
    });
    render();
}

function activateKA() {
    if (state.mercuryQty >= KA_MODE_COST.perles && 
        state.sulfurQty >= KA_MODE_COST.braises && 
        state.kaActivationsToday < KA_ACTIVATIONS_MAX &&
        !state.kaActive) {
        
        state.mercuryQty -= KA_MODE_COST.perles;
        state.sulfurQty -= KA_MODE_COST.braises;
        state.kaActive = true;
        state.kaSessionType = 'next';
        state.kaActivationsToday++;
        render();
    }
}

// Event delegation is used in render() for all interactive elements.

// ═══════ AUTH LOGIC ═══════
async function handleLogin() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    if (!email || !password) return;

    state.authLoading = true;
    state.authError = null;
    render();

    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            state.authError = error.message;
        } else {
            state.user = data.user;
            await loadChildren();
        }
    } catch (err) {
        console.error('[MINDKING] Login Error:', err);
        state.authError = "Une erreur inattendue est survenue.";
    } finally {
        state.authLoading = false;
        render();
    }
}

async function loginWithGoogle() {
    state.authLoading = true;
    render();
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin,
            queryParams: {
                prompt: 'select_account'
            }
        }
    });
    if (error) {
        state.authError = error.message;
        state.authLoading = false;
        render();
    }
}

async function handleSignup() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    if (!email || !password) return;

    state.authLoading = true;
    state.authError = null;
    render();

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
        state.authError = error.message;
    } else {
        alert("Compte créé ! Vous pouvez maintenant vous connecter.");
    }
    state.authLoading = false;
    render();
}

async function loadChildren() {
    if (!state.user) return;
    const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('user_id', state.user.id);

    if (error) {
        state.authError = 'Impossible de charger les profils';
    } else {
        state.children = data || [];
    }
    render();
}

function loadChildData(childId) {
    const child = state.children.find(c => c.id === childId);
    if (!child) return;

    state.selectedChild = child;

    // Mapping complet vers les propriétés du state
    state.name = child.name || 'Alchimiste';
    state.childName = child.name || 'Alchimiste';
    state.xp = child.xp ?? 0;
    state.dailyXp = child.daily_xp ?? 0;
    const gradeStringToIndex = { neophyte: 0, disciple: 1, alchimiste: 2, maitre_ka: 3, ka_1: 4, ka_2: 5, ka_3: 6 };
    state.grade = typeof child.grade === 'string' ? (gradeStringToIndex[child.grade] ?? 0) : (child.grade || 0);
    state.heartState = child.heart_state || 'cold';
    state.temperature = child.temperature ?? 20;
    state.temperature_reserve = child.temperature_reserve ?? 0;
    state.mercuryQty = child.perles_qty || 0;
    state.sulfurQty = child.braises_qty || 0;
    state.saltQty = child.crystal_qty || 0;
    state.sulfurHalf = child.braises_half ?? 0;
    state.mercuryHalf = child.perles_half ?? 0;
    state.souffleCoherenceLastTime = child.coherence_cooldown_until ? new Date(child.coherence_cooldown_until).getTime() : null;
    state.selectedBackground = child.background_pref ?? 'default';
    state.saltToday = child.crystal_today || false;
    
    state.lastActiveDay = child.last_connection ? new Date(child.last_connection).toDateString() : new Date().toDateString();

    const lastConnTime = child.last_connection ? new Date(child.last_connection).getTime() : Date.now();
    const hoursSinceLastConn = (Date.now() - lastConnTime) / (1000 * 60 * 60);
    const freezeTimer = (['maitre_ka', 'ka_1', 'ka_2', 'ka_3'].includes(getGradeString()) ? 48 : 24) + (child.crystal_qty || 0) * 4;

    if (child.heart_state === 'frozen' || hoursSinceLastConn >= freezeTimer) {
        state.heartState = 'frozen';
        state.temperature = -20;
    } else {
        state.heartState = child.heart_state || 'cold';
    }

    state.activeTab = 'home';
    updateGrade();
    updateHeartState();
    checkDailyReset();
    render();
}

async function selectChild(childId) {
    loadChildData(childId);
}



function getGradeString() {
    if (state.xp >= 42000) return 'ka_3';
    if (state.xp >= 32000) return 'ka_2';
    if (state.xp >= 22000) return 'ka_1';
    if (state.xp >= 12000) return 'maitre_ka';
    if (state.xp >= 3000) return 'alchimiste';
    if (state.xp >= 600) return 'disciple';
    return 'neophyte';
}

async function syncChildData() {
    if (!state.selectedChild) return;
    try {
        const { error } = await supabase
            .from('children')
            .update({
                xp: state.xp,
                daily_xp: state.dailyXp,
                grade: getGradeString(),
                heart_state: state.heartState,
                temperature: Math.round(state.temperature),
                temperature_reserve: Math.round(state.temperature_reserve),
                perles_qty: state.mercuryQty,
                braises_qty: state.sulfurQty,
                crystal_qty: state.saltQty,
                crystal_today: state.saltToday,
                perles_half: state.mercuryHalf || 0,
                braises_half: state.sulfurHalf || 0,
                coherence_cooldown_until: state.souffleCoherenceLastTime ? new Date(state.souffleCoherenceLastTime).toISOString() : null,
                background_pref: state.selectedBackground,
                last_connection: new Date().toISOString()
            })
            .eq('id', state.selectedChild.id);

        if (error) {
            console.error('[MINDKING] Sync error:', error.message);
            showToast('Synchronisation échouée — vérifie ta connexion');
        }
    } catch (error) {
        console.error('[MINDKING] Sync error:', error);
        showToast('Synchronisation échouée — vérifie ta connexion');
    }
}

async function saveSession(type, duration, xpValue, completed) {
    if (!state.selectedChild) return;

    const payload = {
        child_id: state.selectedChild.id,
        type: type,
        duration: duration,
        xp_earned: xpValue,
        completed: completed,
        created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('sessions').insert(payload);

    if (error) {
        console.error('[MINDKING] Session save error:', error.message, error.details);
    }
}

async function logout() {
    await supabase.auth.signOut()
    state.user = null
    state.selectedChild = null
    state.children = []
    state.currentScreen = 'home'
    state.activeTab = 'home'
    render()
}



function checkDailyReset() {
    if (!state.selectedChild) return;
    const today = new Date().toDateString();
    if (state.lastActiveDay && state.lastActiveDay !== today) {
        // C'est un nouveau jour local !
        state.dailyXp = 0;
        state.souffleVagueCount = 0;
        state.saltToday = false;
        state.kaActivationsToday = 0;
        // On pourrait aussi reset perles_half et braises_half si voulu, mais gardons l'existant.
        state.lastActiveDay = today;
        syncChildData().catch(e => console.error("Daily reset sync error:", e));
    } else if (!state.lastActiveDay) {
        state.lastActiveDay = today;
    }
}

// ═══════ ONBOARDING ═══════
let onboardingSlide = 0;

function isFirstLaunch() {
    return !state.selectedChild?.onboarded;
}

function markOnboarded() {
    state.selectedChild.onboarded = true;
    syncChildData().catch(console.error);
}

const ONBOARDING_SLIDES = [
    { icon: '🔥', title: 'La Forge', desc: 'Concentre-toi 15, 30 ou 45 minutes pour gagner des Braises et de l\'XP' },
    { icon: '🌬️', title: 'Le Souffle', desc: 'Respire pour gagner des Perles de Nacre — elles gardent ton Cœur en vie' },
    { icon: '❤️', title: 'Ton Cœur', desc: 'Sans pratique 24h, il gèle. Une Perle le dégèle.' },
];

function renderOnboarding() {
    const slide = ONBOARDING_SLIDES[onboardingSlide];
    const isLast = onboardingSlide === ONBOARDING_SLIDES.length - 1;
    const dots = ONBOARDING_SLIDES.map((_, i) =>
        `<span class="mk-onboard-dot ${i === onboardingSlide ? 'active' : ''}"></span>`
    ).join('');

    return `
    <div class="mk-onboard-screen">
      <div class="mk-onboard-card">
        <div class="mk-onboard-icon">${slide.icon}</div>
        <h2 class="mk-onboard-title">${slide.title}</h2>
        <p class="mk-onboard-desc">${slide.desc}</p>
        <div class="mk-onboard-dots">${dots}</div>
        <button class="btn-pill mk-onboard-btn" id="${isLast ? 'onboard-finish' : 'onboard-next'}">
          ${isLast ? 'Commencer' : 'Suivant'}
        </button>
      </div>
    </div>`;
}

// ═══════ FULL RENDER ═══════
const screens = { home: renderHome, forge: renderForge, souffle: renderSouffle, ecrin: renderEcrin };

function render() {
    const app = document.getElementById('app');

    if (!state.user) {
        app.innerHTML = renderAuth();
        return;
    }

    if (!state.selectedChild) {
        app.innerHTML = renderSelection();
        return;
    }

    if (isFirstLaunch()) {
        app.innerHTML = renderOnboarding();
        app.onclick = (e) => {
            const id = e.target.closest('button')?.id;
            if (id === 'onboard-next') { onboardingSlide++; render(); }
            if (id === 'onboard-finish') { markOnboarded(); onboardingSlide = 0; render(); }
        };
        return;
    }

    checkDailyReset();

    const renderer = screens[state.activeTab] || renderHome;
    app.innerHTML = renderer() + renderBottomNav();

    // Home Page: Golden Paillettes & Asset Sweep
    if (state.activeTab === 'home') {
        const homePage = app.querySelector('.home-page');
        if (homePage) {
            if (!homePage.querySelector('#sparkles-home')) {
                const homeSparkles = createSparkles();
                homeSparkles.id = 'sparkles-home';
                homePage.appendChild(homeSparkles);
            }
            // On nettoie les fonds blancs des assets pour une intégration parfaite
            app.querySelectorAll('.stock-icon img, .logo-crown, .avatar-wrap img').forEach(img => {
                removeWhiteBg(img, 240);
            });

            // Gestion directe clic déconnexion
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', async () => {
                    await supabase.auth.signOut();
                    state.user = null;
                    state.selectedChild = null;
                    state.children = [];
                    render();
                });
            }
        }
    }

    // Fire particles logic for Forge - Burst from heart
    if (state.activeTab === 'forge') {
        const container = document.getElementById('forge-fire-particles');
        if (container && container.childElementCount === 0) {
            for (let i = 0; i < 30; i++) {
                const p = document.createElement('div');
                p.className = 'fire-p';

                // Random burst direction from center
                const angle = Math.random() * Math.PI * 2;
                const dist = 50 + Math.random() * 250;
                const tx = Math.cos(angle) * dist;
                const ty = Math.sin(angle) * dist;

                p.style.setProperty('--tx', `${tx}px`);
                p.style.setProperty('--ty', `${ty}px`);
                p.style.animationDelay = `${Math.random() * 5}s`;
                p.style.background = Math.random() > 0.5 ? '#F59E0B' : '#FFD700';
                p.style.width = `${2 + Math.random() * 3}px`;
                p.style.height = p.style.width;

                container.appendChild(p);
            }
        }
    }

    // We now use CSS mix-blend-mode: multiply to handle white background removal to avoid flickering

    // Event Delegation for all action buttons
    app.onclick = (e) => {
        const target = e.target.closest('button, .nav-item, .orb, .souffle-card, .child-card, .forge-choice-card');
        if (!target) return;

        const id = target.id;
        const tab = target.dataset.tab;

        // ...
        if (target.classList.contains('nav-item') && tab && tab !== state.activeTab) {
            state.activeTab = tab;
            render();
            return;
        }

        // Home orbs & buttons
        if (id === 'orb-forge' || id === 'home-forge-btn') { state.activeTab = 'forge'; render(); return; }
        if (id === 'orb-breathe' || id === 'home-breathe-btn') { state.activeTab = 'souffle'; render(); return; }
        if (id === 'toggle-bg') { toggleBackground(); return; }

        // Forge actions
        const forgeCard = e.target.closest('.forge-choice-card');
        if (forgeCard) {
            const dur = parseInt(forgeCard.id.replace('forge-choice-', ''));
            if ([15, 30, 45].includes(dur)) {
                state.forgeDuration = dur;
                startForge();
                return;
            }
        }
        if (id === 'forge-complete-ok') {
            state.forgeCompleted = false;
            state.forgeSeconds = 0;
            state.forgeDuration = null;
            state.forgeCompletedGains = null;
            state.activeTab = 'home';
            render();
            return;
        }
        if (id === 'forge-back-home') { state.activeTab = 'home'; render(); return; }
        if (id === 'forge-start') { target.disabled = true; startForge(); return; }
        if (id === 'forge-pause') pauseForge();
        if (id === 'forge-resume') resumeForge();
        if (id === 'forge-abandon') {
            // Replace window.confirm with a direct action to bypass popup blockers and interval bugs.
            // We will now directly abandon to Home.
            abandonForge();
        }

        // Souffle actions
        if (id === 'souffle-complete-ok') {
            state.souffleCompleted = false;
            state.souffleCompletedGains = null;
            stopSouffle();
            state.activeTab = 'home';
            render();
            return;
        }
        if (id === 'souffle-start') { target.disabled = true; startSouffle(); return; }
        if (id === 'souffle-stop') stopSouffle();
        if (id === 'souffle-change') {
            state.souffleType = null;
            render();
            return;
        }
        if (target.classList.contains('souffle-card')) {
            state.souffleType = target.dataset.type;
            render();
            return;
        }

        // Ecrin actions
        if (id === 'thaw-btn') thawHeart();
        if (id === 'btn-activate-ka') {
            if (!target.dataset.confirmed) {
                target.dataset.confirmed = 'true';
                target.textContent = 'Confirmer ?';
            } else {
                delete target.dataset.confirmed;
                activateKA();
            }
            return;
        }

        // Onboarding actions
        if (id === 'onboard-next') { onboardingSlide++; render(); return; }
        if (id === 'onboard-finish') { markOnboarded(); onboardingSlide = 0; render(); return; }

        // Auth actions
        // Suppression du bouton logout-oauth superflu
    };

    // Sparkles
    if (!document.getElementById('sparkles')) document.body.appendChild(createSparkles());
}

// ═══════ EXPOSITION GLOBALE (ONCLICK) ═══════
window.logout = logout;
window.handleLogout = logout;
window.loginWithGoogle = loginWithGoogle;
window.handleLogin = handleLogin;
window.loginWithEmail = handleLogin;
window.handleSignup = handleSignup;
window.selectChild = selectChild;
window.loadChildData = loadChildData;
window.loadChildren = loadChildren;
window.syncChildData = syncChildData;
window.toggleBackground = toggleBackground;

// Fonctions de jeu (Forge, Souffle, Ecrin)
window.startForge = startForge;
window.pauseForge = pauseForge;
window.resumeForge = resumeForge;
window.abandonForge = abandonForge;
window.startSouffle = startSouffle;
window.stopSouffle = stopSouffle;
window.thawHeart = thawHeart;

// ─── Boot ───
document.addEventListener('DOMContentLoaded', async () => {

    // 1. Récupérer la session existante immédiatement
    const { data: { session: initialSession } } = await supabase.auth.getSession();

    if (initialSession) {
        state.user = initialSession.user;
        if (state.children === null) {
            await loadChildren();
        }
        if (state.children && state.children.length === 1 && !state.selectedChild) {
            loadChildData(state.children[0].id);
        }
    } else {
        state.user = null;
        state.children = null;
        state.selectedChild = null;
    }

    state.authLoading = false;
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) loadingScreen.remove();
    render();

    // 2. Garder onAuthStateChange pour les changements futurs (login/logout)
    supabase.auth.onAuthStateChange(async (_event, session) => {
        // Ne traiter que les vrais changements (pas le chargement initial)
        if (session && !state.user) {
            state.user = session.user;
            if (state.children === null) await loadChildren();
            render();
        } else if (!session && state.user) {
            state.user = null;
            state.children = null;
            state.selectedChild = null;
            render();
        }
    });

    startCoolingLoop();
});

// ─── Service Worker ───
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/sw.js')
//       .catch(e => console.warn('SW registration failed:', e));
//   });
// }

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { User, CELESTIAL_RANKS, CelestialRank } from '../types';
import { playKitestSound } from './KitestEmblem';
import {
  Swords,
  Crosshair,
  Brain,
  Zap,
  Timer,
  Trophy,
  Users,
  Sparkles,
  ShieldAlert,
  Flame,
  Award,
  Crown,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  MousePointer,
  RotateCw,
  Target,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Eye,
  Camera,
  Compass,
} from 'lucide-react';

interface KiteshotGameViewProps {
  currentUser: User | null;
  users: User[];
  soundEnabled?: boolean;
  onUpdateUser: (updated: User) => void;
  onRequireLogin: () => void;
  onOpenPremium: () => void;
}

interface LivePlayer {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  score: number;
  health: number;
  kills: number;
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch?: number;
  color: string;
  celestialRank?: string;
  isBot?: boolean;
  lastSeenAt?: number;
}

interface DamagePopup {
  id: string;
  text: string;
  isCrit: boolean;
  x: number;
  y: number;
}

type WeaponType = 'railgun' | 'shotgun' | 'rocket';

interface WeaponConfig {
  name: string;
  type: WeaponType;
  damage: number;
  headshotMultiplier: number;
  fireRateMs: number;
  magSize: number;
  recoil: number;
  color: string;
}

const WEAPONS: Record<WeaponType, WeaponConfig> = {
  railgun: {
    name: 'Hyper Railgun',
    type: 'railgun',
    damage: 95,
    headshotMultiplier: 2.1,
    fireRateMs: 240,
    magSize: 12,
    recoil: 14,
    color: '#38bdf8',
  },
  shotgun: {
    name: 'Scatter Blaster',
    type: 'shotgun',
    damage: 16, // per pellet (8 pellets = 128 max)
    headshotMultiplier: 1.5,
    fireRateMs: 500,
    magSize: 8,
    recoil: 22,
    color: '#f59e0b',
  },
  rocket: {
    name: 'Plasma Launcher',
    type: 'rocket',
    damage: 110,
    headshotMultiplier: 1.3,
    fireRateMs: 750,
    magSize: 4,
    recoil: 28,
    color: '#ec4899',
  },
};

export const KiteshotGameView: React.FC<KiteshotGameViewProps> = ({
  currentUser,
  users,
  soundEnabled = true,
  onUpdateUser,
  onRequireLogin,
  onOpenPremium,
}) => {
  const [activeMode, setActiveMode] = useState<'kiteshot' | 'iq_memory'>('kiteshot');
  const [inGame, setInGame] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number>(0);
  const [livePlayers, setLivePlayers] = useState<LivePlayer[]>([]);
  const [killFeed, setKillFeed] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [localScore, setLocalScore] = useState(0);
  const [killsCount, setKillsCount] = useState(0);
  const [streakBanner, setStreakBanner] = useState<string | null>(null);
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(!soundEnabled);

  // Weapon & Combat State
  const [currentWeapon, setCurrentWeapon] = useState<WeaponType>('railgun');
  const [ammo, setAmmo] = useState<Record<WeaponType, number>>({
    railgun: 12,
    shotgun: 8,
    rocket: 4,
  });
  const [isReloading, setIsReloading] = useState(false);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [playerShield, setPlayerShield] = useState(50);
  const [hitmarkerVisible, setHitmarkerVisible] = useState(false);
  const [isCriticalHit, setIsCriticalHit] = useState(false);
  const [damagePopups, setDamagePopups] = useState<DamagePopup[]>([]);
  const [currentSpeedDisplay, setCurrentSpeedDisplay] = useState(0);
  const [dashCooldown, setDashCooldown] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [isGrappling, setIsGrappling] = useState(false);
  const [isThirdPerson, setIsThirdPerson] = useState(false);

  // Three.js References
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Gun in 1st Person & Crosshair
  const gunMeshRef = useRef<THREE.Group | null>(null);
  const muzzleLightRef = useRef<THREE.PointLight | null>(null);

  // Active 3D elements in scene
  const botMeshesRef = useRef<
    Map<
      string,
      {
        group: THREE.Group;
        leftArm: THREE.Mesh;
        rightArm: THREE.Mesh;
        leftLeg: THREE.Mesh;
        rightLeg: THREE.Mesh;
        head: THREE.Mesh;
        healthFill: THREE.Mesh;
        isRagdolling?: boolean;
        ragdollVelocity?: THREE.Vector3[];
      }
    >
  >(new Map());

  const activeLasersRef = useRef<
    { mesh: THREE.Mesh; dir: THREE.Vector3; life: number; maxLife: number }[]
  >([]);
  const activeRocketsRef = useRef<
    { mesh: THREE.Mesh; velocity: THREE.Vector3; life: number; shooterId: string }[]
  >([]);
  const activeParticlesRef = useRef<
    { mesh: THREE.Mesh; velocity: THREE.Vector3; life: number; maxLife: number }[]
  >([]);
  const grappleLineRef = useRef<THREE.Line | null>(null);
  const grappleAnchorRef = useRef<THREE.Vector3 | null>(null);

  // Player Physics & Movement State
  const playerPhysicsRef = useRef({
    position: new THREE.Vector3(0, 1.8, -14),
    velocity: new THREE.Vector3(0, 0, 0),
    yaw: 0,
    pitch: 0,
    isGrounded: true,
    isSliding: false,
    slideTimer: 0,
    dashTimer: 0,
    recoilAmount: 0,
    walkCycle: 0,
    canDoubleJump: true,
    canWallBounce: true,
  });

  const keysDownRef = useRef<Record<string, boolean>>({});
  const lastShotTimeRef = useRef<number>(0);

  // User celestial multiplier
  const userRank: CelestialRank = (currentUser as any)?.celestialRank || 'moon';
  const celestialInfo = CELESTIAL_RANKS[userRank] || CELESTIAL_RANKS.moon;
  const multiplier = celestialInfo.multiplier;
  const isPremium = Boolean(currentUser?.isPremium);

  // =========================================================================
  // AUDIO SYNTHESIZER: INSTANT HIGH-OCTANE ROBOLOX HYPERSHOT SFX
  // =========================================================================
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playRailgunSound = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.18);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch {}
  }, [getAudioContext, isMuted]);

  const playShotgunSound = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      // Low punch + noise blast
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.22);
      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch {}
  }, [getAudioContext, isMuted]);

  const playRocketSound = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.35);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }, [getAudioContext, isMuted]);

  const playHitmarkerSound = useCallback((isCrit: boolean = false) => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isCrit ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(isCrit ? 2600 : 1900, now);
      osc.frequency.setValueAtTime(isCrit ? 3400 : 2200, now + 0.035);
      gain.gain.setValueAtTime(isCrit ? 0.22 : 0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch {}
  }, [getAudioContext, isMuted]);

  // Classic Roblox "Oof" elimination sound
  const playRobloxOofSound = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.19);
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.19);
    } catch {}
  }, [getAudioContext, isMuted]);

  const playDashWhoosh = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.25);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch {}
  }, [getAudioContext, isMuted]);

  const playGrappleLatch = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.exponentialRampToValueAtTime(450, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch {}
  }, [getAudioContext, isMuted]);

  const playJumpPadSound = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.exponentialRampToValueAtTime(980, now + 0.28);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    } catch {}
  }, [getAudioContext, isMuted]);

  // =========================================================================
  // ARENA LAYOUT DEFINITIONS (Cyber Neon Pillars, Pads, Catwalks)
  // =========================================================================
  const arenaPillars = useMemo(
    () => [
      { x: -16, z: 8, width: 4, height: 16, depth: 4, color: 0x0284c7 },
      { x: 16, z: 8, width: 4, height: 16, depth: 4, color: 0x0284c7 },
      { x: -16, z: 32, width: 4, height: 16, depth: 4, color: 0x7c3aed },
      { x: 16, z: 32, width: 4, height: 16, depth: 4, color: 0x7c3aed },
      { x: 0, z: 20, width: 5, height: 10, depth: 5, color: 0x059669 },
    ],
    []
  );

  const jumpPads = useMemo(
    () => [
      { x: -12, z: 2, radius: 2.2, power: 22 },
      { x: 12, z: 2, radius: 2.2, power: 22 },
      { x: 0, z: -8, radius: 2.5, power: 26 },
      { x: 0, z: 38, radius: 2.5, power: 24 },
    ],
    []
  );

  const speedPads = useMemo(
    () => [
      { x: -8, z: 18, length: 14, boostDir: new THREE.Vector3(0, 0, 1), power: 32 },
      { x: 8, z: 18, length: 14, boostDir: new THREE.Vector3(0, 0, 1), power: 32 },
    ],
    []
  );

  // =========================================================================
  // THREE.JS SCENE SETUP & GAME LOOP
  // =========================================================================
  useEffect(() => {
    if (!inGame || !mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x060913);
    scene.fog = new THREE.FogExp2(0x060913, 0.018);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(78, width / height, 0.1, 800);
    cameraRef.current = camera;
    scene.add(camera);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xbae6fd, 1.4);
    dirLight.position.set(20, 45, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // Emissive arena center point light
    const centerLight = new THREE.PointLight(0x38bdf8, 2.5, 45);
    centerLight.position.set(0, 8, 20);
    scene.add(centerLight);

    // 5. Arena Floor & Neon Grid
    const floorGeo = new THREE.PlaneGeometry(120, 120);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0b1120,
      roughness: 0.25,
      metalness: 0.7,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const gridHelper = new THREE.GridHelper(120, 60, 0x38bdf8, 0x1e293b);
    gridHelper.position.y = 0.02;
    scene.add(gridHelper);

    // Arena Perimeter Glow Walls
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      emissive: 0x0284c7,
      emissiveIntensity: 0.2,
      roughness: 0.5,
    });
    const boundaryWalls = [
      { w: 120, h: 22, d: 2, x: 0, y: 11, z: -55 },
      { w: 120, h: 22, d: 2, x: 0, y: 11, z: 55 },
      { w: 2, h: 22, d: 110, x: -55, y: 11, z: 0 },
      { w: 2, h: 22, d: 110, x: 55, y: 11, z: 0 },
    ];
    boundaryWalls.forEach((bw) => {
      const geo = new THREE.BoxGeometry(bw.w, bw.h, bw.d);
      const mesh = new THREE.Mesh(geo, wallMat);
      mesh.position.set(bw.x, bw.y, bw.z);
      scene.add(mesh);
    });

    // 6. Build Cyber Pillars with neon edge accents
    arenaPillars.forEach((p) => {
      const pilGeo = new THREE.BoxGeometry(p.width, p.height, p.depth);
      const pilMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.3,
        metalness: 0.8,
      });
      const pil = new THREE.Mesh(pilGeo, pilMat);
      pil.position.set(p.x, p.height / 2, p.z);
      pil.castShadow = true;
      pil.receiveShadow = true;
      scene.add(pil);

      // Neon vertical strip
      const stripGeo = new THREE.BoxGeometry(0.3, p.height, 0.3);
      const stripMat = new THREE.MeshBasicMaterial({ color: p.color });
      const strip1 = new THREE.Mesh(stripGeo, stripMat);
      strip1.position.set(p.x + p.width / 2 + 0.1, p.height / 2, p.z);
      scene.add(strip1);
      const strip2 = new THREE.Mesh(stripGeo, stripMat);
      strip2.position.set(p.x - p.width / 2 - 0.1, p.height / 2, p.z);
      scene.add(strip2);
    });

    // Elevated Walkway connecting pillars
    const bridgeGeo = new THREE.BoxGeometry(36, 1.2, 5);
    const bridgeMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.15,
    });
    const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
    bridge.position.set(0, 8.5, 20);
    scene.add(bridge);

    // 7. Jump Pads (Glowing Rings on Floor)
    jumpPads.forEach((jp) => {
      const padGeo = new THREE.CylinderGeometry(jp.radius, jp.radius, 0.25, 32);
      const padMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.85,
      });
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.set(jp.x, 0.15, jp.z);
      scene.add(pad);

      // Glowing pulsing ring
      const ringGeo = new THREE.RingGeometry(jp.radius * 0.7, jp.radius * 0.95, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(jp.x, 0.3, jp.z);
      scene.add(ring);
    });

    // 8. First Person 3D Gun Model (Roblox Sci-Fi Hyper Blaster)
    const gunGroup = new THREE.Group();
    gunMeshRef.current = gunGroup;

    // Body
    const gunBodyGeo = new THREE.BoxGeometry(0.14, 0.22, 0.75);
    const gunBodyMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.2,
    });
    const gunBody = new THREE.Mesh(gunBodyGeo, gunBodyMat);
    gunGroup.add(gunBody);

    // Barrel
    const barrelGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.65, 16);
    const barrelMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.95,
      roughness: 0.1,
    });
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.04, -0.45);
    gunGroup.add(barrel);

    // Neon glowing energy coils on barrel
    const coilGeo = new THREE.TorusGeometry(0.065, 0.016, 12, 24);
    const coilMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    for (let c = 0; c < 3; c++) {
      const coil = new THREE.Mesh(coilGeo, coilMat);
      coil.position.set(0, 0.04, -0.3 - c * 0.15);
      gunGroup.add(coil);
    }

    // Holographic Sight Glass
    const sightGeo = new THREE.BoxGeometry(0.06, 0.09, 0.02);
    const sightMat = new THREE.MeshBasicMaterial({
      color: 0xec4899,
      transparent: true,
      opacity: 0.8,
    });
    const sight = new THREE.Mesh(sightGeo, sightMat);
    sight.position.set(0, 0.17, -0.05);
    gunGroup.add(sight);

    // Muzzle Flash Light
    const muzzleLight = new THREE.PointLight(0x38bdf8, 0, 10);
    muzzleLight.position.set(0, 0.04, -0.85);
    gunGroup.add(muzzleLight);
    muzzleLightRef.current = muzzleLight;

    // Position gun on camera (First-person weapon view)
    gunGroup.position.set(0.38, -0.28, -0.65);
    camera.add(gunGroup);

    // 9. Resize Listener
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const nw = container.clientWidth || window.innerWidth;
      const nh = container.clientHeight || window.innerHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', handleResize);

    // 10. Animation & Physics Loop
    let lastTime = performance.now();

    const animateLoop = (now: number) => {
      animFrameRef.current = requestAnimationFrame(animateLoop);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const p = playerPhysicsRef.current;
      const keys = keysDownRef.current;

      // -------------------------------------------------------------
      // (A) Movement & Air Strafe Controls
      // -------------------------------------------------------------
      const moveForward = (keys['KeyW'] || keys['ArrowUp'] ? 1 : 0) - (keys['KeyS'] || keys['ArrowDown'] ? 1 : 0);
      const moveRight = (keys['KeyD'] || keys['ArrowRight'] ? 1 : 0) - (keys['KeyA'] || keys['ArrowLeft'] ? 1 : 0);

      // Dash Cooldown countdown
      if (p.dashTimer > 0) {
        p.dashTimer = Math.max(0, p.dashTimer - dt);
        setDashCooldown(Math.ceil(p.dashTimer));
      }

      // Slide Handling (Shift or KeyC while moving)
      const wantsSlide = (keys['ShiftLeft'] || keys['ShiftRight'] || keys['KeyC']) && p.isGrounded;
      if (wantsSlide && !p.isSliding && (moveForward !== 0 || moveRight !== 0)) {
        p.isSliding = true;
        p.slideTimer = 1.2;
        setIsSliding(true);
        playDashWhoosh();
        // Give slide burst
        const slideDir = new THREE.Vector3(
          Math.sin(p.yaw) * moveForward + Math.cos(p.yaw) * moveRight,
          0,
          Math.cos(p.yaw) * moveForward - Math.sin(p.yaw) * moveRight
        ).normalize();
        p.velocity.addScaledVector(slideDir, 16);
      } else if (!wantsSlide || p.slideTimer <= 0) {
        if (p.isSliding) {
          p.isSliding = false;
          setIsSliding(false);
        }
      }

      if (p.isSliding) {
        p.slideTimer -= dt;
      }

      // Base move speed (Hypershot is fast & responsive)
      const baseSpeed = p.isSliding ? 22 : 14.5;
      const forwardDir = new THREE.Vector3(Math.sin(p.yaw), 0, Math.cos(p.yaw));
      const rightDir = new THREE.Vector3(Math.cos(p.yaw), 0, -Math.sin(p.yaw));

      const inputVec = new THREE.Vector3();
      if (moveForward !== 0) inputVec.addScaledVector(forwardDir, moveForward);
      if (moveRight !== 0) inputVec.addScaledVector(rightDir, moveRight);
      inputVec.normalize();

      // Horizontal acceleration and friction
      if (inputVec.lengthSq() > 0) {
        const accel = p.isGrounded ? (p.isSliding ? 18 : 65) : 32;
        p.velocity.x += inputVec.x * accel * dt;
        p.velocity.z += inputVec.z * accel * dt;
      }

      // Damping / Friction
      const friction = p.isGrounded ? (p.isSliding ? 0.985 : 0.88) : 0.985;
      p.velocity.x *= friction;
      p.velocity.z *= friction;

      // -------------------------------------------------------------
      // (B) Jump & Slide-Bhop & Wall-Bounce
      // -------------------------------------------------------------
      if (keys['Space']) {
        if (p.isGrounded) {
          p.isGrounded = false;
          // Slide-bhop preserves horizontal momentum and adds vertical pop!
          p.velocity.y = p.isSliding ? 14 : 11.5;
          p.canDoubleJump = true;
          playJumpPadSound();
          keys['Space'] = false; // consume space tap
        } else if (p.canWallBounce) {
          // Check proximity to any pillar for Wall-Bounce kick!
          for (const pil of arenaPillars) {
            const dist = Math.hypot(p.position.x - pil.x, p.position.z - pil.z);
            if (dist < pil.width * 1.2 && p.position.y > 1 && p.position.y < pil.height) {
              // Wall kick off normal!
              const kickNormal = new THREE.Vector3(p.position.x - pil.x, 0, p.position.z - pil.z).normalize();
              p.velocity.x = kickNormal.x * 24;
              p.velocity.z = kickNormal.z * 24;
              p.velocity.y = 13.5;
              p.canWallBounce = false;
              setTimeout(() => {
                p.canWallBounce = true;
              }, 400);
              playRailgunSound();
              keys['Space'] = false;
              break;
            }
          }
        }
      }

      // Air Dash (Q or E key)
      if ((keys['KeyQ'] || keys['KeyE']) && p.dashTimer <= 0) {
        p.dashTimer = 2.4;
        playDashWhoosh();
        const dashDir = new THREE.Vector3(Math.sin(p.yaw), 0.2, Math.cos(p.yaw)).normalize();
        p.velocity.addScaledVector(dashDir, 26);
        keys['KeyQ'] = false;
        keys['KeyE'] = false;
      }

      // Grappling Hook Physics (Reeling toward anchor)
      if (grappleAnchorRef.current && isGrappling) {
        const anchor = grappleAnchorRef.current;
        const toAnchor = new THREE.Vector3().subVectors(anchor, p.position);
        const dist = toAnchor.length();
        if (dist > 2.5) {
          toAnchor.normalize();
          p.velocity.addScaledVector(toAnchor, 38 * dt);
          p.velocity.y += 18 * dt; // vertical lift
        } else {
          // Reached anchor -> detach with slingshot!
          grappleAnchorRef.current = null;
          setIsGrappling(false);
        }
      }

      // Apply Gravity
      p.velocity.y -= 28 * dt;

      // Update Position
      p.position.addScaledVector(p.velocity, dt);

      // Floor collision
      const targetEyeHeight = p.isSliding ? 0.95 : 1.8;
      if (p.position.y <= targetEyeHeight) {
        p.position.y = targetEyeHeight;
        p.velocity.y = 0;
        p.isGrounded = true;
      }

      // Jump Pad collisions
      jumpPads.forEach((jp) => {
        const dist = Math.hypot(p.position.x - jp.x, p.position.z - jp.z);
        if (dist < jp.radius && p.position.y <= targetEyeHeight + 0.3) {
          p.velocity.y = jp.power;
          p.isGrounded = false;
          playJumpPadSound();
        }
      });

      // Speed Pad collisions
      speedPads.forEach((sp) => {
        if (
          Math.abs(p.position.x - sp.x) < 2.5 &&
          Math.abs(p.position.z - sp.z) < sp.length / 2 &&
          p.position.y <= targetEyeHeight + 0.3
        ) {
          p.velocity.addScaledVector(sp.boostDir, sp.power * dt * 4);
        }
      });

      // Speedometer update
      const horizontalSpeed = Math.hypot(p.velocity.x, p.velocity.z);
      setCurrentSpeedDisplay(Math.round(horizontalSpeed * 3.6));

      // Dynamic FOV based on speed and sliding
      const targetFov = 75 + Math.min(horizontalSpeed * 0.75, 18) + (p.isSliding ? 6 : 0);
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.15);
      camera.updateProjectionMatrix();

      // Camera Position & Rotation
      camera.position.copy(p.position);
      camera.rotation.order = 'YXZ';
      camera.rotation.y = p.yaw;
      camera.rotation.x = p.pitch;

      // Gun Bobbing & Recoil Animation
      if (gunMeshRef.current) {
        const gun = gunMeshRef.current;
        p.walkCycle += horizontalSpeed * dt * 0.8;
        const bobX = Math.cos(p.walkCycle) * 0.015;
        const bobY = Math.sin(p.walkCycle * 2) * 0.012;

        p.recoilAmount = THREE.MathUtils.lerp(p.recoilAmount, 0, 0.2);
        const slideTilt = p.isSliding ? 0.38 : 0;

        gun.position.set(0.38 + bobX, -0.28 + bobY, -0.65 + p.recoilAmount * 0.015);
        gun.rotation.set(
          p.recoilAmount * 0.02,
          bobX * 1.2,
          slideTilt + (p.walkCycle % Math.PI) * 0.02
        );
      }

      // Muzzle Light Fading
      if (muzzleLightRef.current && muzzleLightRef.current.intensity > 0) {
        muzzleLightRef.current.intensity = Math.max(0, muzzleLightRef.current.intensity - dt * 25);
      }

      // -------------------------------------------------------------
      // (C) Update 3D Projectiles (Lasers, Rockets, Particles)
      // -------------------------------------------------------------
      // 1. Lasers
      for (let i = activeLasersRef.current.length - 1; i >= 0; i--) {
        const laser = activeLasersRef.current[i];
        laser.life -= dt;
        const scale = Math.max(0.01, laser.life / laser.maxLife);
        laser.mesh.scale.set(scale, scale, 1);
        if (laser.life <= 0) {
          scene.remove(laser.mesh);
          activeLasersRef.current.splice(i, 1);
        }
      }

      // 2. Rockets
      for (let r = activeRocketsRef.current.length - 1; r >= 0; r--) {
        const rock = activeRocketsRef.current[r];
        rock.mesh.position.addScaledVector(rock.velocity, dt);
        rock.life -= dt;

        // Check floor collision -> explode!
        if (rock.mesh.position.y <= 0.4 || rock.life <= 0) {
          // Explosion shockwave & particles
          createExplosion(rock.mesh.position, scene);
          playRocketSound();

          // Check rocket jump for player
          const distToPlayer = rock.mesh.position.distanceTo(p.position);
          if (distToPlayer < 6.5) {
            const impulse = new THREE.Vector3().subVectors(p.position, rock.mesh.position).normalize();
            p.velocity.addScaledVector(impulse, 24);
            p.velocity.y = Math.max(p.velocity.y, 22); // Rocket jump pop!
            p.isGrounded = false;
          }

          scene.remove(rock.mesh);
          activeRocketsRef.current.splice(r, 1);
        }
      }

      // 3. Particles
      for (let pt = activeParticlesRef.current.length - 1; pt >= 0; pt--) {
        const part = activeParticlesRef.current[pt];
        part.mesh.position.addScaledVector(part.velocity, dt);
        part.life -= dt;
        const scale = Math.max(0.01, part.life / part.maxLife);
        part.mesh.scale.set(scale, scale, scale);
        if (part.life <= 0) {
          scene.remove(part.mesh);
          activeParticlesRef.current.splice(pt, 1);
        }
      }

      // 4. Update Grappling Hook Line in 3D
      if (grappleLineRef.current && grappleAnchorRef.current) {
        const lineGeo = grappleLineRef.current.geometry;
        const startPos = new THREE.Vector3(0.38, -0.28, -0.65).applyMatrix4(camera.matrixWorld);
        const endPos = grappleAnchorRef.current;
        const positions = new Float32Array([
          startPos.x,
          startPos.y,
          startPos.z,
          endPos.x,
          endPos.y,
          endPos.z,
        ]);
        lineGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      }

      // -------------------------------------------------------------
      // (D) Animate Roblox Bots (Walking, Aiming, Jumping)
      // -------------------------------------------------------------
      botMeshesRef.current.forEach((botData, botId) => {
        if (!botData.isRagdolling) {
          const walkAngle = Math.sin(now * 0.008 + botId.length) * 0.6;
          botData.leftLeg.rotation.x = walkAngle;
          botData.rightLeg.rotation.x = -walkAngle;
          botData.leftArm.rotation.x = -walkAngle * 0.7;
          botData.rightArm.rotation.x = walkAngle * 0.7;
        } else if (botData.ragdollVelocity) {
          // Ragdoll shatter physics on elimination
          const vels = botData.ragdollVelocity;
          botData.head.position.addScaledVector(vels[0], dt);
          botData.leftArm.position.addScaledVector(vels[1], dt);
          botData.rightArm.position.addScaledVector(vels[2], dt);
          botData.leftLeg.position.addScaledVector(vels[3], dt);
          botData.rightLeg.position.addScaledVector(vels[4], dt);
        }
      });

      // 5. Render Scene
      renderer.render(scene, camera);
    };

    animFrameRef.current = requestAnimationFrame(animateLoop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      botMeshesRef.current.clear();
      activeLasersRef.current = [];
      activeRocketsRef.current = [];
      activeParticlesRef.current = [];
      if (container) container.innerHTML = '';
    };
  }, [inGame, arenaPillars, jumpPads, speedPads, isMuted, playDashWhoosh, playJumpPadSound, playRailgunSound, playRocketSound]);

  // Helper to spawn 3D explosion
  const createExplosion = (pos: THREE.Vector3, scene: THREE.Scene) => {
    // Shockwave sphere
    const sphereGeo = new THREE.SphereGeometry(1.2, 16, 16);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0xec4899,
      transparent: true,
      opacity: 0.9,
    });
    const shockwave = new THREE.Mesh(sphereGeo, sphereMat);
    shockwave.position.copy(pos);
    scene.add(shockwave);

    activeParticlesRef.current.push({
      mesh: shockwave,
      velocity: new THREE.Vector3(0, 0, 0),
      life: 0.28,
      maxLife: 0.28,
    });

    // Particle sparks
    for (let i = 0; i < 18; i++) {
      const partGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const partMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xf59e0b : 0xec4899,
      });
      const part = new THREE.Mesh(partGeo, partMat);
      part.position.copy(pos);
      scene.add(part);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 22,
        Math.random() * 18 + 4,
        (Math.random() - 0.5) * 22
      );

      activeParticlesRef.current.push({
        mesh: part,
        velocity: vel,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1.0,
      });
    }
  };

  // =========================================================================
  // SYNC ROBLOX BOT MESHES IN 3D SCENE
  // =========================================================================
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !inGame) return;

    livePlayers.forEach((player) => {
      if (player.id === currentUser?.id) return;

      if (!botMeshesRef.current.has(player.id)) {
        // Build Classic Roblox R6 Blocky Avatar
        const botGroup = new THREE.Group();
        botGroup.position.set(player.x, player.y, player.z);

        // Head (Skin yellow cube)
        const headGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        const headMat = new THREE.MeshStandardMaterial({
          color: 0xfacc15,
          roughness: 0.35,
        });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.8;
        botGroup.add(head);

        // Torso (Colored Jersey)
        const torsoGeo = new THREE.BoxGeometry(1.2, 1.2, 0.6);
        const torsoMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(player.color || 0x38bdf8),
          metalness: 0.2,
          roughness: 0.4,
        });
        const torso = new THREE.Mesh(torsoGeo, torsoMat);
        torso.position.y = 0.8;
        botGroup.add(torso);

        // Left Arm
        const armGeo = new THREE.BoxGeometry(0.5, 1.2, 0.5);
        const armMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(player.color || 0x38bdf8),
        });
        const leftArm = new THREE.Mesh(armGeo, armMat);
        leftArm.position.set(-0.9, 0.8, 0);
        botGroup.add(leftArm);

        // Right Arm
        const rightArm = new THREE.Mesh(armGeo, armMat);
        rightArm.position.set(0.9, 0.8, 0);
        botGroup.add(rightArm);

        // Left Leg
        const legGeo = new THREE.BoxGeometry(0.55, 1.2, 0.55);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
        const leftLeg = new THREE.Mesh(legGeo, legMat);
        leftLeg.position.set(-0.35, -0.3, 0);
        botGroup.add(leftLeg);

        // Right Leg
        const rightLeg = new THREE.Mesh(legGeo, legMat);
        rightLeg.position.set(0.35, -0.3, 0);
        botGroup.add(rightLeg);

        // Health Bar 3D background & fill
        const hpBgGeo = new THREE.PlaneGeometry(1.4, 0.16);
        const hpBgMat = new THREE.MeshBasicMaterial({ color: 0x0f172a, side: THREE.DoubleSide });
        const hpBg = new THREE.Mesh(hpBgGeo, hpBgMat);
        hpBg.position.set(0, 2.5, 0);
        botGroup.add(hpBg);

        const hpFillGeo = new THREE.PlaneGeometry(1.36, 0.12);
        const hpFillMat = new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide });
        const hpFill = new THREE.Mesh(hpFillGeo, hpFillMat);
        hpFill.position.set(0, 2.5, 0.01);
        botGroup.add(hpFill);

        scene.add(botGroup);

        botMeshesRef.current.set(player.id, {
          group: botGroup,
          head,
          leftArm,
          rightArm,
          leftLeg,
          rightLeg,
          healthFill: hpFill,
        });
      } else {
        const bot = botMeshesRef.current.get(player.id)!;
        if (!bot.isRagdolling) {
          bot.group.position.set(player.x, player.y, player.z);
          bot.group.rotation.y = player.yaw;

          // Update health bar scale
          const hpPct = Math.max(0, player.health / 100);
          bot.healthFill.scale.set(hpPct, 1, 1);
        }
      }
    });
  }, [livePlayers, inGame, currentUser]);

  // =========================================================================
  // SHOOTING & WEAPON FIRING SYSTEM
  // =========================================================================
  const handleFireWeapon = useCallback(() => {
    if (!inGame || !currentUser || isReloading) return;

    const currentWpn = WEAPONS[currentWeapon];
    const currentAmmo = ammo[currentWeapon];

    if (currentAmmo <= 0) {
      handleReload();
      return;
    }

    const now = Date.now();
    if (now - lastShotTimeRef.current < currentWpn.fireRateMs) return;
    lastShotTimeRef.current = now;

    // Deduct ammo
    setAmmo((prev) => ({
      ...prev,
      [currentWeapon]: prev[currentWeapon] - 1,
    }));

    const p = playerPhysicsRef.current;
    p.recoilAmount = currentWpn.recoil;

    // Flash muzzle light
    if (muzzleLightRef.current) {
      muzzleLightRef.current.color = new THREE.Color(currentWpn.color);
      muzzleLightRef.current.intensity = 8;
    }

    const camera = cameraRef.current;
    const scene = sceneRef.current;
    if (!camera || !scene) return;

    // Fire direction ray
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

    if (currentWeapon === 'railgun') {
      playRailgunSound();

      // Hitscan Raycast
      const startPos = new THREE.Vector3(0.38, -0.28, -0.65).applyMatrix4(camera.matrixWorld);
      let endPos = startPos.clone().addScaledVector(raycaster.ray.direction, 120);

      // Check hit against bots
      let hitTarget: LivePlayer | null = null;
      let hitHead = false;

      livePlayers.forEach((bot) => {
        if (bot.id === currentUser.id) return;
        const botBox = new THREE.Box3(
          new THREE.Vector3(bot.x - 0.7, bot.y, bot.z - 0.7),
          new THREE.Vector3(bot.x + 0.7, bot.y + 2.2, bot.z + 0.7)
        );
        const intersect = raycaster.ray.intersectBox(botBox, new THREE.Vector3());
        if (intersect) {
          hitTarget = bot;
          endPos = intersect;
          if (intersect.y > bot.y + 1.5) {
            hitHead = true;
          }
        }
      });

      // Render 3D Lingering Glowing Railgun Beam
      const beamDist = startPos.distanceTo(endPos);
      const beamGeo = new THREE.CylinderGeometry(0.04, 0.04, beamDist, 8);
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.95,
      });
      const beamMesh = new THREE.Mesh(beamGeo, beamMat);

      beamMesh.position.copy(startPos).lerp(endPos, 0.5);
      beamMesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3().subVectors(endPos, startPos).normalize()
      );
      scene.add(beamMesh);

      activeLasersRef.current.push({
        mesh: beamMesh,
        dir: raycaster.ray.direction,
        life: 0.35,
        maxLife: 0.35,
      });

      if (hitTarget) {
        handleApplyDamage(hitTarget, currentWpn.damage, hitHead);
      }
    } else if (currentWeapon === 'shotgun') {
      playShotgunSound();

      // Scatter 8 pellets
      for (let s = 0; s < 8; s++) {
        const spreadX = (Math.random() - 0.5) * 0.08;
        const spreadY = (Math.random() - 0.5) * 0.08;
        const spreadDir = raycaster.ray.direction.clone().add(new THREE.Vector3(spreadX, spreadY, 0)).normalize();

        const pelletGeo = new THREE.SphereGeometry(0.08, 8, 8);
        const pelletMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
        const pellet = new THREE.Mesh(pelletGeo, pelletMat);
        pellet.position.copy(camera.position);
        scene.add(pellet);

        activeParticlesRef.current.push({
          mesh: pellet,
          velocity: spreadDir.multiplyScalar(75),
          life: 0.45,
          maxLife: 0.45,
        });
      }

      // Proximity damage to nearest bot in front
      livePlayers.forEach((bot) => {
        if (bot.id === currentUser.id) return;
        const toBot = new THREE.Vector3(bot.x - p.position.x, 0, bot.z - p.position.z);
        const dist = toBot.length();
        if (dist < 18) {
          toBot.normalize();
          const dot = toBot.dot(raycaster.ray.direction);
          if (dot > 0.88) {
            handleApplyDamage(bot, Math.round(currentWpn.damage * (18 / Math.max(dist, 4))), false);
          }
        }
      });
    } else if (currentWeapon === 'rocket') {
      playRocketSound();

      // 3D Glowing Rocket Projectile
      const rocketGeo = new THREE.SphereGeometry(0.24, 12, 12);
      const rocketMat = new THREE.MeshBasicMaterial({ color: 0xec4899 });
      const rocket = new THREE.Mesh(rocketGeo, rocketMat);
      rocket.position.copy(camera.position).addScaledVector(raycaster.ray.direction, 0.8);
      scene.add(rocket);

      activeRocketsRef.current.push({
        mesh: rocket,
        velocity: raycaster.ray.direction.clone().multiplyScalar(42),
        life: 3.5,
        shooterId: currentUser.id,
      });
    }
  }, [inGame, currentUser, isReloading, currentWeapon, ammo, livePlayers, playRailgunSound, playShotgunSound, playRocketSound]);

  // Apply Damage to Bot & Trigger Roblox Elimination if 0 HP
  const handleApplyDamage = (target: LivePlayer, rawDmg: number, isHeadshot: boolean) => {
    const finalDmg = isHeadshot ? Math.round(rawDmg * 2.1) : rawDmg;
    playHitmarkerSound(isHeadshot);
    setHitmarkerVisible(true);
    setIsCriticalHit(isHeadshot);
    setTimeout(() => setHitmarkerVisible(false), 90);

    // Floating screen damage popup
    const popupId = `dmg_${Date.now()}_${Math.random()}`;
    setDamagePopups((prev) => [
      ...prev.slice(-6),
      {
        id: popupId,
        text: isHeadshot ? `HEADSHOT! +${finalDmg}` : `+${finalDmg}`,
        isCrit: isHeadshot,
        x: window.innerWidth / 2 + (Math.random() - 0.5) * 80,
        y: window.innerHeight / 2 - 40 + (Math.random() - 0.5) * 50,
      },
    ]);
    setTimeout(() => {
      setDamagePopups((prev) => prev.filter((d) => d.id !== popupId));
    }, 900);

    // Update target health
    setLivePlayers((prev) =>
      prev.map((bot) => {
        if (bot.id === target.id) {
          const newHp = bot.health - finalDmg;
          if (newHp <= 0) {
            // Trigger Roblox Elimination!
            playRobloxOofSound();
            handleBotEliminated(bot);
            return { ...bot, health: 100, x: (Math.random() - 0.5) * 40, z: Math.random() * 40 };
          }
          return { ...bot, health: newHp };
        }
        return bot;
      })
    );
  };

  // Bot Defeated -> Classic Roblox Shatter & Kill Streak
  const handleBotEliminated = (bot: LivePlayer) => {
    const scene = sceneRef.current;
    if (scene && botMeshesRef.current.has(bot.id)) {
      const bData = botMeshesRef.current.get(bot.id)!;
      bData.isRagdolling = true;
      bData.ragdollVelocity = [
        new THREE.Vector3((Math.random() - 0.5) * 12, 12, (Math.random() - 0.5) * 12),
        new THREE.Vector3((Math.random() - 0.5) * 16, 8, (Math.random() - 0.5) * 16),
        new THREE.Vector3((Math.random() - 0.5) * 16, 8, (Math.random() - 0.5) * 16),
        new THREE.Vector3((Math.random() - 0.5) * 14, 6, (Math.random() - 0.5) * 14),
        new THREE.Vector3((Math.random() - 0.5) * 14, 6, (Math.random() - 0.5) * 14),
      ];
      setTimeout(() => {
        bData.isRagdolling = false;
      }, 1500);
    }

    setKillsCount((prev) => {
      const nextKills = prev + 1;
      if (nextKills === 2) setStreakBanner('DOUBLE KILL!');
      else if (nextKills === 3) setStreakBanner('TRIPLE KILL!');
      else if (nextKills === 5) setStreakBanner('HYPER STRIKE!');
      else if (nextKills >= 8) setStreakBanner('UNSTOPPABLE GODLIKE!');
      setTimeout(() => setStreakBanner(null), 2500);
      return nextKills;
    });

    const earned = Math.round(150 * multiplier);
    setLocalScore((s) => s + earned);

    setKillFeed((kf) => [`Siz [${WEAPONS[currentWeapon].name}] ${bot.name}`, ...kf.slice(0, 4)]);
  };

  // Grappling Hook Action
  const handleTriggerGrapple = useCallback(() => {
    if (!inGame) return;
    const camera = cameraRef.current;
    const scene = sceneRef.current;
    if (!camera || !scene) return;

    if (isGrappling) {
      // Detach grapple and slingshot
      setIsGrappling(false);
      grappleAnchorRef.current = null;
      if (grappleLineRef.current) {
        scene.remove(grappleLineRef.current);
        grappleLineRef.current = null;
      }
      return;
    }

    // Raycast forward to latch onto wall / pillar / ceiling
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

    // Find nearest pillar or boundary wall
    let closestPoint: THREE.Vector3 | null = null;
    let minDist = 75;

    arenaPillars.forEach((pil) => {
      const pilBox = new THREE.Box3(
        new THREE.Vector3(pil.x - pil.width / 2, 0, pil.z - pil.depth / 2),
        new THREE.Vector3(pil.x + pil.width / 2, pil.height, pil.z + pil.depth / 2)
      );
      const intersect = raycaster.ray.intersectBox(pilBox, new THREE.Vector3());
      if (intersect) {
        const d = intersect.distanceTo(camera.position);
        if (d < minDist) {
          minDist = d;
          closestPoint = intersect;
        }
      }
    });

    if (!closestPoint) {
      // Default to distant point in ray
      closestPoint = camera.position.clone().addScaledVector(raycaster.ray.direction, 45);
      closestPoint.y = Math.max(closestPoint.y, 4);
    }

    grappleAnchorRef.current = closestPoint;
    setIsGrappling(true);
    playGrappleLatch();

    // Create 3D Glowing Grapple Cable
    const lineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 3 });
    const lineGeo = new THREE.BufferGeometry().setFromPoints([camera.position, closestPoint]);
    const line = new THREE.Line(lineGeo, lineMat);
    scene.add(line);
    grappleLineRef.current = line;
  }, [inGame, isGrappling, arenaPillars, playGrappleLatch]);

  // Reload handler
  const handleReload = () => {
    if (isReloading) return;
    setIsReloading(true);
    playKitestSound('click', soundEnabled);
    setTimeout(() => {
      setAmmo((prev) => ({
        ...prev,
        [currentWeapon]: WEAPONS[currentWeapon].magSize,
      }));
      setIsReloading(false);
      playKitestSound('coin', soundEnabled);
    }, 1100);
  };

  // Keyboard Event Listeners
  useEffect(() => {
    if (!inGame) return;

    const onKeyDown = (e: KeyboardEvent) => {
      keysDownRef.current[e.code] = true;

      if (e.code === 'Digit1') setCurrentWeapon('railgun');
      if (e.code === 'Digit2') setCurrentWeapon('shotgun');
      if (e.code === 'Digit3') setCurrentWeapon('rocket');
      if (e.code === 'KeyR') handleReload();
      if (e.code === 'KeyF') handleTriggerGrapple();
      if (e.code === 'KeyV') setIsThirdPerson((tp) => !tp);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysDownRef.current[e.code] = false;
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) handleFireWeapon();
      if (e.button === 2) handleTriggerGrapple();
    };

    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== mountRef.current?.querySelector('canvas')) return;
      const p = playerPhysicsRef.current;
      p.yaw -= e.movementX * 0.0022;
      p.pitch -= e.movementY * 0.0022;
      p.pitch = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, p.pitch));
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [inGame, handleFireWeapon, handleTriggerGrapple]);

  // Join Game & Start Session
  const handleStartGame = async () => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }

    setErrorMsg(null);
    try {
      const res = await fetch('/api/gameball/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          name: currentUser.name,
          username: currentUser.username,
          celestialRank: userRank,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "O'yinga kirishda xatolik");
      }

      playKitestSound('fanfare', soundEnabled);
      setSessionTimeLeft(data.sessionDurationSeconds || 90);
      setInGame(true);
      setLocalScore(0);
      setKillsCount(0);
      setAmmo({ railgun: 12, shotgun: 8, rocket: 4 });
      setPlayerHealth(100);
      setPlayerShield(50);

      // Initial Roblox bot enemies
      const initialBots: LivePlayer[] = [
        {
          id: 'bot_hyper_1',
          name: 'NeonStriker_99',
          username: 'neon_pro',
          score: 180,
          health: 100,
          kills: 4,
          x: -12,
          y: 0,
          z: 16,
          yaw: 0.8,
          color: '#38bdf8',
          isBot: true,
        },
        {
          id: 'bot_hyper_2',
          name: 'Robloxian_Boss',
          username: 'roblox_king',
          score: 240,
          health: 100,
          kills: 6,
          x: 14,
          y: 0,
          z: 22,
          yaw: -0.6,
          color: '#ec4899',
          isBot: true,
        },
        {
          id: 'bot_hyper_3',
          name: 'CyberNinja_UZ',
          username: 'cyber_ninja',
          score: 120,
          health: 100,
          kills: 2,
          x: 0,
          y: 0,
          z: 32,
          yaw: 3.14,
          color: '#10b981',
          isBot: true,
        },
        {
          id: 'bot_hyper_4',
          name: 'HyperSniper_7',
          username: 'quick_snipe',
          score: 195,
          health: 100,
          kills: 5,
          x: -15,
          y: 8.5,
          z: 20,
          yaw: 1.4,
          color: '#f59e0b',
          isBot: true,
        },
      ];
      setLivePlayers(initialBots);

      onUpdateUser({
        ...currentUser,
        totalScore: data.userTotalScore !== undefined ? data.userTotalScore : currentUser.totalScore,
      });

      // Pointer lock on canvas
      setTimeout(() => {
        const canvas = mountRef.current?.querySelector('canvas');
        if (canvas) {
          canvas.requestPointerLock?.();
        }
      }, 150);
    } catch (err: any) {
      setErrorMsg(err.message || 'Ball yetarli emas (kamida 50 ball kerak)');
    }
  };

  // Pointer lock change listener
  useEffect(() => {
    const handleLockChange = () => {
      setIsPointerLocked(Boolean(document.pointerLockElement));
    };
    document.addEventListener('pointerlockchange', handleLockChange);
    return () => document.removeEventListener('pointerlockchange', handleLockChange);
  }, []);

  return (
    <div className="space-y-6">
      {/* Mode Switcher Tabs */}
      <div className="p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 max-w-md mx-auto">
        <button
          type="button"
          onClick={() => setActiveMode('kiteshot')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeMode === 'kiteshot'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Swords className="w-4 h-4" />
          <span>ROBLOX HYPERSHOT 3D</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveMode('iq_memory');
            setInGame(false);
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeMode === 'iq_memory'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>3D XOTIRA & IQ MATRIX</span>
        </button>
      </div>

      {activeMode === 'kiteshot' && (
        <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl min-h-[600px] flex flex-col justify-between select-none">
          {/* Top Bar Header */}
          <div className="p-4 sm:px-6 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between gap-4 z-20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-400 flex items-center justify-center font-black">
                <Swords className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <span>KITESHOT HYPERSHOT 3D</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    ROBLOX MOVEMENT ARENA
                  </span>
                </h2>
                <div className="text-xs text-slate-400">
                  {currentUser ? (
                    <span>
                      O'yinchi: <strong className="text-blue-300">@{currentUser.username}</strong> |
                      Balingiz: <strong className="text-amber-300">{currentUser.totalScore} ball</strong>
                    </span>
                  ) : (
                    <span>O'ynash uchun tizimga kiring (har bir o'yin 50 ball)</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 cursor-pointer"
                title={isMuted ? 'Ovozni yoqish' : "Ovozni o'chirish"}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 3D WebGL Canvas Container */}
          <div
            ref={mountRef}
            onClick={() => {
              if (inGame) {
                mountRef.current?.querySelector('canvas')?.requestPointerLock?.();
              }
            }}
            className="relative w-full h-[620px] bg-slate-950 flex-1 overflow-hidden cursor-crosshair"
          >
            {/* LOBBY / PRE-GAME OVERLAY */}
            {!inGame && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center bg-radial from-slate-900/90 to-slate-950/95 backdrop-blur-sm">
                <div className="w-20 h-20 rounded-3xl bg-blue-500/20 border-2 border-blue-400/50 flex items-center justify-center text-blue-400 mb-4 shadow-[0_0_50px_rgba(56,189,248,0.3)] animate-pulse">
                  <Swords className="w-10 h-10" />
                </div>
                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  ROBLOX HYPERSHOT ARENA
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md mt-2">
                  Haqiqiy Roblox Hypershot o'yini: <strong>Hyper Slide</strong>, <strong>Bhop Sakrash</strong>,{' '}
                  <strong>Devordan Tepish</strong>, <strong>Grapple Hook</strong> va 3 xil lazer qurollari!
                </p>

                {errorMsg && (
                  <div className="mt-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs font-semibold">
                    {errorMsg}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                  <button
                    type="button"
                    onClick={handleStartGame}
                    className="py-3 px-8 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm sm:text-base flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>ARENAGA KIRISH (50 Ball)</span>
                  </button>
                </div>

                <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-400 max-w-xl text-left">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <strong className="text-white block">WASD</strong> Yugurish & Harakat
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <strong className="text-sky-400 block">Shift / C</strong> Hyper Slide
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <strong className="text-emerald-400 block">Space</strong> Bhop / Devordan Sakrash
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <strong className="text-pink-400 block">F / O'ng Tugma</strong> Grappling Hook
                  </div>
                </div>
              </div>
            )}

            {/* IN-GAME HUD OVERLAY */}
            {inGame && (
              <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-4 sm:p-6">
                {/* Top HUD: Score, Streak, Timer */}
                <div className="flex items-center justify-between gap-4">
                  {/* Left: Score & Kills */}
                  <div className="flex items-center gap-3 bg-slate-950/70 backdrop-blur-md p-2.5 px-4 rounded-2xl border border-slate-800">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-mono uppercase">Ochko</div>
                      <div className="text-base font-black text-white">{localScore}</div>
                    </div>
                    <div className="h-6 w-px bg-slate-800 mx-1" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-mono uppercase">Kills</div>
                      <div className="text-base font-black text-emerald-400">{killsCount}</div>
                    </div>
                  </div>

                  {/* Kill Streak Announcement Banner */}
                  <AnimatePresence>
                    {streakBanner && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.6, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.7, y: -10 }}
                        className="py-2 px-6 rounded-2xl bg-gradient-to-r from-red-600 via-pink-600 to-amber-500 text-white font-black text-lg sm:text-2xl shadow-[0_0_40px_rgba(236,72,153,0.6)] animate-bounce"
                      >
                        🔥 {streakBanner}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Right: Timer & Kill Feed */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2 bg-slate-950/70 backdrop-blur-md p-2 px-4 rounded-2xl border border-slate-800 font-mono font-bold text-sm text-sky-300">
                      <Timer className="w-4 h-4 text-sky-400 animate-spin" />
                      <span>
                        {String(Math.floor(sessionTimeLeft / 60)).padStart(2, '0')}:
                        {String(sessionTimeLeft % 60).padStart(2, '0')}
                      </span>
                    </div>

                    {/* Kill Feed */}
                    <div className="space-y-1">
                      {killFeed.map((kf, idx) => (
                        <div
                          key={`kf_${idx}`}
                          className="text-[11px] font-mono font-bold py-1 px-3 rounded-lg bg-black/60 border border-slate-800 text-white"
                        >
                          ⚔️ {kf}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Center Dynamic Crosshair with Hitmarker */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative flex items-center justify-center">
                    {/* Crosshair dot & lines */}
                    <div
                      className={`w-2 h-2 rounded-full transition-transform ${
                        isSliding ? 'scale-150 bg-sky-400' : 'bg-white'
                      }`}
                    />
                    <div className="absolute w-6 h-0.5 bg-white/70 -left-8" />
                    <div className="absolute w-6 h-0.5 bg-white/70 -right-8" />
                    <div className="absolute h-6 w-0.5 bg-white/70 -top-8" />
                    <div className="absolute h-6 w-0.5 bg-white/70 -bottom-8" />

                    {/* Hitmarker "X" ticks */}
                    {hitmarkerVisible && (
                      <div className="absolute w-8 h-8 flex items-center justify-center animate-ping">
                        <div
                          className={`w-7 h-7 border-2 rotate-45 ${
                            isCriticalHit ? 'border-red-500 scale-125' : 'border-white'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Floating Damage Numbers */}
                {damagePopups.map((dmg) => (
                  <motion.div
                    key={dmg.id}
                    initial={{ opacity: 1, y: 0, scale: 1 }}
                    animate={{ opacity: 0, y: -45, scale: 1.25 }}
                    transition={{ duration: 0.85 }}
                    style={{ left: dmg.x, top: dmg.y }}
                    className={`absolute font-black pointer-events-none ${
                      dmg.isCrit
                        ? 'text-red-500 text-lg drop-shadow-[0_2px_10px_rgba(239,68,68,0.8)]'
                        : 'text-amber-300 text-sm drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]'
                    }`}
                  >
                    {dmg.text}
                  </motion.div>
                ))}

                {/* Pointer Lock Hint */}
                {!isPointerLocked && (
                  <div className="self-center py-2 px-5 rounded-2xl bg-black/80 backdrop-blur-md border border-slate-700 text-white text-xs font-bold pointer-events-auto cursor-pointer animate-pulse">
                    🖱️ Ekranga bosing — Sichqoncha orqali nishonga olish faollashadi (ESC chiqish)
                  </div>
                )}

                {/* Bottom HUD: Speedometer, Weapons, Health, Ammo */}
                <div className="flex flex-wrap items-end justify-between gap-4">
                  {/* Left: Speedometer & Movement Status */}
                  <div className="space-y-2">
                    <div className="p-3 px-4 rounded-2xl bg-slate-950/80 backdrop-blur-md border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-mono uppercase">Tezlik</div>
                      <div
                        className={`text-xl sm:text-2xl font-black font-mono ${
                          currentSpeedDisplay > 55
                            ? 'text-cyan-400 animate-pulse'
                            : currentSpeedDisplay > 30
                            ? 'text-emerald-400'
                            : 'text-white'
                        }`}
                      >
                        SPEED: {currentSpeedDisplay} U/S
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] font-bold">
                        {isSliding && <span className="text-cyan-300 animate-bounce">⚡ HYPER SLIDE</span>}
                        {isGrappling && <span className="text-pink-300 animate-pulse">🪝 GRAPPLING</span>}
                        {dashCooldown > 0 ? (
                          <span className="text-slate-500">Dash: {dashCooldown}s</span>
                        ) : (
                          <span className="text-emerald-400">Dash: TAYYOR (Q)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Center: Weapons Selector (1: Railgun | 2: Shotgun | 3: Rocket) */}
                  <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md p-2 rounded-2xl border border-slate-800 pointer-events-auto">
                    {(Object.keys(WEAPONS) as WeaponType[]).map((wKey, idx) => {
                      const wpn = WEAPONS[wKey];
                      const isCur = currentWeapon === wKey;
                      return (
                        <button
                          key={wKey}
                          type="button"
                          onClick={() => setCurrentWeapon(wKey)}
                          className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                            isCur
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                              : 'bg-slate-900 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span className="text-[10px] font-mono opacity-60">[{idx + 1}]</span>
                          <span>{wpn.name}</span>
                          <span className="font-mono text-[11px] text-amber-300">
                            ({ammo[wKey]})
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Right: Health & Reload Button */}
                  <div className="flex items-center gap-3 bg-slate-950/80 backdrop-blur-md p-3 px-5 rounded-2xl border border-slate-800">
                    <div>
                      <div className="text-[10px] text-slate-400 font-mono uppercase">Jon (HP)</div>
                      <div className="text-xl font-black text-emerald-400">{playerHealth} / 100</div>
                    </div>
                    <div className="h-8 w-px bg-slate-800" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-mono uppercase">O'q (Ammo)</div>
                      <div className="text-xl font-black text-white">
                        {ammo[currentWeapon]} / {WEAPONS[currentWeapon].magSize}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isReloading}
                      onClick={handleReload}
                      className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 pointer-events-auto cursor-pointer"
                    >
                      {isReloading ? 'Zaryad...' : 'Zaryadlash (R)'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode 2: 3D XOTIRA VA IQ MATRIX */}
      {activeMode === 'iq_memory' && (
        <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                3D Xotira va IQ Matritsa
              </h3>
              <p className="text-xs text-slate-500">
                Fazoviy fikrlash va visual xotirani 3D formatda rivojlantirish mashqlari.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-center space-y-2">
              <div className="text-2xl font-black text-purple-600 dark:text-purple-400">120+</div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">IQ Darajasi</div>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-center space-y-2">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">98%</div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Aniqlik</div>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-center space-y-2">
              <div className="text-2xl font-black text-sky-600 dark:text-sky-400">Top 5%</div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Reyting</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

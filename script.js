let THREE = null;
const THREE_CDN = "https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js";

/* ==================================================================
   EASY CUSTOMIZATION — edit this object to change the whole festival
   ================================================================== */
const FESTIVAL = {
  title: "Happy Mid-Autumn Festival",
  subtitle: "Đêm hội trăng rằm",
  music: "audio/mid-autumn.mp3",
  particleCount: 900, // mobile automatically uses fewer
  lanternCount: 15,
  moonSize: 3.15,
  orbitSpeed: 0.075,
  galleryRadius: 7.1,
  colors: { gold: 0xf5c85c, red: 0xd93b36, night: 0x07061b, moon: 0xffefb5 },
  photos: [
    {
      src: "images/photo1.jpg",
      caption: "Lanterns by Hoàn Kiếm",
      detail: "A moonlit walk with đèn ông sao",
    },
    {
      src: "images/photo2.jpg",
      caption: "The Lion Wakes",
      detail: "Múa lân beneath the lantern light",
    },
    {
      src: "images/photo3.jpg",
      caption: "A Taste of Reunion",
      detail: "Mooncakes, lotus tea, and family stories",
    },
    {
      src: "images/photo4.jpg",
      caption: "River of Lanterns",
      detail: "Hội An glowing beneath the full moon",
    },
    {
      src: "images/photo5.jpg",
      caption: "Keeping the Light",
      detail: "The delicate craft of a star lantern",
    },
    {
      src: "images/photo6.jpg",
      caption: "Procession of Wonder",
      detail: "A dragon dances through the temple night",
    },
  ],
};

const $ = (selector) => document.querySelector(selector);
const hero = $("#hero");
const world = $("#festival-world");
const enterButton = $("#enter-button");
const heroMoon = $("#hero-moon");
const skyCanvas = $("#sky-canvas");
const ctx = skyCanvas.getContext("2d");
const soundButton = $("#sound-button");
const audio = $("#festival-audio");
const flash = $("#flash");
const viewer = $("#viewer");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const motion = () => window.gsap;

function runEnterFallback() {
  world.style.visibility = "visible";
  world.style.opacity = "1";
  world.setAttribute("aria-hidden", "false");
  hero.style.visibility = "hidden";

  initThreeWorld().catch((error) => {
    console.error("Three.js world could not be initialized:", error);
    showWorldFallback();
  });
}

function showWorldFallback() {
  const stage = $("#three-stage");
  if (!stage) return;

  stage.innerHTML = `
    <div style="
      display:grid;
      place-items:center;
      height:100%;
      padding:2rem;
      text-align:center;
      color:#fff8de;
    ">
      <div>
        <h2 style="font:500 2.5rem var(--display);margin:0 0 .6rem">
          Đêm Hội Trăng Rằm
        </h2>
        <p style="margin:0;color:rgba(255,248,222,.72)">
          Bạn đã bước vào lễ hội. Phần 3D không thể tải lúc này.
        </p>
      </div>
    </div>
  `;
}

const mobile =
  matchMedia("(max-width: 700px)").matches ||
  matchMedia("(pointer: coarse)").matches;

let entered = false;
let viewerIndex = 0;
let pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
let bursts = [];
let fireworks = [];
let sparkles = [];

// Apply editable copy and media configuration.
$("#festival-title").textContent = FESTIVAL.title;
$(".subtitle").textContent = FESTIVAL.subtitle;
audio.querySelector("source").src = FESTIVAL.music;

function resizeSky() {
  const dpr = Math.min(devicePixelRatio || 1, mobile ? 1.25 : 1.75);

  skyCanvas.width = innerWidth * dpr;
  skyCanvas.height = innerHeight * dpr;

  skyCanvas.style.width = `${innerWidth}px`;
  skyCanvas.style.height = `${innerHeight}px`;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function seededRandom(seed) {
  const x = Math.sin(seed * 921.73) * 43758.5453;
  return x - Math.floor(x);
}

function createSky() {
  const count = mobile ? 135 : 300;

  sparkles = Array.from({ length: count }, (_, i) => ({
    x: seededRandom(i + 1) * innerWidth,
    y: seededRandom(i + 101) * innerHeight * 0.78,
    r: seededRandom(i + 220) * 1.35 + 0.18,
    a: seededRandom(i + 330) * 0.7 + 0.2,
    phase: seededRandom(i + 550) * Math.PI * 2,
    speed: seededRandom(i + 710) * 0.8 + 0.25,
    gold: i % 8 === 0,
  }));
}

function firework(
  x = innerWidth * (0.2 + Math.random() * 0.6),
  y = innerHeight * (0.12 + Math.random() * 0.35),
) {
  const palette = ["#f7cb66", "#dc4b43", "#f29a52", "#c987df"];
  const color = palette[Math.floor(Math.random() * palette.length)];

  for (let i = 0; i < (mobile ? 18 : 34); i++) {
    const a = (Math.PI * 2 * i) / (mobile ? 18 : 34);
    const speed = 28 + Math.random() * 45;

    fireworks.push({
      x,
      y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      life: 1,
      color,
    });
  }
}

function particleBurst(x, y, amount = 55) {
  for (let i = 0; i < (mobile ? amount * 0.55 : amount); i++) {
    const a = Math.random() * Math.PI * 2;
    const speed = 45 + Math.random() * 190;

    bursts.push({
      x,
      y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      life: 1,
      size: 1 + Math.random() * 3,
    });
  }
}

function drawSky(time) {
  ctx.clearRect(0, 0, innerWidth, innerHeight);

  pointer.x += (pointer.targetX - pointer.x) * 0.035;
  pointer.y += (pointer.targetY - pointer.y) * 0.035;

  sparkles.forEach((s) => {
    const a =
      s.a *
      (0.5 + 0.5 * Math.sin(time * 0.001 * s.speed + s.phase));

    ctx.fillStyle = s.gold
      ? `rgba(255,205,99,${a})`
      : `rgba(225,230,255,${a})`;

    ctx.beginPath();

    ctx.arc(
      s.x + pointer.x * (s.r * 2),
      s.y + pointer.y * (s.r * 1.3),
      s.r,
      0,
      Math.PI * 2,
    );

    ctx.fill();
  });

  [bursts, fireworks].forEach((collection, group) => {
    for (let i = collection.length - 1; i >= 0; i--) {
      const p = collection[i];
      const dt = 1 / 60;

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      p.vy += group ? 15 * dt : 25 * dt;

      p.vx *= 0.987;
      p.vy *= 0.987;

      p.life -= group ? 0.012 : 0.019;

      ctx.fillStyle = group
        ? p.color.replace(")", "")
        : `rgba(255,207,99,${p.life})`;

      ctx.globalAlpha = Math.max(0, p.life);

      ctx.beginPath();
      ctx.arc(
        p.x,
        p.y,
        group ? 1.25 : p.size,
        0,
        Math.PI * 2,
      );
      ctx.fill();

      ctx.globalAlpha = 1;

      if (p.life <= 0) {
        collection.splice(i, 1);
      }
    }
  });

  requestAnimationFrame(drawSky);
}

function buildHeroLanterns() {
  const layer = $("#hero-lanterns");

  for (let i = 0; i < FESTIVAL.lanternCount; i++) {
    const el = document.createElement("span");

    el.className = "lantern";

    const side =
      i % 2
        ? 5 + Math.random() * 19
        : 76 + Math.random() * 19;

    el.style.cssText = `
      left:${side}%;
      top:${8 + Math.random() * 70}%;
      scale:${0.45 + Math.random() * 0.75};
      --speed:${3 + Math.random() * 4}s;
      animation-delay:${-Math.random() * 5}s;
      opacity:${0.45 + Math.random() * 0.55}
    `;

    layer.append(el);
  }
}

function moonMagic(event) {
  const rect = event.currentTarget.getBoundingClientRect();

  particleBurst(
    rect.left + rect.width / 2,
    rect.top + rect.height / 2,
    85,
  );

  firework(
    rect.left + rect.width / 2,
    rect.top + rect.height / 2,
  );

  const gsap = motion();

  if (!gsap) return;

  gsap.fromTo(
    event.currentTarget,
    { filter: "brightness(1)" },
    {
      filter: "brightness(1.75)",
      scale: 1.07,
      duration: 0.45,
      yoyo: true,
      repeat: 1,
      ease: "power2.out",
    },
  );

  document.querySelectorAll(".cloud").forEach((c, i) =>
    gsap.to(c, {
      x: i % 2 ? 180 : -180,
      opacity: 0.08,
      duration: 1.8,
      ease: "power2.out",
    }),
  );
}
function enterFestival() {
  if (entered) return;

  entered = true;

  const moonRect = heroMoon.getBoundingClientRect();

  particleBurst(
    moonRect.left + moonRect.width / 2,
    moonRect.top + moonRect.height / 2,
    130,
  );

  const gsap = motion();

  if (!gsap) {
    runEnterFallback();

    audio
      .play()
      .then(updateAudioState)
      .catch(() => updateAudioState());

    return;
  }

  gsap
    .timeline({ defaults: { ease: "power3.inOut" } })

    .to(".hero-content", {
      opacity: 0,
      scale: 0.88,
      filter: "blur(10px)",
      duration: 0.7,
    })

    .to(
      heroMoon,
      {
        scale: 5.6,
        filter: "brightness(2.3)",
        duration: 1.35,
      },
      "-=.35",
    )

    .to(
      flash,
      {
        opacity: 1,
        duration: 0.32,
      },
      "-=.42",
    )

    .set(world, {
      visibility: "visible",
      opacity: 1,
      attr: {
        "aria-hidden": "false",
      },
    })

    .set(hero, {
      visibility: "hidden",
    })

    .add(() => {
      initThreeWorld().catch((error) => {
        console.error("Three.js init failed:", error);
        showWorldFallback();
      });
    })

    .to(flash, {
      opacity: 0,
      duration: 1.25,
      ease: "power2.out",
    })

    .fromTo(
      ".world-header",
      {
        y: -25,
        opacity: 0,
      },
      {
        y: 0,
        opacity: 1,
        duration: 0.9,
      },
      "-=.8",
    )

    .to(
      "#caption-card",
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
      },
      "-=.55",
    );

  audio
    .play()
    .then(updateAudioState)
    .catch(() => updateAudioState());
}

function updateAudioState() {
  const playing = !audio.paused && !audio.muted;

  soundButton.classList.toggle("playing", playing);

  soundButton.querySelector(".sound-state").textContent =
    playing ? "SOUND ON" : "SOUND OFF";

  soundButton.setAttribute(
    "aria-label",
    playing
      ? "Pause festival music"
      : "Play festival music",
  );
}

soundButton.addEventListener("click", () => {
  if (audio.paused) {
    audio.play().catch(() => {});
  } else {
    audio.pause();
  }

  updateAudioState();
});

audio.addEventListener("play", updateAudioState);
audio.addEventListener("pause", updateAudioState);

let renderer,
  scene,
  camera,
  galleryGroup,
  clock,
  raycaster,
  worldMoon,
  hoveredCard = null,
  dragStart = null,
  manualRotation = 0;

const cards = [];

function createGlowTexture() {
  const c = document.createElement("canvas");

  c.width = c.height = 256;

  const x = c.getContext("2d");

  const g = x.createRadialGradient(
    128,
    128,
    0,
    128,
    128,
    128,
  );

  g.addColorStop(
    0,
    "rgba(255,248,196,1)",
  );

  g.addColorStop(
    0.25,
    "rgba(255,203,92,.55)",
  );

  g.addColorStop(
    1,
    "rgba(255,170,60,0)",
  );

  x.fillStyle = g;
  x.fillRect(0, 0, 256, 256);

  return new THREE.CanvasTexture(c);
}

function createStarTexture() {
  const c = document.createElement("canvas");

  c.width = c.height = 256;

  const x = c.getContext("2d");

  x.translate(128, 128);

  x.fillStyle = "#db3a35";
  x.strokeStyle = "#ffd36b";
  x.lineWidth = 8;

  x.beginPath();

  for (let i = 0; i < 10; i++) {
    const a =
      -Math.PI / 2 +
      (i * Math.PI) / 5;

    const r =
      i % 2
        ? 48
        : 105;

    x.lineTo(
      Math.cos(a) * r,
      Math.sin(a) * r,
    );
  }

  x.closePath();
  x.fill();
  x.stroke();

  x.fillStyle = "rgba(255,223,126,.62)";
  x.fill();

  return new THREE.CanvasTexture(c);
}

function makePhotoCard(item, index, texture) {
  const group = new THREE.Group();

  group.userData = {
    index,
    item,
    baseScale: 1,
  };

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(
      3.15,
      2.35,
      0.12,
    ),

    new THREE.MeshStandardMaterial({
      color: 0x7b1f2b,
      metalness: 0.55,
      roughness: 0.35,
      emissive: 0x4e121b,
      emissiveIntensity: 0.45,
    }),
  );

  const image = new THREE.Mesh(
    new THREE.PlaneGeometry(
      2.91,
      2.11,
    ),

    new THREE.MeshBasicMaterial({
      map: texture,
      toneMapped: false,
    }),
  );

  image.position.z = 0.071;
  image.userData = group.userData;

  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(
      3.4,
      2.6,
    ),

    new THREE.MeshBasicMaterial({
      color: FESTIVAL.colors.gold,
      transparent: true,
      opacity: 0.07,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );

  glow.position.z = -0.08;

  group.add(
    glow,
    frame,
    image,
  );

  group.userData.image = image;
  group.userData.glow = glow;

  return group;
}

function makeLantern3D(i) {
  const g = new THREE.Group();

  const color =
    i % 3 === 0
      ? 0xff9d42
      : i % 3 === 1
        ? 0xdc3435
        : 0xf3c75b;

  const body = new THREE.Mesh(
    new THREE.SphereGeometry(
      0.22,
      10,
      8,
    ),

    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 1.3,
      roughness: 0.55,
    }),
  );

  body.scale.y = 1.35;

  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.12,
      0.12,
      0.05,
      8,
    ),

    new THREE.MeshStandardMaterial({
      color: 0xd7a546,
      metalness: 0.7,
    }),
  );

  top.position.y = 0.32;

  const tail = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.012,
      0.012,
      0.45,
      5,
    ),

    new THREE.MeshBasicMaterial({
      color: 0xffcc61,
    }),
  );

  tail.position.y = -0.53;

  g.add(
    body,
    top,
    tail,
  );

  const a =
    (i / 18) * Math.PI * 2;

  const r =
    4.7 +
    (i % 4) * 1.55;

  g.position.set(
    Math.cos(a) * r,
    ((i % 5) - 2) * 1.25 +
      Math.sin(i) * 0.3,
    Math.sin(a) * r - 1.5,
  );

  g.userData = {
    phase: i * 0.71,
    speed: 0.5 + (i % 4) * 0.11,
  };

  return g;
}
async function initThreeWorld() {
  if (renderer) return;

  const stage = $("#three-stage");

  // Load Three.js only when the user enters the festival.
  // This prevents a broken local vendor file from blocking the entire page.
  if (!THREE) {
    try {
      THREE = await import(THREE_CDN);
    } catch (error) {
      console.error(
        "Failed to load Three.js:",
        error,
      );

      showWorldFallback();
      return;
    }
  }

  scene = new THREE.Scene();

  scene.background = new THREE.Color(
    FESTIVAL.colors.night,
  );

  scene.fog = new THREE.FogExp2(
    FESTIVAL.colors.night,
    0.035,
  );

  camera = new THREE.PerspectiveCamera(
    mobile ? 58 : 48,
    innerWidth / innerHeight,
    0.1,
    100,
  );

  camera.position.set(
    0,
    mobile ? 0.3 : 0.8,
    mobile ? 14.5 : 15.5,
  );

  renderer = new THREE.WebGLRenderer({
    antialias: !mobile,
    alpha: false,
    powerPreference: "high-performance",
  });

  renderer.setPixelRatio(
    Math.min(
      devicePixelRatio,
      mobile ? 1.25 : 1.8,
    ),
  );

  renderer.setSize(
    innerWidth,
    innerHeight,
  );

  renderer.outputColorSpace =
    THREE.SRGBColorSpace;

  renderer.toneMapping =
    THREE.ACESFilmicToneMapping;

  renderer.toneMappingExposure = 1.12;

  stage.append(
    renderer.domElement,
  );

  scene.add(
    new THREE.AmbientLight(
      0x383667,
      1.35,
    ),
  );

  const moonLight =
    new THREE.PointLight(
      FESTIVAL.colors.moon,
      65,
      38,
      1.8,
    );

  moonLight.position.set(
    0,
    1,
    -1,
  );

  scene.add(moonLight);

  galleryGroup =
    new THREE.Group();

  scene.add(galleryGroup);

  const glowTex =
    createGlowTexture();

  const halo =
    new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        color: FESTIVAL.colors.moon,
        transparent: true,
        blending:
          THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );

  halo.scale.set(
    10,
    10,
    1,
  );

  halo.position.set(
    0,
    0.6,
    -2.4,
  );

  scene.add(halo);

  worldMoon =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        FESTIVAL.moonSize,
        48,
        48,
      ),

      new THREE.MeshStandardMaterial({
        color: 0xffe7a6,
        emissive: 0xf2ad55,
        emissiveIntensity: 0.34,
        roughness: 0.85,
      }),
    );

  worldMoon.position.set(
    0,
    0.5,
    -2,
  );

  worldMoon.userData.moon = true;

  scene.add(worldMoon);

  const starsGeo =
    new THREE.BufferGeometry();

  const starCount =
    mobile
      ? 350
      : FESTIVAL.particleCount;

  const pos =
    new Float32Array(
      starCount * 3,
    );

  for (
    let i = 0;
    i < starCount;
    i++
  ) {
    const r =
      14 +
      Math.random() * 22;

    const a =
      Math.random() *
      Math.PI *
      2;

    const y =
      (Math.random() - 0.5) *
      20;

    pos.set(
      [
        Math.cos(a) * r,
        y,
        Math.sin(a) * r - 8,
      ],
      i * 3,
    );
  }

  starsGeo.setAttribute(
    "position",
    new THREE.BufferAttribute(
      pos,
      3,
    ),
  );

  scene.add(
    new THREE.Points(
      starsGeo,

      new THREE.PointsMaterial({
        color: 0xffd483,
        size: mobile
          ? 0.045
          : 0.065,
        transparent: true,
        opacity: 0.82,
        sizeAttenuation: true,
      }),
    ),
  );

  const manager =
    new THREE.LoadingManager();

  const loader =
    new THREE.TextureLoader(
      manager,
    );

  FESTIVAL.photos.forEach(
    (item, index) => {
      loader.load(
        item.src,

        (texture) => {
          texture.colorSpace =
            THREE.SRGBColorSpace;

          texture.anisotropy =
            Math.min(
              renderer.capabilities.getMaxAnisotropy(),
              8,
            );

          const card =
            makePhotoCard(
              item,
              index,
              texture,
            );

          const angle =
            (index /
              FESTIVAL.photos.length) *
            Math.PI *
            2;

          card.position.set(
            Math.cos(angle) *
              FESTIVAL.galleryRadius,

            Math.sin(angle * 2) *
              1.7,

            Math.sin(angle) *
                FESTIVAL.galleryRadius -
              1,
          );

          card.rotation.y =
            -angle +
            Math.PI / 2;

          card.userData.angle =
            angle;

          galleryGroup.add(
            card,
          );

          cards[index] =
            card;
        },

        undefined,

        () => {},
      );
    },
  );

  const lanterns =
    new THREE.Group();

  for (
    let i = 0;
    i <
    (mobile ? 10 : 18);
    i++
  ) {
    lanterns.add(
      makeLantern3D(i),
    );
  }

  scene.add(lanterns);

  const starTex =
    createStarTexture();

  for (
    let i = 0;
    i < 4;
    i++
  ) {
    const s =
      new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: starTex,
          transparent: true,
          depthWrite: false,
        }),
      );

    const a =
      (i * Math.PI) / 2 +
      0.4;

    s.position.set(
      Math.cos(a) * 9,
      (i - 1.5) * 1.4,
      Math.sin(a) * 9 - 3,
    );

    s.scale.set(
      1.2,
      1.2,
      1,
    );

    scene.add(s);
  }

  raycaster =
    new THREE.Raycaster();

  clock =
    new THREE.Clock();

  renderer.domElement.addEventListener(
    "pointermove",
    onWorldPointer,
  );

  renderer.domElement.addEventListener(
    "pointerdown",
    (e) => {
      dragStart = {
        x: e.clientX,
        rot: manualRotation,
      };
    },
  );

  renderer.domElement.addEventListener(
    "pointerup",
    onWorldClick,
  );

  renderer.domElement.addEventListener(
    "pointerleave",
    () => {
      dragStart = null;
      hoverCard(null);
    },
  );

  animateWorld(
    lanterns,
    halo,
  );
}

function raycastCard(event) {
  const ndc =
    new THREE.Vector2(
      (event.clientX /
        innerWidth) *
        2 -
        1,

      (-event.clientY /
        innerHeight) *
        2 +
        1,
    );

  raycaster.setFromCamera(
    ndc,
    camera,
  );

  return raycaster.intersectObjects(
    cards.flatMap((c) =>
      c
        ? [
            c.userData.image,
            worldMoon,
          ]
        : [],
    ),
    false,
  )[0];
}

function hoverCard(card) {
  if (hoveredCard === card)
    return;

  if (hoveredCard) {
    hoveredCard.userData.hovered =
      false;

    document.body.style.cursor =
      "default";
  }

  hoveredCard = card;

  if (card) {
    card.userData.hovered =
      true;

    document.body.style.cursor =
      "pointer";

    const {
      index,
      item,
    } = card.userData;

    $("#caption-card>span").textContent =
      String(index + 1).padStart(
        2,
        "0",
      );

    $("#caption-card strong").textContent =
      item.caption;

    $("#caption-card small").textContent =
      item.detail.toUpperCase();
  }
}

function onWorldPointer(event) {
  pointer.targetX =
    (event.clientX /
      innerWidth) *
      2 -
    1;

  pointer.targetY =
    -(
      (event.clientY /
        innerHeight) *
        2 -
      1
    );

  if (dragStart) {
    manualRotation =
      dragStart.rot +
      (event.clientX -
        dragStart.x) *
        0.004;

    return;
  }

  const hit =
    raycastCard(event);

  hoverCard(
    hit &&
      !hit.object.userData.moon
      ? cards[
          hit.object.userData.index
        ]
      : null,
  );
}

function onWorldClick(event) {
  const wasDrag =
    dragStart &&
    Math.abs(
      event.clientX -
        dragStart.x,
    ) > 8;

  dragStart = null;

  if (wasDrag) return;

  const hit =
    raycastCard(event);

  if (!hit) return;

  if (
    hit.object.userData.moon
  ) {
    worldMoonMagic(event);
    return;
  }

  openViewer(
    hit.object.userData.index,
  );
}

function worldMoonMagic(event) {
  particleBurst(
    event.clientX,
    event.clientY,
    100,
  );

  firework(
    event.clientX,
    event.clientY,
  );

  const gsap = motion();

  if (!gsap) return;

  gsap.fromTo(
    flash,
    { opacity: 0.24 },
    {
      opacity: 0,
      duration: 1.1,
    },
  );

  gsap.fromTo(
    worldMoon.scale,

    {
      x: 1,
      y: 1,
      z: 1,
    },

    {
      x: 1.18,
      y: 1.18,
      z: 1.18,
      duration: 0.32,
      yoyo: true,
      repeat: 1,
      ease: "power2.out",
    },
  );

  cards.forEach(
    (c, i) => {
      if (c)
        window.gsap?.to(
          c.position,
          {
            y:
              c.position.y +
              (i % 2
                ? 0.55
                : -0.4),
            duration: 0.45,
            yoyo: true,
            repeat: 1,
            delay:
              i * 0.04,
          },
        );
    },
  );
}
function animateWorld(
  lanterns,
  halo,
) {
  const raw =
    clock.getDelta();

  const dt =
    Math.min(
      raw,
      0.05,
    );

  const t =
    clock.elapsedTime;

  const auto =
    reducedMotion
      ? 0
      : FESTIVAL.orbitSpeed;

  galleryGroup.rotation.y +=
    auto * dt;

  galleryGroup.rotation.y +=
    (
      manualRotation -
      galleryGroup.rotation.y
    ) *
    Math.min(
      1,
      dt * 2.2,
    );

  galleryGroup.rotation.x +=
    (
      pointer.y * 0.045 -
      galleryGroup.rotation.x
    ) *
    Math.min(
      1,
      dt * 2,
    );

  camera.position.x +=
    (
      pointer.x *
        (mobile
          ? 0.35
          : 0.85) -
      camera.position.x
    ) *
    Math.min(
      1,
      dt * 1.8,
    );

  camera.position.y +=
    (
      (
        mobile
          ? 0.3
          : 0.8
      ) +
      pointer.y * 0.45 -
      camera.position.y
    ) *
    Math.min(
      1,
      dt * 1.8,
    );

  camera.lookAt(
    0,
    0.3,
    -1.4,
  );

  cards.forEach(
    (card, i) => {
      if (!card) return;

      const target =
        card.userData.hovered
          ? 1.18
          : 1;

      card.scale.lerp(
        new THREE.Vector3(
          target,
          target,
          target,
        ),
        1 -
          Math.exp(
            -6 * dt,
          ),
      );

      card.position.y +=
        Math.sin(
          t * 0.75 + i,
        ) *
        0.0025;

      card.userData.glow.material.opacity +=
        (
          card.userData.hovered
            ? 0.28
            : 0.07 -
              card.userData.glow
                .material
                .opacity
        ) *
        Math.min(
          1,
          dt * 5,
        );

      card.position.z +=
        (
          (
            card.userData
              .hovered
              ? 1.05
              : 0
          ) -
          card.userData.image
            .position.z *
            0.0
        ) *
        0;
    },
  );

  lanterns.children.forEach(
    (l, i) => {
      l.position.y +=
        Math.sin(
          t *
            l.userData
              .speed +
            l.userData.phase,
        ) *
        0.002;

      l.rotation.z =
        Math.sin(
          t * 0.8 + i,
        ) *
        0.08;
    },
  );

  halo.material.opacity =
    0.78 +
    Math.sin(
      t * 0.7,
    ) *
      0.12;

  worldMoon.rotation.y +=
    dt * 0.025;

  renderer.render(
    scene,
    camera,
  );

  requestAnimationFrame(
    () =>
      animateWorld(
        lanterns,
        halo,
      ),
  );
}

function openViewer(index) {
  viewerIndex = index;

  renderViewer();

  viewer.hidden = false;

  const gsap = motion();

  if (!gsap) {
    viewer.style.opacity = "1";
    return;
  }

  gsap.fromTo(
    viewer,
    { opacity: 0 },
    {
      opacity: 1,
      duration: 0.35,
    },
  );

  gsap.fromTo(
    "#viewer figure",

    {
      scale: 0.88,
      y: 20,
      opacity: 0,
    },

    {
      scale: 1,
      y: 0,
      opacity: 1,
      duration: 0.55,
      ease: "power3.out",
    },
  );
}

function closeViewer() {
  const gsap = motion();

  if (!gsap) {
    viewer.hidden = true;
    return;
  }

  gsap.to(
    viewer,
    {
      opacity: 0,
      duration: 0.25,

      onComplete: () => {
        viewer.hidden = true;
      },
    },
  );
}

function renderViewer() {
  const item =
    FESTIVAL.photos[
      viewerIndex
    ];

  $("#viewer-image").src =
    item.src;

  $("#viewer-image").alt =
    item.caption;

  $("#viewer-index").textContent =
    String(
      viewerIndex + 1,
    ).padStart(
      2,
      "0",
    );

  $("#viewer-caption").textContent =
    item.caption;
}

function stepViewer(dir) {
  viewerIndex =
    (
      viewerIndex +
      dir +
      FESTIVAL.photos.length
    ) %
    FESTIVAL.photos.length;

  const gsap = motion();

  if (!gsap) {
    renderViewer();
    return;
  }

  gsap.to(
    "#viewer figure",
    {
      opacity: 0,
      scale: 0.96,
      duration: 0.18,

      onComplete: () => {
        renderViewer();

        gsap.to(
          "#viewer figure",
          {
            opacity: 1,
            scale: 1,
            duration: 0.28,
          },
        );
      },
    },
  );
}

$("#viewer-close").addEventListener(
  "click",
  closeViewer,
);

$("#viewer-prev").addEventListener(
  "click",
  () =>
    stepViewer(-1),
);

$("#viewer-next").addEventListener(
  "click",
  () =>
    stepViewer(1),
);

viewer.addEventListener(
  "click",
  (e) => {
    if (e.target === viewer)
      closeViewer();
  },
);

addEventListener(
  "keydown",
  (e) => {
    if (viewer.hidden)
      return;

    if (e.key === "Escape")
      closeViewer();

    if (
      e.key === "ArrowLeft"
    )
      stepViewer(-1);

    if (
      e.key === "ArrowRight"
    )
      stepViewer(1);
  },
);

addEventListener(
  "pointermove",
  (e) => {
    pointer.targetX =
      (e.clientX /
        innerWidth) *
        2 -
      1;

    pointer.targetY =
      -(
        (e.clientY /
          innerHeight) *
          2 -
        1
      );

    if (!entered) {
      document.documentElement.style.setProperty(
        "--px",
        pointer.targetX,
      );

      window.gsap?.to(
        ".hero-moon",
        {
          marginLeft:
            pointer.targetX *
            13,

          marginTop:
            -pointer.targetY *
            8,

          duration: 1.5,
          overwrite: true,
        },
      );
    }
  },
);

addEventListener(
  "resize",
  () => {
    resizeSky();

    createSky();

    if (renderer) {
      camera.aspect =
        innerWidth /
        innerHeight;

      camera.updateProjectionMatrix();

      renderer.setSize(
        innerWidth,
        innerHeight,
      );
    }
  },
);

enterButton.addEventListener(
  "click",
  enterFestival,
);

heroMoon.addEventListener(
  "click",
  moonMagic,
);

resizeSky();
createSky();
buildHeroLanterns();

requestAnimationFrame(
  drawSky,
);

window.gsap
  ?.timeline()
  .from(
    ".eyebrow",
    {
      y: 12,
      opacity: 0,
      duration: 0.8,
    },
    0.2,
  )
  .from(
    "h1",
    {
      y: 28,
      opacity: 0,
      filter: "blur(8px)",
      duration: 1.1,
    },
    "-=.55",
  )
  .from(
    ".subtitle",
    {
      y: 12,
      opacity: 0,
      duration: 0.8,
    },
    "-=.6",
  );

setInterval(
  () => {
    if (
      !document.hidden &&
      Math.random() > 0.35
    ) {
      firework();
    }
  },
  mobile
    ? 7200
    : 4700,
);
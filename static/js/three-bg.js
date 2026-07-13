/**
 * EcoSort AI — Ultra-Cinematic WebGL Engine v8.0
 * "Awwwards / Apple Vision Pro level" background
 *
 * Narrative scroll journey:
 *  0–20%   : Vast starfield → AI Core reveals from fog
 *  20–45%  : Waste objects float in, neural network pulses
 *  45–65%  : AI scans each item, energy tunnels light up
 *  65–85%  : Waste sorts into glowing smart bins
 *  85–100% : Holographic Earth rises — final reveal
 */

(function () {
  'use strict';
  if (typeof THREE === 'undefined') return;

  /* ───────────────────────────────────────────
     UTILS
  ─────────────────────────────────────────── */
  const lerp  = (a, b, t) => a + (b - a) * t;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const mapRange = (v, a, b, c, d) => c + ((v - a) / (b - a)) * (d - c);
  const isMobile = /Mobi|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
  const DPR = isMobile ? Math.min(window.devicePixelRatio, 2)
                       : Math.min(window.devicePixelRatio, 3.5);

  /* ───────────────────────────────────────────
     CANVAS + RENDERER
  ─────────────────────────────────────────── */
  const container = document.querySelector('.bg-container') || document.body;
  let canvas = document.getElementById('three-bg-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'three-bg-canvas';
    Object.assign(canvas.style, {
      position: 'absolute', inset: '0', width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: '1'
    });
    container.insertBefore(canvas, container.firstChild);
  }

  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: true,
    powerPreference: 'high-performance', precision: 'highp'
  });
  renderer.setPixelRatio(DPR);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping        = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = false;

  /* ───────────────────────────────────────────
     SCENE + CAMERA
  ─────────────────────────────────────────── */
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x010306, 0.0016);

  const camera = new THREE.PerspectiveCamera(
    55, window.innerWidth / window.innerHeight, 0.1, 2000
  );
  camera.position.set(0, 10, 90);

  /* ───────────────────────────────────────────
     LIGHTS
  ─────────────────────────────────────────── */
  scene.add(new THREE.AmbientLight(0x050d20, 2.5));

  const cyanPt = new THREE.PointLight(0x00f0ff, 5.0, 200);
  cyanPt.position.set(-30, 18, 10);
  scene.add(cyanPt);

  const greenPt = new THREE.PointLight(0x00ff88, 4.0, 200);
  greenPt.position.set(30, -15, 25);
  scene.add(greenPt);

  const purplePt = new THREE.PointLight(0x8844ff, 3.5, 150);
  purplePt.position.set(0, 30, -30);
  scene.add(purplePt);

  const goldPt = new THREE.PointLight(0xffd700, 2.0, 120);
  goldPt.position.set(20, 5, 60);
  scene.add(goldPt);

  /* ═══════════════════════════════════════════
     1. STAR FIELD — 25 000 particles
  ═══════════════════════════════════════════ */
  const STARS = isMobile ? 8000 : 25000;
  const _starUniforms = { uTime: { value: 0 } };

  (function buildStars() {
    const pos = new Float32Array(STARS * 3);
    const col = new Float32Array(STARS * 3);
    const sz  = new Float32Array(STARS);
    const rnd = new Float32Array(STARS);
    const palette = [
      [0, 0.94, 1], [0, 1, 0.53], [0.53, 0.27, 1],
      [1, 0.85, 0], [1, 1, 1], [0.4, 0.7, 1]
    ];
    for (let i = 0; i < STARS; i++) {
      const r  = 300 + Math.random() * 900;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      pos[i*3]   = r * Math.sin(ph) * Math.cos(th);
      pos[i*3+1] = r * Math.sin(ph) * Math.sin(th);
      pos[i*3+2] = r * Math.cos(ph);
      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i*3] = c[0]; col[i*3+1] = c[1]; col[i*3+2] = c[2];
      sz[i]  = 0.4 + Math.random() * 3.5;
      rnd[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
    geo.setAttribute('size',     new THREE.BufferAttribute(sz, 1));
    geo.setAttribute('aRnd',     new THREE.BufferAttribute(rnd, 1));

    const mat = new THREE.ShaderMaterial({
      vertexColors: true, transparent: true,
      depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: _starUniforms,
      vertexShader: `
        attribute float size; attribute float aRnd; varying vec3 vCol; varying float vRnd;
        uniform float uTime;
        void main(){
          vCol=color; vRnd=aRnd;
          vec3 p=position;
          p.y+=sin(uTime*0.08+aRnd*6.28)*1.2;
          vec4 mv=modelViewMatrix*vec4(p,1.0);
          float twinkle=0.7+0.3*sin(uTime*2.0+aRnd*12.0);
          gl_PointSize=size*(380.0/-mv.z)*twinkle;
          gl_Position=projectionMatrix*mv;
        }
      `,
      fragmentShader: `
        varying vec3 vCol; varying float vRnd;
        void main(){
          float d=length(gl_PointCoord-0.5);
          if(d>0.5) discard;
          float a=smoothstep(0.5,0.0,d);
          float core=smoothstep(0.12,0.0,d)*1.5;
          gl_FragColor=vec4(vCol+core,a*0.95);
        }
      `
    });
    scene.add(new THREE.Points(geo, mat));
    scene._starMat = mat;
  })();

  /* ═══════════════════════════════════════════
     2. VOLUMETRIC NEBULA PLANES
  ═══════════════════════════════════════════ */
  const _nebMats = [];
  (function buildNebula() {
    const cfgs = [
      { ca: 0x003399, cb: 0x00f0ff, p: [-80, 25,-150], r:[0.3,0.1,0], s:280 },
      { ca: 0x003311, cb: 0x00ff88, p: [ 90,-20,-130], r:[-0.2,0.5,0], s:230 },
      { ca: 0x220055, cb: 0xa855f7, p: [  0, 50,-200], r:[0.1,0,0.1], s:350 },
      { ca: 0x001133, cb: 0x00d4ff, p: [-60,-40,-100], r:[0.4,-0.2,0], s:180 },
    ];
    cfgs.forEach(cfg => {
      const m = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uA: { value: new THREE.Color(cfg.ca) },
          uB: { value: new THREE.Color(cfg.cb) }
        },
        vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
        fragmentShader: `
          uniform float uTime; uniform vec3 uA,uB; varying vec2 vUv;
          float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
          float n(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
            return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
          float fbm(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<7;i++){v+=a*n(p);p*=2.1;a*=0.48;} return v; }
          void main(){
            vec2 uv=vUv-0.5;
            float t=uTime*0.025;
            float n1=fbm(uv*3.2+t);
            float n2=fbm(uv*2.1-t*0.7+1.4);
            float shape=smoothstep(0.52,0.0,length(uv));
            vec3 col=mix(uA,uB,n1*n2);
            float alpha=n1*n2*shape*0.22;
            gl_FragColor=vec4(col,alpha);
          }
        `
      });
      _nebMats.push(m);
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1,1), m);
      mesh.position.set(...cfg.p);
      mesh.rotation.set(...cfg.r);
      mesh.scale.setScalar(cfg.s);
      scene.add(mesh);
    });
  })();

  /* ═══════════════════════════════════════════
     3. FLOATING DUST PARTICLES (ambient)
  ═══════════════════════════════════════════ */
  const _dustUniforms = { uTime: { value: 0 } };
  (function buildDust() {
    const N = isMobile ? 1500 : 5000;
    const pos = new Float32Array(N * 3);
    const spd = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      pos[i*3]   = (Math.random()-0.5)*200;
      pos[i*3+1] = (Math.random()-0.5)*120;
      pos[i*3+2] = (Math.random()-0.5)*200;
      spd[i] = 0.3 + Math.random()*0.7;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
    geo.setAttribute('aSpd',     new THREE.BufferAttribute(spd,1));
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, uniforms: _dustUniforms,
      vertexShader: `
        attribute float aSpd; uniform float uTime;
        void main(){
          vec3 p=position;
          p.y+=sin(uTime*aSpd*0.4+p.x*0.05)*3.0;
          p.x+=cos(uTime*aSpd*0.3+p.z*0.04)*2.0;
          vec4 mv=modelViewMatrix*vec4(p,1.0);
          gl_PointSize=1.8*(200.0/-mv.z);
          gl_Position=projectionMatrix*mv;
        }
      `,
      fragmentShader: `
        void main(){
          float d=length(gl_PointCoord-0.5);
          if(d>0.5) discard;
          gl_FragColor=vec4(0.4,0.9,1.0,smoothstep(0.5,0.0,d)*0.45);
        }
      `
    });
    scene.add(new THREE.Points(geo, mat));
    scene._dustMat = mat;
  })();

  /* ═══════════════════════════════════════════
     4. AI CORE — Central holographic orb
  ═══════════════════════════════════════════ */
  const _coreUniforms = { uTime: { value: 0 } };
  const coreGroup = new THREE.Group();
  scene.add(coreGroup);

  // Inner plasma sphere
  const coreSphere = new THREE.Mesh(
    new THREE.SphereGeometry(3.5, 64, 64),
    new THREE.ShaderMaterial({
      transparent: true, side: THREE.FrontSide,
      uniforms: _coreUniforms,
      vertexShader: `
        varying vec3 vNorm; varying vec3 vPos; varying vec2 vUv;
        void main(){ vNorm=normalMatrix*normal; vPos=position; vUv=uv;
          gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }
      `,
      fragmentShader: `
        uniform float uTime; varying vec3 vNorm; varying vec3 vPos; varying vec2 vUv;
        float h(vec3 p){ return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453); }
        float n3(vec3 p){ vec3 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
          return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),
                     mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z); }
        void main(){
          float noise=n3(vPos*1.8+uTime*0.3)*0.5+n3(vPos*3.5-uTime*0.5)*0.3+n3(vPos*7.0+uTime*0.7)*0.2;
          float rim=pow(1.0-clamp(dot(normalize(vNorm),vec3(0,0,1)),0.0,1.0),2.5);
          float pulse=0.6+0.4*sin(uTime*3.0+noise*6.28);
          vec3 ca=vec3(0.0,0.94,1.0);
          vec3 cb=vec3(0.0,1.0,0.53);
          vec3 cc=vec3(0.53,0.27,1.0);
          vec3 col=mix(mix(ca,cb,noise),cc,rim*0.5);
          col+=rim*1.4*ca;
          float alpha=0.72+rim*0.28;
          gl_FragColor=vec4(col*pulse,alpha);
        }
      `
    })
  );
  coreGroup.add(coreSphere);

  // Outer corona
  const coronaMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: _coreUniforms,
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `
      uniform float uTime; varying vec2 vUv;
      void main(){
        vec2 uv=vUv-0.5; float d=length(uv);
        if(d>0.5) discard;
        float rays=pow(max(0.0,sin(atan(uv.y,uv.x)*12.0+uTime*2.5)),6.0);
        float ring=smoothstep(0.42,0.38,d)*smoothstep(0.0,0.08,d-0.22);
        float glow=smoothstep(0.5,0.2,d)*0.35;
        float pulse=0.6+0.4*sin(uTime*4.0);
        gl_FragColor=vec4(0.0,0.9,1.0,(rays*0.6+ring*0.8+glow)*pulse);
      }
    `
  });
  const corona = new THREE.Mesh(new THREE.PlaneGeometry(18,18), coronaMat);
  corona.renderOrder = -1;
  coreGroup.add(corona);

  // Orbital rings at different angles
  const ringDefs = [
    { r: 5.5, t: 0.07, ax: 0,    ay: 0, az: 0,    col: 0x00f0ff },
    { r: 6.2, t: 0.07, ax: 1.1,  ay: 0.3, az:0,   col: 0x00ff88 },
    { r: 7.0, t: 0.05, ax: 0,    ay: 1.2, az: 0.5, col: 0xa855f7 },
    { r: 5.0, t: 0.09, ax: 1.57, ay: 0,   az: 0,   col: 0xffd700 },
    { r: 8.0, t: 0.04, ax: 0.6,  ay: 1.0, az: 0.8, col: 0x00d4ff },
  ];
  const orbRings = [];
  ringDefs.forEach((d, i) => {
    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(d.r, d.t, 16, 128),
      new THREE.MeshBasicMaterial({
        color: d.col, transparent: true, opacity: 0.7,
        blending: THREE.AdditiveBlending
      })
    );
    mesh.rotation.set(d.ax, d.ay, d.az);
    coreGroup.add(mesh);
    orbRings.push({ mesh, speed: 0.15 + i * 0.08, dir: i % 2 ? 1 : -1 });
  });

  /* ═══════════════════════════════════════════
     5. NEURAL NETWORK VISUALIZATION
  ═══════════════════════════════════════════ */
  const _neuralUniforms = { uTime: { value: 0 } };
  const neuralGroup = new THREE.Group();
  scene.add(neuralGroup);

  const NODE_COUNT = isMobile ? 18 : 30;
  const nodePositions = [];
  const nodeMeshes    = [];

  // Node spheres
  const nodeMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.9 });
  for (let i = 0; i < NODE_COUNT; i++) {
    const r  = 14 + Math.random() * 16;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    const pos = new THREE.Vector3(
      r * Math.sin(ph) * Math.cos(th),
      r * Math.sin(ph) * Math.sin(th),
      r * Math.cos(ph)
    );
    nodePositions.push(pos);
    const node = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), nodeMat.clone());
    node.position.copy(pos);
    neuralGroup.add(node);
    nodeMeshes.push(node);
  }

  // Connection lines
  const linePositions = [];
  const lineColors    = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    for (let j = i + 1; j < NODE_COUNT; j++) {
      if (nodePositions[i].distanceTo(nodePositions[j]) < 20) {
        linePositions.push(nodePositions[i].x, nodePositions[i].y, nodePositions[i].z);
        linePositions.push(nodePositions[j].x, nodePositions[j].y, nodePositions[j].z);
        lineColors.push(0, 0.8, 1, 0, 0.8, 1);
      }
    }
  }
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3));
  lineGeo.setAttribute('color',    new THREE.BufferAttribute(new Float32Array(lineColors),    3));
  const lineMat = new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0.18,
    blending: THREE.AdditiveBlending
  });
  neuralGroup.add(new THREE.LineSegments(lineGeo, lineMat));

  // Pulse packets traveling along connections
  const PULSES = isMobile ? 20 : 50;
  const pulsePositions = new Float32Array(PULSES * 3);
  const pulseGeo  = new THREE.BufferGeometry();
  pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulsePositions, 3));
  const pulseMat  = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: _neuralUniforms,
    vertexShader: `uniform float uTime; void main(){
      vec4 mv=modelViewMatrix*vec4(position,1.0);
      gl_PointSize=4.5*(300.0/-mv.z);
      gl_Position=projectionMatrix*mv;
    }`,
    fragmentShader: `void main(){
      float d=length(gl_PointCoord-0.5);
      if(d>0.5) discard;
      gl_FragColor=vec4(0.3,1.0,1.0,smoothstep(0.5,0.0,d)*0.95);
    }`
  });
  const pulsePts  = new THREE.Points(pulseGeo, pulseMat);
  neuralGroup.add(pulsePts);

  const pulseStates = Array.from({ length: PULSES }, () => {
    const pairs = [];
    for (let i = 0; i < NODE_COUNT; i++)
      for (let j = i+1; j < NODE_COUNT; j++)
        if (nodePositions[i].distanceTo(nodePositions[j]) < 20)
          pairs.push([i, j]);
    const p = pairs[Math.floor(Math.random() * pairs.length)];
    return { a: p[0], b: p[1], t: Math.random() };
  });

  /* ═══════════════════════════════════════════
     6. WASTE OBJECT MODELS (high-poly)
  ═══════════════════════════════════════════ */
  function mkPhys(color, opts={}) {
    return new THREE.MeshPhysicalMaterial({ color, roughness:0.1, metalness:0.3, ...opts });
  }
  function makePlastic() {
    const g=new THREE.Group();
    const m=mkPhys(0x00ccff,{transparent:true,opacity:0.72,transmission:0.8,ior:1.45});
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,1.6,64),m));
    const n=new THREE.Mesh(new THREE.CylinderGeometry(0.26,0.5,0.5,64),m); n.position.y=1.05; g.add(n);
    const c=new THREE.Mesh(new THREE.CylinderGeometry(0.29,0.29,0.14,32),mkPhys(0xffffff,{roughness:0.5})); c.position.y=1.35; g.add(c);
    g.scale.setScalar(1.6); return g;
  }
  function makeMetal() {
    const g=new THREE.Group();
    const m=mkPhys(0xbbbbbb,{metalness:0.95,roughness:0.08});
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,1.4,64),m));
    const rm=mkPhys(0x888888,{metalness:0.9});
    const rt=new THREE.Mesh(new THREE.TorusGeometry(0.5,0.05,16,64),rm); rt.rotation.x=Math.PI/2; rt.position.y=0.7; g.add(rt);
    const rb=rt.clone(); rb.position.y=-0.7; g.add(rb);
    g.scale.setScalar(1.6); return g;
  }
  function makeGlass() {
    const g=new THREE.Group();
    const m=mkPhys(0x00ee77,{transparent:true,opacity:0.6,transmission:0.92,ior:1.52});
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.46,0.52,1.8,64),m));
    const n=new THREE.Mesh(new THREE.CylinderGeometry(0.21,0.46,0.6,64),m); n.position.y=1.2; g.add(n);
    g.scale.setScalar(1.6); return g;
  }
  function makeBox() {
    const m=mkPhys(0xd2a87a,{roughness:0.88,metalness:0.0});
    const b=new THREE.Mesh(new THREE.BoxGeometry(1.2,1.2,1.2),m); b.scale.setScalar(1.6); return b;
  }
  function makeOrganic() {
    const g=new THREE.Group();
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.55,32,32),mkPhys(0xd4394e,{roughness:0.45})));
    const lf=new THREE.Mesh(new THREE.ConeGeometry(0.22,0.55,16),mkPhys(0x3cb95c,{roughness:0.5}));
    lf.position.set(0.22,0.72,0); lf.rotation.z=-0.4; g.add(lf);
    g.scale.setScalar(1.6); return g;
  }
  function makeEWaste() {
    const g=new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1.4,0.2,1.0),mkPhys(0x334455,{roughness:0.3,metalness:0.7})));
    for(let i=0;i<6;i++){
      const pin=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.25,8),mkPhys(0xffd700,{metalness:0.9}));
      pin.position.set(-0.5+i*0.2,-0.22,0); g.add(pin);
    }
    g.scale.setScalar(1.6); return g;
  }

  const wasteGens = [
    { create: makePlastic,  binIndex: 0, label: 'Plastic' },
    { create: makeBox,      binIndex: 1, label: 'Cardboard' },
    { create: makeMetal,    binIndex: 2, label: 'Metal Can' },
    { create: makeGlass,    binIndex: 2, label: 'Glass' },
    { create: makeOrganic,  binIndex: 3, label: 'Organic' },
    { create: makeEWaste,   binIndex: 4, label: 'E-Waste' },
  ];

  /* ═══════════════════════════════════════════
     7. SMART BINS  (6 categories)
  ═══════════════════════════════════════════ */
  const binColors = [0x0088ff, 0xffd700, 0x00f0ff, 0x00ff88, 0xff6600, 0xaa00ff];
  const binLabels = ['PLASTIC','PAPER','METAL','GLASS','ORGANIC','E-WASTE'];
  const binTargets = [
    new THREE.Vector3(-22, -8, 38),
    new THREE.Vector3(-11, -8, 38),
    new THREE.Vector3(  0, -8, 38),
    new THREE.Vector3( 11, -8, 38),
    new THREE.Vector3( 22, -8, 38),
    new THREE.Vector3( 33, -8, 38),
  ];
  const binGeo = new THREE.BoxGeometry(3.5, 2.5, 3.5);
  const bins = [];

  binTargets.forEach((pos, i) => {
    const bc = binColors[i];
    const binMesh = new THREE.Mesh(binGeo,
      new THREE.MeshStandardMaterial({ color:0x080a18, roughness:0.25, metalness:0.9, emissive:bc, emissiveIntensity:0.07 })
    );
    binMesh.position.copy(pos);
    scene.add(binMesh);

    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(binGeo),
      new THREE.LineBasicMaterial({ color: bc, transparent:true, opacity:0.8 })
    );
    edges.position.copy(pos);
    scene.add(edges);

    // Label sprite
    const lc=document.createElement('canvas'); lc.width=512; lc.height=256;
    const lx=lc.getContext('2d');
    lx.font='bold 72px Outfit,sans-serif'; lx.fillStyle='#ffffff';
    lx.textAlign='center'; lx.fillText(binLabels[i],256,150);
    const lt=new THREE.CanvasTexture(lc);
    const ls=new THREE.Sprite(new THREE.SpriteMaterial({map:lt,transparent:true,blending:THREE.AdditiveBlending}));
    ls.position.set(pos.x, pos.y+2.4, pos.z);
    ls.scale.set(4,2,1); scene.add(ls);

    // Ripple
    const rGeo=new THREE.RingGeometry(0.1,3.5,64);
    const rMat=new THREE.MeshBasicMaterial({color:bc,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false});
    const rMesh=new THREE.Mesh(rGeo,rMat);
    rMesh.rotation.x=Math.PI/2;
    rMesh.position.set(pos.x, pos.y+1.3, pos.z);
    scene.add(rMesh);

    bins.push({ mesh:binMesh, ripple:rMesh, ripMat:rMat });
  });

  function triggerRipple(idx) {
    const b=bins[idx]; b.ripMat.opacity=1.0; b.ripple.scale.set(0.1,0.1,0.1);
    const s=performance.now();
    const a=()=>{ const t=(performance.now()-s)/900;
      if(t<1){ b.ripple.scale.setScalar(0.1+t*1.2); b.ripMat.opacity=1.0-t; requestAnimationFrame(a); }
      else b.ripMat.opacity=0; }; a();
  }

  /* ═══════════════════════════════════════════
     8. ENERGY SORTING TUNNELS
  ═══════════════════════════════════════════ */
  const pathCurves = [];
  const _tubeUniforms = binTargets.map((_, i) => ({ uTime: { value: 0 }, uColor: { value: new THREE.Color(binColors[i]) } }));

  binTargets.forEach((target, i) => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(target.x * 0.25, 4, 12),
      new THREE.Vector3(target.x * 0.6, 0, 24),
      new THREE.Vector3(target.x * 0.9, -4, 32),
      target
    ]);
    pathCurves.push(curve);

    // Inner glow tube
    const tubeMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: _tubeUniforms[i],
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `
        uniform float uTime; uniform vec3 uColor; varying vec2 vUv;
        void main(){
          float flow=fract(vUv.x*4.0-uTime*1.2);
          float glow=smoothstep(1.0,0.0,abs(flow-0.5)*2.0);
          float edge=smoothstep(0.5,0.3,abs(vUv.y-0.5));
          gl_FragColor=vec4(uColor*(glow*1.4+0.2),edge*(glow*0.7+0.12));
        }
      `
    });
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 100, 0.15, 12, false), tubeMat);
    scene.add(tube);
  });

  /* ═══════════════════════════════════════════
     9. HOLOGRAPHIC EARTH — Final reveal
  ═══════════════════════════════════════════ */
  const earthGroup = new THREE.Group();
  earthGroup.position.set(0, -5, -160);
  scene.add(earthGroup);

  const _earthUniforms = { uTime: { value: 0 } };
  const earthMesh = new THREE.Mesh(
    new THREE.SphereGeometry(18, 64, 64),
    new THREE.ShaderMaterial({
      transparent: true, side: THREE.FrontSide,
      uniforms: _earthUniforms,
      vertexShader: `varying vec3 vNorm; varying vec2 vUv; varying vec3 vPos;
        void main(){ vNorm=normalMatrix*normal; vUv=uv; vPos=position;
          gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `
        uniform float uTime; varying vec3 vNorm; varying vec2 vUv; varying vec3 vPos;
        float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
        float n(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
          return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
        float fbm(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<5;i++){v+=a*n(p);p*=2.1;a*=0.5;} return v; }
        void main(){
          float latLine=step(0.965,abs(sin(vUv.y*3.14159*14.0)));
          float lonLine=step(0.965,abs(sin((vUv.x+uTime*0.012)*3.14159*28.0)));
          float grid=max(latLine,lonLine);
          float land=fbm(vUv*5.0+0.5);
          float rim=pow(1.0-clamp(dot(normalize(vNorm),vec3(0,0,1)),0.0,1.0),2.2);
          vec3 gridCol=mix(vec3(0.0,0.3,0.6),vec3(0.0,0.9,1.0),grid);
          vec3 landCol=mix(vec3(0.0,0.4,0.15),vec3(0.0,0.8,0.4),step(0.54,land));
          vec3 col=mix(gridCol,landCol,step(0.54,land)*0.5);
          col+=rim*vec3(0.0,0.7,1.0)*1.2;
          float alpha=0.55+grid*0.45+rim*0.4;
          gl_FragColor=vec4(col,alpha);
        }
      `
    })
  );
  earthGroup.add(earthMesh);

  // Recycling rings around Earth
  const earthRingDefs = [
    { r: 24, t: 0.3, ax: 0,   ay: 0,   az: 0,    col: 0x00ff88, spd: 0.3 },
    { r: 27, t: 0.2, ax: 1.2, ay: 0,   az: 0.3,  col: 0x00f0ff, spd: -0.22 },
    { r: 22, t: 0.25,ax: 0,   ay: 0.8, az: 1.0,  col: 0xa855f7, spd: 0.18 },
  ];
  const earthRings = [];
  earthRingDefs.forEach(d => {
    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(d.r, d.t, 16, 200),
      new THREE.MeshBasicMaterial({ color: d.col, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending })
    );
    mesh.rotation.set(d.ax, d.ay, d.az);
    earthGroup.add(mesh);
    earthRings.push({ mesh, spd: d.spd });
  });

  // Data streams above Earth
  const streamCount = 8;
  for (let i = 0; i < streamCount; i++) {
    const ang = (i / streamCount) * Math.PI * 2;
    const pts = [];
    for (let j = 0; j < 20; j++) {
      const t = j / 19;
      pts.push(new THREE.Vector3(
        Math.cos(ang) * 22 * (1 - t * 0.3),
        18 + t * 25,
        Math.sin(ang) * 22 * (1 - t * 0.3)
      ));
    }
    const streamGeo = new THREE.BufferGeometry().setFromPoints(pts);
    const streamMat = new THREE.LineBasicMaterial({
      color: [0x00f0ff, 0x00ff88, 0xa855f7][i % 3],
      transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending
    });
    earthGroup.add(new THREE.Line(streamGeo, streamMat));
  }

  /* ═══════════════════════════════════════════
     10. HUD PANELS (2K canvas textures)
  ═══════════════════════════════════════════ */
  const hudC = document.createElement('canvas');
  hudC.width = 2048; hudC.height = 1024;
  const hudX = hudC.getContext('2d');
  const hudTex = new THREE.CanvasTexture(hudC);
  const hudPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 7),
    new THREE.MeshBasicMaterial({ map:hudTex, transparent:true, blending:THREE.AdditiveBlending, side:THREE.DoubleSide, depthWrite:false })
  );
  hudPanel.position.set(11, 5.5, -2);
  hudPanel.rotation.y = -0.45;
  scene.add(hudPanel);

  let _hudLabel = null, _hudConf = null;
  function drawHUD(label, conf) {
    _hudLabel = label; _hudConf = conf;
    hudX.clearRect(0, 0, 2048, 1024);
    // Bracket corners
    ['#00f0ff','#00ff88'].forEach((c,ci)=>{
      hudX.strokeStyle=c; hudX.lineWidth=10;
      hudX.beginPath();
      if(ci===0){ hudX.moveTo(80,40); hudX.lineTo(40,40); hudX.lineTo(40,240); hudX.moveTo(2008,40); hudX.lineTo(2008,240); }
      else{ hudX.moveTo(40,984); hudX.lineTo(40,784); hudX.moveTo(1968,984); hudX.lineTo(2008,984); hudX.lineTo(2008,784); }
      hudX.stroke();
    });
    hudX.font='bold 74px Outfit,monospace'; hudX.fillStyle='#00f0ff';
    hudX.fillText('ECOSORT AI — CLASSIFICATION ENGINE', 120, 165);
    hudX.font='58px Outfit,monospace'; hudX.fillStyle='#ffd700';
    hudX.fillText('NEURAL NET: ACTIVE  |  STATUS: ONLINE', 120, 260);
    hudX.font='bold 110px Outfit,sans-serif'; hudX.fillStyle='#ffffff';
    hudX.fillText('AI WASTE INTELLIGENCE', 120, 400);
    hudX.font='bold 140px Outfit,sans-serif';
    hudX.fillStyle = label ? '#00ff88' : '#88ddff';
    hudX.fillText(label ? `ITEM: ${label.toUpperCase()}` : 'SCANNING ENVIRONMENT...', 120, 620);
    hudX.font='90px Outfit,sans-serif'; hudX.fillStyle='#00f0ff';
    hudX.fillText(conf ? `CONFIDENCE: ${conf}` : 'CONFIDENCE: ANALYZING', 120, 840);
    if(conf){
      const pct=parseFloat(conf)/100;
      const g=hudX.createLinearGradient(1300,0,1980,0);
      g.addColorStop(0,'#00f0ff'); g.addColorStop(1,'#00ff88');
      hudX.fillStyle='rgba(0,240,255,0.12)'; hudX.fillRect(1300,780,680,65);
      hudX.fillStyle=g; hudX.fillRect(1300,780,680*pct,65);
    }
    hudTex.needsUpdate = true;
  }
  drawHUD(null, null);

  /* ═══════════════════════════════════════════
     11. WASTE PIPELINE SYSTEM
  ═══════════════════════════════════════════ */
  const pipeline = [];
  let pageHidden = document.hidden;
  document.addEventListener('visibilitychange', () => { pageHidden = document.hidden; });

  function spawnItem() {
    const gen = wasteGens[Math.floor(Math.random() * wasteGens.length)];
    const mesh = gen.create();
    const angle = Math.random() * Math.PI * 2;
    const dist  = 28 + Math.random() * 20;
    mesh.position.set(
      Math.cos(angle) * dist,
      (Math.random() - 0.5) * 20,
      -80 - Math.random() * 40
    );
    scene.add(mesh);
    pipeline.push({
      mesh, binIndex: gen.binIndex, label: gen.label,
      state: 0, scanTimer: 0, progress: 0,
      rx: 0.4 + Math.random() * 0.8,
      ry: 0.4 + Math.random() * 0.8,
      attractSpeed: 0.6 + Math.random() * 0.4
    });
  }
  spawnItem();
  setInterval(() => { if (pipeline.length < 4 && !pageHidden) spawnItem(); }, 2000);

  /* ═══════════════════════════════════════════
     12. POST-PROCESSING — Bloom + FXAA
  ═══════════════════════════════════════════ */
  let composer = null, useComposer = false;
  (function initPP() {
    try {
      if (typeof EffectComposer === 'undefined' || typeof UnrealBloomPass === 'undefined') return;
      if (isMobile) return;
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      const bloom = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        2.4, 0.6, 0.08
      );
      composer.addPass(bloom);
      if (typeof ShaderPass !== 'undefined' && typeof FXAAShader !== 'undefined') {
        const fxaa = new ShaderPass(FXAAShader);
        const pr = renderer.getPixelRatio();
        fxaa.material.uniforms['resolution'].value.set(1/(window.innerWidth*pr), 1/(window.innerHeight*pr));
        composer.addPass(fxaa);
        scene._fxaa = fxaa;
      }
      composer.setSize(window.innerWidth, window.innerHeight);
      useComposer = true;
    } catch(e) { console.warn('PP unavailable'); }
  })();

  /* ═══════════════════════════════════════════
     13. SCROLL CAMERA PATH  (6 cinematic keyframes)
  ═══════════════════════════════════════════ */
  // Frame 0 (0%)   : Wide establishing shot — vast starfield
  // Frame 1 (20%)  : Pull in toward AI core
  // Frame 2 (40%)  : Orbit right, see neural network
  // Frame 3 (55%)  : Close to core — scanner active
  // Frame 4 (75%)  : Pull back, see sorting tunnels + bins
  // Frame 5 (100%) : Zoom out — Earth reveal
  const camSpline = new THREE.CatmullRomCurve3([
    new THREE.Vector3(  0,  12,  95),
    new THREE.Vector3( -6,   6,  55),
    new THREE.Vector3( 18,   4,  40),
    new THREE.Vector3(  2,   0,  22),
    new THREE.Vector3(  8,  -2,  48),
    new THREE.Vector3(  0,  18, 100),
  ]);
  const lookSpline = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 2, 0),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, -4, 30),
    new THREE.Vector3(0, -5,-160),
  ]);

  /* ═══════════════════════════════════════════
     14. INPUT
  ═══════════════════════════════════════════ */
  let targetScroll=0, smoothScroll=0;
  let docH = Math.max(document.body.scrollHeight - window.innerHeight, 1);
  window.addEventListener('scroll', () => { targetScroll = window.scrollY || window.pageYOffset; });

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', e => {
    mouse.tx = (e.clientX / window.innerWidth)  * 2 - 1;
    mouse.ty = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  /* ═══════════════════════════════════════════
     15. RESIZE
  ═══════════════════════════════════════════ */
  function onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setPixelRatio(isMobile ? Math.min(window.devicePixelRatio,2) : Math.min(window.devicePixelRatio,3.5));
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    docH = Math.max(document.body.scrollHeight - h, 1);
    if (composer && useComposer) {
      composer.setSize(w, h);
      if (scene._fxaa) {
        const pr = renderer.getPixelRatio();
        scene._fxaa.material.uniforms['resolution'].value.set(1/(w*pr), 1/(h*pr));
      }
    }
  }
  window.addEventListener('resize', onResize);

  /* ═══════════════════════════════════════════
     16. ANIMATION LOOP
  ═══════════════════════════════════════════ */
  let lastT = performance.now() / 1000;
  const camPos = new THREE.Vector3();
  const lookAt = new THREE.Vector3();

  function animate() {
    requestAnimationFrame(animate);
    if (pageHidden) { lastT = performance.now() / 1000; return; }

    const now = performance.now() / 1000;
    const dt  = Math.min(0.05, now - lastT);
    lastT = now;

    smoothScroll += (targetScroll - smoothScroll) * 0.07;
    const sp = clamp(smoothScroll / docH, 0, 1);

    // ── Update uniforms ──
    _starUniforms.uTime.value  = now;
    _dustUniforms.uTime.value  = now;
    _coreUniforms.uTime.value  = now;
    _neuralUniforms.uTime.value = now;
    _earthUniforms.uTime.value = now;
    _nebMats.forEach(m => { m.uniforms.uTime.value = now; });
    _tubeUniforms.forEach(u => { u.uTime.value = now; });

    // ── AI Core ──
    coreGroup.rotation.y = now * 0.12;
    orbRings.forEach(({ mesh, speed, dir }) => {
      mesh.rotation.z += speed * dir * dt;
      mesh.rotation.x += speed * 0.3 * dir * dt;
    });
    // pulse core scale
    const corePulse = 1.0 + 0.04 * Math.sin(now * 2.8);
    coreSphere.scale.setScalar(corePulse);
    corona.rotation.z = now * 0.4;

    // ── Neural network ──
    neuralGroup.rotation.y = now * 0.06;
    // animate node brightness
    nodeMeshes.forEach((n, i) => {
      const pulse = 0.5 + 0.5 * Math.sin(now * 1.5 + i * 0.7);
      n.material.opacity = 0.4 + pulse * 0.6;
    });
    // move pulse packets along edges
    pulseStates.forEach((ps, i) => {
      ps.t += dt * (0.6 + (i % 3) * 0.25);
      if (ps.t >= 1) {
        ps.t = 0;
        // pick a new random edge
        const na = Math.floor(Math.random() * NODE_COUNT);
        let nb = na;
        while (nb === na) nb = Math.floor(Math.random() * NODE_COUNT);
        ps.a = na; ps.b = nb;
      }
      const p = pulsePositions;
      const a = nodePositions[ps.a], b = nodePositions[ps.b];
      p[i*3]   = lerp(a.x, b.x, ps.t);
      p[i*3+1] = lerp(a.y, b.y, ps.t);
      p[i*3+2] = lerp(a.z, b.z, ps.t);
    });
    pulsePts.geometry.attributes.position.needsUpdate = true;

    // ── Point light orbit ──
    cyanPt.position.set(Math.sin(now*0.28)*35, 18+Math.sin(now*0.45)*8,  Math.cos(now*0.28)*25);
    greenPt.position.set(Math.cos(now*0.22)*30,-12+Math.cos(now*0.38)*6,  Math.sin(now*0.22)*30);
    purplePt.position.set(Math.sin(now*0.35)*20, 28, Math.cos(now*0.35)*20);

    // ── Holographic Earth ──
    earthMesh.rotation.y = now * 0.08;
    earthRings.forEach(({ mesh, spd }) => { mesh.rotation.z += spd * dt; });
    // fade in earth when sp > 0.75
    const earthAlpha = clamp(mapRange(sp, 0.75, 0.95, 0, 1), 0, 1);
    earthGroup.visible = earthAlpha > 0.01;
    earthMesh.material.uniforms; // already set above via _earthUniforms
    earthGroup.children.forEach(c => {
      if (c.material && c.material.opacity !== undefined) {
        c.material.opacity = earthAlpha * (c instanceof THREE.Mesh && c !== earthMesh ? 0.7 : 1.0);
      }
    });

    // ── Waste pipeline ──
    for (let i = pipeline.length - 1; i >= 0; i--) {
      const item = pipeline[i];
      if (item.state === 0) {
        // Drift toward AI core
        const toCoreX = (0 - item.mesh.position.x) * item.attractSpeed * dt * 0.15;
        const toCoreY = (0 - item.mesh.position.y) * item.attractSpeed * dt * 0.15;
        const toCoreZ = (0 - item.mesh.position.z) * item.attractSpeed * dt * 0.12;
        item.mesh.position.x += toCoreX;
        item.mesh.position.y += toCoreY;
        item.mesh.position.z += toCoreZ;
        item.mesh.rotation.x += item.rx * dt * 0.8;
        item.mesh.rotation.y += item.ry * dt * 0.8;
        if (item.mesh.position.distanceTo(new THREE.Vector3(0,0,0)) < 8) {
          item.state = 1; item.scanTimer = 0;
          drawHUD(item.label, (91 + Math.random()*8).toFixed(1) + '%');
        }
      } else if (item.state === 1) {
        // Scanning at core
        item.scanTimer += dt;
        item.mesh.position.x += (0 - item.mesh.position.x) * 0.12;
        item.mesh.position.y += (0 - item.mesh.position.y) * 0.12;
        item.mesh.rotation.y += 1.2 * dt;
        if (item.scanTimer >= 1.2) { item.state = 2; item.progress = 0; }
      } else if (item.state === 2) {
        // Travel along path to bin
        item.progress += dt * 0.75;
        if (item.progress >= 1) {
          triggerRipple(item.binIndex);
          scene.remove(item.mesh);
          pipeline.splice(i, 1);
          drawHUD(null, null);
        } else {
          const idx = Math.min(item.binIndex, pathCurves.length - 1);
          item.mesh.position.copy(pathCurves[idx].getPointAt(item.progress));
          item.mesh.rotation.x += item.rx * dt * 2.5;
          item.mesh.rotation.y += item.ry * dt * 2.5;
        }
      }
    }

    // ── Mouse parallax ──
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;

    // ── Cinematic camera path ──
    camSpline.getPoint(sp, camPos);
    lookSpline.getPoint(sp, lookAt);
    camera.position.x += (camPos.x + mouse.x * 5 - camera.position.x) * 0.07;
    camera.position.y += (camPos.y + mouse.y * 3 - camera.position.y) * 0.07;
    camera.position.z += (camPos.z - camera.position.z) * 0.07;
    camera.lookAt(lookAt);

    // HUD float
    hudPanel.position.y = 5.5 + Math.sin(now * 1.7) * 0.25;

    // ── RENDER ──
    if (useComposer && composer) {
      composer.render(dt);
    } else {
      renderer.render(scene, camera);
    }
  }

  requestAnimationFrame(animate);
  window.__threeBg = { scene, camera, renderer, drawHUD, triggerRipple };
})();

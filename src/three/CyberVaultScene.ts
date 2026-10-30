import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// Pre-allocated math helpers to ensure zero GC during animation loop
const _vec3 = new THREE.Vector3();

export interface CyberVaultSceneOptions {
  container: HTMLDivElement;
  onSceneReady?: () => void;
}

export class CyberVaultScene {
  private container: HTMLDivElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private frameId: number = 0;
  private isDestroyed: boolean = false;
  private isSoftwareGl: boolean = false;

  // 3D Vault components
  private vaultGroup: THREE.Group;
  private drums: { mesh: THREE.Mesh; targetAngle: number; currentAngle: number; spinSpeed: number }[] = [];
  private shackleMesh: THREE.Group | null = null;
  private leftPistonMesh: THREE.Mesh | null = null;
  private rightPistonMesh: THREE.Mesh | null = null;
  private statusRingMesh: THREE.Mesh | null = null;
  private laserScanBeam: THREE.Mesh | null = null;
  private statusLight: THREE.PointLight | null = null;

  // Animation state
  private targetShackleY: number = 0;
  private currentShackleY: number = 0;
  private isUnlocked: boolean = false;
  private isAttacking: boolean = false;
  private attackSpeedId: 'lenta' | 'normal' | 'rapida' | 'extrema' = 'normal';
  private currentPinDigits: number[] = [0, 0, 0, 0, 0, 0];
  private scanBeamX: number = 0;

  // Textures and resources to dispose
  private disposables: { dispose: () => void }[] = [];

  constructor(options: CyberVaultSceneOptions) {
    this.container = options.container;

    // 1. Detect software WebGL from GPU renderer string
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Initialize renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: true,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height);
    this.container.appendChild(this.renderer.domElement);

    // 3. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x050814, 0.045);

    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
    this.camera.position.set(0, 1.8, 4.4);

    // 4. Studio Environment Lighting
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Studio 3-Point Lighting Rig
    // Cool fill light
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 1.2);
    this.scene.add(hemiLight);

    // Warm directional key light
    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.2);
    keyLight.position.set(3, 5, 4);
    if (!this.isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 12;
      keyLight.shadow.camera.left = -2.5;
      keyLight.shadow.camera.right = 2.5;
      keyLight.shadow.camera.top = 2.5;
      keyLight.shadow.camera.bottom = -2.5;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    this.scene.add(keyLight);

    // Rim/Back light for metallic silhouette definition
    const rimLight = new THREE.DirectionalLight(0x06b6d4, 1.6);
    rimLight.position.set(-3, 3, -3);
    this.scene.add(rimLight);

    // 6. Camera Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 2.2;
    this.controls.maxDistance = 8.5;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.05; // Prevent dipping below ground
    this.controls.target.set(0, 0.85, 0);
    this.controls.update();

    // 7. Assemble 3D Procedural Cyber Vault
    this.vaultGroup = new THREE.Group();
    this.buildProceduralVault();
    this.scene.add(this.vaultGroup);

    // 8. Ground Contact Shadow
    this.createContactShadow();

    // Pre-warm shaders
    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    // 9. Resize Listener
    window.addEventListener('resize', this.onResize);

    // 10. Start Loop
    this.startLoop();

    if (options.onSceneReady) {
      options.onSceneReady();
    }
  }

  /**
   * Generates a high-contrast procedural canvas texture with digits 0 through 9
   * mapped around the cylinder drum circumference.
   */
  private createRotorTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Dark titanium rotor background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle brushed metal grooves & bevel lines
    for (let x = 0; x < canvas.width; x += 8) {
      ctx.fillStyle = (x % 32 === 0) ? '#162032' : '#0d1322';
      ctx.fillRect(x, 0, 4, canvas.height);
    }

    const segmentWidth = canvas.width / 10;

    // Render digits 0 to 9
    for (let digit = 0; digit < 10; digit++) {
      const segX = digit * segmentWidth;

      // Segment separator grooves
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(segX, 0, 3, canvas.height);
      ctx.fillStyle = '#030712';
      ctx.fillRect(segX + 3, 0, 3, canvas.height);

      // Cyber laser index marks
      ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.fillRect(segX + segmentWidth / 2 - 20, 20, 40, 3);
      ctx.fillRect(segX + segmentWidth / 2 - 20, canvas.height - 23, 40, 3);

      // High-contrast neon cyan/white digit
      ctx.font = 'bold 130px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Outer glow
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(String(digit), segX + segmentWidth / 2, canvas.height / 2);

      // Bright core text
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(String(digit), segX + segmentWidth / 2, canvas.height / 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    this.disposables.push(texture);
    return texture;
  }

  /**
   * Procedural Contact Shadow Disc at y = 0
   */
  private createContactShadow(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
    grad.addColorStop(0.35, 'rgba(0, 0, 0, 0.4)');
    grad.addColorStop(0.7, 'rgba(3, 7, 18, 0.15)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.disposables.push(texture);

    const geo = new THREE.PlaneGeometry(3.6, 2.2);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      opacity: 0.85,
    });
    this.disposables.push(geo, mat);

    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.002;
    this.scene.add(mesh);
  }

  /**
   * Procedural Carbon Fiber Texture for chassis
   */
  private createCarbonTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, 64, 64);

    for (let y = 0; y < 64; y += 4) {
      for (let x = 0; x < 64; x += 4) {
        if ((x + y) % 8 === 0) {
          ctx.fillStyle = '#161e2e';
          ctx.fillRect(x, y, 4, 4);
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    this.disposables.push(texture);
    return texture;
  }

  /**
   * Build the 3D Cryptographic Vault (8+ distinct procedural parts)
   */
  private buildProceduralVault(): void {
    const rotorTex = this.createRotorTexture();
    const carbonTex = this.createCarbonTexture();

    // PBR Materials
    const titaniumDarkMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      metalness: 0.85,
      roughness: 0.28,
      map: carbonTex,
    });
    const titaniumPolishedMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.95,
      roughness: 0.12,
    });
    const goldAccentMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.92,
      roughness: 0.2,
    });
    const drumMat = new THREE.MeshStandardMaterial({
      map: rotorTex,
      metalness: 0.75,
      roughness: 0.25,
    });
    const laserGlowMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.85,
    });

    this.disposables.push(titaniumDarkMat, titaniumPolishedMat, goldAccentMat, drumMat, laserGlowMat);

    // 1. Base Pedestal / Chassis (Bottom-center pivot flush at y = 0)
    const baseGeo = new THREE.BoxGeometry(2.6, 0.22, 1.3);
    const baseChamferGeo = new THREE.BoxGeometry(2.45, 0.12, 1.15);
    const baseTrimGeo = new THREE.BoxGeometry(2.64, 0.04, 1.34);
    this.disposables.push(baseGeo, baseChamferGeo, baseTrimGeo);

    const baseMesh = new THREE.Mesh(baseGeo, titaniumDarkMat);
    baseMesh.position.y = 0.11;
    baseMesh.castShadow = !this.isSoftwareGl;
    baseMesh.receiveShadow = !this.isSoftwareGl;
    this.vaultGroup.add(baseMesh);

    const baseTrimMesh = new THREE.Mesh(baseTrimGeo, laserGlowMat);
    baseTrimMesh.position.y = 0.02;
    this.vaultGroup.add(baseTrimMesh);

    const baseChamfer = new THREE.Mesh(baseChamferGeo, titaniumPolishedMat);
    baseChamfer.position.y = 0.26;
    this.vaultGroup.add(baseChamfer);

    // 2. Twin Lateral Stanchions / Upright Brackets
    const stanchionWidth = 0.24;
    const stanchionHeight = 1.1;
    const stanchionDepth = 0.7;
    const stanchionGeo = new THREE.BoxGeometry(stanchionWidth, stanchionHeight, stanchionDepth);
    this.disposables.push(stanchionGeo);

    const leftStanchion = new THREE.Mesh(stanchionGeo, titaniumDarkMat);
    leftStanchion.position.set(-1.18, 0.82, 0);
    leftStanchion.castShadow = !this.isSoftwareGl;
    this.vaultGroup.add(leftStanchion);

    const rightStanchion = new THREE.Mesh(stanchionGeo, titaniumDarkMat);
    rightStanchion.position.set(1.18, 0.82, 0);
    rightStanchion.castShadow = !this.isSoftwareGl;
    this.vaultGroup.add(rightStanchion);

    // Stanchion Gold Bolt Accents
    const boltGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.03, 12);
    this.disposables.push(boltGeo);
    [-1.2, 1.2].forEach((xPos) => {
      for (let y = 0.5; y <= 1.2; y += 0.35) {
        const bolt = new THREE.Mesh(boltGeo, goldAccentMat);
        bolt.rotation.z = Math.PI / 2;
        bolt.position.set(xPos, y, 0.25);
        this.vaultGroup.add(bolt);
      }
    });

    // 3. Central Precision Rotor Shaft
    const shaftGeo = new THREE.CylinderGeometry(0.09, 0.09, 2.3, 24);
    shaftGeo.rotateZ(Math.PI / 2);
    this.disposables.push(shaftGeo);
    const shaftMesh = new THREE.Mesh(shaftGeo, titaniumPolishedMat);
    shaftMesh.position.set(0, 0.88, 0);
    this.vaultGroup.add(shaftMesh);

    // 4. Six Tumbler Rotor Drums (Representing the 6 PIN digits)
    const drumRadius = 0.38;
    const drumWidth = 0.28;
    const drumGap = 0.06;
    const totalDrumsWidth = 6 * drumWidth + 5 * drumGap; // ~1.98m
    const startX = -totalDrumsWidth / 2 + drumWidth / 2;

    const drumGeo = new THREE.CylinderGeometry(drumRadius, drumRadius, drumWidth, 48);
    // Orient cylinder so height lies along X axis, and curved surface wraps digits
    drumGeo.rotateZ(Math.PI / 2);
    this.disposables.push(drumGeo);

    // Divider rings between drums
    const ringGeo = new THREE.CylinderGeometry(0.41, 0.41, 0.03, 32);
    ringGeo.rotateZ(Math.PI / 2);
    this.disposables.push(ringGeo);

    for (let i = 0; i < 6; i++) {
      const drumX = startX + i * (drumWidth + drumGap);

      // Outer bezel ring
      const ringMesh = new THREE.Mesh(ringGeo, titaniumPolishedMat);
      ringMesh.position.set(drumX, 0.88, 0);
      this.vaultGroup.add(ringMesh);

      // Drum Tumbler Mesh
      const drumMesh = new THREE.Mesh(drumGeo, drumMat);
      drumMesh.position.set(drumX, 0.88, 0);
      drumMesh.castShadow = !this.isSoftwareGl;
      this.vaultGroup.add(drumMesh);

      this.drums.push({
        mesh: drumMesh,
        targetAngle: 0,
        currentAngle: 0,
        spinSpeed: 0,
      });
    }

    // 5. Retractable Heavy Upper Locking Shackle & Latches
    this.shackleMesh = new THREE.Group();

    // Top crossbar
    const crossbarGeo = new THREE.BoxGeometry(2.36, 0.16, 0.38);
    const lockToothGeo = new THREE.BoxGeometry(0.08, 0.14, 0.2);
    this.disposables.push(crossbarGeo, lockToothGeo);

    const crossbarMesh = new THREE.Mesh(crossbarGeo, titaniumDarkMat);
    crossbarMesh.position.set(0, 1.48, 0);
    crossbarMesh.castShadow = !this.isSoftwareGl;
    this.shackleMesh.add(crossbarMesh);

    // 6 Locking teeth descending toward each drum
    for (let i = 0; i < 6; i++) {
      const toothX = startX + i * (drumWidth + drumGap);
      const tooth = new THREE.Mesh(lockToothGeo, goldAccentMat);
      tooth.position.set(toothX, 1.34, 0);
      this.shackleMesh.add(tooth);
    }

    // Status optic rail on the shackle
    const statusRailGeo = new THREE.BoxGeometry(2.1, 0.04, 0.04);
    this.disposables.push(statusRailGeo);
    const statusRailMesh = new THREE.Mesh(statusRailGeo, laserGlowMat);
    statusRailMesh.position.set(0, 1.54, 0.18);
    this.statusRingMesh = statusRailMesh;
    this.shackleMesh.add(statusRailMesh);

    this.vaultGroup.add(this.shackleMesh);

    // 6. Hydraulic Actuation Pistons
    const pistonGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.45, 16);
    this.disposables.push(pistonGeo);

    this.leftPistonMesh = new THREE.Mesh(pistonGeo, titaniumPolishedMat);
    this.leftPistonMesh.position.set(-1.1, 1.4, 0);
    this.vaultGroup.add(this.leftPistonMesh);

    this.rightPistonMesh = new THREE.Mesh(pistonGeo, titaniumPolishedMat);
    this.rightPistonMesh.position.set(1.1, 1.4, 0);
    this.vaultGroup.add(this.rightPistonMesh);

    // 7. Glowing Verification Scan Laser Beam
    const beamGeo = new THREE.BoxGeometry(0.04, 0.7, 0.04);
    this.disposables.push(beamGeo);
    this.laserScanBeam = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.9,
    }));
    this.laserScanBeam.position.set(0, 0.88, 0.41);
    this.vaultGroup.add(this.laserScanBeam);

    // 8. Cyber Status Point Light
    this.statusLight = new THREE.PointLight(0x06b6d4, 1.5, 3.5);
    this.statusLight.position.set(0, 1.5, 0.5);
    this.scene.add(this.statusLight);
  }

  /**
   * Update the currently tested PIN on the 3D rotors
   */
  public updatePinDigits(pinStr: string, speedId: 'lenta' | 'normal' | 'rapida' | 'extrema', isAttacking: boolean): void {
    this.isAttacking = isAttacking;
    this.attackSpeedId = speedId;

    const digits = pinStr.padEnd(6, '0').slice(0, 6).split('').map(Number);
    this.currentPinDigits = digits;

    for (let i = 0; i < 6; i++) {
      const digit = digits[i] || 0;
      // Cylinder has 10 digits around 2*PI radians.
      // Compute the exact rotational angle for this digit
      const digitAngle = (digit / 10) * Math.PI * 2;
      if (this.drums[i]) {
        this.drums[i].targetAngle = digitAngle;
      }
    }
  }

  /**
   * Trigger the triumphant cryptographic unlock sequence
   */
  public triggerUnlock(finalPin: string): void {
    this.isUnlocked = true;
    this.isAttacking = false;
    this.targetShackleY = 0.45; // Hydraulic shackle lifts up

    const digits = finalPin.padEnd(6, '0').slice(0, 6).split('').map(Number);
    for (let i = 0; i < 6; i++) {
      const digit = digits[i] || 0;
      if (this.drums[i]) {
        this.drums[i].targetAngle = (digit / 10) * Math.PI * 2;
      }
    }

    // Switch neon lights to Emerald Green
    if (this.statusRingMesh) {
      (this.statusRingMesh.material as THREE.MeshBasicMaterial).color.setHex(0x10b981);
    }
    if (this.laserScanBeam) {
      (this.laserScanBeam.material as THREE.MeshBasicMaterial).color.setHex(0x10b981);
    }
    if (this.statusLight) {
      this.statusLight.color.setHex(0x10b981);
      this.statusLight.intensity = 2.5;
    }
  }

  /**
   * Reset the vault back to locked state
   */
  public resetLock(): void {
    this.isUnlocked = false;
    this.isAttacking = false;
    this.targetShackleY = 0;

    // Reset status lights to Cyan
    if (this.statusRingMesh) {
      (this.statusRingMesh.material as THREE.MeshBasicMaterial).color.setHex(0x06b6d4);
    }
    if (this.laserScanBeam) {
      (this.laserScanBeam.material as THREE.MeshBasicMaterial).color.setHex(0x06b6d4);
    }
    if (this.statusLight) {
      this.statusLight.color.setHex(0x06b6d4);
      this.statusLight.intensity = 1.5;
    }
  }

  /**
   * Center/Reset Camera view
   */
  public resetCamera(): void {
    this.camera.position.set(0, 1.8, 4.4);
    this.controls.target.set(0, 0.85, 0);
    this.controls.update();
  }

  /**
   * Camera macro zoom on the rotor drums
   */
  public setRotorView(): void {
    this.camera.position.set(0, 1.05, 2.3);
    this.controls.target.set(0, 0.88, 0);
    this.controls.update();
  }

  private onResize = (): void => {
    if (!this.container || this.isDestroyed) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  /**
   * Software WebGL loop pacing with gl.fenceSync
   */
  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.isDestroyed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private startLoop(): void {
    let lastTime = performance.now();

    const tick = () => {
      if (this.isDestroyed) return;

      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // 1. Animate shackle elevation with smooth damping
      this.currentShackleY = THREE.MathUtils.damp(
        this.currentShackleY,
        this.targetShackleY,
        8,
        dt
      );
      if (this.shackleMesh) {
        this.shackleMesh.position.y = this.currentShackleY;
      }
      if (this.leftPistonMesh && this.rightPistonMesh) {
        this.leftPistonMesh.scale.y = 1 + this.currentShackleY * 1.5;
        this.rightPistonMesh.scale.y = 1 + this.currentShackleY * 1.5;
        this.leftPistonMesh.position.y = 1.4 + this.currentShackleY * 0.5;
        this.rightPistonMesh.position.y = 1.4 + this.currentShackleY * 0.5;
      }

      // 2. Animate Drum Tumblers
      for (let i = 0; i < 6; i++) {
        const drum = this.drums[i];
        if (!drum) continue;

        if (this.isAttacking) {
          // If in high-speed attack, rapid spin with staggered jitter
          const spinMultiplier = this.attackSpeedId === 'extrema' ? 38 : this.attackSpeedId === 'rapida' ? 18 : this.attackSpeedId === 'normal' ? 7 : 3;
          drum.currentAngle += dt * spinMultiplier * (1 + i * 0.12);
          drum.mesh.rotation.x = drum.currentAngle;
        } else {
          // Smoothly damp toward the exact target angle for the digit
          // Normalize angular difference
          const target = drum.targetAngle;
          const diff = Math.atan2(Math.sin(target - drum.mesh.rotation.x), Math.cos(target - drum.mesh.rotation.x));
          drum.mesh.rotation.x += diff * Math.min(1, dt * 14);
        }
      }

      // 3. Animate Verification Laser Scan Beam
      if (this.laserScanBeam) {
        if (this.isAttacking) {
          this.scanBeamX = Math.sin(now * 0.006) * 0.95;
          this.laserScanBeam.position.x = this.scanBeamX;
          this.laserScanBeam.visible = true;
        } else if (this.isUnlocked) {
          this.laserScanBeam.position.x = 0;
          this.laserScanBeam.visible = true;
        } else {
          this.laserScanBeam.visible = false;
        }
      }

      // 4. Update controls
      if (!this.isSoftwareGl) {
        this.controls.update();
      }

      // 5. Render
      this.renderer.render(this.scene, this.camera);

      // 6. Schedule next frame
      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.afterDraw(tick);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  public destroy(): void {
    this.isDestroyed = true;
    window.removeEventListener('resize', this.onResize);
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    this.controls.dispose();

    // Dispose all tracked geometries, materials, and textures
    for (const item of this.disposables) {
      try {
        item.dispose();
      } catch {
        // Guard
      }
    }

    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}

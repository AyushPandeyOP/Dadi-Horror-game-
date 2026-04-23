let scene, camera, renderer;
let player, dadi;
let velocity = { x: 0, z: 0 };
let running = false;
let clock = new THREE.Clock();

let audioCtx = new (window.AudioContext || window.webkitAudioContext)();

init();
animate();

function init() {

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 5, 40);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.y = 1.6;

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // 🔥 HORROR LIGHT
    const light = new THREE.PointLight(0xff4444, 1, 20);
    light.position.set(0, 5, 0);
    scene.add(light);

    setInterval(() => {
        light.intensity = 0.5 + Math.random();
    }, 150);

    // 🧱 FLOOR (procedural texture)
    const floorMat = new THREE.MeshStandardMaterial({
        color: 0x111111,
        roughness: 1
    });

    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(50, 50),
        floorMat
    );
    floor.rotation.x = -Math.PI/2;
    scene.add(floor);

    // 🏚️ WALLS
    for (let i = 0; i < 4; i++) {
        let wall = new THREE.Mesh(
            new THREE.BoxGeometry(50, 5, 1),
            new THREE.MeshStandardMaterial({ color: 0x222222 })
        );
        wall.position.set(
            i === 0 ? -25 : i === 1 ? 25 : 0,
            2.5,
            i === 2 ? -25 : i === 3 ? 25 : 0
        );
        if (i > 1) wall.rotation.y = Math.PI / 2;
        scene.add(wall);
    }

    // 🎮 PLAYER
    player = new THREE.Object3D();
    scene.add(player);
    player.add(camera);

    // 👵 DADI (creepy glow)
    dadi = new THREE.Mesh(
        new THREE.ConeGeometry(1, 2, 8),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    dadi.position.set(5,1,5);
    scene.add(dadi);

    document.getElementById("overlay").onclick = () => {
        document.getElementById("overlay").style.display = "none";
        playAmbient();
    };

    setupControls();
}

//////////////////////////////////////////////////
// 🔊 SOUND SYSTEM (NO FILES NEEDED)
//////////////////////////////////////////////////

function playFootstep() {
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();

    osc.type = "square";
    osc.frequency.value = 100;

    gain.gain.value = 0.05;

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

function playAmbient() {
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.value = 40;

    gain.gain.value = 0.02;

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
}

function playHeartbeat() {
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();

    osc.frequency.value = 60;
    gain.gain.value = 0.2;

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
}

function playJumpscare() {
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();

    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 0.5);

    gain.gain.value = 0.5;

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
}

//////////////////////////////////////////////////
// 🎮 CONTROLS
//////////////////////////////////////////////////

function setupControls() {

    document.getElementById("run").ontouchstart = () => running = true;
    document.getElementById("run").ontouchend = () => running = false;

    let joystick = document.getElementById("joystick");
    let dragging = false;

    joystick.addEventListener("touchstart", () => dragging = true);

    joystick.addEventListener("touchend", () => {
        dragging = false;
        velocity.x = velocity.z = 0;
    });

    joystick.addEventListener("touchmove", e => {

        if (!dragging) return;

        let touch = e.touches[0];
        let rect = joystick.getBoundingClientRect();

        velocity.x = (touch.clientX - rect.left - 50)/50;
        velocity.z = (touch.clientY - rect.top - 50)/50;
    });
}

//////////////////////////////////////////////////
// 🧠 PLAYER
//////////////////////////////////////////////////

function updatePlayer(delta) {

    let speed = running ? 5 : 2;

    player.position.x -= velocity.x * speed * delta;
    player.position.z -= velocity.z * speed * delta;

    if (velocity.x !== 0 || velocity.z !== 0) {
        playFootstep();
    }
}

//////////////////////////////////////////////////
// 👵 DADI AI (IMPROVED)
//////////////////////////////////////////////////

function updateDadi() {

    let distance = player.position.distanceTo(dadi.position);

    // SOUND DETECTION
    if (running && distance < 15) {
        dadi.position.lerp(player.position, 0.03);
    } else {
        dadi.position.x += (Math.random() - 0.5) * 0.03;
        dadi.position.z += (Math.random() - 0.5) * 0.03;
    }

    // HEARTBEAT EFFECT
    if (distance < 8) {
        playHeartbeat();
    }

    // JUMPSCARE
    if (distance < 1.5) {
        playJumpscare();

        document.body.style.background = "red";

        setTimeout(() => {
            alert("💀 Dadi caught you!");
            location.reload();
        }, 300);
    }
}

//////////////////////////////////////////////////
// 🔁 LOOP
//////////////////////////////////////////////////

function animate() {

    requestAnimationFrame(animate);

    let delta = clock.getDelta();

    updatePlayer(delta);
    updateDadi();

    renderer.render(scene, camera);
}
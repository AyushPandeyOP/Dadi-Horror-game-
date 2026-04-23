let scene, camera, renderer;
let player, dadi;
let keys = {};
let velocity = { x: 0, z: 0 };
let running = false;

let sounds = {};
let clock = new THREE.Clock();

init();
animate();

function init() {

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 5, 50);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.y = 1.6;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // LIGHT (horror flicker)
    const light = new THREE.PointLight(0xffaaaa, 1, 20);
    light.position.set(0, 5, 0);
    scene.add(light);

    setInterval(() => {
        light.intensity = Math.random() * 1.5;
    }, 200);

    // FLOOR
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(50, 50),
        new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    floor.rotation.x = -Math.PI/2;
    scene.add(floor);

    // WALL
    const wall = new THREE.Mesh(
        new THREE.BoxGeometry(50, 5, 1),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    wall.position.set(0, 2.5, -25);
    scene.add(wall);

    // PLAYER
    player = new THREE.Object3D();
    scene.add(player);
    player.add(camera);

    // DADI (enemy)
    dadi = new THREE.Mesh(
        new THREE.BoxGeometry(1,2,1),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    dadi.position.set(5,1,5);
    scene.add(dadi);

    loadSounds();

    document.getElementById("overlay").onclick = () => {
        document.getElementById("overlay").style.display = "none";
        playSound("ambient");
    };

    setupControls();
}

function loadSounds() {
    const listener = new THREE.AudioListener();
    camera.add(listener);

    const audioLoader = new THREE.AudioLoader();

    function load(name, path, loop=false) {
        const sound = new THREE.Audio(listener);
        audioLoader.load(path, buffer => {
            sound.setBuffer(buffer);
            sound.setLoop(loop);
            sound.setVolume(0.5);
        });
        sounds[name] = sound;
    }

    load("footstep", "assets/sounds/footstep.mp3");
    load("ambient", "assets/sounds/ambient.mp3", true);
    load("dadi", "assets/sounds/dadi.mp3");
    load("jump", "assets/sounds/jumpscare.mp3");
}

function playSound(name) {
    if (sounds[name] && !sounds[name].isPlaying) {
        sounds[name].play();
    }
}

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

        let x = (touch.clientX - rect.left - 50)/50;
        let y = (touch.clientY - rect.top - 50)/50;

        velocity.x = x;
        velocity.z = y;
    });
}

function updatePlayer(delta) {
    let speed = running ? 5 : 2;

    player.position.x -= velocity.x * speed * delta;
    player.position.z -= velocity.z * speed * delta;

    if (velocity.x !== 0 || velocity.z !== 0) {
        playSound("footstep");
    }
}

function updateDadi(delta) {
    let distance = player.position.distanceTo(dadi.position);

    // SOUND DETECTION
    if (running && distance < 15) {
        moveTowardsPlayer();
        playSound("dadi");
    } else {
        randomRoam();
    }

    if (distance < 1.5) {
        playSound("jump");
        alert("Dadi caught you!");
        location.reload();
    }
}

function moveTowardsPlayer() {
    dadi.position.lerp(player.position, 0.02);
}

function randomRoam() {
    dadi.position.x += (Math.random() - 0.5) * 0.05;
    dadi.position.z += (Math.random() - 0.5) * 0.05;
}

function animate() {
    requestAnimationFrame(animate);

    let delta = clock.getDelta();

    updatePlayer(delta);
    updateDadi(delta);

    renderer.render(scene, camera);
}
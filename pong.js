import * as THREE from 'three';
import { LineMaterial } from 'jsm/lines/LineMaterial.js';
import { LineGeometry } from 'jsm/lines/LineGeometry.js';
import { Line2 } from 'jsm/lines/Line2.js';
import { OrbitControls } from 'jsm/controls/OrbitControls.js';
import { EffectComposer } from 'jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'jsm/postprocessing/UnrealBloomPass.js';
import { AfterimagePass } from 'jsm/postprocessing/AfterimagePass.js';

let colorField = 'black';
let player1Color = 0x00ff00;
let player2Color = 'purple';

let numHit = 0;
let speedIncrement = 0.025;
let ballSpeedReachedMax = false;
let isPaused = false;

const bloomLayer = 1;

// Scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Orbital Control
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;  // Damping movement for fluidity
controls.dampingFactor = 0.25;  // Ajust the fluidity
controls.enableZoom = true;     // Activate zoom
controls.enablePan = true;      // Move the camera horizontaly and verticaly


// Camera position
camera.position.set(0, 6.5, 10);
camera.lookAt(0, 0, 0);
camera.layers.enable(1);

//////////////////////////////// FIELD ////////////////////////////////
const fieldThickness = 0.2;
const fieldSize = { width: 12, height: 12 };
const field3D = new THREE.Mesh(
    new THREE.BoxGeometry(fieldSize.width, fieldThickness, fieldSize.height),
    new THREE.MeshBasicMaterial({ color: colorField })
);
field3D.position.y = fieldThickness / 2 + 0.5; // Floating
const fieldHeight = field3D.position.y + fieldThickness / 2; // Position of Field + Half of the field's thickness
scene.add(field3D);
// Visualization
const gridSize = 12
const gridDivision = 12;
const cellSize = gridSize / gridDivision;
const circles = [];
// Circles over the field
function createCircles(x, z, radius = 0.3) {
    const CirclesGeometry = new THREE.CircleGeometry(radius, 64);
    const CirclesMaterial = new THREE.MeshBasicMaterial({ color: colorField });
    const circle = new THREE.Mesh(CirclesGeometry, CirclesMaterial);
    circle.position.set(x, fieldHeight + 0.02, z);
    circle.rotation.x = -Math.PI / 2;
    scene.add(circle);
    return (circle);
}
for (let x = -gridSize / 2 + cellSize / 2; x <= gridSize / 2; x += cellSize) {
    for (let z = -gridSize / 2 + cellSize / 2; z <= gridSize / 2; z += cellSize) {
        const circle = createCircles(x, z);
        circles.push(circle); // Add every circle to the []
    }
}
// Highlight the field && Pause
function highlightCircles(playerColor) {
    isPaused = true;
    circles.forEach((circle) => {
        circle.material.color.set(playerColor);
    });
    setTimeout(() => {
        circles.forEach((circle) => {
            circle.material.color.set(colorField);
        });
    }, 1000); // 1sec delay
    window.addEventListener('keydown', handleKeyPress);
}
// Continue the game
function handleKeyPress(event) {
    if (event.code === 'Space' || event.code === 'Enter') {
        isPaused = false;
        window.removeEventListener('keydown', handleKeyPress);
    }
}

// Neon field
const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x00ffff, emissive: 0x00ffff
});
// Fields Lines
const fieldLineGeometry = new THREE.BufferGeometry().setFromPoints([
     // Up
     new THREE.Vector3(-6, fieldHeight + 0.01, -6), // top-left
     new THREE.Vector3(6, fieldHeight + 0.01, -6),  // top-right
     new THREE.Vector3(6, fieldHeight + 0.01, -6),  // top-right
     new THREE.Vector3(6, fieldHeight + 0.01, 6),   // bottom-right
     new THREE.Vector3(6, fieldHeight + 0.01, 6),   // bottom-right
     new THREE.Vector3(-6, fieldHeight + 0.01, 6),  // bottom-left
     new THREE.Vector3(-6, fieldHeight + 0.01, 6),  // bottom-left
     new THREE.Vector3(-6, fieldHeight + 0.01, -6), // top-left
     // Down
     new THREE.Vector3(-6, fieldHeight - fieldThickness, -6), // bottom-top-left
     new THREE.Vector3(6, fieldHeight - fieldThickness, -6),  // bottom-top-right
     new THREE.Vector3(6, fieldHeight - fieldThickness, -6),  // bottom-top-right
     new THREE.Vector3(6, fieldHeight - fieldThickness, 6),   // bottom-bottom-right
     new THREE.Vector3(6, fieldHeight - fieldThickness, 6),   // bottom-bottom-right
     new THREE.Vector3(-6, fieldHeight - fieldThickness, 6),  // bottom-bottom-left
     new THREE.Vector3(-6, fieldHeight - fieldThickness, 6),  // bottom-bottom-left
     new THREE.Vector3(-6, fieldHeight - fieldThickness, -6), // bottom-top-left
     // Vertical Connectors
     new THREE.Vector3(-6, fieldHeight + 0.01, -6), // top-left
     new THREE.Vector3(-6, fieldHeight - fieldThickness, -6), // bottom-top-left
     new THREE.Vector3(6, fieldHeight + 0.01, -6), // top-right
     new THREE.Vector3(6, fieldHeight - fieldThickness, -6), // bottom-top-right
     new THREE.Vector3(6, fieldHeight + 0.01, 6), // bottom-right
     new THREE.Vector3(6, fieldHeight - fieldThickness, 6), // bottom-bottom-right
     new THREE.Vector3(-6, fieldHeight + 0.01, 6), // bottom-left
     new THREE.Vector3(-6, fieldHeight - fieldThickness, 6), // bottom-bottom-left
    // Central line
    new THREE.Vector3(-6, fieldHeight + 0.01, 0),
    new THREE.Vector3(6, fieldHeight + 0.01, 0)
]);
// Create field half circle
function createHalfCircle(centerX, centerZ, radius, startAngle, endAngle) {
    const points = [];
    const segments = 64; // More is smoother
    for (let i = 0; i <= segments; i++) {
        const angle = startAngle + (endAngle - startAngle) * (i / segments);
        points.push(new THREE.Vector3(
            centerX + radius * Math.cos(angle),
            fieldHeight + 0.04,
            centerZ + radius * Math.sin(angle)
        ));
    }
    return points;
}
const leftHalfCircle = createHalfCircle(0, -6, 3, 0, Math.PI);
const rightHalfCircle = createHalfCircle(0, 6, 3, Math.PI, 2 * Math.PI);
const halfLeftCircleGeometry = new THREE.BufferGeometry().setFromPoints(leftHalfCircle);
const halfRightCircleGeometry = new THREE.BufferGeometry().setFromPoints(rightHalfCircle);
const halfLeftCircleLines = new THREE.Line(halfLeftCircleGeometry, lineMaterial);
const halfRightCircleLines = new THREE.Line(halfRightCircleGeometry, lineMaterial);
const neonLine = new THREE.LineSegments(fieldLineGeometry, lineMaterial);
scene.add(neonLine, halfLeftCircleLines, halfRightCircleLines);

const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.2, 0, 0); // Resolution, strength, radius, treshold(0 = everything, 1 = nothing)
const afterImagePass = new AfterimagePass(); // Create the "trail"
afterImagePass.uniforms["damp"].value = 0.7; // The more, the more the tail is long
const bloomComposer = new EffectComposer(renderer); // New renderer
bloomComposer.addPass(renderScene);
bloomComposer.addPass(bloomPass);
bloomComposer.addPass(afterImagePass);

//////////////////////////////// LIGHT ////////////////////////////////
const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
scene.add(ambientLight);

//////////////////////////////// PADDLES ////////////////////////////////
// Generate the edges points of the capsule
const generateCapsuleOutline = (radius, height, radialSegments) => {
    const positions = [];
    const segmentStep = Math.PI / radialSegments;
    // Top
    for (let theta = 0; theta <= Math.PI; theta += segmentStep) {
        const x = radius * Math.cos(theta);
        const y = height / 2 + radius * Math.sin(theta);
        positions.push(x, y, 0);
    }
    // Close the top adding an invisible break
    positions.push(NaN, NaN, NaN); // Nan separates the segments
    // Bot
    for (let theta = 0; theta <= Math.PI; theta += segmentStep) {
        const x = radius * Math.cos(Math.PI - theta);
        const y = -height / 2 - radius * Math.sin(Math.PI - theta);
        positions.push(x, y, 0);
    }
    positions.push(NaN, NaN, NaN);
    // Vertical lines 
    positions.push(radius, height / 2, 0); // Right
    positions.push(radius, -height / 2, 0);
    positions.push(NaN, NaN, NaN);
    positions.push(-radius, height / 2, 0); // Left
    positions.push(-radius, -height / 2, 0);
    return positions;
};
// Create edges's geometry
const radius = 0.25; // Capsule's Radius
const height = 1.5; // Height between the two hemisphers
const radialSegments = 64; // More segments = more details
const capsuleOutlinePositions = generateCapsuleOutline(radius, height, radialSegments);
const paddleLineGeometry = new LineGeometry();
paddleLineGeometry.setPositions(capsuleOutlinePositions);
const paddleLineMaterial1 = new LineMaterial({
    color: player1Color, linewidth: 5, dashed: false, resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
});
const paddleLineMaterial2 = new LineMaterial({
    color: player2Color, linewidth: 3, dashed: false, resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
});
const paddle1 = new Line2(paddleLineGeometry, paddleLineMaterial1);
const paddle2 = new Line2(paddleLineGeometry, paddleLineMaterial2);
paddle1.computeLineDistances(); // Needed for not dashed
paddle2.computeLineDistances();
paddle1.rotation.z = Math.PI / 2;
paddle1.rotation.x = -Math.PI / 4;
paddle2.rotation.z = Math.PI / 2;
paddle2.rotation.x = -Math.PI / 4;
paddle1.position.set(0, fieldHeight + 0.2, 6.5);
paddle2.position.set(0, fieldHeight + 0.2, -6.5);
paddle1.layers.set(bloomLayer);
paddle2.layers.set(bloomLayer);
scene.add(paddle1, paddle2);

//////////////////////////////// BALL && TORUS ////////////////////////////////
const ballGeometry = new THREE.SphereGeometry(0.2, 64, 64);
const ballMaterial = new THREE.MeshStandardMaterial({ color: 'yellow', emissive: 'yellow' });
const ball = new THREE.Mesh(ballGeometry, ballMaterial);
ball.position.set(0, fieldHeight + 0.2, 0);
scene.add(ball);

let ballSpeed = { x: 0, z: 0.05 }; // Direction and Speed of the ball
let lastScorer = null;
const MAX_BALL_WITH_CROSS_SPEED = 0.2;

//////////////////////////////// SCORE ////////////////////////////////
let score1 = 0, score2 = 0;
const scoreElement = document.createElement('div');
scoreElement.style.position = 'absolute';
scoreElement.style.top = '20px';
scoreElement.style.left = '50%';
scoreElement.style.transform = 'translateX(-50%)';
scoreElement.style.fontSize = '48px';
scoreElement.style.fontFamily = '"Orbitron", sans-serif';
scoreElement.style.letterSpacing = '4px';
scoreElement.style.color = '#0ff';
scoreElement.style.textShadow = '0 0 3px #0ff, 0 0 5px #0ff, 0 0 8px #00f, 0 0 12px #00f';
scoreElement.style.transition = 'transform 0.1s ease-out'; // Animation for changing score
document.body.appendChild(scoreElement);

scoreElement.style.animation = 'neonGlow 1.5s infinite alternate'; // Pulsating animation
const style = document.createElement('style');
style.textContent = `@keyframes neonGlow {
        0% { text-shadow: 0 0 2px #0ff,  0 0 4px #0ff,  0 0 6px #00f, 0 0 8px #00f; }
        100% { text-shadow: 0 0 3px #0ff, 0 0 5px #0ff, 0 0 7px #00f, 0 0 10px #00f; }
}`;
document.head.appendChild(style);

function updateScores() {
    scoreElement.textContent = `${score1} - ${score2}`;
    scoreElement.style.transform = 'translateX(-50%) scale(1.2)';
    setTimeout(() => {
        scoreElement.style.transform = 'translateX(-50%) scale(1)';
    }, 100);
}
updateScores();

//////////////////////////////// KEYS PRINT ////////////////////////////////
// Keys creation
const keysPrint = [
    { key: "Q", side: "left", top: "25%" },  // Position for Q
    { key: "D", side: "left", top: "40%" },  // Position for D
    { key: "←", side: "right", top: "25%" }, // Position for ←
    { key: "→", side: "right", top: "40%" }  // Position for →
];

keysPrint.forEach(({ key, side, top }) => {
    const keyElement = document.createElement("div");
    keyElement.textContent = key;
    keyElement.classList.add("key-display", side);
    keyElement.style.position = 'absolute';
    keyElement.style.top = top;
    document.body.appendChild(keyElement);
});

// CSS style
const styleKeys = document.createElement("style");
styleKeys.textContent = `
    .key-display {
        width: 50px;
        height: 50px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.2);
        color: white;
        opacity: 0.5;
        font-size: 24px;
        font-family: 'Orbitron', sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid rgba(255, 255, 255, 0.4);
        box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
        transition: transform 0.1s ease-out, background 0.1s ease-out;
    }

    .left { left: 20px; }
    .right { right: 20px; }

    .key-pressed {
        transform: scale(1.1);
        background: rgba(255, 255, 255, 0.2);
        border: 2px solid rgba(255, 255, 255, 0.6);
        box-shadow: 0 0 5px rgba(255, 255, 255, 0.6), 0 0 10px rgba(255, 255, 255, 0.6);
    }
`;
document.head.appendChild(styleKeys);

// Visual effect when pressed
document.addEventListener("keydown", (event) => {
    const key = event.key;
    const keyElements = document.querySelectorAll(".key-display");
    
    keyElements.forEach((element) => {
        // For Q & D
        if (element.textContent.toUpperCase() === key.toUpperCase() || 
            (key === "ArrowLeft" && element.textContent === "←") || 
            (key === "ArrowRight" && element.textContent === "→")) {
            element.classList.add("key-pressed");
        }
    });
});

document.addEventListener("keyup", (event) => {
    const key = event.key;
    const keyElements = document.querySelectorAll(".key-display");
    
    keyElements.forEach((element) => {
        // For Q & D
        if (element.textContent.toUpperCase() === key.toUpperCase() || 
            (key === "ArrowLeft" && element.textContent === "←") || 
            (key === "ArrowRight" && element.textContent === "→")) {
            element.classList.remove("key-pressed");
        }
    });
});

// Key pressed detection
const keys = { ArrowRight: false, ArrowLeft: false, KeyA: false, KeyD: false };
window.addEventListener('keydown', (e) => { if (keys.hasOwnProperty(e.code)) keys[e.code] = true; });
window.addEventListener('keyup', (e) => { if (keys.hasOwnProperty(e.code)) keys[e.code] = false; });

// Paddle movement
let paddleSpeed = 0.1;
const MAX_PADDLE_SPEED = 0.15;
function movePaddles() {
    if (keys.KeyA && paddle1.position.x > -5) paddle1.position.x -= paddleSpeed;
    if (keys.KeyD && paddle1.position.x < 5) paddle1.position.x += paddleSpeed;

    if (keys.ArrowLeft && paddle2.position.x > -5) paddle2.position.x -= paddleSpeed;
    if (keys.ArrowRight && paddle2.position.x < 5) paddle2.position.x += paddleSpeed;
}

function highlightGoalEffect(position, color) {
    const particleCount = 100;
    const positions = [];
    const velocities = [];
    for (let i = 0; i < particleCount; i++) { // Fill the []
        const x = position.x + (Math.random() - 0.5) * 2; // Random around the position
        const y = position.y + (Math.random() - 0.5) * 2;
        const z = position.z + (Math.random() - 0.5) * 2;
        positions.push(x, y, z);
        velocities.push((Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1)
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color: color, size: 0.01, sizeAttenuation: true });
    const particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);

    let t = 0;
    function animateParticles() {
        t += 0.02;
        material.size = Math.min(material.size + 0.05, 0.25);
        const posArray = geometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            posArray[i * 3] += velocities[i * 3]; // X
            posArray[i * 3 + 1] += velocities[i * 3 + 1]; // Y
            posArray[i * 3 + 2] += velocities[i * 3 + 2]; // Z
        }
        geometry.attributes.position.needsUpdate = true;
        if (t < 1) {
            requestAnimationFrame(animateParticles);
        } else {
            scene.remove(particleSystem); // Remove after the effect
        }
    }
    animateParticles();
}

let isZooming = false;

function zoomEffect(callback) {
    if (isZooming) return; // Avoid multiple zooms
    isZooming = true;
    const targetPosition = 12; // Move the camera
    const zoomSpeed = 0.01;

    const zoomAnimation = () => {
        if (camera.position.z < targetPosition) {
            camera.position.z += zoomSpeed; // Zoom back
            camera.position.y += zoomSpeed; // Zoom up
            requestAnimationFrame(zoomAnimation);
        } else {
            camera.position.z = targetPosition; // Stop the zoom
            isZooming = false;
            if (callback) callback(); // Call reset after zoom
        }
    };
    zoomAnimation();
}

//////////////////////////////// RESET ////////////////////////////////
function reset() {
    paddle1.position.set(0, fieldHeight + 0.2, 6.5);
    paddle2.position.set(0, fieldHeight + 0.2, -6.5);
    ball.position.set(0, fieldHeight + 0.2, 0);
    isZooming = false;
    camera.position.set(0, 6.5, 10);
    paddleSpeed = 0.1;
    numHit = 0;
    if (lastScorer === 1) {
        ballSpeed = { x: 0, z: -0.05 }
    }
    else if (lastScorer === 2) {
        ballSpeed = { x: 0, z: 0.05 }
    }
}

//////////////////////////////// COLLISION ////////////////////////////////
function checkCollision() {
    // Paddle1 (green)
    if (
        ball.position.z > 6 && ball.position.z < 7 && Math.abs(ball.position.x - paddle1.position.x) < 1.5) {
        const offset = ball.position.x - paddle1.position.x; // Distance from paddle center
        const maxBounceAngle = Math.PI / 3; // Max 45°
        const bounceAngle = (offset / 1.5) * maxBounceAngle; // Scale angle based on offset

        const speed = Math.sqrt(ballSpeed.x ** 2 + ballSpeed.z ** 2); // Preserve speed
        ballSpeed.x = speed * Math.sin(bounceAngle);
        ballSpeed.z = -Math.abs(speed * Math.cos(bounceAngle)); // Ensure ball moves upward
        numHit++;
    }
    // Paddle2 (purple)
    if (
        ball.position.z < -6 && ball.position.z > -7 && Math.abs(ball.position.x - paddle2.position.x) < 1.5) {
        const offset = ball.position.x - paddle2.position.x; // Distance from paddle center
        const maxBounceAngle = Math.PI / 3; // Max 45°
        const bounceAngle = (offset / 1.5) * maxBounceAngle; // Scale angle based on offset

        const speed = Math.sqrt(ballSpeed.x ** 2 + ballSpeed.z ** 2); // Preserve speed
        ballSpeed.x = speed * Math.sin(bounceAngle);
        ballSpeed.z = Math.abs(speed * Math.cos(bounceAngle)); // Ensure ball moves downward
        numHit++;
    }
    // Increase speed every 5 hits
    if (numHit >= 5) {
        ballSpeed.x += Math.sign(ballSpeed.x) * speedIncrement; // Horizontaly
        ballSpeed.z += Math.sign(ballSpeed.z) * speedIncrement; // Verticaly
        ballSpeed.x = Math.min(Math.abs(ballSpeed.x), MAX_BALL_WITH_CROSS_SPEED) * Math.sign(ballSpeed.x);
        ballSpeed.z = Math.min(Math.abs(ballSpeed.z), MAX_BALL_WITH_CROSS_SPEED) * Math.sign(ballSpeed.z);
        if (Math.abs(ballSpeed.x) === MAX_BALL_WITH_CROSS_SPEED && !ballSpeedReachedMax) { ballSpeedReachedMax = true; }
        paddleSpeed = Math.min(paddleSpeed + speedIncrement, MAX_PADDLE_SPEED);
        numHit = 0;
    }
    // Walls collision
    if (ball.position.x < -6 || ball.position.x > 6) {
        ballSpeed.x *= -1;
    }
    // Score
    if (ball.position.z > 6.5) {
        score2++;
        lastScorer = 2;
        highlightCircles(player2Color);
        highlightGoalEffect(ball.position, player2Color);
        reset();
        updateScores();
    }
    if (ball.position.z < -6.5) {
        score1++;
        lastScorer = 1;
        highlightCircles(player1Color);
        highlightGoalEffect(ball.position, player1Color);
        reset();
        updateScores();
    }
    if (score1 > 9 || score2 > 9) {
        zoomEffect();
    }
}

// Create HTML element to print informations
const infoElement = document.createElement('div');
infoElement.style.position = 'absolute';
infoElement.style.top = '50px'; // Position sous le score
infoElement.style.left = '50%';
infoElement.style.transform = 'translateX(-50%)';
infoElement.style.color = 'white';
infoElement.style.fontSize = '18px';
infoElement.style.fontFamily = 'Arial, sans-serif';
document.body.appendChild(infoElement);

// Render loop
function animate() {
    if (!isPaused) {
        movePaddles();
        ball.position.x += ballSpeed.x;
        ball.position.z += ballSpeed.z;
        checkCollision();
        // updateInfo();
    }
    bloomComposer.render();
    requestAnimationFrame(animate);
}
animate();

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
})
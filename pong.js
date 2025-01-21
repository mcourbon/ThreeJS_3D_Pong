import * as THREE from './node_modules/three/build/three.module.js';

// Scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Background color
scene.background = new THREE.Color(0x000000);


// Camera position
camera.position.set(0, 7, 10);
camera.lookAt(0, 0, 0);

// Field
const fieldThickness = 0.2;
const fieldSize = { width: 12, height: 12 };
const field3D = new THREE.Mesh(
	new THREE.BoxGeometry(fieldSize.width, fieldThickness, fieldSize.height),
	new THREE.MeshStandardMaterial({ color: 0x228b22 })
);
field3D.position.y = fieldThickness / 2 + 0.5; // Floating
const fieldHeight = field3D.position.y + fieldThickness / 2; // Position of Field + Half of the field's thickness
scene.add(field3D);
// Shadow of field
const shadow = new THREE.Mesh(
	new THREE.CircleGeometry(fieldSize.width / 2, 64),
	new THREE.MeshStandardMaterial({ color: 0x000000, transparent: true, opacity: 0.5 })
);
shadow.rotation.x = -Math.PI / 2; // On the Ground
shadow.position.y = 0.01;
scene.add(shadow);
// Visualization
const gridHelper = new THREE.GridHelper(fieldSize.width, 12, 0xffffff, 0x808080);
gridHelper.position.y = field3D.position.y + fieldThickness / 2 + 0.01; // Slithly above the field
scene.add(gridHelper);

// Neon field
const lineMaterial = new THREE.LineBasicMaterial({
	color: 0x00ffff, emissive: 0x00ffff, linewidth: 5
});
// Fields Lines
const lineGeometry = new THREE.BufferGeometry().setFromPoints([
	new THREE.Vector3(-6, fieldHeight + 0.01, -6),
	new THREE.Vector3(6, fieldHeight + 0.01, -6),
	new THREE.Vector3(6, fieldHeight + 0.01, -6),
	new THREE.Vector3(6, fieldHeight + 0.01, 6),
	new THREE.Vector3(6, fieldHeight + 0.01, 6),
	new THREE.Vector3(-6, fieldHeight + 0.01, 6),
	new THREE.Vector3(-6, fieldHeight + 0.01, 6),
	new THREE.Vector3(-6, fieldHeight + 0.01, -6),
]);
const neonLine = new THREE.LineSegments(lineGeometry, lineMaterial);
scene.add(neonLine);

// Paddles shape
const paddleGeometry = new THREE.CapsuleGeometry(0.25, 1.5, 32, 32);
const neonMaterial1 = new THREE.MeshStandardMaterial({
	color: 0x00ff00, 		// Neon color
	emissive: 0x00ff00, 	// Luminance of color
	emissiveIntensity: 1,	// Intensity of neon 
	roughness: 0.1,			// Less rough for more shiness
	metalness: 0.8			// Metal for more reflexion
});
const neonMaterial2 = new THREE.MeshStandardMaterial({ 
	color: 'purple', emissive: 'purple', emissiveIntensity: 1, roughness: 0.1, metalness: 0.8
});
const paddle1 = new THREE.Mesh(paddleGeometry, neonMaterial1);
const paddle2 = new THREE.Mesh(paddleGeometry, neonMaterial2);
// Rotate the cylinder
paddle1.rotation.z = Math.PI / 2;
paddle2.rotation.z = Math.PI / 2;	
// Paddles positions
paddle1.position.set(0, fieldHeight + 0.2, 6.5);
paddle2.position.set(0, fieldHeight + 0.2, -6.5);
scene.add(paddle1, paddle2);

// Ball
const ball = new THREE.Mesh(
	new THREE.SphereGeometry(0.2, 32, 32),
	new THREE.MeshStandardMaterial({
		color: 'red', emissive: 'red', emissiveIntensity: 1, roughness: 0.1, metalness: 0.5
	})
);
ball.position.set(0, fieldHeight + 0.2, 0);
scene.add(ball);
let ballSpeed = { x:0, z: 0.1 }; // Direction and Speed of the ball
let lastScorer = null;
const MAX_BALL_SPEED = 0.5;

let numHit = 0;
let speedIncrement = 0.025;

// Reset all
function reset() {
	paddle1.position.set(0, fieldHeight + 0.2, 6.5);
	paddle2.position.set(0, fieldHeight + 0.2, -6.5);
	ball.position.set(0, fieldHeight + 0.2, 0);
	paddleSpeed = 0.2;
	if (lastScorer === 1) {
		ballSpeed = { x:0, z: -0.1 }
	}
	else if (lastScorer === 2) {
		ballSpeed = { x:0, z: 0.1 }
	}
}

// Score
let score1 = 0, score2 = 0;
const scoreElement = document.createElement('div');
scoreElement.style.position = 'absolute';
scoreElement.style.top = '20px';
scoreElement.style.left = '50%';
scoreElement.style.transform = 'translateX(-50%)';
scoreElement.style.color = 'white';
scoreElement.style.fontSize = '24px';
scoreElement.style.fontFamily = 'Arial, sans-serif';
document.body.appendChild(scoreElement);

function updateScores() {
 scoreElement.textContent = `${score1} - ${score2}`;
}
updateScores();

// Key pressed detection
const keys = { ArrowRight: false, ArrowLeft: false, KeyA: false, KeyD: false };
window.addEventListener('keydown', (e) => { if (keys.hasOwnProperty(e.code)) keys[e.code] = true; });
window.addEventListener('keyup', (e) => { if (keys.hasOwnProperty(e.code)) keys[e.code] = false; });

// Paddle movement
let paddleSpeed = 0.2;
const MAX_PADDLE_SPEED = 0.5;
function movePaddles() {
	if (keys.KeyA && paddle1.position.x > -5) paddle1.position.x -= paddleSpeed;
	if (keys.KeyD && paddle1.position.x < 5) paddle1.position.x += paddleSpeed;

	if (keys.ArrowLeft && paddle2.position.x > -5) paddle2.position.x -= paddleSpeed;
	if (keys.ArrowRight && paddle2.position.x < 5) paddle2.position.x += paddleSpeed;
}

// Collision
function checkCollision() {
    // Paddle1 (blue)
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
    // Paddle2 (red)
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
		paddleSpeed = Math.min(paddleSpeed + speedIncrement, MAX_PADDLE_SPEED);
		numHit = 0;
	}
	// Ball's speed limit
	ballSpeed.x = Math.min(Math.max(ballSpeed.x, -MAX_BALL_SPEED), MAX_BALL_SPEED);
	ballSpeed.z = Math.min(Math.max(ballSpeed.z, -MAX_BALL_SPEED), MAX_BALL_SPEED);
    // Walls collision
    if (ball.position.x < -6 || ball.position.x > 6) {
        ballSpeed.x *= -1;
    }
    // Score
    if (ball.position.z > 6.5) {
        score2++;
		lastScorer = 2;
        reset();
        updateScores();
    }
    if (ball.position.z < -6.5) {
        score1++;
		lastScorer = 1;
        reset();
        updateScores();
    }
}

// Créer un élément HTML pour afficher les informations
const infoElement = document.createElement('div');
infoElement.style.position = 'absolute';
infoElement.style.top = '50px'; // Position sous le score
infoElement.style.left = '50%';
infoElement.style.transform = 'translateX(-50%)';
infoElement.style.color = 'white';
infoElement.style.fontSize = '18px';
infoElement.style.fontFamily = 'Arial, sans-serif';
document.body.appendChild(infoElement);

// Fonction pour mettre à jour l'affichage des informations
function updateInfo() {
    // Vérification des valeurs avant de les afficher
    const numHitsText = (typeof numHit === 'number' && !isNaN(numHit)) ? numHit : 0;
    const ballSpeedXText = (typeof ballSpeed.x === 'number' && !isNaN(ballSpeed.x)) ? ballSpeed.x.toFixed(2) : '0.00';
    const ballSpeedZText = (typeof ballSpeed.z === 'number' && !isNaN(ballSpeed.z)) ? ballSpeed.z.toFixed(2) : '0.00';

    infoElement.textContent = `numHits: ${numHitsText} | Speed: x: ${ballSpeedXText} | z: ${ballSpeedZText} | paddleSpeed: ${paddleSpeed.toFixed(2)}`;
}


// Render loop
function animate() {
	movePaddles();
	ball.position.x += ballSpeed.x;
	ball.position.z += ballSpeed.z;
	checkCollision();
	updateInfo();	
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
animate();
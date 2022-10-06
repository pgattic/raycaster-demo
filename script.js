"use strict";
const pi=Math.PI,
testMode=true;
function deg2rad(deg){return deg/180*pi}
function rad2deg(rad){return rad/pi*180}

var // pause menu options
	playerSensitivity = 50,
	resolution = 2, // pixel width of vertical bars
	playerFOV = deg2rad(75),
	crosshairSize = 8,
	fisheye = false,
	keysControl = true,
	mouseControl = false,
	paused = false;

const
	pauseMenu = document.getElementById("pause"),
	sensitivitySlider = document.getElementById("sensitivitySlider"),
	raySlider = document.getElementById("raySlider"),
	FOVSlider = document.getElementById("FOVSlider"),
	fisheyeBox = document.getElementById("fisheyeBox"),
	keyboardBox = document.getElementById("keyboardBox"),
	mouseBox = document.getElementById("mouseBox");

sensitivitySlider.oninput = () => {
	playerSensitivity = Number(sensitivitySlider.value);
	sensitivitySlider.previousSibling.innerText = "Sensitivity: " + playerSensitivity;
}
raySlider.oninput = () => {
	resolution = Number(raySlider.value);
	numOfRays = renderer.width / resolution;
	raySlider.previousSibling.innerText = "Ray Spacing (to reduce lag): " + resolution;
}
FOVSlider.oninput = () => {
	playerFOV = deg2rad(Number(FOVSlider.value));
	blockHeightMultiple = 27000 * (pi / playerFOV) * (renderer.width / 1366) * (blockSize / 64);
	FOVSlider.previousSibling.innerText = "FOV: " + FOVSlider.value + "°";
}
fisheyeBox.oninput = () => {
	fisheye = fisheyeBox.checked;
}
keyboardBox.oninput = () => {
	keysControl = keyboardBox.checked;
}
mouseBox.oninput = () => {
	mouseControl = mouseBox.checked;
}
function togglePause() {
	paused = !paused;
	pauseMenu.style.display = paused ? "grid" : "none";
}

const
	canvas = document.getElementById("canvas"),
	ctx = canvas.getContext("2d"),
	renderer = document.getElementById("renderer"),
	rtx = renderer.getContext("2d"),
	level = [
		[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
		[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
		[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
		[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
		[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
		[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
		[1, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
		[1, 2, 0, 3, 0, 4, 0, 5, 0, 6, 0, 7, 0, 8, 0, 9],
		[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
		[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
		[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
		[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
		[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
		[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
		[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
		[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
	],
	semiTransparentBlocks = [2, 3],
	transparentBlocks = [0, 2, 3, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
	passableBlocks = [0, 2, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
	colorDefs = [
		[0, 0],
		[0, 0],
		[0, 70],
		[120, 70],
		[240, 70],
		[60, 70],
		[180, 40],
		[300, 70],
		[32, 70],
	],
	
	blockSize = testMode ? 16 : 1,
	playerRadius = blockSize / 8,
	floorZ = -0.2,
	levelWidth = level.reduce(function (a, b) { return a.length > b.length ? a : b; }).length,
	gameDimensions = [levelWidth, level.length],
//	playerSpeed = 5 * (blockSize / 64),
	bounceConstant = 0,
	floorFriction = 0.9,
	jumpVelocity = 0.053,
	fallAcceleration = 0.002,
	walkAcceleration = 0.5 * (blockSize / 64);

renderer.width = innerWidth;
renderer.height = innerHeight;

if (testMode) {
	renderer.width = innerWidth / 2;
	canvas.width = gameDimensions[0] * blockSize;
	canvas.height = gameDimensions[1] * blockSize;
	renderer.style.position = "auto";
	renderer.style.left = "auto";
	renderer.style.top = "auto";
	canvas.style.display = "initial";
}

var
	numOfRays = renderer.width / resolution,
	blockHeightMultiple = 27000 * ((pi) / playerFOV) * (renderer.width / 1366) * (blockSize / 64),
	startPos = [canvas.width / 2, canvas.height / 2],
	player = {
		x: blockSize * 1.5,
		y: level.length * blockSize - blockSize * 1.5,
		z: floorZ,
		xVel: 0,
		yVel: 0,
		zVel: 0,
		direction: pi* 3/2,
		upPressed:    false,
		downPressed:  false,
		leftPressed:  false,
		rightPressed: false,
		spacePressed: false,
		shiftPressed: false,
		lookingLef :  false,
		lookingRight: false,
	},
	flicker = false;

function correctDirection(){while(player.direction<0){player.direction+=pi*2}while(player.direction>=pi*2){player.direction-=pi*2}}

renderer.onclick=()=>{if(mouseControl){renderer.requestPointerLock()}}

document.onmousemove = (e) => {
	if (mouseControl && !paused) {
		player.direction += e.movementX * playerSensitivity / 10000;
		correctDirection();
	}
}

window.onresize = () => {
	renderer.width = innerWidth;
	renderer.height = innerHeight;
	if (testMode) {
		renderer.width = innerWidth / 2;
	}
	numOfRays = renderer.width / resolution,
	blockHeightMultiple = 27000 * (pi / playerFOV) * (renderer.width / 1366) * (blockSize / 64);
}


document.onkeydown = (e) => {
	switch (e.key.toLowerCase()) {
		case "w": player.upPressed = true; break;
		case "s": player.downPressed = true; break;
		case "a": player.leftPressed = true; break;
		case "d": player.rightPressed = true; break;
		case " ": player.spacePressed = true; break;
		case "arrowleft": player.lookingLeft = true; break;
		case "arrowright": player.lookingRight = true; break;
	}
	if (e.key == "Escape") togglePause();
}

document.onkeyup = (e) => {
	switch (e.key.toLowerCase()) {
		case "w": player.upPressed = false; break;
		case "s": player.downPressed = false; break;
		case "a": player.leftPressed = false; break;
		case "d": player.rightPressed = false; break;
		case " ": player.spacePressed = false; break;
		case "arrowleft": player.lookingLeft = false; break;
		case "arrowright": player.lookingRight = false; break;
	}
}

function doWalls(i,e,o,x){if(player.x>e*blockSize-playerRadius&&player.x<=(e+1)*blockSize+playerRadius&&player.y>i*blockSize-playerRadius&&player.y<=(i+1)*blockSize+playerRadius)x?(player.x=o,player.xVel=-player.xVel*bounceConstant):(player.y=o,player.yVel=-player.yVel*bounceConstant)}

function movePlayer() { // movement is split into x and y in order for wall collision to be implemented easier.
	player.xVel *= floorFriction; player.yVel *= floorFriction;

	if (player.upPressed)	{ player.xVel += walkAcceleration * (Math.cos(player.direction)); player.yVel += walkAcceleration * (Math.sin(player.direction)) }
	if (player.downPressed) { player.xVel -= walkAcceleration * (Math.cos(player.direction)); player.yVel -= walkAcceleration * (Math.sin(player.direction)) }
	if (player.leftPressed) { player.xVel += walkAcceleration * (Math.sin(player.direction)); player.yVel -= walkAcceleration * (Math.cos(player.direction)) }
	if (player.rightPressed){ player.xVel -= walkAcceleration * (Math.sin(player.direction)); player.yVel += walkAcceleration * (Math.cos(player.direction)) }

	var oldCoords = [player.x, player.y];
	player.x += player.xVel;
	for(var i=0;i<level.length;i++){for(var e=0;e<level[i].length;e++) { if (!(passableBlocks.includes(level[i][e]))) { doWalls(i, e, oldCoords[0], true) }}}
	player.y += player.yVel;
	for(var i=0;i<level.length;i++){for(var e=0;e<level[i].length;e++) { if (!(passableBlocks.includes(level[i][e]))) { doWalls(i, e, oldCoords[1], false) }}}	
}

function jumpPlayer() {
	if (player.spacePressed && player.z == floorZ) {player.zVel = jumpVelocity}
	
	player.zVel -= fallAcceleration;
	player.z += player.zVel;
	if (player.z < floorZ) { player.z = floorZ; player.zVel = 0 }
	
	if (keysControl) {
		if (player.lookingLeft)	{ player.direction -= playerSensitivity / 1000; correctDirection() }
		if (player.lookingRight){ player.direction += playerSensitivity / 1000; correctDirection() }
	}
}

function calculate() {
	movePlayer();
	jumpPlayer();
}

function drawGrid() {
	ctx.lineWidth = 2;
	ctx.strokeStyle = "#888";
	for (var i = 0; i < gameDimensions[1] + 1; i++) {
		ctx.beginPath();
		ctx.moveTo(0, i * blockSize);
		ctx.lineTo(canvas.width, i * blockSize);
		ctx.stroke();
		ctx.closePath();
	}
	for (var i = 0; i < gameDimensions[0] + 1; i++) {
		ctx.beginPath();
		ctx.moveTo(i * blockSize, 0);
		ctx.lineTo(i * blockSize, canvas.height);
		ctx.stroke();
		ctx.closePath();
	}
}

function drawLevel() {
	for (var i = 0; i < level.length; i++) {
		for (var e = 0; e < level[i].length; e++) {
			var hue, sat;
			if (colorDefs[level[i][e]]) {
				hue = colorDefs[level[i][e]][0];
				sat = colorDefs[level[i][e]][1];
			} else {
				hue = sat = 0;
			}
			var lig = level[i][e] ? 50 : 100;
			
			ctx.fillStyle = `hsl(${hue}, ${sat}%, ${lig}% )`;
			ctx.beginPath();
			ctx.rect(e * blockSize, i * blockSize, blockSize, blockSize);
			ctx.fill();
			ctx.closePath();
		}
	}
}

function drawPlayer() {
	ctx.strokeStyle = "#f00";
	ctx.beginPath();
	ctx.moveTo(player.x, player.y);
	ctx.lineTo(player.x + Math.cos(player.direction) * 80, player.y + Math.sin(player.direction) * 80);
	ctx.stroke();
	ctx.closePath();
	
	ctx.fillStyle = "green";
	ctx.beginPath();
	ctx.arc(player.x, player.y, playerRadius, 0, pi * 2);
	ctx.fill();
	ctx.closePath();
}

function draw() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	drawLevel();
	if (blockSize >= 3) drawGrid();
	drawPlayer();
}

function flickerer(i) {
	return i % 2 == flicker;
//	return Math.random() > 0.5;
}

function rayCalcY(i) {
	var rays = [];
	var blockType;
	var iIncrement = playerFOV / (numOfRays);
	var rayAngle = player.direction - playerFOV / 2 + iIncrement * i;
	while (rayAngle < 0) {rayAngle += pi*2}
	while (rayAngle >= pi*2){rayAngle-=pi*2}
	var rayX = player.x, rayY = player.y;
	var rayXOffset, rayYOffset;
	if (rayAngle > pi) { // pointing upward
		rayY = Math.floor(player.y / blockSize) * blockSize;
		rayX = (player.y - rayY) * -1/Math.tan(rayAngle) + player.x;
		rayXOffset = -1/Math.tan(rayAngle) * blockSize, rayYOffset = -blockSize;
		while (rayX < levelWidth * blockSize && rayX > 0 && rayY > 0) {
			if (!(transparentBlocks.includes(level[rayY / blockSize-1][Math.floor(rayX / blockSize)]))) {
				rays = [rayX, rayY];
				blockType = level[rayY / blockSize-1][Math.floor(rayX / blockSize)];
				break;
			} else if ((semiTransparentBlocks.includes(level[rayY / blockSize-1][Math.floor(rayX / blockSize)])) && flickerer(i)) {
				rays = [rayX, rayY];
				blockType = level[rayY / blockSize-1][Math.floor(rayX / blockSize)];
				break;
			} else {
				rayX += rayXOffset;
				rayY += rayYOffset;
			}
		}
	} else { // pointing downward
		rayY = Math.ceil(player.y / blockSize) * blockSize;
		rayX = (player.y - rayY) * Math.tan(rayAngle + Math.PI / 2) + player.x;
		rayXOffset = 1/Math.tan(rayAngle) * blockSize, rayYOffset = blockSize;
		while (rayX < levelWidth * blockSize && rayX > 0 && rayY < level.length * blockSize) {
			if (!(transparentBlocks.includes(level[rayY / blockSize][Math.floor(rayX / blockSize)]))) {
				rays = [rayX, rayY];
				blockType = level[rayY / blockSize][Math.floor(rayX / blockSize)];
				break;
			} else if ((semiTransparentBlocks.includes(level[rayY / blockSize][Math.floor(rayX / blockSize)])) && flickerer(i)) {
				rays = [rayX, rayY];
				blockType = level[rayY / blockSize][Math.floor(rayX / blockSize)];
				break;
			} else {
				rayX += rayXOffset;
				rayY += rayYOffset;
			}
		}
	}
	if (testMode) {
		ctx.lineWidth = 1;
		ctx.strokeStyle = "#0f0";
		ctx.beginPath();
		ctx.moveTo(player.x, player.y);
		ctx.lineTo(rays[0], rays[1]);
		ctx.stroke();
		ctx.closePath();
	}
	var dist = (Math.sqrt((player.x - rays[0]) ** 2 + (player.y - rays[1]) ** 2)) || Infinity;
	var ca=player.direction-rayAngle; if(ca<0){ca+=2*pi}if(ca>=2*pi){ca-=2*pi}
	if (!fisheye){dist = dist*Math.cos(ca)} // fix fisheye
	return [dist, blockType];
}

function rayCalcX(i) {
	var rays = [];
	var blockType;
	var iIncrement = playerFOV / (numOfRays);
	var rayAngle = player.direction - playerFOV / 2 + iIncrement * i;
	while (rayAngle < 0) {rayAngle += pi*2}
	while (rayAngle >= pi*2){rayAngle-=pi*2}
	var rayX = player.x, rayY = player.y;
	var rayYOffset = Math.tan(rayAngle) * blockSize, rayXOffset = blockSize;
	if (rayAngle > pi / 2 && rayAngle < pi * 3/2) {	// pointing left
		rayX = Math.floor(player.x / blockSize) * blockSize;
		rayY = (player.x - rayX) * -Math.tan(rayAngle) + player.y;
		while (rayX > 0 && rayY > 0 && rayY < level.length * blockSize) {
			if (!(transparentBlocks.includes(level[Math.floor(rayY / blockSize)][rayX / blockSize - 1]))) {
				blockType = level[Math.floor(rayY / blockSize)][rayX / blockSize - 1];
				rays = [rayX, rayY];
				break;
			} else if ((semiTransparentBlocks.includes(level[Math.floor(rayY / blockSize)][rayX / blockSize - 1])) && flickerer(i)) {
				blockType = level[Math.floor(rayY / blockSize)][rayX / blockSize - 1];
				rays = [rayX, rayY];
				break;
			} else {
				rayX -= rayXOffset;
				rayY -= rayYOffset;
			}
		}
	} else { // pointing right
		rayX = Math.ceil(player.x / blockSize) * blockSize;
		rayY = (player.x - rayX) * -Math.tan(rayAngle) + player.y;
		while (rayX > 0 && rayY > 0 && rayY < level.length * blockSize) {
			if (!(transparentBlocks.includes(level[Math.floor(rayY / blockSize)][rayX / blockSize]))) {
				rays = [rayX, rayY];
				blockType = level[Math.floor(rayY / blockSize)][rayX / blockSize];
				break;
			} else if ((semiTransparentBlocks.includes(level[Math.floor(rayY / blockSize)][rayX / blockSize])) && flickerer(i)) {
				rays = [rayX, rayY];
				blockType = level[Math.floor(rayY / blockSize)][rayX / blockSize];
				break;
			} else {
				rayX += rayXOffset;
				rayY += rayYOffset;

			}
		}
	}
	if (testMode) {
		ctx.lineWidth = 1;
		ctx.strokeStyle = "#00f";
		ctx.beginPath();
		ctx.moveTo(player.x, player.y);
		ctx.lineTo(rays[0], rays[1]);
		ctx.stroke();
		ctx.closePath();
	}
	var dist = (Math.sqrt((player.x - rays[0]) ** 2 + (player.y - rays[1]) ** 2)) || Infinity;
	var ca=player.direction-rayAngle; if(ca<0){ca+=2*pi}if(ca>=2*pi){ca-=2*pi}
	if(!fisheye){dist = dist*Math.cos(ca)} // fix fisheye
	return [dist, blockType];
}

function drawHUD() {
	rtx.strokeStyle = "white";
	rtx.lineWidth = 2;
	rtx.beginPath();
	rtx.moveTo(renderer.width / 2, renderer.height / 2 - crosshairSize);
	rtx.lineTo(renderer.width / 2, renderer.height / 2 + crosshairSize);
	rtx.moveTo(renderer.width / 2 - crosshairSize, renderer.height / 2);
	rtx.lineTo(renderer.width / 2 + crosshairSize, renderer.height / 2);
	rtx.stroke();
	rtx.closePath();
}

function drawRays() {
	flicker = !flicker;
	var finalRays = [];
//	var vertRays = []; // Unused variable, previously used in old coloring code
	for (var i = 0; i < numOfRays; i++) { // calculates for horizontal walls
		var y = rayCalcY(i);
		var x = rayCalcX(i);
		var sideHit = Math.min(x[0], y[0]) == x[0];
		finalRays.push([Math.min(x[0], y[0]), sideHit, i, (sideHit ? x[1] : y[1])]); // height, which side it hit, ray index, block type
	}
	finalRays.sort((a,b) => a[0]-b[0]); // sorts subarrays by their first child
//	console.log(finalRays[0][3]);
	rtx.clearRect(0, 0, renderer.width, renderer.height);
	rtx.fillStyle = "skyblue";
	rtx.beginPath();
	rtx.rect(0, 0, renderer.width, renderer.height / 2);
	rtx.fill();
	rtx.closePath();

/*	rtx.fillStyle = "white";
	rtx.beginPath();
	rtx.arc(renderer.width * (pi * 1.659 - player.direction), 32, 16, 0, pi*2);
	rtx.fill();
	rtx.closePath();*/
	rtx.lineWidth = resolution;
	for (var i = 0; i < finalRays.length; i++) {
		var blockHeight = blockHeightMultiple / finalRays[i][0];
//		rtx.strokeStyle = finalRays[i][1] ? "gray" : "darkgray"; // old color rendering, minimal lighting
		var hue, sat;
		if (colorDefs[finalRays[i][3]]) {
			hue = colorDefs[finalRays[i][3]][0];
			sat = colorDefs[finalRays[i][3]][1];
		} else {
			hue = sat = 0;
		}
		var x = renderer.width / numOfRays * finalRays[i][2] + (resolution % 2 ? 0.5 : 1);
		rtx.strokeStyle = `hsl(${hue}, ${sat}%, ${(finalRays[i][1]?55:65)-(finalRays[i][0]/50)*(64/blockSize)}% )`;
		rtx.beginPath();
		rtx.moveTo(x, renderer.height / 2 - blockHeight / 2 + player.z * blockHeight);
		rtx.lineTo(x, renderer.height / 2 + blockHeight / 2 + player.z * blockHeight);
		rtx.stroke();
		rtx.closePath();
	}
	if(!paused)drawHUD();
}

var lastCalledTime = Date.now();
function countFPS() {
	document.getElementById("fps").innerText = "FPS: " + Math.round(1000 / (Date.now() - lastCalledTime));
	lastCalledTime = Date.now();
}

function main() {
	countFPS();
	if (!paused) {calculate()}
	if(testMode) draw();
	drawRays();
	window.requestAnimationFrame(main);
}

window.requestAnimationFrame(main);


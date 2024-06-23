const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');
const controlPanel = document.querySelector('#control-panel');
const invasionPanel = document.querySelector('#invasion-panel');

//draggables:
const dragBlock = document.querySelector('#block-panel img');
const dragTnt = document.querySelector('#tnt-panel img');
const dragStunGrenade = document.querySelector('#stun-grenade-panel img');

const playerInstruction = document.querySelector('#player-instruction');
const saveGamePanel = document.querySelector('#saveGamePanel');
const saveGamePanelScore = document.querySelector('#saveGamePanel h3');
const saveGamePanelInput = document.querySelector('#saveGamePanel input');
const saveGameButton = document.querySelector('#submitSave');
//buttons:
const resetButton = document.querySelector('#resetButton');
const leaderboardButton = document.querySelector('#viewLeaderboard');
const startInvasion = document.querySelector('#startInvasion');
const pauseButton = document.querySelector('#pauseButton');


let preparationTime = 35; //seconds
let curTime = undefined; //Current Time

let playerStandRight = new Image();
playerStandRight.src = 'sprites/player/spriteStandRight.png'
let playerStandLeft = new Image();
playerStandLeft.src = 'sprites/player/spriteStandLeft.png'
let playerRunRight = new Image();
playerRunRight.src = 'sprites/player/spriteRunRight.png'
let playerRunLeft = new Image();
playerRunLeft.src = 'sprites/player/spriteRunLeft.png'
// spriteStand.src = 'sprites/soldier/Soldier_1/Idle.png'

//Sounds Audios:

const jetpackAudio = new Audio('audio/jetpack.mp3');
const reloadAudio = new Audio('audio/reloadFast.mp3');
const bulletGun1Audio = new Audio('audio/bulletGun1.mp3');
const bulletGun2Audio = new Audio('audio/bulletGun2.mp3');
const bulletGun3Audio = new Audio('audio/bulletGun3.mp3');
const playerWalkingAudio = new Audio('audio/playerWalking.mp3');
const spookySfxAudio = new Audio('audio/spookySfx3.mp3');
const slashingBlockAudio = new Audio('audio/slashing.mp3');
const slashingPlayerAudio = new Audio('audio/slashingPlayer.mp3');
const zombieDeathAudio = new Audio('audio/zombieDeath.mp3');
const tntAudio = new Audio('audio/tnt.mp3');
const stunGrenadeAudio = new Audio('audio/stunGrenade.mp3');
const powerUpAudio = new Audio('audio/powerUp.mp3');
const gameOverAudio = new Audio('audio/gameOver.mp3');
const gameWonAudio = new Audio('audio/gameWon.mp3');

//Mouse coordinates: offsetX and offsetY within canvas for gun rotation:
let mouseCoords = {
    x: 1024,
    y: 475
}

let mouseClick = {
    x: null,
    y: null
}

//Zombie images:

//1 Running: sx: 250, sWidth = 400, sy = 200, sHeight = 550;
const zombieImages = {
    '1': {
        'activities': ['walking', 'slashing'],
        'walking': {
            'src': 'sprites/zombie/zombie1/Walking',
            'images': [],
            'total': 24,
            'sx': 250,
            'sy': 200,
            'sWidth': 400,
            'sHeight': 550
        },
        'slashing': {
            'src': 'sprites/zombie/zombie1/Slashing',
            'images': [],
            'total': 12,
            'sx': 250,
            'sy': 200,
            'sWidth': 650,
            'sHeight': 550
        }
    },
    '2': {
        'activities': ['walking', 'slashing'],
        'walking': {
            'src': 'sprites/zombie/zombie2/Walking',
            'images': [],
            'total': 24,
            'sx': 250,
            'sy': 200,
            'sWidth': 400,
            'sHeight': 550
        },
        'slashing': {
            'src': 'sprites/zombie/zombie2/Slashing',
            'images': [],
            'total': 12,
            'sx': 250,
            'sy': 200,
            'sWidth': 650,
            'sHeight': 550
        }
    },
    '3': {
        'activities': ['walking', 'slashing'],
        'walking': {
            'src': 'sprites/zombie/zombie3/Walking',
            'images': [],
            'total': 24,
            'sx': 250,
            'sy': 200,
            'sWidth': 400,
            'sHeight': 550
        },
        'slashing': {
            'src': 'sprites/zombie/zombie3/Slashing',
            'images': [],
            'total': 12,
            'sx': 250,
            'sy': 200,
            'sWidth': 650,
            'sHeight': 550
        }
    },
}

//Load all zombie images now itself
for (let zombieNo in zombieImages) {
    for (let activity of zombieImages[zombieNo]['activities']) {
        let obj = zombieImages[zombieNo][activity];
        for (let i = 0; i < obj['total']; i++) {
            let img = new Image();
            img.src = obj['src'] + `/${i}.png`;
            obj['images'].push(img);
        }
    }
}

function resizeCanvas() {
    // canvas.width = window.innerWidth;
    // canvas.height = window.innerHeight;
    canvas.width = 1024;
    canvas.height = 576;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

//Functions to assist:

function xOverlap(x1, x2, X1, X2) {
    "True if any overlap"
    return x1 > X1 && x1 < X2 || x2 > X1 && x2 < X2;
}

function xOverlap1(block, player = player1) {
    "Assumes player is thinner than block"

    const { x: playerLeft, width: playerWidth } = player;
    const { x: blockLeft, width: blockWidth } = block;
    const playerRight = playerLeft + playerWidth;
    const blockRight = blockLeft + blockWidth;
    return playerLeft > blockLeft && playerLeft < blockRight || playerRight > blockLeft && playerRight < blockRight;
}

function yOverlap1(block, player = player1) {
    "Assumes Block is shorter than player"

    const { y: playerUp, height: playerHeight } = player;
    const { y: blockUp, height: blockHeight } = block;
    const playerDown = playerUp + playerHeight;
    const blockDown = blockUp + blockHeight;
    return blockUp > playerUp && blockUp < playerDown || blockDown > playerUp && blockDown < playerDown;
}

//Show Health Bar function

function healthBar(x, y, health, totalHealth, color = '#06d6a0') {
    if (health < 0) {
        console.warn('Health should be above or equal to 0');
        return;
    }

    if (health === totalHealth) {
        return;
    }
    let length = 100;
    let breadth = 20;
    let greenLength = health / totalHealth * length;
    let whiteLength = length - greenLength;

    ctx.fillStyle = color;
    ctx.fillRect(x, y, greenLength, breadth);
    ctx.fillStyle = 'white';
    ctx.fillRect(x + greenLength, y, whiteLength, breadth);
}

class Player {
    constructor(y = 400) {
        //position
        this.x = canvas.width / 2;
        this.y = y;

        //size
        this.width = 77.4375;
        this.height = 175;
        // this.width = this.ratio * this.height;
        // this.height = 175;

        // this.cropWidth = 128;
        // this.cropHeight = 67;
        this.cropWidth = 177;
        this.cropHeight = 400;
        // this.ratio = this.cropWidth/this.cropHeight;

        //velocity
        this.dy = 0;
        this.speedFactor = .5;
        this.jetPackSpeed = .0075;

        this.onGround = false;
        this.onBlock = false;

        this.rightLimit = -600;
        this.leftLimit = 600;

        this.image = playerStandRight;

        this.frame = 0;
        this.totalFrames = 60;

        this.health = 100;
        this.totalHealth = 100;
    }

    draw() {
        // ctx.fillStyle = 'green';
        // ctx.fillRect(this.x, this.y, this.width, this.height);
        let displayWidth = this.height / this.cropHeight * this.cropWidth;
        ctx.drawImage(this.image, this.cropWidth * Math.floor(this.frame), 0, this.cropWidth, this.cropHeight, this.x, this.y, displayWidth, this.height);

    }

    update(deltaT) {

        //Sprite Animations:
        this.frame += deltaT / 16.6667;
        this.frame %= this.totalFrames;

        //Movements:
        player1.onBlock = false;
        player1.onGround = false;
        //y movements:
        //Jetpack: fly up
        if (keys.flyUp.pressed && powerUps['jetpack'].on) {
            this.dy -= this.jetPackSpeed * deltaT;
            jetpackAudio.play();
        }
        //General Y Movement:

        let overlappingBlocks = [];
        if ((this.y + this.height) < canvas.height) {

            blocks.forEach(block => {
                if (xOverlap1(block) && ((this.y + this.height) <= block.y)) {
                    overlappingBlocks.push(block);
                }

            })

            let noOfBlocks = overlappingBlocks.length;
            if (noOfBlocks === 0) {
                this.dy += deltaT * gravity;
            }
            else {
                let blockToCheck;

                if (noOfBlocks === 1) {
                    blockToCheck = overlappingBlocks[0];
                }
                else {
                    blockToCheck = overlappingBlocks[0];
                    for (let i = 1; i < noOfBlocks; i++) {
                        if (overlappingBlocks[i].y < blockToCheck.y) {
                            blockToCheck = overlappingBlocks[i];
                        }
                    }

                }

                if (((this.y + this.height) < blockToCheck.y)) {
                    this.dy += deltaT * gravity;
                }
                else {
                    this.dy = 0;
                    player1.onBlock = true;
                }
            }
        }

        // Increment or Decrement y

        //To prevent user falling down into a block/ground
        let newBottomY = this.y + this.height + deltaT * this.dy;
        let blocksToCheck = [];

        blocks.forEach(block => {
            if (xOverlap1(block) && (newBottomY > block.y) && ((this.y + this.height) <= block.y)) {
                blocksToCheck.push(block);
            }
        })

        if (blocksToCheck.length > 0) {
            this.y = blocksToCheck[0].y - this.height;
            this.dy = 0;
        }
        else if (newBottomY > canvas.height) {
            this.y = canvas.height - this.height;
            this.dy = 0;
        }
        else {

            // Entry into this block means: user will not fall into a block/ground

            //To prevent user flying out of ceiling/ up into a block:

            let blocksToCheck = [];
            blocks.forEach(block => {
                if (xOverlap1(block) && ((newBottomY - this.height) < (block.y + block.height)) && (this.y >= (block.y + block.height))) {
                    blocksToCheck.push(block);
                }
            })

            if (blocksToCheck.length === 0) {
                //Check if user flies out of ceiling:
                if ((newBottomY - this.height) < 0) {
                    // No change to this.y
                    if (keys.flyUp.pressed && powerUps['jetpack'].on) this.dy += this.jetPackSpeed * deltaT;
                }
                else {
                    //NORMAL Case:
                    this.y = newBottomY - this.height;
                }
            }
            else if (blocksToCheck > 0) {

                this.y = blocksToCheck[0].y + blocksToCheck[0].height;
                if (keys.flyUp.pressed && powerUps['jetpack'].on) this.dy += this.jetPackSpeed * deltaT;
            }

        }


        if ((this.y + this.height) === canvas.height) {
            player1.onGround = true;
        }

        // x movements: 

        if (keys.right.pressed && bgObjects[0].x >= this.rightLimit) {

            distanceMoved += this.speedFactor * deltaT;

            blocks.forEach(block => {
                block.dx = -this.speedFactor;
            })
            bgObjects.forEach(obj => {
                obj.dx = -.7 * this.speedFactor;
            })
            dragItem.tnt.list.forEach(tnt => {
                tnt.dx = -this.speedFactor;
            })
            dragItem.stunGrenade.list.forEach(stunGrenade => {
                stunGrenade.dx = -this.speedFactor;
            })

            playerWalkingAudio.play();
        }
        else if (keys.left.pressed && bgObjects[0].x <= this.leftLimit) {
            distanceMoved -= this.speedFactor * deltaT;

            blocks.forEach(block => {
                block.dx = this.speedFactor;
            })
            bgObjects.forEach(obj => {
                obj.dx = .7 * this.speedFactor;
            })
            dragItem.tnt.list.forEach(tnt => {
                tnt.dx = this.speedFactor;
            })
            dragItem.stunGrenade.list.forEach(stunGrenade => {
                stunGrenade.dx = this.speedFactor;
            })

            playerWalkingAudio.play();
        }
        else {
            blocks.forEach(block => {
                block.dx = 0;
            })
            bgObjects.forEach(obj => {
                obj.dx = 0;
            })
            dragItem.tnt.list.forEach(tnt => {
                tnt.dx = 0;
            })
            dragItem.stunGrenade.list.forEach(stunGrenade => {
                stunGrenade.dx = 0;
            })
        }

        //Different speed for background than blocks to create parallax scroll effect

        let newBlockXs = [], allowXMove = true;

        blocks.forEach(block => {
            newBlockXs.push(block.x + block.dx * deltaT);
        })

        for (let i in blocks) {
            if (xOverlap(this.x, this.x + this.width, newBlockXs[i], newBlockXs[i] + blocks[i].width) && yOverlap1(blocks[i])) {
                //Freeze all movement
                allowXMove = false;
                break;
            }
        }

        if (allowXMove) {
            for (let i in blocks) {
                blocks[i].x = newBlockXs[i];
            }
            bgObjects.forEach(obj => {
                obj.x += obj.dx * deltaT;
            })
            dragItem.tnt.list.forEach(tnt => {
                tnt.x += tnt.dx * deltaT;
            })
            dragItem.stunGrenade.list.forEach(stunGrenade => {
                stunGrenade.x += stunGrenade.dx * deltaT;
            })

        }

        this.draw();

        healthBar(this.x, this.y - 20, this.health, this.totalHealth, '#06d6a0');
    }
}


class Block {
    constructor(x, y, width = 100, height = 100) {
        this.width = width;
        this.height = height;

        // this.x = canvas.width/2 + 300;
        // this.y = canvas.height - this.height;
        this.x = x;
        this.y = y;
        this.dx = 0;

        this.totalHealth = 100;
        this.health = 100;
    }

    draw() {
        ctx.drawImage(blockImage, this.x, this.y, this.width, this.height);
    }
}


class BgObject {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;

        this.dx = 0;
    }

    draw() {

        if (this.type === 'background') {
            ctx.drawImage(backgroundImage, this.x, this.y, 576 * 2.289, 576);
        }
    }
}

class Gun {
    constructor(img = gunImage1) {

        this.x = canvas.width / 2 + 37.5;
        this.y = 400;
        this.image = img;

        this.width = 80;
        this.height = 40;
        this.angle = 0;

        this.cooldown = 0;
        this.recoil = 0;
    }

    getMirrorImage() {
        if (this.image === gunImage1) {
            return gunImageLeft1;
        }
        else if (this.image === gunImage2) {
            return gunImageLeft2;
        }
        else if (this.image === gunImage3) {
            return gunImageLeft3;
        }
    }

    draw() {
        this.y = player1.y + 75;
        this.angle = Math.atan2(mouseCoords.y - this.y, mouseCoords.x - this.x);

        //Rotation: https://stackoverflow.com/questions/2677671/how-do-i-rotate-a-single-object-on-an-html-5-canvas (also see mdn)
        //Cause gun to follow mouse:
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.angle);
        let img = this.image;
        if (this.angle < -Math.PI / 2 || this.angle > Math.PI / 2) {
            img = this.getMirrorImage();
        }
        ctx.drawImage(img, -this.width / 2 + this.recoil, -this.height / 2, this.width, this.height);
        ctx.restore();
    }

    updateGunSpecs() {
        if (this.image === gunImage1) {
            this.shootSpeed = 3;
            this.cooldownPeriod = .25;
            this.audio = bulletGun1Audio;
        }
        else if (this.image === gunImage2) {
            this.shootSpeed = 2.5;
            this.cooldownPeriod = .75;
            this.audio = bulletGun2Audio;

        }
        else if (this.image === gunImage3) {
            this.shootSpeed = 2;
            this.cooldownPeriod = 1.25;
            this.audio = bulletGun3Audio;

        }
    }

    fire() {
        if (this.cooldown === 0) {
            this.updateGunSpecs();

            let speedX = this.shootSpeed * Math.cos(this.angle);
            let speedY = this.shootSpeed * Math.sin(this.angle) + player1.dy;

            let newBullet = new Bullet(this.x, this.y, speedX, speedY, this.image);
            bullets.push(newBullet);

            this.audio.play();

            let cooldownTime = this.cooldownPeriod;
            if (powerUps['reloadTime'].on) {
                cooldownTime /= 4;
            }

            this.cooldown = cooldownTime;

            setTimeout(() => {
                this.cooldown = 0;
                reloadAudio.play();
            }, cooldownTime * 1000);

            //recoil:
            // for (let i= -2; i <= 2; i+=.1)
            let i = -2;
            let id = setInterval(() => {
                if (i > 2) {
                    clearInterval(id);
                    this.recoil = 0;
                    return;
                }
                this.recoil = 5 * i ** 2 - 20;
                i += .1;
            }, cooldownTime / (4 * 40) * 1000);
            // 40 = (2- (-2))/.1


        }
    }

}

class Bullet {
    constructor(x, y, dx, dy, gun) {
        this.x = x;
        this.y = y;

        this.dx = dx;
        this.dy = dy;

        this.width = 10;
        this.height = 10;

        this.gun = gun;

        this.image = this.getImage();
        this.setDamage();
    }

    getImage() {
        if (this.gun === gunImage1) {
            return bulletImage1;
        }
        else if (this.gun === gunImage2) {
            return bulletImage2;
        }
        else if (this.gun === gunImage3) {
            return bulletImage3;
        }
    }

    setDamage() {
        if (this.gun === gunImage1) {
            this.damage = 15;
        }
        else if (this.gun === gunImage2) {
            this.damage = 25;
        }
        else if (this.gun === gunImage3) {
            this.damage = 40;
        }
    }

    draw() {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }

    update(deltaT, index) {
        "Returns index if this bullet must be deleted"

        //dy update:
        this.dy += deltaT * gravity;

        //y update:
        this.y += deltaT * this.dy;

        //x update:
        this.x += deltaT * this.dx;

        //! Bullet is drawn here
        this.draw();

        //Handling bullet deletion:

        //Bullet falls below canvas
        if (this.y + this.height >= canvas.height) {
            return index;
        }

        //bullet crashes into block
        for (let block of blocks) {
            if (xOverlap1(block, this) && yOverlap1(this, block)) {
                return index;
            }
        }

        //Bullet Hits Zombie:

        for (let zombie of zombies) {
            let dummyZombie = new Dummy(zombie.x + scrollOffset, zombie.y, zombie.width, zombie.height);
            if (xOverlap1(dummyZombie, this) && yOverlap1(this, dummyZombie)) {
                zombie.health = Math.max(0, zombie.health - this.damage);
                return index;
            }
        }

    }
}

class Zombie {
    constructor(number, dx, dy, x) {
        //! enter string type for number
        this.number = number;

        this.x = x;
        this.y = canvas.height - 140;

        this.dx = dx;
        this.dy = dy;
        this.defaultSpeed = dx;
        this.stunTimeouts = [];

        this.acc = gravity / 20;

        this.width = 101.818; //This is the display width while walking
        this.height = 140;

        this.setBasicDetails();
        this.updateDetails();
        this.updateFrames(16.6667);
    }

    stun(t){

        this.dx = 0;
        if (this.stunTimeouts.length >0 ){
            clearTimeout(this.stunTimeouts[0]);
            this.stunTimeouts.pop();
        }
        setTimeout(() => {
            this.dx = this.defaultSpeed;
            this.stunTimeouts.pop();
        }, t * 1000);
    }

    setBasicDetails() {
        //Random offset is to avoid multiple zombies at a spot looking like one

        this.randomOffset = Math.random() * 6 - 3;
        if (this.number === '1') {
            this.damage = .01;
            this.health = 30;
            this.totalHealth = 30;
            this.points = 5;
            this.coins = 5;
        }
        else if (this.number === '3') {
            this.damage = .07;
            this.health = 50;
            this.totalHealth = 50;
            this.points = 10;
            this.coins = 9;
        }
        else if (this.number === '2') {
            this.damage = .1;
            this.health = 75;
            this.totalHealth = 75;
            this.points = 20;
            this.coins = 16;
        }

    }

    updateDetails(action = 'walking') {
        "Will update details only if needed"
        if (this.action && this.action === action) return;

        this.frame = 0;
        this.action = action;
        const zombieProps = zombieImages[this.number][this.action];
        ({ total: this.totalFrames, sx: this.sx, sy: this.sy, sWidth: this.sWidth, sHeight: this.sHeight }
            = zombieProps
        );
        this.ratio = this.sWidth / this.sHeight;
        this.displayWidth = this.height * this.ratio;

        if (action === 'walking') {
            this.frameSpeedFactor = 1 / 2 * 1 / 16.6667;
        }
    }

    updateFrames(deltaT) {
        this.frame += this.frameSpeedFactor * deltaT;
        this.frame %= this.totalFrames;
        this.image = zombieImages[this.number][this.action]['images'][Math.floor(this.frame)];
    }

    draw() {

        let x = this.x + scrollOffset + this.randomOffset;

        if (this.dx > 0) {
            ctx.drawImage(this.image, this.sx, this.sy, this.sWidth, this.sHeight, x, this.y, this.displayWidth, this.height);
        }
        else {
            ctx.save();
            ctx.translate(x + this.displayWidth, this.y);
            ctx.scale(-1, 1);
            ctx.drawImage(this.image, this.sx, this.sy, this.sWidth, this.sHeight, 0, 0, this.displayWidth, this.height);
            ctx.restore();
        }
    }

    update(deltaT) {
        //Set Direction in which zombie would move:
        if (this.x + this.width + scrollOffset < player1.x) {
            this.dx = Math.abs(this.dx);
        }

        if (this.x + scrollOffset > player1.x + player1.width) {
            this.dx = -Math.abs(this.dx);
        }

        // movement
        let updateX = true, newAction = 'walking';
        let dummyAddOffset = new Dummy(this.x + scrollOffset + this.dx * deltaT, this.y, this.width, this.height);

        //if there will be collision with player...
        if (xOverlap1(player1, dummyAddOffset) && yOverlap1(dummyAddOffset, player1)) {
            updateX = false;
            newAction = 'slashing';
            if (!powerUps['tempImmunity'].on) {
                player1.health = Math.max(0, player1.health - this.damage);
            }
            slashingPlayerAudio.play();
        }
        //else statement so that either player or block, not both are hit
        else if (this.number !== '3'){
            // if there will be collision with block...
            for (let block of blocks) {
                if (xOverlap1(dummyAddOffset, block) && yOverlap1(block, dummyAddOffset)) {

                    updateX = false;
                    newAction = 'slashing';
                    block.health = Math.max(0, block.health - this.damage);
                    slashingBlockAudio.play();
                    break; //Break one block at a time

                }
            }

        }

        if (updateX) {
            this.x = dummyAddOffset.x - scrollOffset;
        }

        this.updateDetails(newAction);
        this.updateFrames(deltaT);

        //Special Ability Zombie:
        //Regenerate Health:
        if (this.number === '2') {
            this.health = Math.min(this.totalHealth, this.health + .15);
        }

        this.draw();
    }
}

class Tnt {
    constructor(x, y, width = 65, height = 91) {
        this.x = x;
        this.y = y;
        this.image = tntImage;
        this.width = width;
        this.height = height;

        this.blastRadius = 130;
        this.damage = 35;

        this.remove = false;
    }

    draw() {
        ctx.drawImage(tntImage, this.x, this.y, this.width, this.height);
    }

    blast(){
        if (powerUps.useTnt.blastOn){
            if (mouseClick.x && mouseClick.x >= this.x && mouseClick.x <= this.x + this.width &&
                mouseClick.y >= this.y && mouseClick.y <= this.y + this.height
            ){
                for (let zombie of zombies){
                    if (Math.abs(this.x + this.width/2 - (zombie.x + scrollOffset)) <= this.blastRadius){
                        zombie.health = Math.max(0, zombie.health - this.damage);
                    }
                }
                tntAudio.play();
                mouseClick.x = null;
                mouseClick.y = null;
                this.remove = true;
                powerUps.useTnt.blastOn = false;
            }
        }
    }
}

class StunGrenade {
    constructor(x, y, width = 45, height = 90) {
        this.x = x;
        this.y = y;
        this.image = stunGrenadeImage;
        this.width = width;
        this.height = height;

        this.blastRadius = 135;
        this.stunTime = 8;
        this.remove = false;
    }

    draw() {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }

    blast(){
        if (powerUps.useStunGrenade.blastOn){

            if (mouseClick.x && mouseClick.x >= this.x && mouseClick.x <= this.x + this.width &&
                mouseClick.y >= this.y && mouseClick.y <= this.y + this.height
            ){
                for (let zombie of zombies){
                    if (Math.abs(this.x + this.width/2 - (zombie.x + scrollOffset)) <= this.blastRadius){
                        zombie.stun(this.stunTime);
                    }
                }
                stunGrenadeAudio.play();
                mouseClick.x = null;
                mouseClick.y = null;
                this.remove = true;
                powerUps.useStunGrenade.blastOn = false;
            }
        }
    }
}

class Dummy {
    constructor(x, y, width, height) {
        this.x = x,
            this.y = y,
            this.width = width,
            this.height = height
    }
}

class KillMessage {
    constructor(x, y, message1, message2) {
        this.x = x;
        this.y = y;
        this.message1 = message1;
        this.message2 = message2;
        this.remove = false;
        this.setTimer(.4);
    }

    setTimer(t) {
        setTimeout(() => {
            this.remove = true;
        }, t * 1000);
    }

    draw() {
        console.log('hi');
        ctx.font = '13px "Noto Sans"';
        ctx.fillStyle = '#ffbe0b';
        ctx.fillText(this.message1, this.x, this.y);
        ctx.fillText(this.message2, this.x, this.y + 14.5);
        ctx.font = '10px sans serif'; //Default value
    }
}

function changePlayerStripe(action) {
    if (action === 'standLeft') {
        player1.image = playerStandLeft;
        player1.totalFrames = 60;
        player1.cropWidth = 177;

    }
    else if (action === 'standRight') {
        player1.image = playerStandRight;
        player1.totalFrames = 60;
        player1.cropWidth = 177;
    }
    else if (action === 'runRight') {
        // if (player1.image === playerRunLeft){
        //     player1.frame = 0;
        // }
        // console.log('changed to right');

        player1.image = playerRunRight;
        player1.totalFrames = 30;
        player1.cropWidth = 341;

    }
    else if (action === 'runLeft') {
        // console.log('changed to left');
        // if (player1.image === playerRunRight){
        //     player1.frame = 0;
        // }

        player1.image = playerRunLeft;
        player1.totalFrames = 30;
        player1.cropWidth = 341;
    }

}
// key press events

window.addEventListener('keydown', (e) => {
    let key = e.key;
    if (key === ' ') {
        if (player1.onGround || player1.onBlock) {
            player1.y -= .1;
        }
        keys.flyUp.pressed = true;
    }
    else if (key === 'a') {
        console.log('left');

        changePlayerStripe('runLeft');
        keys.left.pressed = true;

    }

    else if (key === 'd') {

        changePlayerStripe('runRight');
        keys.right.pressed = true;
    }
    else if (key === 'w') {
        if (player1.onGround || player1.onBlock) {
            player1.y -= .1;
            player1.dy = -1.25;
        }

    }
})

window.addEventListener('keyup', (e) => {
    let key = e.key;
    if (key === ' ') {
        keys.flyUp.pressed = false;

    }
    else if (key === 'a') {
        changePlayerStripe('standLeft');
        keys.left.pressed = false;

    }

    else if (key === 'd') {
        changePlayerStripe('standRight');
        keys.right.pressed = false;
    }
    else if (key === 'w') {

    }
})


function animateInvasion(timeStamp) {

    if (curTime === undefined) {
        curTime = timeStamp;
    }

    let deltaT = timeStamp - curTime;
    curTime = timeStamp;

    //Skip if initializing or if tab went out of focus for more than 400ms (OR if refresh rate< 20 Hz)
    if (deltaT === 0 || deltaT > 400 || gamePaused) {
        // Unpress all keys:
        for (let key in keys) {
            keys[key].pressed = false;
        }

        if (deltaT > 3500 && !gamePaused) {
            handlePause();
        }
    }

    else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        bgObjects.forEach(obj => {
            obj.draw();
        })

        //Update Offset:
        scrollOffset = bgObjects[0].x / .7;

        //Remove blocks and zombies with 0 health:

        for (let i = blocks.length - 1; i >= 0; i--) {
            if (blocks[i].health === 0) {
                blocks.splice(i, 1);
            }
        }

        for (let i = zombies.length - 1; i >= 0; i--) {
            if (zombies[i].health === 0) {
                coins += zombies[i].coins;
                points += zombies[i].points;
                zombieDeathAudio.play();

                killMessages.push(new KillMessage(zombies[i].x + scrollOffset, zombies[i].y - 17.5, `+${zombies[i].coins} coins!`, `+${zombies[i].points} points!`));

                zombies.splice(i, 1);
            }
        }

        for (let i = killMessages.length - 1; i >= 0; i--) {
            if (killMessages[i].remove) {
                console.log(i);
                killMessages.splice(i, 1);
            }
        }

        //remove tnts that have been blasted
        for (let i = dragItem.tnt.list.length - 1; i>=0; i--){
            if (dragItem.tnt.list[i].remove){
                dragItem.tnt.list.splice(i, 1);
            }
        }

        for (let i = dragItem.stunGrenade.list.length - 1; i>=0; i--){
            if (dragItem.stunGrenade.list[i].remove){
                dragItem.stunGrenade.list.splice(i, 1);
            }
        }

        if (dragItem.tnt.list.length === 0){
            powerUps.useTnt.button.parentElement.title = 'You have no more TNTs to use!';
        }
        else{
            powerUps.useTnt.button.parentElement.title = 'Allows you to click on a tnt to activate it!';
        }

        if (dragItem.stunGrenade.list.length === 0){
            powerUps.useStunGrenade.button.parentElement.title = 'You have no more Stun Grenades to use!';
        }
        else{
            powerUps.useStunGrenade.button.parentElement.title = 'Stun zombies, temporarily disabling their motion!';
        }

        //Draw:

        for (let block of blocks) {
            block.draw();
        }


        for (let zombie of zombies) {
            zombie.update(deltaT);
        }

        for (let kMessage of killMessages) {
            kMessage.draw();
        }

        for (let tnt of dragItem.tnt.list){
            tnt.draw();
        }

        for (let stunGrenade of dragItem.stunGrenade.list){
            stunGrenade.draw();
        }

        player1.update(deltaT);

        gun.draw();

        let deleteBullets = [];

        for (let i in bullets) {
            let index = bullets[i].update(deltaT, i);
            if (index) {
                deleteBullets.push(index);
            }
        }

        for (let i of deleteBullets) {
            bullets.splice(i, 1);
        }


        //PowerUp Power up Animations:

        for (let pu in powerUps) {
            if (!powerUps[pu].on) {

                let powerUpCoinsLeft = Math.max(0, (powerUps[pu].coins - coins) / powerUps[pu].coins * 100);
                powerUps[pu].button.style.background = `linear-gradient(#6c757d  ${powerUpCoinsLeft}%, #06d6a0 ${powerUpCoinsLeft}%)`;

                if (coins >= powerUps[pu].coins) {
                    powerUps[pu].button.style.cursor = 'pointer';
                }
            }

        }


        //Win loss scenario

        if (zombies.length === 0) {
            if (noZombies['1'] !== 0 || noZombies['2'] !== 0 || noZombies['3'] !== 0) {
                //More zombies are yet to come
            }
            else {
                //Won the level
                invasionPanel.style.display = 'none';
                playerInstruction.classList.add('hide-element');

                pauseButton.classList.add('hide-element');

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                ctx.font = '48px "Roboto Slab", serif';
                ctx.fillStyle = 'green';
                ctx.fillText(`Level ${phase} complete!`, 400, 250);

                ctx.font = '18px "Roboto Slab", serif';
                ctx.fillStyle = 'black';
                ctx.fillText(`Get Ready for Round ${phase + 1}!`, 440, 300);

                phaseChangeTimeoutIds.push(setTimeout(() => {
                    initPrep();
                }, 2.5 * 1000));

                spookySfxAudio.pause();
                gameWonAudio.play();
                return;
            }
        }

        if (player1.health === 0) {
            //Lost the Game

            playerLost = true;
            invasionPanel.style.display = 'none';
            pauseButton.classList.add('hide-element');
            playerInstruction.classList.add('hide-element');
            ctx.clearRect(0, 0, canvas.width, canvas.height);


            ctx.font = '48px "Roboto Slab", serif';
            ctx.fillStyle = 'red';
            ctx.fillText('You Lost!', 420, 250);

            ctx.font = '18px "Roboto Slab", serif';
            ctx.fillStyle = 'black';
            ctx.fillText('Try Again :)', 440, 300);

            for (let i in zombieStopIds) {
                clearInterval(zombieStopIds[i]);
            }

            setTimeout(() => {
                resetButton.classList.remove('hide-element');
                leaderboardButton.classList.remove('hide-element');
                saveGamePanel.classList.remove('saveGameDisplay1');
                saveGamePanel.classList.add('saveGameDisplay2');
                canvas.classList.add('hide-element');

                saveGamePanelScore.innerText = `Your Score: ${points}`;

            }, 1.5 * 1000);
            //Reset Button:

            spookySfxAudio.pause();
            gameOverAudio.play();
            return;
        }

        //draw Health Bars:
        blocks.forEach(block => {
            healthBar(block.x, block.y - 20, block.health, block.totalHealth, '#118ab2');
        })

        zombies.forEach(zombie => {
            if (zombie.number === '2') {
                healthBar(zombie.x + scrollOffset, zombie.y - 20, zombie.health, zombie.totalHealth, '#d00000');

            }
            else {

                healthBar(zombie.x + scrollOffset, zombie.y - 20, zombie.health, zombie.totalHealth, '#ef476f');
            }
        })

    }

    //Messages:

    ctx.font = '25px "Press Start 2P"';
    ctx.fillStyle = '#ffbe0b';

    ctx.fillText(`Points:`, canvas.width - 180, 35);
    ctx.fillText(`${points}`, canvas.width - 120, 70);

    ctx.fillText(`Coins:`, 10, 35);
    ctx.fillText(`${coins}`, 60, 70);

    //powerUp display message - for latest powerUp:
    ctx.font = '12.5px "Press Start 2P"';
    let latestPowerUp;

    for (let pu in powerUps) {
        if (powerUps[pu].on) {
            if (latestPowerUp) {
                if (powerUps[latestPowerUp].totalTime - powerUps[latestPowerUp].time
                    > powerUps[pu].totalTime - powerUps[pu].time
                ) {
                    latestPowerUp = pu;
                }
            }
            else {
                latestPowerUp = pu;
            }
        }
    }

    ctx.fillStyle = '#fb5607';
    if (latestPowerUp) {
        ctx.fillText(powerUps[latestPowerUp].displayText, 325, 35);
    }

    ctx.font = '10px sans serif'; //Default value

    //tnt

    dragItem.tnt.list.forEach(tnt => {
        tnt.blast();
    })

    dragItem.stunGrenade.list.forEach(stunGrenade => {
        stunGrenade.blast();
    })
    

    requestAnimationFrame(animateInvasion);
}

function animatePrep(timeStamp) {

    if (curTime === undefined) {
        curTime = timeStamp;
    }
    let deltaT = timeStamp - curTime;
    curTime = timeStamp;
    //Skip if initializing or if tab went out of focus for more than 50ms (OR if refresh rate< 20 Hz)
    if (deltaT === 0 || deltaT > 50) {
        // Unpress all keys:
        for (let key in keys) {
            keys[key].pressed = false;
        }
    }

    else {

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        bgObjects.forEach(obj => {
            obj.draw();
        })

        //Update Offset:
        scrollOffset = bgObjects[0].x / .7;

        for (let block of blocks) {
            block.draw();
        }

        for (let tnt of dragItem.tnt.list){
            tnt.draw();
        }

        for (let stunGrenade of dragItem.stunGrenade.list){
            stunGrenade.draw();
        }

        player1.update(deltaT);
        //* Player is to be updated last to keep it in front of everything else

        
        ctx.fillStyle = '#d90429';
        ctx.font = '50px "Orbitron"';
        ctx.fillText(`${Math.floor(remainingPrepTime/60)}:${Math.floor(remainingPrepTime%60)}`, canvas.width - 155, 60);


    }

    if (prepPhase) {
        requestAnimationFrame(animatePrep);
    }
    else {
        initInvasion();
    }

}

//Some more image declarations:

const blockImage = new Image();
blockImage.src = 'images/block.png';

const tntImage = new Image();
tntImage.src = 'images/tnt1.png';

const stunGrenadeImage = new Image();
stunGrenadeImage.src = 'images/stunGrenade.png';

//Check whether background is loaded:
const backgroundImage = new Image();

let backgroundIsLoaded = false;
backgroundImage.onload = () => {
    backgroundIsLoaded = true;
}
backgroundImage.src = 'images/background2.jpg';

// guns and bullets:
let gunImage1 = new Image();
gunImage1.src = 'images/gun1.png';
let gunImage2 = new Image();
gunImage2.src = 'images/gun2.png';
let gunImage3 = new Image();
gunImage3.src = 'images/gun3.png';
let gunImageLeft1 = new Image();
gunImageLeft1.src = 'images/gun1Left.png';
let gunImageLeft2 = new Image();
gunImageLeft2.src = 'images/gun2Left.png';
let gunImageLeft3 = new Image();
gunImageLeft3.src = 'images/gun3Left.png';
let bulletImage1 = new Image();
bulletImage1.src = 'images/bullet1.png';
let bulletImage2 = new Image();
bulletImage2.src = 'images/bullet2.png';
let bulletImage3 = new Image();
bulletImage3.src = 'images/bullet3.png';

// const hillsImage = new Image();
// hillsImage.src = 'images/hills.png';
const gravity = .005;
const keys = {
    right: {
        pressed: false
    },
    left: {
        pressed: false
    },
    flyUp: {
        pressed: false
    }
}

//Main declarations:

let distanceMoved = 0;

let player1 = new Player();

let guns = [new Gun(gunImage1), new Gun(gunImage2), new Gun(gunImage3)];
let gun = guns[0];

let bullets = [];

let blocks = [];
let blockIndicesRemove = [];

let bgObjects; //[new BgObject(-1, -1, 'background'),  new BgObject(-1, -1, 'hills')]; 
//new BgObject(-1, -1, 'background'),

let playerLost = false;

let phase = 0;
let prepPhase = true;
let gamePaused = false;

let scrollOffset = 0;

let zombies = [];
let zombieIndicesRemove = [];
let noZombies;
let zombieStopIds;

let points = 0;
let coins = 0;
let killMessages = [];

let phaseChangeTimeoutIds = [];

saveGamePanel.classList.add('saveGameDisplay1');

function initInvasion() {

    spookySfxAudio.play();

    playerInstruction.classList.remove('hide-element');
    startInvasion.classList.add('hide-element');
    pauseButton.classList.remove('hide-element');

    curTime = undefined;

    controlPanel.style.display = 'none';
    invasionPanel.style.display = 'flex';

    keys.right.pressed = false;
    keys.left.pressed = false;
    keys.flyUp.pressed = false;

    distanceMoved = 0;

    if (blocks.length > 0 && blocks[blocks.length - 1].width === 0) {
        blocks.pop();
    }

    if (dragItem.tnt.list.length > 0 && dragItem.tnt.list[dragItem.tnt.list.length - 1].width === 0) {
        dragItem.tnt.list.pop();
    }

    if (dragItem.stunGrenade.list.length > 0 && dragItem.stunGrenade.list[dragItem.stunGrenade.list.length - 1].width === 0) {
        dragItem.stunGrenade.list.pop();
    }

    player1 = new Player(0);
    player1.draw();

    //Zombies Number

    noZombies = {
        '1': Math.floor(15 + phase * 2),
        '2': Math.floor(2 + phase * 1.5),
        '3': Math.floor(3 + phase * 2),

    }

    zombieStopIds = {
        '1': null,
        '2': null,
        '3': null
    }

    zombieStopIds['1'] = setInterval(() => {
        if (noZombies['1'] <= 0) {
            clearInterval(zombieStopIds['1']);
            zombieStopIds['1'] = null;
            return;
        }
        noZombies['1']--;
        if (Math.random() < .5) {

            zombies.push(new Zombie('1', .1, 0, -650))
        }
        else {
            zombies.push(new Zombie('1', .1, 0, canvas.width + 650))
        }
    }, 250);

    zombieStopIds['3'] = setInterval(() => {
        //Wait for zombie 1's to spawn before this set

        if (noZombies['3'] <= 0) {
            clearInterval(zombieStopIds['3']);
            zombieStopIds['3'] = null;
            return;
        }

        if (zombieStopIds['1']) {
            return;
        }


        noZombies['3']--;
        if (Math.random() < .5) {

            zombies.push(new Zombie('3', .15, 0, -650))
        }
        else {
            zombies.push(new Zombie('3', .15, 0, canvas.width + 650))
        }
    }, 1000);

    zombieStopIds['2'] = setInterval(() => {
        //Wait for zombie 3's to spawn before this set

        if (noZombies['2'] <= 0) {
            clearInterval(zombieStopIds['2']);
            zombieStopIds['2'] = null;
            return;
        }

        if (zombieStopIds['3']) {
            return;
        }

        noZombies['2']--;
        if (Math.random() < .5) {

            zombies.push(new Zombie('2', .2, 0, -650))
        }
        else {
            zombies.push(new Zombie('2', .2, 0, canvas.width + 650))
        }
    }, 2000);

    document.title = 'Last Stand | Fight the Zombies!';
    playerInstruction.innerText = 'Kill all zombies to win!';

    requestAnimationFrame(animateInvasion);
}

let remainingPrepTime = null;
let remainingPrepTimeId = null;

function initPrep() {
    playerInstruction.classList.remove('hide-element');
    pauseButton.classList.add('hide-element');
    startInvasion.classList.remove('hide-element');
    leaderboardButton.classList.add('hide-element');
    

    if (remainingPrepTime === null){
        remainingPrepTime = preparationTime + phase * 10;
        remainingPrepTimeId = setInterval(()=>{
            remainingPrepTime -= .01;
        }, 10);
    }

    phaseChangeTimeoutIds.push(setTimeout(() => {
        phase++;
        prepPhase = false;
        remainingPrepTime = null;
        clearInterval(remainingPrepTimeId);
    }, (preparationTime + phase * 10) * 1000));

    prepPhase = true;

    resetButton.classList.add('hide-element');
    controlPanel.style.display = '';
    invasionPanel.style.display = 'none';

    keys.right.pressed = false;
    keys.left.pressed = false;
    keys.flyUp.pressed = false;

    dragItem.block.available = Math.min(15, 5 + 3 * phase);
    dragItem.tnt.available = 1 + phase;
    dragItem.stunGrenade.available = 1 + phase;

    let txt = document.querySelector('#block-panel h3');
    txt.innerText = dragItem.block.available;

    txt = document.querySelector('#tnt-panel h3');
    txt.innerText = dragItem.tnt.available;

    txt = document.querySelector('#stun-grenade-panel h3');
    txt.innerText = dragItem.stunGrenade.available;

    player1 = new Player();
    player1.draw();

    blocks = [];
    for (di in dragItem){
        dragItem[di].list = [];
    }
    dragItem.block.list = blocks;

    zombies = [];

    bgObjects = [new BgObject(-1, -1, 'background'), new BgObject(-1317, -1, 'background'), new BgObject(1317, -1, 'background'), new BgObject(1317 * 2, -1, 'background'), new BgObject(1317 * 3, -1, 'background'), , new BgObject(1317 * 4, -1, 'background'), , new BgObject(1317 * (-2), -1, 'background'), new BgObject(1317 * (-3), -1, 'background'), new BgObject(1317 * (-4), -1, 'background')];

    document.title = 'Last Stand | Preparation';
    playerInstruction.innerText = 'Drag and Drop Blocks, TNT and stun grenades. Build a protection before the zombies arrive!';

    requestAnimationFrame(animatePrep);
}

//Reset Button:

resetButton.addEventListener('click', () => {
    phase = 0;
    points = 0;
    coins = 0;

    playerLost = false;

    playerInstruction.classList.remove('hide-element');
    canvas.classList.remove('hide-element');
    saveGamePanel.classList.add('saveGameDisplay1');
    saveGamePanel.classList.remove('saveGameDisplay2');

    for (let id of phaseChangeTimeoutIds) {
        clearInterval(id);
    }

    remainingPrepTime = null;
    clearInterval(remainingPrepTimeId);

    initPrep();
});


//Start Invasion Button:

startInvasion.addEventListener('click', () => {
    if (prepPhase) {
        clearInterval(phaseChangeTimeoutIds[0]);
        phase++;
        prepPhase = false;
        remainingPrepTime = null;
        clearInterval(remainingPrepTimeId);
    }
});

//Drag blocks

let dragOffsets = {
    x: 0,
    y: 0
}

let xyz = blocks;

let dragging;
let dragItem = {
    'block': {
        available: 5,
        object: Block,
        list: xyz,
        dragImage: dragBlock,
        txt: document.querySelector('#block-panel h3'),
    },
    'tnt': {
        available: 1,
        object: Tnt,
        list: [],
        dragImage: dragTnt,
        txt: document.querySelector('#tnt-panel h3'),
    },
    'stunGrenade': {
        available: 1,
        object: StunGrenade,
        list: [],
        dragImage: dragStunGrenade,
        txt: document.querySelector('#stun-grenade-panel h3'),
    },
}


for (let di in dragItem) {
    dragItem[di].dragImage.addEventListener('dragstart', e => {
        if (dragItem[di].available && prepPhase) {
            updateDragOffsets(e);
            dragging = di;
        }
    })
}

function updateDragOffsets(e) {
    dragOffsets.x = e.offsetX;
    dragOffsets.y = e.offsetY;
}

canvas.addEventListener('dragover', e => {
    if (dragItem[dragging].available && prepPhase) {
        e.preventDefault();
        dragoverHandler(e);
    }
})

function dragoverHandler(e) {
    //below line no need because it's checked when fn is called
    // if (!availableBlocks || !prepPhase) return;

    dragItem[dragging].list.pop();

    let newX = e.offsetX - dragOffsets.x;
    let newY = e.offsetY - dragOffsets.y;

    let newItem = new dragItem[dragging].object(newX, newY);

    let itemHeight = newItem.height;

    let lowestItemY = canvas.height - itemHeight;

    dragItem[dragging].list.forEach(item => {
        if (xOverlap1(newItem, item) && (lowestItemY < (item.y + item.height))) {
            if (item.y <= lowestItemY) {
                lowestItemY = item.y - itemHeight;
            }
        }
    })

    newItem.y = lowestItemY;

    if (newItem.y >= 0) {
        dragItem[dragging].list.push(newItem);
    }
    else{
        console.log('what');
    }
}

canvas.addEventListener('drop', () => {
    if (!dragItem[dragging] ||!prepPhase || !dragItem[dragging].available){
        return;
    }

    dragItem[dragging].list.push(new dragItem[dragging].object(0, 0, 0, 0)); //Placeholder block, because we pop in dragoverhandler

    dragItem[dragging].available--;
    dragItem[dragging].txt.innerText = dragItem[dragging].available;

})



// Avoid text getting selected when double clicking:

document.addEventListener('mousedown', e => {
    if (e.detail > 1) {
        e.preventDefault();
    }
})

//Change guns:

window.addEventListener('keydown', e => {
    if (phase === 0) return;
    changeGun(e.key);

})

invasionPanel.addEventListener('click', e => {
    let id = e.target.id;
    let parentId = e.target.parentElement.id;
    // console.log(parentId);
    if (id === 'gun1Div' || parentId === 'gun1Div') {
        changeGun('1');
    }
    else if (id === 'gun2Div' || parentId === 'gun2Div') {
        changeGun('2');
    }
    else if (id === 'gun3Div' || parentId === 'gun3Div') {
        changeGun('3');
    }
})

function changeGun(gunNo) {
    if (gunNo === '1') {
        gun = guns[0];
    }
    else if (gunNo === '2') {
        gun = guns[1];
    }
    else if (gunNo === '3') {
        gun = guns[2];
    }
}

//Gun Controls:

canvas.addEventListener('mousemove', e => {
    mouseCoords.x = e.offsetX;
    mouseCoords.y = e.offsetY;
})

canvas.addEventListener('mousedown', e => {
    if (!prepPhase && !gamePaused && !playerLost) gun.fire();
    if (powerUps.useTnt.on){
        mouseClick.x = e.offsetX;
        mouseClick.y = e.offsetY;
    }
    if (powerUps.useStunGrenade.on){
        mouseClick.x = e.offsetX;
        mouseClick.y = e.offsetY;
    }
})

pauseButton.addEventListener('click', () => {
    handlePause();
    pauseButton.blur();
});

function handlePause() {
    gamePaused = !gamePaused;
    if (gamePaused) {
        pauseButton.innerText = 'RESUME';
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.font = '48px "Roboto Slab", serif';
        ctx.fillStyle = 'yellow';
        ctx.fillText('Game Paused', 400, 250);

        ctx.font = '18px "Roboto Slab", serif';
        ctx.fillStyle = 'black';
        ctx.fillText(`Click Resume to continue`, 440, 300);

        spookySfxAudio.pause();

        //powerUp handling:
        for (let pu in powerUps) {
            pausePowerUp(pu);
        }
    }
    else {
        pauseButton.innerText = 'PAUSE';
        for (let pu in powerUps) {
            if (powerUps[pu].time) {
                startPowerUpTimer(pu, powerUps[pu].time);
            }
        }
    }
}

//Leaderboard Submit Save Game

/*
    lastStandLog = {
        noOfGames: 10,
        games: [
        {
            name: xyz,
            score: 32
        },
        {
        }...
        ]
    }
*/

//save game:

saveGamePanelInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        handleSave();
    }
});

saveGameButton.addEventListener('click', handleSave)

function handleSave() {
    let name = saveGamePanelInput.value;
    let log = localStorage.getItem('lastStandLogAsil');

    if (log === null) {
        let newLog = {
            noOfGames: 1,
            games: [
                {
                    name,
                    score: points
                }
            ]
        }
        localStorage.setItem('lastStandLogAsil', JSON.stringify(newLog));
    }

    else {
        log = JSON.parse(log);
        log.noOfGames++;
        log.games.push({ name, score: points });
        localStorage.setItem('lastStandLogAsil', JSON.stringify(log));
    }

    saveGamePanel.classList.add('saveGameDisplay1');
    saveGamePanel.classList.remove('saveGameDisplay2');

}

//Power Ups:

const jetpackButton = document.querySelector('#jetpack');

let powerUps = {
    'jetpack': {
        'on': false,
        'coins': 100,
        'id': null,
        'time': null,
        'totalTime': 10,
        'button': jetpackButton,
        'displayText': 'Press SPACEBAR to use Jetpack',
    },
    'tempImmunity': {
        'on': false,
        'coins': 40,
        'id': null,
        'time': null,
        'totalTime': 7.5,
        'button': document.querySelector('#temp-immunity'),
        'displayText': 'Zombies can\'t harm you for now',
    },
    'increaseHealth': {
        'on': false,
        'coins': 50,
        'id': null,
        'time': null,
        'totalTime': 15,
        'button': document.querySelector('#increase-health'),
        'displayText': 'Health Increased',
    },
    'reloadTime': {
        'on': false,
        'coins': 30,
        'id': null,
        'time': null,
        'totalTime': 7,
        'button': document.querySelector('#reload-time'),
        'displayText': 'You can shoot faster now!',
    },
    'useTnt': {
        'on': false,
        'blastOn': false,
        'coins': 5,
        'id': null,
        'time': null,
        'totalTime': 10,
        'button': document.querySelector('#use-tnt'),
        'displayText': 'Click on TNT to activate!',
    },
    'useStunGrenade': {
        'on': false,
        'blastOn': false,
        'coins': 5,
        'id': null,
        'time': null,
        'totalTime': 10,
        'button': document.querySelector('#use-stun-grenade'),
        'displayText': 'Click on Stun Grenade to activate!',
    },
}

for (let pu in powerUps) {
    let bu = powerUps[pu].button;
    bu.addEventListener('click', () => {
        if (coins >= powerUps[pu].coins && !powerUps[pu].on) {

            if (pu === 'useStunGrenade'){
                if (dragItem['stunGrenade'].list.length === 0){

                    return;
                }
            }
            else if (pu === 'useTnt'){
                if (dragItem['tnt'].list.length === 0){
                    return;
                }
            }

            bu.style.cursor = 'not-allowed';
            coins -= powerUps[pu].coins;
            startPowerUpTimer(pu, powerUps[pu].totalTime);

            if (pu === 'increaseHealth') {
                player1.health = Math.min(player1.health + 50, player1.totalHealth);
            }

            powerUpAudio.play();

        }
        bu.blur(); //remove keyboard focus from button
    })
}


function pausePowerUp(powerUp) {
    clearInterval(powerUps[powerUp].id);
    powerUps[powerUp].id = null;
}

function startPowerUpTimer(powerUp, time) {
    powerUps[powerUp].time = time;
    powerUps[powerUp].on = true;
    if (powerUp === 'useTnt' || powerUp === 'useStunGrenade'){
        powerUps[powerUp].blastOn = true;
    }

    pausePowerUp(powerUp); //just in case, else two intervals would double the speed of timer

    powerUps[powerUp].id = setInterval(() => {
        powerUps[powerUp].time -= .01;
        let percentTimeLeft = (powerUps[powerUp].totalTime - powerUps[powerUp].time) / powerUps[powerUp].totalTime * 100;
        powerUps[powerUp].button.style.background = `linear-gradient(#e8e8e4  ${percentTimeLeft}%, #FF4742 ${percentTimeLeft}%)`

        if (powerUps[powerUp].time <= 0) {
            pausePowerUp(powerUp);
            powerUps[powerUp].time = null;
            powerUps[powerUp].on = false;

            powerUps[powerUp].button.style.background = '';
        }
    }, 10);
}

//! ----------------------------------------------------

ctx.font = '75px sans serif';
ctx.fillText('Loading...  Please Wait', 150, 300);
ctx.font = '10px sans serif'; //Default value

let backgroundLoadingId = setInterval(() => {
    if (backgroundIsLoaded) {

        console.log('Game Started');
        clearInterval(backgroundLoadingId);
        initPrep();
    }
}, 100);


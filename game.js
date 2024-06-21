const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');
const controlPanel = document.querySelector('#control-panel');
const invasionPanel = document.querySelector('#invasion-panel');
const dragTest = document.querySelector('#control-panel div img');

const playerInstruction = document.querySelector('#player-instruction');
const saveGamePanel = document.querySelector('#saveGamePanel');
const saveGamePanelScore = document.querySelector('#saveGamePanel h3');
const saveGamePanelInput = document.querySelector('#saveGamePanel input');
const saveGameButton = document.querySelector('#submitSave');
//buttons:
const resetButton = document.querySelector('#resetButton');
const startInvasion = document.querySelector('#startInvasion');
const pauseButton = document.querySelector('#pauseButton');

let availableBlocks = 5;
let preparationTime = 20; //seconds
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
const spookySfxAudio = new Audio('audio/spookySfx1.mp3');
const slashingBlockAudio = new Audio('audio/slashing.mp3');
const slashingPlayerAudio = new Audio('audio/slashingPlayer.mp3');
const zombieDeathAudio = new Audio('audio/zombieDeath.mp3');

//Mouse coordinates: offsetX and offsetY within canvas for gun rotation:
let mouseCoords = {
    x: 1024,
    y: 475
}

//Zombie images:

//1 Running: sx: 250, sWidth = 400, sy = 200, sHeight = 550;
const zombieImages = {
    '1': {
        'activities': ['walking', 'slashing'],
        'walking': {
            'src': 'sprites/zombie/zombie1/Walking',
            'images': [],
            'start': '0.png',
            'total': 24,
            'sx': 250,
            'sy': 200,
            'sWidth': 400,
            'sHeight': 550
        },
        'slashing': {
            'src': 'sprites/zombie/zombie1/Slashing',
            'images': [],
            'start': '0.png',
            'total': 12,
            'sx': 250,
            'sy': 200,
            'sWidth': 650,
            'sHeight': 550
        }
    }
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
    constructor() {
        //position
        this.x = canvas.width / 2;
        this.y = 400;

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
        if (keys.flyUp.pressed) {
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
                    if (keys.flyUp.pressed) this.dy += this.jetPackSpeed * deltaT;
                }
                else {
                    //NORMAL Case:
                    this.y = newBottomY - this.height;
                }
            }
            else if (blocksToCheck > 0) {

                this.y = blocksToCheck[0].y + blocksToCheck[0].height;
                if (keys.flyUp.pressed) this.dy += this.jetPackSpeed * deltaT;
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
            playerWalkingAudio.play();
        }
        else {
            blocks.forEach(block => {
                block.dx = 0;
            })
            bgObjects.forEach(obj => {
                obj.dx = 0;
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

        this.totalHealth = 200;
        this.health = 200;
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
        ctx.drawImage(img, -this.width / 2, -this.height / 2, this.width, this.height);
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

            this.cooldown = this.cooldownPeriod;

            this.audio.play();

            setTimeout(() => {
                this.cooldown = 0;
                reloadAudio.play();
            }, this.cooldownPeriod * 1000);
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
            this.damage = 1.5;
        }
        else if (this.gun === gunImage2) {
            this.damage = 1;
        }
        else if (this.gun === gunImage3) {
            this.damage = 3;
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
                zombie.health = Math.max(0, zombie.health - this.damage * deltaT);
                console.log('bullet hit', this.damage);
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

        this.height = 140;

        this.setBasicDetails();
        this.updateDetails();
        this.updateFrames(16.6667);
    }

    setBasicDetails() {
        //Random offset is to avoid multiple zombies at a spot looking like one

        this.randomOffset = Math.random() * 6 - 3;
        if (this.number === '1') {
            this.damage = .001;
            this.health = 30;
            this.totalHealth = 30;
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
        this.width = this.height * this.ratio;

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
            ctx.drawImage(this.image, this.sx, this.sy, this.sWidth, this.sHeight, x, this.y, this.width, this.height);
        }
        else {
            ctx.save();
            ctx.translate(x + this.width, this.y);
            ctx.scale(-1, 1);
            ctx.drawImage(this.image, this.sx, this.sy, this.sWidth, this.sHeight, 0, 0, this.width, this.height);
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

        //x movement
        let updateX = true, newAction = 'walking';
        let dummyAddOffset = new Dummy(this.x + scrollOffset + this.dx * deltaT, this.y, this.width, this.height);

        // if there will be collision with block...
        for (let block of blocks) {
            if (xOverlap1(dummyAddOffset, block) && yOverlap1(block, dummyAddOffset)) {
                updateX = false;
                newAction = 'slashing';
                block.health = Math.max(0, block.health - this.damage * deltaT);
                slashingBlockAudio.play();
            }
        }

        //if there will be collision with player...
        if (xOverlap1(player1, dummyAddOffset) && yOverlap1(dummyAddOffset, player1)) {
            updateX = false;
            newAction = 'slashing';
            player1.health = Math.max(0, player1.health - this.damage * deltaT);
            slashingPlayerAudio.play();
        }

        if (updateX) {
            this.x = dummyAddOffset.x - scrollOffset;
        }

        this.updateDetails(newAction);
        this.updateFrames(deltaT);

        this.draw();
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

    //Skip if initializing or if tab went out of focus for more than 50ms (OR if refresh rate< 20 Hz)
    if (deltaT === 0 || deltaT > 50 || gamePaused) {
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

        //Remove blocks and zombies with 0 health:

        for (let i = blocks.length - 1; i >= 0; i--) {
            if (blocks[i].health === 0) {
                blocks.splice(i, 1);
            }
        }

        for (let i = zombies.length - 1; i >= 0; i--) {
            if (zombies[i].health === 0) {
                points += 5;
                zombies.splice(i, 1);
                zombieDeathAudio.play();
            }
        }

        //Draw:

        for (let block of blocks) {
            block.draw();
        }


        for (let zombie of zombies) {
            zombie.update(deltaT);
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

        //Win loss scenario

        if (zombies.length === 0) {
            if (noZombies['1'] !== 0 || noZombies['2'] !== 0 || noZombies['3'] !== 0) {
                //More zombies are yet to come
            }
            else {
                //Won the Game
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
            ctx.fillText('You Lost!', 400, 250);

            ctx.font = '18px "Roboto Slab", serif';
            ctx.fillStyle = 'black';
            ctx.fillText('Try Again :)', 440, 300);

            for (let i in zombieStopIds) {
                clearInterval(zombieStopIds[i]);
            }

            setTimeout(() => {
                resetButton.classList.remove('hide-element');
                saveGamePanel.classList.remove('saveGameDisplay1');
                saveGamePanel.classList.add('saveGameDisplay2');
                canvas.classList.add('hide-element');

                saveGamePanelScore.innerText = `Your Score: ${points}`;

            }, 1.5 * 1000);
            //Reset Button:

            spookySfxAudio.pause();
            return;
        }

        //draw Health Bars:
        blocks.forEach(block => {
            healthBar(block.x, block.y - 20, block.health, block.totalHealth, '#118ab2');
        })

        zombies.forEach(zombie => {
            healthBar(zombie.x + scrollOffset, zombie.y - 20, zombie.health, zombie.totalHealth, '#ef476f');
        })

    }

    ctx.font = '25px "Press Start 2P"';
    ctx.fillStyle = '#ffbe0b';
    ctx.fillText(`Points:`, canvas.width - 180, 35);
    ctx.fillText(`${points}`, canvas.width - 120, 70);
    ctx.font = '10px sans serif'; //Default value

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

        player1.update(deltaT);
        //* Player is to be updated last to keep it in front of everything else

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
const backgroundImage = new Image();
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

let blocks = [new Block(600, canvas.height - 100), new Block(800, canvas.height - 100), new Block(800, canvas.height - 200)];
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

let phaseChangeTimeoutIds = [];

saveGamePanel.classList.add('saveGameDisplay1');

function initInvasion() {

    spookySfxAudio.play();

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

    player1 = new Player();
    player1.draw();

    //Zombies Number

    //* set this
    noZombies = {
        '1': Math.floor(Math.sqrt(phase) * 10),
        '2': 0,
        '3': 0
    }

    zombieStopIds = {
        '1': null,
        '2': null,
        '3': null
    }

    zombieStopIds['1'] = setInterval(() => {
        noZombies['1']--;
        if (Math.random() < .5) {

            zombies.push(new Zombie('1', .1, 0, -650))
        }
        else {
            zombies.push(new Zombie('1', .1, 0, canvas.width + 650))
        }
        if (noZombies['1'] === 0) {
            clearInterval(zombieStopIds['1']);
        }
    }, 250);

    document.title = 'Last Stand | Fight the Zombies!';
    playerInstruction.innerText = 'Kill all zombies to win!';

    requestAnimationFrame(animateInvasion);
}

function initPrep() {
    pauseButton.classList.add('hide-element');
    startInvasion.classList.remove('hide-element');

    phaseChangeTimeoutIds.push(setTimeout(() => {
        phase++;
        prepPhase = false;
    }, (preparationTime + phase * 10) * 1000));

    prepPhase = true;

    resetButton.classList.add('hide-element');
    controlPanel.style.display = 'block';
    invasionPanel.style.display = 'none';

    keys.right.pressed = false;
    keys.left.pressed = false;
    keys.flyUp.pressed = false;

    availableBlocks = Math.min(15, 5 + 3 * phase);

    let txt = document.querySelector('#control-panel div h3');
    txt.innerText = availableBlocks;

    player1 = new Player();
    player1.draw();

    blocks = [];
    zombies = [];

    bgObjects = [new BgObject(-1, -1, 'background'), new BgObject(-1317, -1, 'background'), new BgObject(1317, -1, 'background'), new BgObject(1317 * 2, -1, 'background'), new BgObject(1317 * 3, -1, 'background'), , new BgObject(1317 * 4, -1, 'background'), , new BgObject(1317 * (-2), -1, 'background'), new BgObject(1317 * (-3), -1, 'background'), new BgObject(1317 * (-4), -1, 'background')];

    document.title = 'Last Stand | Preparation';
    playerInstruction.innerText = 'Drag and Drop Blocks. Build a protection before the zombies arrive!';

    requestAnimationFrame(animatePrep);
}

// initInvasion();

initPrep();

//Reset Button:

resetButton.addEventListener('click', () => {
    phase = 0;
    playerLost = false;
    playerInstruction.classList.remove('hide-element');
    canvas.classList.remove('hide-element');
    for (let id of phaseChangeTimeoutIds) {
        clearInterval(id);
    }
    initPrep();
}
);

//Start Invasion Button:

startInvasion.addEventListener('click', () => {
    if (prepPhase) {
        clearInterval(phaseChangeTimeoutIds[0]);
        phase++;
        prepPhase = false;
    }
});

//Drag blocks

let dragOffsets = {
    x: 0,
    y: 0
}

dragTest.addEventListener('dragstart', e => {
    if (availableBlocks && prepPhase) {
        updateDragOffsets(e);
    }
})

function updateDragOffsets(e) {
    dragOffsets.x = e.offsetX;
    dragOffsets.y = e.offsetY;
}

canvas.addEventListener('dragover', e => {
    if (availableBlocks && prepPhase) {
        e.preventDefault();
        dragoverHandler(e);
    }
})


canvas.addEventListener('drop', e => {
    if (!prepPhase || !availableBlocks) return;

    blocks.push(new Block(0, 0, 0, 0)); //Placeholder block, because we pop in dragoverhandler

    availableBlocks--;
    let txt = document.querySelector('#control-panel div h3');
    txt.innerText = availableBlocks;

})

function dragoverHandler(e) {
    //below line no need because it's checked when fn is called
    // if (!availableBlocks || !prepPhase) return;

    blocks.pop();

    let newX = e.offsetX - dragOffsets.x;
    let newY = e.offsetY - dragOffsets.y;

    let newBlock = new Block(newX, newY);

    // //Disallow player to place blocks near spawn area of player:
    // toBeSkipped = false;
    // if (newX < canvas.width / 2 + 100 + scrollOffset && newX > canvas.width / 2 - 25 + scrollOffset||
    //     newX + newBlock.width > canvas.width / 2 - 25 + scrollOffset && newX + newBlock.width < canvas.width / 2 + 100 + scrollOffset
    // ) {
    //     toBeSkipped = true;
    //     blocks.push(new Block(0, 0, 0, 0)); //Placeholder block, because we pop in dragoverhandler

    //     return;
    // }

    let blockHeight = newBlock.height;

    let lowestBlockY = canvas.height - blockHeight;

    blocks.forEach(block => {
        if (xOverlap1(newBlock, block) && (lowestBlockY < (block.y + block.height))) {
            if (block.y <= lowestBlockY) {
                lowestBlockY = block.y - blockHeight;
            }
        }
    })

    newBlock.y = lowestBlockY;

    if (newBlock.y >= 0) {
        blocks.push(newBlock);
    }
}

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
})

pauseButton.addEventListener('click', () => {
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

    }
    else {
        pauseButton.innerText = 'PAUSE';

    }
})

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

saveGameButton.addEventListener('click', () => {
    let name = saveGamePanelInput.value;
    let log = localStorage.getItem('lastStandLogAsil');

    if (log === null){
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

    else{
        log = JSON.parse(log);
        log.noOfGames++;
        log.games.push({name, score: points});
        localStorage.setItem('lastStandLogAsil', JSON.stringify(log));
    }

})

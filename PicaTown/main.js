const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: "#88ccff",
    physics: {
        default: "arcade",
        arcade: { debug: false }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let player;
let keys;

function preload() {
    // 加载你上传的人物贴图（一定要放到 assets 文件夹）
    this.load.image("player", "assets/character.png");
}

function create() {
    // 显示你的人物
    player = this.physics.add.sprite(400, 300, "player");

    // 调整缩放（如果角色太大/太小）
    player.setScale(1);

    // WASD 控制
    keys = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D
    });
}

function update() {
    player.setVelocity(0);

    if (keys.left.isDown) player.setVelocityX(-150);
    else if (keys.right.isDown) player.setVelocityX(150);

    if (keys.up.isDown) player.setVelocityY(-150);
    else if (keys.down.isDown) player.setVelocityY(150);
}
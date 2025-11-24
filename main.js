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



const API_BASE = "http://localhost:3000/api"; // 开发阶段先指向本地

let authToken = null;

async function api(path, options = {}) {
    const headers = options.headers || {};
    headers["Content-Type"] = "application/json";
    if (authToken) headers["Authorization"] = "Bearer " + authToken;
    const res = await fetch(API_BASE + path, {
        ...options,
        headers
    });
    return res.json();
}

window.addEventListener("DOMContentLoaded", () => {
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const loginMsg = document.getElementById("login-message");
    const loginPanel = document.getElementById("login-panel");
    const gamePanel = document.getElementById("game-panel");
    const nicknameSpan = document.getElementById("nickname");
    const goldSpan = document.getElementById("gold");
    const tradesDiv = document.getElementById("trades");

    document.getElementById("btn-register").onclick = async () => {
        const data = await api("/auth/register", {
            method: "POST",
            body: JSON.stringify({
                username: usernameInput.value,
                password: passwordInput.value
            })
        });
        loginMsg.textContent = data.error || "注册成功，可以登录了";
    };

    document.getElementById("btn-login").onclick = async () => {
        const data = await api("/auth/login", {
            method: "POST",
            body: JSON.stringify({
                username: usernameInput.value,
                password: passwordInput.value
            })
        });
        if (data.error) {
            loginMsg.textContent = data.error;
        } else {
            authToken = data.token;
            loginPanel.style.display = "none";
            gamePanel.style.display = "block";
            nicknameSpan.textContent = data.user.nickname;
            goldSpan.textContent = data.user.gold;
        }
    };

    document.getElementById("btn-show-trades").onclick = async () => {
        const list = await api("/trades");
        tradesDiv.innerHTML = "";
        list.forEach(t => {
            const div = document.createElement("div");
            div.textContent = `#${t.id} 卖家${t.sellerId} 出售 ${t.itemKey} x${t.quantity} 单价 ${t.pricePerUnit}`;
            const btn = document.createElement("button");
            btn.textContent = "购买";
            btn.onclick = async () => {
                const res = await api(`/trades/${t.id}/buy`, { method: "POST" });
                alert(res.error || "购买成功");
            };
            div.appendChild(btn);
            tradesDiv.appendChild(div);
        });
    };
});

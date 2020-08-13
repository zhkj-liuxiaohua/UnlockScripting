// 后台事件记录addons
// log文件保存路径：%APPDATA%\..\Roaming\Minecraft.Server\logs
// 使用注意：请先将BDS开服配置server.properties文件中的 content-log-file-enabled 设置为 true

// 必要初始化，所有脚本从此处开始
var system = server.registerSystem(0, 0);

// 所有待监听事件
const EKEY = {
    OnAttack:"minecraft:player_attacked_entity",
    OnAcquiredItem:"minecraft:entity_acquired_item",
    OnChangeHand:"minecraft:entity_carried_item_changed",
    OnSpawn:"minecraft:entity_created",
    OnDie:"minecraft:entity_death",
    OnDrop:"minecraft:entity_dropped_item",
    OnEquip:"minecraft:entity_equipped_armor",
    OnStartRidding:"minecraft:entity_start_riding",
    OnStopRidding:"minecraft:entity_stop_riding",
    OnActTick:"minecraft:entity_tick",
    OnUseItem:"minecraft:entity_use_item",
    OnStartDig:"minecraft:block_destruction_started",
    OnStopDig:"minecraft:block_destruction_stopped",
    OnInteractBlock:"minecraft:block_interacted_with",
    OnPistonPush:"minecraft:piston_moved_block",
    OnDestroyBlock:"minecraft:player_destroyed_block",
    OnPlacedBlock:"minecraft:player_placed_block",
    OnPlaySound:"minecraft:play_sound",
    OnWeatherChanged:"minecraft:weather_changed",
    DoShowChat:"minecraft:display_chat_event",
    DoRunCmd:"minecraft:execute_command",
    DoPlaySound:"minecraft:play_sound",
    DoSpawnParticleToAct:"minecraft:spawn_particle_attached_entity",
    DoSpawnParticleToWorld:"minecraft:spawn_particle_in_world",
    DoSetLogConfig:"minecraft:script_logger_config"
};

// 相关内置属性
const ETAG = {
    ArmorContainer:"minecraft:armor_container",
    Attack: "minecraft:attack",
    Collision: "minecraft:collision_box",
    Damage: "minecraft:damage_sensor",
    Equipment: "minecraft:equipment",
    Equippable: "minecraft:equippable",
    Explode: "minecraft:explode",
    HandContainer: "minecraft:hand_container",
    Healable: "minecraft:healable",
    Health: "minecraft:health",
    HotbarContainer: "minecraft:hotbar_container",
    Interact: "minecraft:interact",
    Inventory: "minecraft:inventory",
    InventoryContainer: "minecraft:inventory_container",
    Lookat: "minecraft:lookat",
    Nameable: "minecraft:nameable",
    Position: "minecraft:position",
    Rotation: "minecraft:rotation",
    Shooter: "minecraft:shooter",
    SpawnEntity: "minecraft:spawn_entity",
    Teleport: "minecraft:teleport",
    TickWorld: "minecraft:tick_world",
};

// 打开log开关
var islogon = false;
function turnLogOn() {
    if (!islogon) {
        let logs = system.createEventData(EKEY.DoSetLogConfig);
        logs.data.log_information = true;
        logs.data.log_errors = true;
        logs.data.log_warnings = true;
        system.broadcastEvent(EKEY.DoSetLogConfig, logs);
        islogon = true;
    }
}

// 输出消息至log文件
function log(a) {
    console.log(a);
}

// 广播一则信息
function chat(m) {
    let msgs = system.createEventData(EKEY.DoShowChat);
    msgs.data.message = m;
    system.broadcastEvent(EKEY.DoShowChat, msgs);
}

// 以世界拥有者身份运行一条指令，需加斜杆，需要作弊的指令可能无法在非开启作弊的世界使用
function runcmd(c) {
    system.executeCommand(c, (e) => { });
}

// 取维度
function getDimension(e) {
    // TODO 暂无法实现
    return "";
    /*
    let n = system.getComponent(e, "minecraft:environment_sensor");
    return JSON.stringify(n);
    
    let n = system.getComponent(e, ETAG.TickWorld);
    let t = n.data.ticking_area;
    let bpos = {};
    let v3 = getVec3(e);
    bpos.x = parseInt(v3.x);
    bpos.y = parseInt(v3.y);
    bpos.z = parseInt(v3.z);
    let b = system.getBlock(t, bpos);
    let bs = system.getComponent(b, "minecraft:blockstate");
    return JSON.stringify(bs);
    */
}

// 取实体名称
function getName(e) {
    if (system.hasComponent(e, ETAG.Nameable)) {
        let n = system.getComponent(e, ETAG.Nameable);
        if (n != null) {
            return n.data.name;
        }
    }
    return null;
}

// 取玩家名称
function getPlayerName(p) {
    if (p.__identifier__ == "minecraft:player") {
        return getName(p);
    }
    return null;
}

// 取位置
function getVec3(e) {
    let pos = system.getComponent(e, ETAG.Position);
    if (pos != null)
        return pos.data;
    return null;
}

// 取方块id
function getBlockName(e, bpos) {
    let n = system.getComponent(e, ETAG.TickWorld);
    let t = n.data.ticking_area;
    let b = system.getBlock(t, bpos);
    return b.__identifier__;
}

system.initialize = function () {
    turnLogOn();
    log("服务器开始启动..");

    // 以下代码设置监听器

    // 攻击监听，示例用
    this.listenForEvent(EKEY.OnAttack, (e) => {
        let str = "玩家发动了一个攻击。";
        log(str);
        chat(str);
        // 事件内可随时执行指令
        let p = e.data.player;
        let playername = getName(p);
        runcmd('/title "' + playername + '" actionbar （测试）举起手来！');
    });
    
    // 破坏方块监听
    this.listenForEvent(EKEY.OnDestroyBlock, (e) => {
        let d = e.data;
        let p = d.player;
        let playername = getName(p);
        let pvec3 = getVec3(p);
        let pev = getDimension(p);
        let bname = d.block_identifier;
        let bpos = d.block_position;
        let str = "玩家 " + playername + pev + " 于 (" + parseInt(pvec3.x) + "," + parseInt(pvec3.y) + "," + parseInt(pvec3.z) + ") 位置 破坏 (" + bpos.x + "," + bpos.y + "," + bpos.z + ") 处的 " + bname + " 方块。";
        chat(str);
        log(str);
    });
    
    // 放置方块监听
    this.listenForEvent(EKEY.OnPlacedBlock, (e) => {
        let d = e.data;
        let p = d.player;
        let playername = getName(p);
        let pvec3 = getVec3(p);
        let pev = getDimension(p);
        let bpos = d.block_position;
        let bname = getBlockName(p, bpos);
        let str = "玩家 " + playername + pev + " 于 (" + parseInt(pvec3.x) + "," + parseInt(pvec3.y) + "," + parseInt(pvec3.z) + ") 位置 放置 (" + bpos.x + "," + bpos.y + "," + bpos.z + ") 处的 " + bname + " 方块。";
        chat(str);
        log(str);
    });

    // 重生监听
    this.listenForEvent(EKEY.OnSpawn, (e) => {
        let d = e.data;
        let p = d.entity;
        if (p.__identifier__ == "minecraft:player") {
            // 玩家加入游戏
            let playername = getName(p);
            let pvec3 = getVec3(p);
            let pev = getDimension(p);
            let str = "玩家 " + playername + pev + " 已于 (" + parseInt(pvec3.x) + "," + parseInt(pvec3.y) + "," + parseInt(pvec3.z) + ") 位置 重生。";
            chat(str);
            log(str);
        }
    });

    // 死亡监听
    this.listenForEvent(EKEY.OnDie, (e) => {
        let d = e.data;
        let act = d.entity;
        let actname = getName(act);
        if (actname != null && actname != "") {     // 命名实体死亡
            let pvec3 = getVec3(act);
            let pev = getDimension(act);
            let str = actname + pev + " 在 (" + parseInt(pvec3.x) + "," + parseInt(pvec3.y) + "," + parseInt(pvec3.z) + ") 位置 被杀死了。";
            chat(str);
            log(str);
        }
    });

    // 使用物品监听
    this.listenForEvent(EKEY.OnUseItem, (e) => {
        let d = e.data;
        let p = d.entity;
        if (p.__identifier__ == "minecraft:player") {
            // 玩家使用物品
            let playername = getName(p);
            let pvec3 = getVec3(p);
            let pev = getDimension(p);
            let umet = d.use_method;
            let itemname = d.item_stack.item;
            let str = "玩家 " + playername + pev + " 于 (" + parseInt(pvec3.x) + "," + parseInt(pvec3.y) + "," + parseInt(pvec3.z) + ") 位置 用 " + umet + " 方式 使用了 " + itemname + " 物品。";
            chat(str);
            log(str);
        }
    });

    // 获取物品监听
    this.listenForEvent(EKEY.OnAcquiredItem, (e) => {
        let d = e.data;
        let p = d.entity;
        if (p.__identifier__ == "minecraft:player") {
            // 玩家获取物品
            let playername = getName(p);
            let pvec3 = getVec3(p);
            let pev = getDimension(p);
            let amet = d.acquisition_method;
            let itemname = d.item_stack.item;
            let count = d.acquired_amount;
            let str = "玩家 " + playername + pev + " 于 (" + parseInt(pvec3.x) + "," + parseInt(pvec3.y) + "," + parseInt(pvec3.z) + ") 位置 用 " + amet + " 方式 获取了 " + count + " 个 " + itemname + " 物品。";
            chat(str);
            log(str);
        }
    });

    // 掉落物品监听
    this.listenForEvent(EKEY.OnDrop, (e) => {
        let d = e.data;
        let p = d.entity;
        if (p.__identifier__ == "minecraft:player") {
            // 玩家掉落物品
            let playername = getName(p);
            let pvec3 = getVec3(p);
            let pev = getDimension(p);
            let itemname = d.item_stack.item;
            let count = d.item_stack.count;
            let str = "玩家 " + playername + pev + " 于 (" + parseInt(pvec3.x) + "," + parseInt(pvec3.y) + "," + parseInt(pvec3.z) + ") 位置 掉落了 " + count + " 个 " + itemname + " 物品。";
            chat(str);
            log(str);
        }
    });

    // 穿戴装备监听
    this.listenForEvent(EKEY.OnEquip, (e) => {
        let d = e.data;
        let p = d.entity;
        if (p.__identifier__ == "minecraft:player") {
            // 玩家穿戴装备
            let playername = getName(p);
            let pvec3 = getVec3(p);
            let pev = getDimension(p);
            let itemname = d.item_stack.item;
            let slot = d.slot;
            let str = "玩家 " + playername + pev + " 于 (" + parseInt(pvec3.x) + "," + parseInt(pvec3.y) + "," + parseInt(pvec3.z) + ") 位置 切换装备 " + itemname + " 至 " + slot + " 栏。";
            chat(str);
            log(str);
        }
    });

    // 开启方块监听
    this.listenForEvent(EKEY.OnInteractBlock, (e) => {
        let d = e.data;
        let p = d.player;
        let bpos = d.block_position;
        let playername = getName(p);
        let pvec3 = getVec3(p);
        let pev = getDimension(p);
        let bname = getBlockName(p, bpos);
        let str = "玩家 " + playername + pev + " 于 (" + parseInt(pvec3.x) + "," + parseInt(pvec3.y) + "," + parseInt(pvec3.z) + ") 位置 开启 (" + bpos.x + "," + bpos.y + "," + bpos.z + ") 处的 " + bname + " 方块。";;
        chat(str);
        log(str);
    });

    log("[Logging] 行为日志监听已成功加载。");
};

system.shutdown = function () {
    log("[Logging] 已结束。");
};
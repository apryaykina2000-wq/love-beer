
const WIDTH = 540, HEIGHT = 960;
const STORAGE_KEY_BEST = 'sasha_lubit_pivo_best';
const TARGET_SCORE = 60;

const DISPLAY = {
  PLAYER_H: 150, ITEM_H: 70,
  OBST_LOW_H: 90, OBST_MID_H: 120, OBST_HIGH_H: 170,
  GROUND_H: 220, GROUND_RUNLINE_FROM_TOP: 54
};

function scaleToHeight(scene, key, desiredH) {
  const tx = scene.textures.get(key);
  if (!tx) return 1;
  const b = tx.getSourceImage();
  const h = b && b.height ? b.height : desiredH;
  return desiredH / h;
}

class Boot extends Phaser.Scene {
  constructor(){ super('Boot'); }
  preload(){
    ['player_run_1','player_run_2','player_run_3','player_jump_1','player_jump_2',
     'item_beer','item_fish','item_glass',
     'obstacle_low','obstacle_mid','obstacle_high',
     'ground_tile','bg_sky','bg_hills_far','bg_hills_near',
     'cloud_1','cloud_2','cloud_3',
     'ui_btn_play','ui_btn_play_pressed','ui_btn_restart','ui_btn_home',
     'medal_bronze','medal_silver','medal_gold','ui_counter'
    ].forEach(k => this.load.image(k, 'assets/img/'+k+'.png'));

    this.load.audio('sfx_jump',['assets/audio/jump.ogg','assets/audio/jump.mp3']);
    this.load.audio('sfx_item',['assets/audio/coin.ogg','assets/audio/coin.mp3']);
    this.load.audio('sfx_win',['assets/audio/win.ogg','assets/audio/win.mp3']);
    this.load.audio('music',['assets/audio/music.ogg','assets/audio/music.mp3']);
  }
  create(){
    const colors = [0xff6b6b,0xffd93d,0x6bcfff,0xb28dff,0x66d06b,0xff9ecd];
    for (let i=0;i<colors.length;i++){
      const g = this.add.graphics();
      g.fillStyle(colors[i],1);
      g.fillRect(0,0,8,14);
      const rt = this.add.renderTexture(0,0,8,14).setVisible(false);
      rt.draw(g); rt.saveTexture('confetti_'+i); g.destroy(); rt.destroy();
    }
    this.scene.start('Menu');
  }
}

class Menu extends Phaser.Scene {
  constructor(){ super('Menu'); }
  create(){
    this.add.image(0,0,'bg_sky').setOrigin(0).setDisplaySize(WIDTH, HEIGHT);
    const far = this.add.tileSprite(0, HEIGHT*0.25, WIDTH, HEIGHT*0.35, 'bg_hills_far').setOrigin(0,0);
    const near = this.add.tileSprite(0, HEIGHT*0.45, WIDTH, HEIGHT*0.45, 'bg_hills_near').setOrigin(0,0);
    this.far=far; this.near=near;

    this.clouds = this.add.group();
    ['cloud_1','cloud_2','cloud_3'].forEach((k,i)=>{
      const y = 120 + i*90;
      const c = this.add.image(80+i*140, y, k).setAlpha(0.9);
      c.setScale(scaleToHeight(this, k, 90));
      this.clouds.add(c);
    });
    this.tweens.add({ targets: this.clouds.getChildren(), x: '+=120', duration: 10000, yoyo:true, repeat:-1, ease:'Sine.inOut' });

    const ground = this.add.tileSprite(0, HEIGHT, WIDTH, DISPLAY.GROUND_H, 'ground_tile').setOrigin(0,1).setDepth(2);
    const title = this.add.text(WIDTH/2, 130, 'САША ЛЮБИТ ПИВО', {
      fontFamily:'Arial', fontSize:'46px', color:'#ffffff', stroke:'#0d3b3b', strokeThickness:8
    }).setOrigin(0.5).setDepth(3);

    const best = parseInt(localStorage.getItem(STORAGE_KEY_BEST) || '0',10);
    this.add.text(WIDTH/2, 190, 'РЕКОРД: '+best, {
      fontFamily:'Arial', fontSize:'28px', color:'#ffffff', stroke:'#0d3b3b', strokeThickness:6
    }).setOrigin(0.5).setDepth(3);

    if (this.textures.exists('ui_btn_play')){
      const btn = this.add.image(WIDTH/2, HEIGHT-180, 'ui_btn_play').setInteractive({useHandCursor:true}).setDepth(5);
      this.add.text(btn.x, btn.y, 'ИГРАТЬ', { fontFamily:'Arial', fontSize:'40px', color:'#ffffff', stroke:'#0d3b3b', strokeThickness:8 }).setOrigin(0.5).setDepth(6);
      btn.on('pointerdown', ()=> this.scene.start('Game'));
      btn.on('pointerover', ()=> btn.setTexture(this.textures.exists('ui_btn_play_pressed')?'ui_btn_play_pressed':'ui_btn_play'));
      btn.on('pointerout', ()=> btn.setTexture('ui_btn_play'));
    }
    const zone = this.add.zone(0,0,WIDTH,HEIGHT).setOrigin(0).setInteractive({useHandCursor:true}).setDepth(4);
    zone.on('pointerdown', ()=> this.scene.start('Game'));
  }
  update(){ if (this.far) this.far.tilePositionX += 0.15; if (this.near) this.near.tilePositionX += 0.3; }
}

class Game extends Phaser.Scene {
  constructor(){ super('Game'); }
  create(){
    this.input.addPointer(2);
    this.add.image(0,0,'bg_sky').setOrigin(0).setDisplaySize(WIDTH, HEIGHT);
    this.far = this.add.tileSprite(0, HEIGHT*0.25, WIDTH, HEIGHT*0.35, 'bg_hills_far').setOrigin(0,0);
    this.near = this.add.tileSprite(0, HEIGHT*0.45, WIDTH, HEIGHT*0.45, 'bg_hills_near').setOrigin(0,0);
    const gh = DISPLAY.GROUND_H;
    this.ground = this.add.tileSprite(0, HEIGHT, WIDTH, gh, 'ground_tile').setOrigin(0,1).setDepth(2);
    this.groundY = HEIGHT - gh + DISPLAY.GROUND_RUNLINE_FROM_TOP;

    // Player
    this.player = this.physics.add.sprite(160, this.groundY, 'player_run_1').setOrigin(0.5,1);
    this.player.setScale(scaleToHeight(this,'player_run_1', DISPLAY.PLAYER_H));
    this.player.body.setGravityY(2200);
    this.player.setCollideWorldBounds(true);
    this.anims.create({ key:'run', frames:[{key:'player_run_1'},{key:'player_run_2'},{key:'player_run_3'}], frameRate: 10, repeat:-1 });
    this.anims.create({ key:'jump', frames:[{key:'player_jump_1'},{key:'player_jump_2'}], frameRate: 6, repeat:0 });
    this.player.play('run');

    // HUD with icon
    let x0 = 20;
    if (this.textures.exists('ui_counter')){
      const ic = this.add.image(20, 30, 'ui_counter').setOrigin(0,0.5);
      ic.setScale(scaleToHeight(this,'ui_counter', 26));
      x0 = 20 + ic.displayWidth + 8;
    }
    this.score = 0;
    this.best = parseInt(localStorage.getItem(STORAGE_KEY_BEST) || '0',10);
    this.scoreText = this.add.text(x0, 16, '0/60', { fontFamily:'Arial', fontSize:'28px', color:'#ffffff', stroke:'#0d3b3b', strokeThickness:6 }).setDepth(10);
    this.bestText  = this.add.text(WIDTH-20, 16, 'Рекорд: '+this.best, { fontFamily:'Arial', fontSize:'28px', color:'#ffffff', stroke:'#0d3b3b', strokeThickness:6 }).setOrigin(1,0).setDepth(10);

    // Controls
    this.canDouble = true;
    this.input.on('pointerdown', ()=> this.tryJump());
    this.input.keyboard.on('keydown-SPACE', ()=> this.tryJump());
    this.input.keyboard.on('keydown-UP', ()=> this.tryJump());

    // Groups
    this.items = this.physics.add.group();
    this.obstacles = this.physics.add.group();
    this.physics.add.overlap(this.player, this.items, (player, it)=>{ it.destroy(); this.onCollect(); }, null, this);
    this.physics.add.overlap(this.player, this.obstacles, ()=> this.onHit(), null, this);

    // pacing
    this.speed = 4.2;
    this.spawnT = 0; this.spawnInterval = 1600;
    this.itemT  = 0; this.itemInterval  = 900;

    // clouds motion
    this.clouds = this.add.group();
    ['cloud_1','cloud_2','cloud_3'].forEach((k,i)=>{
      const y = 100 + i*110;
      const c = this.add.image(Phaser.Math.Between(40, WIDTH-40), y, k).setAlpha(0.9);
      c.setScale(scaleToHeight(this, k, 90));
      this.clouds.add(c);
    });
    this.tweens.add({ targets: this.clouds.getChildren(), x: '+=150', duration: 9000, yoyo:true, repeat:-1, ease:'Sine.inOut' });
  }

  tryJump(){
    const onGround = (this.player.y >= this.groundY - 1 && this.player.body.velocity.y >= 0);
    if (onGround){
      this.player.setVelocityY(-820);
      this.player.play('jump', true);
      this.canDouble = true;
      this.sound.play('sfx_jump',{volume:0.4, detune:0});
    } else if (this.canDouble){
      this.player.setVelocityY(-740);
      this.player.play('jump', true);
      this.canDouble = false;
      this.sound.play('sfx_jump',{volume:0.35, detune:-50});
    }
  }

  onCollect(){
    this.score += 1;
    this.scoreText.setText(this.score + '/60');
    this.sound.play('sfx_item',{volume:0.4});
    if (this.score >= TARGET_SCORE) this.winGame();
  }

  onHit(){ this.loseGame(); }

  spawnObstacle(){
    const rnd = Math.random();
    let key = 'obstacle_low';
    if (this.score >= 40) key = rnd < 0.45 ? 'obstacle_high' : (rnd < 0.75 ? 'obstacle_mid' : 'obstacle_low');
    else if (this.score >= 20) key = rnd < 0.25 ? 'obstacle_high' : (rnd < 0.65 ? 'obstacle_mid' : 'obstacle_low');
    else key = rnd < 0.6 ? 'obstacle_low' : 'obstacle_mid';

    const desiredH = (key==='obstacle_low')?DISPLAY.OBST_LOW_H:(key==='obstacle_mid')?DISPLAY.OBST_MID_H:DISPLAY.OBST_HIGH_H;
    const s = scaleToHeight(this, key, desiredH);
    const o = this.obstacles.create(WIDTH+80, this.groundY, key).setOrigin(0.5,1).setScale(s);
    o.body.allowGravity = false; o.setImmovable(true);
  }

  spawnItemsRow(){
    const keys = ['item_beer','item_fish','item_glass'].filter(k => this.textures.exists(k));
    if (!keys.length) return;
    const baseY = this.groundY - Phaser.Math.Between(120, 220);
    const count = Phaser.Math.Between(2,3);
    for (let i=0;i<count;i++){
      const key = keys[Phaser.Math.Between(0, keys.length-1)];
      const s = scaleToHeight(this, key, DISPLAY.ITEM_H);
      const it = this.items.create(WIDTH + 40 + i*54, baseY, key).setOrigin(0.5).setScale(s);
      it.body.allowGravity = false; it._phase = Math.random()*Math.PI*2;
    }
  }

  winGame(){
    const keys = ['confetti_0','confetti_1','confetti_2','confetti_3','confetti_4','confetti_5'];
    for (let i=0;i<140;i++){
      const key = keys[i % keys.length];
      const p = this.add.sprite(Phaser.Math.Between(0,WIDTH), -20, key).setDepth(20);
      const dur = Phaser.Math.Between(1200, 1800);
      this.tweens.add({ targets:p, y:HEIGHT+30, x:p.x+Phaser.Math.Between(-120,120), angle:Phaser.Math.Between(180,540), duration:dur, ease:'Cubic.in', onComplete:()=>p.destroy() });
    }
    this.sound.play('sfx_win',{volume:0.7});
    this.time.delayedCall(1400, ()=> this.scene.start('Result',{score:this.score, best:this.best, win:true}) );
  }
  loseGame(){ this.scene.start('Result',{score:this.score, best:this.best, win:false}); }

  update(time, delta){
    this.far.tilePositionX += 0.2;
    this.near.tilePositionX += 0.4;
    this.ground.tilePositionX += 1.8;

    if (this.player.body.velocity.y >= 0 && this.player.y >= this.groundY-1){
      this.player.y = this.groundY; this.player.play('run', true);
    }

    if (this.score < 20){ this.speed = 4.2; this.spawnInterval = 1600; this.itemInterval = 900; }
    else if (this.score < 40){ this.speed = 5.2; this.spawnInterval = 1300; this.itemInterval = 800; }
    else { this.speed = 6.2; this.spawnInterval = 1100; this.itemInterval = 700; }

    this.spawnT = (this.spawnT||0) + delta; if (this.spawnT >= this.spawnInterval){ this.spawnT = 0; this.spawnObstacle(); if (this.score >= 35 && Math.random()<0.35) this.time.delayedCall(300, ()=> this.spawnObstacle()); }
    this.itemT  = (this.itemT ||0) + delta; if (this.itemT  >= this.itemInterval ){ this.itemT  = 0; this.spawnItemsRow(); }

    const vx = this.speed*2.1;
    this.obstacles.children.iterate(o => { if (o){ o.x -= vx; if (o.x < -120) o.destroy(); } });
    this.items.children.iterate(it => { if (it){ it.x -= vx; if (it.x < -80) it.destroy(); it.y += Math.sin((time*0.005 + it._phase))*0.35; } });
  }
}

class Result extends Phaser.Scene {
  constructor(){ super('Result'); }
  init(data){ this.score = data.score||0; this.best = data.best||0; this.win = !!data.win; }
  create(){
    this.add.image(0,0,'bg_sky').setOrigin(0).setDisplaySize(WIDTH, HEIGHT);
    this.add.tileSprite(0, HEIGHT*0.25, WIDTH, HEIGHT*0.35, 'bg_hills_far').setOrigin(0,0);
    this.add.tileSprite(0, HEIGHT*0.45, WIDTH, HEIGHT*0.45, 'bg_hills_near').setOrigin(0,0);
    const gh = DISPLAY.GROUND_H;
    this.add.tileSprite(0, HEIGHT, WIDTH, gh, 'ground_tile').setOrigin(0,1);

    if (this.score > this.best){
      this.best = this.score; localStorage.setItem(STORAGE_KEY_BEST, String(this.best));
    }

    this.add.text(WIDTH/2, 120, this.win ? 'ПОБЕДА!' : 'ИТОГ', { fontFamily:'Arial', fontSize:'56px', color:'#ffffff', stroke:'#0d3b3b', strokeThickness:8 }).setOrigin(0.5);
    this.add.text(WIDTH/2, 190, `СЧЁТ: ${this.score} / 60`, { fontFamily:'Arial', fontSize:'32px', color:'#ffffff', stroke:'#0d3b3b', strokeThickness:6 }).setOrigin(0.5);
    this.add.text(WIDTH/2, 235, `РЕКОРД: ${this.best}`, { fontFamily:'Arial', fontSize:'28px', color:'#ffffff', stroke:'#0d3b3b', strokeThickness:6 }).setOrigin(0.5);

    let medalKey = null, medalName = '';
    if (this.score >= 60){ medalKey='medal_gold'; medalName='ЗОЛОТО'; }
    else if (this.score >= 40){ medalKey='medal_silver'; medalName='СЕРЕБРО'; }
    else if (this.score >= 20){ medalKey='medal_bronze'; medalName='БРОНЗА'; }
    if (medalKey && this.textures.exists(medalKey)){
      const s = scaleToHeight(this, medalKey, 120);
      this.add.image(WIDTH/2, 320, medalKey).setOrigin(0.5).setScale(s);
      this.add.text(WIDTH/2, 400, medalName, { fontFamily:'Arial', fontSize:'26px', color:'#ffffff', stroke:'#0d3b3b', strokeThickness:6 }).setOrigin(0.5);
    }

    const btnAgain = this.textures.exists('ui_btn_restart') ? this.add.image(WIDTH/2, HEIGHT-220, 'ui_btn_restart').setInteractive({useHandCursor:true}) : this.add.rectangle(WIDTH/2, HEIGHT-220, 280, 90, 0xf0a000).setInteractive({useHandCursor:true});
    this.add.text(WIDTH/2, HEIGHT-220, 'ЕЩЁ РАЗ', { fontFamily:'Arial', fontSize:'32px', color:'#ffffff', stroke:'#7a4a12', strokeThickness:6 }).setOrigin(0.5);
    btnAgain.on('pointerdown', ()=> this.scene.start('Game') );

    const btnMenu = this.textures.exists('ui_btn_home') ? this.add.image(WIDTH/2, HEIGHT-110, 'ui_btn_home').setInteractive({useHandCursor:true}) : this.add.rectangle(WIDTH/2, HEIGHT-110, 220, 80, 0x5595ff).setInteractive({useHandCursor:true});
    this.add.text(WIDTH/2, HEIGHT-110, 'МЕНЮ', { fontFamily:'Arial', fontSize:'28px', color:'#ffffff', stroke:'#173c6a', strokeThickness:6 }).setOrigin(0.5);
    btnMenu.on('pointerdown', ()=> this.scene.start('Menu') );
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: WIDTH, height: HEIGHT, backgroundColor:'#0f3f3f',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: WIDTH, height: HEIGHT },
  physics: { default:'arcade', arcade: { gravity:{ y:0 }, debug:false } },
  scene: [Boot, Menu, Game, Result]
};
new Phaser.Game(config);

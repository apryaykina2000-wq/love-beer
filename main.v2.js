
const WIDTH = 540, HEIGHT = 960;
const STORAGE_KEY_BEST = 'sasha_lubit_pivo_best';
const TARGET_SCORE = 60;

const DISPLAY = {
  PLAYER_H: 150,
  ITEM_H: 70,
  OBST_LOW_H: 90,
  OBST_MID_H: 120,
  OBST_HIGH_H: 170,
  GROUND_H: 220,
  GROUND_RUNLINE_FROM_TOP: 54
};

function scaleToHeight(scene, key, desiredH){
  const tx = scene.textures.get(key);
  if (!tx || !tx.frames || !tx.frames.__BASE) return 1;
  const h = tx.frames.__BASE.height;
  return desiredH / h;
}

class Boot extends Phaser.Scene{
  constructor(){ super('Boot'); }
  preload(){
    const img = (k)=> this.load.image(k, 'assets/img/'+k+'.png');

    ['player_run_1','player_run_2','player_run_3','player_jump_1','player_jump_2',
     'item_beer','item_fish','item_glass',
     'obstacle_low','obstacle_mid','obstacle_high',
     'ground_tile','bg_sky','bg_hills_far','bg_hills_near',
     'cloud_1','cloud_2','cloud_3',
     'ui_btn_play','ui_btn_play_pressed','ui_btn_restart','ui_btn_home',
     'ui_counter','medal_bronze','medal_silver','medal_gold'
    ].forEach(k=> img(k));
  }
  create(){
    // Fallback texture makers
    const makeGround = ()=>{
      const w=1024, h=440, line=54;
      const g = this.make.graphics({x:0,y:0, add:false});
      g.fillStyle(0x8b5a2b,1); g.fillRoundedRect(0,40,w,h-40,20);
      g.lineStyle(6,0x5d3b24,1); g.strokeRoundedRect(0,40,w,h-40,20);
      // grass
      g.fillStyle(0x66d06b,1); g.fillRect(0,40, w, line);
      for(let x=0;x<w;x+=28){ g.fillTriangle(x,40, x+14,40+line, x+28,40);}
      g.generateTexture('ground_tile', w, h);
      g.destroy();
    };
    const makeCloud = (key,w,h)=>{
      const g = this.make.graphics({x:0,y:0, add:false});
      g.fillStyle(0xffffff,0.95);
      g.fillCircle(w*0.3, h*0.55, h*0.35);
      g.fillCircle(w*0.5, h*0.45, h*0.45);
      g.fillCircle(w*0.68, h*0.6, h*0.38);
      g.fillRect(w*0.25, h*0.55, w*0.55, h*0.25);
      g.generateTexture(key, w, h);
      g.destroy();
    };
    const makeBG = (key, color)=>{
      const w=540,h=300;
      const g = this.make.graphics({x:0,y:0, add:false});
      g.fillStyle(color,1);
      const y0 = h*0.8;
      g.beginPath();
      g.moveTo(0,y0);
      for(let x=0;x<=w;x+=40){
        const y = y0 - 30*Math.sin(x/60) - 20*Math.cos(x/45);
        g.lineTo(x,y);
      }
      g.lineTo(w,h); g.lineTo(0,h); g.closePath(); g.fillPath();
      g.generateTexture(key, w, h);
      g.destroy();
    };
    const makePlayer = ()=>{
      const makeFrame=(key, armUp)=>{
        const w=80,h=100;
        const g = this.make.graphics({x:0,y:0, add:false});
        g.fillStyle(0x222222,1);
        g.fillEllipse(w*0.5,h*0.22, w*0.36,h*0.28); // head
        g.fillStyle(0x444444,1);
        g.fillRoundedRect(w*0.36,h*0.35, w*0.28, h*0.30, 8); // body
        // legs
        g.fillRect(w*0.40,h*0.65, 8, h*0.25);
        g.fillRect(w*0.52,h*0.65, 8, h*0.25);
        // arms
        if (armUp){ g.fillRect(w*0.30,h*0.38, 8, h*0.18); g.fillRect(w*0.62,h*0.38, 8, h*0.10); }
        else { g.fillRect(w*0.62,h*0.38, 8, h*0.18); g.fillRect(w*0.30,h*0.38, 8, h*0.10); }
        g.generateTexture(key, w, h);
        g.destroy();
      };
      makeFrame('player_run_1', false);
      makeFrame('player_run_2', true);
      makeFrame('player_run_3', false);
      makeFrame('player_jump_1', true);
      makeFrame('player_jump_2', true);
    };
    const makeObstacle = (key,hue)=>{
      const w=120, h=160;
      const g = this.make.graphics({x:0,y:0, add:false});
      g.fillStyle(hue,1); g.fillRoundedRect(10,0,w-20,h-10,20);
      g.lineStyle(6,0x4d2d16,1); g.strokeRoundedRect(10,0,w-20,h-10,20);
      g.generateTexture(key, w, h);
      g.destroy();
    };
    const makeItem = (key,color)=>{
      const g = this.make.graphics({x:0,y:0, add:false});
      g.fillStyle(color,1); g.fillCircle(22,22,22);
      g.lineStyle(4,0x6a3a18,1); g.strokeCircle(22,22,22);
      g.generateTexture(key, 44, 44); g.destroy();
    };

    // Confetti textures
    const confColors=[0xff6b6b,0xffd93d,0x6bcfff,0xb28dff,0x66d06b,0xff9ecd];
    for(let i=0;i<confColors.length;i++){
      const g=this.make.graphics({x:0,y:0,add:false});
      g.fillStyle(confColors[i],1); g.fillRect(0,0,8,14);
      g.generateTexture('confetti_'+i,8,14); g.destroy();
    }

    // Create fallbacks if missing
    if (!this.textures.exists('ground_tile')) makeGround();
    if (!this.textures.exists('cloud_1')) makeCloud('cloud_1', 240,140);
    if (!this.textures.exists('cloud_2')) makeCloud('cloud_2', 300,180);
    if (!this.textures.exists('cloud_3')) makeCloud('cloud_3', 180,110);
    if (!this.textures.exists('bg_hills_far')) makeBG('bg_hills_far', 0x9fd5cc);
    if (!this.textures.exists('bg_hills_near')) makeBG('bg_hills_near', 0x7fc2ba);
    if (!this.textures.exists('player_run_1')) makePlayer();
    if (!this.textures.exists('obstacle_low')) makeObstacle('obstacle_low',0xB57A3A);
    if (!this.textures.exists('obstacle_mid')) makeObstacle('obstacle_mid',0xA0682F);
    if (!this.textures.exists('obstacle_high')) makeObstacle('obstacle_high',0x8D5524);
    if (!this.textures.exists('item_beer')) makeItem('item_beer',0xf0c64a);
    if (!this.textures.exists('item_fish')) makeItem('item_fish',0x8ecae6);
    if (!this.textures.exists('item_glass')) makeItem('item_glass',0xf7a6a6);

    this.scene.start('Menu');
  }
}

function textStyle(size){ return { fontFamily:'GameFont, Arial', fontSize:size+'px', color:'#ffffff', stroke:'#0d3b3b', strokeThickness:6 }; }

class Menu extends Phaser.Scene{
  constructor(){ super('Menu'); }
  create(){
    this.add.image(0,0,'bg_sky').setOrigin(0).setDisplaySize(WIDTH, HEIGHT);
    this.far = this.add.tileSprite(0, HEIGHT*0.25, WIDTH, HEIGHT*0.35, 'bg_hills_far').setOrigin(0,0);
    this.near= this.add.tileSprite(0, HEIGHT*0.45, WIDTH, HEIGHT*0.45, 'bg_hills_near').setOrigin(0,0);

    // clouds
    this.clouds = this.add.group();
    ['cloud_1','cloud_2','cloud_3'].forEach((k,i)=>{
      const y= 120 + i*90;
      const c=this.add.image(80+i*140, y, k).setAlpha(0.9);
      c.setScale(scaleToHeight(this,k,90));
      this.clouds.add(c);
    });
    this.tweens.add({targets:this.clouds.getChildren(), x:'+=120', duration:10000, yoyo:true, repeat:-1, ease:'Sine.inOut'});

    // ground
    const gh=DISPLAY.GROUND_H;
    this.add.tileSprite(0, HEIGHT, WIDTH, gh, 'ground_tile').setOrigin(0,1);

    // title
    this.add.text(WIDTH/2, 130, 'САША ЛЮБИТ ПИВО', { ...textStyle(46), strokeThickness:8 }).setOrigin(0.5);
    const best=parseInt(localStorage.getItem(STORAGE_KEY_BEST)||'0',10);
    this.add.text(WIDTH/2, 190, 'РЕКОРД: '+best, textStyle(28)).setOrigin(0.5);

    // play button (use tint if pressed texture missing)
    const btn = this.textures.exists('ui_btn_play') ?
      this.add.image(WIDTH/2, HEIGHT-180, 'ui_btn_play') :
      this.add.rectangle(WIDTH/2, HEIGHT-180, 320, 110, 0xf0a000).setStrokeStyle(6,0x7a4a12);
    this.add.text(btn.x, btn.y, 'ИГРАТЬ', { ...textStyle(40), strokeThickness:8 }).setOrigin(0.5);
    btn.setInteractive({useHandCursor:true});
    btn.on('pointerdown', ()=>{
      if (this.textures.exists('ui_btn_play_pressed')) btn.setTexture('ui_btn_play_pressed');
      else btn.setTint(0xd08c00);
      this.time.delayedCall(80, ()=> this.scene.start('Game'));
    });
    // fullscreen zone start
    this.add.zone(0,0,WIDTH,HEIGHT).setOrigin(0).setInteractive().on('pointerdown', ()=> this.scene.start('Game'));
  }
  update(){
    this.far.tilePositionX += 0.15;
    this.near.tilePositionX += 0.30;
  }
}

class Game extends Phaser.Scene{
  constructor(){ super('Game'); }
  create(){
    this.input.addPointer(2);
    this.add.image(0,0,'bg_sky').setOrigin(0).setDisplaySize(WIDTH, HEIGHT);
    this.far = this.add.tileSprite(0, HEIGHT*0.25, WIDTH, HEIGHT*0.35, 'bg_hills_far').setOrigin(0,0);
    this.near= this.add.tileSprite(0, HEIGHT*0.45, WIDTH, HEIGHT*0.45, 'bg_hills_near').setOrigin(0,0);
    this.clouds = this.add.group();
    ['cloud_1','cloud_2','cloud_3'].forEach((k,i)=>{
      const y= 100 + i*110;
      const c=this.add.image(Phaser.Math.Between(40, WIDTH-40), y, k).setAlpha(0.9);
      c.setScale(scaleToHeight(this,k,90));
      this.clouds.add(c);
    });
    this.tweens.add({targets:this.clouds.getChildren(), x:'+=150', duration:9000, yoyo:true, repeat:-1, ease:'Sine.inOut'});

    // ground + run line
    const gh=DISPLAY.GROUND_H;
    this.ground = this.add.tileSprite(0, HEIGHT, WIDTH, gh, 'ground_tile').setOrigin(0,1);
    this.groundY = HEIGHT - gh + DISPLAY.GROUND_RUNLINE_FROM_TOP;

    // physics player
    this.physics.world.setBounds(0,0,WIDTH,HEIGHT);
    this.player = this.physics.add.sprite(160, this.groundY, 'player_run_1').setOrigin(0.5,1);
    this.player.setScale(scaleToHeight(this,'player_run_1', DISPLAY.PLAYER_H));
    this.player.body.setGravityY(2200);
    this.player.setCollideWorldBounds(true);

    this.anims.create({ key:'run', frames:[{key:'player_run_1'},{key:'player_run_2'},{key:'player_run_3'}], frameRate: 10, repeat:-1 });
    this.anims.create({ key:'jump', frames:[{key:'player_jump_1'},{key:'player_jump_2'}], frameRate: 6, repeat:0 });
    this.player.play('run');

    // input
    this.canDouble=true;
    this.input.on('pointerdown', ()=> this.tryJump());
    this.input.keyboard.on('keydown-SPACE', ()=> this.tryJump());
    this.input.keyboard.on('keydown-UP', ()=> this.tryJump());

    // groups
    this.items = this.physics.add.group();
    this.obstacles = this.physics.add.group();
    this.physics.add.overlap(this.player, this.items, (pl,it)=>{ it.destroy(); this.onCollect(); }, null, this);
    this.physics.add.overlap(this.player, this.obstacles, ()=> this.onHit(), null, this);

    // HUD
    this.score=0; this.best=parseInt(localStorage.getItem(STORAGE_KEY_BEST)||'0',10);
    this.scoreText = this.add.text(20,16,'0/60', textStyle(28)).setDepth(10);
    this.bestText  = this.add.text(WIDTH-20,16,'Рекорд: '+this.best, textStyle(28)).setOrigin(1,0).setDepth(10);

    // pacing
    this.speed=4.2; this.spawnT=0; this.spawnInterval=1600; this.itemT=0; this.itemInterval=900;
  }

  tryJump(){
    const onGround = (this.player.y >= this.groundY - 1 && this.player.body.velocity.y >= 0);
    if (onGround){
      this.player.setVelocityY(-820); this.player.play('jump', true); this.canDouble=true;
    } else if (this.canDouble){
      this.player.setVelocityY(-740); this.player.play('jump', true); this.canDouble=false;
    }
  }

  onCollect(){ this.score++; this.scoreText.setText(this.score+'/60'); if (this.score>=TARGET_SCORE) this.winGame(); }
  onHit(){ this.loseGame(); }

  winGame(){
    // confetti
    const keys = ['confetti_0','confetti_1','confetti_2','confetti_3','confetti_4','confetti_5'];
    for (let i=0;i<140;i++){
      const key = keys[i % keys.length];
      const p = this.add.sprite(Phaser.Math.Between(0,WIDTH), -20, key).setDepth(20);
      const dur = Phaser.Math.Between(1200,1800);
      this.tweens.add({targets:p, y:HEIGHT+30, x:p.x+Phaser.Math.Between(-120,120), angle:Phaser.Math.Between(180,540), duration:dur, ease:'Cubic.in', onComplete:()=>p.destroy()});
    }
    this.time.delayedCall(1400, ()=> this.scene.start('Result', {score:this.score, best:this.best, win:true}) );
  }

  loseGame(){ this.scene.start('Result', {score:this.score, best:this.best, win:false}); }

  spawnObstacle(){
    const rnd=Math.random();
    let key='obstacle_low';
    if (this.score>=40) key = rnd<0.45?'obstacle_high':(rnd<0.75?'obstacle_mid':'obstacle_low');
    else if (this.score>=20) key = rnd<0.25?'obstacle_high':(rnd<0.65?'obstacle_mid':'obstacle_low');
    else key = rnd<0.6?'obstacle_low':'obstacle_mid';

    const h = key==='obstacle_low'?DISPLAY.OBST_LOW_H : key==='obstacle_mid'?DISPLAY.OBST_MID_H : DISPLAY.OBST_HIGH_H;
    const s = scaleToHeight(this, key, h);
    const o = this.obstacles.create(WIDTH+80, this.groundY, key).setOrigin(0.5,1).setScale(s);
    o.body.allowGravity=false; o.setImmovable(true);
  }

  spawnItemsRow(){
    const keys = ['item_beer','item_fish','item_glass'].filter(k=> this.textures.exists(k));
    if (!keys.length) return;
    const baseY = this.groundY - Phaser.Math.Between(120, 220);
    const count = Phaser.Math.Between(2,3);
    for (let i=0;i<count;i++){
      const key = keys[Phaser.Math.Between(0, keys.length-1)];
      const s = scaleToHeight(this, key, DISPLAY.ITEM_H);
      const it = this.items.create(WIDTH + 40 + i*54, baseY, key).setOrigin(0.5).setScale(s);
      it.body.allowGravity=false; it._phase = Math.random()*Math.PI*2;
    }
  }

  update(time,delta){
    this.far.tilePositionX += 0.2; this.near.tilePositionX += 0.4; this.ground.tilePositionX += 1.8;

    if (this.player.body.velocity.y >= 0 && this.player.y >= this.groundY-1){
      this.player.y=this.groundY; this.player.play('run', true);
    }

    if (this.score < 20){ this.speed=4.2; this.spawnInterval=1600; this.itemInterval=900; }
    else if (this.score < 40){ this.speed=5.2; this.spawnInterval=1300; this.itemInterval=800; }
    else { this.speed=6.2; this.spawnInterval=1100; this.itemInterval=700; }

    this.spawnT += delta;
    if (this.spawnT >= this.spawnInterval){ this.spawnT=0; this.spawnObstacle(); if (this.score>=35 && Math.random()<0.35){ this.time.delayedCall(300,()=>this.spawnObstacle()); } }
    this.itemT += delta; if (this.itemT >= this.itemInterval){ this.itemT=0; this.spawnItemsRow(); }

    const vx=this.speed*2.1;
    this.obstacles.children.iterate(o=>{ if(o){ o.x -= vx; if(o.x<-120) o.destroy(); } });
    this.items.children.iterate(it=>{ if(it){ it.x -= vx; if(it.x<-80) it.destroy(); it.y += Math.sin((time*0.005 + it._phase))*0.35; }});
  }
}

class Result extends Phaser.Scene{
  constructor(){ super('Result'); }
  init(data){ this.score=data.score||0; this.best=data.best||0; this.win=!!data.win; }
  create(){
    this.add.image(0,0,'bg_sky').setOrigin(0).setDisplaySize(WIDTH, HEIGHT);
    this.add.tileSprite(0, HEIGHT*0.25, WIDTH, HEIGHT*0.35, 'bg_hills_far').setOrigin(0,0);
    this.add.tileSprite(0, HEIGHT*0.45, WIDTH, HEIGHT*0.45, 'bg_hills_near').setOrigin(0,0);
    const gh=DISPLAY.GROUND_H; this.add.tileSprite(0, HEIGHT, WIDTH, gh, 'ground_tile').setOrigin(0,1);

    if (this.score > this.best){ this.best=this.score; localStorage.setItem(STORAGE_KEY_BEST, String(this.best)); }

    this.add.text(WIDTH/2, 120, this.win ? 'ПОБЕДА!' : 'ИТОГ', { ...textStyle(56), strokeThickness:8 }).setOrigin(0.5);
    this.add.text(WIDTH/2, 190, `СЧЁТ: ${this.score} / 60`, textStyle(32)).setOrigin(0.5);
    this.add.text(WIDTH/2, 235, `РЕКОРД: ${this.best}`, textStyle(28)).setOrigin(0.5);

    let medalKey=null, medalName='';
    if (this.score >= 60){ medalKey='medal_gold'; medalName='ЗОЛОТО'; }
    else if (this.score >= 40){ medalKey='medal_silver'; medalName='СЕРЕБРО'; }
    else if (this.score >= 20){ medalKey='medal_bronze'; medalName='БРОНЗА'; }
    if (medalKey && this.textures.exists(medalKey)){
      this.add.image(WIDTH/2, 320, medalKey).setOrigin(0.5).setScale(scaleToHeight(this, medalKey, 120));
      this.add.text(WIDTH/2, 400, medalName, textStyle(26)).setOrigin(0.5);
    }

    const again = this.textures.exists('ui_btn_restart') ?
      this.add.image(WIDTH/2, HEIGHT-220, 'ui_btn_restart') :
      this.add.rectangle(WIDTH/2, HEIGHT-220, 280, 90, 0xf0a000).setStrokeStyle(6,0x7a4a12);
    this.add.text(WIDTH/2, HEIGHT-220, 'ЕЩЁ РАЗ', textStyle(32)).setOrigin(0.5);
    again.setInteractive({useHandCursor:true}).on('pointerdown', ()=> this.scene.start('Game'));

    const menu = this.textures.exists('ui_btn_home') ?
      this.add.image(WIDTH/2, HEIGHT-110, 'ui_btn_home') :
      this.add.rectangle(WIDTH/2, HEIGHT-110, 220, 80, 0x5595ff).setStrokeStyle(6,0x173c6a);
    this.add.text(WIDTH/2, HEIGHT-110, 'МЕНЮ', textStyle(28)).setOrigin(0.5);
    menu.setInteractive({useHandCursor:true}).on('pointerdown', ()=> this.scene.start('Menu'));
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: '#0f3f3f',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: WIDTH, height: HEIGHT },
  physics: { default:'arcade', arcade:{ gravity:{y:0}, debug:false } },
  scene: [Boot, Menu, Game, Result]
};

new Phaser.Game(config);

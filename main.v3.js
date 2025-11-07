
const WIDTH = 540, HEIGHT = 960;
const STORAGE_KEY_BEST = 'sasha_lubit_pivo_best';
const TARGET_SCORE = 60;

const DISPLAY = {
  PLAYER_H: 150,
  ITEM_H: 64,
  OBST_LOW_H: 88,
  OBST_MID_H: 115,
  OBST_HIGH_H: 160,
  GROUND_H: 220,
  GROUND_RUNLINE_FROM_TOP: 62
};

function scaleToHeight(scene, key, desiredH){
  const tx = scene.textures.get(key);
  if (!tx || !tx.frames || !tx.frames.__BASE) return 1;
  const h = tx.frames.__BASE.height;
  return desiredH / h;
}

function tStyle(size, stroke=6){ return { fontFamily:'GameFont, Arial', fontSize:size+'px', color:'#ffffff', stroke:'#0d3b3b', strokeThickness:stroke }; }

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
    const makeCloud = (key,w,h)=>{
      const g = this.make.graphics({x:0,y:0, add:false});
      g.fillStyle(0xffffff,0.95);
      g.fillCircle(w*0.3, h*0.55, h*0.35);
      g.fillCircle(w*0.5, h*0.45, h*0.45);
      g.fillCircle(w*0.68, h*0.6, h*0.38);
      g.fillRect(w*0.25, h*0.55, w*0.55, h*0.25);
      g.generateTexture(key, w, h); g.destroy();
    };
    if (!this.textures.exists('cloud_1')) makeCloud('cloud_1', 260,150);
    if (!this.textures.exists('cloud_2')) makeCloud('cloud_2', 320,190);
    if (!this.textures.exists('cloud_3')) makeCloud('cloud_3', 200,120);

    const conf=[0xff6b6b,0xffd93d,0x6bcfff,0xb28dff,0x66d06b,0xff9ecd];
    for(let i=0;i<conf.length;i++){ const g=this.make.graphics({x:0,y:0,add:false}); g.fillStyle(conf[i],1); g.fillRect(0,0,8,14); g.generateTexture('confetti_'+i,8,14); g.destroy(); }
    this.scene.start('Menu');
  }
}

class Menu extends Phaser.Scene{
  constructor(){ super('Menu'); }
  create(){
    this.add.image(0,0,'bg_sky').setOrigin(0).setDisplaySize(WIDTH, HEIGHT);
    this.far = this.add.tileSprite(0, HEIGHT*0.26, WIDTH, HEIGHT*0.34, 'bg_hills_far').setOrigin(0,0);
    this.near= this.add.tileSprite(0, HEIGHT*0.46, WIDTH, HEIGHT*0.44, 'bg_hills_near').setOrigin(0,0);

    this.clouds = this.add.group();
    ['cloud_1','cloud_2','cloud_3'].forEach((k,i)=>{
      const y= 110 + i*95;
      const c=this.add.image(100+i*140, y, k).setAlpha(0.95);
      c.setScale(scaleToHeight(this,k, 130));
      this.clouds.add(c);
    });
    this.tweens.add({targets:this.clouds.getChildren(), x:'+=120', duration:10000, yoyo:true, repeat:-1, ease:'Sine.inOut'});

    const gh=DISPLAY.GROUND_H;
    this.add.tileSprite(0, HEIGHT, WIDTH, gh, 'ground_tile').setOrigin(0,1);

    this.add.text(WIDTH/2, 120, 'САША ЛЮБИТ ПИВО', tStyle(44,8)).setOrigin(0.5);
    const best=parseInt(localStorage.getItem(STORAGE_KEY_BEST)||'0',10);
    this.add.text(WIDTH/2, 175, 'РЕКОРД: '+best, tStyle(26,6)).setOrigin(0.5);

    let btn;
    if (this.textures.exists('ui_btn_play')){
      btn = this.add.image(WIDTH/2, HEIGHT-170, 'ui_btn_play').setScale(0.9);
      this.add.text(btn.x, btn.y, 'ИГРАТЬ', tStyle(36,8)).setOrigin(0.5);
      btn.setInteractive({useHandCursor:true});
      btn.on('pointerdown', ()=>{
        if (this.textures.exists('ui_btn_play_pressed')) btn.setTexture('ui_btn_play_pressed');
        else btn.setTint(0xd08c00);
        this.time.delayedCall(80, ()=> this.scene.start('Game'));
      });
    }else{
      btn = this.add.rectangle(WIDTH/2, HEIGHT-170, 290, 100, 0xf0a000).setStrokeStyle(6,0x7a4a12);
      this.add.text(btn.x, btn.y, 'ИГРАТЬ', tStyle(36,8)).setOrigin(0.5);
      btn.setInteractive({useHandCursor:true}).on('pointerdown', ()=> this.scene.start('Game'));
    }

    this.add.zone(0,0,WIDTH,HEIGHT).setOrigin(0).setInteractive().on('pointerdown', ()=> this.scene.start('Game'));
  }
  update(){ this.far.tilePositionX += 0.12; this.near.tilePositionX += 0.26; }
}

class Game extends Phaser.Scene{
  constructor(){ super('Game'); }
  create(){
    this.input.addPointer(2);
    this.add.image(0,0,'bg_sky').setOrigin(0).setDisplaySize(WIDTH, HEIGHT);
    this.far = this.add.tileSprite(0, HEIGHT*0.26, WIDTH, HEIGHT*0.34, 'bg_hills_far').setOrigin(0,0);
    this.near= this.add.tileSprite(0, HEIGHT*0.46, WIDTH, HEIGHT*0.44, 'bg_hills_near').setOrigin(0,0);

    this.clouds = this.add.group();
    ['cloud_1','cloud_2','cloud_3'].forEach((k,i)=>{
      const y= 100 + i*110;
      const c=this.add.image(Phaser.Math.Between(60, WIDTH-60), y, k).setAlpha(0.95);
      c.setScale(scaleToHeight(this,k, 130));
      this.clouds.add(c);
    });
    this.tweens.add({targets:this.clouds.getChildren(), x:'+=140', duration:9500, yoyo:true, repeat:-1, ease:'Sine.inOut'});

    const gh=DISPLAY.GROUND_H;
    this.ground = this.add.tileSprite(0, HEIGHT, WIDTH, gh, 'ground_tile').setOrigin(0,1);
    this.groundY = HEIGHT - gh + DISPLAY.GROUND_RUNLINE_FROM_TOP;

    const groundRect = this.add.rectangle(WIDTH/2, this.groundY+2, WIDTH, 10, 0x00ff00, 0).setOrigin(0.5,0.5);
    this.physics.add.existing(groundRect, true);

    this.physics.world.setBounds(0,0,WIDTH,HEIGHT);
    this.player = this.physics.add.sprite(160, this.groundY, 'player_run_1').setOrigin(0.5,1);
    this.player.setScale(scaleToHeight(this,'player_run_1', DISPLAY.PLAYER_H));
    this.player.body.setGravityY(2000);
    this.player.setCollideWorldBounds(true);

    const pw = this.player.displayWidth * 0.55;
    const ph = this.player.displayHeight * 0.9;
    this.player.body.setSize(pw, ph).setOffset(this.player.displayWidth*0.5 - pw*0.5, this.player.displayHeight - ph);

    this.physics.add.collider(this.player, groundRect);

    this.anims.create({ key:'run', frames:[{key:'player_run_1'},{key:'player_run_2'},{key:'player_run_3'}], frameRate: 10, repeat:-1 });
    this.anims.create({ key:'jump', frames:[{key:'player_jump_1'},{key:'player_jump_2'}], frameRate: 6, repeat:0 });
    this.player.play('run');

    this.canDouble = true;
    this.input.on('pointerdown', ()=> this.tryJump());
    this.input.keyboard.on('keydown-SPACE', ()=> this.tryJump());
    this.input.keyboard.on('keydown-UP',    ()=> this.tryJump());

    this.items = this.physics.add.group();
    this.obstacles = this.physics.add.group();

    this.physics.add.overlap(this.player, this.items, (_,it)=>{ it.destroy(); this.onCollect(); }, null, this);
    this.physics.add.overlap(this.player, this.obstacles, ()=> this.onHit(), null, this);

    this.score=0; this.best=parseInt(localStorage.getItem(STORAGE_KEY_BEST)||'0',10);
    this.scoreText=this.add.text(20,16,'0/60', tStyle(26)).setDepth(10);
    this.bestText =this.add.text(WIDTH-20,16,'Рекорд: '+this.best, tStyle(26)).setOrigin(1,0).setDepth(10);

    this.speed=2.6;
    this.spawnInterval=1900;
    this.itemIntervalMin=1100;
    this.itemIntervalMax=1800;
    this.nextItemTime=0;
    this.spawnT=0;
    self = this;
    this.lastObstacleTime=0;
  }

  tryJump(){
    const onGround = (this.player.body.blocked.down || this.player.body.touching.down || Math.abs(this.player.y - this.groundY) < 1);
    if (onGround){
      this.player.setVelocityY(-760);
      this.player.play('jump', true);
      this.canDouble = true;
    } else if (this.canDouble){
      this.player.setVelocityY(-660);
      this.player.play('jump', true);
      this.canDouble = false;
    }
  }

  onCollect(){
    this.score++; this.scoreText.setText(this.score+'/60');
    if (this.score>=TARGET_SCORE) this.winGame();
  }
  onHit(){ this.loseGame(); }

  winGame(){
    const keys=['confetti_0','confetti_1','confetti_2','confetti_3','confetti_4','confetti_5'];
    for(let i=0;i<140;i++){
      const key=keys[i%keys.length];
      const p=this.add.sprite(Phaser.Math.Between(0,WIDTH), -20, key).setDepth(20);
      const dur=Phaser.Math.Between(1200,1800);
      this.tweens.add({targets:p, y:HEIGHT+30, x:p.x+Phaser.Math.Between(-120,120), angle:Phaser.Math.Between(180,540), duration:dur, ease:'Cubic.in', onComplete:()=>p.destroy()});
    }
    this.time.delayedCall(1400, ()=> this.scene.start('Result', {score:this.score, best:this.best, win:true}) );
  }
  loseGame(){ this.scene.start('Result', {score:this.score, best:this.best, win:false}); }

  spawnObstacle(){
    const now = this.time.now;
    const rnd=Math.random();
    let key='obstacle_low';
    if (this.score>=45) key = rnd<0.35?'obstacle_high':(rnd<0.65?'obstacle_mid':'obstacle_low');
    else if (this.score>=25) key = rnd<0.15?'obstacle_high':(rnd<0.55?'obstacle_mid':'obstacle_low');
    else key = rnd<0.7?'obstacle_low':'obstacle_mid';

    const h = key==='obstacle_low'?DISPLAY.OBST_LOW_H : key==='obstacle_mid'?DISPLAY.OBST_MID_H : DISPLAY.OBST_HIGH_H;
    const s = scaleToHeight(this, key, h);
    const o = this.obstacles.create(WIDTH+80, this.groundY, key).setOrigin(0.5,1).setScale(s);
    o.body.allowGravity=false; o.setImmovable(true);
    const bw = o.displayWidth * 0.7;
    const bh = o.displayHeight * 0.85;
    o.body.setSize(bw, bh).setOffset(o.displayWidth*0.5 - bw*0.5, o.displayHeight - bh);
    this.lastObstacleTime = now;
  }

  spawnItemSingle(){
    const keys=['item_beer','item_fish','item_glass'].filter(k=> this.textures.exists(k));
    if (!keys.length) return;
    if (this.time.now - this.lastObstacleTime < 500) return;

    const baseY = this.groundY - Phaser.Math.Between(120, 210);
    const key = keys[Phaser.Math.Between(0, keys.length-1)];
    const s = scaleToHeight(this, key, DISPLAY.ITEM_H);
    const it = this.items.create(WIDTH + 50, baseY, key).setOrigin(0.5).setScale(s);
    it.body.allowGravity=false; it._phase=Math.random()*Math.PI*2;
  }

  update(time,delta){
    this.far.tilePositionX += 0.12;
    this.near.tilePositionX += 0.28;
    this.ground.tilePositionX += this.speed*1.5;

    if ((this.player.body.blocked.down || Math.abs(this.player.y - this.groundY) < 1) && this.player.anims.getName()!=='run'){
      this.player.play('run');
    }

    if (this.score < 20){ this.speed = 2.6; this.spawnInterval = 1900; }
    else if (this.score < 40){ this.speed = 3.3; this.spawnInterval = 1700; }
    else { this.speed = 4.0; this.spawnInterval = 1500; }

    this.spawnT += delta;
    if (this.spawnT >= this.spawnInterval){ this.spawnT = 0; this.spawnObstacle(); }

    if (!this.nextItemTime) this.nextItemTime = time + Phaser.Math.Between(this.itemIntervalMin, this.itemIntervalMax);
    if (time >= this.nextItemTime){
      this.spawnItemSingle();
      this.nextItemTime = time + Phaser.Math.Between(this.itemIntervalMin, this.itemIntervalMax);
    }

    const vx=this.speed*2.0;
    this.obstacles.children.iterate(o=>{ if(o){ o.x -= vx; if(o.x<-120) o.destroy(); }});
    this.items.children.iterate(it=>{ if(it){ it.x -= vx; if(it.x<-80) it.destroy(); it.y += Math.sin((time*0.005 + it._phase))*0.3; }});
  }
}

class Result extends Phaser.Scene{
  constructor(){ super('Result'); }
  init(data){ this.score=data.score||0; this.best=data.best||0; this.win=!!data.win; }
  create(){
    this.add.image(0,0,'bg_sky').setOrigin(0).setDisplaySize(WIDTH, HEIGHT);
    this.add.tileSprite(0, HEIGHT*0.26, WIDTH, HEIGHT*0.34, 'bg_hills_far').setOrigin(0,0);
    this.add.tileSprite(0, HEIGHT*0.46, WIDTH, HEIGHT*0.44, 'bg_hills_near').setOrigin(0,0);
    const gh=DISPLAY.GROUND_H; this.add.tileSprite(0, HEIGHT, WIDTH, gh, 'ground_tile').setOrigin(0,1);

    if (this.score > this.best){ this.best=this.score; localStorage.setItem(STORAGE_KEY_BEST, String(this.best)); }

    this.add.text(WIDTH/2, 120, this.win ? 'ПОБЕДА!' : 'ИТОГ', tStyle(52,8)).setOrigin(0.5);
    this.add.text(WIDTH/2, 180, `СЧЁТ: ${this.score} / 60`, tStyle(30)).setOrigin(0.5);
    this.add.text(WIDTH/2, 220, `РЕКОРД: ${this.best}`, tStyle(26)).setOrigin(0.5);

    let medalKey=null, medalName='';
    if (this.score >= 60){ medalKey='medal_gold'; medalName='ЗОЛОТО'; }
    else if (this.score >= 40){ medalKey='medal_silver'; medalName='СЕРЕБРО'; }
    else if (this.score >= 20){ medalKey='medal_bronze'; medalName='БРОНЗА'; }
    if (medalKey && this.textures.exists(medalKey)){
      this.add.image(WIDTH/2, 300, medalKey).setOrigin(0.5).setScale(scaleToHeight(this, medalKey, 120));
      this.add.text(WIDTH/2, 370, medalName, tStyle(24)).setOrigin(0.5);
    }

    const again = this.textures.exists('ui_btn_restart') ?
      this.add.image(WIDTH/2, HEIGHT-220, 'ui_btn_restart').setScale(0.9) :
      this.add.rectangle(WIDTH/2, HEIGHT-220, 260, 90, 0xf0a000).setStrokeStyle(6,0x7a4a12);
    this.add.text(WIDTH/2, HEIGHT-220, 'ЕЩЁ РАЗ', tStyle(28)).setOrigin(0.5);
    again.setInteractive({useHandCursor:true}).on('pointerdown', ()=> this.scene.start('Game'));

    const menu = this.textures.exists('ui_btn_home') ?
      this.add.image(WIDTH/2, HEIGHT-110, 'ui_btn_home').setScale(0.9) :
      this.add.rectangle(WIDTH/2, HEIGHT-110, 200, 78, 0x5595ff).setStrokeStyle(6,0x173c6a);
    this.add.text(WIDTH/2, HEIGHT-110, 'МЕНЮ', tStyle(26)).setOrigin(0.5);
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

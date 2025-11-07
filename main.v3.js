
const WIDTH = 540, HEIGHT = 960;
const STORAGE_KEY_BEST = 'sasha_lubit_pivo_best';
const TARGET_SCORE = 60;

const DISPLAY = {
  PLAYER_H: 158,              // игрок крупнее
  ITEM_H: 64,                 // айтемы чуть меньше
  OBST_LOW_H: 86,             // хитбоксы дальше уменьшим отдельно
  OBST_MID_H: 112,
  OBST_HIGH_H: 155,
  GROUND_H: 220,
  GROUND_RUNLINE_FROM_TOP: 54
};

function style(size, stroke=6){
  return { fontFamily:'GameFont, Arial', fontSize:size+'px', color:'#ffffff', stroke:'#0d3b3b', strokeThickness:stroke };
}

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
    // Конфетти-спрайты (цвета)
    const confColors=[0xff6b6b,0xffd93d,0x6bcfff,0xb28dff,0x66d06b,0xff9ecd];
    for(let i=0;i<confColors.length;i++){
      const g=this.make.graphics({x:0,y:0,add:false}); g.fillStyle(confColors[i],1); g.fillRect(0,0,8,14);
      g.generateTexture('confetti_'+i,8,14); g.destroy();
    }
    this.scene.start('Menu');
  }
}

class Menu extends Phaser.Scene{
  constructor(){ super('Menu'); }
  create(){
    // фон
    this.add.image(0,0,'bg_sky').setOrigin(0).setDisplaySize(WIDTH, HEIGHT);
    this.far = this.add.tileSprite(0, HEIGHT*0.25, WIDTH, HEIGHT*0.35, 'bg_hills_far').setOrigin(0,0);
    this.near= this.add.tileSprite(0, HEIGHT*0.45, WIDTH, HEIGHT*0.45, 'bg_hills_near').setOrigin(0,0);
    // облака — больше
    this.clouds = this.add.group();
    ['cloud_1','cloud_2','cloud_3'].forEach((k,i)=>{
      const y = 120 + i*90;
      const c = this.add.image(80+i*150, y, k).setAlpha(0.9);
      c.setScale(scaleToHeight(this, k, 120));  // было 90
      this.clouds.add(c);
    });
    this.tweens.add({targets:this.clouds.getChildren(), x:'+=140', duration:11000, yoyo:true, repeat:-1, ease:'Sine.inOut'});

    // земля
    const gh=DISPLAY.GROUND_H;
    this.add.tileSprite(0, HEIGHT, WIDTH, gh, 'ground_tile').setOrigin(0,1);

    // заголовок и рекорд
    this.add.text(WIDTH/2, 130, 'САША ЛЮБИТ ПИВО', style(46,8)).setOrigin(0.5);
    const best=parseInt(localStorage.getItem(STORAGE_KEY_BEST)||'0',10);
    this.add.text(WIDTH/2, 190, 'РЕКОРД: '+best, style(28)).setOrigin(0.5);

    // кнопка Play — ЧУТЬ МЕНЬШЕ
    const hasPlay = this.textures.exists('ui_btn_play');
    const btn = hasPlay ? this.add.image(WIDTH/2, HEIGHT-180, 'ui_btn_play').setScale(0.9)  // меньше
                        : this.add.rectangle(WIDTH/2, HEIGHT-180, 300, 100, 0xf0a000).setStrokeStyle(6,0x7a4a12);
    this.add.text(btn.x, btn.y, 'ИГРАТЬ', style(38,8)).setOrigin(0.5);
    btn.setInteractive({useHandCursor:true}).on('pointerdown', ()=>{
      if (hasPlay && this.textures.exists('ui_btn_play_pressed')) btn.setTexture('ui_btn_play_pressed');
      this.time.delayedCall(80, ()=> this.scene.start('Game'));
    });

    // тап в любом месте
    this.add.zone(0,0,WIDTH,HEIGHT).setOrigin(0).setInteractive().on('pointerdown', ()=> this.scene.start('Game'));
  }
  update(){ this.far.tilePositionX += 0.12; this.near.tilePositionX += 0.24; }
}

class Game extends Phaser.Scene{
  constructor(){ super('Game'); }
  create(){
    this.input.addPointer(2);
    // фон
    this.add.image(0,0,'bg_sky').setOrigin(0).setDisplaySize(WIDTH, HEIGHT);
    this.far = this.add.tileSprite(0, HEIGHT*0.25, WIDTH, HEIGHT*0.35, 'bg_hills_far').setOrigin(0,0);
    this.near= this.add.tileSprite(0, HEIGHT*0.45, WIDTH, HEIGHT*0.45, 'bg_hills_near').setOrigin(0,0);
    // облака — больше
    this.clouds = this.add.group();
    ['cloud_1','cloud_2','cloud_3'].forEach((k,i)=>{
      const y= 100 + i*110;
      const c=this.add.image(Phaser.Math.Between(40, WIDTH-40), y, k).setAlpha(0.9);
      c.setScale(scaleToHeight(this,k,120));
      this.clouds.add(c);
    });
    this.tweens.add({targets:this.clouds.getChildren(), x:'+=150', duration:9500, yoyo:true, repeat:-1, ease:'Sine.inOut'});

    // земля и линия бега
    const gh=DISPLAY.GROUND_H;
    this.ground = this.add.tileSprite(0, HEIGHT, WIDTH, gh, 'ground_tile').setOrigin(0,1);
    this.groundY = HEIGHT - gh + DISPLAY.GROUND_RUNLINE_FROM_TOP;

    // физика игрока
    this.physics.world.setBounds(0,0,WIDTH,HEIGHT);
    this.player = this.physics.add.sprite(160, this.groundY, 'player_run_1').setOrigin(0.5,1);
    this.player.setScale(scaleToHeight(this,'player_run_1', DISPLAY.PLAYER_H));
    this.player.body.setGravityY(2000);               // чуть меньше гравитация
    this.player.setCollideWorldBounds(true);

    // Уменьшаем ХИТБОКСЫ — чтобы "не цепляло" невидимым
    const pb = this.player.getBounds();               // размеры по экрану
    this.player.body.setSize(pb.width*0.5, pb.height*0.85, true); // поуже и не до головы

    this.anims.create({ key:'run', frames:[{key:'player_run_1'},{key:'player_run_2'},{key:'player_run_3'}], frameRate: 10, repeat:-1 });
    this.anims.create({ key:'jump', frames:[{key:'player_jump_1'},{key:'player_jump_2'}], frameRate: 6, repeat:0 });
    this.player.play('run');

    // управление + двойной прыжок
    this.canDouble=true;
    this.input.on('pointerdown', ()=> this.tryJump() );
    this.input.keyboard.on('keydown-SPACE', ()=> this.tryJump() );
    this.input.keyboard.on('keydown-UP', ()=> this.tryJump() );

    // группы
    this.items = this.physics.add.group();
    this.obstacles = this.physics.add.group();

    // столкновения (оверлап)
    this.physics.add.overlap(this.player, this.items, (pl,it)=>{ it.destroy(); this.onCollect(); }, null, this);
    this.physics.add.overlap(this.player, this.obstacles, ()=> this.onHit(), null, this);

    // HUD
    this.score=0;
    this.best=parseInt(localStorage.getItem(STORAGE_KEY_BEST)||'0',10);
    this.scoreText = this.add.text(20,16,'0/60', style(28)).setDepth(10);
    this.bestText  = this.add.text(WIDTH-20,16,'Рекорд: '+this.best, style(28)).setOrigin(1,0).setDepth(10);

    // Темп / сложность — МЕДЛЕННЫЙ СТАРТ и мягкий рост
    this.speed=3.0;                      // было 4.2
    this.spawnT=0; this.spawnInterval=2000;   // препятствия реже в начале
    this.itemT=0;  this.nextItemDelay=Phaser.Math.Between(1100,1600); // одиночные айтемы
  }

  tryJump(){
    const onGround = (this.player.y >= this.groundY - 1 && this.player.body.velocity.y >= 0);
    if (onGround){
      this.player.setVelocityY(-800);
      this.player.play('jump', true);
      this.canDouble=true;
    } else if (this.canDouble){
      this.player.setVelocityY(-700);
      this.player.play('jump', true);
      this.canDouble=false;
    }
  }

  onCollect(){ this.score++; this.scoreText.setText(this.score+'/60'); if (this.score>=TARGET_SCORE) this.winGame(); }
  onHit(){ this.loseGame(); }

  winGame(){
    // конфетти
    const keys=['confetti_0','confetti_1','confetti_2','confetti_3','confetti_4','confetti_5'];
    for(let i=0;i<130;i++){
      const key=keys[i%keys.length];
      const p=this.add.sprite(Phaser.Math.Between(0,WIDTH), -20, key).setDepth(20);
      const dur=Phaser.Math.Between(1200,1700);
      this.tweens.add({targets:p, y:HEIGHT+30, x:p.x+Phaser.Math.Between(-110,110), angle:Phaser.Math.Between(180,540), duration:dur, ease:'Cubic.in', onComplete:()=>p.destroy()});
    }
    this.time.delayedCall(1300, ()=> this.scene.start('Result', {score:this.score, best:this.best, win:true}) );
  }
  loseGame(){ this.scene.start('Result', {score:this.score, best:this.best, win:false}); }

  spawnObstacle(){
    // реже high, проще в целом
    const rnd=Math.random();
    let key='obstacle_low';
    if (this.score>=40) key = rnd<0.30?'obstacle_high':(rnd<0.65?'obstacle_mid':'obstacle_low');
    else if (this.score>=20) key = rnd<0.15?'obstacle_high':(rnd<0.55?'obstacle_mid':'obstacle_low');
    else key = rnd<0.65?'obstacle_low':'obstacle_mid';

    const h= key==='obstacle_low'?DISPLAY.OBST_LOW_H : key==='obstacle_mid'?DISPLAY.OBST_MID_H : DISPLAY.OBST_HIGH_H;
    const s= scaleToHeight(this, key, h);
    const o= this.obstacles.create(WIDTH+80, this.groundY, key).setOrigin(0.5,1).setScale(s);
    o.body.allowGravity=false; o.setImmovable(true);

    // уменьшить хитбокс препятствия (честнее прыжок)
    const b=o.getBounds();
    o.body.setSize(b.width*0.75, b.height*0.85, true);
  }

  spawnSingleItem(){
    const keys=['item_beer','item_fish','item_glass'].filter(k=> this.textures.exists(k));
    if (!keys.length) return;
    const key= keys[Phaser.Math.Between(0, keys.length-1)];
    const y= this.groundY - Phaser.Math.Between(120, 210);
    const s= scaleToHeight(this, key, DISPLAY.ITEM_H);
    const it= this.items.create(WIDTH+40, y, key).setOrigin(0.5).setScale(s);
    it.body.allowGravity=false;
    it._phase = Math.random()*Math.PI*2;
    // следующий спавн через случайную паузу
    this.nextItemDelay = Phaser.Math.Between(1100, 1700);
    this.itemT = 0;
  }

  update(time,delta){
    // параллакс + земля
    this.far.tilePositionX += 0.15;
    this.near.tilePositionX += 0.30;
    this.ground.tilePositionX += this.speed*1.6;

    // держим игрока на земле — без «ухода вниз»
    if (this.player.body.velocity.y >= 0 && this.player.y >= this.groundY-1){
      this.player.y = this.groundY;
      this.player.body.setVelocityY(0);
      this.player.play('run', true);
    }
    if (this.player.y > this.groundY){ // страховка
      this.player.setY(this.groundY);
      this.player.body.setVelocityY(0);
    }

    // мягкое нарастание сложности
    if (this.score < 20){ this.speed=3.0; this.spawnInterval=2000; }             // очень легко
    else if (this.score < 40){ this.speed=3.6; this.spawnInterval=1700; }        // легче среднего
    else { this.speed=4.2; this.spawnInterval=1500; }                            // умеренно

    // спавн препятствий
    this.spawnT += delta;
    if (this.spawnT >= this.spawnInterval){
      this.spawnT = 0;
      this.spawnObstacle();
      if (this.score >= 35 && Math.random() < 0.25){
        this.time.delayedCall(320, ()=> this.spawnObstacle());
      }
    }

    // одиночные айтемы с рандомной дистанцией
    this.itemT += delta;
    if (this.itemT >= this.nextItemDelay){
      this.spawnSingleItem();
    }

    // движение объектов
    const vx = this.speed*2.0;
    this.obstacles.children.iterate(o=>{ if(o){ o.x -= vx; if(o.x<-120) o.destroy(); }});
    this.items.children.iterate(it=>{ if(it){ it.x -= vx; if(it.x<-80) it.destroy(); it.y += Math.sin((time*0.005 + it._phase))*0.28; }});
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

    this.add.text(WIDTH/2, 122, this.win ? 'ПОБЕДА!' : 'ИТОГ', style(56,8)).setOrigin(0.5);
    this.add.text(WIDTH/2, 190, `СЧЁТ: ${this.score} / 60`, style(32)).setOrigin(0.5);
    this.add.text(WIDTH/2, 235, `РЕКОРД: ${this.best}`, style(28)).setOrigin(0.5);

    let medalKey=null, medalName='';
    if (this.score >= 60){ medalKey='medal_gold'; medalName='ЗОЛОТО'; }
    else if (this.score >= 40){ medalKey='medal_silver'; medalName='СЕРЕБРО'; }
    else if (this.score >= 20){ medalKey='medal_bronze'; medalName='БРОНЗА'; }
    if (medalKey && this.textures.exists(medalKey)){
      this.add.image(WIDTH/2, 320, medalKey).setOrigin(0.5).setScale(scaleToHeight(this, medalKey, 120));
      this.add.text(WIDTH/2, 400, medalName, style(26)).setOrigin(0.5);
    }

    // Кнопки меньше
    const again = this.textures.exists('ui_btn_restart') ? this.add.image(WIDTH/2, HEIGHT-220, 'ui_btn_restart').setScale(0.9)
                                                         : this.add.rectangle(WIDTH/2, HEIGHT-220, 270, 90, 0xf0a000).setStrokeStyle(6,0x7a4a12);
    this.add.text(WIDTH/2, HEIGHT-220, 'ЕЩЁ РАЗ', style(30)).setOrigin(0.5);
    again.setInteractive({useHandCursor:true}).on('pointerdown', ()=> this.scene.start('Game'));

    const menu = this.textures.exists('ui_btn_home') ? this.add.image(WIDTH/2, HEIGHT-110, 'ui_btn_home').setScale(0.9)
                                                     : this.add.rectangle(WIDTH/2, HEIGHT-110, 210, 80, 0x5595ff).setStrokeStyle(6,0x173c6a);
    this.add.text(WIDTH/2, HEIGHT-110, 'МЕНЮ', style(26)).setOrigin(0.5);
    menu.setInteractive({useHandCursor:true}).on('pointerdown', ()=> this.scene.start('Menu'));
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: WIDTH, height: HEIGHT,
  backgroundColor: '#0f3f3f',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: WIDTH, height: HEIGHT },
  physics: { default:'arcade', arcade:{ gravity:{y:0}, debug:false } },
  scene: [Boot, Menu, Game, Result]
};
new Phaser.Game(config);

/* 左侧桌面 dock + 右侧千禧唱片播放器 —— 注入到每个页面 */
(function(){
  if (document.querySelector('.dock')) return; // 防重复

  /* ---------- 左侧快捷方式（已排除顶部导航里已有的项）---------- */
  var DOCK = [
    {label:"占卜",     href:"#divination",           icon:"icons/largeicons/MSN.png",   id:"nav-divination"},
    {label:"游戏",     href:"#games",                icon:"icons/largeicons/Games.png", id:"nav-games"},
    {label:"贩售机",   href:"vending_machine.html",  icon:"icons/px/icon1.png"},
    {label:"新闻",     href:"news.html",             icon:"icons/largeicons/Media.png"},
    {label:"电话机",   href:"hotline.html",           icon:"icons/px/Telephone.png"},
    {label:"回收站",   href:"corrupted_archive.html", icon:"icons/largeicons/Recycle.png"}
  ];

  /* ---------- 播放列表：mp3 放进仓库根的 music/ 文件夹 ---------- */
  var PLAYLIST = [
    {title:"nop",              artist:"桃汽水",     album:"回不去的夏天",                  src:"music/nop.mp3"},
    {title:"彼女は旅に出る",    artist:"鎖那",       album:"Hush a by little girl",         src:"music/彼女は旅に出る.mp3"},
    {title:"春日影",           artist:"MyGO!!!!!", album:"BanG Dream It's MyGO",    src:"music/春日影.mp3"},
    {title:"铁花飞",           artist:"Mili",       album:"塞壬唱片",                      src:"music/铁花飞.mp3"}
  ];

  /* ---------- 唱片中心专辑图（裁圆叠在黑胶上，加载失败就露出黑胶本体） ---------- */
  var COVERS = ["pictures/assets/picture1.png","pictures/assets/picture2.png","pictures/assets/picture3.png",
    "pictures/assets/picture4.png","pictures/assets/picture5.png","pictures/assets/picture7.jpg"];

  /* ---------- 建 dock ---------- */
  var dock = document.createElement('nav');
  dock.className = 'dock';
  dock.setAttribute('aria-label','桌面快捷方式');
  DOCK.forEach(function(d){
    var a = document.createElement('a');
    a.href = d.href;
    if (d.id) a.id = d.id;
    if (d.ext){ a.target = '_blank'; a.rel = 'noopener'; }
    a.innerHTML = '<img src="'+d.icon+'" alt="">'+d.label;
    dock.appendChild(a);
  });
  document.body.appendChild(dock);

  /* 移动端：dock 抽屉把手（PC 端 CSS 里隐藏） */
  var dockHandle=document.createElement('button');
  dockHandle.className='dock-handle'; dockHandle.setAttribute('aria-label','菜单'); dockHandle.textContent='≡';
  document.body.appendChild(dockHandle);
  dockHandle.addEventListener('click',function(){ dock.classList.toggle('open'); });
  document.addEventListener('click',function(e){
    if(dock.classList.contains('open') && !dock.contains(e.target) && e.target!==dockHandle) dock.classList.remove('open');
  });

  /* ---------- 建播放器 ---------- */
  var box = document.createElement('div');
  box.className = 'player';
  box.innerHTML =
    '<div class="vinyl" id="pv"><div class="lbl"></div><img class="cover" id="pcover" alt=""><div class="shine"></div></div>' +
    '<div class="scr" id="pscr">— 未放入唱片 —</div>' +
    '<div class="pmeta"><div>歌手：<span id="partist">未知</span></div><div>专辑：<span id="palbum">未知</span></div></div>' +
    '<div class="prow"><span id="ptcur">0:00</span>' +
      '<input id="pseek" class="pbar" type="range" min="0" max="1000" value="0" step="1" aria-label="进度">' +
      '<span id="ptdur">0:00</span></div>' +
    '<div class="pctrls">' +
      '<button id="pprev" title="上一首">◀</button>' +
      '<button id="pplay" title="播放/暂停">▶</button>' +
      '<button id="pnext" title="下一首">▶</button>' +
    '</div>' +
    '<div class="vrow"><span class="vico">🔊</span>' +
      '<input id="pvol" class="pbar" type="range" min="0" max="100" value="80" step="1" aria-label="音量"></div>';
  var slot = document.getElementById('player-slot');
  if (slot){ box.classList.add('docked'); slot.appendChild(box); }
  else {
    document.body.appendChild(box);
    /* 移动端：唱片机右下把手（PC 端 CSS 里隐藏） */
    var pHandle=document.createElement('button');
    pHandle.className='player-handle'; pHandle.setAttribute('aria-label','唱片机'); pHandle.textContent='♪';
    document.body.appendChild(pHandle);
    pHandle.addEventListener('click',function(){ box.classList.toggle('open'); });
  }

  var audio = new Audio();
  audio.preload = 'metadata';
  audio.volume = 0.8;
  var i = 0;

  var vinyl = document.getElementById('pv');
  var cover = document.getElementById('pcover');
  var scr   = document.getElementById('pscr');
  var play  = document.getElementById('pplay');
  var seek  = document.getElementById('pseek');
  var vol   = document.getElementById('pvol');
  var tcur  = document.getElementById('ptcur');
  var tdur  = document.getElementById('ptdur');
  var artistEl = document.getElementById('partist');
  var albumEl  = document.getElementById('palbum');
  var seeking = false;

  function fmt(s){ s=Math.floor(s||0); var m=Math.floor(s/60); var r=s%60; return m+':'+(r<10?'0':'')+r; }
  function load(idx){
    i = (idx + PLAYLIST.length) % PLAYLIST.length;
    audio.src = encodeURI(PLAYLIST[i].src);
    scr.textContent = PLAYLIST[i].title;
    if(artistEl) artistEl.textContent = PLAYLIST[i].artist || '未知';
    if(albumEl)  albumEl.textContent  = PLAYLIST[i].album  || '未知';
    if(cover){ cover.style.visibility='hidden'; cover.src = encodeURI(COVERS[i % COVERS.length]); }
    tcur.textContent='0:00'; tdur.textContent='0:00'; seek.value=0;
  }
  function spin(on){ vinyl.classList.toggle('spin', on); }
  function setPlayIcon(){ play.textContent = audio.paused ? '▶' : '❚❚'; }

  if(cover){
    cover.addEventListener('load',  function(){ cover.style.visibility='visible'; });
    cover.addEventListener('error', function(){ cover.style.visibility='hidden'; });
  }

  load(0);
  /* 进入网页默认播放第一首（浏览器可能拦截自动播放，拦截则等首次交互再放） */
  (function(){
    var tryPlay=function(){ var p=audio.play(); if(p&&p.catch) p.catch(function(){}); };
    tryPlay();
    var kick=function(){ if(audio.paused) tryPlay(); document.removeEventListener('pointerdown',kick); document.removeEventListener('keydown',kick); };
    document.addEventListener('pointerdown',kick); document.addEventListener('keydown',kick);
  })();

  play.addEventListener('click', function(){
    if (audio.paused){
      var p = audio.play();
      if (p && p.catch) p.catch(function(){ scr.textContent = '找不到 ' + PLAYLIST[i].title; });
    } else { audio.pause(); }
  });
  document.getElementById('pprev').addEventListener('click', function(){
    var w=!audio.paused; load(i-1); if(w) audio.play();
    if(window.Achievements) window.Achievements.bump('djSkips', 10, 'dj-timetoki');
  });
  document.getElementById('pnext').addEventListener('click', function(){
    var w=!audio.paused; load(i+1); if(w) audio.play();
    if(window.Achievements) window.Achievements.bump('djSkips', 10, 'dj-timetoki');
  });

  audio.addEventListener('play',  function(){ spin(true);  setPlayIcon(); });
  audio.addEventListener('pause', function(){ spin(false); setPlayIcon(); });
  audio.addEventListener('ended', function(){ load(i+1); audio.play(); });
  audio.addEventListener('error', function(){ spin(false); setPlayIcon(); scr.textContent = '缺唱片：' + PLAYLIST[i].title; });

  audio.addEventListener('loadedmetadata', function(){ tdur.textContent = fmt(audio.duration); });
  audio.addEventListener('timeupdate', function(){
    if (seeking || !audio.duration) return;
    seek.value = Math.round(audio.currentTime / audio.duration * 1000);
    tcur.textContent = fmt(audio.currentTime);
  });
  seek.addEventListener('input',  function(){ seeking = true; if(audio.duration) tcur.textContent = fmt(seek.value/1000*audio.duration); });
  seek.addEventListener('change', function(){ if(audio.duration) audio.currentTime = seek.value/1000*audio.duration; seeking = false; });
  vol.addEventListener('input',   function(){ audio.volume = vol.value/100; });

  /* 供游戏/占卜调用：打开暂停、关闭恢复到原状态 */
  window.__player = {
    _resume:false,
    pauseFor:function(){ this._resume = !audio.paused; if(!audio.paused) audio.pause(); },
    resume:function(){ if(this._resume){ var p=audio.play(); if(p&&p.catch)p.catch(function(){}); } this._resume=false; }
  };
})();

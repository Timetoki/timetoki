/* 千禧 QQ 聊天室 —— Time
   依赖 chat-data.js (window.TIME_CORPUS)。注入到每个页面。*/
(function(){
  if (document.querySelector('.qq')) return;
  var C = window.TIME_CORPUS || {keywords:[],greetings:["你来了。"],random:["……"]};
  var AVATAR = "pictures/assets/anon.jpg";   // Time 头像，可换成 pictures/assets/别的号
  var NAME = "Time";

  /* ---------- 入口按钮（左下，带红点角标）---------- */
  var launch = document.createElement('div');
  launch.className = 'chat-launch';
  launch.title = '打开聊天室';
  launch.innerHTML =
    '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M14 20 h72 a8 8 0 0 1 8 8 v38 a8 8 0 0 1 -8 8 H44 L26 84 V74 a8 8 0 0 1 -8 -8 V28 a8 8 0 0 1 8 -8 Z" ' +
    'fill="#fff" stroke="#2c2530" stroke-width="6" stroke-linejoin="round"/>' +
    '<circle cx="38" cy="47" r="5" fill="#ff6fa8"/><circle cx="55" cy="47" r="5" fill="#ff6fa8"/><circle cx="72" cy="47" r="5" fill="#ff6fa8"/></svg>' +
    '<span class="chat-badge" id="chatBadge"></span>';
  document.body.appendChild(launch);

  /* ---------- 对话框 ---------- */
  var qq = document.createElement('div');
  qq.className = 'qq';
  qq.innerHTML =
    '<div class="qq-bar" id="qqBar">' +
      '<img class="qq-ava" src="'+AVATAR+'" alt="">' +
      '<span class="qq-name">'+NAME+'</span><span class="qq-stat" id="qqStat">在线</span>' +
      '<span class="qq-btns">' +
        '<button class="min" title="最小化">—</button>' +
        '<button class="max" title="最大化">▢</button>' +
        '<button class="cls" title="关闭">✕</button>' +
      '</span>' +
    '</div>' +
    '<div class="qq-body" id="qqBody"></div>' +
    '<div class="qq-input">' +
      '<input id="qqIn" type="text" placeholder="说点什么…" autocomplete="off" maxlength="200">' +
      '<button id="qqSend">发送</button>' +
    '</div>';
  document.body.appendChild(qq);

  var body = qq.querySelector('#qqBody');
  var input = qq.querySelector('#qqIn');
  var badge = document.getElementById('chatBadge');
  var stat = qq.querySelector('#qqStat');
  var unread = 0, greeted = false, idleTimer = null, busy = false;
  var openedAt = 0, typedThisSession = false;

  function esc(s){ var d=document.createElement('div'); d.textContent=s; return d.innerHTML; }
  function scroll(){ body.scrollTop = body.scrollHeight; }
  function rand(a){ return a[Math.floor(Math.random()*a.length)]; }
  function isOpen(){ return qq.classList.contains('open') && !qq.classList.contains('min'); }

  function addMe(text){
    var m=document.createElement('div'); m.className='msg me';
    m.innerHTML='<div class="id">我</div><div class="t">'+esc(text)+'</div>';
    body.appendChild(m); scroll();
  }
  function addHer(text){
    var m=document.createElement('div'); m.className='msg her';
    m.innerHTML='<div class="id">Time</div><div class="t">'+esc(text)+'</div>';
    body.appendChild(m); scroll();
    if (!isOpen()){ unread++; renderBadge(); }
  }
  function renderBadge(){
    if (unread>0){ badge.textContent = unread>99?'99+':unread; badge.classList.add('show'); }
    else { badge.classList.remove('show'); }
  }
  function typing(cb){
    stat.textContent='对方正在输入…';
    var t=document.createElement('div'); t.className='msg her typing';
    t.innerHTML='<div class="id">Time</div><div class="t">正在输入…</div>';
    body.appendChild(t); scroll();
    var wait = 900 + Math.random()*900;
    setTimeout(function(){ t.remove(); stat.textContent='在线'; cb(); }, wait);
  }
  /* 依次发送多句：先一句，隔 5–6 秒下一句 */
  function sendSeq(lines){
    busy = true; var i=0;
    function step(){
      typing(function(){
        addHer(lines[i]); i++;
        if (i<lines.length){ setTimeout(step, 5000 + Math.random()*1000); }
        else { busy=false; }
      });
    }
    step();
  }

  function replyTo(text){
    var hit=null, pos=Infinity;
    (C.keywords||[]).forEach(function(k){
      k.keys.forEach(function(key){
        var p=text.indexOf(key);
        if (p>-1 && p<pos){ pos=p; hit=k; }
      });
    });
    var lines = hit ? hit.reply.slice() : [ rand(C.random) ];
    sendSeq(lines);
  }

  var DEBUG_CODE = '/unlockall';
  function userSend(){
    var v=input.value.trim(); if(!v) return;
    if (v===DEBUG_CODE){
      input.value='';
      if (window.Achievements && window.Achievements.unlockAll) window.Achievements.unlockAll();
      addHer('调试模式：全部成就已解锁。');
      return;
    }
    typedThisSession = true;
    input.value=''; addMe(v); resetIdle();
    if (!busy) setTimeout(function(){ replyTo(v); }, 400);
  }

  function resetIdle(){
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(function(){
      if (!busy) sendSeq([ rand(C.random) ]);
      resetIdle();
    }, 5*60*1000);
  }

  function openChat(){
    qq.classList.add('open'); qq.classList.remove('min');
    launch.style.display='none';
    unread=0; renderBadge();
    openedAt = Date.now(); typedThisSession = false;
    if (!greeted){ greeted=true; typing(function(){ addHer(rand(C.greetings)); }); }
    resetIdle(); input.focus();
  }
  function closeChat(){
    if (openedAt && !typedThisSession && (Date.now()-openedAt)>=30000 && window.Achievements){
      window.Achievements.unlock('qq-ghost');
    }
    openedAt = 0;
    qq.classList.remove('open'); launch.style.display='flex';
  }

  launch.addEventListener('click', openChat);
  qq.querySelector('.cls').addEventListener('click', closeChat);
  qq.querySelector('.min').addEventListener('click', closeChat);
  qq.querySelector('.max').addEventListener('click', function(){ /* 最大化：点了无效 */ });
  qq.querySelector('#qqSend').addEventListener('click', userSend);
  input.addEventListener('keydown', function(e){ if(e.key==='Enter'){ e.preventDefault(); userSend(); } });

  /* 拖动标题栏 */
  (function(){
    var bar=qq.querySelector('#qqBar'), dragging=false, ox=0, oy=0;
    bar.addEventListener('mousedown', function(e){
      if (qq.classList.contains('max')) return;
      dragging=true; var r=qq.getBoundingClientRect();
      qq.style.left=r.left+'px'; qq.style.top=r.top+'px'; qq.style.bottom='auto';
      ox=e.clientX-r.left; oy=e.clientY-r.top; e.preventDefault();
    });
    window.addEventListener('mousemove', function(e){
      if(!dragging) return;
      qq.style.left=Math.max(0,Math.min(window.innerWidth-60,e.clientX-ox))+'px';
      qq.style.top =Math.max(0,Math.min(window.innerHeight-40,e.clientY-oy))+'px';
    });
    window.addEventListener('mouseup', function(){ dragging=false; });
  })();
})();

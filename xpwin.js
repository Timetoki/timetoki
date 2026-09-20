/* 桌面弹窗：点入口不跳转，抽取目标页面正文塞进 XP 灰窗，音乐/聊天不断。
   样例先接「贩售机」，验证观感后把更多入口加进 MODAL 即可。 */
(function(){
  var MODAL = ['vending_machine.html','logs.html','operator_notes.html','specimen_room.html',
    'museum.html','about.html','portfolio.html','news.html','corrupted_archive.html',
    'call-0417.html','call-0603.html','call-0912.html','call-2258.html','hotline.html'];

  var mask=document.createElement('div'); mask.className='xp-mask'; document.body.appendChild(mask);
  var modal=document.createElement('div'); modal.className='xpwin xp-modal';
  modal.innerHTML=
    '<div class="xp-t"><img class="ico" id="xpmico" src="icons/largeicons/Games.png" alt="">' +
    '<span id="xpmtitle">窗口</span><span class="btns">' +
    '<button id="xpmmin" title="最小化">_</button>' +
    '<button id="xpmmax" title="最大化">▢</button>' +
    '<button id="xpmcls" title="关闭">×</button>' +
    '</span></div><div class="xp-b" id="xpmbody">准备上菜……</div>';
  document.body.appendChild(modal);

  function close(){ modal.classList.remove('open','game','answerbook'); mask.classList.remove('open');
    document.querySelectorAll('.xp-fall-coin,.xp-fall-item,.xp-piled').forEach(function(n){n.remove();});
    if(window.__player) window.__player.resume(); }
  mask.addEventListener('click',close);
  document.getElementById('xpmcls').addEventListener('click',close);
  document.getElementById('xpmmin').addEventListener('click',function(e){ e.stopPropagation(); close(); });
  document.getElementById('xpmmax').addEventListener('click',function(e){ e.stopPropagation(); /* 最大化：点了无效 */ });

  function openModal(url,title,icon){
    document.getElementById('xpmtitle').textContent=title||'窗口';
    if(icon) document.getElementById('xpmico').src=icon;
    var body=document.getElementById('xpmbody'); body.innerHTML='准备上菜……';
    modal.classList.add('open'); mask.classList.add('open');
    if(window.Achievements){
      var base=url.split('/').pop();
      if(base==='corrupted_archive.html'){
        window.Achievements.visit(base, ['corrupted_archive.html'], 'archive-digger');
      }
      if(/^call-/.test(base)){
        window.Achievements.visit(base, ['call-0417.html','call-0603.html','call-0912.html','call-2258.html'], 'hotline-completionist');
        try{
          var seen=JSON.parse(localStorage.getItem('call_open_counts')||'{}');
          seen[base]=(seen[base]||0)+1;
          localStorage.setItem('call_open_counts', JSON.stringify(seen));
          if(seen[base]>=2) window.Achievements.unlock('replay-the-same-call');
        }catch(e){}
      }
    }
    fetch(url).then(function(r){return r.text();}).then(function(html){
      var doc=new DOMParser().parseFromString(html,'text/html');
      var w=doc.querySelector('.wrap');
      if(!w){ body.innerHTML='打不开这个窗口。'; return; }
      w.querySelectorAll('.doodle-layer,.dock,.player,.chatbtn,.chatwin,script,nav.menu').forEach(function(n){n.remove();});
      body.innerHTML=w.innerHTML;
      bindVending(body);
      bindHotline(body);
      bindPortfolio(body);
      bindOperatorNotes(body);
      if(window.Achievements) window.Achievements.render();
    }).catch(function(){ body.innerHTML='数据已???完好，请刷新。'; });
  }

  /* 弹窗里重新绑定贩售机掉落（弹窗剥离了原页脚本，需在此重挂） */
  function bindVending(scope){
    var vm=scope.querySelector('#vm'); if(!vm && !scope.querySelector('.vitem')) return;
    var floating=0, pile=[];
    function dropCoin(){
      floating++;
      if(window.Achievements){
        window.Achievements.bump('vendingCoins', 10, 'vending-broke');
        if(floating>=10) window.Achievements.unlock('vending-flood');
      }
      var img=document.createElement('img');
      img.src='pictures/assets/c.gif'; img.className='xp-fall-coin';
      img.style.left=(10+Math.random()*80)+'vw';
      document.body.appendChild(img);
      img.addEventListener('animationend',function(){ img.remove(); floating--; });
    }
    function dropItem(icon, fromX){
      var img=document.createElement('img');
      img.src='icons/Pixel_Mart/'+icon; img.className='xp-fall-item';
      var x=(fromX!=null?fromX:Math.random()*window.innerWidth);
      img.style.left=Math.max(4,Math.min(window.innerWidth-46,x))+'px';
      document.body.appendChild(img);
      img.addEventListener('animationend',function(){
        img.classList.remove('xp-fall-item'); img.classList.add('xp-piled');
        img.style.left=Math.max(4,Math.min(window.innerWidth-46,x))+'px';
        img.style.bottom=(Math.random()*10)+'px';
        pile.push(img); while(pile.length>50){ pile.shift().remove(); }
      });
    }
    if(vm){ vm.style.cursor='pointer';
      vm.addEventListener('animationend',function(){ vm.classList.remove('shake'); });
      vm.addEventListener('click',function(){ vm.classList.remove('shake'); void vm.offsetWidth; vm.classList.add('shake'); dropCoin(); });
    }
    scope.querySelectorAll('.vitem:not(.out)').forEach(function(btn){
      btn.addEventListener('click',function(e){ dropItem(btn.getAttribute('data-icon'), e.clientX); });
    });
  }

  /* 接线员工作守则：滚到第 12 条末尾才算读完（弹窗剥离了原页脚本，需在此重挂） */
  function bindOperatorNotes(scope){
    var closing=scope.querySelector('.closing'); if(!closing) return;
    function check(){
      var r=closing.getBoundingClientRect(), sr=scope.getBoundingClientRect();
      if(r.bottom<=sr.bottom+40){
        if(window.Achievements) window.Achievements.unlock('read-the-fine-print');
        scope.removeEventListener('scroll', check);
      }
    }
    scope.addEventListener('scroll', check);
    check();
  }

  /* 作品集：分类切换 + 板绘轮播 + 文字全文阅读（弹窗剥离了原页脚本，需在此重挂） */
  function bindPortfolio(scope){
    var tabs=scope.querySelectorAll('.pf-tab'); if(!tabs.length || tabs[0].dataset.bound) return;
    var panels=scope.querySelectorAll('.pf-panel');

    tabs.forEach(function(tab){
      tab.dataset.bound='1';
      tab.addEventListener('click',function(){
        var cat=tab.getAttribute('data-cat');
        var target=scope.querySelector('.pf-panel[data-panel="'+cat+'"]');
        if(target) target.scrollIntoView({behavior:'smooth', block:'start'});
      });
    });

    if('IntersectionObserver' in window){
      var navByCat={};
      tabs.forEach(function(t){ navByCat[t.getAttribute('data-cat')]=t; });
      var obs=new IntersectionObserver(function(entries){
        entries.forEach(function(en){
          if(!en.isIntersecting) return;
          tabs.forEach(function(t){ t.classList.remove('active'); });
          var cat=en.target.getAttribute('data-panel');
          if(navByCat[cat]) navByCat[cat].classList.add('active');
        });
      }, { rootMargin:'-30% 0px -60% 0px' });
      panels.forEach(function(p){ obs.observe(p); });
    }

    var lightbox=scope.querySelector('#pfLightbox');
    var lightboxImg=scope.querySelector('#pfLightboxImg');
    var coverflows=[];

    function initCoverflow(trackId){
      var track=scope.querySelector('#'+trackId);
      if(!track) return null;
      var viewport=track.parentElement;
      var allNodes=track.querySelectorAll('.pf-cf-item');
      var items=track.querySelectorAll('.pf-cf-item:not(.pf-cf-clone)');
      var current=items[0];

      function centerOf(it){ return it.offsetLeft + it.offsetWidth/2; }
      function setActive(it){ allNodes.forEach(function(n){ n.classList.toggle('active', n===it); }); }
      function moveTo(it, animate){
        if(!it) return;
        var px=-(centerOf(it) - viewport.clientWidth/2);
        if(!animate){
          track.classList.add('no-anim');
          track.style.transform='translateX('+px+'px)';
          setActive(it);
          requestAnimationFrame(function(){
            requestAnimationFrame(function(){ track.classList.remove('no-anim'); });
          });
        } else {
          track.style.transform='translateX('+px+'px)';
          setActive(it);
        }
      }
      function findNext(dir){
        var mid=centerOf(current);
        var list=Array.prototype.slice.call(allNodes);
        if(dir<0) list.reverse();
        for(var i=0;i<list.length;i++){
          var it=list[i], itMid=centerOf(it);
          if((dir>0 && itMid>mid+4) || (dir<0 && itMid<mid-4)) return it;
        }
        return null;
      }
      function goTo(target){
        if(!target) return;
        current=target;
        moveTo(target, true);
        if(target.classList.contains('pf-cf-clone')){
          var done=false;
          function land(){
            if(done) return; done=true;
            track.removeEventListener('transitionend', onEnd);
            var real=items[+target.getAttribute('data-clone-of')];
            current=real; moveTo(real, false);
          }
          function onEnd(e){ if(e.target===track && e.propertyName==='transform') land(); }
          track.addEventListener('transitionend', onEnd);
          setTimeout(land, 600);
        }
      }
      function step(dir){ goTo(findNext(dir)); }

      var timer=null;
      function stopAutoplay(){ if(timer){ clearInterval(timer); timer=null; } }
      function startAutoplay(){ stopAutoplay(); if(items.length<2) return; timer=setInterval(function(){ step(1); },4000); }
      function kick(){ startAutoplay(); }

      items.forEach(function(it){
        it.addEventListener('click', function(){
          if(it===current){
            var img=it.querySelector('img');
            if(img && lightbox && lightboxImg){
              lightboxImg.src=img.src;
              lightbox.classList.add('open');
              stopAutoplay();
            }
          } else {
            goTo(it); kick();
          }
        });
      });

      moveTo(items[0], false);
      startAutoplay();
      return { step:step, kick:kick, stopAutoplay:stopAutoplay, startAutoplay:startAutoplay };
    }

    coverflows.push(['painting', initCoverflow('pfCfPainting')]);
    coverflows.push(['words', initCoverflow('pfCfWords')]);

    scope.querySelectorAll('.pf-cf-arrow').forEach(function(btn){
      var key=btn.getAttribute('data-cf');
      var cf=null;
      coverflows.forEach(function(pair){ if(pair[0]===key) cf=pair[1]; });
      if(!cf) return;
      var dir=btn.classList.contains('next') ? 1 : -1;
      btn.addEventListener('click', function(){ cf.step(dir); cf.kick(); });
    });
    if(lightbox){
      lightbox.addEventListener('click', function(){
        lightbox.classList.remove('open');
        coverflows.forEach(function(pair){ if(pair[1]) pair[1].startAutoplay(); });
      });
    }

    var ARTICLES=[
      { file:'【一阳】尾戒.txt', full:'【一阳】尾戒', title:'尾戒', note:'无情人作对孤雏', date:'2023-06-12', words:11328, tags:['KPL','电竞RPS','一阳'], locked:false },
      { file:'【猫兰】Just like donuts.txt', full:'【猫兰】Just like donuts', title:'Just like donuts', note:'我生吞活剥，吃下了它蓝色的内脏。', date:'2023-12-09', words:8132, tags:['LCK','电竞RPS','猫兰'], locked:false },
      { file:'【xunelk】记瑞士轮的一件小事.txt', full:'【xunelk】记瑞士轮的一件小事', title:'记瑞士轮的一件小事', note:'只有橘子花盛开到腐烂而又生长出蓬勃薰衣草的味道。', date:'2023-10-20', words:4255, tags:['LCK','电竞RPS','xunelk'], locked:true },
      { file:'【兮星】海难.txt', full:'【兮星】海难', title:'海难', note:'像冰冷的海水，在一场海难中沸腾。', date:'2023-05-09', words:7015, tags:['KPL','电竞RPS','兮星'], locked:true },
      { file:'【宁蓝】直到夏末。.txt', full:'【宁蓝】直到夏末。', title:'直到夏末。', note:'他们在闷热的夏日里相拥。', date:'2023-06-02', words:8408, tags:['LPL','电竞RPS','宁蓝'], locked:true }
    ];
    var GATE_PASSWORD='1010';
    var unlockedFiles={};
    var openRow=null, openPanel=null;

    var articleList=scope.querySelector('#pfArticleList');
    if(articleList && !articleList.dataset.built){
      articleList.dataset.built='1';
      articleList.innerHTML=ARTICLES.map(function(a){
        return '<div class="pf-article-row">'+
          '<div class="pf-article-line1">'+
            '<img class="pf-article-ico" src="icons/largeicons/file.png" alt="">'+
            '<span class="pf-article-title">'+a.title+'</span>'+
            '<span class="pf-article-meta">'+a.date+' · '+(a.words?a.words+'字':'未完成')+'</span>'+
            (a.locked?'<span class="pf-lock">🔒</span>':'')+
          '</div>'+
          '<div class="pf-article-tags">'+a.tags.map(function(t){ return '<span class="pf-tag">#'+t+'</span>'; }).join('')+'</div>'+
          '<div class="pf-article-note">'+a.note+'</div>'+
        '</div>';
      }).join('');
    }

    function closeOpen(){
      if(openPanel){
        var p=openPanel;
        p.classList.remove('open');
        setTimeout(function(){ p.remove(); }, 360);
        openPanel=null;
      }
      if(openRow){ openRow.classList.remove('open'); openRow=null; }
    }
    function showText(panel, article){
      panel.innerHTML=
        '<div class="pf-reader-title">'+article.full+'</div>'+
        '<pre class="pf-reader-text">准备上菜……</pre>';
      var pre=panel.querySelector('.pf-reader-text');
      fetch(encodeURI('pruducts/txts/'+article.file)).then(function(r){ return r.text(); }).then(function(t){
        pre.textContent=t.trim() ? t : '这道菜还没做完，请稍后再来。';
      }).catch(function(){ pre.textContent='数据已???完好，请刷新。'; });
    }
    function showGate(panel, article){
      panel.innerHTML=
        '<div class="pf-reader-title">'+article.full+'</div>'+
        '<div class="pf-gate">'+
          '<div class="pf-gate-row">'+
            '<input type="password" class="pf-gate-input" placeholder="请输入密码" autocomplete="off">'+
            '<button class="pf-gate-submit">核验</button>'+
          '</div>'+
          '<p class="pf-gate-msg"></p>'+
        '</div>';
      var input=panel.querySelector('.pf-gate-input');
      var submit=panel.querySelector('.pf-gate-submit');
      var msg=panel.querySelector('.pf-gate-msg');
      function tryUnlock(){
        if(input.value===GATE_PASSWORD){
          unlockedFiles[article.file]=true;
          msg.textContent='您已通过身份核验。';
          setTimeout(function(){ showText(panel, article); },500);
        } else {
          msg.textContent='您无权访问该资料。';
        }
      }
      submit.addEventListener('click',tryUnlock);
      input.addEventListener('keydown',function(e){ if(e.key==='Enter') tryUnlock(); });
    }
    if(articleList){
      articleList.querySelectorAll('.pf-article-row').forEach(function(rowEl,i){
        rowEl.addEventListener('click',function(){
          var article=ARTICLES[i];
          if(openRow===rowEl){ closeOpen(); return; }
          closeOpen();
          var panel=document.createElement('div');
          panel.className='pf-article-reader';
          var body=document.createElement('div');
          body.className='pf-reader-body';
          panel.appendChild(body);
          rowEl.insertAdjacentElement('afterend', panel);
          if(article.locked && !unlockedFiles[article.file]){ showGate(body, article); }
          else{ showText(body, article); }
          requestAnimationFrame(function(){ panel.classList.add('open'); });
          rowEl.classList.add('open');
          openRow=rowEl; openPanel=panel;
        });
      });
    }
  }

  /* +86自杀援助中心：电话机（弹窗剥离了原页脚本，需在此重挂） */
  function bindHotline(scope){
    var dial=scope.querySelector('#hlDial'); if(!dial || dial.dataset.bound) return;
    dial.dataset.bound='1';
    var screen=scope.querySelector('#hlScreen');
    var listen=scope.querySelector('#hlListen');
    var inputRow=scope.querySelector('#hlInputRow');
    var input=scope.querySelector('#hlDropInput');
    var dropBtn=scope.querySelector('#hlDropBtn');
    var audioCtx=null, listenTimer=null, busy=false;

    function beep(freq, dur, vol, type){
      try{
        if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)();
        var o=audioCtx.createOscillator(), g=audioCtx.createGain();
        o.type=type||'square'; o.frequency.value=freq;
        g.gain.value=vol||0.03;
        o.connect(g); g.connect(audioCtx.destination);
        o.start(); o.stop(audioCtx.currentTime+dur);
      }catch(e){}
    }
    function dialTone(){ beep(400, 0.55, 0.045, 'sine'); }
    function typeLine(text, cb){
      var box=screen.querySelector('.transcript');
      if(!box){ box=document.createElement('div'); box.className='transcript'; screen.appendChild(box); }
      var p=document.createElement('p'); p.className='op'; box.appendChild(p);
      var i=0;
      (function step(){
        p.textContent=text.slice(0,i);
        if(i%3===0) beep(520+Math.random()*80, 0.02, 0.025);
        i++;
        if(i<=text.length){ setTimeout(step,34); }
        else{ cb&&cb(); }
      })();
    }
    function sayCaller(text){
      var box=screen.querySelector('.transcript');
      if(!box){ box=document.createElement('div'); box.className='transcript'; screen.appendChild(box); }
      var p=document.createElement('p'); p.className='caller'; p.textContent=text; box.appendChild(p);
    }
    function startListenPulse(){
      var frames=['正在聆听','正在聆听…','正在聆听……'];
      var i=0;
      listen.hidden=false;
      listen.textContent=frames[0];
      listenTimer=setInterval(function(){
        i=(i+1)%frames.length;
        listen.textContent=frames[i];
      },450);
    }
    function stopListenPulse(){
      if(listenTimer){ clearInterval(listenTimer); listenTimer=null; }
      listen.hidden=true;
    }

    function submitPain(){
      var v=(input.value||'').trim();
      if(!v) return;
      inputRow.hidden=true;
      stopListenPulse();
      try{
        var arr=JSON.parse(localStorage.getItem('user_pain_submissions')||'[]');
        arr.push(v);
        while(arr.length>50) arr.shift();
        localStorage.setItem('user_pain_submissions', JSON.stringify(arr));
      }catch(e){}
      try{
        var today=new Date().toISOString().slice(0,10);
        var daily=JSON.parse(localStorage.getItem('hotline_daily')||'null');
        if(!daily || daily.date!==today) daily={date:today, count:0};
        daily.count++;
        localStorage.setItem('hotline_daily', JSON.stringify(daily));
        if(daily.count>=5 && window.Achievements) window.Achievements.unlock('hotline-regular');
      }catch(e){}
      sayCaller(v);
      input.value='';
      setTimeout(function(){
        typeLine('我在听。', function(){
          setTimeout(function(){
            typeLine('已经收到您投喂的痛苦，请稍等，我们正在烹饪中……', function(){
              setTimeout(function(){
                screen.classList.add('dim');
                screen.innerHTML='<p class="hl-idle">对方已挂断。</p>';
                dial.disabled=false;
                busy=false;
              }, 5000);
            });
          }, 500);
        });
      }, 400);
    }

    dial.addEventListener('click', function(){
      if(busy) return;
      busy=true;
      dial.disabled=true;
      inputRow.hidden=true;
      stopListenPulse();
      screen.classList.remove('dim');
      screen.innerHTML='<p class="hl-idle">拨号中……</p>';
      dialTone();
      setTimeout(dialTone, 700);
      setTimeout(function(){
        screen.innerHTML='';
        typeLine('您好，这里是+86自杀援助热线。', function(){
          inputRow.hidden=false;
          input.focus();
          startListenPulse();
        });
      },1450);
    });

    dropBtn.addEventListener('click', submitPain);
    input.addEventListener('keydown', function(e){ if(e.key==='Enter') submitPain(); });
  }
  /* 答案之书：book1/book2 来回切当假 gif + 晕开白光呼吸文字 + 点击抽签 */
  function openAnswerBook(dbody, navA){
    modal.classList.add('answerbook');
    dbody.innerHTML=
      '<button class="game-back">← 返回</button>'+
      '<div class="ab-stage">'+
        '<img class="ab-book" src="pictures/assets/book.gif" alt="" onerror="this.style.display=\'none\'">'+
        '<div class="ab-glow"><span class="ab-hint">点击寻找答案</span></div>'+
      '</div>';
    dbody.querySelector('.game-back').addEventListener('click',function(){ navA.click(); });
    var glow=dbody.querySelector('.ab-glow'), hint=dbody.querySelector('.ab-hint');
    var book=dbody.querySelector('.ab-book');
    var BOOK=window.ANSWER_BOOK||['……'];
    var last=-1, timer=null, GIFMS=1500;
    glow.style.cursor='pointer';
    glow.addEventListener('click',function(){
      if(timer) clearTimeout(timer);
      book.src='pictures/assets/book.gif?t='+Date.now();            // 重播一次
      timer=setTimeout(function(){ book.src='pictures/assets/book.png'; }, GIFMS); // 播完停末帧
      var i; do{ i=Math.floor(Math.random()*BOOK.length); }while(i===last&&BOOK.length>1); last=i;
      hint.classList.remove('pop'); void hint.offsetWidth; hint.classList.add('pop');
      hint.textContent=BOOK[i];
      if(window.Achievements) window.Achievements.bump('bookFlips', 20, 'book-worn-out');
    });
  }

  /* 今日运势抽签：摇签筒→白纸条→一天一次（本地日期锁） */
  function openFortune(dbody, navA){
    var ICONS=['ball_pen.png','eraser.png','light_bulb.png','coffee_bag.png','receipt.png',
      'batteries.png','marshmallows.png','candy_bar.png','strawberry.png','banana.png',
      'cookies.png','bubble_gum.png','rubber_duck.png','light_bulb_box.png','egg_white.png'];
    var POOL=window.FORTUNE||[];
    function today(){ var d=new Date(); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); }
    function pickIcon(){ return 'icons/Pixel_Mart/'+ICONS[Math.floor(Math.random()*ICONS.length)]; }
    function stars(s){ return '★★★★★☆☆☆☆☆'.slice(5-s,10-s); }

    dbody.innerHTML=
      '<button class="game-back">← 返回</button>'+
      '<div class="fo-stage">'+
        '<div class="fo-tube" id="fotube" title="点我摇一摇">'+
          '<div class="fo-lip"></div><div class="fo-sticks"><i></i><i></i><i></i><i></i><i></i></div>'+
          '<div class="fo-tip">点击摇签</div>'+
        '</div>'+
        '<div class="fo-slip" id="foslip"></div>'+
      '</div>';
    dbody.querySelector('.game-back').addEventListener('click',function(){ navA.click(); });
    var tube=dbody.querySelector('#fotube'), slip=dbody.querySelector('#foslip');

    function render(f, ic){
      slip.innerHTML=
        '<div class="fo-paper">'+
          '<img class="fo-ic" src="'+ic+'" alt="">'+
          '<div class="fo-name">今日签 · 「'+f.n+'」</div>'+
          '<div class="fo-stars">'+stars(f.s)+'</div>'+
          '<p class="fo-line">'+f.a+'<br>'+f.b+'</p>'+
          '<div class="fo-meta">关键词：'+f.k+'　·　幸运时刻：'+f.t+'　·　幸运物：'+f.o+'</div>'+
        '</div>';
      slip.classList.add('show');
    }

    // 已抽过？直接显示当天那张
    var saved=null;
    try{ saved=JSON.parse(localStorage.getItem('fortune_today')||'null'); }catch(e){}
    if(saved && saved.date===today() && saved.i>=0 && POOL[saved.i]){
      tube.querySelector('.fo-tip').textContent='今天已抽';
      render(POOL[saved.i], saved.ic);
      if(window.Achievements) window.Achievements.bump('fortuneRevisit', 5, 'shrine-denied');
      return;
    }

    tube.addEventListener('click',function(){
      // 再次校验，防连点
      try{ saved=JSON.parse(localStorage.getItem('fortune_today')||'null'); }catch(e){}
      if(saved && saved.date===today()){ return; }
      if(!POOL.length) return;
      tube.classList.remove('shake'); void tube.offsetWidth; tube.classList.add('shake');
      var i=Math.floor(Math.random()*POOL.length), ic=pickIcon();
      setTimeout(function(){
        render(POOL[i], ic);
        tube.querySelector('.fo-tip').textContent='今天已抽';
        try{ localStorage.setItem('fortune_today', JSON.stringify({date:today(), i:i, ic:ic})); }catch(e){}
      }, 650);
    });
  }

  /* 塔罗：选牌阵 → 三张牌背翻开 → 显示中文名与简析 → 再寻求一次 */
  function openTarot(dbody, navA){
    var DECK=(window.TAROT||[]);
    var SPREADS={
      ptf:{ name:"过去 · 现在 · 未来", desc:"适合探讨事情的变化", pos:["过去","现在","未来"] },
      root:{ name:"寻求事情本源", desc:"寻求事件的原因", pos:["表象","根源","关键"] }
    };
    function backHTML(){ return '<img src="pictures/Cards/card-back.png" alt="牌背">'; }

    function chooser(){
      dbody.innerHTML=
        '<button class="game-back">← 返回</button>'+
        '<p class="muted" style="text-align:center;margin:4px 0 14px">选择一个牌阵</p>'+
        '<div class="tarot-spreads">'+
          '<button class="spread-card" data-s="ptf"><div class="sp-name">过去 · 现在 · 未来阵</div><div class="sp-desc">适合探讨事情的变化</div></button>'+
          '<button class="spread-card" data-s="root"><div class="sp-name">寻求事情本源阵</div><div class="sp-desc">寻求事件的原因</div></button>'+
        '</div>';
      dbody.querySelector('.game-back').addEventListener('click',function(){ navA.click(); });
      dbody.querySelectorAll('.spread-card').forEach(function(b){
        b.addEventListener('click',function(){ table(SPREADS[b.getAttribute('data-s')]); });
      });
    }

    function table(sp){
      var picks=[], used={};
      function draw(){ var i; do{ i=Math.floor(Math.random()*DECK.length); }while(used[i]); used[i]=1; return {card:DECK[i], reversed:Math.random()<0.5}; }
      dbody.innerHTML=
        '<button class="game-back">← 换牌阵</button>'+
        '<div class="tarot-title">'+sp.name+'　<span class="muted" style="font-size:12px">'+sp.desc+'</span></div>'+
        '<div class="tarot-row">'+
          sp.pos.map(function(p,idx){
            return '<div class="tcard" data-idx="'+idx+'">'+
              '<div class="tcard-inner">'+
                '<div class="tcard-face back">'+backHTML()+'</div>'+
                '<div class="tcard-face front"></div>'+
              '</div>'+
              '<div class="tpos">'+p+'</div>'+
              '<div class="tinfo"></div>'+
            '</div>';
          }).join('')+
        '</div>'+
        '<div class="tarot-again" style="display:none"><button class="again-btn">再寻求一次</button></div>';
      dbody.querySelector('.game-back').addEventListener('click',chooser);
      var revealed=0, total=sp.pos.length;
      var cards=dbody.querySelectorAll('.tcard');
      cards.forEach(function(c){
        c.addEventListener('click',function(){
          if(c.classList.contains('flipped')) return;
          var d=draw(), card=d.card, rev=d.reversed;
          c.querySelector('.front').innerHTML='<img class="'+(rev?'card-reversed':'')+'" src="pictures/Cards/'+encodeURIComponent(card.f)+'" alt="'+card.n+'" onerror="this.style.opacity=0">';
          c.classList.add('flipped');
          c.querySelector('.tinfo').innerHTML='<div class="tname">'+card.n+'<span class="torient">·'+(rev?'逆位':'正位')+'</span></div><div class="tread">'+(rev?card.rv:card.r)+'</div>';
          revealed++;
          if(revealed>=total){ dbody.querySelector('.tarot-again').style.display='block'; }
        });
      });
      dbody.querySelector('.again-btn').addEventListener('click',function(){
        if(window.Achievements) window.Achievements.bump('tarotAgain', 5, 'tarot-addict');
        table(sp);
      });
    }

    chooser();
  }

  document.addEventListener('click',function(e){
    var a=e.target.closest('a'); if(!a) return;

    /* 占卜栏：弹出选择界面（三个入口，先占位） */
    if(a.id==='nav-divination'){
      e.preventDefault();
      document.getElementById('xpmtitle').textContent='占卜';
      document.getElementById('xpmico').src='icons/largeicons/MSN.png';
      var dbody=document.getElementById('xpmbody');
      dbody.innerHTML=
        '<div class="game-pick">'+
          '<div class="game-card div-card" data-div="answers"><div class="cover c1"><img src="icons/px/ball.png" alt=""></div><div class="gname">答案之书</div></div>'+
          '<div class="game-card div-card" data-div="tarot"><div class="cover c2"><img src="icons/px/moon.png" alt=""></div><div class="gname">塔罗牌</div></div>'+
          '<div class="game-card div-card" data-div="fortune"><div class="cover c3"><img src="icons/px/sweet.png" alt=""></div><div class="gname">今日运势抽签</div></div>'+
        '</div>';
      modal.classList.remove('game');
      modal.classList.add('open'); mask.classList.add('open');
      dbody.querySelectorAll('.div-card').forEach(function(card){
        card.addEventListener('click',function(){
          var kind=card.getAttribute('data-div');
          var name=card.querySelector('.gname').textContent;
          if(kind==='answers'){ openAnswerBook(dbody, a); return; }
          if(kind==='fortune'){ openFortune(dbody, a); return; }
          if(kind==='tarot'){ openTarot(dbody, a); return; }
          dbody.innerHTML='<button class="game-back">← 返回</button>'+
            '<div style="text-align:center;padding:40px 16px">'+
            '<div style="font-size:40px;margin-bottom:12px">🚧</div>'+
            '<div style="font-weight:700;font-size:16px">'+name+'</div>'+
            '<p class="muted" style="margin-top:8px">施工中，敬请期待 ♡</p></div>';
          dbody.querySelector('.game-back').addEventListener('click',function(){ a.click(); });
        });
      });
      return;
    }

    /* 游戏栏：弹出游戏选择界面（不跳转，iframe 载入，音乐不断） */
    if(a.id==='nav-games'){
      e.preventDefault();
      if(window.__player) window.__player.pauseFor();
      document.getElementById('xpmtitle').textContent='游戏';
      document.getElementById('xpmico').src='icons/largeicons/Games.png';
      var body=document.getElementById('xpmbody');
      body.innerHTML=
        '<div class="game-pick">'+
          '<div class="game-card" data-game="games/minecraft/index.html">'+
            '<div class="cover"><img src="icons/largeicons/MC.png" alt=""></div>'+
            '<div class="gname">Minecraft</div>'+
          '</div>'+
        '</div>';
      modal.classList.remove('game');
      modal.classList.add('open'); mask.classList.add('open');
      body.querySelectorAll('.game-card').forEach(function(card){
        card.addEventListener('click',function(){
          var src=card.getAttribute('data-game');
          if(window.Achievements && /minecraft/i.test(src)) window.Achievements.unlock('block-breaker');
          body.innerHTML='<button class="game-back">← 返回选择</button>'+
                         '<iframe class="game-frame" src="'+src+'" allow="autoplay; fullscreen; gamepad; pointer-lock" allowfullscreen></iframe>';
          modal.classList.add('game');
          body.querySelector('.game-back').addEventListener('click',function(){ a.click(); });
        });
      });
      return;
    }

    var href=a.getAttribute('href')||'';
    if(/^https?:/i.test(href)) return;
    var base=href.split('/').pop();
    if(MODAL.indexOf(base)>=0){
      e.preventDefault();
      var ico=a.querySelector('img');
      openModal(href, a.textContent.trim()||base, ico?ico.getAttribute('src'):null);
    }
  });

  /* 直达子页面→跳主页后，读取 ?open= 自动弹窗 */
  var TITLES={ 'logs.html':'来电归档','operator_notes.html':'接线员手记','specimen_room.html':'标本室',
    'museum.html':'博物馆','about.html':'关于本站','vending_machine.html':'5-羟色胺自动贩售机',
    'portfolio.html':'作品集','news.html':'媒体 · 新闻','corrupted_archive.html':'损坏档案',
    'call-0417.html':'call-0417','call-0603.html':'call-0603','call-0912.html':'call-0912','call-2258.html':'call-2258',
    'hotline.html':'+86自杀援助热线接线中心' };
  (function(){
    var m=/[?&]open=([^&]+)/.exec(location.search); if(!m) return;
    var f=decodeURIComponent(m[1]);
    if(MODAL.indexOf(f)>=0){ setTimeout(function(){ openModal(f, TITLES[f]||f, 'icons/largeicons/file.png'); }, 300); }
  })();
})();

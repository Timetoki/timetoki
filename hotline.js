/* 电话机：拨通后才能投递。弹窗会剥掉页面内联脚本，所以逻辑放这里，
   由 hotline.html 和 xpwin.js 共用 window.bindHotline。 */
(function(){
  function bindHotline(scope){
    var dial=scope.querySelector('#hlDial'); if(!dial || dial.dataset.bound) return;
    dial.dataset.bound='1';
    var screen=scope.querySelector('#hlScreen');
    var listen=scope.querySelector('#hlListen');
    var input=scope.querySelector('#hlDropInput');
    var dropBtn=scope.querySelector('#hlDropBtn');
    var audioCtx=null, listenTimer=null, busy=false, canDrop=false;

    function setCanDrop(on){
      canDrop=!!on;
      if(input){
        input.disabled=!canDrop;
        if(!canDrop){ input.blur(); input.value=''; }
      }
      if(dropBtn) dropBtn.disabled=!canDrop;
    }
    setCanDrop(false);

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
      if(!canDrop) return;
      var v=(input.value||'').trim();
      if(!v) return;
      setCanDrop(false);
      stopListenPulse();
      var firstFeed=false;
      try{ firstFeed=!localStorage.getItem('hotline_first_pain_done'); }catch(e){ firstFeed=true; }
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
      if(firstFeed){
        try{ localStorage.setItem('hotline_first_pain_done','1'); }catch(e){}
        if(window.Achievements) window.Achievements.unlock('thanks-for-feeding');
        if(window.TimeChat && window.TimeChat.afterFirstPain) window.TimeChat.afterFirstPain();
      }
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
      setCanDrop(false);
      stopListenPulse();
      screen.classList.remove('dim');
      screen.innerHTML='<p class="hl-idle">拨号中……</p>';
      dialTone();
      setTimeout(dialTone, 700);
      setTimeout(function(){
        screen.innerHTML='';
        typeLine('您好，这里是+86自杀援助热线。', function(){
          setCanDrop(true);
          input.focus();
          startListenPulse();
        });
      },1450);
    });

    dropBtn.addEventListener('click', submitPain);
    input.addEventListener('keydown', function(e){ if(e.key==='Enter') submitPain(); });
  }
  window.bindHotline = bindHotline;
})();

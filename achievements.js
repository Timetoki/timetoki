/* 成就引擎：解锁记录存 localStorage + 右上角 steam 式弹窗 + 博物馆展墙渲染。
   触发点只管调用这三个方法，不用管存储和展示：
     Achievements.unlock(id)                 —— 直接解锁一次性成就
     Achievements.bump(counterKey, n, id)     —— 计数满 n 次自动解锁
     Achievements.visit(tag, [tag,...], id)   —— 集齐这一组 tag 才解锁
   页面里放一个 <div id="achv-grid"></div>（可选再加 id="achv-progress"），
   本文件加载后会自动找到它并渲染成就墙，未解锁的显示"？？？"+灰滤镜。 */
(function(){
  var LIST = window.ACHIEVEMENTS || [];
  var BYID = {};
  LIST.forEach(function(a){ BYID[a.id] = a; });

  var UKEY='achv_unlocked', CKEY='achv_counters', VKEY='achv_visited';
  function loadJSON(k){ try{ return JSON.parse(localStorage.getItem(k)||'{}'); }catch(e){ return {}; } }
  function saveJSON(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }

  var unlocked = loadJSON(UKEY);
  var counters = loadJSON(CKEY);
  var visited  = loadJSON(VKEY);

  /* ---------- 右上角弹窗队列 ---------- */
  var queue=[], showing=false;
  function host(){
    var h=document.querySelector('.achv-toast-host');
    if(!h){ h=document.createElement('div'); h.className='achv-toast-host'; document.body.appendChild(h); }
    return h;
  }
  function playNext(){
    if(showing || !queue.length) return;
    showing=true;
    var a=queue.shift();
    var box=document.createElement('div'); box.className='achv-toast';
    box.innerHTML=
      '<img class="achv-toast-ico" src="'+a.icon+'" alt="" onerror="this.style.visibility=\'hidden\'">'+
      '<div class="achv-toast-body">'+
        '<div class="achv-toast-head">达成成就</div>'+
        '<div class="achv-toast-name">'+a.name+'</div>'+
        '<div class="achv-toast-desc">'+a.desc+'</div>'+
      '</div>';
    host().appendChild(box);
    requestAnimationFrame(function(){ box.classList.add('show'); });
    setTimeout(function(){
      box.classList.remove('show'); box.classList.add('hide');
      setTimeout(function(){ box.remove(); showing=false; playNext(); }, 400);
    }, 3800);
  }

  /* ---------- 博物馆展墙 ---------- */
  function renderGrid(){
    var got=0;
    LIST.forEach(function(a){ if(unlocked[a.id]) got++; });
    var prog=document.getElementById('achv-progress');
    if(prog) prog.textContent='已解锁 '+got+' / '+LIST.length;
    var grid=document.getElementById('achv-grid');
    if(!grid) return;
    grid.innerHTML = LIST.map(function(a){
      var on = !!unlocked[a.id];
      return '<div class="achv-item'+(on?'':' locked')+'">'+
        '<img src="'+a.icon+'" alt="" onerror="this.style.visibility=\'hidden\'">'+
        '<div class="an">'+(on?a.name:'？？？')+'</div>'+
        '<div class="ad">'+(on?a.desc:'？？？')+'</div>'+
      '</div>';
    }).join('');
  }

  /* ---------- 对外接口 ---------- */
  function unlock(id){
    var a=BYID[id];
    if(!a || unlocked[id]) return;
    unlocked[id]=Date.now();
    saveJSON(UKEY, unlocked);
    queue.push(a); playNext();
    renderGrid();
    checkCompletionist();
  }
  /* 元成就：其余成就全部解锁后自动解锁 */
  function checkCompletionist(){
    if(!BYID['completionist'] || unlocked['completionist']) return;
    for(var i=0;i<LIST.length;i++){
      if(LIST[i].id==='completionist') continue;
      if(!unlocked[LIST[i].id]) return;
    }
    unlock('completionist');
  }
  function bump(key, threshold, id){
    if(unlocked[id]) return;
    counters[key]=(counters[key]||0)+1;
    saveJSON(CKEY, counters);
    if(counters[key] >= threshold) unlock(id);
  }
  function visit(tag, need, id){
    if(unlocked[id]) return;
    visited[tag]=1; saveJSON(VKEY, visited);
    for(var j=0;j<need.length;j++){ if(!visited[need[j]]) return; }
    unlock(id);
  }
  function isUnlocked(id){ return !!unlocked[id]; }

  window.Achievements = { unlock:unlock, bump:bump, visit:visit, isUnlocked:isUnlocked, render:renderGrid };
  renderGrid();
})();

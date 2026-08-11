/* 复习笔记 · 全站交互
   - 深色模式 / 主题风格切换(6 套)
   - 侧栏: 桌面 常驻↔隐藏(记忆); 触屏/窄屏 抽屉(无悬停展开、无自动收起)
   - 目录筛选 / 滚动定位 / 阅读进度条 / 回到顶部
   - 展开全部 / 代码复制 / 表格包裹 / 标题锚点 / 打印展开
   - 已读标记 / 最近学习 / 首页搜索(板块 + 章节直达) / 学科 Tab / 键盘翻页 */
(function () {
  /* file:// 下 pathname 是百分号编码, 解码后才能和导航 href 比较 */
  var PAGE = location.pathname.split('/').pop() || '';
  try { PAGE = decodeURIComponent(PAGE); } catch (e) {}
  var root = document.documentElement;
  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function loadJSON(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  /* Chromium 引擎失效计算对 link 样式表里 [data-style]/[data-theme] 属性选择器
     前缀的 ::before/::after 规则不自动重算(JS 动态设属性后伪元素不刷新, 2026-08-10
     纸墨主题实测: content 停在 normal)。强制一次样式重算(加/删 class + reflow)。 */
  function forceRecalc() {
    root.classList.add('x-frc');
    void root.offsetWidth;
    root.classList.remove('x-frc');
  }

  /* ---------- 深色模式 ---------- */
  var themeBtn = document.getElementById('themeBtn');
  var ICO_MOON = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13.4 9.7A5.6 5.6 0 1 1 6.3 2.6a4.5 4.5 0 0 0 7.1 7.1z"/></svg>';
  var ICO_SUN = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="8" cy="8" r="3.1"/><path d="M8 1.7v1.7M8 12.6v1.7M1.7 8h1.7M12.6 8h1.7M3.5 3.5l1.2 1.2M11.3 11.3l1.2 1.2M12.5 3.5l-1.2 1.2M4.7 11.3l-1.2 1.2"/></svg>';
  function themeIcon() {
    if (themeBtn) themeBtn.innerHTML = root.getAttribute('data-theme') === 'dark' ? ICO_SUN : ICO_MOON;
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var cur = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', cur);
      store('xnTheme', cur);
      themeIcon();
      forceRecalc();
    });
  }
  themeIcon();
  /* 首载: head 内联预设已从 localStorage 设好 data-style/theme, 同样触发一次重算
     (否则 paper 等带伪元素规则的主题首屏不生效)。
     defer 脚本执行时样式表可能尚未加载完, 重算须在 load 后补一次 */
  forceRecalc();
  if (document.readyState === 'complete') {
    forceRecalc();
  } else {
    window.addEventListener('load', function () { forceRecalc(); });
  }

  /* ---------- 主题风格切换 ---------- */
  var STYLES = [
    ['minimal', '极简 · 默认'],
    ['material', 'Material'],
    ['apple', 'Apple'],
    ['neumorphism', '新拟物'],
    ['swiss', '瑞士网格'],
    ['paper', '纸墨']
  ];
  var styleBtn = document.getElementById('styleBtn');
  if (styleBtn) {
    var menu = document.createElement('div');
    menu.id = 'styleMenu';
    menu.setAttribute('role', 'menu');
    menu.innerHTML = '<div class="sm-t">界面风格</div>';
    function curStyle() { return root.getAttribute('data-style') || 'minimal'; }
    function refreshMenu() {
      var bs = menu.querySelectorAll('button[data-style]');
      for (var i = 0; i < bs.length; i++) bs[i].classList.toggle('on', bs[i].getAttribute('data-style') === curStyle());
    }
    for (var si = 0; si < STYLES.length; si++) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('data-style', STYLES[si][0]);
      b.textContent = STYLES[si][1];
      (function (name) {
        b.addEventListener('click', function () {
          root.setAttribute('data-style', name);
          store('xnStyle', name);
          refreshMenu();
          menu.classList.remove('open');
          forceRecalc();
        });
      })(STYLES[si][0]);
      menu.appendChild(b);
    }
    document.body.appendChild(menu);
    styleBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      menu.classList.toggle('open');
      refreshMenu();
    });
    document.addEventListener('click', function (e) {
      if (!menu.contains(e.target)) menu.classList.remove('open');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') menu.classList.remove('open');
    });
    refreshMenu();
  }

  /* ---------- 折叠状态跨页记忆(组/板块折叠块) ---------- */
  var NAV_KEY = 'xnNav_' + PAGE;
  var saved = loadJSON(NAV_KEY) || {};
  var grps = document.querySelectorAll('nav details.grp[data-k], nav details.brd[data-k]');
  for (var i = 0; i < grps.length; i++) {
    var k = grps[i].getAttribute('data-k');
    if (Object.prototype.hasOwnProperty.call(saved, k)) grps[i].open = !!saved[k];
  }
  var nav = document.querySelector('.layout > nav') || document.querySelector('nav');
  if (nav) {
    nav.addEventListener('toggle', function (e) {
      var d = e.target;
      if (!d || !d.hasAttribute || !d.hasAttribute('data-k')) return;
      var s = loadJSON(NAV_KEY) || {};
      s[d.getAttribute('data-k')] = d.open;
      store(NAV_KEY, JSON.stringify(s));
    }, true); /* toggle 不冒泡, 必须 capture */
  }

  /* ---------- 侧栏: 桌面常驻↔隐藏 / 触屏抽屉 ----------
     无悬停展开、无自动收起计时 —— 一切显式切换, 平板上不会再"还没点就缩回去" */
  function isMobileLayout() {
    return (window.matchMedia && window.matchMedia('(hover: none)').matches) ||
           (window.matchMedia && window.matchMedia('(max-width: 920px)').matches);
  }
  var navbtn = document.getElementById('navbtn');
  function applyNavInitial() {
    if (isMobileLayout()) {
      if (root.getAttribute('data-nav') !== 'open') root.setAttribute('data-nav', 'hidden');
    } else {
      root.setAttribute('data-nav', load('xnNavDock') === '0' ? 'hidden' : 'docked');
    }
  }
  applyNavInitial();
  if (window.matchMedia) {
    var mq = window.matchMedia('(max-width: 920px), (hover: none)');
    (mq.addEventListener ? mq.addEventListener.bind(mq, 'change') : mq.addListener.bind(mq))(applyNavInitial);
  }
  if (navbtn) {
    navbtn.addEventListener('click', function () {
      if (isMobileLayout()) {
        root.setAttribute('data-nav', root.getAttribute('data-nav') === 'open' ? 'hidden' : 'open');
      } else {
        var docked = root.getAttribute('data-nav') !== 'hidden';
        root.setAttribute('data-nav', docked ? 'hidden' : 'docked');
        store('xnNavDock', docked ? '0' : '1');
      }
    });
  }
  var navclose = document.getElementById('navclose');
  if (navclose) {
    navclose.addEventListener('click', function () {
      root.setAttribute('data-nav', 'hidden');
      if (!isMobileLayout()) store('xnNavDock', '0');
    });
  }
  var scrim = document.getElementById('navscrim');
  if (scrim) scrim.addEventListener('click', function () { root.setAttribute('data-nav', 'hidden'); });
  if (nav) {
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a') && isMobileLayout()) root.setAttribute('data-nav', 'hidden');
    });
  }

  /* ---------- 目录筛选 ---------- */
  var navq = document.getElementById('navq');
  if (navq && nav) {
    var navLinks = nav.querySelectorAll('a[href]');
    var navGrps = nav.querySelectorAll('details.grp');
    var navBrds = nav.querySelectorAll('details.brd');
    var navSecs = nav.querySelectorAll('.sec');
    navq.addEventListener('input', function () {
      var t = navq.value.trim().toLowerCase();
      for (var i2 = 0; i2 < navLinks.length; i2++) {
        var a = navLinks[i2];
        var hit = !t || (a.textContent.toLowerCase().indexOf(t) >= 0) ||
                  ((a.getAttribute('href') || '').toLowerCase().indexOf(t) >= 0);
        a.style.display = hit ? '' : 'none';
      }
      for (var j = 0; j < navGrps.length; j++) {
        var g = navGrps[j], gLinks = g.querySelectorAll('a[href]'), gVis = false;
        for (var m = 0; m < gLinks.length; m++) { if (gLinks[m].style.display !== 'none') { gVis = true; break; } }
        g.style.display = gVis ? '' : 'none';
        if (t && gVis) g.open = true;
      }
      for (var k2 = 0; k2 < navBrds.length; k2++) {
        var bd = navBrds[k2], bdLinks = bd.querySelectorAll('a[href]'), bdVis = false;
        for (var n2 = 0; n2 < bdLinks.length; n2++) { if (bdLinks[n2].style.display !== 'none') { bdVis = true; break; } }
        bd.style.display = bdVis ? '' : 'none';
        if (t && bdVis) bd.open = true;
      }
      for (var s = 0; s < navSecs.length; s++) {
        var sec = navSecs[s], el = sec.nextElementSibling, secVis = false;
        while (el && !(el.classList && el.classList.contains('sec'))) {
          var sLinks = el.querySelectorAll ? el.querySelectorAll('a[href]') : [];
          for (var q2 = 0; q2 < sLinks.length; q2++) {
            if (sLinks[q2].style.display !== 'none') { secVis = true; break; }
          }
          if (secVis) break;
          el = el.nextElementSibling;
        }
        sec.style.display = secVis ? '' : 'none';
      }
    });
  }

  /* ---------- 滚动定位(scrollspy) ---------- */
  var spyAnchors = [];
  if (nav) {
    var spyLinks = nav.querySelectorAll('a.c, a.d');
    for (var i3 = 0; i3 < spyLinks.length; i3++) {
      var h = spyLinks[i3].getAttribute('href') || '';
      var pp = h.split('#');
      if (pp.length < 2 || !pp[1]) continue;
      if (pp[0] && pp[0] !== PAGE) continue;
      spyAnchors.push({ el: spyLinks[i3], id: pp[1] });
    }
  }
  var spyHeads = [], spyMap = {};
  for (var j2 = 0; j2 < spyAnchors.length; j2++) {
    var hd = document.getElementById(spyAnchors[j2].id);
    if (hd && /^H[1-4]$/.test(hd.tagName)) { spyHeads.push(hd); spyMap[hd.id] = spyAnchors[j2].el; }
  }
  var lastSpy = null;
  function spyUpdate() {
    var pos = window.scrollY + 170, cur = null;
    for (var i4 = 0; i4 < spyHeads.length; i4++) {
      var r = spyHeads[i4].getBoundingClientRect();
      if (r.top + window.scrollY <= pos) cur = spyHeads[i4];
    }
    var id = cur ? cur.id : '';
    if (id !== lastSpy) {
      if (lastSpy && spyMap[lastSpy]) spyMap[lastSpy].classList.remove('on');
      lastSpy = id;
      if (id && spyMap[id]) spyMap[id].classList.add('on');
    }
  }
  if (spyHeads.length) { window.addEventListener('scroll', spyUpdate, { passive: true }); spyUpdate(); }

  /* ---------- 回到顶部 / 打印 ---------- */
  var topbtn = document.getElementById('topbtn');
  if (topbtn) {
    window.addEventListener('scroll', function () { topbtn.classList.toggle('show', window.scrollY > 500); }, { passive: true });
    topbtn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }
  var printBtn = document.getElementById('printBtn');
  if (printBtn) printBtn.addEventListener('click', function () { window.print(); });

  /* ---------- 展开 / 收起全部 ---------- */
  var exp = document.getElementById('expandBtn');
  if (exp) {
    var mainDetails = document.querySelectorAll('main details');
    if (!mainDetails.length) { exp.style.display = 'none'; }
    else {
      exp.hidden = false;
      function detailsState() { var o = 0; for (var i5 = 0; i5 < mainDetails.length; i5++) if (mainDetails[i5].open) o++; return o; }
      function expRefresh() { exp.textContent = (mainDetails.length === detailsState()) ? '收起全部' : '展开全部'; }
      exp.addEventListener('click', function () {
        var all = mainDetails.length === detailsState();
        for (var i6 = 0; i6 < mainDetails.length; i6++) mainDetails[i6].open = !all;
        expRefresh();
      });
      expRefresh();
    }
  }

  /* ---------- 代码复制 ---------- */
  var pres = document.querySelectorAll('main pre');
  for (var i7 = 0; i7 < pres.length; i7++) {
    (function (pre) {
      var cb = document.createElement('button');
      cb.className = 'copy-btn'; cb.type = 'button'; cb.textContent = '复制';
      cb.setAttribute('aria-label', '复制代码');
      pre.appendChild(cb);
      cb.addEventListener('click', function () {
        var codeEl = pre.querySelector('code');
        var txt = codeEl ? codeEl.innerText : pre.innerText;
        function done() { cb.textContent = '已复制'; setTimeout(function () { cb.textContent = '复制'; }, 1600); }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(txt).then(done, function () { done(); });
        } else { done(); }
      });
    })(pres[i7]);
  }

  /* ---------- 表格横向滚动包裹 ---------- */
  var tables = document.querySelectorAll('main table');
  for (var iT = 0; iT < tables.length; iT++) {
    var tw = document.createElement('div');
    tw.className = 'table-wrap';
    tables[iT].parentNode.insertBefore(tw, tables[iT]);
    tw.appendChild(tables[iT]);
  }

  /* ---------- 标题锚点链接 ---------- */
  var heads2 = document.querySelectorAll('main h2[id], main h3[id]');
  for (var i8 = 0; i8 < heads2.length; i8++) {
    if (heads2[i8].querySelector('.anc')) continue;
    var anc = document.createElement('a');
    anc.className = 'anc'; anc.href = '#' + heads2[i8].id; anc.textContent = '¶';
    anc.setAttribute('aria-label', '链接到本小节');
    heads2[i8].appendChild(anc);
  }

  /* ---------- 打印时展开全部 ---------- */
  var prevOpen = [];
  window.addEventListener('beforeprint', function () {
    var ds = document.querySelectorAll('main details');
    prevOpen = [];
    for (var i9 = 0; i9 < ds.length; i9++) { prevOpen.push(ds[i9].open); ds[i9].open = true; }
  });
  window.addEventListener('afterprint', function () {
    var ds = document.querySelectorAll('main details');
    for (var iA = 0; iA < ds.length && iA < prevOpen.length; iA++) ds[iA].open = prevOpen[iA];
  });

  /* ---------- 已读标记 + 最近学习 ---------- */
  var VKEY = 'xnVisited';
  var visited = loadJSON(VKEY) || [];
  function remember(f) {
    if (f && visited.indexOf(f) < 0) {
      visited.push(f);
      if (visited.length > 80) visited = visited.slice(-80);
      store(VKEY, JSON.stringify(visited));
    }
  }
  if (PAGE) remember(PAGE);
  var markLinks = document.querySelectorAll('.board-card a.bc-main[href$=".html"], .board-card .bc-ex a[href$=".html"], nav a[href$=".html"]');
  for (var iB = 0; iB < markLinks.length; iB++) {
    var fB = (markLinks[iB].getAttribute('href') || '').split('/').pop();
    if (visited.indexOf(fB) >= 0) (markLinks[iB].closest('.board-card') || markLinks[iB]).classList.add('vis');
  }
  var recentSec = document.getElementById('recent');
  var recentBox = document.getElementById('recentCards');
  if (recentSec && recentBox) {
    var cardMap = {}, cardsAll = document.querySelectorAll('.board-card a.bc-main[href$=".html"]');
    for (var iC = 0; iC < cardsAll.length; iC++) {
      var fC = (cardsAll[iC].getAttribute('href') || '').split('/').pop();
      if (!cardMap[fC]) cardMap[fC] = cardsAll[iC].closest('.board-card') || cardsAll[iC];
    }
    var shown = {}, frag = document.createDocumentFragment(), added = 0;
    for (var iD = visited.length - 1; iD >= 0 && added < 8; iD--) {
      var fD = visited[iD];
      if (fD === PAGE || shown[fD] || !cardMap[fD]) continue;
      shown[fD] = 1; added++;
      var clone = cardMap[fD].cloneNode(true);
      clone.classList.add('vis');
      frag.appendChild(clone);
    }
    if (added) { recentSec.hidden = false; recentBox.appendChild(frag); }
  }

  /* ---------- 首页: 搜索(板块 + 章节直达) + 学科 Tab ---------- */
  var homeq = document.getElementById('homeq');
  var hometabs = document.getElementById('hometabs');
  var homeHits = document.getElementById('homeHits');
  var homeTab = 'all';
  function renderHits(t) {
    if (!homeHits) return;
    homeHits.innerHTML = '';
    if (!t || typeof XN_INDEX === 'undefined') return;
    var count = 0, frag = document.createDocumentFragment();
    for (var iH = 0; iH < XN_INDEX.length && count < 12; iH++) {
      var p = XN_INDEX[iH];
      if (homeTab !== 'all' && p.s !== homeTab) continue;
      var heads = p.h || [];
      for (var jH = 0; jH < heads.length && count < 12; jH++) {
        if (heads[jH][0].toLowerCase().indexOf(t) < 0) continue;
        var a = document.createElement('a');
        a.href = 'html/' + p.f + '#' + encodeURIComponent(heads[jH][1]);
        var s1 = document.createElement('span'); s1.className = 'hh-s'; s1.textContent = p.sn || p.s;
        var s2 = document.createElement('span'); s2.className = 'hh-b'; s2.textContent = p.b;
        var s3 = document.createElement('span'); s3.className = 'hh-h'; s3.textContent = heads[jH][0];
        a.appendChild(s1); a.appendChild(s2); a.appendChild(s3);
        frag.appendChild(a);
        count++;
      }
    }
    if (count) homeHits.appendChild(frag);
  }
  function homeFilter() {
    if (!homeq) return;
    var t = homeq.value.trim().toLowerCase();
    var cards = document.querySelectorAll('.board-card');
    var secs2 = document.querySelectorAll('section[data-subj]');
    var grpHs = document.querySelectorAll('.grp-h');
    for (var iE = 0; iE < cards.length; iE++) {
      cards[iE].style.display = (!t || cards[iE].textContent.toLowerCase().indexOf(t) >= 0) ? '' : 'none';
    }
    for (var iF = 0; iF < secs2.length; iF++) {
      var sec = secs2[iF], cardList = sec.querySelectorAll('.board-card'), vis = false;
      for (var iG = 0; iG < cardList.length; iG++) { if (cardList[iG].style.display !== 'none') { vis = true; break; } }
      sec.style.display = ((homeTab === 'all' || sec.dataset.subj === homeTab) && vis) ? '' : 'none';
    }
    for (var iHH = 0; iHH < grpHs.length; iHH++) {
      var grp = grpHs[iHH], next = grp.nextElementSibling, vis2 = false;
      if (next && next.classList && next.classList.contains('cards')) {
        var c2 = next.querySelectorAll('.board-card');
        for (var iI = 0; iI < c2.length; iI++) { if (c2[iI].style.display !== 'none') { vis2 = true; break; } }
      }
      grp.style.display = vis2 ? '' : 'none';
    }
    var recentSec2 = document.getElementById('recent');
    if (recentSec2) {
      var rCards = recentSec2.querySelectorAll('.board-card'), rVis = false;
      for (var iJ = 0; iJ < rCards.length; iJ++) { if (rCards[iJ].style.display !== 'none') { rVis = true; break; } }
      recentSec2.style.display = (t && !rVis) ? 'none' : '';
    }
    renderHits(t);
  }
  if (homeq) {
    homeq.addEventListener('input', homeFilter);
    homeq.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && homeHits && homeHits.firstChild && homeHits.firstChild.href) {
        location.href = homeHits.firstChild.href;
      }
    });
  }
  if (hometabs) {
    hometabs.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-tab]');
      if (!btn) return;
      homeTab = btn.getAttribute('data-tab');
      var bs = hometabs.querySelectorAll('button[data-tab]');
      for (var iK = 0; iK < bs.length; iK++) bs[iK].classList.toggle('on', bs[iK] === btn);
      homeFilter();
    });
  }

  /* ---------- 键盘: / 聚焦搜索, [ ] 翻页, Alt+←→ 翻页 ---------- */
  function go(sel) { var a = document.querySelector(sel); if (a) a.click(); }
  document.addEventListener('keydown', function (e) {
    if (e.altKey && e.key === 'ArrowLeft') { go('.pager a.prev'); }
    else if (e.altKey && e.key === 'ArrowRight') { go('.pager a.next'); }
    else if (!e.altKey && !e.ctrlKey && !e.metaKey) {
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (e.key === '/' && homeq) { e.preventDefault(); homeq.focus(); }
      else if (e.key === '[') go('.pager a.prev');
      else if (e.key === ']') go('.pager a.next');
    }
  });
})();

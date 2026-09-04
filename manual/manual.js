/*
  使い方ページの動き。**サーバーは使わない。**

  やることは3つだけ。
   1. 本文の見出しから目次を組み立てる（手で書くと必ず本文とずれる）
   2. いま読んでいるところを目次で光らせ、その章だけ開く
   3. ページの中を絞り込む検索

  検索は「見出しと本文」を対象にする。当たった節だけを残し、
  当たらなかった節は隠す——**別のページへ飛ばさない**のがこのページの作法。
*/
(function () {
  'use strict';

  var main = document.getElementById('main');
  var nav = document.getElementById('nav');
  var q = document.getElementById('q');
  var qhit = document.getElementById('qhit');
  if (!main || !nav) return;

  // ---- 1. 目次を組み立てる ----------------------------------------------
  // h2 を章、h3 を節として扱う。id が無ければ見出しの文から作る。
  var used = {};
  function slugify(text, i) {
    var s = text.trim().toLowerCase()
      .replace(/[（）()「」【】・/,、。：:]/g, '')
      .replace(/\s+/g, '-');
    if (!s || used[s]) s = (s || 'h') + '-' + i;
    used[s] = true;
    return s;
  }

  var heads = main.querySelectorAll('h2, h3');
  var items = [];           // {el, level, id, text, li}
  Array.prototype.forEach.call(heads, function (h, i) {
    // 逆引きの小見出し（聴く・曲・人…）は目次に載せない。
    // あれはカードの束の仕切りで、読み進める先ではない。
    if (h.closest && h.closest('.qa-group')) return;
    if (!h.id) h.id = slugify(h.textContent, i);
    items.push({ el: h, level: h.tagName === 'H2' ? 1 : 2, id: h.id, text: h.textContent.trim() });
  });

  var rootUl = document.createElement('ul');
  var currentLi = null, currentSubUl = null;
  items.forEach(function (it) {
    var li = document.createElement('li');
    var a = document.createElement('a');
    a.href = '#' + it.id;
    // 見出しの中の「プレミアム」などの札は目次に出さない
    a.textContent = it.text.replace(/\s*(プレミアム|スタンダード以上)\s*$/, '');
    li.appendChild(a);
    it.li = li;
    if (it.level === 1) {
      li.className = 'lv1';
      currentSubUl = document.createElement('ul');
      li.appendChild(currentSubUl);
      rootUl.appendChild(li);
      currentLi = li;
    } else {
      li.className = 'lv2';
      (currentSubUl || rootUl).appendChild(li);
    }
  });
  nav.appendChild(rootUl);

  // ---- 2. いま読んでいるところ ------------------------------------------
  function markHere(id) {
    Array.prototype.forEach.call(nav.querySelectorAll('a'), function (a) {
      a.classList.remove('here');
    });
    Array.prototype.forEach.call(nav.querySelectorAll('.lv1'), function (li) {
      li.classList.remove('open');
    });
    var a = nav.querySelector('a[href="#' + id + '"]');
    if (!a) return;
    a.classList.add('here');
    var li = a.parentNode;
    // 節なら、その節が属する章を開く
    var chapter = li.classList.contains('lv1') ? li : li.parentNode.parentNode;
    if (chapter && chapter.classList) chapter.classList.add('open');
  }

  var spy = null;
  if ('IntersectionObserver' in window) {
    var visible = {};
    spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting; });
      // いちばん上にある「見えている見出し」を現在地とする
      for (var i = 0; i < items.length; i++) {
        if (visible[items[i].id]) { markHere(items[i].id); return; }
      }
    }, { rootMargin: '-64px 0px -70% 0px' });
    items.forEach(function (it) { spy.observe(it.el); });
  }
  // 直接リンクで来たときも合わせる
  if (location.hash) markHere(location.hash.slice(1));
  nav.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (a) markHere(a.getAttribute('href').slice(1));
  });

  // ---- 3. 検索 -----------------------------------------------------------
  // 節（h3 とその次の見出しまで）をひとかたまりとして扱う。
  // かたまりは HTML の構造ではなく見出しの並びで決まるので、
  // 「この見出しから次の見出しまで」を配列で持っておく。
  var blocks = [];
  items.forEach(function (it, i) {
    var nodes = [];
    var n = it.el.nextSibling;
    while (n) {
      if (n.nodeType === 1 && /^H[123]$/.test(n.tagName)) break;
      nodes.push(n);
      n = n.nextSibling;
    }
    blocks.push({ it: it, nodes: nodes, text: (it.text + ' ' + nodes.map(function (x) {
      return x.textContent || '';
    }).join(' ')).toLowerCase() });
  });

  function show(node, on) {
    if (node.nodeType !== 1) return;
    node.classList.toggle('hidden-by-search', !on);
  }

  function runSearch(raw) {
    var term = raw.trim().toLowerCase();
    var searching = term.length > 0;
    main.classList.toggle('searching', searching);

    if (!searching) {
      blocks.forEach(function (b) {
        show(b.it.el, true);
        b.nodes.forEach(function (n) { show(n, true); });
      });
      Array.prototype.forEach.call(nav.querySelectorAll('li'), function (li) {
        li.classList.remove('hidden-by-search');
      });
      Array.prototype.forEach.call(main.querySelectorAll('.qa'), function (d) {
        d.classList.remove('hidden-by-search');
      });
      qhit.hidden = true;
      return;
    }

    var hits = 0;
    // 章（h2）は、その下の節が1つでも当たれば残す
    var chapterHit = {};
    blocks.forEach(function (b) {
      var hit = b.text.indexOf(term) >= 0;
      if (b.it.level === 2 && hit) hits++;
      b.hit = hit;
    });
    // 章に属する節が当たったか
    var chapter = null;
    blocks.forEach(function (b) {
      if (b.it.level === 1) { chapter = b; chapterHit[b.it.id] = b.hit; }
      else if (b.hit && chapter) chapterHit[chapter.it.id] = true;
    });

    chapter = null;
    blocks.forEach(function (b) {
      var on;
      if (b.it.level === 1) { chapter = b; on = !!chapterHit[b.it.id]; }
      else on = b.hit;
      show(b.it.el, on);
      b.nodes.forEach(function (n) { show(n, on); });
      if (b.it.li) b.it.li.classList.toggle('hidden-by-search', !on);
    });

    // 逆引きのカードも、当たったものだけ残す
    Array.prototype.forEach.call(main.querySelectorAll('.qa'), function (d) {
      var on = d.textContent.toLowerCase().indexOf(term) >= 0;
      d.classList.toggle('hidden-by-search', !on);
      if (on) hits++;
    });

    qhit.hidden = false;
    qhit.textContent = hits > 0 ? hits + ' 件が見つかりました' : '見つかりませんでした';
  }

  if (q) {
    q.addEventListener('input', function () { runSearch(q.value); });
    // Esc で戻す
    q.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { q.value = ''; runSearch(''); }
    });
  }

  // ---- 狭い画面の目次の開け閉め ------------------------------------------
  var toggle = document.getElementById('sideToggle');
  var side = document.getElementById('side');
  if (toggle && side) {
    toggle.addEventListener('click', function () {
      var open = side.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // 目次から飛んだら閉じる（狭い画面では開いたままだと本文が見えない）
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A' && window.matchMedia('(max-width:820px)').matches) {
        side.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ---- 動画 --------------------------------------------------------------
  // autoplay が効かない端末でも、押せば動くようにしておく。
  Array.prototype.forEach.call(document.querySelectorAll('video.demo'), function (v) {
    v.addEventListener('click', function () {
      if (v.paused) v.play(); else v.pause();
    });
  });
})();

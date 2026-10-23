/* Snapshot storage shares the game state in app.js; game rules stay client-side. */
(() => {
  const tokenKey = 'qinghe-save-token-v1';
  const base = '/api/saves';
  let busy = false;
  let rows = [];
  const escape = value => String(value).replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function token() {
    let value = localStorage.getItem(tokenKey);
    if (!/^[0-9a-f]{64}$/.test(value || '')) {
      value = Array.from(crypto.getRandomValues(new Uint8Array(32)),
        byte => byte.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(tokenKey, value);
    }
    return value;
  }

  async function api(path = '', options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(base + path, {
        ...options, signal: controller.signal, cache: 'no-store',
        headers: {'Content-Type':'application/json', 'X-Save-Token':token()}
      });
      if (!response.ok) {
        if (response.status === 409) throw new Error('存档已被其他页面更改，请刷新列表后重试。');
        if (response.status === 422) throw new Error('进度格式或名称不符合要求，未保存。');
        throw new Error('存档服务暂不可用（' + response.status + '）。当前进度仍在页面中。');
      }
      return response.status === 204 ? null : await response.json();
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('请求超时，请刷新列表确认是否保存成功。');
      if (error instanceof TypeError) throw new Error('连接失败，请检查后端是否正在运行。');
      throw error;
    } finally { clearTimeout(timeout); }
  }

  function draw(message = '') {
    modal('<h2>保存这段时光</h2><p>5 个独立存档槽 · 保存在服务器数据库中。浏览器自动存档独立保留。</p>' +
      '<p class="sub">此浏览器持有存档凭证，清除网站数据后将无法访问这些存档。</p>' +
      '<p id="slot-message" role="status">' + escape(message) + '</p>' +
      Array.from({length:5}, (_, index) => {
        const slot = index + 1, row = rows.find(item => item.slot === slot);
        const occupied = row && !row.empty;
        return '<section class="panel" style="margin:12px 0"><h3>存档 ' + slot + '</h3>' +
          (occupied ? '<p>' + escape(row.name) + ' · 第 ' + row.round + ' 周目 / 第 ' +
            row.week + ' 周' + (row.character_name ? ' · ' + escape(row.character_name) + ' · 距高考 ' + row.days_remaining + ' 天' : '') + '<br>' + escape(new Date(row.updated_at).toLocaleString()) + '</p>' : '<p>空存档槽</p>') +
          '<label class="field">存档名称<input maxlength="60" id="slot-name-' + slot +
            '" value="' + escape(occupied ? row.name : (currentCharacter()?.name || '我的') + ' · 第 ' + state.week + ' 周') + '"></label>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
          '<button class="primary" data-save-slot="' + slot + '">保存</button>' +
          '<button data-load-slot="' + slot + '"' + (occupied ? '' : ' disabled') + '>读取</button>' +
          '<button data-delete-slot="' + slot + '"' + (occupied ? '' : ' disabled') + '>删除</button></div></section>';
      }).join('') + '<button data-refresh-saves>刷新列表</button> <button data-export-save>导出当前进度</button>' +
      '<hr><h3>导入旧进度</h3><p>将旧页面导出的 JSON 文件存入指定槽，再点击读取恢复。</p>' +
      '<label class="field">目标存档槽<select id="import-slot">' +
      [1,2,3,4,5].map(n => '<option>' + n + '</option>').join('') + '</select></label>' +
      '<input type="file" id="import-file" accept=".json,application/json" aria-label="选择旧进度文件">' +
      '<button data-import-save>导入到存档槽</button>');
  }

  async function refresh(message = '') {
    const result = await api();
    rows = result.slots;
    draw(message);
  }

  async function run(task) {
    if (busy) return;
    busy = true;
    try { await task(); }
    catch (error) {
      const el = document.querySelector('#slot-message');
      if (el) el.textContent = error.message;
      toast(error.message);
    } finally { busy = false; }
  }

  document.querySelector('#save').onclick = () => run(async () => {
    persist();
    if (!/^https?:$/.test(location.protocol) || !location.pathname.startsWith('/play/')) {
      modal('<h2>数据库存档</h2><p>请先启动后端，再打开 <a href="http://127.0.0.1:8000/play/characters/">本机游戏页面</a> 使用 5 个存档槽。</p>' +
        '<p>当前页面仍会自动保存到此浏览器。要转移旧进度，可导出后在后端页面导入。</p>' +
        '<button data-export-save>导出当前进度</button>');
      return;
    }
    modal('<h2>正在读取存档列表…</h2><p id="slot-message" role="status"></p><button data-refresh-saves>重试</button>');
    await refresh();
  });
  document.querySelector('#save-header').onclick = document.querySelector('#save').onclick;

  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    if (button.hasAttribute('data-export-save')) {
      const url = URL.createObjectURL(new Blob([JSON.stringify(state)], {type:'application/json'}));
      const link = document.createElement('a');
      link.href = url; link.download = 'qinghe-progress.json'; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return;
    }
    if (button.hasAttribute('data-refresh-saves')) return run(() => refresh());
    if (button.hasAttribute('data-import-save')) return run(async () => {
      const file = document.querySelector('#import-file').files[0];
      if (!file) throw new Error('请选择进度文件。');
      if (file.size > 2000000) throw new Error('进度文件不能超过 2 MB。');
      const slot = Number(document.querySelector('#import-slot').value);
      const row = rows.find(item => item.slot === slot);
      if (row && !row.empty && !confirm('导入会覆盖存档 ' + slot + '，确定继续？')) return;
      let snapshot;
      try { snapshot = JSON.parse(await file.text()); }
      catch { throw new Error('文件不是有效的 JSON 存档。'); }
      await api('/' + slot, {method:'PUT', body:JSON.stringify({
        name:'导入的回忆', expected_revision:row?.revision || 0, state:snapshot
      })});
      await refresh('旧进度已导入存档 ' + slot + '，点击读取即可恢复。');
    });
    const action = ['save', 'load', 'delete'].find(name => button.hasAttribute('data-' + name + '-slot'));
    if (!action) return;
    const slot = Number(button.getAttribute('data-' + action + '-slot'));
    const row = rows.find(item => item.slot === slot);
    run(async () => {
      if (action === 'save') {
        const name = document.querySelector('#slot-name-' + slot).value.trim();
        if (!name) throw new Error('请输入存档名称。');
        if (row && !row.empty && !confirm('覆盖存档 ' + slot + '？原存档内容将被替换。')) return;
        await api('/' + slot, {method:'PUT', body:JSON.stringify({
          name, expected_revision:row?.revision || 0, state
        })});
        await refresh('存档 ' + slot + ' 已保存。');
      } else if (action === 'load') {
        if (!confirm('读取存档 ' + slot + '？当前进度将被替换，请先保存需要保留的进度。')) return;
        const data = await api('/' + slot);
        state = SchoolRules.normalize(data.state);
        closeModal(); render(); persist(); toast('已恢复存档 ' + slot + '。');
      } else {
        if (!confirm('删除存档 ' + slot + '？删除后无法恢复。')) return;
        await api('/' + slot + '?expected_revision=' + row.revision, {method:'DELETE'});
        await refresh('存档 ' + slot + ' 已删除。');
      }
    });
  });
})();

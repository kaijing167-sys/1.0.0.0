(() => {
  const get = id => document.getElementById(id);
  const audio = get('bgm'), toggle = get('music-toggle'), input = get('music-input');
  const status = get('music-status'), player = document.querySelector('.music-player');
  const volume = get('music-volume'), seek = get('music-seek'), mute = get('music-mute');
  const prefKey = 'qinghe-bgm-carefree-v1';
  let prefs = { volume: .35, muted: false, enabled: true }, objectURL, db, ready = false, waiting = false, generation = 0;
  try { const saved = JSON.parse(localStorage.getItem(prefKey)); if (saved) prefs = {...prefs, ...saved}; } catch {}
  audio.volume = Number.isFinite(prefs.volume) ? Math.max(0, Math.min(1, prefs.volume)) : .35;
  audio.muted = !!prefs.muted; audio.loop = true;
  volume.value = Math.round(audio.volume * 100);
  function save() { try { localStorage.setItem(prefKey, JSON.stringify(prefs)); } catch {} }
  function displayVolume() { mute.textContent = audio.muted || audio.volume === 0 ? '静音' : '音量'; mute.setAttribute('aria-pressed', String(audio.muted)); get('music-volume-value').textContent = Math.round(audio.volume * 100) + '%'; }
  function sync() {
    const playing = ready && !audio.paused;
    toggle.textContent = playing ? 'Ⅱ' : '▶'; toggle.setAttribute('aria-label', playing ? '暂停背景音乐' : '播放背景音乐');
    toggle.setAttribute('aria-pressed', String(playing)); player.classList.toggle('is-playing', playing);
    if (ready) status.textContent = playing ? '正在播放 · 单曲循环' : waiting ? '点击页面即可开启音乐' : '已暂停';
  }
  async function play() {
    if (!ready) return;
    try { await audio.play(); waiting = false; sync(); }
    catch (error) { if (error.name === 'NotAllowedError') { waiting = true; sync(); } else if(error.name !== 'AbortError') { waiting = false; status.textContent = '音乐未加载，点播放重试'; } }
  }
  function clock(s) { if (!Number.isFinite(s)) return '0:00'; return Math.floor(s/60) + ':' + String(Math.floor(s%60)).padStart(2,'0'); }
  function progress() { const valid = ready && Number.isFinite(audio.duration) && audio.duration > 0; seek.disabled = !valid; seek.value = valid ? audio.currentTime/audio.duration*1000 : 0; get('music-time').textContent = clock(audio.currentTime) + ' / ' + clock(audio.duration); }
  function mount(blob) {
    ready = false; audio.pause();
    if (objectURL) URL.revokeObjectURL(objectURL);
    objectURL = URL.createObjectURL(blob); audio.src = objectURL; ready = true; waiting = false;
    sync(); if (prefs.enabled) play();
  }
  async function database() {
    if (db) return db;
    db = await new Promise((resolve,reject) => { const req = indexedDB.open('qinghe-music',1); req.onupgradeneeded = () => req.result.createObjectStore('tracks'); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); req.onblocked = () => reject(new Error('Storage blocked')); });
    return db;
  }
  async function readTrack() { const handle = await database(); return new Promise((resolve,reject) => { const req = handle.transaction('tracks').objectStore('tracks').get('carefree'); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); }); }
  async function storeTrack(blob) { const handle = await database(); return new Promise((resolve,reject) => { const tx = handle.transaction('tracks','readwrite'); tx.objectStore('tracks').put(blob,'carefree'); tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error); }); }
  toggle.addEventListener('click', () => {
    if (!ready) {
      if (window.QINGHE_MUSIC?.src) { audio.src = window.QINGHE_MUSIC.src; audio.load(); ready = true; prefs.enabled = true; save(); status.textContent = '正在连接音乐…'; play(); }
      else { status.textContent = '尚未接入歌曲，请先添加音频'; input.click(); }
      return;
    }
    if (audio.paused) { prefs.enabled = true; save(); play(); } else { prefs.enabled = false; waiting = false; save(); audio.pause(); }
  });
  get('music-select').addEventListener('click', () => input.click());
  input.addEventListener('change', async () => {
    const file = input.files[0]; if (!file) return;
    if (file.size > 100*1024*1024) { status.textContent = '请选择小于 100 MB 的音频'; return; }
    generation++; prefs.enabled = true; save(); mount(file);
    player.title = '当前音频：' + file.name;
    try { await storeTrack(file); get('music-select').textContent = '已记住音频 · 更换'; }
    catch { get('music-select').textContent = '本次可播 · 无法保存'; }
    input.value = '';
  });
  volume.addEventListener('input', () => { audio.volume = Number(volume.value)/100; audio.muted = false; prefs.volume = audio.volume; prefs.muted = false; save(); displayVolume(); });
  mute.addEventListener('click', () => { audio.muted = !audio.muted; prefs.muted = audio.muted; save(); displayVolume(); });
  seek.addEventListener('input', () => { if (Number.isFinite(audio.duration)) audio.currentTime = Number(seek.value)/1000*audio.duration; progress(); });
  audio.addEventListener('play',sync); audio.addEventListener('pause',sync);
  audio.addEventListener('timeupdate',progress); audio.addEventListener('loadedmetadata',progress);
  audio.addEventListener('error', () => { ready = false; waiting = false; sync(); progress(); status.textContent = '音乐连接失败，点播放重试'; });
  audio.addEventListener('waiting', () => { if(ready) status.textContent = '音乐缓冲中…'; });
  audio.addEventListener('playing', sync);
  const unlock = e => { if (e.target.closest?.('.music-player')) return; if (waiting && prefs.enabled && ready) play(); };
  document.addEventListener('click',unlock); document.addEventListener('keydown',unlock);
  window.addEventListener('beforeunload', () => { if(objectURL) URL.revokeObjectURL(objectURL); if(db) db.close(); });
  displayVolume(); progress();
  (async () => {
    const attempt = generation;
    status.textContent = '正在载入背景音乐…';
    const bundled = window.QINGHE_MUSIC?.src;
    try { const track = await readTrack(); if(attempt !== generation) return; if(track) { mount(track); get('music-select').textContent = '已记住音频 · 更换'; return; } } catch {}
    if(attempt !== generation) return;
    if (bundled) { audio.src = bundled; ready = true; sync(); if(prefs.enabled) play(); return; }
    status.textContent = '等待接入音乐文件';
  })();
})();

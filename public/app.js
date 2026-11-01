'use strict';

const $ = selector => document.querySelector(selector);
const state = { songs: [], setlists: [], selectedId: null, detail: null, view: 'setlists', busy: false };
let editor, deletion, toastTimer;
const icons = {
  edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5 4 4M4 20l5-1L20 8a2.8 2.8 0 0 0-4-4L5 15l-1 5Z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/></svg>'
};
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function duration(seconds) { return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
function libraryDuration(seconds) {
  return seconds < 3600 ? `${Math.floor(seconds / 60)} min` : `${Math.floor(seconds / 3600)} h ${String(Math.floor(seconds % 3600 / 60)).padStart(2, '0')} min`;
}
function countSongs(count) { return `${count} ${count === 1 ? 'música' : 'músicas'}`; }
function iconButton(action, itemId, label, icon, extra = '') {
  return `<button type="button" class="icon-button ${extra}" data-action="${action}" data-id="${itemId}" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}">${icons[icon] ?? icon}</button>`;
}
async function api(route, method = 'GET', data) {
  let response;
  try {
    response = await fetch(`/api${route}`, { method, headers: data === undefined ? {} : { 'Content-Type': 'application/json' }, body: data === undefined ? undefined : JSON.stringify(data) });
  } catch { throw new Error('Não foi possível acessar o servidor. Confira se o SETLIST está em execução.'); }
  const result = await response.json();
  if (!response.ok) throw new Error(result.erro ?? 'Não foi possível concluir a operação.');
  return result;
}
function showToast(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').hidden = false;
  toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 4500);
}
async function refresh(preferredId = state.selectedId) {
  const [songs, setlists] = await Promise.all([api('/musicas'), api('/setlists')]);
  const selectedId = setlists.some(item => item.id === preferredId) ? preferredId : (setlists[0]?.id ?? null);
  const detail = selectedId === null ? null : await api(`/setlists/${selectedId}`);
  // Só troca o estado quando todas as respostas estiverem disponíveis.
  Object.assign(state, { songs, setlists, selectedId, detail });
  $('#load-error').hidden = true;
  render();
}
async function action(task, errorElement = null) {
  if (state.busy) return;
  state.busy = true;
  document.body.setAttribute('aria-busy', 'true');
  const buttons = [...document.querySelectorAll('button')].map(button => [button, button.disabled]);
  buttons.forEach(([button]) => { button.disabled = true; });
  try { await task(); }
  catch (error) {
    if (errorElement?.closest('dialog')?.open) {
      errorElement.textContent = error.message;
      errorElement.hidden = false;
    } else {
      $('#load-error-text').textContent = error.message;
      $('#load-error').hidden = false;
    }
  } finally {
    buttons.forEach(([button, disabled]) => { if (button.isConnected) button.disabled = disabled; });
    state.busy = false;
    document.body.removeAttribute('aria-busy');
  }
}
function render() {
  $('#nav-setlist-count').textContent = state.setlists.length;
  $('#nav-song-count').textContent = state.songs.length;
  $('#stat-setlists').textContent = String(state.setlists.length).padStart(2, '0');
  $('#stat-songs').textContent = String(state.songs.length).padStart(2, '0');
  const seconds = state.songs.reduce((sum, song) => sum + song.duracao_segundos, 0);
  $('#stat-duration').textContent = libraryDuration(seconds);
  $('#stat-duration').title = duration(seconds);
  $('#list-count').textContent = `${state.setlists.length} no total`;
  $('#setlist-list').innerHTML = state.setlists.length ? state.setlists.map(item => `
    <button class="setlist-card ${item.id === state.selectedId ? 'selected' : ''}" data-action="select" data-id="${item.id}" aria-pressed="${item.id === state.selectedId}">
      <span class="card-top"><span class="card-icon" aria-hidden="true">☷</span><span class="card-arrow" aria-hidden="true">↗</span></span>
      <strong>${escapeHtml(item.nome)}</strong><span class="card-event">${escapeHtml(item.evento || 'Sem evento definido')}</span>
      <span class="card-meta"><span>♫ ${countSongs(item.quantidade_musicas)}</span><span>◷ ${duration(item.duracao_total_segundos)}</span></span>
    </button>`).join('') : '<div class="empty-state"><p>Seus próximos shows começam aqui.</p><button class="button small" data-action="new-setlist">Criar uma setlist</button></div>';
  renderDetail();
  renderLibrary();
}
function renderDetail() {
  const detail = state.detail;
  if (!detail) {
    $('#setlist-detail').innerHTML = '<div class="empty-state"><span class="empty-symbol" aria-hidden="true">☷</span><h2>Um palco em branco</h2><p>Crie seu primeiro repertório e escolha as músicas que vão fazer parte do show.</p><button class="button primary" data-action="new-setlist">＋ Criar meu repertório</button></div>';
    return;
  }
  const available = state.songs.filter(song => !detail.musicas.some(track => track.id === song.id));
  const tracks = detail.musicas.length ? `<div class="track-header" aria-hidden="true"><span>#</span><span>MÚSICA / ARTISTA</span><span>TEMPO</span><span></span></div><ol class="track-list">${detail.musicas.map((song, index) => `
    <li class="track-row"><span class="track-index">${String(index + 1).padStart(2, '0')}</span>
      <div class="track-info"><strong>${escapeHtml(song.titulo)}</strong><small>${escapeHtml(song.artista)}</small></div><span class="track-time">${duration(song.duracao_segundos)}</span>
      <div class="track-actions"><button class="icon-button" data-action="up" data-id="${song.id}" aria-label="Mover ${escapeHtml(song.titulo)} para cima" title="Mover para cima" ${index === 0 ? 'disabled' : ''}>↑</button><button class="icon-button" data-action="down" data-id="${song.id}" aria-label="Mover ${escapeHtml(song.titulo)} para baixo" title="Mover para baixo" ${index === detail.musicas.length - 1 ? 'disabled' : ''}>↓</button>${iconButton('remove', song.id, `Remover ${song.titulo} deste repertório`, '×', 'delete')}</div>
    </li>`).join('')}</ol>` : '<div class="empty-state empty-tracks"><span class="empty-symbol" aria-hidden="true">♫</span><h2>Qual será a primeira música?</h2><p>Adicione faixas da sua biblioteca para montar o show.</p></div>';
  const add = available.length ? `<form id="add-track-form" class="add-track"><label for="add-track-select">ADICIONAR DA BIBLIOTECA</label><div class="add-track-fields"><select id="add-track-select" required><option value="">Escolha uma música…</option>${available.map(song => `<option value="${song.id}">${escapeHtml(song.titulo)} — ${escapeHtml(song.artista)} (${duration(song.duracao_segundos)})</option>`).join('')}</select><button class="button small" type="submit">＋ Adicionar</button></div></form>` : `<div class="add-track"><p class="muted">${state.songs.length ? 'Todas as músicas da biblioteca já estão neste repertório.' : 'Sua biblioteca ainda está vazia.'}</p><button class="button small new-song-link" data-action="new-song">＋ Cadastrar música</button></div>`;
  $('#setlist-detail').innerHTML = `<div class="detail-heading"><p class="eyebrow">SEU PRÓXIMO SHOW</p><div class="detail-title-row"><div><h2 class="detail-title">${escapeHtml(detail.nome)}</h2><p class="detail-event">${escapeHtml(detail.evento || 'Sem evento definido')}</p></div><div class="detail-actions">${iconButton('edit-setlist', detail.id, 'Editar repertório', 'edit')}${iconButton('delete-setlist', detail.id, 'Excluir repertório', 'trash', 'delete')}</div></div><div class="detail-meta"><span class="pill">♫ ${countSongs(detail.quantidade_musicas)}</span><span class="pill total">◷ ${duration(detail.duracao_total_segundos)} de música</span></div></div>${tracks}${add}<div class="detail-total"><span>Duração total do repertório</span><strong>${duration(detail.duracao_total_segundos)}</strong></div>`;
}
function renderLibrary() {
  const query = $('#song-search').value.trim().toLocaleLowerCase('pt-BR');
  const songs = state.songs.filter(song => `${song.titulo} ${song.artista}`.toLocaleLowerCase('pt-BR').includes(query));
  $('#library-count').textContent = countSongs(state.songs.length);
  if (!songs.length) {
    $('#library-list').innerHTML = `<div class="empty-state"><span class="empty-symbol" aria-hidden="true">♫</span><h2>${query ? 'Nenhuma música encontrada' : 'Sua próxima faixa começa aqui'}</h2><p>${query ? 'Tente buscar outro título ou artista.' : 'Cadastre músicas para usá-las em quantos repertórios quiser.'}</p>${query ? '' : '<button class="button primary" data-action="new-song">＋ Nova música</button>'}</div>`;
    return;
  }
  $('#library-list').innerHTML = `<table class="library-table"><caption class="sr-only">Músicas cadastradas na biblioteca</caption><thead><tr><th scope="col">MÚSICA</th><th scope="col">ARTISTA / BANDA</th><th scope="col">DURAÇÃO</th><th scope="col">AÇÕES</th></tr></thead><tbody>${songs.map(song => `<tr><td><div class="library-song"><span class="song-art" aria-hidden="true">♫</span><strong>${escapeHtml(song.titulo)}</strong></div></td><td>${escapeHtml(song.artista)}</td><td>${duration(song.duracao_segundos)}</td><td>${iconButton('edit-song', song.id, `Editar ${song.titulo}`, 'edit')}${iconButton('delete-song', song.id, `Excluir ${song.titulo}`, 'trash', 'delete')}</td></tr>`).join('')}</tbody></table>`;
}
function switchView(view) {
  state.view = view;
  const library = view === 'library';
  $('#library-view').hidden = !library;
  $('#setlists-view').hidden = library;
  $('#nav-setlists').classList.toggle('active', !library);
  $('#nav-setlists').setAttribute('aria-pressed', String(!library));
  $('#nav-library').classList.toggle('active', library);
  $('#nav-library').setAttribute('aria-pressed', String(library));
  $('#page-title').textContent = library ? 'Biblioteca musical' : 'Meus repertórios';
  $('#page-description').textContent = library ? 'Todas as suas faixas. Infinitas possibilidades de repertório.' : 'Cada show tem sua sequência. Monte a sua.';
  $('#primary-action').innerHTML = `<span aria-hidden="true">＋</span> ${library ? 'Nova música' : 'Nova setlist'}`;
}
function openEditor(type, item = null) {
  editor = { type, item };
  const song = type === 'song';
  $('#editor-form').reset();
  $('#editor-error').hidden = true;
  $('#song-fields').hidden = !song;
  $('#setlist-fields').hidden = song;
  $('#song-fields').querySelectorAll('input').forEach(input => { input.disabled = !song; });
  $('#setlist-fields').querySelectorAll('input').forEach(input => { input.disabled = song; });
  $('#editor-title').textContent = song ? (item ? 'Editar música' : 'Nova música') : (item ? 'Editar repertório' : 'Nova setlist');
  $('#editor-eyebrow').textContent = song ? 'BIBLIOTECA MUSICAL' : 'MEUS REPERTÓRIOS';
  $('#save-editor').textContent = song ? 'Salvar música' : 'Salvar repertório';
  if (song && item) {
    $('#song-title').value = item.titulo;
    $('#song-artist').value = item.artista;
    $('#song-duration').value = duration(item.duracao_segundos);
  } else if (item) {
    $('#setlist-name').value = item.nome;
    $('#setlist-event').value = item.evento;
  }
  $('#editor-dialog').showModal();
  $(song ? '#song-title' : '#setlist-name').focus();
}
function openDelete(type, item) {
  deletion = { type, item };
  $('#confirm-title').textContent = type === 'song' ? 'Excluir música?' : 'Excluir repertório?';
  $('#confirm-description').textContent = type === 'song'
    ? `“${item.titulo}” será excluída da biblioteca e de todos os repertórios em que aparece. Esta ação não pode ser desfeita.`
    : `“${item.nome}” será excluído. As músicas continuarão na biblioteca. Esta ação não pode ser desfeita.`;
  $('#confirm-error').hidden = true;
  $('#confirm-dialog').showModal();
  $('#cancel-delete').focus();
}
$('#nav-setlists').addEventListener('click', () => switchView('setlists'));
$('#nav-library').addEventListener('click', () => switchView('library'));
$('#primary-action').addEventListener('click', () => openEditor(state.view === 'library' ? 'song' : 'setlist'));
$('#retry').addEventListener('click', () => action(() => refresh()));
$('#song-search').addEventListener('input', renderLibrary);
for (const selector of ['#cancel-editor', '#close-editor']) $(selector).addEventListener('click', () => $('#editor-dialog').close());
$('#cancel-delete').addEventListener('click', () => $('#confirm-dialog').close());
for (const selector of ['#editor-dialog', '#confirm-dialog']) $(selector).addEventListener('cancel', event => { if (state.busy) event.preventDefault(); });
$('#editor-form').addEventListener('submit', event => {
  event.preventDefault();
  $('#editor-error').hidden = true;
  action(async () => {
    const song = editor.type === 'song';
    let data;
    if (song) {
      const value = $('#song-duration').value;
      if (!/^\d{1,3}:[0-5]\d$/.test(value)) throw new Error('Use minutos:segundos, por exemplo 03:45.');
      const [minutes, seconds] = value.split(':').map(Number);
      const total = minutes * 60 + seconds;
      if (total < 1 || total > 36000) throw new Error('A duração deve estar entre 00:01 e 600:00.');
      data = { titulo: $('#song-title').value.trim(), artista: $('#song-artist').value.trim(), duracao_segundos: total };
    } else data = { nome: $('#setlist-name').value.trim(), evento: $('#setlist-event').value.trim() };
    const result = await api(`/${song ? 'musicas' : 'setlists'}${editor.item ? `/${editor.item.id}` : ''}`, editor.item ? 'PUT' : 'POST', data);
    // A gravação ocorreu; fechar evita reenviar o cadastro se a próxima leitura falhar.
    $('#editor-dialog').close();
    await refresh(song ? state.selectedId : result.id);
    showToast(song ? 'Música salva na biblioteca.' : 'Repertório salvo.');
  }, $('#editor-error'));
});
$('#confirm-delete').addEventListener('click', () => {
  $('#confirm-error').hidden = true;
  action(async () => {
    const song = deletion.type === 'song';
    await api(`/${song ? 'musicas' : 'setlists'}/${deletion.item.id}`, 'DELETE');
    $('#confirm-dialog').close();
    await refresh();
    showToast(song ? 'Música excluída.' : 'Repertório excluído. Músicas preservadas.');
  }, $('#confirm-error'));
});
document.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button || state.busy) return;
  const { action: command, id: rawId } = button.dataset;
  const itemId = Number(rawId);
  if (command === 'new-song') return openEditor('song');
  if (command === 'new-setlist') return openEditor('setlist');
  if (command === 'edit-song' || command === 'delete-song') {
    const song = state.songs.find(item => item.id === itemId);
    if (song) return command === 'edit-song' ? openEditor('song', song) : openDelete('song', song);
  }
  if (command === 'edit-setlist') return openEditor('setlist', state.detail);
  if (command === 'delete-setlist') return openDelete('setlist', state.detail);
  action(async () => {
    if (command === 'select') {
      const detail = await api(`/setlists/${itemId}`);
      state.selectedId = itemId;
      state.detail = detail;
      render();
      return;
    }
    if (command === 'remove') {
      await api(`/setlists/${state.selectedId}/musicas/${itemId}`, 'DELETE');
      await refresh();
      showToast('Música removida do repertório. Mantida na biblioteca.');
    }
    if (command === 'up' || command === 'down') {
      const ids = state.detail.musicas.map(song => song.id);
      const from = ids.indexOf(itemId), to = from + (command === 'up' ? -1 : 1);
      if (from < 0 || to < 0 || to >= ids.length) return;
      [ids[from], ids[to]] = [ids[to], ids[from]];
      await api(`/setlists/${state.selectedId}/ordem`, 'PUT', { musica_ids: ids });
      await refresh();
      showToast('Ordem do repertório salva.');
      $(`[data-action="${command}"][data-id="${itemId}"]`)?.focus();
    }
  });
});
document.addEventListener('submit', event => {
  if (event.target.id !== 'add-track-form') return;
  event.preventDefault();
  const songId = Number($('#add-track-select').value);
  action(async () => {
    await api(`/setlists/${state.selectedId}/musicas`, 'POST', { musica_id: songId });
    await refresh();
    showToast('Música adicionada ao repertório.');
  });
});
action(() => refresh());

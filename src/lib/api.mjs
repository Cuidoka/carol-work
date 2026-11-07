export async function api(route, method = 'GET', data) {
  let response;
  try {
    response = await fetch(`/api${route}`, {
      method,
      headers: data === undefined ? {} : { 'Content-Type': 'application/json' },
      body: data === undefined ? undefined : JSON.stringify(data)
    });
  } catch { throw new Error('Não foi possível acessar o servidor. Confira se o SETLIST está em execução.'); }
  let result;
  try { result = await response.json(); }
  catch { throw new Error('O servidor não respondeu como esperado. Confira a API e a configuração do deploy.'); }
  if (!response.ok) throw new Error(result.erro || 'Não foi possível concluir a operação.');
  return result;
}

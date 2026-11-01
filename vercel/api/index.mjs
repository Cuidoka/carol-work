import { getDatabase } from '../lib/database.mjs';
import { createHandler } from '../lib/handler.mjs';

export default {
  async fetch(request) {
    try { return await createHandler(getDatabase())(request); }
    catch {
      return Response.json({ erro: 'Serviço indisponível. Confira a configuração do banco no servidor.' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }
  }
};

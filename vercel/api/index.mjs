import { getDatabase } from '../lib/database.mjs';
import { createHandler } from '../lib/handler.mjs';

const handle = createHandler({ connect: async () => getDatabase().connect() });

export default {
  async fetch(request) {
    try { return await handle(request); }
    catch {
      return Response.json({ erro: 'Serviço indisponível. Confira a configuração do banco no servidor.' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }
  }
};

import { Client } from '@neondatabase/serverless';

export function getDatabase(connectionString = process.env.DATABASE_URL) {
  if (!connectionString || !/^postgres(?:ql)?:\/\//.test(connectionString)) {
    throw new Error('Configure DATABASE_URL com a conexão PostgreSQL do Neon.');
  }
  // Um Client WebSocket por requisição, encerrado ao terminar. Node.js 24
  // fornece WebSocket nativo. Não há banco local nem fallback para /tmp.
  return {
    async connect() {
      const client = new Client({ connectionString, connectionTimeoutMillis: 10000 });
      try { await client.connect(); }
      catch (error) { await client.end().catch(() => {}); throw error; }
      return { query: client.query.bind(client), release: () => client.end() };
    }
  };
}

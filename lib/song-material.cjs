'use strict';

const limits = { letra: 20000, cifra: 20000, tom: 12, notas: 2000, letra_fonte: 120 };

// Campos ausentes em clientes antigos preservam o material já salvo.
function materialData(data, current = {}) {
  return Object.entries(limits).map(([field, limit]) => {
    const value = data[field] === undefined ? current[field] ?? '' : data[field];
    if (typeof value !== 'string' || value.length > limit || value.includes('\0')) {
      const error = new Error(`${field}: informe um texto de até ${limit} caracteres.`);
      error.status = 400;
      throw error;
    }
    if (field === 'letra_fonte' && value && !/^https:\/\/lrclib\.net\/api\/get\/[1-9]\d*$/.test(value)) {
      const error = new Error('Fonte da letra inválida.'); error.status = 400; throw error;
    }
    return value.replace(/\r\n?/g, '\n');
  });
}
module.exports = { materialData };

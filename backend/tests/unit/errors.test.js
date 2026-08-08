import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AppError, errorHandler } from '../../src/middleware/errors.js';

describe('AppError', () => {
  it('guarda status, code e message', () => {
    const err = new AppError(404, 'NOT_FOUND', 'Recurso inexistente');

    assert.equal(err.status, 404);
    assert.equal(err.code, 'NOT_FOUND');
    assert.equal(err.message, 'Recurso inexistente');
    assert.ok(err instanceof Error);
  });
});

describe('errorHandler', () => {
  it('responde com o payload de AppError', () => {
    const err = new AppError(400, 'VALIDATION_ERROR', 'Dados inválidos');
    let statusCode;
    let body;

    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(payload) {
        body = payload;
        return this;
      },
    };

    errorHandler(err, {}, res, () => {});

    assert.equal(statusCode, 400);
    assert.deepEqual(body, {
      error: { code: 'VALIDATION_ERROR', message: 'Dados inválidos' },
    });
  });

  it('responde 500 para erros inesperados', () => {
    let statusCode;
    let body;

    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(payload) {
        body = payload;
        return this;
      },
    };

    const originalError = console.error;
    console.error = () => {};
    try {
      errorHandler(new Error('boom'), {}, res, () => {});
    } finally {
      console.error = originalError;
    }

    assert.equal(statusCode, 500);
    assert.deepEqual(body, {
      error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor' },
    });
  });
});

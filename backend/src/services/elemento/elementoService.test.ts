import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import { DeepMockProxy } from 'vitest-mock-extended';

// --- MOCKS ---

// 1. Mock da Tabela Periódica (com valores normalizados para corresponder à lógica do serviço)
vi.mock('../../constants/TabelaPeriodica', () => ({
    TABELA_PERIODICA_COMPLETA: [
        { s: 'fe', n: 'ferro' },
        { s: 'he', n: 'helio' },
        { s: 'li', n: 'litio' }
    ]
}));

// 2. Mock do Prisma
vi.mock('../../prismaClient', async () => {
    const actual = await vi.importActual<typeof import('vitest-mock-extended')>('vitest-mock-extended');
    return {
        __esModule: true,
        default: actual.mockDeep<PrismaClient>(),
    };
});

// 3. Mock do File System
vi.mock('fs', () => ({
    default: { promises: { stat: vi.fn(), unlink: vi.fn() } },
    promises: { stat: vi.fn(), unlink: vi.fn() }
}));

// Importação do Service DEPOIS dos mocks
import * as ElementoService from './elementoService.js';
import prisma from '../../prismaClient';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

// Função auxiliar para normalizar strings (igual à do service)
const normalizeString = (str: string) => {
    if (!str) return '';
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
};


describe('Elemento Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        ((fs as any).default?.promises?.stat || fs.promises.stat).mockResolvedValue(true);
        ((fs as any).default?.promises?.unlink || fs.promises.unlink).mockResolvedValue(true);
    });

    // --- LISTAR ---
    describe('listarElementos', () => {
        it('Deve retornar dados paginados e formatados', async () => {
            const mockDados = [{ codQuestao: 1, resposta: 'Hélio', simbolo: 'He', codNivel: 1, imagemUrl: 'he.png', imgDistribuicao: null, dicas: [{ dica: 'D1' }] }];
            prismaMock.$transaction.mockResolvedValue([1, mockDados]);
            const resultado = await ElementoService.listarElementos(1, 10);

            expect(prismaMock.questao.findMany).toHaveBeenCalledWith(expect.objectContaining({
                take: 10,
                skip: 0
            }));
            expect(resultado.data[0]).toHaveProperty('nome', 'Hélio');
            expect(resultado.data[0]).toHaveProperty('dicas', ['D1']);
            expect(resultado.totalPaginas).toBe(1);
        });

        it('Deve aplicar filtro de busca', async () => {
            prismaMock.$transaction.mockResolvedValue([0, []]);
            await ElementoService.listarElementos(1, 10, 'Ouro');

            expect(prismaMock.questao.count).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    OR: expect.arrayContaining([
                        { resposta: { contains: 'Ouro' } }
                    ])
                })
            }));
        });
    });

    // --- BUSCAR POR ID ---
    describe('buscarPorId', () => {
        it('Deve retornar o elemento formatado se encontrar', async () => {
            const mockEl = { codQuestao: 1, resposta: 'H', simbolo: 'H', codNivel: 1, imagemUrl: null, imgDistribuicao: null, dicas: [{ dica: 'Leve' }] };
            prismaMock.questao.findUnique.mockResolvedValue(mockEl as any);
            const result = await ElementoService.buscarPorId(1);

            expect(result).toHaveProperty('nome', 'H');
            expect(result?.dicas).toEqual(['Leve']);
        });

        it('Deve retornar null se não encontrar', async () => {
            prismaMock.questao.findUnique.mockResolvedValue(null);
            const result = await ElementoService.buscarPorId(99);
            expect(result).toBeNull();
        });
    });

    // --- CRIAR ---
    describe('criarElemento', () => {
        const dadosValidos = {
            nome: 'ferro',
            simbolo: 'fe',
            nivel: 2,
            dicas: ['Dica 1', 'Dica 2', 'Dica 3']
        };

        it('Sucesso: Deve criar elemento se tudo estiver correto', async () => {
            prismaMock.questao.findFirst.mockResolvedValue(null);
            prismaMock.questao.create.mockResolvedValue({
                codQuestao: 1,
                ...dadosValidos,
                resposta: 'ferro',
                imagemUrl: '/uploads/img.png'
            } as any);

            await ElementoService.criarElemento(dadosValidos, 'img.png');

            expect(prismaMock.questao.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    resposta: 'ferro',
                    simbolo: 'fe'
                })
            }));
        });

        it('Erro: Deve falhar se não tiver exatamente 3 dicas', async () => {
            const dadosInvalidos = { ...dadosValidos, dicas: ['Só uma'] };
            await expect(ElementoService.criarElemento(dadosInvalidos))
                .rejects.toThrow("exatamente 3 dicas");
            expect(prismaMock.questao.create).not.toHaveBeenCalled();
        });

        it('Erro: Deve falhar se elemento já existir (Duplicado)', async () => {
            prismaMock.questao.findFirst.mockResolvedValue({ codQuestao: 5 } as any);
            await expect(ElementoService.criarElemento(dadosValidos))
                .rejects.toThrow(/Elemento.*já cadastrado/i);
        });

        it('Erro: Deve falhar se elemento não existir na Tabela Periódica', async () => {
            const dadosFalsos = { ...dadosValidos, nome: 'Kryptonita' };
            await expect(ElementoService.criarElemento(dadosFalsos))
                .rejects.toThrow(/não existe na Tabela Periódica/i);
        });
    });

    // --- ATUALIZAR ---
    describe('atualizarElemento', () => {
        const elementoAtual = {
            codQuestao: 1,
            resposta: 'helio',
            simbolo: 'he',
            codNivel: 1,
            imagemUrl: '/uploads/velha.png'
        };

        it('Sucesso: Deve atualizar campos simples (usando nome válido)', async () => {
            prismaMock.questao.findUnique.mockResolvedValue(elementoAtual as any);
            prismaMock.questao.findFirst.mockResolvedValue(null);
            prismaMock.questao.update.mockResolvedValue({} as any);

            await ElementoService.atualizarElemento(1, { nome: 'litio', simbolo: 'li' });

            expect(prismaMock.questao.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { codQuestao: 1 },
                data: expect.objectContaining({ resposta: 'litio' })
            }));
        });

        it('Sucesso: Deve apagar imagem antiga se enviar uma nova', async () => {
            prismaMock.questao.findUnique.mockResolvedValue(elementoAtual as any);
            prismaMock.questao.findFirst.mockResolvedValue(null);
            prismaMock.questao.update.mockResolvedValue({} as any);

            await ElementoService.atualizarElemento(1, { nivel: 2 }, 'nova.png');

            const unlinkMock = (fs as any).default?.promises?.unlink || fs.promises.unlink;
            expect(unlinkMock).toHaveBeenCalled();

            expect(prismaMock.questao.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ imagemUrl: '/uploads/nova.png' })
            }));
        });

        it('Erro: Deve falhar se tentar atualizar dicas com quantidade errada', async () => {
            await expect(ElementoService.atualizarElemento(1, { dicas: ['Só duas', 'dicas'] }))
                .rejects.toThrow("exatamente 3 dicas");
        });
    });

    // --- DELETAR ---
    describe('deletarElemento', () => {
        it('Sucesso: Deve deletar arquivos físicos e registros do banco', async () => {
            prismaMock.questao.findUnique.mockResolvedValue({
                codQuestao: 1,
                imagemUrl: '/uploads/foto.png',
                imgDistribuicao: '/uploads/dist.png'
            } as any);

            await ElementoService.deletarElemento(1);

            const unlinkMock = (fs as any).default?.promises?.unlink || fs.promises.unlink;
            expect(unlinkMock).toHaveBeenCalledTimes(2);
            expect(prismaMock.dicas.deleteMany).toHaveBeenCalledWith({ where: { codQuestao: 1 } });
            expect(prismaMock.questao.delete).toHaveBeenCalledWith({ where: { codQuestao: 1 } });
        });

        it('Erro: Deve lançar erro se elemento não existe', async () => {
            prismaMock.questao.findUnique.mockResolvedValue(null);
            await expect(ElementoService.deletarElemento(999))
                .rejects.toThrow("Elemento não encontrado");
            expect(prismaMock.questao.delete).not.toHaveBeenCalled();
        });
    });
});
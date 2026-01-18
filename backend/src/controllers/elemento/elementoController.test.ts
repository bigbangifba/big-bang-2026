import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import * as ElementoController from './elementoController.js';
import * as ElementoService from '../../services/elemento/elementoService.js';

// --- MOCKS ---

// 1. Mock do Service
vi.mock('../../services/elemento/elementoService', () => ({
    listarElementos: vi.fn(),
    buscarPorId: vi.fn(),
    criarElemento: vi.fn(),
    atualizarElemento: vi.fn(),
    deletarElemento: vi.fn(),
}));

// 2. Mock do Sharp (CRUCIAL)
// O controller usa o Sharp para validar a resolução. Precisamos simular que
// a imagem é válida para que o teste não falhe na validação.
vi.mock('sharp', () => {
    return {
        default: vi.fn().mockReturnValue({
            metadata: vi.fn().mockResolvedValue({ width: 89, height: 84 }) // Valores válidos
        })
    };
});

describe('Elemento Controller', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let jsonMock: any;
    let statusMock: any;
    let sendMock: any;

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup dos mocks do Express
        jsonMock = vi.fn();
        sendMock = vi.fn();
        // Permite encadear res.status(200).json(...)
        statusMock = vi.fn().mockReturnValue({ json: jsonMock, send: sendMock });

        req = {
            params: {},
            query: {},
            body: {},
            files: {}
        } as unknown as Request;

        res = {
            status: statusMock,
            json: jsonMock,
            send: sendMock
        } as unknown as Response;
    });

    // --- LISTAR ---
    describe('listar', () => {
        it('Sucesso: Deve retornar lista paginada (Status 200)', async () => {
            req.query = { page: '1', limit: '10' };
            const mockResultado = { dados: [], total: 0, pagina: 1 };
            (ElementoService.listarElementos as any).mockResolvedValue(mockResultado);

            await ElementoController.listar(req as Request, res as Response);

            expect(ElementoService.listarElementos).toHaveBeenCalledWith(1, 10, undefined);
            expect(res.json).toHaveBeenCalledWith(mockResultado);
        });

        it('Erro: Deve retornar 500 se o service falhar', async () => {
            (ElementoService.listarElementos as any).mockRejectedValue(new Error('Erro DB'));

            await ElementoController.listar(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Erro ao listar' });
        });
    });

    // --- BUSCAR POR ID ---
    describe('buscarPorId', () => {
        it('Sucesso: Deve retornar o elemento se encontrado', async () => {
            req.params = { id: '1' };
            const mockElemento = { id: 1, nome: 'Hidrogênio' };
            (ElementoService.buscarPorId as any).mockResolvedValue(mockElemento);

            await ElementoController.buscarPorId(req as Request, res as Response);

            expect(ElementoService.buscarPorId).toHaveBeenCalledWith(1);
            expect(res.json).toHaveBeenCalledWith(mockElemento);
        });

        it('Erro: Deve retornar 404 se não encontrar', async () => {
            req.params = { id: '99' };
            (ElementoService.buscarPorId as any).mockResolvedValue(null);

            await ElementoController.buscarPorId(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Não encontrado' });
        });
    });

    // --- CRIAR ---
    describe('criar', () => {
        it('Sucesso: Deve processar arquivos e criar elemento (Status 201)', async () => {
            req.body = {
                nome: 'Hélio',
                simbolo: 'He',
                nivel: '1',
                dicas: '["Gás Nobre", "Leve", "Inerte"]' // Simulamos envio como string (form-data)
            };

            // Mock dos arquivos com propriedades essenciais para o Multer e Sharp
            const mockFiles = {
                'imagem': [{
                    filename: 'foto-he.png',
                    path: 'tmp/foto-he.png', // Necessário para o Sharp ler
                    fieldname: 'imagem'
                } as any],
                'imagemDistribuicao': [{
                    filename: 'dist-he.png',
                    path: 'tmp/dist-he.png',
                    fieldname: 'imagemDistribuicao'
                } as any]
            };
            req.files = mockFiles;

            const mockCriado = { id: 2, nome: 'Hélio' };
            (ElementoService.criarElemento as any).mockResolvedValue(mockCriado);

            await ElementoController.criar(req as Request, res as Response);

            expect(ElementoService.criarElemento).toHaveBeenCalledWith(
                expect.objectContaining({
                    nome: 'Hélio',
                    simbolo: 'He',
                    nivel: 1,
                    // O controller deve converter a string JSON em array
                    dicas: ['Gás Nobre', 'Leve', 'Inerte']
                }),
                'foto-he.png',
                'dist-he.png'
            );
            expect(statusMock).toHaveBeenCalledWith(201);
            expect(jsonMock).toHaveBeenCalledWith(mockCriado);
        });

        it('Sucesso: Deve aceitar dicas como array direto', async () => {
            req.body = { dicas: ['Dica 1'] };
            req.files = {}; // Sem arquivos

            (ElementoService.criarElemento as any).mockResolvedValue({});

            await ElementoController.criar(req as Request, res as Response);

            expect(ElementoService.criarElemento).toHaveBeenCalledWith(
                expect.objectContaining({ dicas: ['Dica 1'] }),
                undefined,
                undefined
            );
        });

        it('Erro: Deve retornar 500 se o service lançar erro genérico', async () => {
            (ElementoService.criarElemento as any).mockRejectedValue(new Error('Nome obrigatório'));

            await ElementoController.criar(req as Request, res as Response);

            // Controller captura 'new Error' no catch genérico e retorna 500
            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });

    // --- ATUALIZAR ---
    describe('atualizar', () => {
        it('Sucesso: Deve atualizar dados parciais', async () => {
            req.params = { id: '1' };
            req.body = { nome: 'Novo Nome' };

            const mockFiles = {
                'imagem': [{
                    filename: 'nova-foto.png',
                    path: 'tmp/nova-foto.png',
                    fieldname: 'imagem'
                } as any]
            };
            req.files = mockFiles;

            const mockAtualizado = { id: 1, nome: 'Novo Nome' };
            (ElementoService.atualizarElemento as any).mockResolvedValue(mockAtualizado);

            await ElementoController.atualizar(req as Request, res as Response);

            expect(ElementoService.atualizarElemento).toHaveBeenCalledWith(
                1,
                expect.objectContaining({ nome: 'Novo Nome' }),
                'nova-foto.png',
                undefined
            );
            expect(res.json).toHaveBeenCalledWith(mockAtualizado);
        });

        it('Erro: Deve retornar 500 em caso de falha', async () => {
            (ElementoService.atualizarElemento as any).mockRejectedValue(new Error('Erro DB'));

            await ElementoController.atualizar(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });

    // --- DELETAR ---
    describe('deletar', () => {
        it('Sucesso: Deve retornar 204 (No Content)', async () => {
            req.params = { id: '10' };
            (ElementoService.deletarElemento as any).mockResolvedValue(true);

            await ElementoController.deletar(req as Request, res as Response);

            expect(ElementoService.deletarElemento).toHaveBeenCalledWith(10);
            expect(statusMock).toHaveBeenCalledWith(204);
            expect(sendMock).toHaveBeenCalled();
        });

        it('Erro: Deve retornar 500 se falhar', async () => {
            (ElementoService.deletarElemento as any).mockRejectedValue(new Error('Erro'));

            await ElementoController.deletar(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });
});
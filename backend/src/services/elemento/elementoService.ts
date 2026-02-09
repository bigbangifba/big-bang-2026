import prisma from '../../prismaClient.js';
import fs from 'fs';
import path from 'path';
import uploadConfig from '../../config/upload.js';
import { Prisma } from '@prisma/client';
import {TABELA_PERIODICA_COMPLETA} from "../../constants/TabelaPeriodica.js";

interface CreateDados {
    nome: string;
    simbolo: string;
    nivel: number;
    dicas: string[];
}

interface UpdateDados {
    nome?: string;
    simbolo?: string;
    nivel?: number;
    dicas?: string[];
}

interface ResultadoPaginado {
    data: any[];
    total: number;
    pagina: number;
    totalPaginas: number;
}

// Função auxiliar para normalizar strings (remover acentos e converter para minúsculas)
const normalizeString = (str: string) => {
    if (!str) return '';
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
};

// Função auxiliar para apagar arquivos do disco
const deletarImagemAntiga = async (imagemUrl: string | null) => {
    if (!imagemUrl) return;
    // Remove o prefixo '/uploads/' para pegar o nome real do arquivo
    const nomeArquivo = imagemUrl.replace('/uploads/', '');
    const caminhoArquivo = path.resolve(uploadConfig.directory, nomeArquivo);
    try {
        await fs.promises.stat(caminhoArquivo);
        await fs.promises.unlink(caminhoArquivo);
    } catch (err) {
        // Se der erro (arquivo não existe), a gente ignora para não travar o fluxo
    }
};

// --- MÉTODOS ---

export const listarElementos = async (page: number = 1, limit: number = 10, busca?: string, nivel?: string): Promise<ResultadoPaginado> => {
    const skip = (page - 1) * limit;

    // Inicializa o where
    const where: Prisma.questaoWhereInput = {};

    // 1. Filtro de Busca (Texto)
    if (busca) {
        where.OR = [
            { resposta: { contains: busca } },
            { simbolo: { contains: busca } }
        ];
    }

    // 2. Filtro de Nível (Radio Button)
    // O front manda "INICIANTE", "CURIOSO", etc. O banco espera 1, 2, 3.
    if (nivel && nivel !== 'TODOS') {
        const mapaNiveis: Record<string, number> = {
            'INICIANTE': 1,
            'CURIOSO': 2,
            'CIENTISTA': 3
        };

        const codNivel = mapaNiveis[nivel];

        if (codNivel) {
            where.codNivel = codNivel;
        }
    }

    const [total, elementos] = await prisma.$transaction([
        prisma.questao.count({ where }),
        prisma.questao.findMany({
            where,
            include: { dicas: true },
            orderBy: { codQuestao: 'desc' },
            skip,
            take: limit
        })
    ]);

    const elementosFormatados = elementos.map(el => ({
        id: el.codQuestao,
        nome: el.resposta,
        simbolo: el.simbolo,
        codNivel: el.codNivel,
        imagemUrl: el.imagemUrl,
        imgDistribuicao: el.imgDistribuicao,
        dicas: el.dicas.map(d => d.dica)
    }));

    return {
        data: elementosFormatados,
        total,
        pagina: page,
        totalPaginas: Math.ceil(total / limit)
    };
};

export const buscarPorId = async (id: number) => {
    const el = await prisma.questao.findUnique({
        where: { codQuestao: id },
        include: { dicas: true }
    });

    if(el) {
        return {
            id: el.codQuestao,
            nome: el.resposta,
            simbolo: el.simbolo,
            nivel: el.codNivel,
            imagemUrl: el.imagemUrl,
            imgDistribuicao: el.imgDistribuicao,
            dicas: el.dicas.map(d => d.dica)
        }
    }
    return null;
};

export const criarElemento = async (dados: CreateDados, nomeImagem?: string, nomeImagemDistribuicao?: string) => {
    // 1. Validação: Exatamente 3 dicas
    if (dados.dicas.length !== 3) {
        throw new Error("É obrigatório fornecer exatamente 3 dicas.");
    }

    // Valida se o elemento existe na tabela periódica, comparando as versões normalizadas
    const elementoReal = TABELA_PERIODICA_COMPLETA.find(e =>
        normalizeString(e.s) === dados.simbolo &&
        normalizeString(e.n) === dados.nome
    );

    if (!elementoReal) {
        throw new Error(`O elemento '${dados.nome}' (${dados.simbolo}) não existe na Tabela Periódica oficial.`);
    }

    // 2. Validação: Elemento já existe (usando os dados normalizados)
    const existe = await prisma.questao.findFirst({
        where: {
            OR: [
                { resposta: dados.nome },
                { simbolo: dados.simbolo }
            ]
        }
    });

    if (existe) {
        throw new Error("Elemento já cadastrado (Nome ou Símbolo duplicado).");
    }

    // Cria o elemento com os dados normalizados recebidos
    return await prisma.questao.create({
        data: {
            resposta: dados.nome,
            simbolo: dados.simbolo,
            codNivel: dados.nivel,
            imagemUrl: nomeImagem ? `/uploads/${nomeImagem}` : null,
            imgDistribuicao: nomeImagemDistribuicao ? `/uploads/${nomeImagemDistribuicao}` : null,
            dicas: {
                create: dados.dicas.map((texto, index) => ({
                    codDica: index + 1,
                    dica: texto,
                    pontuacao: 5
                }))
            }
        },
        include: { dicas: true }
    });
};

export const atualizarElemento = async (id: number, dados: UpdateDados, novoNomeImagem?: string, novoNomeImagemDistribuicao?: string) => {

    // 1. Validação de Dicas (se foram enviadas)
    if (dados.dicas && dados.dicas.length !== 3) {
        throw new Error("É obrigatório manter exatamente 3 dicas.");
    }

    // SE TENTAR MUDAR NOME OU SÍMBOLO ---
    if (dados.nome || dados.simbolo) {

        // A. Busca os dados atuais no banco para garantir consistência
        const elementoAtual = await prisma.questao.findUnique({ where: { codQuestao: id } });
        if (!elementoAtual) throw new Error("Elemento não encontrado");

        const nomeParaValidar = dados.nome || elementoAtual.resposta;
        const simboloParaValidar = dados.simbolo || elementoAtual.simbolo;

        // B. Verifica se é um elemento real da Tabela Periódica, usando normalização
        const elementoReal = TABELA_PERIODICA_COMPLETA.find(e =>
            normalizeString(e.s) === simboloParaValidar &&
            normalizeString(e.n) === nomeParaValidar
        );

        if (!elementoReal) {
            throw new Error(`A combinação '${nomeParaValidar}' e '${simboloParaValidar}' não existe na Tabela Periódica oficial.`);
        }

        // C. Validação de Duplicidade (IGNORANDO O PRÓPRIO ID)
        const duplicado = await prisma.questao.findFirst({
            where: {
                AND: [
                    { codQuestao: { not: id } },
                    {
                        OR: [
                            { resposta: nomeParaValidar },
                            { simbolo: simboloParaValidar }
                        ]
                    }
                ]
            }
        });

        if (duplicado) {
            throw new Error(`Já existe outro elemento cadastrado como: ${duplicado.resposta} (${duplicado.simbolo}).`);
        }
    }
    // -------------------------------------------------------

    // Lógica para deletar imagens antigas se houver upload novo
    if (novoNomeImagem || novoNomeImagemDistribuicao) {
        const antigo = await prisma.questao.findUnique({ where: { codQuestao: id } });

        if (novoNomeImagem && antigo?.imagemUrl) {
            await deletarImagemAntiga(antigo.imagemUrl);
        }

        if (novoNomeImagemDistribuicao && antigo?.imgDistribuicao) {
            await deletarImagemAntiga(antigo.imgDistribuicao);
        }
    }

    const dataToUpdate: Prisma.questaoUpdateInput = {};

    if (dados.nome !== undefined) dataToUpdate.resposta = dados.nome;
    if (dados.simbolo !== undefined) dataToUpdate.simbolo = dados.simbolo;
    if (dados.nivel !== undefined) dataToUpdate.codNivel = dados.nivel;

    if (novoNomeImagem) dataToUpdate.imagemUrl = `/uploads/${novoNomeImagem}`;
    if (novoNomeImagemDistribuicao) dataToUpdate.imgDistribuicao = `/uploads/${novoNomeImagemDistribuicao}`;

    if (dados.dicas !== undefined) {
        dataToUpdate.dicas = {
            deleteMany: {},
            create: dados.dicas.map((texto, index) => ({
                codDica: index + 1,
                dica: texto,
                pontuacao: 5
            }))
        };
    }

    return await prisma.questao.update({
        where: { codQuestao: id },
        data: dataToUpdate,
        include: { dicas: true }
    });
};

export const deletarElemento = async (id: number) => {
    const elemento = await prisma.questao.findUnique({ where: { codQuestao: id } });
    if (!elemento) throw new Error("Elemento não encontrado");

    // Deleta os arquivos físicos
    await deletarImagemAntiga(elemento.imagemUrl);
    await deletarImagemAntiga(elemento.imgDistribuicao);

    await prisma.dicas.deleteMany({ where: { codQuestao: id } });

    return await prisma.questao.delete({ where: { codQuestao: id } });
};
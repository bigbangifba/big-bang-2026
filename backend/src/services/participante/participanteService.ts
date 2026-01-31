import prisma from '../../prismaClient.js';
import { Prisma } from '@prisma/client'; // Importar Prisma para tipagem

interface ResultadoPaginado {
    data: any[];
    total: number;
    pagina: number;
    totalPaginas: number;
}

export const listarParticipantes = async (page: number = 1, limit: number = 10, busca?: string, nivel?: string): Promise<ResultadoPaginado> => {
    const skip = (page - 1) * limit;

    // Inicializa o objeto where
    const where: Prisma.rankingWhereInput = {};

    // 1. Filtro de Busca (Texto)
    if (busca) {
        where.usuario = { contains: busca };
    }

    // 2. Filtro de Nível (Radio Button)
    // Se vier algo diferente de "TODOS" e não for nulo, aplicamos o filtro
    if (nivel && nivel !== 'TODOS') {
        where.nivel = nivel;
    }

    const [total, participantes] = await prisma.$transaction([
        prisma.ranking.count({ where }),
        prisma.ranking.findMany({
            where,
            orderBy: { pontuacao: 'desc' },
            skip,
            take: limit
        })
    ]);

    return {
        data: participantes,
        total,
        pagina: page,
        totalPaginas: Math.ceil(total / limit)
    };
};

export const deletarParticipante = async (codRanking: number) => {
    return await prisma.ranking.delete({ where: { codRanking } });
};

export const atualizarParticipante = async (codRanking: number, novoNome: string) => {
    return await prisma.ranking.update({
        where: { codRanking },
        data: { usuario: novoNome }
    });
};
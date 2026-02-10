import prisma from '../../prismaClient.js';

export const getTopRanking =async () => {
    const allRankingEntries = await prisma.ranking.findMany({
        orderBy: {
            pontuacao: 'desc', // Ordena pelo score geral
        },
    });

    return allRankingEntries;

};

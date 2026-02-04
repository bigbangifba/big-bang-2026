import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// --- INTERFACES ---
interface RankingEntry {
    usuario: string;
    pontuacao: number;
    nivel: 'INICIANTE' | 'CURIOSO' | 'CIENTISTA';
    data_hora: string;
}

interface GroupedRanking {
    INICIANTE: RankingEntry[];
    CURIOSO: RankingEntry[];
    CIENTISTA: RankingEntry[];
}

// --- CONSTANTES ---
const API_RANKING_URL = `${BASE_URL}/api/ranking`;

const TROPHY_MAP: Record<keyof GroupedRanking, string> = {
    INICIANTE: '/img/trofeu/bronze.png',
    CIENTISTA: '/img/trofeu/ouro.png',
    CURIOSO: '/img/trofeu/prata.png',
};

// --- FUNÇÃO AUXILIAR ---
const groupAndSortRanking = (entries: RankingEntry[]): GroupedRanking => {
    const grouped: GroupedRanking = {
        INICIANTE: [],
        CURIOSO: [],
        CIENTISTA: [],
    };

    entries.forEach(entry => {
        if (entry.nivel && (entry.nivel in grouped)) {
            grouped[entry.nivel].push(entry);
        }
    });

    Object.values(grouped).forEach((list: RankingEntry[]) => {
        list.sort((a, b) => b.pontuacao - a.pontuacao);
    });

    return grouped;
};

// --- COMPONENTE DE COLUNA ---
interface RankingColumnProps {
    level: keyof GroupedRanking;
    entries: RankingEntry[];
}

const RankingColumn: React.FC<RankingColumnProps> = ({ level, entries }) => {
    const levelClass = level.toLowerCase();

    return (
        <div className="col-12 col-lg-4 mb-4">
            <div className="blocos">
                <br />
                <img
                    src={TROPHY_MAP[level]}
                    width="48"
                    height="66"
                    alt={`Troféu ${level}`}
                    style={{ display: 'block', margin: '0 auto' }}
                />

                <div className={levelClass}>
                    <h5 className="mt-2">{level}</h5>
                    <br />

                    {entries.slice(0, 10).map((entry, index) => {
                        const position = index + 1;
                        const corClass = position % 2 === 0 ? 'cor1' : 'cor2';

                        return (
                            <h6 key={index} className={corClass}>
                                {position}. {entry.usuario} - {entry.pontuacao} pts
                            </h6>
                        );
                    })}
                    {entries.length === 0 && <h6 className="text-muted text-center">Nenhum dado.</h6>}
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
const RankingPage: React.FC = () => {
    const [groupedRanking, setGroupedRanking] = useState<GroupedRanking | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const nivelOrder: Array<keyof GroupedRanking> = ['INICIANTE', 'CIENTISTA', 'CURIOSO'];

    useEffect(() => {
        sessionStorage.removeItem('jogo_ativo');
    }, []);

    useEffect(() => {
        document.body.classList.add('ranking-page-body');
        return () => {
            document.body.classList.remove('ranking-page-body');
        };
    }, []);

    useEffect(() => {
        const fetchRanking = async () => {
            try {
                const response = await fetch(API_RANKING_URL);
                if (!response.ok) {
                    throw new Error(`Erro: ${response.status} - ${response.statusText}`);
                }
                const allEntries: RankingEntry[] = await response.json();
                setGroupedRanking(groupAndSortRanking(allEntries));
            } catch (err) {
                setError("Falha ao carregar o ranking. Verifique a API do Backend.");
                console.error("Erro no fetch:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchRanking();
    }, []);

    if (loading) {
        return <div className="text-center mt-5 text-white">Carregando Ranking...</div>;
    }
    if (error || !groupedRanking) {
        return <div className="text-center mt-5 text-danger">Erro: {error || "Dados de ranking indisponíveis."}</div>;
    }

    return (
        <div className="barra" style={{ paddingBottom: '100px', paddingTop: '40px' }}>

            {/* --- TÍTULO EM IMAGEM --- */}
            <div className="row justify-content-center mb-5 pb-3">
                <div className="col-12 text-center">
                    {/* REMOVIDO O id="ranking" PARA EVITAR CONFLITO CSS
                        Adicionado estilos inline para garantir a visibilidade
                    */}
                    <img
                        src="/img/nome_ranking.png"
                        alt="Ranking"
                        style={{
                            maxWidth: '90%',
                            width: '350px',
                            height: 'auto',
                            display: 'block', // Garante que não é inline
                            margin: '0 auto', // Centraliza
                            position: 'relative',
                            zIndex: 10, // Garante que fique na frente
                            top: 0 // Força o topo para 0, anulando qualquer CSS externo estranho
                        }}
                    />
                </div>
            </div>

            {/* --- COLUNAS DOS NÍVEIS --- */}
            <div className="row justify-content-center">
                {nivelOrder.map(nivel => (
                    <RankingColumn
                        key={nivel}
                        level={nivel}
                        entries={groupedRanking[nivel]}
                    />
                ))}
            </div>

            {/* --- BOTÃO VOLTAR --- */}
            <Link
                to="/"
                className="btn-voltar-fixo"
                title="Voltar ao Menu"
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    left: '20px',
                    zIndex: 9999,
                    display: 'block',
                    transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                <img
                    src="/img/voltar.webp"
                    alt="Voltar"
                    className="img-voltar-fixo"
                    style={{
                        width: '60px',
                        height: 'auto',
                        filter: 'drop-shadow(0px 0px 5px rgba(0,0,0,0.5))'
                    }}
                />
            </Link>
        </div>
    );
};

export default RankingPage;
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/styleNiveis.css';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface NivelData {
    codNivel: 1 | 2 | 3;
    nome: 'INICIANTE' | 'CURIOSO' | 'CIENTISTA' | 'N/A';
}

const API_NIVEIS_URL = `${BASE_URL}/api/jogo/niveis`;

const LEVEL_CONFIG: Record<number, { img: string; texto: string; wrapperClass: string; colorClass: string }> = {
    1: {
        img: '/img/iniciante.png',
        texto: 'Ideal para começar.\nDicas fundamentais com total suporte de ferramentas.',
        wrapperClass: 'quadradoNiveis1',
        colorClass: 'corUm'
    },
    2: {
        img: '/img/curioso.png',
        texto: 'Desafios moderados.\nPara quem já domina o básico: dicas intermediárias e auxílio reduzido.',
        wrapperClass: 'quadradoNiveis2',
        colorClass: 'corDois'
    },
    3: {
        img: '/img/cientista.png',
        texto: 'Desafio máximo.\nElementos químicos complexos, dicas difíceis e auxílio mínimo.',
        wrapperClass: 'quadradoNiveis3',
        colorClass: 'corTres'
    },
};

const NiveisPage: React.FC = () => {
    const [niveis, setNiveis] = useState<NivelData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const tocarSom = () => {
        const audio = new Audio('/musica/selecao-nivel.wav');
        audio.volume = 0.5;
        audio.play().catch(() => {});
    };

    useEffect(() => {
        const fetchNiveis = async () => {
            try {
                const response = await fetch(API_NIVEIS_URL);
                if (!response.ok) {
                    throw new Error(`Erro: ${response.status}`);
                }
                const data: NivelData[] = await response.json();
                data.sort((a, b) => a.codNivel - b.codNivel);
                setNiveis(data);
            } catch (err) {
                console.error(err);
                setError("Não foi possível carregar os níveis.");
            } finally {
                setLoading(false);
            }
        };
        fetchNiveis();
    }, []);

    if (loading) return <div className="text-center mt-5 text-white">Carregando...</div>;

    if (error) return <div className="text-center mt-5 text-white">Erro: {error}</div>;

    return (
        <div className="container-fluid">
            <div className="row justify-content-center">
                <div className="col-7">
                    <img id="selecionar_nivel" src="/img/selecionar_nivel.webp" alt="Selecionar nível" className="img-fluid" />
                </div>
            </div>

            <div className="row justify-content-center">
                <div className="col-9 text-center">
                    {niveis.map((nivel) => {
                        const config = LEVEL_CONFIG[nivel.codNivel];
                        if (!config) return null;

                        return (
                            <div
                                key={nivel.codNivel}
                                className={`${config.wrapperClass} ${config.colorClass}`}
                                onClick={tocarSom}
                                style={{ position: 'relative', cursor: 'pointer' }}
                            >
                                <Link to={`/jogo/selecao-perfil/${nivel.codNivel}`}>
                                    <img id="imagemNivel" src={config.img} alt={nivel.nome} />
                                    <div className="descricao-hover">
                                        <p>{config.texto}</p>
                                    </div>
                                </Link>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="row mt-5">
                <div className="col-2">
                    <div id="bt_voltar">
                        <Link to="/">
                            <img className="efeito" src="/img/voltar.webp" alt="Voltar" title="Voltar" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NiveisPage;
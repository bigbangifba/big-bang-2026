import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from "react-hot-toast";
import { TABELA_PERIODICA_COMPLETA } from "../../constants/TabelaPeriodica.ts";

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Elemento {
    id: number;
    nome: string;
    simbolo: string;
    codNivel: number;
}

interface AdminLogado {
    id: number;
    isSuperAdmin: boolean;
    podeExcluirElementos: boolean;
}

interface RespostaAPI {
    data: Elemento[];
    total: number;
    pagina: number;
    totalPaginas: number;
}

const AdminElementosPage: React.FC = () => {
    const navigate = useNavigate();

    // Estados de Filtro
    const [busca, setBusca] = useState('');
    const [nivelFiltro, setNivelFiltro] = useState('TODOS'); // <--- NOVO

    const [elementos, setElementos] = useState<Elemento[]>([]);
    const [loading, setLoading] = useState(true);

    // Estados de Paginação
    const [paginaAtual, setPaginaAtual] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);

    // Estado de Permissão
    const [podeExcluir, setPodeExcluir] = useState(false);

    useEffect(() => {
        carregarPermissoes();
    }, []);

    // Atualiza quando busca, pagina ou FILTRO mudar
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            carregarElementos(paginaAtual, busca, nivelFiltro);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [paginaAtual, busca, nivelFiltro]);

    const carregarPermissoes = () => {
        const dadosString = sessionStorage.getItem('adminUser');
        if (dadosString) {
            try {
                const admin: AdminLogado = JSON.parse(dadosString);
                const temPermissao = Boolean(admin.isSuperAdmin || admin.podeExcluirElementos);
                setPodeExcluir(temPermissao);
            } catch (e) {
                console.error("Erro ao ler permissões", e);
            }
        }
    };

    const carregarElementos = async (page: number, termoBusca: string, nivel: string) => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            // Adicionando &nivel=...
            const url = `${BASE_URL}/api/elementos?page=${page}&limit=5&busca=${termoBusca}&nivel=${nivel}`;

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if(res.ok) {
                const dados = await res.json();
                if (dados.data) {
                    const resposta = dados as RespostaAPI;
                    setElementos(resposta.data);
                    setTotalPaginas(resposta.totalPaginas);
                } else if (Array.isArray(dados)) {
                    setElementos(dados);
                }
            } else {
                toast.error("Erro ao carregar elementos.");
            }
        } catch (error) {
            console.error("Erro ao buscar elementos", error);
            toast.error("Erro de conexão.");
        } finally {
            setLoading(false);
        }
    };

    const obterNomeFormatado = (simboloApi: string, nomeApi: string) => {
        if (!simboloApi) return nomeApi;
        const elementoEncontrado = TABELA_PERIODICA_COMPLETA.find(
            el => el.s.toLowerCase() === simboloApi.toLowerCase()
        );
        return elementoEncontrado ? elementoEncontrado.n : nomeApi;
    };

    const handleDelete = async (id: number) => {
        if(!confirm("Tem certeza que deseja excluir este elemento?")) return;
        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch(`${BASE_URL}/api/elementos/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                toast.success("Excluído com sucesso!");
                carregarElementos(paginaAtual, busca, nivelFiltro);
            } else {
                const err = await res.json();
                toast.error(err.error || "Erro ao excluir.");
            }
        } catch (e) {
            toast.error("Erro de conexão.");
        }
    };

    const renderPaginacao = () => {
        if (totalPaginas <= 1) return null;

        return (
            <div className="d-flex justify-content-center mt-4 gap-2">
                <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 1))}
                    disabled={paginaAtual === 1}
                >
                    Anterior
                </button>
                <span className="d-flex align-items-center px-3 text-white">
                    Página {paginaAtual} de {totalPaginas}
                </span>
                <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas))}
                    disabled={paginaAtual === totalPaginas}
                >
                    Próxima
                </button>
            </div>
        );
    };

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-white">🧪 Gerenciar Elementos</h2>
                <button className="btn btn-success" onClick={() => navigate('/admin/elementos/novo')}>
                    + Novo Elemento
                </button>
            </div>

            <div className="mb-4 d-flex flex-wrap align-items-center gap-3">
                <label className="text-white fw-bold me-2 mb-0">Filtrar por Nível:</label>

                <div className="form-check d-flex align-items-center mb-0">
                    <input
                        className="form-check-input mt-0"
                        type="radio"
                        name="nivelOptions"
                        id="radioTodos"
                        value="TODOS"
                        checked={nivelFiltro === 'TODOS'}
                        onChange={(e) => { setNivelFiltro(e.target.value); setPaginaAtual(1); }}
                        style={{ cursor: 'pointer' }}
                    />
                    <label className="form-check-label text-white ms-2 mb-0" htmlFor="radioTodos" style={{ cursor: 'pointer' }}>Todos</label>
                </div>

                <div className="form-check d-flex align-items-center mb-0">
                    <input
                        className="form-check-input mt-0"
                        type="radio"
                        name="nivelOptions"
                        id="radioIniciante"
                        value="INICIANTE"
                        checked={nivelFiltro === 'INICIANTE'}
                        onChange={(e) => { setNivelFiltro(e.target.value); setPaginaAtual(1); }}
                        style={{ cursor: 'pointer' }}
                    />
                    <label className="form-check-label text-info ms-2 mb-0" htmlFor="radioIniciante" style={{ cursor: 'pointer' }}>Iniciante</label>
                </div>

                <div className="form-check d-flex align-items-center mb-0">
                    <input
                        className="form-check-input mt-0"
                        type="radio"
                        name="nivelOptions"
                        id="radioCurioso"
                        value="CURIOSO"
                        checked={nivelFiltro === 'CURIOSO'}
                        onChange={(e) => { setNivelFiltro(e.target.value); setPaginaAtual(1); }}
                        style={{ cursor: 'pointer' }}
                    />
                    <label className="form-check-label text-warning ms-2 mb-0" htmlFor="radioCurioso" style={{ cursor: 'pointer' }}>Curioso</label>
                </div>

                <div className="form-check d-flex align-items-center mb-0">
                    <input
                        className="form-check-input mt-0"
                        type="radio"
                        name="nivelOptions"
                        id="radioCientista"
                        value="CIENTISTA"
                        checked={nivelFiltro === 'CIENTISTA'}
                        onChange={(e) => { setNivelFiltro(e.target.value); setPaginaAtual(1); }}
                        style={{ cursor: 'pointer' }}
                    />
                    <label className="form-check-label text-danger ms-2 mb-0" htmlFor="radioCientista" style={{ cursor: 'pointer' }}>Cientista</label>
                </div>
            </div>

            <div className="mb-4">
                <input
                    type="text"
                    className="form-control"
                    placeholder="🔍 Buscar elemento..."
                    value={busca}
                    onChange={(e) => {
                        setBusca(e.target.value);
                        setPaginaAtual(1);
                    }}
                    style={{ backgroundColor: '#343a40', color: 'white', border: '1px solid #495057' }}
                />
            </div>

            {loading ? (
                <div className="text-center text-white">Carregando...</div>
            ) : (
                <>
                    <div className="table-responsive">
                        <table className="table table-hover table-dark rounded overflow-hidden align-middle">
                            <thead>
                            <tr>
                                <th scope="col">ID</th>
                                <th scope="col">Símbolo</th>
                                <th scope="col">Nome</th>
                                <th scope="col">Nível</th>
                                <th scope="col" className="text-end">Ações</th>
                            </tr>
                            </thead>
                            <tbody>
                            {elementos.map(el => (
                                <tr key={el.id}>
                                    <td className="text-secondary">#{el.id}</td>
                                    <td>
                                        <span className="badge bg-secondary">
                                            {el.simbolo.charAt(0).toUpperCase() + el.simbolo.slice(1).toLowerCase()}
                                        </span>
                                    </td>
                                    <td className="fw-bold">
                                        {obterNomeFormatado(el.simbolo, el.nome)}
                                    </td>
                                    <td>
                                        {el.codNivel === 1 && <span className="badge bg-info text-dark">INICIANTE</span>}
                                        {el.codNivel === 2 && <span className="badge bg-warning text-dark">CURIOSO</span>}
                                        {el.codNivel === 3 && <span className="badge bg-danger">CIENTISTA</span>}
                                    </td>
                                    <td className="text-end">
                                        <button
                                            className="btn btn-sm btn-outline-info me-2"
                                            onClick={() => navigate(`/admin/elementos/editar/${el.id}`)}
                                        >
                                            ✏️ Editar
                                        </button>

                                        <button
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => podeExcluir && handleDelete(el.id)}
                                            disabled={!podeExcluir}
                                            style={!podeExcluir ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                            title={!podeExcluir ? "Sem permissão para excluir" : "Excluir elemento"}
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {elementos.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-4 text-muted">
                                        Nenhum elemento encontrado.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                    {renderPaginacao()}
                </>
            )}
        </div>
    );
};

export default AdminElementosPage;
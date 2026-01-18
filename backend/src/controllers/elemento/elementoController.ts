import { type Request, type Response } from 'express';
import sharp from 'sharp';
import * as ElementoService from '../../services/elemento/elementoService.js';

// Interface para tipar o objeto de arquivos do Multer
interface MulterFiles {
    [fieldname: string]: Express.Multer.File[];
}

const MAX_WIDTH = 89;
const MAX_HEIGHT = 84;

const validateImageResolution = async (file: Express.Multer.File | undefined) => {
    if (!file) {
        return;
    }

    const metadata = await sharp(file.path).metadata();

    if (metadata.width && metadata.width > MAX_WIDTH) {
        throw new Error(`A largura da imagem não deve exceder ${MAX_WIDTH} pixels.`);
    }

    if (metadata.height && metadata.height > MAX_HEIGHT) {
        throw new Error(`A altura da imagem não deve exceder ${MAX_HEIGHT} pixels.`);
    }
};

export const listar = async (req: Request, res: Response) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 5;
        const busca = req.query.busca as string;

        const resultado = await ElementoService.listarElementos(page, limit, busca);

        return res.json(resultado);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao listar' });
    }
};

export const buscarPorId = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const elemento = await ElementoService.buscarPorId(Number(id));
        if (!elemento) return res.status(404).json({ error: 'Não encontrado' });
        return res.json(elemento);
    } catch (error) {
        return res.status(500).json({ error: 'Erro ao buscar' });
    }
};

export const criar = async (req: Request, res: Response) => {
    try {
        const { nome, simbolo, nivel, dicas } = req.body;

        // --- Lendo múltiplos arquivos ---
        const files = req.files as MulterFiles;

        // Pega a imagem principal (campo 'imagem')
        const arquivoPrincipal = files['imagem'] ? files['imagem'][0] : undefined;

        // Pega a imagem de distribuição (campo 'imagemDistribuicao')
        const arquivoDistribuicao = files['imagemDistribuicao'] ? files['imagemDistribuicao'][0] : undefined;

        // Validar resolução das imagens
        await validateImageResolution(arquivoPrincipal);
        await validateImageResolution(arquivoDistribuicao);

        let dicasArray: string[] = [];
        if (dicas) {
            try {
                dicasArray = typeof dicas === 'string' ? JSON.parse(dicas) : dicas;
            } catch (e) {
                dicasArray = Array.isArray(dicas) ? dicas : [dicas];
            }
        }

        const novo = await ElementoService.criarElemento({
            nome,
            simbolo,
            nivel: Number(nivel),
            dicas: dicasArray
        }, arquivoPrincipal?.filename, arquivoDistribuicao?.filename); // <--- Passando o novo arquivo

        return res.status(201).json(novo);
    } catch (error) {
        console.error(error);
        const mensagemErro = error instanceof Error ? error.message : 'Erro ao criar';
        if (mensagemErro.includes('exceder')) {
            return res.status(400).json({ error: mensagemErro });
        }
        return res.status(500).json({ error: 'Erro ao criar' });
    }
};

export const atualizar = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { nome, simbolo, nivel, dicas } = req.body;

        // --- MUDANÇA AQUI TAMBÉM ---
        const files = req.files as MulterFiles;
        const arquivoPrincipal = files['imagem'] ? files['imagem'][0] : undefined;
        const arquivoDistribuicao = files['imagemDistribuicao'] ? files['imagemDistribuicao'][0] : undefined;

        // Validar resolução das imagens
        await validateImageResolution(arquivoPrincipal);
        await validateImageResolution(arquivoDistribuicao);

        let dicasArray: string[] | undefined = undefined;
        if (dicas) {
            try {
                dicasArray = Array.isArray(dicas) ? dicas : JSON.parse(dicas);
            } catch (e) {
                // Fallback caso venha string simples
                dicasArray = [dicas as string];
            }
        }

        const atualizado = await ElementoService.atualizarElemento(Number(id), {
            nome,
            simbolo,
            ...(nivel ? { nivel: Number(nivel) } : {}),
            ...(dicasArray ? { dicas: dicasArray } : {})
        }, arquivoPrincipal?.filename, arquivoDistribuicao?.filename); // <--- Passando o novo arquivo

        return res.json(atualizado);
    } catch (error) {
        console.error(error);
        const mensagemErro = error instanceof Error ? error.message : 'Erro ao atualizar';
        if (mensagemErro.includes('exceder')) {
            return res.status(400).json({ error: mensagemErro });
        }
        return res.status(500).json({ error: 'Erro ao atualizar' });
    }
};

export const deletar = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await ElementoService.deletarElemento(Number(id));
        return res.status(204).send();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao deletar' });
    }
};

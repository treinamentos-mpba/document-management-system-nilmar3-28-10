# Especificação - Document Management System

## 1. Objetivo

Disponibilizar uma aplicação web simples para enviar, listar e baixar documentos armazenados no filesystem local, mantendo seus metadados em memória.

## 2. Escopo

### Dentro do escopo

- Enviar um documento por requisição.
- Listar os documentos disponíveis na execução atual da aplicação.
- Baixar um documento por seu identificador.
- Usar armazenamento de arquivos local em `backend/storage` com Multer e `diskStorage`.
- Manter metadados em memória durante a execução atual.
- Oferecer uma interface React que consome a API pelo prefixo `/api` do proxy Vite.

### Fora do escopo

- Armazenamento externo ou em nuvem.
- Versionamento de documentos.
- Autenticação, autorização e isolamento de documentos por usuário.
- Persistência durável de metadados, banco de dados, paginação, busca ou filtros.
- Limite de tamanho ou restrição de tipo de arquivo nesta versão.

## 3. Requisitos funcionais

| ID | Requisito | Critério de aceite |
| --- | --- | --- |
| RF-01 | O sistema deve aceitar o envio de um único arquivo por requisição usando `multipart/form-data` no campo `file`. | Uma requisição válida armazena o arquivo localmente e retorna seus metadados com status `201`. |
| RF-02 | O sistema deve rejeitar uma requisição de upload sem arquivo ou sem o campo `file`. | A API retorna status `400` com erro JSON; nenhum metadado de documento é criado. |
| RF-03 | O sistema deve gerar um identificador único e um nome interno de armazenamento que não dependa de caminhos fornecidos pelo cliente. | O nome original não é usado como caminho no filesystem, e nomes repetidos não sobrescrevem arquivos existentes. |
| RF-04 | O sistema deve registrar os metadados do documento após o armazenamento do arquivo. | A resposta de upload contém os campos públicos definidos no modelo de dados, sem caminho local ou nome interno. |
| RF-05 | O sistema deve listar todos os documentos conhecidos na execução atual. | A resposta contém uma lista ordenada de `uploadedAt` mais recente para mais antiga; lista vazia é válida. |
| RF-06 | O sistema deve permitir baixar um documento pelo identificador. | Um documento existente é enviado como anexo com o nome original; um identificador desconhecido retorna `404`. |
| RF-07 | O sistema deve representar `owner` sem afirmar identidade autenticada. | Como não há autenticação no MVP, `owner` é `null`; não há filtragem nem autorização por dono. |
| RF-08 | O sistema deve informar falhas de entrada e de operação em formato consistente. | Respostas de erro usam o formato JSON definido nos contratos de API e não expõem caminhos internos nem stack traces. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos devem ser gravados exclusivamente no filesystem local da aplicação em `backend/storage`, usando Multer com `diskStorage`. Provedores externos não são permitidos. |
| RNF-02 | Os metadados devem permanecer em memória nesta fase. Reiniciar o processo apaga os metadados; arquivos correspondentes podem permanecer no disco como órfãos. |
| RNF-03 | A configuração operacional deve seguir 12-Factor e usar variáveis de ambiente quando aplicável; `PORT` controla a porta HTTP e mantém o fallback existente `3000`. O diretório de armazenamento permanece conforme a restrição do projeto. |
| RNF-04 | O backend deve seguir Clean Architecture simples, com dependências no sentido `routes -> controllers -> services -> repositories`. Camadas internas não devem depender de Express ou de detalhes de transporte. |
| RNF-05 | O backend deve usar Node.js e Express em CommonJS; o frontend deve usar React e Vite em ESM. A implementação permanece em JavaScript, sem TypeScript nesta fase. |
| RNF-06 | Erros de entrada HTTP e de operações de filesystem devem ser tratados nos limites do sistema. Respostas não devem revelar detalhes internos da aplicação. |
| RNF-07 | A cobertura automatizada do backend deve usar `node:test` e validar os comportamentos e contratos definidos nesta especificação. |
| RNF-08 | O MVP não estabelece limites de tamanho ou tipos de arquivo permitidos. Essa ausência deve ser considerada uma limitação operacional, não uma garantia de capacidade para arquivos arbitrariamente grandes. |

## 5. Modelo de dados (metadados do documento)

### Metadados públicos

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | string | Sim | Identificador único gerado pelo sistema. |
| `originalName` | string | Sim | Nome original informado para o arquivo enviado; usado como nome sugerido no download, nunca como caminho no filesystem. |
| `size` | number | Sim | Tamanho do arquivo em bytes. |
| `uploadedAt` | string | Sim | Data e hora do upload em ISO 8601, normalizada para UTC. |
| `owner` | string ou `null` | Sim | Identificador do dono quando houver uma fonte de identidade; permanece `null` no MVP sem autenticação. |

### Dados internos de armazenamento

O repositório pode manter, além dos metadados públicos, um nome interno gerado pelo sistema para localizar o arquivo em `backend/storage`. Esse dado não deve ser retornado pela API. O nome interno não pode conter caminho fornecido pelo cliente nem permitir traversal de diretório. A implementação deve criar o metadado somente após confirmar o armazenamento do arquivo; se o registro falhar após gravar o arquivo, deve tratar a falha para evitar deixar um arquivo órfão sempre que possível.

Os metadados são voláteis. Após reiniciar o backend, a API não conhece os arquivos remanescentes no diretório e não os lista; reconciliação e limpeza automática de órfãos não fazem parte do MVP.

## 6. Contratos de API

### Convenções

- As rotas abaixo são caminhos do backend. O cliente frontend usa o prefixo `/api`; o proxy Vite remove esse prefixo ao encaminhar a requisição para o backend local.
- Requisições de upload usam `multipart/form-data` e um único campo de arquivo chamado `file`.
- Respostas de sucesso com metadados usam `application/json; charset=utf-8`.
- Erros usam o formato `{"error":{"code":"CODIGO","message":"Descrição em português."}}`.
- A API não exige autenticação neste MVP. Todos os documentos conhecidos pelo processo são listados e baixáveis por quem alcançar a API.
- Não há paginação, filtros, ordenação solicitável pelo cliente ou limite de tamanho/tipo definido nesta versão.

### POST /upload

Envia um documento e registra seus metadados em memória.

**Entrada**

- `Content-Type: multipart/form-data`
- Campo obrigatório `file`: um arquivo.
- Campos de texto adicionais são ignorados e não definem `owner`.

**Sucesso: `201 Created`**

```json
{
  "id": "identificador-gerado",
  "originalName": "relatorio.pdf",
  "size": 12345,
  "uploadedAt": "2026-10-28T12:00:00.000Z",
  "owner": null
}
```

**Erros**

| Status | Código | Condição |
| --- | --- | --- |
| `400` | `FILE_REQUIRED` | Arquivo ausente ou campo `file` não enviado. |
| `500` | `UPLOAD_FAILED` | Falha inesperada ao gravar o arquivo ou registrar os metadados. |

### GET /documents

Lista os metadados conhecidos durante a execução atual do backend, do upload mais recente ao mais antigo.

**Sucesso: `200 OK`**

```json
{
  "documents": [
    {
      "id": "identificador-gerado",
      "originalName": "relatorio.pdf",
      "size": 12345,
      "uploadedAt": "2026-10-28T12:00:00.000Z",
      "owner": null
    }
  ]
}
```

Quando não houver documentos, `documents` deve ser um array vazio. O endpoint não retorna nomes internos nem caminhos locais.

**Erros**

| Status | Código | Condição |
| --- | --- | --- |
| `500` | `DOCUMENT_LIST_FAILED` | Falha inesperada ao consultar o repositório. |

### GET /documents/:id/download

Baixa o conteúdo binário de um documento conhecido pelo identificador.

**Sucesso: `200 OK`**

- Corpo: conteúdo binário do arquivo.
- `Content-Type: application/octet-stream`.
- `Content-Disposition: attachment`, com `originalName` devidamente codificado como nome sugerido ao cliente.
- O caminho local e o nome interno de armazenamento nunca são enviados na resposta.

**Erros**

| Status | Código | Condição |
| --- | --- | --- |
| `404` | `DOCUMENT_NOT_FOUND` | O identificador não existe na coleção em memória ou o arquivo associado não está disponível. |
| `500` | `DOWNLOAD_FAILED` | Falha inesperada durante a leitura ou transmissão do arquivo. |

## 7. Decisões arquiteturais

- O backend é dividido em rotas, controllers, services e repositories. Rotas encaminham a requisição; controllers validam a entrada HTTP e traduzem resultado/erro em resposta; services implementam regras de negócio; repositories encapsulam filesystem e metadados em memória.
- Multer com `diskStorage` é o mecanismo de entrada dos arquivos. O destino é `backend/storage`; o nome físico é gerado pelo sistema, independente do nome original. Não usar armazenamento externo.
- O repositório mantém metadados em memória e associa cada registro a um nome interno de arquivo. A persistência de metadados após reinício não é garantida.
- O frontend usa componentes React e um serviço baseado em `fetch`. Durante o desenvolvimento, consome os caminhos com `/api`; o proxy Vite encaminha ao backend e remove o prefixo.
- O backend mantém o endpoint existente `GET /health`. Os endpoints desta especificação são requisitos futuros e ainda não estão implementados.
- O MVP não implementa autenticação ou autorização. `owner` é reservado para compatibilidade futura e permanece `null`; não deve ser usado para sugerir privacidade ou separação de dados.
- Falhas de filesystem devem ser convertidas em erros HTTP consistentes. A implementação deve evitar confiar no nome ou caminho enviado pelo cliente e não deve expor diretórios locais.

## 8. Plano de execução

As etapas abaixo descrevem entregas futuras. Esta especificação não executa nem altera arquivos de backend ou frontend.

1. **Fundação do backend:** estabelecer as responsabilidades das quatro camadas e o repositório de arquivos locais e metadados em memória.
2. **Upload:** implementar o contrato multipart, validação do arquivo, nome interno seguro, gravação local e criação dos metadados.
3. **Consulta e download:** implementar listagem ordenada e download por identificador, incluindo respostas de erro e cabeçalhos definidos.
4. **Testes de backend:** cobrir contratos de sucesso, entradas inválidas, documento inexistente e falhas relevantes de armazenamento usando `node:test`.
5. **Experiência frontend:** implementar o consumo da API e os fluxos de envio, listagem, estados vazios/erro e download, respeitando o proxy `/api`.
6. **Integração e validação:** verificar os fluxos completos frontend-backend, a persistência local durante a execução, o comportamento após reinício e a conformidade com os requisitos não funcionais.

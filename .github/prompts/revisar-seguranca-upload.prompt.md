---
description: Revisa segurança e tratamento de erros no fluxo local de upload e download do DMS.
name: revisar-seguranca-upload
argument-hint: arquivos ou fluxo a revisar (ex. backend/src)
agent: agent
---

# Revisão de segurança do fluxo de documentos

Analise o fluxo indicado em `${input:escopo:arquivos ou fluxo a revisar}`, seguindo origem dos dados e operações sensíveis entre rotas, controllers, services, repositories e filesystem.

Priorize riscos próprios do DMS:

- Uso de `multer` com `diskStorage` e destino restrito a `backend/storage`.
- Nomes de arquivo enviados pelo usuário, nomes internos gerados e path traversal.
- Download por identificador, caminho local, `Content-Disposition` e arquivos ausentes.
- Consistência entre gravação de arquivo e metadados mantidos em memória.
- Erros HTTP que possam expor caminhos, detalhes internos ou dados de outros documentos.
- Limites e tipos de arquivo: diferencie uma limitação já declarada na especificação de uma falha comprovada no código.

Para cada achado, informe severidade, arquivo e linha, fluxo de entrada até o ponto vulnerável, impacto concreto e correção mínima. Releia os trechos relacionados e verifique se uma validação ou middleware existente já mitiga o problema antes de reportá-lo. Não classifique como vulnerabilidade uma limitação conhecida sem demonstrar um impacto adicional.

Não altere arquivos. Se não houver achados comprovados, informe isso e cite as áreas verificadas.

Inspiração adaptada: princípios de análise de fluxo entre arquivos, autoverificação e severidade do [security-review](https://github.com/github/awesome-copilot/tree/main/skills/security-review/SKILL.md) do repositório `github/awesome-copilot`.
# SOC DASH

Dashboard local para organizar **alertas, investigações e incidentes de segurança**.

O projeto nasceu da necessidade de representar um fluxo simples de SOC: registrar um caso, adicionar contexto, guardar evidências, definir severidade, acompanhar ações e fechar com uma decisão clara.

## Funcionalidades

- cadastro e acompanhamento de casos
- severidade e prioridade
- entidades envolvidas
- registro de evidências
- notas de investigação
- status de contenção e resolução
- métricas operacionais
- exportação de informações
- funcionamento local

## Estrutura

- `index.html` — aplicação
- `assets/` — recursos da interface
- `scripts/` — verificações auxiliares
- `docs/` — documentação técnica e fluxo de incidentes
- `sw.js` — service worker
- `manifest.webmanifest` — configuração web

## Uso

O SOC DASH é uma aplicação web local e não precisa de SIEM ou backend para funcionar.

Existe um smoke check em:

```text
scripts/smoke-check.mjs
```

## Limite do projeto

Não é um substituto para Sentinel, Defender, Splunk, SOAR ou ferramenta de ticketing. O objetivo é estudar organização de casos e raciocínio operacional sem depender de um ambiente corporativo real.

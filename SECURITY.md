# Security model

SOC DASH foi desenhado como painel local de demonstração e laboratório.

Os registros ficam no localStorage do navegador. O projeto não envia eventos, identidades, IOCs ou notas para APIs externas.

## Controles aplicados

Content Security Policy restritiva no documento principal.

Sem dependências JavaScript externas.

Sem uso de eval ou Function dinâmica.

Dados inseridos pelo usuário são renderizados com textContent.

Exportação feita localmente em JSON.

Service Worker limitado aos arquivos estáticos do painel.

## Uso responsável

Não use dados reais de produção, credenciais, tokens, segredos ou informações reguladas em uma instância pública.

Para uso corporativo, substitua o armazenamento local por uma API autenticada, implemente RBAC, trilha de auditoria, criptografia em trânsito e em repouso, retenção definida e integração com o provedor de identidade da organização.

Vulnerabilidades podem ser reportadas pelo canal privado de segurança do repositório quando disponível.

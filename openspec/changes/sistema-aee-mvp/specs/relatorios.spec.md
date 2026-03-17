# Especificações de Comportamento: Relatórios e Sync Offline

> Este documento segue o padrão normativo **RFC 2119**.

## Cenário 1: Criação de Relatório Offline
**Given (Dado)** que a Professora AEE está na zona rural sem internet ativa, 
**When (Quando)** ela finaliza a redação do `Relatório AEE` e clica no trigger de Salvar,
**Then (Então)** o client-side offline-store (IndexedDB via Dexie) MUST absorver o arquivo persistido e marcá-lo como "Aguardando Sync".
**And (E)** a UI MUST disparar um Toast alertando "Dados salvos localmente" sem proibir o manuseio iterativo da aplicação.

## Cenário 2: Reconexão e Destravamento de Sync
**Given (Dado)** que há itens aguardando push na fila do IndexedDB,
**When (Quando)** o listener `navigator.onLine` do event bus disparar `true` ou a aba restaurar,
**Then (Então)** o Sync Worker oculto MUST empacotar as entidades limpas e enviá-las para `/api/sync/reports` num bulk POST idempotente.
**And (E)** ao capturar um 201 Created/200 OK da API, a store MUST descartar as row locais pesadas e a interface MUST re-renderizar a Badge dos cards pra "Sincronizado".

## Cenário 3: Tentativa de Bypass de Permissão (Erro Grave)
**Given (Dado)** que quem detém a sessão JWT é classificado estritamente como `prof_apoio`,
**When (Quando)** tenta-se forçar uma injeção de payload para o `/api/reports/trimestral` (permissão estrita da Prof PI),
**Then (Então)** a API MUST extrair a credencial, negar de imediato (HTTP 403 Forbidden) e abortar transações de write.
**And (E)** MUST logar no servidor esta tentativa maliciosa ou de glitch de client routing.

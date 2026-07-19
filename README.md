# Banda de Ensaio

Aplicativo pessoal e offline para estudar músicas com stems sincronizados.

## Estado atual

Primeiro marco funcional:

- importação local de um áudio ou múltiplos stems;
- classificação básica por nome do arquivo;
- mixer com volume, solo e mudo;
- escolha do instrumento de estudo;
- modos **Aprender**, **Tocar com a banda** e **Mixagem livre**;
- forma de onda clicável;
- loop A–B;
- velocidade de 50% a 120%;
- demonstração gerada localmente, sem áudio protegido;
- armazenamento local em IndexedDB;
- PWA e fluxo de publicação no GitHub Pages.

## Como testar

```bash
npm install
npm run dev
```

Para validar a versão de produção:

```bash
npm run build
npm run preview
```

## Importação de stems

É possível selecionar vários arquivos de uma vez. O app tenta reconhecer a função pelo nome:

- `vocals`, `voz`, `voice`;
- `drums`, `bateria`;
- `bass`, `baixo`;
- `guitar`, `guitarra`, `violao`;
- `piano`, `keys`, `teclado`, `organ`;
- `other`, `outros`.

Nesta etapa ainda não há separação por IA dentro do app. O motor local de separação será conectado no próximo marco.

## Privacidade

Os áudios importados são armazenados no próprio navegador, em IndexedDB. O aplicativo não envia arquivos para um servidor.

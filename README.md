# Squ4ttro Motors App

Aplicativo Expo para iOS e Android com estoque pesquisavel e contatos rapidos da Squ4ttro Motors.

## Rodar localmente

```bash
npm install
npm start
```

Depois, abra no Expo Go ou use:

```bash
npm run android
npm run ios
```

## Preview web

```bash
npm run web
```

A preview web pode cair na amostra salva porque navegadores bloqueiam a leitura direta do estoque por CORS. Nos apps Android e iOS, a requisicao nativa busca o estoque completo em `https://squ4ttromotors.com.br/multipla/page/99`.

## Build para lojas

O projeto usa Expo SDK 56. Para gerar builds de distribuicao, configure uma conta Expo/EAS e rode:

```bash
npx eas build --platform android
npx eas build --platform ios
```

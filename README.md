# Nuvio BR

Fornecedor **experimental** para Nuvio. A versão atual tenta localizar filmes no Internet Archive.

## Estado atual

- O código e o manifesto foram publicados.
- A integração ainda não foi validada dentro do aplicativo Nuvio.
- Nesta versão, apenas filmes são considerados; séries não estão implementadas.
- A busca usa a API do TMDB e pede uma chave pessoal nas configurações do fornecedor.
- A disponibilidade de vídeo, áudio em português brasileiro e legendas depende dos arquivos encontrados. Não há garantia de dublagem PT-BR.

## Instalação para teste

Manifesto:
`https://raw.githubusercontent.com/williankaulitz81-cell/NUVIOBR/main/manifest.json`

Adicione esse endereço ao Nuvio apenas para teste. Se o fornecedor aparecer mas não encontrar resultados ou falhar ao reproduzir, isso significa que a integração precisa de ajustes.

## Limitações e uso responsável

- O projeto não hospeda filmes, séries, áudio nem legendas.
- O Internet Archive contém materiais variados; confira a licença e a autorização de cada item antes de reproduzir ou redistribuir.
- Uma chave TMDB é usada para localizar o título; ela não fornece o vídeo nem a dublagem.
- Mantenha o NiakVIO instalado enquanto testa esta versão.

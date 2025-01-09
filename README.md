# Acesse o Tutorial de Uso
Caso você deseje apenas executar nosso serviço, não precisa se preocupar, fizemos um tutorial simples e detalhado de como executar o Playstube 2.0.0 em seu próprio servidor, ou computador.

# Realize o Download
Caso já tenha lido o Tutorial de Uso, ou deseja realizar o download primeiro, basta [clicar aqui](https://github.com/Hsyst/Playstube/releases)

---
---

# Documentação Técnica
Olá, tudo bem? Bem vindo(a) a Documentação Técnica, aqui eu vou falar um pouquinho de como funciona o Playstube, na teoria, e na prática!

Vamos separar em alguns tópicos, sendo eles:
- Endpoints
  - Listagem de Canais
  - Listagem de Vídeos
  - Adição de Canal
  - Adição de Vídeo
  - Adição de Arquivo de Vídeo
  - Busca de Vídeo (query)
- Fluxos
- Como executar
- Configurações Básicas
  - Versão Main
    - Alteração da Porta
    - Alteração do Banco de Dados
  - Versão SSL
    - Alteração da Porta
    - Alteração do Banco de Dados
- Finalização
- Licença

---
---

# Endpoints
O Playstube necessita do uso da API para funcionar, ele se resume a listagem de canais, listagem de vídeos, adição de canal, adição de vídeo, adição de arquivo de vídeo e busca de vídeos.

## Listagem de Canais
Esse endpoint, permite que o cliente (seja ele o site que criamos, ou a aplicação que você está criando) listar os canais existentes. Isso permite que você possa, por exemplo, criar uma overview do canal ao qual o usuário está acessando, além de ser útil para os administradores e usuários saberem quem está com um canal criado.

### Prática
O endpoint é /get-channels. Ele responde o Nome e Descrição do canal, que foram informados na hora da criação do canal.

---

Exemplo de resposta:

```json
{
  "channels": [
    {
      "name": "op3n",
      "desc": "Canal oficial do dono e criador da Hsyst e Playstube!"
    },
    {
      "name": "wagner dev",
      "desc": "canalzin"
    }
  ]
}
```


## Listagem de Vídeos
Semelhante ao /get-channels, ele responde algumas informações do vídeo. Vale destacar que ele responde o nome do arquivo de vídeo que foi feito upload, esse valor é importante, pois você consegue acessar aquele arquivo usando /database/nome-do-arquivo.extenção

### Prática
O endpoint é /get-videos. Ele responde com o nome do arquivo do vídeo, Titulo (name) do vídeo, descrição do vídeo, nome do canal que postou o vídeo, a quanto tempo foi criado (createdIn), e a data ao qual foi criado (createdAt).

---

Você pode ver isso com o exemplo abaixo:

```json
{
  "videos": [
    {
      "videoFile": "GravaÃ§Ã£o de tela de 2025-01-07 14-46-22.mp4",
      "name": "PlaysTube 2",
      "description": "Em breve, disponível também no GitHub.",
      "channel": "op3n",
      "createdIn": "há 2 horas",
      "createdAt": "2025-01-09 20:34:20"
    },
    {
      "videoFile": "VÃ­deo do WhatsApp de 2025-01-05 Ã (s) 18.13.29_6126f03f.mp4",
      "name": "Metallica ou Megadeth?",
      "description": "Metallica.",
      "channel": "Aurosa",
      "createdIn": "há 2 dias",
      "createdAt": "2025-01-07 20:24:10"
    },
    {
      "videoFile": "GravaÃ§Ã£o de tela de 2025-01-04 14-22-37.webm",
      "name": "Quase primeiro vídeo...",
      "description": "Esse vídeo era para ser o primeiro vídeo do PlaysTube, mas o coitado ficou esquecido, mas tá aí a curiosidade...",
      "channel": "op3n",
      "createdIn": "há 2 dias",
      "createdAt": "2025-01-07 20:02:05"
    },
    {
      "videoFile": "GravaÃ§Ã£o de tela de 2025-01-07 16-28-03.mp4",
      "name": "Primeiro Vídeo do Playstube 2.0!",
      "description": "Um vídeo postado por op3n para ser o primeiro vídeo da Plataforma! Tô ansioso pra ver quem vai acessar isso!",
      "channel": "op3n",
      "createdIn": "há 2 dias",
      "createdAt": "2025-01-07 19:51:15"
    }
  ]
}
```


## Adição de Canal
Esse endpoint é responsável por criar os canais no banco de dados, e retornar a "key", que é a chave secreta que é requerida ao criar o canal. Ela também, é a responsável por conferir se o canal já existe, e responder com um "amigão, já existe essa parada aê" caso já exista um canal com aquele nome.

### Prática
Apesar de ser mais um endpoint de ponte entre a api e o sql, a estrutura dele é: `/add-channel?name=NOME_DO_CANAL&desc=DESCRIÇÃO_DO_CANAL`

---

Exemplo de resposta:
`aqui não é necessário, pois sua resposta é apenas apresentada diretamente ao cliente, caso queira ver a resposta, basta criar um canal que a resposta do formulário é a resposta in-natura da api askask`


## Adição de Vídeo
Esse endpoint, é dependente do endpoint /add-video-file, que será o próximo a ser mostrado, pois primeiro o arquivo deve ser enviado (POST) por esse endpoint, para depois esse endpoint aqui, criar o vídeo (GET). Caso queira um exemplo, procure a parte sobe fluxos.

### Prática
A estrutura é: `/add-video?nameofchannel=**NOME_DO_CANAL_AQUI**&name=**TITULO_DO_VÍDEO_AQUI**&desc=**DESCRIÇÃO_DO_VÍDEO_AQUI**&local=ARQUIVO.extenção&key=CHAVE_SECRETA_DO_CANAL`

---

Sua resposta não é relevante aqui, pois você mesmo pode testar aí, e também, pois é apenas uma confirmação -__-


## Adição de Arquivo de Vídeo
Esse endpoint, ele é um endpoint que é uma dependência do /add-video, portanto, ele deve ser executado primeiro, para depois executar o /add-vídeo. Ele é o único aqui que utiliza o método "POST" para enviar o arquivo de vídeo a database. Ou seja, o campo "local" requerido pelo /add-video é o nome do arquivo que será passado para esse endpoint.

---

### Prática
Por ser o único endpoint que é post, será o único endpoint que não terá prática... Boa sorte aí 👍


## Busca de vídeos (query)
Talvez o mais interessante de todos, ele é responsável por pesquisar os vídeos no banco de dados usando lematização, ou seja, se tu escrever Ezemplo, ele vai entender que é Exemplo, e te mostrar vídeo Exemplo 🥳!!!

## Prática
`/query-videos?query=Vídeo de Gatinhos` --- Ele vai pesquisar por "Vídeo de Gatinhos". 🐱



---
---
---

# Fluxos
Nesse projeto, temos apenas um fluxo, que no caso, é o fluxo de postagem de vídeos. Como decidimos separar a parte de postagem com de armazenamento (para mais controle para você, programador), isso acaba se tornando um fluxo, que no caso é:

---

`/add-video-file` (POST)
Ele vai receber o arquivo de vídeo, e enviar para a database, aqui vamos considerar "example.mp4".

---

Após terminar o Upload, e ele responder com Concluido, você pode adicionar o vídeo ao canal.
`/add-video?nameofchannel=**NOME_DO_CANAL_AQUI**&name=**TITULO_DO_VÍDEO_AQUI**&desc=**DESCRIÇÃO_DO_VÍDEO_AQUI**&local=example.mp4&key=CHAVE_SECRETA_DO_CANAL`

---

Já matamos mais um, simbora para o...

# Como executar?
Muito simples, nós criamos o `Tutorial de Uso`, que você e todos podem consultar para entender como baixar, e executar o Playstube 2.0.0.

# Configurações Básicas
Vamos separar pelo Playstube-Main (HTTP), e o Playstube-SSL (HTTPS)/(SSL).

## Playstube-Main

- Linha 13
  - "Configuração da Porta aonde o serviço vai rodar."

- Linha 14
  - "Configuração do nome do arquivo da database."

- Linha 15
  - "Configuração da 'precisão' que o endpoint de query vai precisar ter, dá uma testadinha, custa nada."

- Linha 17
  - "Caso tenha alterado a linha 14, você terá que alterar o nome da database aqui também."

- Linha 19
  - "Configuração da linguagem pra resposta de CreatedIn" (Não nos responsabilizamos por bugs)

- Linha 60 e 61
  - "Alteração de qual é o nome dos endpoints de acesso ao site, e aos vídeos."

- Linha 186
  - "Configuração do formato que será mostrado no CreatedAt."


---

## Playstube-SSL

- Linha 14
  - "Configuração da Porta aonde o serviço vai rodar."

- Linha 15
  - "Configuração do nome do arquivo da database."

- Linha 16
  - "Configuração da 'precisão' que o endpoint de query vai precisar ter, dá uma testadinha, custa nada."

- Linha 18
  - "Caso tenha alterado a linha 14, você terá que alterar o nome da database aqui também."

- Linha 20
  - "Configuração da linguagem pra resposta de CreatedIn" (Não nos responsabilizamos por bugs)

- Linha 65 e 66
  - "Alteração de qual é o nome dos endpoints de acesso ao site, e aos vídeos."

- Linha 165
  - "Configuração do formato que será mostrado no CreatedAt."

- Linha 23/24
  - "Configuração de chaves e certificados SSL"



# Finalização
Agradecemos pela escolha, e esperamos que você goste do Playstube e dos outros projetos daqui da Hsyst, e queremos dizer que tudo isso é uma visão geral da parte técnica do Playstube, porém, recomendamos fortemente que vocês leiam o código, pois pode ter coisas que ainda não foram documentadas aqui 😄...

# Licença
Este projeto está sob a licença da: [The Unlicense](https://github.com/Hsyst/Playstube/blob/main/LICENSE).

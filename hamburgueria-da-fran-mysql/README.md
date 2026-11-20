# Hamburgueria da Fran — Site + Cardápio + Painel + MySQL

Site da hamburgueria em **fundo branco**, com **detalhes vermelhos e textos pretos/brancos**, utilizando a logo original fornecida. Inclui cardápio, fotos, carrinho, formulário de retirada ou entrega, envio de pedido para WhatsApp, vídeo, propagandas e painel de gestão.

**Tecnologias:** Node.js 22+, JavaScript, HTML/CSS, `mysql2` e MySQL 8.0+ ou MariaDB 10.6+. O banco de dados é obrigatório; a versão não utiliza armazenamento de produtos ou pedidos em JSON/SQLite.

## 1. Arquivos importantes

```text
hamburgueria-da-fran-mysql/
├── server.js               # Aplicação e APIs
├── lib/database.js         # Conexão e consultas MySQL
├── sql/schema.sql          # Tabelas, para importar no phpMyAdmin
├── scripts/check-db.js     # Diagnóstico de conexão
├── .env.example            # Exemplo de variáveis
├── package.json
└── public/
    ├── index.html          # Site e cardápio
    ├── admin.html          # Painel protegido por login
    ├── styles.css          # Tema branco/vermelho
    ├── app.js              # Carrinho e checkout
    ├── admin.js            # Administração
    ├── privacidade.html
    ├── assets/logo.png     # Sua logo original
    └── uploads/            # Fotos e vídeos enviados pelo painel
```

O banco utiliza as tabelas **`site_settings`, `products`, `promotions`, `orders`, `order_items`**. Produtos, preços, banners, configurações e pedidos são salvos no MySQL. Arquivos de mídia ficam em `public/uploads/` (ou em `UPLOADS_DIR`) e seus links ficam nas tabelas.

## 2. Instalar pelo VS Code

1. Extraia o ZIP e abra a pasta no VS Code.
2. Instale **Node.js 22.9 ou superior**.
3. Abra o terminal na pasta do projeto e digite:

   ```bash
   npm install
   ```

4. Crie o banco MySQL no seu painel de hospedagem, associe o usuário MySQL ao banco e, se preferir, **importe `sql/schema.sql` no phpMyAdmin**. Não tente criar o banco pelo `server.js`.
5. Faça uma cópia de `.env.example` com nome `.env`; substitua os valores de exemplo pelos reais. Veja o quadro abaixo.
6. Teste a conexão:

   ```bash
   npm run db:check
   ```

7. Inicie:

   ```bash
   npm start
   ```

8. Acesse **http://localhost:3000** (clientes) e **http://localhost:3000/admin** (administração).

No primeiro início, o sistema cria automaticamente as tabelas **dentro do banco já existente** se o usuário tiver permissão `CREATE`. Se ainda não houver configurações, insere seis produtos demonstrativos e um banner demonstrativo. O sistema **não reseta dados** a cada inicialização. Para usuários sem permissão `CREATE`, importe o `sql/schema.sql` manualmente e use `DB_SKIP_SCHEMA=true`.

## 3. Variáveis de ambiente

```dotenv
PORT=3000
HOST=0.0.0.0
ADMIN_EMAIL=seu-email@exemplo.com
ADMIN_PASSWORD=UMA_SENHA_FORTE_COM_PELO_MENOS_12_CARACTERES
SESSION_SECRET=UMA_SEQUENCIA_ALEATORIA_COM_PELO_MENOS_32_CARACTERES
DB_HOST=HOST_REAL_DO_MYSQL
DB_PORT=3306
DB_NAME=NOME_COMPLETO_DO_BANCO
DB_USER=NOME_COMPLETO_DO_USUARIO_MYSQL
DB_PASSWORD=SENHA_REAL_DO_USUARIO_MYSQL
DB_POOL_SIZE=5
WHATSAPP_NUMBER=5594999999999
```

- `DB_HOST`: endereço do servidor MySQL, não é a URL do site. Use exatamente o valor exibido pela hospedagem. `localhost` só funciona quando MySQL e aplicação estão acessíveis nesse mesmo host.
- `DB_NAME`: nome **completo** do banco criado no painel, inclusive prefixo do provedor quando houver.
- `DB_USER`: nome **completo** do usuário do banco, inclusive prefixo.
- `DB_PASSWORD`: senha **do usuário MySQL**, não a senha do painel administrativo.
- `WHATSAPP_NUMBER`: o número de atendimento que recebe os pedidos (Brasil `55` + DDD + número); pode ser alterado no painel.
- `ADMIN_EMAIL` e `ADMIN_PASSWORD`: login de acesso ao painel em `/admin`.
- `SESSION_SECRET`: sequência aleatória de 32 ou mais caracteres; mantenha secreta e estável.
- `DB_SSL=true`: opcional, se o serviço de MySQL exigir TLS. Não ative sem necessidade.
- `DB_SKIP_SCHEMA=true`: opcional, para quando você já importou `sql/schema.sql` e o usuário não pode criar tabelas.
- `UPLOADS_DIR`: opcional, diretório persistente de imagens e vídeos. Banco MySQL **não salva o binário** dos arquivos enviados.

**Segurança:** nunca publique o arquivo `.env` no GitHub; `.gitignore` já o exclui. Não preencha credenciais reais dentro de `.env.example`. Não existe senha administrativa fixa incluída no projeto.

## 4. Hostinger — publicação passo a passo

1. Entre no **hPanel → Bancos de dados MySQL**, crie o banco e o usuário e **vincule o usuário ao banco** com as permissões adequadas.
2. Abra o **phpMyAdmin**, escolha o banco criado e **importe `sql/schema.sql`**. O arquivo não contém informações privadas e não precisa ser editado.
3. Crie a aplicação **Node.js 22+** e envie o projeto (ZIP extraído ou repositório Git).
4. Na configuração da aplicação, use a **pasta que contém `server.js` e `package.json`** como raiz, instale dependências (`npm install`), e defina **`npm start`** como comando de inicialização.
5. No menu **Variáveis de ambiente** da aplicação Node.js, preencha os nomes e valores indicados na seção 3 com informações reais do hPanel. Não use exemplos como `HOST_REAL_DO_MYSQL`.
6. Se as tabelas já foram importadas, `DB_SKIP_SCHEMA=true` pode evitar necessidade de privilégios de criação.
7. Publique/reinicie. Acesse `https://SEU-DOMINIO/api/health`: deve retornar `{"status":"ok","database":"connected",...}`.
8. Acesse `https://SEU-DOMINIO/admin`, informe `ADMIN_EMAIL` e `ADMIN_PASSWORD`, configure o WhatsApp, endereço, horário, preço de entrega, vídeo e propaganda.
9. Substitua produtos/preços de **demonstração** pelos reais e desative o aviso de demonstração em **Personalizar site**.

**Problemas comuns de conexão**

| Código | Causa provável e correção |
| --- | --- |
| `ER_DBACCESS_DENIED_ERROR` | O usuário existe, porém **não possui acesso ao banco configurado**. No hPanel, associe usuário/banco e confira `DB_USER` e `DB_NAME` completos. Trocar código-fonte ou senha de administrador não resolve esse erro. |
| `ER_ACCESS_DENIED_ERROR` | Confirme `DB_USER` e `DB_PASSWORD`. |
| `ER_BAD_DB_ERROR` | O banco `DB_NAME` não existe ou está com nome incorreto. |
| `ENOTFOUND` | `DB_HOST` está incorreto. Não utilize endereço fictício. |
| `ECONNREFUSED` | Host, porta ou acesso ao MySQL estão incorretos/bloqueados. |
| `ETIMEDOUT` | Possível bloqueio de rede ou conexão remota MySQL desabilitada. |
| `ER_TABLEACCESS_DENIED_ERROR` | Falta permissão para criar tabelas; importe `sql/schema.sql` pelo phpMyAdmin e configure `DB_SKIP_SCHEMA=true`. |

**Persistência:** o MySQL armazena os registros comerciais. Se a hospedagem apagar os arquivos enviados a cada deploy, as fotos/vídeos no diretório de uploads serão perdidos. Configure `UPLOADS_DIR` para uma pasta persistente autorizada pelo provedor e mantenha backups do banco e das mídias.

## 5. Fluxo de compra e painel administrativo

1. O cliente abre o cardápio, escolhe produtos e ajusta quantidades no carrinho.
2. Informa **nome**, **WhatsApp**, **retirada/entrega**; para entrega, informa **endereço completo** e **ponto de referência** (obrigatórios).
3. Pode informar pagamento e observações.
4. O servidor **recalcula os valores com base nos preços do MySQL** e registra o pedido e seus itens no banco.
5. O cliente é redirecionado para o **WhatsApp da hamburgueria com a mensagem preenchida** e deve clicar em **Enviar** no WhatsApp.

O painel permite gerenciar produtos, preços, categorias, fotos, disponibilidade, banners de propaganda, vídeo e logo; cadastrar configurações e **consultar/alterar o status de pedidos**.

**Importante:** pedido salvo no MySQL = **pedido iniciado no site**, não confirmação de mensagem enviada. A abertura do WhatsApp não confirma que o cliente enviou a mensagem. Confirme o pedido com o cliente antes de preparar. Não há pagamento automático, integração com meios de pagamento, nem envio automático por WhatsApp API.

**Taxa de entrega:** se vazia, o site exibe “a confirmar”; se fixa, adiciona a taxa ao total. Para cálculos por bairro/distância, é necessário desenvolvimento adicional.

## 6. Backup e proteção de dados

Trate os registros de nomes, telefones e endereços como dados pessoais: acesso restrito ao painel, HTTPS em produção, senha forte, backup, política de retenção, exclusão conforme necessidades e revisão do aviso de privacidade antes da publicação. Exporte backups pelo painel de MySQL da hospedagem ou pelo phpMyAdmin. Não compartilhe dumps de produção sem proteção.

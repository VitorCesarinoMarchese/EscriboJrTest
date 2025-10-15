# EscriboJrTest

# Database

O objetivo do projeto e desenvolver um sistema de e-commerce com tabelas para gerenciar clientes, produtos e pedidos

## Schema

![image.png](attachment:d4be4db0-69cf-4b6c-8ea0-a7eee6128baf:image.png)

## Tabelas

### Client

| Campo          | Tipo          | Descrição                                                                                                                                                                          |
| -------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **id**         | `uuid`        | Identificador único do cliente (chave primária). Usando UUID para garantir unicidade global, maior segurança e facilidade de integração com sistemas distribuídos.                 |
| **name**       | `text`        | Nome completo do cliente.                                                                                                                                                          |
| **email**      | `text`        | Endereço de e-mail do cliente (deve ser único no sistema).                                                                                                                         |
| **address**    | `text`        | Endereço físico ou principal do cliente.                                                                                                                                           |
| **is_active**  | `boolean`     | Indica se o cliente está ativo na plataforma. Esse valor é definido com base na atividade recente — se o cliente não realiza pedidos por um determinado período, torna-se `false`. |
| **birth_date** | `date`        | Data de nascimento do cliente.                                                                                                                                                     |
| **created_at** | `timestamptz` | Data e hora em que o registro do cliente foi criado.                                                                                                                               |
| **updated_at** | `timestamptz` | Data e hora da última atualização das informações do cliente.                                                                                                                      |

### Order

| Campo                | Tipo                                  | Descrição                                                                                                                                                                     |
| -------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **id**               | `uuid`                                | Identificador único do pedido (chave primária).                                                                                                                               |
| **client_id**        | `uuid`                                | Identificador único do cliente que realizou o pedido (chave estrangeira para `client.id`).                                                                                    |
| **order_date**       | `timestamptz`                         | Data e hora em que o pedido foi realizado.                                                                                                                                    |
| **delivery_address** | `text`                                | Endereço de entrega selecionado para o pedido.                                                                                                                                |
| **status**           | `order_status` _(enum customizado)_   | Estado atual do pedido. Valores possíveis: `'aguardando_pagamento'`, `'gerando_nota_fiscal'`, `'pedido_recebido'`, `'enviado_transportadora'`, `'em_transito'`, `'entregue'`. |
| **payment_method**   | `payment_method` _(enum customizado)_ | Método de pagamento utilizado. Valores possíveis: `'credito'`, `'pix'`, `'boleto'`.                                                                                           |
| **total**            | `numeric(10,2)`                       | Valor total do pedido.                                                                                                                                                        |
| **created_at**       | `timestamptz`                         | Data e hora de criação do registro.                                                                                                                                           |
| **updated_at**       | `timestamptz`                         | Data e hora da última atualização.                                                                                                                                            |

### Product

| Campo          | Tipo            | Descrição                                                                                                                                                                      |
| -------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **id**         | `uuid`          | Identificador único do produto (chave primária).                                                                                                                               |
| **name**       | `text`          | Nome do produto.                                                                                                                                                               |
| **price**      | `numeric(10,2)` | Preço do produto.                                                                                                                                                              |
| **category**   | `text`          | Categoria do produto. Pode ser livre (`text`) se não houver um conjunto fixo de categorias, mas considerar criar um **enum** se futuramente for necessario limitar os valores. |
| **stock**      | `integer`       | Quantidade disponível em estoque.                                                                                                                                              |
| **created_at** | `timestamptz`   | Data e hora de criação do registro do produto.                                                                                                                                 |
| **updated_at** | `timestamptz`   | Data e hora da última atualização do produto.                                                                                                                                  |

### Item

| Campo          | Tipo            | Descrição                                                                            |
| -------------- | --------------- | ------------------------------------------------------------------------------------ |
| **id**         | `uuid`          | Identificador único do item do pedido (chave primária).                              |
| **order_id**   | `uuid`          | Referência ao pedido ao qual este item pertence (chave estrangeira para `order.id`). |
| **product_id** | `uuid`          | Referência ao produto deste item (chave estrangeira para `product.id`).              |
| **amount**     | `smallint`      | Quantidade de unidades deste produto no pedido.                                      |
| **total**      | `numeric(10,2)` | Valor total deste item (`amount * preço do produto`).                                |
| **created_at** | `timestamptz`   | Data e hora de criação do registro do item.                                          |
| **updated_at** | `timestamptz`   | Data e hora da última atualização do item.                                           |


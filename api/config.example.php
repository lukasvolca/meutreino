<?php
// Copie para config.php (que fica fora do git) e preencha.
return [
  'db' => [
    'host' => 'localhost',
    'name' => 'USUARIO_meutreino',
    'user' => 'USUARIO_mtapp',
    'pass' => 'SENHA_DO_BANCO',
    'charset' => 'utf8mb4',
  ],
  'allow_signup' => true,   // false para fechar novos cadastros
  'secret' => 'troque-por-um-valor-aleatorio',
];

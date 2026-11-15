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
  // Leitura de fichas por foto/PDF (Perfil → Importar)
  'import_provider' => 'gemini',        // 'gemini' (tem nível gratuito) ou 'claude' (pago)
  'gemini_key' => '',                   // chave do Google AI Studio (aistudio.google.com)
  'gemini_model' => 'gemini-3.6-flash', // modelo do Gemini; vazio = padrão do importar.php
  'gemini_reserva' => 'gemini-3.8-flash', // usado quando o principal falha ou demora
  'anthropic_key' => '',                // chave da API da Anthropic (console.anthropic.com), se usar 'claude'
];

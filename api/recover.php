<?php
// Recuperação de senha por e-mail (mesmo esquema do Mottiro):
//   POST /api/auth/recover {email}            → envia link de uso único (30 min); resposta sempre neutra
//   POST /api/auth/reset   {token, password}  → troca a senha, encerra as outras sessões e entra

const APP_ORIGIN = 'https://treino.volca.com.br';
const MAIL_FROM = 'MeuTreino <nao-responda@volca.com.br>';

/** true se ainda cabe mais uma tentativa para a chave $k na janela. Registra a tentativa. */
function throttle_ok(string $k, int $max, int $janelaSeg): bool {
  $pdo = db();
  $pdo->prepare('DELETE FROM throttle WHERE at < ?')->execute([gmdate('Y-m-d H:i:s', time() - 86400)]);
  $st = $pdo->prepare('SELECT COUNT(*) FROM throttle WHERE k = ? AND at >= ?');
  $st->execute([$k, gmdate('Y-m-d H:i:s', time() - $janelaSeg)]);
  if ((int)$st->fetchColumn() >= $max) return false;
  $pdo->prepare('INSERT INTO throttle (k) VALUES (?)')->execute([$k]);
  return true;
}

function auth_recover(array $b): void {
  $ip = $_SERVER['REMOTE_ADDR'] ?? '';
  if (!throttle_ok('rec-ip:' . $ip, 8, 3600)) fail('Muitas tentativas. Tente de novo mais tarde.', 429, 'rate_limited');
  $email = strtolower(trim((string)($b['email'] ?? '')));
  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Informe um e-mail válido', 400, 'invalid_email');

  // Resposta é sempre a mesma: não revela se o e-mail tem conta
  $neutra = ['data' => ['enviado' => true], 'error' => null];
  if (!throttle_ok('rec-email:' . hash('sha256', $email), 3, 3600)) respond($neutra);

  $pdo = db();
  $st = $pdo->prepare('SELECT id FROM users WHERE email = ?');
  $st->execute([$email]);
  $uid = $st->fetchColumn();
  if (!$uid) respond($neutra);

  $token = bin2hex(random_bytes(32));
  $pdo->prepare('DELETE FROM password_resets WHERE user_id = ? AND used_at IS NULL')->execute([$uid]);   // só o link mais novo vale
  $pdo->prepare('INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
      ->execute([hash('sha256', $token), $uid, gmdate('Y-m-d H:i:s', time() + 1800)]);

  $link = APP_ORIGIN . '/nova-senha/?token=' . $token;
  $msg = "Olá!\n\nRecebemos um pedido para redefinir a senha do seu MeuTreino.\n\n"
       . "Abra este link para escolher uma nova senha:\n$link\n\n"
       . "O link vale por 30 minutos e só pode ser usado uma vez.\n"
       . "Se não foi você, ignore esta mensagem: sua senha continua a mesma.\n\nMeuTreino";
  $ok = mail($email, mb_encode_mimeheader('Redefina sua senha do MeuTreino', 'UTF-8'), $msg,
    "From: " . MAIL_FROM . "\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit");
  if (!$ok) {
    $pdo->prepare('DELETE FROM password_resets WHERE token_hash = ?')->execute([hash('sha256', $token)]);
    error_log('[meutreino] recuperação: mail() recusou a mensagem');
  }
  respond($neutra);
}

function auth_reset(array $b): void {
  $ip = $_SERVER['REMOTE_ADDR'] ?? '';
  if (!throttle_ok('reset-ip:' . $ip, 10, 3600)) fail('Muitas tentativas. Tente de novo mais tarde.', 429, 'rate_limited');
  $token = (string)($b['token'] ?? '');
  $pass = (string)($b['password'] ?? '');
  if (!preg_match('/^[a-f0-9]{64}$/', $token)) fail('Link inválido ou expirado', 400, 'invalid_token');
  if (strlen($pass) < 6) fail('A senha precisa ter pelo menos 6 caracteres', 400, 'weak_password');

  $pdo = db();
  $h = hash('sha256', $token);
  $st = $pdo->prepare('SELECT user_id FROM password_resets WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?');
  $st->execute([$h, gmdate('Y-m-d H:i:s')]);
  $uid = $st->fetchColumn();
  if (!$uid) fail('Este link expirou ou já foi usado. Peça um novo.', 400, 'invalid_token');

  $pdo->beginTransaction();
  $pdo->prepare('UPDATE password_resets SET used_at = ? WHERE token_hash = ?')->execute([gmdate('Y-m-d H:i:s'), $h]);
  $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([password_hash($pass, PASSWORD_DEFAULT), $uid]);
  $pdo->prepare('DELETE FROM sessions WHERE user_id = ?')->execute([$uid]);   // encerra sessões antigas
  $pdo->commit();

  start_session($uid);
  respond(['data' => ['ok' => true], 'error' => null]);
}

<?php
// Cadastro, login, logout e "quem sou eu".

function too_many_attempts(string $ip): bool {
  $pdo = db();
  $pdo->prepare('DELETE FROM login_attempts WHERE at < ?')->execute([gmdate('Y-m-d H:i:s', time() - 900)]);
  $st = $pdo->prepare('SELECT COUNT(*) FROM login_attempts WHERE ip = ?');
  $st->execute([$ip]);
  return (int)$st->fetchColumn() >= 10;   // 10 tentativas erradas a cada 15 min por IP
}

function auth_signup(array $b): void {
  if (!(config()['allow_signup'] ?? false)) fail('Cadastro fechado', 403, 'signup_closed');
  $email = strtolower(trim($b['email'] ?? ''));
  $pass = (string)($b['password'] ?? '');
  $nome = trim((string)($b['nome'] ?? ''));
  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('E-mail inválido', 400, 'invalid_email');
  if (strlen($pass) < 6) fail('A senha precisa ter pelo menos 6 caracteres', 400, 'weak_password');

  $pdo = db();
  $st = $pdo->prepare('SELECT 1 FROM users WHERE email = ?');
  $st->execute([$email]);
  if ($st->fetch()) fail('Já existe uma conta com esse e-mail', 409, 'user_already_exists');

  $id = uuid4();
  $pdo->beginTransaction();
  $pdo->prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)')
      ->execute([$id, $email, password_hash($pass, PASSWORD_DEFAULT)]);
  $pdo->prepare('INSERT INTO profiles (id, nome) VALUES (?, ?)')
      ->execute([$id, $nome !== '' ? mb_substr($nome, 0, 120) : explode('@', $email)[0]]);
  $pdo->commit();

  start_session($id);
  respond(['data' => ['user' => ['id' => $id, 'email' => $email]], 'error' => null]);
}

function auth_login(array $b): void {
  $ip = $_SERVER['REMOTE_ADDR'] ?? '';
  if (too_many_attempts($ip)) fail('Muitas tentativas. Espere alguns minutos.', 429, 'rate_limited');
  $email = strtolower(trim($b['email'] ?? ''));
  $pass = (string)($b['password'] ?? '');
  $st = db()->prepare('SELECT id, password_hash FROM users WHERE email = ?');
  $st->execute([$email]);
  $u = $st->fetch();
  if (!$u || !password_verify($pass, $u['password_hash'])) {
    db()->prepare('INSERT INTO login_attempts (ip) VALUES (?)')->execute([$ip]);
    usleep(400000);
    fail('E-mail ou senha incorretos', 400, 'invalid_credentials');
  }
  if (password_needs_rehash($u['password_hash'], PASSWORD_DEFAULT)) {
    db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([password_hash($pass, PASSWORD_DEFAULT), $u['id']]);
  }
  start_session($u['id']);
  respond(['data' => ['user' => ['id' => $u['id'], 'email' => $email]], 'error' => null]);
}

function auth_logout(): void {
  $token = $_COOKIE[SESSION_COOKIE] ?? '';
  if ($token) db()->prepare('DELETE FROM sessions WHERE token_hash = ?')->execute([hash('sha256', $token)]);
  set_session_cookie('', -1);
  respond(['data' => null, 'error' => null]);
}

function auth_me(): void {
  $uid = current_user_id();
  if (!$uid) respond(['data' => ['user' => null], 'error' => null]);
  $st = db()->prepare('SELECT u.id, u.email, p.nome, p.objetivo, p.role FROM users u JOIN profiles p ON p.id = u.id WHERE u.id = ?');
  $st->execute([$uid]);
  $u = $st->fetch();
  respond(['data' => ['user' => $u ? [
    'id' => $u['id'], 'email' => $u['email'],
    'profile' => ['nome' => $u['nome'], 'objetivo' => $u['objetivo'], 'role' => $u['role']],
  ] : null], 'error' => null]);
}

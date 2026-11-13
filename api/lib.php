<?php
// Utilitários: resposta JSON, conexão, sessão e UUID.

function config(): array {
  static $c = null;
  if ($c === null) {
    $f = __DIR__ . '/config.php';
    if (!file_exists($f)) respond(['error' => ['message' => 'API sem config.php']], 500);
    $c = require $f;
  }
  return $c;
}

function respond($body, int $status = 200): void {
  http_response_code($status);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_PRESERVE_ZERO_FRACTION);
  exit;
}

function fail(string $message, int $status = 400, string $code = ''): void {
  respond(['data' => null, 'error' => ['message' => $message, 'code' => $code ?: (string)$status]], $status);
}

function body(): array {
  $raw = file_get_contents('php://input');
  $j = json_decode($raw ?: '{}', true);
  return is_array($j) ? $j : [];
}

function db(): PDO {
  static $pdo = null;
  if ($pdo) return $pdo;
  $d = config()['db'];
  try {
    $pdo = new PDO("mysql:host={$d['host']};dbname={$d['name']};charset={$d['charset']}", $d['user'], $d['pass'], [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
      PDO::ATTR_EMULATE_PREPARES => false,
    ]);
  } catch (Throwable $e) {
    fail('Falha ao conectar ao banco de dados', 500, 'db_connect');
  }
  $pdo->exec("SET time_zone = '+00:00'");
  migrate($pdo);
  return $pdo;
}

function migrate(PDO $pdo): void {
  $have = 0;
  try { $have = (int)$pdo->query("SELECT v FROM meta WHERE k = 'schema'")->fetchColumn(); } catch (Throwable $e) {}
  if ($have >= SCHEMA_VERSION) return;
  foreach (schema_sql() as $sql) $pdo->exec($sql);
  $pdo->prepare("REPLACE INTO meta (k, v) VALUES ('schema', ?)")->execute([(string)SCHEMA_VERSION]);
}

function uuid4(): string {
  $b = random_bytes(16);
  $b[6] = chr((ord($b[6]) & 0x0f) | 0x40);
  $b[8] = chr((ord($b[8]) & 0x3f) | 0x80);
  return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($b), 4));
}

// Agora em UTC com milissegundos (formato do MySQL). $offsetMs separa linhas inseridas juntas.
function now_db(int $offsetMs = 0): string {
  $t = microtime(true) + $offsetMs / 1000;
  return gmdate('Y-m-d H:i:s', (int)$t) . sprintf('.%03d', (int)(($t - floor($t)) * 1000));
}

// ── Sessão (cookie HttpOnly com token aleatório; no banco só o hash) ─────────

const SESSION_COOKIE = 'mt_session';

function set_session_cookie(string $token, int $ttl): void {
  setcookie(SESSION_COOKIE, $token, [
    'expires' => $ttl > 0 ? time() + $ttl : time() - 3600,
    'path' => '/',
    'secure' => true,
    'httponly' => true,
    'samesite' => 'Lax',
  ]);
}

function start_session(string $userId): void {
  $token = bin2hex(random_bytes(32));
  db()->prepare('INSERT INTO sessions (token_hash, user_id) VALUES (?, ?)')->execute([hash('sha256', $token), $userId]);
  set_session_cookie($token, 60 * 60 * 24 * 365);
}

function current_user_id(): ?string {
  static $uid = false;
  if ($uid !== false) return $uid;
  $uid = null;
  $token = $_COOKIE[SESSION_COOKIE] ?? '';
  if (!preg_match('/^[a-f0-9]{64}$/', $token)) return null;
  $h = hash('sha256', $token);
  $st = db()->prepare('SELECT user_id, last_seen FROM sessions WHERE token_hash = ?');
  $st->execute([$h]);
  $row = $st->fetch();
  if (!$row) return null;
  // Atualiza "visto por último" no máximo 1x por dia
  if (strtotime($row['last_seen'] . ' UTC') < time() - 86400) {
    db()->prepare('UPDATE sessions SET last_seen = ? WHERE token_hash = ?')->execute([now_db(), $h]);
  }
  return $uid = $row['user_id'];
}

function require_user(): string {
  $uid = current_user_id();
  if (!$uid) fail('Não autenticado', 401, 'unauthorized');
  return $uid;
}

<?php
// Login com Google (OpenID Connect, código de autorização + PKCE + nonce).
// O segredo do cliente fica em api/google-oauth.json (fora do git e bloqueado no .htaccess).
//   GET /api/auth/google/start     → manda para a tela de escolha de conta do Google
//   GET /api/auth/google/callback  → o Google volta aqui; criamos a sessão e voltamos ao app

const OAUTH_COOKIE = 'mt_oauth';

function google_cfg(): ?array {
  $f = __DIR__ . '/google-oauth.json';
  if (!is_file($f)) return null;
  $c = json_decode((string)file_get_contents($f), true);
  return (is_array($c) && !empty($c['client_id']) && !empty($c['client_secret']) && !empty($c['redirect_uri'])) ? $c : null;
}

function b64url(string $bin): string { return rtrim(strtr(base64_encode($bin), '+/', '-_'), '='); }

function back_to_app(string $path): void {
  header('Cache-Control: no-store');
  header('Location: ' . $path, true, 302);
  exit;
}

function google_start(): void {
  $cfg = google_cfg();
  if (!$cfg) back_to_app('/login/?erro=google_off');

  $state = bin2hex(random_bytes(32));
  $nonce = bin2hex(random_bytes(32));
  $verifier = b64url(random_bytes(48));
  $pdo = db();
  $pdo->prepare('DELETE FROM oauth_flows WHERE created_at < ?')->execute([gmdate('Y-m-d H:i:s', time() - 900)]);
  $pdo->prepare('INSERT INTO oauth_flows (state, nonce, verifier) VALUES (?, ?, ?)')->execute([$state, $nonce, $verifier]);

  // Amarra o fluxo a este navegador (o Google volta por navegação comum, então SameSite=Lax chega)
  setcookie(OAUTH_COOKIE, $state, ['expires' => time() + 600, 'path' => '/api/auth/google/', 'secure' => true, 'httponly' => true, 'samesite' => 'Lax']);

  $q = http_build_query([
    'client_id' => $cfg['client_id'],
    'redirect_uri' => $cfg['redirect_uri'],
    // "code id_token" faz o Google devolver os dados no fragmento (#), que o navegador não
    // envia ao servidor: o ModSecurity da HostGator bloqueia o retorno em query string
    // (scope/iss trazem URLs). A página de retorno lê o fragmento e envia por POST.
    // Só usamos o código; o id_token confiável vem da troca direta com o Google.
    'response_type' => 'code id_token',
    'response_mode' => 'fragment',
    'scope' => 'openid email profile',
    'state' => $state,
    'nonce' => $nonce,
    'code_challenge' => b64url(hash('sha256', $verifier, true)),
    'code_challenge_method' => 'S256',
    'prompt' => 'select_account',
  ], '', '&', PHP_QUERY_RFC3986);
  back_to_app('https://accounts.google.com/o/oauth2/v2/auth?' . $q);
}

function google_post(string $url, array $fields): ?array {
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => http_build_query($fields, '', '&', PHP_QUERY_RFC3986),
    CURLOPT_CONNECTTIMEOUT => 5, CURLOPT_TIMEOUT => 15, CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_PROTOCOLS => CURLPROTO_HTTPS, CURLOPT_SSL_VERIFYPEER => true, CURLOPT_SSL_VERIFYHOST => 2,
    CURLOPT_HTTPHEADER => ['Accept: application/json'],
  ]);
  $raw = curl_exec($ch);
  $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  if ($raw === false || $status !== 200) return null;
  $j = json_decode($raw, true);
  return is_array($j) ? $j : null;
}

function jwt_claims(string $jwt): ?array {
  $p = explode('.', $jwt);
  if (count($p) !== 3) return null;
  $json = base64_decode(strtr($p[1], '-_', '+/'), true);
  $c = $json === false ? null : json_decode($json, true);
  return is_array($c) ? $c : null;
}

/** GET do retorno: página mínima que lê o fragmento (#) e reenvia por POST para cá. */
function google_callback_page(): void {
  header('Content-Type: text/html; charset=utf-8');
  header('Cache-Control: no-store');
  header("Content-Security-Policy: default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'");
  echo <<<'HTML'
<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="referrer" content="no-referrer"><title>Entrando… · MeuTreino</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0d0e12;color:#fff;font-family:system-ui,sans-serif}p{color:rgba(255,255,255,.62)}a{color:#CCFF00}</style>
</head><body><main style="text-align:center;padding:24px"><h1 style="font-size:22px">Entrando com Google…</h1><p id="msg" role="status">Só um instante.</p>
<form id="f" method="post" action="/api/auth/google/callback" hidden>
<input type="hidden" name="state"><input type="hidden" name="code"><input type="hidden" name="error"></form>
<script>
(function () {
  var p = new URLSearchParams(location.hash.slice(1));
  history.replaceState(null, '', '/api/auth/google/callback');
  var state = p.get('state') || '', code = p.get('code') || '', error = p.get('error') || '';
  if (!/^[a-f0-9]{64}$/.test(state) || code.length > 4096 || error.length > 256 || (!code && !error)) {
    document.getElementById('msg').innerHTML = 'Retorno inválido ou antigo. <a href="/login/">Voltar e tentar de novo</a>.';
    return;
  }
  var f = document.getElementById('f');
  f.elements.state.value = state; f.elements.code.value = code; f.elements.error.value = error;
  f.submit();
})();
</script></main></body></html>
HTML;
  exit;
}

function google_callback(): void {
  $cfg = google_cfg();
  if (!$cfg) back_to_app('/login/?erro=google_off');

  $state = (string)($_POST['state'] ?? '');
  $cookie = (string)($_COOKIE[OAUTH_COOKIE] ?? '');
  setcookie(OAUTH_COOKIE, '', ['expires' => time() - 3600, 'path' => '/api/auth/google/', 'secure' => true, 'httponly' => true, 'samesite' => 'Lax']);
  if (!empty($_POST['error'])) back_to_app('/login/?erro=google_cancelado');
  if (!preg_match('/^[a-f0-9]{64}$/', $state) || !hash_equals($cookie, $state)) back_to_app('/login/?erro=google_expirado');

  $pdo = db();
  $st = $pdo->prepare('SELECT nonce, verifier, created_at FROM oauth_flows WHERE state = ?');
  $st->execute([$state]);
  $flow = $st->fetch();
  $pdo->prepare('DELETE FROM oauth_flows WHERE state = ?')->execute([$state]);   // uso único
  if (!$flow || strtotime($flow['created_at'] . ' UTC') < time() - 600) back_to_app('/login/?erro=google_expirado');

  $code = (string)($_POST['code'] ?? '');
  if ($code === '' || strlen($code) > 4096) back_to_app('/login/?erro=google');

  // Troca o código pelo id_token direto com o Google (TLS verificado), com o verificador PKCE
  $tok = google_post('https://oauth2.googleapis.com/token', [
    'code' => $code, 'client_id' => $cfg['client_id'], 'client_secret' => $cfg['client_secret'],
    'redirect_uri' => $cfg['redirect_uri'], 'grant_type' => 'authorization_code', 'code_verifier' => $flow['verifier'],
  ]);
  $c = is_string($tok['id_token'] ?? null) ? jwt_claims($tok['id_token']) : null;
  unset($tok);

  // id_token recebido do próprio endpoint do Google por TLS: valida emissor, público, validade e nonce
  $now = time();
  $ok = $c
    && in_array($c['iss'] ?? '', ['https://accounts.google.com', 'accounts.google.com'], true)
    && ($c['aud'] ?? null) === $cfg['client_id']
    && is_int($c['exp'] ?? null) && $c['exp'] > $now
    && is_int($c['iat'] ?? null) && $c['iat'] < $now + 60
    && is_string($c['nonce'] ?? null) && hash_equals($flow['nonce'], $c['nonce'])
    && is_string($c['sub'] ?? null) && $c['sub'] !== '';
  if (!$ok) { error_log('[meutreino] google: id_token inválido'); back_to_app('/login/?erro=google'); }

  $sub = $c['sub'];
  $email = strtolower(trim((string)($c['email'] ?? '')));
  $verificado = ($c['email_verified'] ?? false) === true || ($c['email_verified'] ?? '') === 'true';
  $nome = trim((string)($c['name'] ?? $c['given_name'] ?? ''));

  // 1) Google já vinculado
  $st = $pdo->prepare("SELECT user_id FROM user_identities WHERE provider = 'google' AND sub = ?");
  $st->execute([$sub]);
  $uid = $st->fetchColumn() ?: null;

  if (!$uid) {
    if ($email === '' || !$verificado) back_to_app('/login/?erro=google_email');
    // 2) Já existe conta com esse e-mail (confirmado pelo Google): vincula
    $st = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $st->execute([$email]);
    $uid = $st->fetchColumn() ?: null;

    $pdo->beginTransaction();
    if (!$uid) {
      // 3) Conta nova, sem senha (entra só pelo Google até definir uma)
      $uid = uuid4();
      $pdo->prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)')->execute([$uid, $email, '']);
      $pdo->prepare('INSERT INTO profiles (id, nome) VALUES (?, ?)')
          ->execute([$uid, $nome !== '' ? mb_substr($nome, 0, 120) : explode('@', $email)[0]]);
    }
    $pdo->prepare("INSERT INTO user_identities (provider, sub, user_id, email) VALUES ('google', ?, ?, ?)")
        ->execute([$sub, $uid, $email]);
    $pdo->commit();
  }

  start_session($uid);
  back_to_app('/dashboard/');
}

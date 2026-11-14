<?php
// API do MeuTreino (HostGator). Rotas:
//   GET  /api/auth/me        POST /api/auth/login | /api/auth/signup | /api/auth/logout
//   POST /api/q              consulta genérica (ver query.php)
//   GET  /api/auth/google/start | /api/auth/google/callback   login com Google (google.php)
//   GET  /api/health

require __DIR__ . '/schema.php';
require __DIR__ . '/lib.php';
require __DIR__ . '/auth.php';
require __DIR__ . '/query.php';
require __DIR__ . '/google.php';

header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');

$path = '/' . trim(preg_replace('#^.*/api#', '', parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH)), '/');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Proteção contra CSRF: escrita só com o cabeçalho X-MT (o navegador não deixa
// outro site enviar cabeçalho próprio sem CORS, e esta API não libera CORS).
// Exceção: o retorno do Google chega por formulário comum e é protegido pelo state
// de uso único amarrado ao cookie do navegador (google.php).
if ($method !== 'GET' && $path !== '/auth/google/callback' && ($_SERVER['HTTP_X_MT'] ?? '') !== '1') fail('Requisição inválida', 400, 'bad_request');

if ($path === '/health') respond(['ok' => true, 'php' => PHP_VERSION, 'db' => (bool)db()]);
if ($path === '/auth/me' && $method === 'GET') auth_me();
if ($path === '/auth/login' && $method === 'POST') auth_login(body());
if ($path === '/auth/signup' && $method === 'POST') auth_signup(body());
if ($path === '/auth/logout' && $method === 'POST') auth_logout();
if ($path === '/q' && $method === 'POST') q_handle(body());
if ($path === '/auth/google/start' && $method === 'GET') google_start();
if ($path === '/auth/google/callback' && $method === 'GET') google_callback_page();
if ($path === '/auth/google/callback' && $method === 'POST') google_callback();

fail('Rota não encontrada', 404, 'not_found');

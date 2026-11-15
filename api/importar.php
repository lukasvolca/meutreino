<?php
// Importar ficha de treino a partir de foto, print ou PDF (leitura feita por IA).
//   POST /api/importar          multipart: arquivos[] (até 6 imagens/PDFs) → fichas lidas, para revisão
//   POST /api/importar/salvar   JSON: {importacao_id, modo, fichas[]} → grava as fichas revisadas
//
// Provedor escolhido em config.php ('import_provider'): 'gemini' (padrão, tem nível gratuito)
// ou 'claude'. As chamadas são HTTP direto (curl): a hospedagem não tem Composer/SSH para
// instalar SDKs, e é uma única requisição.

const GEMINI_MODEL = 'gemini-3.8-flash';   // dá para trocar em config.php ('gemini_model')
const GEMINI_RESERVA = 'gemini-3.6-flash'; // usado quando o principal está sobrecarregado ('gemini_reserva')
const CLAUDE_MODEL = 'claude-opus-5-5';
const IMPORT_MAX_ARQUIVOS = 6;
const IMPORT_MAX_BYTES = 10 * 1024 * 1024;      // por arquivo
const IMPORT_MAX_TOTAL = 15 * 1024 * 1024;      // soma (em base64 cresce ~33% e vai inteiro na memória)
const IMPORT_MAX_IMG = 5 * 1024 * 1024;         // limite por imagem (o menor entre os provedores)
const IMPORT_POR_DIA = 15;                      // leituras por usuário a cada 24 h

function importar_prompt(): string {
  return <<<TXT
Você converte fichas de treino de musculação (fotos, prints ou PDFs feitos por personal trainers brasileiros) para o formato do app MeuTreino. Leia todas as páginas e imagens enviadas como partes de uma mesma ficha.

Regras de leitura:
- Cada bloco "TREINO A", "TREINO B"… vira uma ficha. letra = a letra do treino; nome = a linha de grupos musculares (ex.: "Bíceps e Tríceps / Abdômen e Panturrilha"). Se não houver letra, use A, B, C… na ordem.
- Mantenha a ordem dos exercícios como está na ficha.
- Nome do exercício: escreva por extenso e com acento, desfazendo abreviações óbvias (Pux → Puxada, Rosc → Rosca, Tríc → Tríceps, Inver → Inversa, Agach → Agachamento, Uni → Unilateral, Máq → Máquina). Não invente equipamento nem variação que não esteja escrita. Copie o texto exato da linha em texto_original.
- Bi-set: quando a linha junta dois exercícios com "+" e as séries vêm como "3 + 3" (ou as repetições como "8 a 12+8 a 12"), é um bi-set. Use is_biset = true, nome = "Exercício 1 + Exercício 2", series = o número de séries de cada um (3 em "3 + 3") e reps = as repetições de um deles ("8 a 12").
- Série extra até a falha: "3+1" com "12+falha" significa 3 séries de 12 e mais 1 até a falha. Use series = 4, reps = "12" e ultima_ate_falha = true. Use ultima_ate_falha = true sempre que a ficha disser que a última série vai até a falha.
- Faixas de repetição: escreva como na ficha, curto ("8 a 12", "12 a 15", "20"). No máximo 14 caracteres.
- Exercício por tempo (prancha, isometria): tipo = "iso", duracao_seg = tempo de cada série em segundos, reps = "". Na notação brasileira ' é minuto e " é segundo, mas fichas costumam usar ' para segundos em pranchas. Escolha o valor plausível (prancha de 20' quase sempre é 20 segundos), marque confianca = "baixa" e explique em motivo_duvida.
- Cardio dentro da lista de exercícios: tipo = "cardio", duracao_min = minutos, intensidade em observacao.
- Descanso: se houver regra geral (ex.: "MMII 50\" / MMSS 40\"" = membros inferiores 50 s, superiores 40 s), aplique em descanso_seg conforme o exercício (pernas, glúteos e panturrilha = inferiores; peito, costas, ombro, braços = superiores; abdômen segue a regra dos superiores salvo indicação). Sem regra, deixe null.
- Carga: só preencha se estiver escrita na ficha; senão null. Em bi-set, carga_b é a carga do segundo exercício.
- grupo: o grupo muscular principal do exercício em uma ou duas palavras (ex.: "Bíceps", "Costas", "Quadríceps").
- confianca = "baixa" quando a leitura estiver borrada, cortada, ambígua ou você tiver interpretado algo; diga o motivo em motivo_duvida (curto, em português). Caso contrário "alta" e motivo_duvida = null.

Programa (o que não cabe nos exercícios, guarde aqui sem inventar nada):
- semanas: a rotação de treinos por semana (ex.: S1 = A B C D A B), um item por dia da semana; letra = null nos dias sem treino. metodologia e progressao_carga como escritas (ex.: "Choque", "S1 +10%").
- cardio: minutos antes e depois do treino, e por semana os minutos, a faixa de bpm e o método.
- observacoes: outras orientações gerais da ficha, uma por item.
- Se não houver essas informações, use listas vazias e null.

avisos: problemas que o aluno precisa saber (partes cortadas na imagem, colunas ilegíveis, páginas que não parecem ficha de treino). legivel = false só se não der para extrair nenhuma ficha.
TXT;
}

function importar_schema(): array {
  $s = ['type' => 'string'];
  $i = ['type' => 'integer'];
  $n = ['type' => 'number'];
  $b = ['type' => 'boolean'];
  $nul = fn(array $t) => ['anyOf' => [$t, ['type' => 'null']]];
  $obj = fn(array $props) => ['type' => 'object', 'properties' => $props, 'required' => array_keys($props), 'additionalProperties' => false];
  $arr = fn(array $item) => ['type' => 'array', 'items' => $item];

  $exercicio = $obj([
    'nome' => $s,
    'texto_original' => $s,
    'grupo' => $nul($s),
    'tipo' => ['type' => 'string', 'enum' => ['forca', 'iso', 'cardio']],
    'is_biset' => $b,
    'series' => $i,
    'reps' => $s,
    'ultima_ate_falha' => $b,
    'duracao_seg' => $nul($i),
    'duracao_min' => $nul($i),
    'descanso_seg' => $nul($i),
    'carga' => $nul($n),
    'carga_b' => $nul($n),
    'observacao' => $nul($s),
    'confianca' => ['type' => 'string', 'enum' => ['alta', 'baixa']],
    'motivo_duvida' => $nul($s),
  ]);
  $ficha = $obj(['letra' => $s, 'nome' => $s, 'exercicios' => $arr($exercicio)]);
  $dia = $obj(['dia' => ['type' => 'string', 'enum' => ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom']], 'letra' => $nul($s)]);
  $semana = $obj(['semana' => $i, 'dias' => $arr($dia), 'metodologia' => $nul($s), 'progressao_carga' => $nul($s)]);
  $cardioSem = $obj(['semana' => $i, 'minutos' => $nul($i), 'bpm' => $nul($s), 'metodo' => $nul($s)]);
  $cardio = $obj(['antes_min' => $nul($i), 'depois_min' => $nul($i), 'semanas' => $arr($cardioSem), 'observacao' => $nul($s)]);
  $programa = $obj([
    'nome' => $nul($s),
    'duracao_dias' => $nul($i),
    'semanas' => $arr($semana),
    'cardio' => $nul($cardio),
    'observacoes' => $arr($s),
  ]);
  return $obj(['legivel' => $b, 'fichas' => $arr($ficha), 'programa' => $programa, 'avisos' => $arr($s)]);
}

/** Lê os arquivos enviados: [[{mime, b64}, ...], nomes]. */
function importar_arquivos(): array {
  $f = $_FILES['arquivos'] ?? null;
  if (!$f || !is_array($f['name'])) fail('Envie ao menos uma foto ou PDF da ficha', 400, 'no_files');
  $n = count($f['name']);
  if ($n > IMPORT_MAX_ARQUIVOS) fail('Envie no máximo ' . IMPORT_MAX_ARQUIVOS . ' arquivos por vez', 400, 'too_many');
  $finfo = class_exists('finfo') ? new finfo(FILEINFO_MIME_TYPE) : null;
  $blocos = []; $total = 0; $nomes = [];
  for ($k = 0; $k < $n; $k++) {
    if (($f['error'][$k] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) fail('Não foi possível receber um dos arquivos (muito grande?)', 400, 'upload_error');
    $tmp = $f['tmp_name'][$k];
    $size = (int)$f['size'][$k];
    if ($size <= 0 || $size > IMPORT_MAX_BYTES) fail('Cada arquivo pode ter até 10 MB', 400, 'too_big');
    $total += $size;
    if ($total > IMPORT_MAX_TOTAL) fail('Os arquivos somam mais de 15 MB', 400, 'too_big');
    $mime = $finfo ? ($finfo->file($tmp) ?: '') : (string)($f['type'][$k] ?? '');
    $dados = base64_encode(file_get_contents($tmp));
    if ($mime === 'application/pdf') {
      $blocos[] = ['mime' => $mime, 'b64' => $dados];
    } elseif (in_array($mime, ['image/jpeg', 'image/png', 'image/webp', 'image/gif'], true)) {
      if ($size > IMPORT_MAX_IMG) fail('Cada imagem pode ter até 5 MB', 400, 'too_big');
      $blocos[] = ['mime' => $mime, 'b64' => $dados];
    } else {
      fail('Formato não aceito. Use foto (JPG, PNG, WEBP) ou PDF', 400, 'bad_type');
    }
    $nomes[] = mb_substr((string)$f['name'][$k], 0, 80);
  }
  return [$blocos, $nomes];
}

function importar_ler(): void {
  $uid = require_user();
  $cfg = config();
  $prov = ($cfg['import_provider'] ?? 'gemini') === 'claude' ? 'claude' : 'gemini';
  $key = (string)($prov === 'claude' ? ($cfg['anthropic_key'] ?? '') : ($cfg['gemini_key'] ?? ''));
  if ($key === '') fail('A leitura de fichas ainda não está configurada no servidor', 503, 'not_configured');
  if (!throttle_ok('import:' . $uid, IMPORT_POR_DIA, 86400)) fail('Você atingiu o limite de leituras de hoje. Tente amanhã.', 429, 'rate_limited');

  [$arquivos, $nomes] = importar_arquivos();
  @set_time_limit(280);
  $r = $prov === 'claude'
    ? importar_via_claude($key, $arquivos)
    : importar_via_gemini($key, $arquivos, (string)($cfg['gemini_model'] ?? '') ?: GEMINI_MODEL,
                          (string)($cfg['gemini_reserva'] ?? GEMINI_RESERVA));

  $id = uuid4();
  $dados = $r['dados'];
  db()->prepare('INSERT INTO importacoes (id, user_id, status, arquivos, resultado, erro, tokens_in, tokens_out) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    ->execute([$id, $uid, $r['status'], json_encode(['provedor' => $prov, 'modelo' => $r['modelo'], 'arquivos' => $nomes], JSON_UNESCAPED_UNICODE),
               $dados ? json_encode($dados, JSON_UNESCAPED_UNICODE) : null, $r['log'] !== '' ? mb_substr($r['log'], 0, 500) : null,
               $r['tokens_in'], $r['tokens_out']]);

  if (!$dados) fail($r['msg'], $r['http'], $r['code']);
  respond(['data' => ['importacao_id' => $id] + $dados, 'error' => null]);
}

/** Resultado padrão de um provedor. Sem 'dados' = falhou, com mensagem para o aluno. */
function importar_res(string $modelo, ?array $dados, string $status, string $log = '', string $msg = '', int $http = 502, string $code = 'upstream', int $in = 0, int $out = 0): array {
  return ['modelo' => $modelo, 'dados' => $dados, 'status' => $status, 'log' => $log, 'msg' => $msg,
          'http' => $http, 'code' => $code, 'tokens_in' => $in, 'tokens_out' => $out];
}

/** POST JSON com curl. Devolve [http (0 = sem conexão), corpo decodificado|null, erro do curl]. */
function importar_post(string $url, array $headers, array $body, int $timeout = 180): array {
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => $timeout,
    CURLOPT_CONNECTTIMEOUT => 15,
    CURLOPT_HTTPHEADER => array_merge(['Content-Type: application/json'], $headers),
    CURLOPT_POSTFIELDS => json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
  ]);
  $raw = curl_exec($ch);
  $http = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $err = curl_error($ch);
  curl_close($ch);
  if ($raw === false) return [0, null, $err];
  return [$http, json_decode($raw, true), ''];
}

/** Falha HTTP comum aos dois provedores. */
function importar_falha_http(string $modelo, int $http, $resp, string $cerr): array {
  if ($http === 0) return importar_res($modelo, null, 'erro', 'curl: ' . $cerr, 'Não foi possível falar com o serviço de leitura. Tente de novo.');
  $detalhe = '';
  if (is_array($resp) && isset($resp['error'])) $detalhe = is_array($resp['error']) ? (string)($resp['error']['message'] ?? json_encode($resp['error'])) : (string)$resp['error'];
  $log = "HTTP $http: $detalhe";
  if (in_array($http, [429, 503, 529], true)) return importar_res($modelo, null, 'erro', $log, 'O serviço de leitura está ocupado ou no limite gratuito. Tente de novo em alguns minutos.', 503, 'busy');
  if ($http === 413) return importar_res($modelo, null, 'erro', $log, 'Arquivos grandes demais para leitura. Envie menos páginas.', 400, 'too_big');
  return importar_res($modelo, null, 'erro', $log, 'A leitura falhou. Tente de novo ou envie uma foto mais nítida.');
}

/** Confere se o texto devolvido é o JSON esperado. */
function importar_json(string $modelo, string $texto, int $in, int $out): array {
  $dados = json_decode($texto, true);
  if (!is_array($dados) || !isset($dados['fichas']) || !is_array($dados['fichas'])) {
    return importar_res($modelo, null, 'erro', 'json inválido: ' . mb_substr($texto, 0, 200), 'A leitura veio incompleta. Tente de novo.', 502, 'bad_output', $in, $out);
  }
  return importar_res($modelo, $dados, 'lido', '', '', 200, '', $in, $out);
}

// ── Gemini (Interactions API do Google; tem nível gratuito) ─────────────────

/** O Gemini marca campo opcional como type: [X, "null"] em vez de anyOf. */
function importar_schema_gemini(array $s): array {
  if (isset($s['anyOf']) && count($s['anyOf']) === 2 && (($s['anyOf'][1]['type'] ?? '') === 'null')) {
    $t = importar_schema_gemini($s['anyOf'][0]);
    $t['type'] = [$t['type'], 'null'];
    return $t;
  }
  if (isset($s['properties'])) foreach ($s['properties'] as $k => $p) $s['properties'][$k] = importar_schema_gemini($p);
  if (isset($s['items'])) $s['items'] = importar_schema_gemini($s['items']);
  return $s;
}

function importar_via_gemini(string $key, array $arquivos, string $principal, string $reserva = ''): array {
  $input = [];
  foreach ($arquivos as $a) {
    $input[] = ['type' => $a['mime'] === 'application/pdf' ? 'document' : 'image', 'data' => $a['b64'], 'mime_type' => $a['mime']];
  }
  $input[] = ['type' => 'text', 'text' => 'Converta esta ficha de treino para o formato do app.'];

  // Modelo sobrecarregado (503) ou cota do gratuito estourada (429): tenta o modelo reserva,
  // que tem fila e cota próprias.
  $modelos = array_values(array_unique(array_filter([$principal, $reserva])));
  foreach ($modelos as $n => $modelo) {
    [$http, $resp, $cerr] = importar_post(
      'https://generativelanguage.googleapis.com/v1beta/interactions',
      ['x-goog-api-key: ' . $key, 'Api-Revision: 2026-05-20'],
      [
        'model' => $modelo,
        'system_instruction' => importar_prompt(),
        'input' => $input,
        'response_format' => ['type' => 'text', 'mime_type' => 'application/json', 'schema' => importar_schema_gemini(importar_schema())],
        'generation_config' => ['thinking_level' => 'medium', 'max_output_tokens' => 32000],
        'store' => false,   // não guardar a conversa no Google
      ],
      $n === 0 && count($modelos) > 1 ? 120 : 150
    );
    if (in_array($http, [429, 503], true) && $n < count($modelos) - 1) continue;
    break;
  }
  if ($http !== 200 || !is_array($resp)) return importar_falha_http($modelo, $http, $resp, $cerr);

  $u = $resp['usage'] ?? [];
  $in = (int)($u['total_input_tokens'] ?? 0);
  $out = (int)($u['total_output_tokens'] ?? 0) + (int)($u['total_thought_tokens'] ?? 0);
  $status = (string)($resp['status'] ?? '');
  if ($status === 'incomplete') {
    return importar_res($modelo, null, 'erro', 'incomplete', 'A ficha é longa demais para uma leitura. Envie em partes (por exemplo, uma página por vez).', 422, 'too_long', $in, $out);
  }
  if ($status !== 'completed') {
    $e = (string)($resp['errors'][0]['message'] ?? '');
    return importar_res($modelo, null, 'erro', "status $status: $e", 'A leitura falhou. Tente de novo ou envie uma foto mais nítida.', 502, 'upstream', $in, $out);
  }
  $texto = '';
  foreach ($resp['steps'] ?? [] as $st) {
    if (($st['type'] ?? '') !== 'model_output') continue;
    foreach ($st['content'] ?? [] as $c) if (($c['type'] ?? '') === 'text') $texto .= (string)($c['text'] ?? '');
  }
  return importar_json($modelo, $texto, $in, $out);
}

// ── Claude (API da Anthropic; paga) ─────────────────────────────────────────

function importar_via_claude(string $key, array $arquivos): array {
  $modelo = CLAUDE_MODEL;
  $blocos = [];
  foreach ($arquivos as $a) {
    $src = ['type' => 'base64', 'media_type' => $a['mime'], 'data' => $a['b64']];
    $blocos[] = ['type' => $a['mime'] === 'application/pdf' ? 'document' : 'image', 'source' => $src];
  }
  $blocos[] = ['type' => 'text', 'text' => 'Converta esta ficha de treino para o formato do app.'];

  [$http, $resp, $cerr] = importar_post(
    'https://api.anthropic.com/v1/messages',
    ['x-api-key: ' . $key, 'anthropic-version: 2026-10-21', 'anthropic-beta: server-side-fallback-2026-07-01'],
    [
      'model' => $modelo,
      'max_tokens' => 16000,
      'system' => importar_prompt(),
      'messages' => [['role' => 'user', 'content' => $blocos]],
      'output_config' => ['effort' => 'medium', 'format' => ['type' => 'json_schema', 'schema' => importar_schema()]],
      'fallbacks' => 'default',   // se o modelo recusar, a API tenta o modelo recomendado
    ]
  );
  if ($http !== 200 || !is_array($resp)) return importar_falha_http($modelo, $http, $resp, $cerr);

  $in = (int)($resp['usage']['input_tokens'] ?? 0);
  $out = (int)($resp['usage']['output_tokens'] ?? 0);
  $stop = $resp['stop_reason'] ?? '';
  if ($stop === 'refusal') return importar_res($modelo, null, 'recusa', 'refusal', 'Não foi possível ler este arquivo. Envie só a ficha de treino.', 422, 'refusal', $in, $out);
  if ($stop === 'max_tokens') return importar_res($modelo, null, 'erro', 'max_tokens', 'A ficha é longa demais para uma leitura. Envie em partes (por exemplo, uma página por vez).', 422, 'too_long', $in, $out);
  $texto = '';
  foreach ($resp['content'] ?? [] as $bl) if (($bl['type'] ?? '') === 'text') $texto .= $bl['text'];
  return importar_json($modelo, $texto, $in, $out);
}

// ── Salvar as fichas revisadas ───────────────────────────────────────────────

function importar_salvar(array $b): void {
  $uid = require_user();
  $fichas = $b['fichas'] ?? null;
  if (!is_array($fichas) || !$fichas) fail('Nenhuma ficha para salvar', 400);
  if (count($fichas) > 12) fail('No máximo 12 fichas por importação', 400);
  $modo = ($b['modo'] ?? 'adicionar') === 'substituir' ? 'substituir' : 'adicionar';

  $str = fn($v, int $max) => mb_substr(trim((string)$v), 0, $max);
  $int = fn($v, int $min, int $max, ?int $def = null) => is_numeric($v) ? max($min, min($max, (int)$v)) : $def;
  $num = fn($v) => is_numeric($v) ? max(0, min(9999, round((float)$v, 2))) : 0;
  $cores = ['#CCFF00', '#00E5FF', '#FF5E1F', '#FF3B5C', '#A78BFA', '#34D399'];

  $pdo = db();
  $pdo->beginTransaction();
  try {
    if ($modo === 'substituir') {
      // O histórico de treinos fica: treinos.ficha_id vira NULL (ON DELETE SET NULL)
      $pdo->prepare('DELETE FROM fichas WHERE user_id = ?')->execute([$uid]);
      $ordem = 0;
    } else {
      $st = $pdo->prepare('SELECT COALESCE(MAX(ordem) + 1, 0) FROM fichas WHERE user_id = ?');
      $st->execute([$uid]);
      $ordem = (int)$st->fetchColumn();
    }
    $insF = $pdo->prepare('INSERT INTO fichas (id, user_id, letra, nome, cor, ordem, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
    $insE = $pdo->prepare('INSERT INTO exercicios (id, ficha_id, nome, grupo, series, reps, carga, descanso, tipo, duracao_seg, duracao_min, intensidade, is_biset, carga_b, ordem, created_at)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $nEx = 0;
    foreach ($fichas as $fi => $f) {
      if (!is_array($f)) continue;
      $nome = $str($f['nome'] ?? '', 120);
      $letra = strtoupper($str($f['letra'] ?? '', 4)) ?: chr(65 + ($fi % 26));
      if ($nome === '') $nome = "Treino $letra";
      $cor = preg_match('/^#[0-9A-Fa-f]{6}$/', (string)($f['cor'] ?? '')) ? $f['cor'] : $cores[$fi % count($cores)];
      $fid = uuid4();
      $insF->execute([$fid, $uid, $letra, $nome, $cor, $ordem++, now_db($fi)]);

      $exs = is_array($f['exercicios'] ?? null) ? array_slice($f['exercicios'], 0, 40) : [];
      foreach ($exs as $ei => $e) {
        if (!is_array($e)) continue;
        $enome = $str($e['nome'] ?? '', 160);
        if ($enome === '') continue;
        $tipo = in_array($e['tipo'] ?? '', ['forca', 'iso', 'cardio'], true) ? $e['tipo'] : 'forca';
        $biset = $tipo === 'forca' && !empty($e['is_biset']);
        $reps = $str($e['reps'] ?? '', 20);
        if ($tipo === 'forca') {
          if ($reps === '') $reps = '10';
          if (!empty($e['ultima_ate_falha']) && stripos($reps, 'falha') === false) $reps = mb_substr($reps . ' + falha', 0, 20);
        } else {
          $reps = '0';
        }
        $insE->execute([
          uuid4(), $fid, $enome, $str($e['grupo'] ?? '', 80) ?: null,
          $int($e['series'] ?? 3, 1, 20, 3), $reps,
          $tipo === 'forca' ? $num($e['carga'] ?? 0) : 0,
          $int($e['descanso_seg'] ?? null, 0, 900, 60),
          $tipo,
          $tipo === 'iso' ? $int($e['duracao_seg'] ?? null, 1, 3600, 30) : null,
          $tipo === 'cardio' ? $int($e['duracao_min'] ?? null, 1, 300, 10) : null,
          $tipo === 'cardio' ? ($str($e['observacao'] ?? '', 80) ?: null) : null,
          $biset ? 1 : 0,
          $biset ? $num($e['carga_b'] ?? 0) : 0,
          $ei, now_db($ei),
        ]);
        $nEx++;
      }
    }
    if (!empty($b['importacao_id']) && is_string($b['importacao_id'])) {
      $pdo->prepare("UPDATE importacoes SET status = 'salvo', revisado = ?, salvo_em = ? WHERE id = ? AND user_id = ?")
          ->execute([json_encode(['modo' => $modo, 'fichas' => $fichas], JSON_UNESCAPED_UNICODE), now_db(), $b['importacao_id'], $uid]);
    }
    $pdo->commit();
  } catch (Throwable $e) {
    $pdo->rollBack();
    fail('Não foi possível salvar as fichas', 500, 'save_failed');
  }
  respond(['data' => ['fichas' => count($fichas), 'exercicios' => $nEx, 'modo' => $modo], 'error' => null]);
}

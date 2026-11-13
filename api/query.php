<?php
// Consulta genérica no estilo do Supabase (select/insert/update/upsert/delete com filtros),
// sempre restrita às linhas do usuário logado conforme o "scope" de cada tabela (schema.php).

function q_handle(array $b): void {
  $uid = require_user();
  $tname = (string)($b['table'] ?? '');
  $T = TABLES[$tname] ?? null;
  if (!$T) fail("Tabela desconhecida: $tname", 400, 'unknown_table');
  $op = (string)($b['op'] ?? 'select');
  if (!in_array($op, $T['ops'], true)) fail("Operação não permitida em $tname", 403, 'forbidden');

  try {
    switch ($op) {
      case 'select': $rows = q_select($tname, $T, $uid, $b); break;
      case 'insert': $rows = q_insert($tname, $T, $uid, $b, false); break;
      case 'upsert': $rows = q_insert($tname, $T, $uid, $b, true); break;
      case 'update': $rows = q_update($tname, $T, $uid, $b); break;
      case 'delete': $rows = q_delete($tname, $T, $uid, $b); break;
      default: fail('Operação inválida', 400);
    }
  } catch (PDOException $e) {
    error_log('[meutreino] ' . $e->getMessage());
    $code = $e->getCode();
    if ($code === '23000') fail('Registro relacionado inválido ou duplicado', 409, '23000');
    fail('Erro no banco de dados', 500, 'db_error');
  }

  $single = $b['single'] ?? null;
  if ($single === 'one' || $single === 'maybe') {
    if (count($rows) > 1) fail('Mais de uma linha retornada', 406, 'PGRST116');
    if (count($rows) === 0) {
      if ($single === 'one') fail('Nenhuma linha encontrada', 406, 'PGRST116');
      respond(['data' => null, 'error' => null]);
    }
    respond(['data' => $rows[0], 'error' => null]);
  }
  respond(['data' => $rows, 'error' => null]);
}

// ── Conversão de tipos ───────────────────────────────────────────────────────

function to_db(string $type, $v) {
  if ($v === null) return null;
  switch ($type) {
    case 'int': return (int)round((float)$v);
    case 'num': return (float)$v;
    case 'bool': return $v ? 1 : 0;
    case 'json': return json_encode($v, JSON_UNESCAPED_UNICODE);
    case 'date':
      $s = substr((string)$v, 0, 10);
      if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $s)) fail('Data inválida', 400, 'invalid_date');
      return $s;
    case 'dt':
      $t = strtotime((string)$v);
      if ($t === false) fail('Data/hora inválida', 400, 'invalid_datetime');
      return gmdate('Y-m-d H:i:s', $t);
    default: return (string)$v;
  }
}

function from_db(string $type, $v) {
  if ($v === null) return null;
  switch ($type) {
    case 'int': return (int)$v;
    case 'num': return (float)$v;
    case 'bool': return (bool)(int)$v;
    case 'json': return json_decode($v, true);
    case 'dt': return str_replace(' ', 'T', substr($v, 0, 23)) . 'Z';
    default: return $v;
  }
}

function format_row(array $T, array $row): array {
  foreach ($row as $k => $v) if (isset($T['cols'][$k])) $row[$k] = from_db($T['cols'][$k], $v);
  return $row;
}

function qcol(array $T, string $c): string {
  if (!isset($T['cols'][$c])) fail("Coluna desconhecida: $c", 400, 'unknown_column');
  return "t.`$c`";
}

// ── Escopo (quem pode ver o quê) ─────────────────────────────────────────────

function scope_where(array $T, string $uid, string $alias = 't'): array {
  $s = $T['scope'];
  switch ($s[0]) {
    case 'self': return ["$alias.`{$s[1]}` = ?", [$uid]];
    case 'owner': return ["$alias.`{$s[1]}` = ?", [$uid]];
    case 'parent':
      $P = TABLES[$s[2]];
      return ["$alias.`{$s[1]}` IN (SELECT `id` FROM `{$s[2]}` WHERE `{$P['scope'][1]}` = ?)", [$uid]];
    case 'links': return ["($alias.`trainer_id` = ? OR $alias.`student_id` = ?)", [$uid, $uid]];
  }
  fail('Escopo inválido', 500);
}

function filters_where(array $T, array $filters): array {
  $sql = []; $params = [];
  foreach ($filters as $f) {
    [$col, $op, $val] = [$f[0] ?? '', $f[1] ?? '', $f[2] ?? null];
    $c = qcol($T, $col);
    $type = $T['cols'][$col];
    switch ($op) {
      case 'eq': case 'neq': case 'gt': case 'gte': case 'lt': case 'lte':
        $sym = ['eq' => '=', 'neq' => '<>', 'gt' => '>', 'gte' => '>=', 'lt' => '<', 'lte' => '<='][$op];
        if ($val === null) fail("Filtro $op com valor nulo", 400);
        $sql[] = "$c $sym ?"; $params[] = to_db($type, $val); break;
      case 'in':
        if (!is_array($val)) fail('Filtro in precisa de lista', 400);
        if (!$val) { $sql[] = '1 = 0'; break; }
        $sql[] = "$c IN (" . implode(',', array_fill(0, count($val), '?')) . ')';
        foreach ($val as $v) $params[] = to_db($type, $v);
        break;
      case 'is': $sql[] = "$c IS NULL"; break;
      case 'not_is': $sql[] = "$c IS NOT NULL"; break;
      default: fail("Filtro desconhecido: $op", 400);
    }
  }
  return [$sql, $params];
}

function where_clause(array $T, string $uid, array $b): array {
  [$s, $sp] = scope_where($T, $uid);
  [$f, $fp] = filters_where($T, $b['filters'] ?? []);
  return ['WHERE ' . implode(' AND ', array_merge([$s], $f)), array_merge($sp, $fp)];
}

// "*, exercicios(count)" → ['cols' => [...], 'embeds' => ['exercicios' => ['count']]]
function parse_select(array $T, string $sel): array {
  $tokens = []; $depth = 0; $cur = '';
  foreach (str_split($sel === '' ? '*' : $sel) as $ch) {
    if ($ch === '(') $depth++;
    if ($ch === ')') $depth--;
    if ($ch === ',' && $depth === 0) { $tokens[] = trim($cur); $cur = ''; continue; }
    $cur .= $ch;
  }
  $tokens[] = trim($cur);
  $cols = []; $embeds = [];
  foreach ($tokens as $tk) {
    if ($tk === '') continue;
    if ($tk === '*') { $cols = array_merge($cols, array_keys($T['cols'])); continue; }
    if (preg_match('/^([a-z_]+)\((.*)\)$/', $tk, $m)) {
      if (!isset($T['embeds'][$m[1]])) fail("Relação desconhecida: {$m[1]}", 400);
      $embeds[$m[1]] = array_values(array_filter(array_map('trim', explode(',', $m[2]))));
      continue;
    }
    qcol($T, $tk);
    $cols[] = $tk;
  }
  return ['cols' => array_values(array_unique($cols)), 'embeds' => $embeds];
}

// ── SELECT ───────────────────────────────────────────────────────────────────

function q_select(string $tname, array $T, string $uid, array $b): array {
  $sel = parse_select($T, (string)($b['select'] ?? '*'));
  $cols = $sel['cols'];
  // Garante as chaves que as relações precisam
  $extra = [];
  foreach ($sel['embeds'] as $name => $_) {
    $E = $T['embeds'][$name];
    $need = $E['type'] === 'one' ? $E['fk'] : $T['pk'];
    if (!in_array($need, $cols, true)) { $cols[] = $need; $extra[] = $need; }
  }
  if (!$cols) $cols = [$T['pk']];

  [$where, $params] = where_clause($T, $uid, $b);
  $sql = 'SELECT ' . implode(', ', array_map(fn($c) => "t.`$c`", $cols)) . " FROM `$tname` t $where";

  $orders = [];
  foreach ($b['order'] ?? [] as $o) $orders[] = qcol($T, (string)$o[0]) . (($o[1] ?? true) ? ' ASC' : ' DESC');
  if ($orders) $sql .= ' ORDER BY ' . implode(', ', $orders);
  if (isset($b['limit'])) $sql .= ' LIMIT ' . max(0, min(5000, (int)$b['limit']));

  $st = db()->prepare($sql);
  $st->execute($params);
  $rows = array_map(fn($r) => format_row($T, $r), $st->fetchAll());

  foreach ($sel['embeds'] as $name => $subcols) $rows = attach_embed($T, $name, $subcols, $rows, $uid);
  if ($extra) $rows = array_map(function ($r) use ($extra) { foreach ($extra as $c) unset($r[$c]); return $r; }, $rows);
  return $rows;
}

function attach_embed(array $T, string $name, array $subcols, array $rows, string $uid): array {
  $E = $T['embeds'][$name];
  $RT = TABLES[$E['table']];
  if (!$rows) return $rows;

  if ($E['type'] === 'one') {
    $ids = array_values(array_unique(array_filter(array_column($rows, $E['fk']))));
    $map = [];
    if ($ids) {
      $cols = $subcols ?: array_keys($RT['cols']);
      foreach ($cols as $c) qcol($RT, $c);
      [$s, $sp] = scope_where($RT, $uid);
      $st = db()->prepare('SELECT t.`id`, ' . implode(', ', array_map(fn($c) => "t.`$c`", $cols)) .
        " FROM `{$E['table']}` t WHERE $s AND t.`id` IN (" . implode(',', array_fill(0, count($ids), '?')) . ')');
      $st->execute(array_merge($sp, $ids));
      foreach ($st->fetchAll() as $r) {
        $id = $r['id'];
        if (!in_array('id', $cols, true)) unset($r['id']);
        $map[$id] = format_row($RT, $r);
      }
    }
    foreach ($rows as &$r) $r[$name] = $map[$r[$E['fk']]] ?? null;
    return $rows;
  }

  // many: só contagem é suportada (ex.: fichas → exercicios(count))
  if ($subcols !== ['count']) fail("Relação $name só suporta (count)", 400);
  $ids = array_column($rows, $T['pk']);
  $st = db()->prepare("SELECT `{$E['fk']}` k, COUNT(*) c FROM `{$E['table']}` WHERE `{$E['fk']}` IN (" .
    implode(',', array_fill(0, count($ids), '?')) . ") GROUP BY `{$E['fk']}`");
  $st->execute($ids);
  $counts = [];
  foreach ($st->fetchAll() as $c) $counts[$c['k']] = (int)$c['c'];
  foreach ($rows as &$r) $r[$name] = [['count' => $counts[$r[$T['pk']]] ?? 0]];
  return $rows;
}

// ── INSERT / UPSERT ──────────────────────────────────────────────────────────

function assert_parent(array $T, string $uid, array $values): void {
  $s = $T['scope'];
  if ($s[0] !== 'parent') return;
  $P = TABLES[$s[2]];
  $todos = array_map(fn($r) => $r[$s[1]] ?? null, $values);
  if (in_array(null, $todos, true) || in_array('', $todos, true)) fail("Campo {$s[1]} obrigatório", 400);
  $ids = array_values(array_unique($todos));
  $st = db()->prepare("SELECT COUNT(*) FROM `{$s[2]}` WHERE `{$P['scope'][1]}` = ? AND `id` IN (" .
    implode(',', array_fill(0, count($ids), '?')) . ')');
  $st->execute(array_merge([$uid], $ids));
  if ((int)$st->fetchColumn() !== count($ids)) fail('Sem permissão para esse registro', 403, 'forbidden');
}

function q_insert(string $tname, array $T, string $uid, array $b, bool $upsert): array {
  $values = $b['values'] ?? null;
  if (!is_array($values) || !$values) fail('Nada para inserir', 400);
  if (array_keys($values) !== range(0, count($values) - 1)) $values = [$values];
  if (count($values) > 500) fail('Muitas linhas de uma vez', 400);
  $scope = $T['scope'];
  if (!in_array($scope[0], ['owner', 'parent'], true)) fail('Inserção não permitida', 403);

  $pdo = db();
  $ids = [];
  $pdo->beginTransaction();
  foreach ($values as $i => $row) {
    if (!is_array($row)) fail('Linha inválida', 400);
    foreach (array_keys($row) as $c) qcol($T, $c);
    foreach ($T['readonly'] ?? [] as $c) unset($row[$c]);
    if ($scope[0] === 'owner') $row[$scope[1]] = $uid;
    if ($T['cols'][$T['pk']] === 'uuid' && $T['pk'] !== ($scope[1] ?? '')) {
      if (!$upsert || empty($row[$T['pk']])) $row[$T['pk']] = uuid4();
    }
    if (isset($T['cols']['created_at']) && !isset($row['created_at'])) $row['created_at'] = null;
    if (isset($T['cols']['updated_at']) && !isset($row['updated_at'])) $row['updated_at'] = null;
    if (isset($T['cols']['itens']) && !isset($row['itens'])) $row['itens'] = [];
    $values[$i] = $row;
  }
  assert_parent($T, $uid, $values);

  foreach ($values as $i => $row) {
    $cols = array_keys($row);
    $ph = []; $params = [];
    foreach ($cols as $c) {
      if (($c === 'created_at' || $c === 'updated_at') && $row[$c] === null) { $ph[] = '?'; $params[] = now_db($i); continue; }
      $ph[] = '?'; $params[] = to_db($T['cols'][$c], $row[$c]);
    }
    $sql = "INSERT INTO `$tname` (" . implode(', ', array_map(fn($c) => "`$c`", $cols)) . ') VALUES (' . implode(', ', $ph) . ')';
    if ($upsert) {
      $upd = array_filter($cols, fn($c) => $c !== $T['pk'] && $c !== 'created_at');
      $sql .= ' ON DUPLICATE KEY UPDATE ' . implode(', ', array_map(fn($c) => "`$c` = VALUES(`$c`)", $upd));
    }
    $pdo->prepare($sql)->execute($params);
    $ids[] = $row[$T['pk']];
  }
  $pdo->commit();

  if (!array_key_exists('select', $b)) return [];
  return fetch_by_ids($tname, $T, $uid, $ids, (string)$b['select']);
}

function fetch_by_ids(string $tname, array $T, string $uid, array $ids, string $select): array {
  if (!$ids) return [];
  $rows = q_select($tname, $T, $uid, ['select' => $select === '' ? '*' : $select, 'filters' => [[$T['pk'], 'in', $ids]]]);
  // mantém a ordem de entrada
  $pos = array_flip($ids);
  $hasPk = isset($rows[0][$T['pk']]);
  if ($hasPk) usort($rows, fn($a, $b) => ($pos[$a[$T['pk']]] ?? 0) <=> ($pos[$b[$T['pk']]] ?? 0));
  return $rows;
}

// ── UPDATE / DELETE ──────────────────────────────────────────────────────────

function matching_ids(string $tname, array $T, string $uid, array $b): array {
  if (empty($b['filters'])) fail('Filtro obrigatório para alterar ou apagar', 400, 'missing_filter');
  [$where, $params] = where_clause($T, $uid, $b);
  $st = db()->prepare("SELECT t.`{$T['pk']}` FROM `$tname` t $where");
  $st->execute($params);
  return $st->fetchAll(PDO::FETCH_COLUMN);
}

function q_update(string $tname, array $T, string $uid, array $b): array {
  $vals = $b['values'] ?? null;
  if (!is_array($vals) || !$vals) fail('Nada para atualizar', 400);
  foreach (array_keys($vals) as $c) qcol($T, $c);
  unset($vals[$T['pk']]);
  foreach ($T['readonly'] ?? [] as $c) unset($vals[$c]);
  $scope = $T['scope'];
  if ($scope[0] === 'owner') unset($vals[$scope[1]]);
  if ($scope[0] === 'parent' && array_key_exists($scope[1], $vals)) assert_parent($T, $uid, [$vals]);
  if (isset($T['cols']['updated_at']) && !isset($vals['updated_at'])) $vals['updated_at'] = gmdate('Y-m-d H:i:s');
  if (!$vals) fail('Nada para atualizar', 400);

  $ids = matching_ids($tname, $T, $uid, $b);
  if ($ids) {
    $set = []; $params = [];
    foreach ($vals as $c => $v) { $set[] = "`$c` = ?"; $params[] = to_db($T['cols'][$c], $v); }
    $sql = "UPDATE `$tname` SET " . implode(', ', $set) . " WHERE `{$T['pk']}` IN (" . implode(',', array_fill(0, count($ids), '?')) . ')';
    db()->prepare($sql)->execute(array_merge($params, $ids));
  }
  if (!array_key_exists('select', $b)) return [];
  return fetch_by_ids($tname, $T, $uid, $ids, (string)$b['select']);
}

function q_delete(string $tname, array $T, string $uid, array $b): array {
  $ids = matching_ids($tname, $T, $uid, $b);
  $rows = array_key_exists('select', $b) ? fetch_by_ids($tname, $T, $uid, $ids, (string)$b['select']) : [];
  if ($ids) {
    db()->prepare("DELETE FROM `$tname` WHERE `{$T['pk']}` IN (" . implode(',', array_fill(0, count($ids), '?')) . ')')->execute($ids);
  }
  return $rows;
}

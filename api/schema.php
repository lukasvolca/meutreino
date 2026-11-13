<?php
// Tabelas expostas pela API, tipos das colunas e regra de acesso (equivale ao RLS do Supabase).
//
// Tipos: uuid | str | int | num | bool | date | dt (timestamp UTC) | json
// scope:
//   self   → a linha é do usuário se <col> = id do usuário (profiles.id)
//   owner  → <col> = id do usuário (user_id); em insert é preenchido à força
//   parent → a linha pertence a uma linha de outra tabela do usuário (ex.: exercicios → fichas)
//   links  → vínculo personal/aluno: o usuário é trainer_id ou student_id (só leitura por enquanto)
// ops: operações permitidas.

const TABLES = [
  'profiles' => [
    'pk' => 'id',
    'cols' => ['id' => 'uuid', 'nome' => 'str', 'objetivo' => 'str', 'streak' => 'int', 'role' => 'str',
               'created_at' => 'dt', 'updated_at' => 'dt'],
    'scope' => ['self', 'id'],
    'ops' => ['select', 'update'],
    'readonly' => ['id', 'role', 'created_at'],
  ],
  'fichas' => [
    'pk' => 'id',
    'cols' => ['id' => 'uuid', 'user_id' => 'uuid', 'letra' => 'str', 'nome' => 'str', 'cor' => 'str', 'icone' => 'str',
               'duracao_min' => 'int', 'ordem' => 'int', 'created_at' => 'dt'],
    'scope' => ['owner', 'user_id'],
    'ops' => ['select', 'insert', 'update', 'delete'],
    'embeds' => ['exercicios' => ['type' => 'many', 'table' => 'exercicios', 'fk' => 'ficha_id']],
  ],
  'exercicios' => [
    'pk' => 'id',
    'cols' => ['id' => 'uuid', 'ficha_id' => 'uuid', 'nome' => 'str', 'grupo' => 'str', 'series' => 'int', 'reps' => 'str',
               'carga' => 'num', 'descanso' => 'int', 'tipo' => 'str', 'duracao_seg' => 'int', 'duracao_min' => 'int',
               'intensidade' => 'str', 'yt_id' => 'str', 'is_biset' => 'bool', 'carga_b' => 'num', 'ordem' => 'int',
               'created_at' => 'dt'],
    'scope' => ['parent', 'ficha_id', 'fichas'],
    'ops' => ['select', 'insert', 'update', 'delete'],
  ],
  'treinos' => [
    'pk' => 'id',
    'cols' => ['id' => 'uuid', 'user_id' => 'uuid', 'ficha_id' => 'uuid', 'ficha_letra' => 'str', 'data' => 'date',
               'duracao_min' => 'int', 'volume_total' => 'num', 'teve_pr' => 'bool', 'created_at' => 'dt'],
    'scope' => ['owner', 'user_id'],
    'ops' => ['select', 'insert', 'update', 'delete'],
    'embeds' => ['fichas' => ['type' => 'one', 'table' => 'fichas', 'fk' => 'ficha_id']],
  ],
  'sets_log' => [
    'pk' => 'id',
    'cols' => ['id' => 'uuid', 'treino_id' => 'uuid', 'exercicio_id' => 'uuid', 'exercicio_nome' => 'str',
               'serie_num' => 'int', 'carga' => 'num', 'reps' => 'int', 'duracao_seg' => 'int', 'done' => 'bool',
               'created_at' => 'dt'],
    'scope' => ['parent', 'treino_id', 'treinos'],
    'ops' => ['select', 'insert', 'delete'],
  ],
  'trainer_student_links' => [
    'pk' => 'id',
    'cols' => ['id' => 'uuid', 'trainer_id' => 'uuid', 'student_id' => 'uuid', 'status' => 'str',
               'requested_at' => 'dt', 'approved_at' => 'dt'],
    'scope' => ['links'],
    'ops' => ['select'],
  ],
  'exercise_notes' => [
    'pk' => 'id',
    'cols' => ['id' => 'uuid', 'user_id' => 'uuid', 'trainer_id' => 'uuid', 'exercicio_id' => 'uuid',
               'exercicio_nome' => 'str', 'ficha_id' => 'uuid', 'texto' => 'str', 'lida' => 'bool', 'created_at' => 'dt'],
    'scope' => ['owner', 'user_id'],
    'ops' => ['select', 'insert', 'update', 'delete'],
  ],
  'medidas' => [
    'pk' => 'id',
    'cols' => ['id' => 'uuid', 'user_id' => 'uuid', 'data' => 'date', 'peso' => 'num', 'altura' => 'num', 'gordura' => 'num',
               'braco_d' => 'num', 'braco_e' => 'num', 'peito' => 'num', 'cintura' => 'num', 'quadril' => 'num',
               'coxa_d' => 'num', 'coxa_e' => 'num', 'panturrilha' => 'num', 'created_at' => 'dt'],
    'scope' => ['owner', 'user_id'],
    'ops' => ['select', 'insert', 'update', 'delete'],
  ],
  'metas_nutricionais' => [
    'pk' => 'user_id',
    'cols' => ['user_id' => 'uuid', 'kcal' => 'int', 'proteina' => 'int', 'carbo' => 'int', 'gordura' => 'int',
               'sexo' => 'str', 'idade' => 'int', 'altura_cm' => 'num', 'peso_kg' => 'num', 'atividade' => 'str',
               'updated_at' => 'dt'],
    'scope' => ['owner', 'user_id'],
    'ops' => ['select', 'insert', 'update', 'delete', 'upsert'],
  ],
  'alimentos_usuario' => [
    'pk' => 'id',
    'cols' => ['id' => 'uuid', 'user_id' => 'uuid', 'nome' => 'str', 'kcal' => 'num', 'proteina' => 'num', 'carbo' => 'num',
               'gordura' => 'num', 'porcao_g' => 'num', 'created_at' => 'dt'],
    'scope' => ['owner', 'user_id'],
    'ops' => ['select', 'insert', 'update', 'delete'],
  ],
  'plano_refeicoes' => [
    'pk' => 'id',
    'cols' => ['id' => 'uuid', 'user_id' => 'uuid', 'nome' => 'str', 'horario' => 'str', 'ordem' => 'int',
               'itens' => 'json', 'created_at' => 'dt'],
    'scope' => ['owner', 'user_id'],
    'ops' => ['select', 'insert', 'update', 'delete'],
  ],
  'diario_alimentar' => [
    'pk' => 'id',
    'cols' => ['id' => 'uuid', 'user_id' => 'uuid', 'data' => 'date', 'refeicao' => 'str', 'plano_refeicao_id' => 'uuid',
               'alimento_ref' => 'str', 'nome' => 'str', 'gramas' => 'num', 'kcal' => 'num', 'proteina' => 'num',
               'carbo' => 'num', 'gordura' => 'num', 'created_at' => 'dt'],
    'scope' => ['owner', 'user_id'],
    'ops' => ['select', 'insert', 'update', 'delete'],
  ],
];

// DDL do MySQL. Executado de forma idempotente na primeira requisição de cada versão.
const SCHEMA_VERSION = 1;

function schema_sql(): array {
  $e = 'ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';
  $now = 'DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)';
  return [
    "CREATE TABLE IF NOT EXISTS users (
      id CHAR(36) PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at $now
    ) $e",
    "CREATE TABLE IF NOT EXISTS sessions (
      token_hash CHAR(64) PRIMARY KEY,
      user_id CHAR(36) NOT NULL,
      created_at $now,
      last_seen $now,
      INDEX (user_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) $e",
    "CREATE TABLE IF NOT EXISTS login_attempts (
      ip VARCHAR(45) NOT NULL,
      at $now,
      INDEX (ip, at)
    ) $e",
    "CREATE TABLE IF NOT EXISTS profiles (
      id CHAR(36) PRIMARY KEY,
      nome VARCHAR(120) NOT NULL DEFAULT '',
      objetivo VARCHAR(40) NULL,
      streak INT NOT NULL DEFAULT 0,
      role VARCHAR(30) NOT NULL DEFAULT 'user',
      created_at $now,
      updated_at $now,
      FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
    ) $e",
    "CREATE TABLE IF NOT EXISTS fichas (
      id CHAR(36) PRIMARY KEY,
      user_id CHAR(36) NOT NULL,
      letra VARCHAR(4) NOT NULL DEFAULT 'A',
      nome VARCHAR(120) NOT NULL,
      cor VARCHAR(20) NOT NULL DEFAULT '#CCFF00',
      icone VARCHAR(40) NULL,
      duracao_min INT NOT NULL DEFAULT 60,
      ordem INT NOT NULL DEFAULT 0,
      created_at $now,
      INDEX (user_id, ordem),
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
    ) $e",
    "CREATE TABLE IF NOT EXISTS exercicios (
      id CHAR(36) PRIMARY KEY,
      ficha_id CHAR(36) NOT NULL,
      nome VARCHAR(160) NOT NULL,
      grupo VARCHAR(80) NULL,
      series INT NOT NULL DEFAULT 3,
      reps VARCHAR(20) NOT NULL DEFAULT '10',
      carga DECIMAL(7,2) NOT NULL DEFAULT 0,
      descanso INT NOT NULL DEFAULT 60,
      tipo VARCHAR(20) NOT NULL DEFAULT 'forca',
      duracao_seg INT NULL,
      duracao_min INT NULL,
      intensidade VARCHAR(80) NULL,
      yt_id VARCHAR(40) NULL,
      is_biset TINYINT(1) NOT NULL DEFAULT 0,
      carga_b DECIMAL(7,2) NOT NULL DEFAULT 0,
      ordem INT NOT NULL DEFAULT 0,
      created_at $now,
      INDEX (ficha_id, ordem),
      FOREIGN KEY (ficha_id) REFERENCES fichas(id) ON DELETE CASCADE
    ) $e",
    "CREATE TABLE IF NOT EXISTS treinos (
      id CHAR(36) PRIMARY KEY,
      user_id CHAR(36) NOT NULL,
      ficha_id CHAR(36) NULL,
      ficha_letra VARCHAR(4) NULL,
      data DATE NOT NULL,
      duracao_min INT NULL,
      volume_total DECIMAL(10,1) NOT NULL DEFAULT 0,
      teve_pr TINYINT(1) NOT NULL DEFAULT 0,
      created_at $now,
      INDEX (user_id, data),
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
      FOREIGN KEY (ficha_id) REFERENCES fichas(id) ON DELETE SET NULL
    ) $e",
    "CREATE TABLE IF NOT EXISTS sets_log (
      id CHAR(36) PRIMARY KEY,
      treino_id CHAR(36) NOT NULL,
      exercicio_id CHAR(36) NULL,
      exercicio_nome VARCHAR(160) NULL,
      serie_num INT NOT NULL DEFAULT 1,
      carga DECIMAL(7,2) NULL,
      reps INT NULL,
      duracao_seg INT NULL,
      done TINYINT(1) NOT NULL DEFAULT 0,
      created_at $now,
      INDEX (treino_id),
      INDEX (exercicio_id, created_at),
      FOREIGN KEY (treino_id) REFERENCES treinos(id) ON DELETE CASCADE,
      FOREIGN KEY (exercicio_id) REFERENCES exercicios(id) ON DELETE SET NULL
    ) $e",
    "CREATE TABLE IF NOT EXISTS trainer_student_links (
      id CHAR(36) PRIMARY KEY,
      trainer_id CHAR(36) NOT NULL,
      student_id CHAR(36) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      requested_at $now,
      approved_at DATETIME NULL,
      UNIQUE (trainer_id, student_id),
      INDEX (student_id),
      FOREIGN KEY (trainer_id) REFERENCES profiles(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE
    ) $e",
    "CREATE TABLE IF NOT EXISTS exercise_notes (
      id CHAR(36) PRIMARY KEY,
      user_id CHAR(36) NOT NULL,
      trainer_id CHAR(36) NULL,
      exercicio_id CHAR(36) NULL,
      exercicio_nome VARCHAR(160) NULL,
      ficha_id CHAR(36) NULL,
      texto TEXT NOT NULL,
      lida TINYINT(1) NOT NULL DEFAULT 0,
      created_at $now,
      INDEX (user_id),
      INDEX (trainer_id),
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
    ) $e",
    "CREATE TABLE IF NOT EXISTS medidas (
      id CHAR(36) PRIMARY KEY,
      user_id CHAR(36) NOT NULL,
      data DATE NOT NULL,
      peso DECIMAL(5,1) NULL, altura DECIMAL(5,2) NULL, gordura DECIMAL(4,1) NULL,
      braco_d DECIMAL(5,1) NULL, braco_e DECIMAL(5,1) NULL, peito DECIMAL(5,1) NULL,
      cintura DECIMAL(5,1) NULL, quadril DECIMAL(5,1) NULL, coxa_d DECIMAL(5,1) NULL,
      coxa_e DECIMAL(5,1) NULL, panturrilha DECIMAL(5,1) NULL,
      created_at $now,
      INDEX (user_id, data),
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
    ) $e",
    "CREATE TABLE IF NOT EXISTS metas_nutricionais (
      user_id CHAR(36) PRIMARY KEY,
      kcal INT NOT NULL, proteina INT NOT NULL, carbo INT NOT NULL, gordura INT NOT NULL,
      sexo CHAR(1) NULL, idade INT NULL, altura_cm DECIMAL(5,1) NULL, peso_kg DECIMAL(5,1) NULL,
      atividade VARCHAR(20) NULL,
      updated_at $now,
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
    ) $e",
    "CREATE TABLE IF NOT EXISTS alimentos_usuario (
      id CHAR(36) PRIMARY KEY,
      user_id CHAR(36) NOT NULL,
      nome VARCHAR(160) NOT NULL,
      kcal DECIMAL(7,1) NOT NULL, proteina DECIMAL(6,1) NOT NULL DEFAULT 0,
      carbo DECIMAL(6,1) NOT NULL DEFAULT 0, gordura DECIMAL(6,1) NOT NULL DEFAULT 0,
      porcao_g DECIMAL(7,1) NULL,
      created_at $now,
      INDEX (user_id),
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
    ) $e",
    "CREATE TABLE IF NOT EXISTS plano_refeicoes (
      id CHAR(36) PRIMARY KEY,
      user_id CHAR(36) NOT NULL,
      nome VARCHAR(80) NOT NULL,
      horario VARCHAR(5) NULL,
      ordem INT NOT NULL DEFAULT 0,
      itens JSON NOT NULL,
      created_at $now,
      INDEX (user_id, ordem),
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
    ) $e",
    "CREATE TABLE IF NOT EXISTS diario_alimentar (
      id CHAR(36) PRIMARY KEY,
      user_id CHAR(36) NOT NULL,
      data DATE NOT NULL,
      refeicao VARCHAR(80) NOT NULL,
      plano_refeicao_id CHAR(36) NULL,
      alimento_ref VARCHAR(60) NULL,
      nome VARCHAR(200) NOT NULL,
      gramas DECIMAL(7,1) NOT NULL,
      kcal DECIMAL(7,1) NOT NULL, proteina DECIMAL(6,1) NOT NULL DEFAULT 0,
      carbo DECIMAL(6,1) NOT NULL DEFAULT 0, gordura DECIMAL(6,1) NOT NULL DEFAULT 0,
      created_at $now,
      INDEX (user_id, data),
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
      FOREIGN KEY (plano_refeicao_id) REFERENCES plano_refeicoes(id) ON DELETE SET NULL
    ) $e",
    "CREATE TABLE IF NOT EXISTS meta (k VARCHAR(40) PRIMARY KEY, v VARCHAR(255) NOT NULL) $e",
  ];
}

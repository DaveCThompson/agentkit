#!/usr/bin/env node

// Portable, dependency-free writing-style manager. The script deliberately keeps all profile data
// under the invoking project's .writing directory; it never resolves a user-global style root.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const SCHEMA_VERSION = 1;
export const COMPILER_VERSION = 'writing-style-0.1.0';
export const DEFAULT_POLICY = Object.freeze({
  limited_below_words: 5000,
  minimum_documents_for_actionable_scalar: 3,
  max_leave_one_document_out_relative_delta: 0.25,
});

const STYLE_ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TEXT_EXTENSIONS = new Set(['.txt', '.md', '.mdx', '.rst', '.html', '.htm', '.csv', '.json', '.yaml', '.yml']);
const ARTIFACTS = [
  'normalized.jsonl',
  'profile.generated.json',
  'effective-profile.json',
  'baseline.json',
  'exemplar-candidates.jsonl',
  'exemplars.approved.jsonl',
  'build-state.json',
];
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'have', 'in', 'is', 'it',
  'of', 'on', 'or', 'that', 'the', 'their', 'this', 'to', 'was', 'were', 'with', 'you', 'your',
]);

let tempCounter = 0;

export class StyleError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'StyleError';
    this.code = code;
  }
}

export function sha(value) {
  return `sha256-${crypto.createHash('sha256').update(Buffer.isBuffer(value) ? value : String(value), 'utf8').digest('hex')}`;
}

function rawSha(value) {
  return crypto.createHash('sha256').update(Buffer.isBuffer(value) ? value : Buffer.from(String(value), 'utf8')).digest('hex');
}

function json(value) {
  return JSON.stringify(value, null, 2) + '\n';
}

function jsonLines(rows) {
  return rows.length ? rows.map((row) => JSON.stringify(row)).join('\n') + '\n' : '';
}

function normalizePath(p) {
  return path.resolve(p).replace(/[\\/]+$/, '');
}

export function assertStyleId(id) {
  const value = String(id || '').trim().toLowerCase();
  if (!STYLE_ID_RE.test(value)) throw new StyleError('invalid-style-id', `style id must match ${STYLE_ID_RE}: ${id || '(missing)'}`);
  return value;
}

export function resolveProjectRoot(start = process.cwd()) {
  let current = normalizePath(start);
  try {
    if (!fs.statSync(current).isDirectory()) current = path.dirname(current);
  } catch {
    current = path.dirname(current);
  }
  while (true) {
    if (fs.existsSync(path.join(current, '.agentkit.json')) || fs.existsSync(path.join(current, '.git'))) return current;
    const parent = path.dirname(current);
    if (parent === current) return normalizePath(start);
    current = parent;
  }
}

export function writingRoot(projectRoot) {
  return path.join(normalizePath(projectRoot), '.writing');
}

function styleRoot(projectRoot, styleId) {
  return path.join(writingRoot(projectRoot), 'styles', assertStyleId(styleId));
}

function contained(root, target) {
  const relative = path.relative(normalizePath(root), normalizePath(target));
  if (relative === '' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new StyleError('path-escape', `resolved path escapes project writing root: ${target}`);
  }
  return target;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(file, fallback = null) {
  if (!fs.existsSync(file)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new StyleError('invalid-json', `${path.basename(file)} is not valid JSON: ${error.message}`);
  }
}

function atomicWrite(file, value, encoding = 'utf8') {
  ensureDir(path.dirname(file));
  const suffix = `${process.pid}-${++tempCounter}`;
  const temp = `${file}.tmp-${suffix}`;
  try {
    fs.writeFileSync(temp, value, encoding);
    fs.renameSync(temp, file);
  } catch (error) {
    try { if (fs.existsSync(temp)) fs.unlinkSync(temp); } catch { /* preserve the original error */ }
    throw error;
  }
}

function atomicJson(file, value) {
  atomicWrite(file, json(value));
}

function normalizeEol(text) {
  return String(text).replace(/\r\n?/g, '\n').replace(/^\uFEFF/, '').normalize('NFC');
}

function decodeUtf8(bytes) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new StyleError('malformed-utf8', 'source is not valid UTF-8; it was not included');
  }
}

function sourceFormat(fileName) {
  const ext = path.extname(fileName).toLowerCase() || '.txt';
  if (!TEXT_EXTENSIONS.has(ext)) throw new StyleError('unsupported-input', `unsupported text format: ${ext}`);
  return ext;
}

function defaultConfig() {
  return {
    schema_version: SCHEMA_VERSION,
    default_style_id: null,
    styles: {},
    policy: { ...DEFAULT_POLICY },
  };
}

function configFile(projectRoot) {
  return path.join(writingRoot(projectRoot), 'config.json');
}

export function loadWritingConfig(projectRoot) {
  const config = readJson(configFile(projectRoot), defaultConfig());
  if (!config || typeof config !== 'object' || Array.isArray(config)) throw new StyleError('invalid-config', 'writing config must be an object');
  if (config.schema_version !== SCHEMA_VERSION) throw new StyleError('unsupported-schema', `writing config schema ${config.schema_version} is not supported`);
  config.styles = config.styles && typeof config.styles === 'object' && !Array.isArray(config.styles) ? config.styles : {};
  config.policy = { ...DEFAULT_POLICY, ...(config.policy || {}) };
  return config;
}

function saveWritingConfig(projectRoot, config) {
  atomicJson(configFile(projectRoot), config);
}

function sourceManifestFile(styleDir) {
  return path.join(styleDir, 'source-manifest.json');
}

function emptyManifest(styleId) {
  return { schema_version: SCHEMA_VERSION, style_id: styleId, sources: [] };
}

function loadManifest(styleDir, styleId) {
  const manifest = readJson(sourceManifestFile(styleDir), emptyManifest(styleId));
  if (!manifest || manifest.schema_version !== SCHEMA_VERSION || manifest.style_id !== styleId || !Array.isArray(manifest.sources)) {
    throw new StyleError('invalid-manifest', 'source-manifest.json has an unsupported shape or style id');
  }
  return manifest;
}

function saveManifest(styleDir, manifest) {
  atomicJson(sourceManifestFile(styleDir), manifest);
}

function styleMarkdownFile(styleDir) {
  return path.join(styleDir, 'style.md');
}

function initialStyleMarkdown(styleId, displayName, profileHash = 'pending') {
  return [
    '---',
    `schema_version: ${SCHEMA_VERSION}`,
    `style_id: ${styleId}`,
    'contract_status: reviewed',
    `reviewed_profile_sha256: ${profileHash}`,
    '---',
    '',
    `# ${displayName} writing style`,
    '',
    '## Voice',
    '',
    'Describe the intended stance, reader relationship, specificity, and cadence here.',
    '',
    '## Do',
    '',
    '- Prefer concrete language and useful examples.',
    '',
    '## Avoid',
    '',
    '- Avoid habits that obscure the point or overstate certainty.',
    '',
  ].join('\n');
}

function parseFrontmatter(raw) {
  const text = String(raw).replace(/\r\n/g, '\n');
  if (!text.startsWith('---\n')) return { fm: null, body: text };
  const end = text.indexOf('\n---', 4);
  if (end < 0) return { fm: null, body: text };
  const values = {};
  for (const line of text.slice(4, end).split('\n')) {
    const match = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!match) continue;
    values[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
  return { fm: values, body: text.slice(end + 5) };
}

export function validateStyleContract(styleMd, styleId) {
  const { fm, body } = parseFrontmatter(styleMd);
  const errors = [];
  if (!fm) errors.push('missing frontmatter');
  if (fm?.schema_version !== String(SCHEMA_VERSION)) errors.push(`schema_version must be ${SCHEMA_VERSION}`);
  if (fm?.style_id !== styleId) errors.push(`style_id must be ${styleId}`);
  if (!['reviewed', 'draft'].includes(fm?.contract_status)) errors.push('contract_status must be reviewed or draft');
  if (fm?.reviewed_profile_sha256 !== 'pending' && !/^[a-f0-9]{64}$/.test(fm?.reviewed_profile_sha256 || '')) {
    errors.push('reviewed_profile_sha256 must be a SHA-256 hex value or pending');
  }
  for (const heading of ['Voice', 'Do', 'Avoid']) {
    if (!new RegExp(`^##\\s+${heading}\\s*$`, 'im').test(body || '')) errors.push(`missing required section: ${heading}`);
  }
  if (errors.length) throw new StyleError('invalid-style-contract', `style.md is invalid: ${errors.join('; ')}`);
  return { fm, body };
}

function requireStyle(projectRoot, requestedId) {
  const config = loadWritingConfig(projectRoot);
  const styles = Object.values(config.styles).filter((style) => style && typeof style === 'object');
  let style = null;
  if (requestedId) {
    const wanted = String(requestedId).trim().toLowerCase();
    style = styles.find((candidate) => candidate.id === wanted || candidate.aliases?.some((alias) => String(alias).toLowerCase() === wanted));
    if (!style) throw new StyleError('style-not-found', `style not found: ${requestedId}`);
  } else if (config.default_style_id && config.styles[config.default_style_id]) {
    style = config.styles[config.default_style_id];
  } else if (styles.length === 1) {
    style = styles[0];
  } else if (!styles.length) {
    throw new StyleError('style-missing', 'no writing style exists; run init first');
  } else {
    throw new StyleError('style-ambiguous', 'more than one writing style exists; specify --style or a style id');
  }
  if (style.enabled === false) throw new StyleError('style-disabled', `style is disabled: ${style.id}`);
  const dir = styleRoot(projectRoot, style.id);
  if (!fs.existsSync(dir)) throw new StyleError('style-missing', `style directory is missing: ${style.id}`);
  return { config, style, dir };
}

function validateInputFile(file) {
  const absolute = normalizePath(file);
  let stat;
  try { stat = fs.lstatSync(absolute); } catch { throw new StyleError('input-missing', `input file does not exist: ${file}`); }
  if (stat.isSymbolicLink()) throw new StyleError('symlink-input', `symbolic-link input is not allowed: ${file}`);
  if (!stat.isFile()) throw new StyleError('unsupported-input', `input is not a regular file: ${file}`);
  return absolute;
}

function captureSource(options) {
  const hasFile = options.file !== undefined;
  const hasContent = options.content !== undefined;
  if (hasFile === hasContent) throw new StyleError('missing-content', 'provide exactly one of --file or --content');
  if (hasFile) {
    const file = validateInputFile(options.file);
    const bytes = fs.readFileSync(file);
    const text = decodeUtf8(bytes);
    return {
      bytes,
      text,
      original_name: path.basename(file),
      format: sourceFormat(file),
      capture_fidelity: 'original-bytes',
    };
  }
  const text = String(options.content);
  return {
    bytes: Buffer.from(text, 'utf8'),
    text,
    original_name: 'chat-content.txt',
    format: '.txt',
    capture_fidelity: 'host-decoded-text',
  };
}

function rightsAllowed(authorship, rightsBasis) {
  const author = String(authorship || 'self').toLowerCase();
  const rights = String(rightsBasis || '').toLowerCase();
  if (author === 'self') return ['self', 'owned', 'permission', 'license', 'organization-policy'].includes(rights || 'self');
  return ['permission', 'license', 'organization-policy'].includes(rights);
}

function scalarOption(options, key, fallback = null) {
  const value = options[key];
  if (Array.isArray(value)) return value[value.length - 1] ?? fallback;
  return value === undefined ? fallback : value;
}

function aliasesOption(options) {
  const values = Array.isArray(options.alias) ? options.alias : (options.alias === undefined ? [] : [options.alias]);
  return [...new Set(values.flatMap((value) => String(value).split(',').map((alias) => alias.trim().toLowerCase()).filter(Boolean)))].sort();
}

function words(text) {
  return String(text).match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) || [];
}

function sentences(text) {
  return String(text).split(/[.!?]+(?:\s+|$)/u).map((part) => part.trim()).filter(Boolean);
}

function paragraphs(text) {
  return String(text).split(/\n\s*\n/u).map((part) => part.trim()).filter(Boolean);
}

function frequency(wordsList) {
  const counts = new Map();
  for (const word of wordsList) {
    const normalized = word.toLowerCase();
    if (normalized.length < 3 || STOP_WORDS.has(normalized)) continue;
    counts.set(normalized, (counts.get(normalized) || 0) + 1);
  }
  return [...counts.entries()]
    .sort(([a, av], [b, bv]) => bv - av || a.localeCompare(b))
    .slice(0, 20)
    .map(([term, count]) => ({ term, count }));
}

function number(value) {
  return Number.isFinite(value) ? Number(value.toFixed(4)) : 0;
}

function documentMetrics(text, source) {
  const tokenList = words(text);
  const sentenceList = sentences(text);
  const paragraphList = paragraphs(text);
  const sentenceLengths = sentenceList.map((sentence) => words(sentence).length);
  const punctuation = {};
  for (const mark of String(text).match(/[,:;!?()[\]{}"“”'’—–-]/gu) || []) punctuation[mark] = (punctuation[mark] || 0) + 1;
  return {
    source_id: source.source_id,
    word_count: tokenList.length,
    sentence_count: sentenceList.length,
    paragraph_count: paragraphList.length,
    average_sentence_words: number(sentenceLengths.length ? sentenceLengths.reduce((sum, value) => sum + value, 0) / sentenceLengths.length : 0),
    median_sentence_words: sentenceLengths.length ? [...sentenceLengths].sort((a, b) => a - b)[Math.floor(sentenceLengths.length / 2)] : 0,
    average_word_length: number(tokenList.length ? tokenList.reduce((sum, word) => sum + word.length, 0) / tokenList.length : 0),
    first_person_rate: number(tokenList.length ? tokenList.filter((word) => /^(i|we|me|my|our|us)$/iu.test(word)).length / tokenList.length : 0),
    punctuation: Object.fromEntries(Object.entries(punctuation).sort(([a], [b]) => a.localeCompare(b))),
    top_terms: frequency(tokenList),
    mode: source.mode || null,
    genre: source.genre || null,
  };
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function deriveStability(metrics, policy) {
  if (metrics.length < policy.minimum_documents_for_actionable_scalar) return { leave_one_document_out: 'not-run', genre_strata: [] };
  const overall = average(metrics.map((metric) => metric.average_sentence_words));
  const byDocument = metrics.map((metric) => {
    const remaining = metrics.filter((candidate) => candidate.source_id !== metric.source_id);
    const without = average(remaining.map((candidate) => candidate.average_sentence_words));
    return {
      source_id: metric.source_id,
      average_sentence_words_without_document: number(without),
      relative_delta: number(overall ? Math.abs(without - overall) / overall : 0),
    };
  });
  const maxDelta = Math.max(...byDocument.map((row) => row.relative_delta), 0);
  return {
    leave_one_document_out: {
      status: maxDelta <= policy.max_leave_one_document_out_relative_delta ? 'stable-under-policy' : 'unstable-under-policy',
      scalar: 'average_sentence_words',
      overall: number(overall),
      max_relative_delta: number(maxDelta),
      by_document: byDocument,
    },
    genre_strata: [...new Set(metrics.map((metric) => metric.genre).filter(Boolean))].sort().map((genre) => ({
      genre,
      document_count: metrics.filter((metric) => metric.genre === genre).length,
      word_count: metrics.filter((metric) => metric.genre === genre).reduce((sum, metric) => sum + metric.word_count, 0),
    })),
  };
}

function buildChunks(styleDir, manifest) {
  const chunks = [];
  for (const source of [...manifest.sources].filter((entry) => entry.included !== false).sort((a, b) => a.source_id.localeCompare(b.source_id))) {
    const stored = contained(styleDir, path.join(styleDir, source.stored_path));
    if (!fs.existsSync(stored)) throw new StyleError('source-missing', `stored source is missing: ${source.source_id}`);
    const bytes = fs.readFileSync(stored);
    const actualHash = rawSha(bytes);
    if (actualHash !== source.content_sha256) throw new StyleError('source-changed', `stored source hash changed: ${source.source_id}`);
    const normalized = normalizeEol(decodeUtf8(bytes));
    const pieces = paragraphs(normalized);
    const selected = pieces.length ? pieces : (normalized.trim() ? [normalized.trim()] : []);
    selected.forEach((text, index) => {
      const chunkId = `chunk-${String(index + 1).padStart(4, '0')}`;
      chunks.push({
        schema_version: SCHEMA_VERSION,
        source_id: source.source_id,
        chunk_id: chunkId,
        text,
        word_count: words(text).length,
        mode: source.mode || null,
        genre: source.genre || null,
      });
    });
  }
  return chunks;
}

function deriveProfile(style, manifest, chunks, policy) {
  const sourceEntries = manifest.sources.filter((source) => source.included !== false).sort((a, b) => a.source_id.localeCompare(b.source_id));
  const bySource = new Map(sourceEntries.map((source) => [source.source_id, []]));
  for (const chunk of chunks) bySource.get(chunk.source_id)?.push(chunk.text);
  const metrics = sourceEntries.map((source) => documentMetrics((bySource.get(source.source_id) || []).join('\n\n'), source));
  const wordCount = metrics.reduce((sum, metric) => sum + metric.word_count, 0);
  const sentenceCount = metrics.reduce((sum, metric) => sum + metric.sentence_count, 0);
  const paragraphCount = metrics.reduce((sum, metric) => sum + metric.paragraph_count, 0);
  const allTerms = metrics.flatMap((metric) => metric.top_terms.flatMap((term) => Array.from({ length: term.count }, () => term.term)));
  const avgSentenceWords = average(metrics.map((metric) => metric.average_sentence_words));
  const modes = [...new Set(sourceEntries.map((source) => source.mode).filter(Boolean))].sort();
  const genres = [...new Set(sourceEntries.map((source) => source.genre).filter(Boolean))].sort();
  const stability = deriveStability(metrics, policy);
  const evidenceStatus = wordCount === 0 ? 'empty' : (wordCount < policy.limited_below_words ? 'limited' : 'actionable');
  const sentencePattern = avgSentenceWords < 12 ? 'short-sentence-lean' : (avgSentenceWords > 24 ? 'long-sentence-lean' : 'mixed-sentence-length');
  return {
    schema_version: SCHEMA_VERSION,
    compiler_version: COMPILER_VERSION,
    style_id: style.id,
    built_from_manifest_sha256: rawSha(json(manifest)),
    observable_choices: {
      stance: [average(metrics.map((metric) => metric.first_person_rate)) > 0.03 ? 'some-first-person-reference' : 'low-first-person-reference'],
      specificity: [{ metric: 'average_word_length', value: number(average(metrics.map((metric) => metric.average_word_length))) }],
      sentence_patterns: [sentencePattern],
      paragraph_patterns: [average(metrics.map((metric) => metric.paragraph_count)) > 4 ? 'multi-paragraph-documents' : 'compact-paragraph-documents'],
      punctuation_patterns: [...new Set(metrics.flatMap((metric) => Object.keys(metric.punctuation)))].sort(),
      transitions: [],
      terminology: frequency(allTerms),
    },
    mode_overrides: Object.fromEntries(modes.map((mode) => {
      const subset = metrics.filter((metric) => metric.mode === mode);
      return [mode, { document_count: subset.length, word_count: subset.reduce((sum, metric) => sum + metric.word_count, 0), average_sentence_words: number(average(subset.map((metric) => metric.average_sentence_words))) }];
    })),
    avoid: [],
    diagnostic_coverage: {
      source_count: sourceEntries.length,
      word_count: wordCount,
      document_count: metrics.length,
      sentence_count: sentenceCount,
      paragraph_count: paragraphCount,
      modes_observed: modes,
      genres_observed: genres,
      evidence_status: evidenceStatus,
      policy: { ...policy },
    },
    document_metrics: metrics,
    stability,
  };
}

function styleContract(styleDir, styleId) {
  const file = styleMarkdownFile(styleDir);
  if (!fs.existsSync(file)) throw new StyleError('invalid-style-contract', 'style.md is missing');
  const bytes = fs.readFileSync(file);
  const raw = bytes.toString('utf8');
  const parsed = validateStyleContract(raw, styleId);
  return {
    bytes,
    raw,
    fm: parsed.fm,
    style_md_sha256: rawSha(bytes),
  };
}

function buildArtifacts(style, styleDir, manifest, config) {
  const contract = styleContract(styleDir, style.id);
  const chunks = buildChunks(styleDir, manifest);
  const profile = deriveProfile(style, manifest, chunks, config.policy);
  const profileText = json(profile);
  const profileHash = rawSha(profileText);
  const candidates = chunks
    .filter((chunk) => chunk.word_count >= 8)
    .slice(0, 50)
    .map((chunk) => ({
      candidate_id: rawSha(`${style.id}\0${chunk.source_id}\0${chunk.chunk_id}\0${chunk.text}`).slice(0, 24),
      source_id: chunk.source_id,
      chunk_id: chunk.chunk_id,
      word_count: chunk.word_count,
      mode: chunk.mode,
      genre: chunk.genre,
      text: chunk.text,
    }));
  const approvedFile = path.join(styleDir, 'exemplars.approved.jsonl');
  const approved = fs.existsSync(approvedFile) ? fs.readFileSync(approvedFile, 'utf8') : '';
  const diagnosticsStatus = contract.fm.reviewed_profile_sha256 === profileHash ? 'reviewed' : 'needs-review';
  const effective = {
    schema_version: SCHEMA_VERSION,
    style_id: style.id,
    built_from_manifest_sha256: rawSha(json(manifest)),
    generated_profile_sha256: profileHash,
    style_contract: {
      status: contract.fm.contract_status,
      style_md_sha256: contract.style_md_sha256,
      reviewed_profile_sha256: contract.fm.reviewed_profile_sha256,
      diagnostics_status: diagnosticsStatus,
    },
    observable_choices: profile.observable_choices,
    mode_overrides: profile.mode_overrides,
    avoid: profile.avoid,
    diagnostic_coverage: profile.diagnostic_coverage,
    stability: profile.stability,
  };
  const baseline = {
    schema_version: SCHEMA_VERSION,
    style_id: style.id,
    source_count: profile.diagnostic_coverage.source_count,
    document_count: profile.diagnostic_coverage.document_count,
    word_count: profile.diagnostic_coverage.word_count,
    average_sentence_words: number(average(profile.document_metrics.map((metric) => metric.average_sentence_words))),
  };
  const manifestHash = rawSha(json(manifest));
  const state = {
    schema_version: SCHEMA_VERSION,
    style_id: style.id,
    manifest_sha256: manifestHash,
    generated_profile_sha256: profileHash,
    style_md_sha256: contract.style_md_sha256,
    diagnostics_status: diagnosticsStatus,
  };
  return {
    artifacts: {
      'normalized.jsonl': jsonLines(chunks),
      'profile.generated.json': profileText,
      'effective-profile.json': json(effective),
      'baseline.json': json(baseline),
      'exemplar-candidates.jsonl': jsonLines(candidates),
      'exemplars.approved.jsonl': approved,
      'build-state.json': json(state),
    },
    profileHash,
    manifestHash,
    diagnosticsStatus,
    coverage: profile.diagnostic_coverage,
  };
}

function publishArtifacts(styleDir, artifacts) {
  const previous = new Map();
  try {
    for (const name of ARTIFACTS) {
      const file = path.join(styleDir, name);
      previous.set(name, fs.existsSync(file) ? fs.readFileSync(file) : null);
    }
    for (const [name, content] of Object.entries(artifacts)) atomicWrite(path.join(styleDir, name), content);
  } catch (error) {
    for (const name of ARTIFACTS) {
      const file = path.join(styleDir, name);
      const old = previous.get(name);
      try {
        if (old === null) { if (fs.existsSync(file)) fs.unlinkSync(file); }
        else if (old !== undefined) atomicWrite(file, old);
      } catch { /* retain the original build error */ }
    }
    throw error;
  }
}

function lockFile(styleDir) {
  return path.join(styleDir, '.lock');
}

function withLock(styleDir, command, fn) {
  const lock = lockFile(styleDir);
  try {
    fs.writeFileSync(lock, JSON.stringify({ pid: process.pid, command }), { encoding: 'utf8', flag: 'wx' });
  } catch (error) {
    if (error.code === 'EEXIST') throw new StyleError('lock-held', `style is locked: ${path.basename(styleDir)}`);
    throw error;
  }
  try {
    return fn();
  } finally {
    try { fs.unlinkSync(lock); } catch { /* lock cleanup is best effort for this exact path */ }
  }
}

function buildAndPublish(projectRoot, resolved) {
  const manifest = loadManifest(resolved.dir, resolved.style.id);
  const built = buildArtifacts(resolved.style, resolved.dir, manifest, resolved.config);
  publishArtifacts(resolved.dir, built.artifacts);
  return { ...built, manifest };
}

function recordRun(resolved, command, built, extra = {}) {
  const runId = crypto.randomUUID();
  const run = {
    schema_version: SCHEMA_VERSION,
    run_id: runId,
    run_fingerprint: rawSha(json({ command, style_id: resolved.style.id, manifest_sha256: built.manifestHash, profile_sha256: built.profileHash, compiler_version: COMPILER_VERSION })),
    style_id: resolved.style.id,
    effective_profile_sha256: built.profileHash,
    command,
    source_manifest_sha256: built.manifestHash,
    model: 'not-used-by-compiler',
    checks: { deterministic_artifacts: 'pass', style_diagnostics: built.diagnosticsStatus },
    ...extra,
  };
  ensureDir(path.join(resolved.dir, 'runs'));
  atomicJson(path.join(resolved.dir, 'runs', `${runId}.json`), run);
  return run;
}

export function initStyle(projectRoot, options = {}) {
  const root = normalizePath(projectRoot);
  const id = assertStyleId(options.styleId || options.style || 'default');
  const displayName = String(options.displayName || id).trim() || id;
  const config = loadWritingConfig(root);
  if (config.styles[id]) throw new StyleError('style-exists', `style already exists: ${id}`);
  const dir = styleRoot(root, id);
  ensureDir(path.join(dir, 'sources'));
  const aliases = aliasesOption(options);
  if (aliases.includes(id)) throw new StyleError('alias-collision', `alias duplicates style id: ${id}`);
  for (const existing of Object.values(config.styles)) {
    if (aliases.some((alias) => alias === existing.id || existing.aliases?.some((candidate) => String(candidate).toLowerCase() === alias))) {
      throw new StyleError('alias-collision', `an alias is already used by style: ${existing.id}`);
    }
  }
  const style = { id, display_name: displayName, aliases, enabled: true };
  config.styles[id] = style;
  if (!config.default_style_id || options.default === true) config.default_style_id = id;
  saveWritingConfig(root, config);
  saveManifest(dir, emptyManifest(id));
  atomicWrite(styleMarkdownFile(dir), initialStyleMarkdown(id, displayName));
  try {
    const resolved = { config, style, dir };
    const built = withLock(dir, 'init', () => buildAndPublish(root, resolved));
    const styleMd = fs.readFileSync(styleMarkdownFile(dir), 'utf8').replace('reviewed_profile_sha256: pending', `reviewed_profile_sha256: ${built.profileHash}`);
    atomicWrite(styleMarkdownFile(dir), styleMd);
    const finalBuild = withLock(dir, 'init-finalize', () => buildAndPublish(root, resolved));
    recordRun(resolved, 'init', finalBuild);
    return { status: 'initialized', style_id: id, display_name: displayName, project_root: root, writing_root: writingRoot(root), profile_sha256: finalBuild.profileHash };
  } catch (error) {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* preserve the build error */ }
    delete config.styles[id];
    if (config.default_style_id === id) config.default_style_id = null;
    saveWritingConfig(root, config);
    throw error;
  }
}

export function addSource(projectRoot, options = {}) {
  const root = normalizePath(projectRoot);
  const resolved = requireStyle(root, scalarOption(options, 'style'));
  const capture = captureSource(options);
  const authorship = String(scalarOption(options, 'authorship', 'self')).toLowerCase();
  const rightsBasis = String(scalarOption(options, 'rights', authorship === 'self' ? 'self' : '')).toLowerCase();
  if (!rightsAllowed(authorship, rightsBasis)) throw new StyleError('rights-required', 'non-self-authored samples require rights: permission, license, or organization-policy');
  const sourceId = `src-${rawSha(capture.bytes).slice(0, 24)}`;
  const manifest = loadManifest(resolved.dir, resolved.style.id);
  const duplicate = manifest.sources.find((source) => source.content_sha256 === rawSha(capture.bytes));
  if (duplicate) return { status: 'duplicate', source_id: duplicate.source_id, style_id: resolved.style.id, mutated: false };
  const ext = capture.format;
  const storedPath = path.posix.join('sources', `${sourceId}${ext}`);
  const stored = contained(resolved.dir, path.join(resolved.dir, ...storedPath.split('/')));
  if (fs.existsSync(stored)) throw new StyleError('source-id-collision', `source path already exists: ${sourceId}`);
  const source = {
    source_id: sourceId,
    stored_path: storedPath,
    original_name: capture.original_name,
    content_sha256: rawSha(capture.bytes),
    capture_fidelity: capture.capture_fidelity,
    authorship,
    rights_basis: rightsBasis,
    format: ext,
    language: scalarOption(options, 'language'),
    genre: scalarOption(options, 'genre'),
    mode: scalarOption(options, 'mode'),
    included: true,
  };
  const previousManifest = json(manifest);
  ensureDir(path.dirname(stored));
  fs.writeFileSync(stored, capture.bytes, { flag: 'wx' });
  manifest.sources.push(source);
  manifest.sources.sort((a, b) => a.source_id.localeCompare(b.source_id));
  try {
    saveManifest(resolved.dir, manifest);
    const built = withLock(resolved.dir, 'add', () => buildAndPublish(root, resolved));
    recordRun(resolved, 'add', built, { source_ids: [sourceId] });
    return { status: 'added', source_id: sourceId, style_id: resolved.style.id, capture_fidelity: capture.capture_fidelity, profile_sha256: built.profileHash, coverage: built.coverage, mutated: true };
  } catch (error) {
    atomicWrite(sourceManifestFile(resolved.dir), previousManifest);
    try { fs.unlinkSync(stored); } catch { /* preserve the original build error */ }
    throw error;
  }
}

export function updateStyle(projectRoot, requestedStyle) {
  const root = normalizePath(projectRoot);
  const resolved = requireStyle(root, requestedStyle);
  const built = withLock(resolved.dir, 'update', () => buildAndPublish(root, resolved));
  recordRun(resolved, 'update', built);
  return { status: 'updated', style_id: resolved.style.id, profile_sha256: built.profileHash, diagnostics_status: built.diagnosticsStatus, coverage: built.coverage, mutated: true };
}

export function listStyles(projectRoot) {
  const config = loadWritingConfig(normalizePath(projectRoot));
  return Object.values(config.styles).sort((a, b) => a.id.localeCompare(b.id)).map((style) => ({ ...style, default: config.default_style_id === style.id }));
}

export function inspectStyle(projectRoot, requestedStyle) {
  const root = normalizePath(projectRoot);
  const resolved = requireStyle(root, requestedStyle);
  const manifest = loadManifest(resolved.dir, resolved.style.id);
  const state = readJson(path.join(resolved.dir, 'build-state.json'), null);
  const profile = readJson(path.join(resolved.dir, 'profile.generated.json'), null);
  const currentManifestHash = rawSha(json(manifest));
  return {
    style: resolved.style,
    project_root: root,
    writing_root: writingRoot(root),
    source_count: manifest.sources.length,
    included_source_count: manifest.sources.filter((source) => source.included !== false).length,
    dirty: !state || state.manifest_sha256 !== currentManifestHash,
    build_state: state,
    coverage: profile?.diagnostic_coverage || null,
  };
}

export function excludeSource(projectRoot, sourceId, requestedStyle) {
  const root = normalizePath(projectRoot);
  const resolved = requireStyle(root, requestedStyle);
  const manifest = loadManifest(resolved.dir, resolved.style.id);
  const source = manifest.sources.find((candidate) => candidate.source_id === sourceId);
  if (!source) throw new StyleError('source-not-found', `source not found: ${sourceId}`);
  if (source.included === false) return { status: 'already-excluded', source_id: sourceId, mutated: false };
  const previous = json(manifest);
  source.included = false;
  try {
    saveManifest(resolved.dir, manifest);
    const built = withLock(resolved.dir, 'exclude-source', () => buildAndPublish(root, resolved));
    recordRun(resolved, 'exclude-source', built, { source_ids: [sourceId] });
    return { status: 'excluded', source_id: sourceId, profile_sha256: built.profileHash, mutated: true };
  } catch (error) {
    atomicWrite(sourceManifestFile(resolved.dir), previous);
    throw error;
  }
}

export function purgeSource(projectRoot, sourceId, requestedStyle, confirmed = false) {
  if (!confirmed) throw new StyleError('confirmation-required', 'purge-source is destructive; pass --confirm');
  const root = normalizePath(projectRoot);
  const resolved = requireStyle(root, requestedStyle);
  const manifest = loadManifest(resolved.dir, resolved.style.id);
  const index = manifest.sources.findIndex((candidate) => candidate.source_id === sourceId);
  if (index < 0) throw new StyleError('source-not-found', `source not found: ${sourceId}`);
  const source = manifest.sources[index];
  const stored = contained(resolved.dir, path.join(resolved.dir, ...source.stored_path.split('/')));
  const bytes = fs.readFileSync(stored);
  const previous = json(manifest);
  manifest.sources.splice(index, 1);
  try {
    saveManifest(resolved.dir, manifest);
    fs.unlinkSync(stored);
    const built = withLock(resolved.dir, 'purge-source', () => buildAndPublish(root, resolved));
    recordRun(resolved, 'purge-source', built, { source_ids: [sourceId] });
    return { status: 'purged', source_id: sourceId, profile_sha256: built.profileHash, mutated: true, recoverable: false };
  } catch (error) {
    atomicWrite(sourceManifestFile(resolved.dir), previous);
    if (!fs.existsSync(stored)) atomicWrite(stored, bytes);
    throw error;
  }
}

export function approveExemplar(projectRoot, candidateId, requestedStyle) {
  const root = normalizePath(projectRoot);
  const resolved = requireStyle(root, requestedStyle);
  const candidateFile = path.join(resolved.dir, 'exemplar-candidates.jsonl');
  const candidate = fs.existsSync(candidateFile)
    ? fs.readFileSync(candidateFile, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line)).find((row) => row.candidate_id === candidateId)
    : null;
  if (!candidate) throw new StyleError('exemplar-not-found', `exemplar candidate not found: ${candidateId}`);
  const approvedFile = path.join(resolved.dir, 'exemplars.approved.jsonl');
  const approved = fs.existsSync(approvedFile) ? fs.readFileSync(approvedFile, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line)) : [];
  if (approved.some((row) => row.candidate_id === candidateId)) return { status: 'already-approved', candidate_id: candidateId, mutated: false };
  approved.push(candidate);
  approved.sort((a, b) => a.candidate_id.localeCompare(b.candidate_id));
  atomicWrite(approvedFile, jsonLines(approved));
  return { status: 'approved', candidate_id: candidateId, style_id: resolved.style.id, mutated: true };
}

export function auditStyle(projectRoot, requestedStyle) {
  const root = normalizePath(projectRoot);
  const resolved = requireStyle(root, requestedStyle);
  const findings = [];
  try { styleContract(resolved.dir, resolved.style.id); } catch (error) { findings.push({ code: error.code, message: error.message }); }
  const manifest = loadManifest(resolved.dir, resolved.style.id);
  for (const source of manifest.sources) {
    try {
      const stored = contained(resolved.dir, path.join(resolved.dir, ...source.stored_path.split('/')));
      if (!fs.existsSync(stored)) findings.push({ code: 'source-missing', source_id: source.source_id, message: `stored source is missing: ${source.source_id}` });
      else if (rawSha(fs.readFileSync(stored)) !== source.content_sha256) findings.push({ code: 'source-changed', source_id: source.source_id, message: `stored source hash changed: ${source.source_id}` });
    } catch (error) { findings.push({ code: error.code || 'path-error', source_id: source.source_id, message: error.message }); }
  }
  const state = readJson(path.join(resolved.dir, 'build-state.json'), null);
  const dirty = !state || state.manifest_sha256 !== rawSha(json(manifest));
  return { status: findings.length || dirty ? 'needs-attention' : 'ok', style_id: resolved.style.id, dirty, findings };
}

function parseArgs(argv) {
  const [command = 'help', ...rest] = argv;
  const options = {};
  const positionals = [];
  const repeatable = new Set(['alias']);
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (!token.startsWith('--')) { positionals.push(token); continue; }
    const [rawKey, inline] = token.slice(2).split('=', 2);
    const key = rawKey.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    if (['root', 'project', 'writingRoot', 'global'].includes(key)) {
      throw new StyleError('unsupported-option', `--${rawKey} is not supported; writing styles are project-local`);
    }
    const value = inline !== undefined ? inline : (rest[index + 1] && !rest[index + 1].startsWith('--') ? rest[++index] : true);
    if (repeatable.has(key)) options[key] = [...(Array.isArray(options[key]) ? options[key] : []), value];
    else options[key] = value;
  }
  return { command, positionals, options };
}

function usage() {
  return [
    'writing-style commands:',
    '  init <style-id> [--display-name Name] [--alias name] [--default]',
    '  add [style-id] (--file path | --content text) [--authorship self|organization|third-party] [--rights basis]',
    '  update [style-id]',
    '  inspect [style-id]',
    '  list',
    '  approve-exemplar <candidate-id> [style-id]',
    '  exclude-source <source-id> [style-id]',
    '  purge-source <source-id> [style-id] --confirm',
    '  audit [style-id]',
    '',
    'All commands resolve the nearest project and store data under <project>/.writing.',
  ].join('\n');
}

function styleArg(positionals, options) {
  return scalarOption(options, 'style') || positionals[0] || null;
}

export function runCommand(argv, cwd = process.cwd()) {
  const { command, positionals, options } = parseArgs(argv);
  const root = resolveProjectRoot(cwd);
  switch (command) {
    case 'help':
    case '--help':
    case '-h': return { status: 'help', text: usage() };
    case 'init': return initStyle(root, { ...options, styleId: positionals[0] || scalarOption(options, 'style') });
    case 'add': return addSource(root, { ...options, style: styleArg(positionals, options) });
    case 'update': return updateStyle(root, styleArg(positionals, options));
    case 'inspect': return inspectStyle(root, styleArg(positionals, options));
    case 'list': return { styles: listStyles(root), project_root: root, writing_root: writingRoot(root) };
    case 'approve-exemplar': return approveExemplar(root, positionals[0], styleArg(positionals.slice(1), options));
    case 'exclude-source': return excludeSource(root, positionals[0], styleArg(positionals.slice(1), options));
    case 'purge-source': return purgeSource(root, positionals[0], styleArg(positionals.slice(1), options), options.confirm === true || options.confirm === 'true');
    case 'audit': return auditStyle(root, styleArg(positionals, options));
    default: throw new StyleError('unknown-command', `unknown command: ${command}`);
  }
}

export function main(argv = process.argv.slice(2), cwd = process.cwd()) {
  try {
    const result = runCommand(argv, cwd);
    if (result?.status === 'help') console.log(result.text);
    else console.log(JSON.stringify(result, null, 2));
    return 0;
  } catch (error) {
    const result = { status: 'error', code: error.code || 'error', message: error.message };
    console.error(JSON.stringify(result, null, 2));
    return 1;
  }
}

const entry = process.argv[1] ? normalizePath(process.argv[1]) : null;
if (entry && entry === normalizePath(fileURLToPath(import.meta.url))) process.exitCode = main();

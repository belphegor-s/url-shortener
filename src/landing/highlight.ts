/** Tiny server-side syntax highlighter for the snippets on the public site.
 *
 *  Three grammars is all this site needs: shell (the curl examples), JSON (request
 *  and response bodies) and raw HTTP (the redirect example). Everything is tokenised
 *  here and emitted as escaped spans, so the pages keep their strict CSP with no
 *  client-side highlighter to ship, parse and run. */

export type Lang = 'bash' | 'json' | 'http';

/** Token classes. The stylesheet maps each to a colour in both themes. */
type Tok =
	| 'txt' // unclassified
	| 'com' // comment
	| 'str' // string literal
	| 'cmd' // command name
	| 'flg' // -f / --flag
	| 'num' // number
	| 'key' // JSON object key
	| 'lit' // true / false / null
	| 'var' // $VARIABLE
	| 'pun' // punctuation
	| 'hdr'; // HTTP header name

interface Piece {
	t: Tok;
	v: string;
}

const esc = (value: string): string =>
	value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const emit = (pieces: Piece[]): string =>
	pieces.map((p) => (p.t === 'txt' ? esc(p.v) : `<span class="t-${p.t}">${esc(p.v)}</span>`)).join('');

/** Highlight `code` as `lang`, returning HTML that is already escaped. */
export function highlight(code: string, lang: Lang): string {
	if (lang === 'json') return emit(json(code));
	if (lang === 'http') return emit(http(code));
	return emit(bash(code));
}

/* ------------------------------------------------------------------ shell --- */

const WORD_BREAK = /[\s|;&()<>]/;

function bash(src: string): Piece[] {
	const out: Piece[] = [];
	let i = 0;
	let atStart = true;

	const push = (t: Tok, v: string) => {
		if (v) out.push({ t, v });
	};

	while (i < src.length) {
		const ch = src[i]!;

		// Line continuation: keep the backslash visible but unstyled.
		if (ch === '\\' && src[i + 1] === '\n') {
			push('txt', '\\\n');
			i += 2;
			continue;
		}

		// Whitespace runs pass through; a newline reopens a command position.
		if (/\s/.test(ch)) {
			let j = i;
			while (j < src.length && /\s/.test(src[j]!)) j++;
			const run = src.slice(i, j);
			if (run.includes('\n')) atStart = true;
			push('txt', run);
			i = j;
			continue;
		}

		// Comment to end of line.
		if (ch === '#') {
			const end = src.indexOf('\n', i);
			const stop = end === -1 ? src.length : end;
			push('com', src.slice(i, stop));
			i = stop;
			continue;
		}

		// Quoted strings, which may span lines and may wrap a JSON payload.
		if (ch === "'" || ch === '"') {
			const end = closingQuote(src, i, ch);
			out.push(...quoted(src.slice(i, end), ch));
			i = end;
			atStart = false;
			continue;
		}

		// Shell variable.
		if (ch === '$' && /[A-Za-z_{]/.test(src[i + 1] ?? '')) {
			const m = /^\$(?:\{[^}]*\}|[A-Za-z_][A-Za-z0-9_]*)/.exec(src.slice(i))!;
			push('var', m[0]);
			i += m[0].length;
			atStart = false;
			continue;
		}

		// Pipes and separators reopen a command position.
		if (/[|;&]/.test(ch)) {
			let j = i;
			while (j < src.length && /[|;&]/.test(src[j]!)) j++;
			push('pun', src.slice(i, j));
			i = j;
			atStart = true;
			continue;
		}

		// A bare word: a flag, a number, the command itself, or plain text.
		let j = i;
		while (j < src.length && !WORD_BREAK.test(src[j]!) && src[j] !== "'" && src[j] !== '"' && src[j] !== '$') j++;
		const word = src.slice(i, j) || ch;
		if (/^-{1,2}[A-Za-z]/.test(word)) push('flg', word);
		else if (/^-?\d+(?:\.\d+)?$/.test(word)) push('num', word);
		else if (atStart) push('cmd', word);
		else push('txt', word);
		i += word.length;
		atStart = false;
	}

	return out;
}

/** Index just past the quote that closes the one at `start`. */
function closingQuote(src: string, start: number, quote: string): number {
	let i = start + 1;
	while (i < src.length) {
		if (src[i] === '\\' && quote === '"') i += 2;
		else if (src[i] === quote) return i + 1;
		else i++;
	}
	return src.length;
}

/** A quoted run. JSON payloads are highlighted inside the quotes, which is what
 *  most of these snippets actually carry; anything else keeps `$VAR` picked out. */
function quoted(text: string, quote: string): Piece[] {
	const inner = text.slice(1, text.endsWith(quote) && text.length > 1 ? -1 : undefined);
	const close = text.endsWith(quote) && text.length > 1 ? quote : '';

	if (/^\s*[{[]/.test(inner)) {
		return [{ t: 'str', v: quote }, ...json(inner), { t: 'str', v: close }];
	}

	const pieces: Piece[] = [{ t: 'str', v: quote }];
	const varPattern = /\$(?:\{[^}]*\}|[A-Za-z_][A-Za-z0-9_]*)/g;
	let last = 0;
	if (quote === '"') {
		for (let m = varPattern.exec(inner); m; m = varPattern.exec(inner)) {
			if (m.index > last) pieces.push({ t: 'str', v: inner.slice(last, m.index) });
			pieces.push({ t: 'var', v: m[0] });
			last = m.index + m[0].length;
		}
	}
	if (last < inner.length) pieces.push({ t: 'str', v: inner.slice(last) });
	if (close) pieces.push({ t: 'str', v: close });
	return pieces;
}

/* ------------------------------------------------------------------- json --- */

function json(src: string): Piece[] {
	const out: Piece[] = [];
	let i = 0;

	while (i < src.length) {
		const ch = src[i]!;

		if (/\s/.test(ch)) {
			let j = i;
			while (j < src.length && /\s/.test(src[j]!)) j++;
			out.push({ t: 'txt', v: src.slice(i, j) });
			i = j;
			continue;
		}

		if (ch === '"') {
			const end = closingQuote(src, i, '"');
			const value = src.slice(i, end);
			// A string followed by a colon is a key, not a value.
			let k = end;
			while (k < src.length && /\s/.test(src[k]!)) k++;
			out.push({ t: src[k] === ':' ? 'key' : 'str', v: value });
			i = end;
			continue;
		}

		const literal = /^(?:true|false|null)\b/.exec(src.slice(i));
		if (literal) {
			out.push({ t: 'lit', v: literal[0] });
			i += literal[0].length;
			continue;
		}

		const number = /^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(src.slice(i));
		if (number) {
			out.push({ t: 'num', v: number[0] });
			i += number[0].length;
			continue;
		}

		if ('{}[],:'.includes(ch)) {
			out.push({ t: 'pun', v: ch });
			i++;
			continue;
		}

		out.push({ t: 'txt', v: ch });
		i++;
	}

	return out;
}

/* ------------------------------------------------------------------- http --- */

function http(src: string): Piece[] {
	const out: Piece[] = [];

	src.split('\n').forEach((line, index, lines) => {
		const status = /^(HTTP\/[\d.]+)(\s+)(\d{3})(.*)$/.exec(line);
		if (status) {
			out.push({ t: 'cmd', v: status[1]! }, { t: 'txt', v: status[2]! }, { t: 'num', v: status[3]! }, { t: 'txt', v: status[4]! });
		} else {
			const header = /^([A-Za-z][A-Za-z0-9-]*)(:\s*)(.*)$/.exec(line);
			if (header) out.push({ t: 'hdr', v: header[1]! }, { t: 'pun', v: header[2]! }, { t: 'str', v: header[3]! });
			else out.push({ t: 'txt', v: line });
		}
		if (index < lines.length - 1) out.push({ t: 'txt', v: '\n' });
	});

	return out;
}

/**
 * splitText — splits an element's text into masked lines / words / chars
 * with wrapping spans, preserving <em>/<strong>/<br> and accessibility
 * (original text stays available to AT via aria-label).
 *
 *   lines: <span.sl__line (overflow hidden)> <span.sl__inner> …words </span></span>
 *   words: <span.sw__mask (overflow hidden)> <span.sw>word</span> </span>
 *   chars: word spans containing <span.sc>c</span> (word-wrapped, so no mid-word breaks)
 */

const WORD_KEEP = new Set(['EM', 'STRONG', 'B', 'I']);

function wrapWords(node, frag, italic, masked) {
  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      child.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(' '));
          return;
        }
        const w = document.createElement('span');
        w.className = 'sw' + (italic ? ' sw--em' : '');
        w.textContent = part;
        if (masked) {
          const mask = document.createElement('span');
          mask.className = 'sw__mask';
          mask.appendChild(w);
          frag.appendChild(mask);
        } else {
          frag.appendChild(w);
        }
      });
    } else if (child.nodeName === 'BR') {
      frag.appendChild(document.createElement('br'));
    } else if (WORD_KEEP.has(child.nodeName)) {
      wrapWords(child, frag, italic || child.nodeName === 'EM' || child.nodeName === 'I', masked);
    } else {
      frag.appendChild(child.cloneNode(true));
    }
  });
}

export class Split {
  /** @param {'lines'|'words'|'chars'} type */
  constructor(el, type = 'lines') {
    this.el = el;
    this.type = type;
    this.original = el.innerHTML;
    // aria-label is prohibited on generic elements (p/span), so AT gets a
    // visually-hidden copy of the text and the animated spans are hidden.
    this.srText = document.createElement('span');
    this.srText.className = 'sr-only';
    this.srText.textContent = el.textContent.replace(/\s+/g, ' ').trim();
    this.split();
  }

  split() {
    const { el, type } = this;
    const frag = document.createDocumentFragment();
    wrapWords(el, frag, false, type === 'words');
    el.innerHTML = '';
    el.appendChild(frag);

    this.words = [...el.querySelectorAll('.sw')];
    this.words.forEach((w) => w.setAttribute('aria-hidden', 'true'));

    if (type === 'chars') {
      this.chars = [];
      this.words.forEach((w) => {
        const text = w.textContent;
        w.textContent = '';
        [...text].forEach((c) => {
          const s = document.createElement('span');
          s.className = 'sc';
          s.textContent = c;
          w.appendChild(s);
          this.chars.push(s);
        });
      });
    }

    if (type === 'lines') {
      // group top-level nodes by rendered row
      const rows = [];
      let current = null;
      let lastTop = null;
      [...el.childNodes].forEach((node) => {
        if (node.nodeName === 'BR') {
          current = null;
          lastTop = null;
          node.remove();
          return;
        }
        const isWord = node.nodeType === 1 && node.classList.contains('sw');
        if (isWord) {
          const top = node.offsetTop;
          if (current === null || Math.abs(top - lastTop) > 2) {
            current = [];
            rows.push(current);
            lastTop = top;
          }
          current.push(node);
        } else if (current) {
          current.push(node);
        }
      });

      el.innerHTML = '';
      this.lines = rows.map((nodes) => {
        const line = document.createElement('span');
        line.className = 'sl__line';
        const inner = document.createElement('span');
        inner.className = 'sl__inner';
        nodes.forEach((n) => inner.appendChild(n));
        line.appendChild(inner);
        el.appendChild(line);
        return inner;
      });
    }

    el.appendChild(this.srText);
    el.classList.add('is-split');
  }

  targets() {
    if (this.type === 'lines') return this.lines;
    if (this.type === 'chars') return this.chars;
    return this.words;
  }

  revert() {
    this.el.innerHTML = this.original;
    this.el.classList.remove('is-split');
  }

  resplit() {
    this.revert();
    this.split();
  }
}

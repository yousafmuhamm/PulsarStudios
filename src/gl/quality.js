/**
 * Adaptive quality tier — the Lusion-class "performance monitor". Samples
 * frame time on the gsap ticker and steps a 0..1 quality value down when
 * the page can't hold ~60fps, back up when it has headroom. Renderer + post
 * read this each frame so DPR, bloom resolution and effect strength track
 * the machine's real capability: lush on an M-series Mac, smooth on a
 * Chromebook, without shipping two codepaths.
 *
 *   tier.value   0..1, eased — multiply DPR caps / effect strengths by it
 *   tier.dpr()   convenience: the DPR to use right now
 */
import { gsap } from '../core.js';
import { lowPower, reducedMotion } from '../utils/env.js';

const DPR_MAX = () => Math.min(window.devicePixelRatio || 1, lowPower ? 1.4 : 2);
const DPR_MIN = 1;

class QualityTier {
  constructor() {
    this.value = lowPower ? 0.55 : 1; // eased 0..1
    this._raw = this.value;
    this._acc = 0;
    this._frames = 0;
    this._below = 0;
    this._above = 0;
    this._listeners = new Set();
    this._started = false;
  }

  start() {
    if (this._started || reducedMotion) return;
    this._started = true;
    this._tick = this._tick.bind(this);
    gsap.ticker.add(this._tick);
  }

  onChange(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  dpr() {
    return DPR_MIN + (DPR_MAX() - DPR_MIN) * this.value;
  }

  _tick(_t, dtMs) {
    // ignore huge dt (tab refocus, breakpoints) so one stall can't crater the tier
    if (dtMs > 60) return;
    this._acc += dtMs;
    this._frames++;
    if (this._acc < 500) return; // evaluate ~twice a second

    const avg = this._acc / this._frames;
    this._acc = 0;
    this._frames = 0;

    // hysteresis: need sustained evidence before moving the tier, so it
    // never oscillates. Drop fast (bad frames hurt), recover slowly.
    if (avg > 20) {
      // < ~50fps
      this._below++;
      this._above = 0;
      if (this._below >= 2) {
        this._raw = Math.max(0.35, this._raw - 0.2);
        this._below = 0;
      }
    } else if (avg < 17.2) {
      // comfortably 60fps — probe upward
      this._above++;
      this._below = 0;
      if (this._above >= 4) {
        this._raw = Math.min(1, this._raw + 0.12);
        this._above = 0;
      }
    } else {
      this._below = 0;
      this._above = 0;
    }

    if (Math.abs(this._raw - this.value) > 0.001) {
      this.value += (this._raw - this.value) * 0.5; // ease toward target
      if (Math.abs(this._raw - this.value) < 0.01) this.value = this._raw;
      this._listeners.forEach((fn) => fn(this.value));
    }
  }
}

export const tier = new QualityTier();

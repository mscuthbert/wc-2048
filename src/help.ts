import {unsafeCSS} from 'lit';
import {s} from './styles';

export function rgb_s(val: any[]) {
    let r: number;
    let g: number;
    let b: number;
    let a: number = 1.0;
    if (val.length === 3) {
        [r, g, b] = val;
    } else {
        [r, g, b, a] = val;
    }
    const out = `rgba(${r}, ${g}, ${b}, ${a})`;
    return unsafeCSS(out);
}

export function button() {
    return unsafeCSS(`
        display: inline-block;
        background: ${rgb_s(s.game_container_background_darkened)};
        border-radius: 3px;
        padding: 0 20px;
        color: ${rgb_s(s.bright_text_color)};
        height: 40px;
        line-height: 42px;
        margin-left: 9px;
        font-weight: bold;
        text-align: center;
        text-decoration: none;
        font-family: "Clear Sans", "Helvetica Neue", Arial, sans-serif;
        cursor: pointer;
    `);
}


export function transition_with_promise(
    el: Element,
    func: () => any = () => undefined
): Promise<true> {
    return new Promise(resolve => {
        const transitionEnded = () => {
            el?.removeEventListener('transitionend', transitionEnded);
            resolve(true);
        };
        el?.addEventListener('transitionend', transitionEnded);
        sleep().then(() => func());
    });
}

export async function sleep(ms?: number): Promise<number> {
    if (ms) {
        return new Promise(resolve => window.setTimeout(resolve, ms));
    } else {
        return new Promise(requestAnimationFrame);
    }
}


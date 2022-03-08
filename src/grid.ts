import {css, html, LitElement} from 'lit';
import {customElement} from 'lit/decorators.js';

import {s} from './styles';
import {rgb_s, sleep} from './help';
import {MTile} from './tile';

@customElement('m-grid')
export class MGrid extends LitElement {
    static override styles = css`
        :host {
            display: inline-block;
            position: relative;
            cursor: default;
            -webkit-touch-callout: none;
            user-select: none;
            touch-action: none;
            box-sizing: border-box;   
            width: ${s.field_width}px;
        }
        .grid {
            box-sizing: border-box;   
            position: absolute;
            top: 0;
            left: 0;
            z-index: 0;
            display: inline-grid;
            background-color: #bbada0;
            border-radius: ${s.tile_border_radius}px;
            color: #f9f6f2;
            width: ${s.field_width}px;
            padding: ${s.grid_spacing}px;
            gap: ${s.grid_spacing}px;
            grid-template-columns: ${s.tile_size}px ${s.tile_size}px ${s.tile_size}px ${s.tile_size}px;
        }
        .grid-cell {
            margin: 0px;
            padding: 0px;
            box-sizing: border-box;   
            width: ${s.tile_size}px;
            height: ${s.tile_size}px;
            border-radius: ${s.tile_border_radius}px;
            background: ${rgb_s([...s.tile_color, 0.35])};
        }
        
        .board {
            box-sizing: border-box;   
            position: absolute;
            top: 0px;
            left: 0px;
        }`;

    override render() {
        return html`
            <div class="grid">
                ${[0, 1, 2, 3].map(y => [0, 1, 2, 3].map(
            x => html`<div class="grid-cell" data-y="${y}" data-x="${x}"></div>`
        ))}
            </div><div class="board"></div>
        `;
    }

    remove_all_tiles() {
        this.shadowRoot.querySelector('.board').innerHTML = '';
    }

    async append_tile(t: MTile): Promise<void> {
        this.shadowRoot.querySelector('.board').appendChild(t);
        await sleep(50);
        await t.updateComplete;
        t.active = true;
        await sleep(s.transition_speed);
    }
}


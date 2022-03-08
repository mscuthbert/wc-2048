import {customElement, property, query} from 'lit/decorators.js';
import {css, html, LitElement} from 'lit';
import {classMap} from 'lit/directives/class-map.js';

import {rgb_s, sleep} from './help';
import {s} from './styles';

@customElement('m-scoreboard')
export class MScoreboard extends LitElement {
    @property({type: Number}) score: number = 0;
    @property({type: Number}) latest_add: number = 0;
    @property({type: Boolean}) is_current_score: boolean = false;

    @query('.latest_add') latest_add_div: HTMLElement;

    _add_timeout: number;

    static override get styles() {
        const height = 25;
        return css`
            :host {
                position: relative;
                display: inline-block;
                background: ${rgb_s(s.game_container_background)};
                padding: 15px 25px;
                font-size: ${height}px;
                height: ${height}px;
                line-height: ${height + 22}px;
                font-weight: bold;
                border-radius: 3px;
                color: white;
                margin-top: 8px;
                text-align: center;
            }
            :host:after {
                position: absolute;
                width: 100%;
                top: 10px;
                left: 0;
                text-transform: uppercase;
                font-size: 13px;
                line-height: 13px;
                text-align: center;
                color: ${rgb_s(s.tile_color)};
            }
            :host([is_current_score]):after {
                content: "Score"
            }
            :host(:not([is_current_score])):after {
                content: "Best"
            }

            .latest_add {
                transition: all 800ms;           
                position: absolute;
                top: 10px;
                left: 10px;
                display: inline-block;
                color: black;
                opacity: 1;
                transform: translate(0px, 0px);
            }           
            .latest_add.active {
                opacity: 0.0;
                transform: translate(0px, -80px);
            }
            .latest_add.inactive {
                transition: all 1ms;
            }
        `;
    }

    async set_score(val: number) {
        if (this._add_timeout !== undefined) {
            window.clearTimeout(this._add_timeout);
            this._add_timeout = 0;
            this.latest_add = 0;
            this.latest_add_div.classList.add('inactive');
            await this.updateComplete;
            await sleep(3);
            this.latest_add_div.classList.remove('inactive');
        }
        const prev_score = this.score;
        this.score = val;
        if (!this.is_current_score) {
            return;
        }
        this.latest_add = val - prev_score;
        this._add_timeout = window.setTimeout(() => {
            this.latest_add = 0;
            this._add_timeout = undefined;
        }, 1000);
    }

    override render() {
        const active = (this.latest_add !== 0);
        const active_classes = {active};
        return html`
            <div class="score">
                ${this.score}
            </div>
            <div class="latest_add ${classMap(active_classes)}">
                ${active ? html`+${this.latest_add}` : null}
            </div>
        `;
    }
}

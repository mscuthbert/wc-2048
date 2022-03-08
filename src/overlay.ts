import {
    css,
    html,
    LitElement,
} from 'lit';
import {
    customElement,
    property,
} from 'lit/decorators.js';
import {classMap} from 'lit/directives/class-map.js';

import {s} from './styles';
import {button, rgb_s} from './help';

@customElement('m-overlay')
export class MOverlay extends LitElement {
    @property({type: Boolean}) show_game_won: boolean = false;
    @property({type: Boolean}) game_over: boolean = false;

    static override styles = css`    
        @keyframes fade-in {
            0% {
                opacity: 0;
            }
            100% {
                opacity: 1;
            }
        }
        .game-message {
            animation: fade-in 800ms ease ${s.transition_speed * 12}ms;
            animation-fill-mode: both;
            
            display: none;
            position: absolute;
            top: 18px;
            right: 0;
            bottom: 0;
            left: 0;
            opacity: 0;
            width: 100%;
            height: 100%;
            background: ${rgb_s([...s.tile_color, 0.5])};
            z-index: 100;           
            text-align: center;
            position: absolute;
        }
        p {
            font-size: 60px;
            font-weight: bold;
            height: 60px;
            line-height: 60px;
            margin-top: 182px;
        }
        .lower {
            display: block;
            margin-top: 59px;
        }
        a.button {
            ${button()}
        }
        
        .game-won {
            display: block;
            background: ${rgb_s([...s.tile_gold_color, 0.5])};
            color: ${rgb_s(s.bright_text_color)};
        }
        .game-over {
            display: block;
        }
    `;

    keep_going() {
        const evt = new Event('keep_going', {bubbles: true, composed: true});
        this.dispatchEvent(evt);
    }

    try_again() {
        const evt = new Event('try_again', {bubbles: true, composed: true});
        this.dispatchEvent(evt);
    }

    override render() {
        const classes = {'game-won': this.show_game_won, 'game-over': this.game_over};
        return html`
            <div class="game-message ${classMap(classes)}">
                <p>
                    ${this.game_over ? 'Game over!' : ''}
                    ${this.show_game_won ? 'You win!' : ''}
                </p>
                <div class="lower">
                    ${this.show_game_won ? html`
                        <a class="button keep_playing_button"
                           role="button"
                           @click="${this.keep_going}">Keep going</a>` : ''}
                    <a class="button retry_button"
                           role="button"
                           @click="${this.try_again}">Try again</a>
                </div>
            </div>`;
    }
}

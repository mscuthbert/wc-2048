import {customElement, property} from 'lit/decorators.js';
import {
    css,
    html,
    LitElement,
    unsafeCSS,
} from 'lit';
import {s} from './styles';
import {rgb_s} from './help';

@customElement('m-tile')
export class MTile extends LitElement {
    @property({type: Number}) val: number = 1;
    @property({type: Array}) y: number = 0;
    @property({type: Array}) x: number = 0;
    @property({type: Boolean}) active: boolean = false;

    get level(): number {
        return Math.min(Math.floor(Math.log2(this.val)), 12);
    }

    static override styles = css`
        host: {
            box-sizing: border-box;   
            display: inline-block;
            z-index: 90;
        }
        .tile_container {
            transition: all ${s.transition_speed}ms ease-in-out;
        }
        .tile {
            box-sizing: border-box; 
            transition: all ${s.transition_speed}ms ease-in-out;
            position: absolute;
            top: 0px;
            left: 0px;
            width: ${unsafeCSS(s.tile_size)}px;
            height: ${unsafeCSS(s.tile_size)}px;
            border-radius: ${s.tile_border_radius}px;
            text-align: center;
            vertical-align: middle;
            font-weight: bold;            
            font-size: 55px;
            line-height: ${s.tile_size}px;
            background: ${rgb_s(s.tile_color)};
            z-index: 1;
            transform: scale(1);
            opacity: 0;
        }
        :host(.pop) .tile {
            transform: scale(1.2);
        }
        .tile.active {
            opacity: 1;
        }
        
        .level_1 {
            background: #eee4da;
            box-shadow: 0 0 30px 10px rgba(243, 215, 116, 0), inset 0 0 0 1px rgba(255, 255, 255, 0); }
        .level_2 {
            background: #ede0c8;
            box-shadow: 0 0 30px 10px rgba(243, 215, 116, 0), inset 0 0 0 1px rgba(255, 255, 255, 0); }
        .level_3 {
            color: #f9f6f2;
            background: #f2b179; }
        .level_4 {
            color: #f9f6f2;
            background: #f59563; }
        .level_5 {
            color: #f9f6f2;
            background: #f67c5f; }
        .level_6 {
            color: #f9f6f2;
            background: #f65e3b; }
        .level_7 {
            color: #f9f6f2;
            background: #edcf72;
            box-shadow: 0 0 30px 10px rgba(243, 215, 116, 0.2381), inset 0 0 0 1px rgba(255, 255, 255, 0.14286);
            font-size: 45px; }
        @media screen and (max-width: 520px) {
            .level_7 {
                font-size: 25px; } }
        .level_8 {
            color: #f9f6f2;
            background: #edcc61;
            box-shadow: 0 0 30px 10px rgba(243, 215, 116, 0.31746), inset 0 0 0 1px rgba(255, 255, 255, 0.19048);
            font-size: 45px; }
        @media screen and (max-width: 520px) {
            .level_8 {
                font-size: 25px; } }
        .level_9 {
            color: #f9f6f2;
            background: #edc850;
            box-shadow: 0 0 30px 10px rgba(243, 215, 116, 0.39683), inset 0 0 0 1px rgba(255, 255, 255, 0.2381);
            font-size: 45px; }
        @media screen and (max-width: 520px) {
            .level_9 {
              font-size: 25px; } }
        .level_10 {
            color: #f9f6f2;
            background: #edc53f;
            box-shadow: 0 0 30px 10px rgba(243, 215, 116, 0.47619), inset 0 0 0 1px rgba(255, 255, 255, 0.28571);
            font-size: 35px; }
        @media screen and (max-width: 520px) {
            .level_10 {
                font-size: 15px; } }
        .level_11 {
            color: #f9f6f2;
            background: #edc22e;
            box-shadow: 0 0 30px 10px rgba(243, 215, 116, 0.55556), inset 0 0 0 1px rgba(255, 255, 255, 0.33333);
            font-size: 35px; }
        @media screen and (max-width: 520px) {
            .level_11 {
                font-size: 15px; } }
        .level_12 {
            color: #f9f6f2;
            background: #3c3a32;
            font-size: 30px; }
        @media screen and (max-width: 520px) {
            .level_12 {
                font-size: 10px; } } 
    `;

    override render() {
        const grid = this.parentElement?.previousElementSibling;
        if (!grid) {
            return null;
        }
        const grid_rect = grid.getBoundingClientRect();
        const cell = grid.querySelector(`[data-y="${this.y}"][data-x="${this.x}"]`);
        const rect = cell.getBoundingClientRect();
        const translate_x = rect.x - grid_rect.x;
        const translate_y = rect.y - grid_rect.y;
        const trans_style = `translate(${translate_x}px, ${translate_y}px)`;

        // TODO: put the trans_style on a div around the tile, and
        //    then put the tile_zoomer on the tile.
        return html`<div 
            class="tile_container"
            style="transform: ${trans_style};">
            <div class="tile tile_${this.y}_${this.x} 
                   ${this.active ? 'active' : ''}
                   level_${this.level}"
            >${this.val}</div>
        </div>`;
    }
}

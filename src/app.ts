import {
    LitElement,
    html,
    PropertyValues,
    css,
} from 'lit';
import {customElement, property, query} from 'lit/decorators.js';
import choice from 'pick-random';

import {MGrid} from './grid';
import {button, sleep} from './help';
import {MScoreboard} from './scoreboard';
import {s} from './styles';
import {MTile} from './tile';

const shift_keys: Record<string, [number, number]> = {
    'ArrowLeft': [0, -1],
    'ArrowRight': [0, 1],
    'ArrowUp': [-1, 0],
    'ArrowDown': [1, 0],
    'a': [0, -1],
    'd': [0, 1],
    'w': [-1, 0],
    's': [1, 0],
};

interface GridComputation {
    y_shift: number,
    x_shift: number,
}

interface GridStatus {
    any_shifted: boolean,
    new_grid: (MTile|null)[][],
    tiles_to_remove: MTile[],
    removed_tile_positions_move_positions: Map<MTile, [number, number]>,
    new_values: Map<MTile, number>,
    points_gained_this_move: number,
}

interface GameState {
    tile_values: number[][],
    score: number,
    best_score: number,
    show_game_won: boolean,
    game_won_already_shown: boolean,
    game_over: boolean,
}

const RANDOM_START_HIGH = 0.9;
const WINNING_VALUE = 2048;


@customElement('m-app')
export class MApp extends LitElement {
    @property({type: Number}) score: number = 0;
    @property({type: Number}) best_score: number = 0;
    @property({type: Boolean}) show_game_won: boolean = false;
    @property({type: Boolean}) game_won_already_shown: boolean = false;
    @property({type: Boolean}) game_over: boolean = false;
    @property({type: Boolean}) touch_mode: boolean = false;

    @query('m-grid') m_grid: MGrid;
    @query('m-scoreboard.current') scoreboard: MScoreboard;
    @query('m-scoreboard.best') best_scoreboard: MScoreboard;


    _keydown_listener: (e: KeyboardEvent) => void;
    _try_again_listener: () => void;
    _keep_going_listener: () => void;

    tiles: MTile[][];
    last_touch_x_y: [number, number] = [0, 0];

    static override styles = css`
        .container {
            margin: 30px auto 0px auto;
            width: 500px;
        }
        m-grid {
            text-align: center;
            width: 100%;
        }
        .heading {
            display: block;
            margin: 0px;
        }
        .heading::after {
            content: "";
            clear: both;
            display: table;           
        }        
        h1.title {
            font-size: 80px;
            font-weight: bold;
            margin: 0;
            display: block;
            float: left;
        }
        .scores-container {
            float: right;
        }
        .above-game {
            display: flex;
            justify-content: space-between;
            align-items: center;
            line-height: 22px;
            margin: 0px;
        }
        .game-intro {
            text-align: left;
            margin: 0px;
        }
        .restart-button {
            ${button()}
            display: block;
            text-align: center;
            float: right; 
        }
        
        .start-playing-link {
            margin-right: 15px;
        }
        
        .feedback-button {
            float: right;
        }
        @media screen and (min-width: 520px) {
            .feedback-button {
                ${button()}
                float: none;
                position: fixed;
                top: 0px;
                right: 0px;
                font-size: 13px;
                line-height: 21.5px;
                padding: 2px 0px 2px 0px;
                height: auto;
                border-top-left-radius: 0px;
                border-top-right-radius: 0px;
                border-bottom-right-radius: 0px;
                border-bottom-left-radius: 4px;
                transform-origin: left button;
                width: 122px;
                opacity: 0.4;
            }        
        }
        
        .grid-holder {
            position: relative;
            margin-top: 40px;
            height: ${s.field_width}px;
            width: ${s.field_width}px;
        }
        
        @keyframes game-explanation-fading-highlight {
            0% {
                background-color: #f3d774;
                box-shadow: 0 0 0 15px #f3d774;
            }
            100% {
                background-color: transparent;
                box-shadow: 0 0 0 10px transparent;
            }
        }
        
        .game-explanation {
            display: block;
            margin-top: 30px;
            border-radius: 1px;
        }
        
        .game-explanation-highlighted {
            animation: game-explanation-fading-highlight 2s ease-in 1s;
            animation-fill-mode: both;
        }
        a {
            color: #776e65;
            font-weight: bold;
            text-decoration: underline;
            cursor: pointer; 
        }
        
        hr {
            margin-top: 20px;
            margin-bottom: 30px;            
        }
    `;

    protected override firstUpdated(_changedProperties: PropertyValues) {
        super.firstUpdated(_changedProperties);
        this.m_grid.updateComplete.then(async () => {
            this.prepare_for_new_game();
            this.setup_touch_events();
            await Promise.all([
                this.scoreboard.updateComplete,
                this.best_scoreboard.updateComplete,
            ]);
            this.load_state();
            if (Array.from(this.iter_tiles({skip_null: true})).length === 0) {
                this.start_new_game(false);
            }
        });
    }

    async store_state() {
        await this.updateComplete;
        const tile_values = this.store_tile_values();
        const state: GameState = {
            tile_values,
            score: this.score,
            best_score: this.best_score,
            game_over: this.game_over,
            show_game_won: this.show_game_won,
            game_won_already_shown: this.game_won_already_shown,
        };
        window.localStorage.setItem('wc_2048', JSON.stringify(state));
    }

    load_state() {
        const state_str = window.localStorage.getItem('wc_2048');
        if (!state_str) {
            return;
        }
        const state_storage: GameState = JSON.parse(state_str);
        this.load_tile_values_from_storage(state_storage.tile_values);
        this.score = state_storage.score;
        // bypass effects by not using set_score
        this.scoreboard.score = state_storage.score;
        this.best_score = state_storage.best_score;
        this.best_scoreboard.score = state_storage.best_score;
        this.show_game_won = state_storage.show_game_won;
        this.game_won_already_shown = state_storage.game_won_already_shown;
        this.game_over = state_storage.game_over;
    }

    setup_touch_events() {
        window.addEventListener('touchstart', () => { this.touch_mode = true; });
        // currently not unloaded...m_grid will never disappear.
        // still, that would make for better hygiene.
        this.m_grid.addEventListener('touchstart', e => {
            const touch: Touch = (e as TouchEvent).changedTouches[0];
            this.last_touch_x_y = [touch.pageX, touch.pageY];
            e.preventDefault();
        });
        this.m_grid.addEventListener('touchmove', e => {
            e.preventDefault();
        });
        this.m_grid.addEventListener('touchend', e => {
            const TOUCH_MOVE_THRESHOLD = 10;
            const touch: Touch = (e as TouchEvent).changedTouches[0];
            const x_distance_signed = touch.pageX - this.last_touch_x_y[0];
            const y_distance_signed = this.last_touch_x_y[1] - touch.pageY;
            const x_distance = Math.abs(x_distance_signed);
            const y_distance = Math.abs(y_distance_signed);
            e.preventDefault();
            if (x_distance < TOUCH_MOVE_THRESHOLD && y_distance < TOUCH_MOVE_THRESHOLD) {
                return;
            }
            const angle_radians = Math.atan2(y_distance_signed, x_distance_signed);
            let deg = 180 * angle_radians / Math.PI;  // (-180 to 180)
            if (deg < 0) {
                deg = 360 + deg;  // (0 to 360 angles)
            }
            console.log(Math.round(deg), x_distance_signed, y_distance_signed);
            const MEANINGLESS_SENTINEL = 99;
            let swipe: [number, number] = [MEANINGLESS_SENTINEL, MEANINGLESS_SENTINEL];
            if (deg < 30 || deg > 330) {
                swipe = [0, 1];  // strongly right
            } else if (deg > 60 && deg < 120) {
                swipe = [-1, 0];  // strongly up
            } else if (deg > 150 && deg < 210) {
                swipe = [0, -1];  // strongly left
            } else if (deg > 240 && deg < 300) {
                swipe = [1, 0];  // strongly down
            }
            if (swipe[0] === MEANINGLESS_SENTINEL) {
                return;  // too diagonal to interpret.
            }
            this.perform_shift(swipe).catch(console.error);
        });

    }

    override connectedCallback(): void {
        super.connectedCallback();
        this._keydown_listener = e => this.key_press(e);
        this._try_again_listener = () => this.start_new_game();
        this._keep_going_listener = () => {
            this.game_won_already_shown = true;
            this.show_game_won = false;
            this.store_state().catch(console.error);
        };
        document.addEventListener('keydown', this._keydown_listener);
        document.addEventListener('try_again', this._try_again_listener);
        document.addEventListener('keep_going', this._keep_going_listener);
    }

    override disconnectedCallback(): void {
        document.removeEventListener('keydown', this._keydown_listener);
        document.removeEventListener('try_again', this._try_again_listener);
        document.removeEventListener('keep_going', this._keep_going_listener);
        super.disconnectedCallback();
    }

    load_tile_values_from_storage(tile_values: number[][]) {
        for (const y of [0, 1, 2, 3]) {
            for (const x of [0, 1, 2, 3]) {
                const tv = tile_values[y][x];
                if (tv === 0) {
                    continue;
                }
                this.add_tile(y, x, tv).catch(console.error);
            }
        }
    }

    store_tile_values(): number[][] {
        const store_tiles = [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ];
        for (const [t, y, x] of this.iter_tiles_positions({skip_null: true})) {
            store_tiles[y][x] = t.val;
        }
        return store_tiles;
    }

    how_to_play() {
        const ge = this.shadowRoot.querySelector('.game-explanation') as HTMLElement;
        ge.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
        });
        ge.addEventListener('animationend', () => {
            ge.classList.remove('game-explanation-highlighted');
        });
        ge.classList.add('game-explanation-highlighted');
    }

    start_playing() {
        this.m_grid.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
        });
    }

    override render() {
        return html`
            <div class="container">
                <div class="heading">
                    <h1 class="title">2048</h1>
                    <div class="scores-container">
                        <m-scoreboard class="current" is_current_score></m-scoreboard>
                        <m-scoreboard class="best"></m-scoreboard>
                    </div>
                </div>
                <div class="above-game">
                    <p class="game-intro">
                        Join the tiles, get to <strong>2048!</strong>
                        <br>
                        <a class="how-to-play-link" @click="${this.how_to_play}">How to play →</a>
                    </p>
                    <a class="restart-button" role="button" 
                       @click="${() => this.start_new_game(true)}">New Game</a>
                </div>
                <div class="grid-holder">
                    <m-overlay 
                        ?show_game_won="${this.show_game_won}"
                        ?game_over="${this.game_over}"
                    ></m-overlay>
                    <m-grid></m-grid>                    
                </div>
                <div class="game-explanation-container">
                    <p class="game-explanation">
                        <strong style="text-transform: uppercase">How to play:</strong>
                        ${this.touch_mode 
                            ? html`Swipe with <strong>your fingers</strong>` 
                            : html`Use your <strong>arrow keys</strong>`}
                        to move the tiles.
                        Tiles with the same number <strong>merge into one</strong>
                        when they touch.  Add them up to reach <strong>2048!</strong>
                        <br>
                        <a class="start-playing-link"
                           @click="${this.start_playing}">Start playing →</a>
                        <a class="feedback-button" role="button"
                            href="mailto:cuthbert@post.harvard.edu">Send Feedback</a>
                    </p>
                </div>
                <hr>
                <p>
                    You're <strong>not</strong> playing the official version
                    of 2048.  This is a rewrite of <strong>Gabriele Cirulli</strong>'s
                    original at <a href="https://play2048.co" target="_top">play2048.co</a>
                    written by <strong><a href="http://www.trecento.com/">Michael Scott Asato Cuthbert</a></strong>
                    entirely in web components.
                </p>
                <p>
                    Only Cirulli's styles/index.html layout have been borrowed.  All other code was
                    written from scratch.  The only time the original code was consulted
                    was to verify the probability of starting with "4" instead of "2"
                    and to figure out how to trigger the "You won!" message without
                    needing to solve the game.
                </p>
            </div>
        `;
    }

    prepare_for_new_game() {
        this.tiles = [
            [null, null, null, null],
            [null, null, null, null],
            [null, null, null, null],
            [null, null, null, null],
        ];
        this.score = 0;
        this.scoreboard.score = 0;  // bypass effects
        this.show_game_won = false;
        this.game_over = false;
        this.m_grid.remove_all_tiles();
        this.game_over = false;
        this.show_game_won = false;
        this.game_won_already_shown = false;
    }


    start_new_game(prepare: boolean = true) {
        if (prepare) {
            this.prepare_for_new_game();
        }
        this.add_new_random_tile().catch(console.error);
        this.add_new_random_tile().catch(console.error);
    }

    check_game_won(): void {
        if (this.game_won_already_shown) {
            return;
        }
        let game_won = false;
        for (const t of this.iter_tiles({skip_null: true})) {
            if (t.val === WINNING_VALUE) {
                game_won = true;
            }
        }
        this.show_game_won = game_won;
    }

    check_game_over(): void {
        let game_over: boolean = true;
        for (const [y_shift, x_shift] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
            const {any_shifted} = this.compute_grid_after_shift({
                y_shift,
                x_shift,
            });
            if (any_shifted) {
                game_over = false;
                break;
            }
        }
        this.game_over = game_over;
    }

    async key_press(e: KeyboardEvent): Promise<void> {
        if (this.game_over || this.show_game_won) {
            return;
        }

        const k = e.key;
        if (k in shift_keys) {
            e.preventDefault();
            const shift_y_x = shift_keys[k];
            await this.perform_shift(shift_y_x);
        }
    }

    async perform_shift(shift_y_x: [number, number]): Promise<void> {
        const any_shifted = await this.shift_tiles(...shift_y_x);
        if (any_shifted) {
            this.add_new_random_tile().catch(console.error);
            this.check_game_won();
            this.check_game_over();
            this.store_state();
        }
    }


    /**
     * helper function for anytime we want to see all tiles.
     */
    * iter_tiles_positions(
        {skip_null=false}: {skip_null?: boolean} = {}
    ): Generator<[MTile, number, number]> {
        for (const y of [0, 1, 2, 3]) {
            for (const x of [0, 1, 2, 3]) {
                const t = this.tiles[y][x];
                if (skip_null && t === null) {
                    continue;
                }
                yield [t, y, x];
            }
        }
    }

    * iter_tiles(
        {skip_null=false}: {skip_null?: boolean} = {}
    ): Generator<MTile> {
        for (const [t] of this.iter_tiles_positions({skip_null})) {
            yield t;
        }
    }

    /**
     * Return a copy of the grid with the same tile objects/null as
     * before.
     */
    copy_grid(): (MTile|null)[][] {
        const new_grid: (MTile|null)[][] = [[], [], [], []];
        for (const [t, y, x] of this.iter_tiles_positions()) {
            new_grid[y][x] = t;
        }
        return new_grid;
    }

    available_positions(): number[][] {
        const available_positions: number[][] = [];
        for (const y of [0, 1, 2, 3]) {
            for (const x of [0, 1, 2, 3]) {
                if (this.tiles[y][x] === null) {
                    available_positions.push([y, x]);
                }
            }
        }
        return available_positions;
    }

    get_random_position(): [number, number] {
        const available = this.available_positions();
        if (available.length === 0) {
            return [-1, -1];
        }

        const [y, x] = choice(available)[0];
        return [y, x];
    }

    async add_new_random_tile(): Promise<void|undefined> {
        // const val = Math.floor(Math.random() * 30);
        const val = Math.random() > RANDOM_START_HIGH ? 4 : 2;
        const [y, x] = this.get_random_position();
        if (y === -1 && x === -1) {
            return undefined;
        }
        return this.add_tile(y, x, val);
    }

    async shift_tiles(
        y_shift: number,
        x_shift: number,
    ): Promise<boolean> {
        const {
            any_shifted,
            new_grid,
            tiles_to_remove,
            new_values,
            removed_tile_positions_move_positions,
            points_gained_this_move,
        } = this.compute_grid_after_shift({
            y_shift,
            x_shift,
        });
        tiles_to_remove.map(rem_tile => {
            rem_tile.style.zIndex = '0';
            return rem_tile;  // eslint wants a return from map.
        });

        // all shifts calculated, now set new grid
        this.tiles = new_grid;
        for (const [t, y, x] of this.iter_tiles_positions({skip_null: true})) {
            t.y = y;
            t.x = x;
        }
        for (const [rem_t, [y, x]] of removed_tile_positions_move_positions) {
            // slide tiles that moved even if they're about to get merged.
            rem_t.y = y;
            rem_t.x = x;
        }

        await sleep(s.transition_speed);
        for (const rem_tile of tiles_to_remove) {
            rem_tile.active = false;
        }
        for (const [update_tile, new_val] of new_values.entries()) {
            update_tile.val = new_val;
            update_tile.updateComplete.then(() => {
                update_tile.classList.add('pop');
                window.setTimeout(
                    () => update_tile.classList.remove('pop'),
                    s.transition_speed,
                );
            });
        }
        if (points_gained_this_move) {
            this.add_score(points_gained_this_move);
        }
        tiles_to_remove.map(rem_tile => rem_tile.remove());
        this.store_state();
        return any_shifted;
    }

    compute_grid_after_shift({y_shift, x_shift}: GridComputation): GridStatus {
        const [y_iterate, x_iterate] = this.get_shift_iterators(y_shift, x_shift);

        const new_values: Map<MTile, number> = new Map();
        const merged_already = new Set();
        // a tile might be removed but need to shift first, like:
        //    shift left:  [null, 2, 2, null]
        // the first 2 has to shift left before disappearing.
        // since it will not be in the final grid, we record its end position
        // separately.
        const removed_tile_positions_move_positions: Map<MTile, [number, number]>
            = new Map();
        let any_shifted_ever = false;
        let any_shifted_this_iter = false;
        let first_run = true;
        let points_gained_this_move: number = 0;
        const new_grid = this.copy_grid();
        const removed_tiles: MTile[] = [];
        while (any_shifted_this_iter || first_run) {
            first_run = false;
            any_shifted_this_iter = false;
            for (const x of x_iterate) {
                for (const y of y_iterate) {
                    const prev_y = y + y_shift;
                    const prev_x = x + x_shift;
                    const prev_tile = new_grid[prev_y][prev_x];
                    const this_tile = new_grid[y][x];
                    if (this_tile === null) {
                        continue;
                    }

                    if (prev_tile === null) {
                        // tile moving to empty position.
                        any_shifted_this_iter = true;
                        any_shifted_ever = true;
                        new_grid[prev_y][prev_x] = this_tile;
                        new_grid[y][x] = null;
                        continue;
                    }

                    if (prev_tile.val === this_tile.val && !merged_already.has(prev_tile)) {
                        // merge tiles
                        any_shifted_this_iter = true;
                        any_shifted_ever = true;
                        new_grid[prev_y][prev_x] = this_tile;
                        new_grid[y][x] = null;
                        removed_tile_positions_move_positions.set(prev_tile, [prev_y, prev_x]);
                        removed_tiles.push(prev_tile);

                        merged_already.add(this_tile);
                        // or *= 2, but maybe other games can have different rules...
                        const new_val = this_tile.val + prev_tile.val;
                        new_values.set(this_tile, new_val);
                        points_gained_this_move += prev_tile.val;
                    }
                    // otherwise, cannot move.
                }
            }
        }
        return {
            any_shifted: any_shifted_ever,
            new_grid,
            tiles_to_remove: removed_tiles,
            new_values,
            removed_tile_positions_move_positions,
            points_gained_this_move,
        };
    }

    get_shift_iterators(y_shift: number, x_shift: number): [number[], number[]] {
        let y_iterate: number[] = [0, 1, 2, 3];
        let x_iterate: number[] = [0, 1, 2, 3];

        if (y_shift !== 0) {
            // move in y-direction.
            if (y_shift === -1) {
                y_iterate = [1, 2, 3];
            } else {
                y_iterate = [2, 1, 0];
            }
        } else {
            if (x_shift === -1) {
                x_iterate = [1, 2, 3];
            } else {
                x_iterate = [2, 1, 0];
            }
        }
        return [y_iterate, x_iterate];
    }

    add_score(val: number) {
        this.score += val;
        this.scoreboard.set_score(this.score).catch(console.error);
        if (this.score > this.best_score) {
            this.best_score = this.score;
            this.best_scoreboard.set_score(this.score).catch(console.error);
        }
        this.store_state();
    }

    add_tile(y: number, x: number, val: number = 2): Promise<void> {
        const t: MTile = new MTile();
        t.val = val;
        t.y = y;
        t.x = x;
        this.tiles[y][x] = t;
        this.store_state();
        return this.m_grid.append_tile(t);
    }
}


type RGB = [number, number, number];  // not notorious-RBG

interface StyleInterface {
    field_width: number,
    grid_spacing: number,
    grid_row_cells: number,
    tile_size: number,
    tile_border_radius: number,
    mobile_threshold: number,
    text_color: RGB,
    bright_text_color: RGB,
    tile_color: RGB,
    tile_gold_color: RGB,
    tile_gold_glow_color: RGB,
    game_container_margin_top: number,
    game_container_background: RGB,
    game_container_background_darkened: RGB,
    transition_speed: number,
}

export const s: StyleInterface = {
    field_width: 500,
    grid_spacing: 15,
    grid_row_cells: 4,
    tile_size: 0,
    tile_border_radius: 3,
    mobile_threshold: 520,
    text_color: [119, 110, 101],
    bright_text_color: [249, 246, 242],
    tile_color: [238, 228, 213],
    tile_gold_color: [237, 194, 46],
    tile_gold_glow_color: [243, 215, 116],
    game_container_margin_top: 40,
    game_container_background: [187, 173, 160],
    game_container_background_darkened: [150, 138, 128],
    transition_speed: 100,
};

s.tile_size = (s.field_width - s.grid_spacing * (s.grid_row_cells + 1)) / s.grid_row_cells;
s.mobile_threshold = s.field_width + 20;

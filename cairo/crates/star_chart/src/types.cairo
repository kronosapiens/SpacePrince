pub const PLANET_COUNT: usize = 7;

pub const CORE_VERSION: u16 = 1;
pub const DATA_VERSION: u16 = 1;

pub const SIGN_COUNT: u8 = 12;

pub const ELEMENT_FIRE: u8 = 0;
pub const ELEMENT_EARTH: u8 = 1;
pub const ELEMENT_AIR: u8 = 2;
pub const ELEMENT_WATER: u8 = 3;

pub const MODALITY_CARDINAL: u8 = 0;
pub const MODALITY_FIXED: u8 = 1;
pub const MODALITY_MUTABLE: u8 = 2;

pub const DIGNITY_DOMICILE: u8 = 0;
pub const DIGNITY_EXALTATION: u8 = 1;
pub const DIGNITY_NEUTRAL: u8 = 2;
pub const DIGNITY_DETRIMENT: u8 = 3;
pub const DIGNITY_FALL: u8 = 4;

pub const SECT_DAY: u8 = 0;
pub const SECT_NIGHT: u8 = 1;

pub const ASPECT_CONJUNCTION: u8 = 0;
pub const ASPECT_SEMISEXTILE: u8 = 1;
pub const ASPECT_SEXTILE: u8 = 2;
pub const ASPECT_SQUARE: u8 = 3;
pub const ASPECT_TRINE: u8 = 4;
pub const ASPECT_INCONJUNCT: u8 = 5;
pub const ASPECT_OPPOSITION: u8 = 6;

#[derive(Drop, Serde, Copy)]
pub struct ChartInput {
    pub time_minute_since_1900: u32,
    pub lat_bin: i16,
    pub lon_bin: i16,
}

#[derive(Drop, Serde, Copy)]
pub struct CanonicalChart {
    pub planet_sign: [u8; PLANET_COUNT],
    pub asc_sign: u8,
    pub planet_house: [u8; PLANET_COUNT],
    pub planet_dignity: [u8; PLANET_COUNT],
    pub planet_sect_status: [bool; PLANET_COUNT],
    pub sign_aspect_from_asc: [u8; PLANET_COUNT],
    pub chart_sect: u8,
    pub core_version: u16,
    pub data_version: u16,
    pub out_of_range_warning: bool,
}

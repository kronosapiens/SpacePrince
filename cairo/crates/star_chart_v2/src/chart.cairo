use astronomy_engine_v2::ascendant::approximate_ascendant_longitude_1e9;
use astronomy_engine_v2::planets::approximate_planet_longitude_1e9;

use crate::derive::{
    chart_is_day_from_sun_house, chart_sect_code, derive_dignity, derive_house, planet_is_in_sect,
    sign_aspect_class,
};
use crate::quantization::floor_to_15m_slot;
use crate::signs::longitude_to_sign;
use crate::types::{CanonicalChart, ChartInput, CORE_VERSION, DATA_VERSION};

const PLANETS: usize = 7;

pub const MINUTE_2100_END: u32 = 105_190_559; // 2100-12-31T23:59Z

#[inline(never)]
pub fn compute_chart(input: ChartInput) -> CanonicalChart {
    let q_slot = floor_to_15m_slot(input.time_minute_since_1900);
    let q_minute = q_slot * 15;

    let asc_lon = approximate_ascendant_longitude_1e9(q_minute, input.lat_bin, input.lon_bin);

    let planet_sign: [u8; PLANETS] = [
        longitude_to_sign(approximate_planet_longitude_1e9(0, q_minute)),
        longitude_to_sign(approximate_planet_longitude_1e9(1, q_minute)),
        longitude_to_sign(approximate_planet_longitude_1e9(2, q_minute)),
        longitude_to_sign(approximate_planet_longitude_1e9(3, q_minute)),
        longitude_to_sign(approximate_planet_longitude_1e9(4, q_minute)),
        longitude_to_sign(approximate_planet_longitude_1e9(5, q_minute)),
        longitude_to_sign(approximate_planet_longitude_1e9(6, q_minute)),
    ];

    let asc_sign = longitude_to_sign(asc_lon);

    let houses: [u8; PLANETS] = [
        derive_house(*planet_sign.span().at(0), asc_sign),
        derive_house(*planet_sign.span().at(1), asc_sign),
        derive_house(*planet_sign.span().at(2), asc_sign),
        derive_house(*planet_sign.span().at(3), asc_sign),
        derive_house(*planet_sign.span().at(4), asc_sign),
        derive_house(*planet_sign.span().at(5), asc_sign),
        derive_house(*planet_sign.span().at(6), asc_sign),
    ];

    let dignities: [u8; PLANETS] = [
        derive_dignity(0, *planet_sign.span().at(0)),
        derive_dignity(1, *planet_sign.span().at(1)),
        derive_dignity(2, *planet_sign.span().at(2)),
        derive_dignity(3, *planet_sign.span().at(3)),
        derive_dignity(4, *planet_sign.span().at(4)),
        derive_dignity(5, *planet_sign.span().at(5)),
        derive_dignity(6, *planet_sign.span().at(6)),
    ];

    let is_day = chart_is_day_from_sun_house(*houses.span().at(0));
    let sun_sign = *planet_sign.span().at(0);

    let sect_status: [bool; PLANETS] = [
        planet_is_in_sect(0, is_day, *planet_sign.span().at(0), sun_sign),
        planet_is_in_sect(1, is_day, *planet_sign.span().at(1), sun_sign),
        planet_is_in_sect(2, is_day, *planet_sign.span().at(2), sun_sign),
        planet_is_in_sect(3, is_day, *planet_sign.span().at(3), sun_sign),
        planet_is_in_sect(4, is_day, *planet_sign.span().at(4), sun_sign),
        planet_is_in_sect(5, is_day, *planet_sign.span().at(5), sun_sign),
        planet_is_in_sect(6, is_day, *planet_sign.span().at(6), sun_sign),
    ];

    let aspect_from_asc: [u8; PLANETS] = [
        sign_aspect_class(*planet_sign.span().at(0), asc_sign),
        sign_aspect_class(*planet_sign.span().at(1), asc_sign),
        sign_aspect_class(*planet_sign.span().at(2), asc_sign),
        sign_aspect_class(*planet_sign.span().at(3), asc_sign),
        sign_aspect_class(*planet_sign.span().at(4), asc_sign),
        sign_aspect_class(*planet_sign.span().at(5), asc_sign),
        sign_aspect_class(*planet_sign.span().at(6), asc_sign),
    ];

    let out_of_range_warning = input.time_minute_since_1900 > MINUTE_2100_END;

    CanonicalChart {
        planet_sign,
        asc_sign,
        planet_house: houses,
        planet_dignity: dignities,
        planet_sect_status: sect_status,
        sign_aspect_from_asc: aspect_from_asc,
        chart_sect: chart_sect_code(is_day),
        core_version: CORE_VERSION,
        data_version: DATA_VERSION,
        out_of_range_warning,
    }
}

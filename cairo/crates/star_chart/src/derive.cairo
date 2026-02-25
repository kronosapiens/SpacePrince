use astronomy_engine_v1::types::{JUPITER, MARS, MERCURY, MOON, SATURN, SUN, VENUS};

use crate::types::{
    ASPECT_CONJUNCTION, ASPECT_INCONJUNCT, ASPECT_OPPOSITION, ASPECT_SEMISEXTILE, ASPECT_SEXTILE,
    ASPECT_SQUARE, ASPECT_TRINE, DIGNITY_DETRIMENT, DIGNITY_DOMICILE, DIGNITY_EXALTATION,
    DIGNITY_FALL, DIGNITY_NEUTRAL, ELEMENT_AIR, ELEMENT_EARTH, ELEMENT_FIRE, ELEMENT_WATER,
    MODALITY_CARDINAL, MODALITY_FIXED, MODALITY_MUTABLE, SECT_DAY,
};

pub fn derive_element(sign: u8) -> u8 {
    if sign == 0 || sign == 4 || sign == 8 {
        ELEMENT_FIRE
    } else if sign == 1 || sign == 5 || sign == 9 {
        ELEMENT_EARTH
    } else if sign == 2 || sign == 6 || sign == 10 {
        ELEMENT_AIR
    } else {
        ELEMENT_WATER
    }
}

pub fn derive_modality(sign: u8) -> u8 {
    if sign == 0 || sign == 3 || sign == 6 || sign == 9 {
        MODALITY_CARDINAL
    } else if sign == 1 || sign == 4 || sign == 7 || sign == 10 {
        MODALITY_FIXED
    } else {
        MODALITY_MUTABLE
    }
}

pub fn derive_house(planet_sign: u8, asc_sign: u8) -> u8 {
    (((planet_sign + 12 - asc_sign) % 12) + 1)
}

fn in_sign_set(sign: u8, a: u8, b: u8) -> bool {
    sign == a || sign == b
}

pub fn derive_dignity(planet: u8, sign: u8) -> u8 {
    // Planet order is Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn.
    if planet == SUN {
        if sign == 4 {
            return DIGNITY_DOMICILE;
        }
        if sign == 0 {
            return DIGNITY_EXALTATION;
        }
        if sign == 10 {
            return DIGNITY_DETRIMENT;
        }
        if sign == 6 {
            return DIGNITY_FALL;
        }
        return DIGNITY_NEUTRAL;
    }

    if planet == MOON {
        if sign == 3 {
            return DIGNITY_DOMICILE;
        }
        if sign == 1 {
            return DIGNITY_EXALTATION;
        }
        if sign == 9 {
            return DIGNITY_DETRIMENT;
        }
        if sign == 7 {
            return DIGNITY_FALL;
        }
        return DIGNITY_NEUTRAL;
    }

    if planet == MERCURY {
        if in_sign_set(sign, 2, 5) {
            return DIGNITY_DOMICILE;
        }
        if sign == 5 {
            return DIGNITY_EXALTATION;
        }
        if in_sign_set(sign, 8, 11) {
            return DIGNITY_DETRIMENT;
        }
        if sign == 11 {
            return DIGNITY_FALL;
        }
        return DIGNITY_NEUTRAL;
    }

    if planet == VENUS {
        if in_sign_set(sign, 1, 6) {
            return DIGNITY_DOMICILE;
        }
        if sign == 11 {
            return DIGNITY_EXALTATION;
        }
        if in_sign_set(sign, 0, 7) {
            return DIGNITY_DETRIMENT;
        }
        if sign == 5 {
            return DIGNITY_FALL;
        }
        return DIGNITY_NEUTRAL;
    }

    if planet == MARS {
        if in_sign_set(sign, 0, 7) {
            return DIGNITY_DOMICILE;
        }
        if sign == 9 {
            return DIGNITY_EXALTATION;
        }
        if in_sign_set(sign, 1, 6) {
            return DIGNITY_DETRIMENT;
        }
        if sign == 3 {
            return DIGNITY_FALL;
        }
        return DIGNITY_NEUTRAL;
    }

    if planet == JUPITER {
        if in_sign_set(sign, 8, 11) {
            return DIGNITY_DOMICILE;
        }
        if sign == 3 {
            return DIGNITY_EXALTATION;
        }
        if in_sign_set(sign, 2, 5) {
            return DIGNITY_DETRIMENT;
        }
        if sign == 9 {
            return DIGNITY_FALL;
        }
        return DIGNITY_NEUTRAL;
    }

    if in_sign_set(sign, 9, 10) {
        return DIGNITY_DOMICILE;
    }
    if sign == 6 {
        return DIGNITY_EXALTATION;
    }
    if in_sign_set(sign, 3, 4) {
        return DIGNITY_DETRIMENT;
    }
    if sign == 0 {
        return DIGNITY_FALL;
    }

    DIGNITY_NEUTRAL
}

pub fn sign_aspect_class(a: u8, b: u8) -> u8 {
    let raw = (a + 12 - b) % 12;
    let distance = if raw > 6 { 12 - raw } else { raw };

    match distance {
        0 => ASPECT_CONJUNCTION,
        1 => ASPECT_SEMISEXTILE,
        2 => ASPECT_SEXTILE,
        3 => ASPECT_SQUARE,
        4 => ASPECT_TRINE,
        5 => ASPECT_INCONJUNCT,
        _ => ASPECT_OPPOSITION,
    }
}

pub fn chart_is_day_from_sun_house(sun_house: u8) -> bool {
    sun_house >= 7
}

pub fn planet_is_in_sect(planet: u8, is_day_chart: bool, planet_sign: u8, sun_sign: u8) -> bool {
    if planet == MERCURY {
        // Solar-phase proxy: near Sun on forward half of zodiac treated as diurnal.
        let rel = (planet_sign + 12 - sun_sign) % 12;
        return if is_day_chart { rel <= 6 } else { rel > 6 };
    }

    if is_day_chart {
        planet == SUN || planet == JUPITER || planet == SATURN
    } else {
        planet == MOON || planet == VENUS || planet == MARS
    }
}

pub fn chart_sect_code(is_day_chart: bool) -> u8 {
    if is_day_chart { SECT_DAY } else { 1 }
}

#[cfg(test)]
mod tests {
    use astronomy_engine_v1::types::{MARS, SUN, VENUS};

    use crate::types::{DIGNITY_DETRIMENT, DIGNITY_DOMICILE, DIGNITY_EXALTATION, ELEMENT_FIRE};

    use super::{derive_dignity, derive_element, derive_house, sign_aspect_class};

    #[test]
    fn derives_element_and_house() {
        assert(derive_element(0) == ELEMENT_FIRE, 'Aries is Fire');
        assert(derive_house(0, 0) == 1, 'same sign is first house');
        assert(derive_house(1, 0) == 2, 'next sign is second house');
        assert(derive_house(11, 0) == 12, 'previous sign is 12th house');
    }

    #[test]
    fn dignity_table_matches_traditional_examples() {
        assert(derive_dignity(SUN, 4) == DIGNITY_DOMICILE, 'Sun in Leo domicile');
        assert(derive_dignity(VENUS, 11) == DIGNITY_EXALTATION, 'Venus exalted in Pisces');
        assert(derive_dignity(MARS, 1) == DIGNITY_DETRIMENT, 'Mars detriment in Taurus');
    }

    #[test]
    fn sign_aspects_are_distance_based() {
        assert(sign_aspect_class(0, 0) == 0, 'conjunction');
        assert(sign_aspect_class(0, 2) == 2, 'sextile');
        assert(sign_aspect_class(0, 6) == 6, 'opposition');
    }
}

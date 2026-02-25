use astronomy_engine_v1::fixed::norm360_i64_1e9;

pub const SCALE_1E9: i64 = 1_000_000_000;
pub const SIGN_ARC_1E9: i64 = 30 * SCALE_1E9;

/// Lower-sign inclusive zodiac mapping:
/// sign = floor(norm360(longitude) / 30deg)
pub fn longitude_to_sign(longitude_scaled_1e9: i64) -> u8 {
    let wrapped = norm360_i64_1e9(longitude_scaled_1e9);
    (wrapped / SIGN_ARC_1E9).try_into().unwrap()
}

#[cfg(test)]
mod tests {
    use super::{longitude_to_sign, SCALE_1E9};

    #[test]
    fn maps_zero_and_basic_values() {
        assert(longitude_to_sign(0) == 0, '0 -> Aries');
        assert(longitude_to_sign(29 * SCALE_1E9) == 0, '29 -> Aries');
        assert(longitude_to_sign(30 * SCALE_1E9) == 1, '30 -> Taurus');
    }

    #[test]
    fn wraps_negative_and_overflow_angles() {
        assert(longitude_to_sign(-1) == 11, '-tiny -> Pisces');
        assert(longitude_to_sign(360 * SCALE_1E9) == 0, '360 -> Aries');
        assert(longitude_to_sign(390 * SCALE_1E9) == 1, '390 -> Taurus');
    }
}

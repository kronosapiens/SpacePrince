#[cfg(test)]
mod tests {
    use crate::chart::compute_chart;
    use crate::types::ChartInput;

    fn assert_planet_signs(
        c: crate::types::CanonicalChart,
        s0: u8,
        s1: u8,
        s2: u8,
        s3: u8,
        s4: u8,
        s5: u8,
        s6: u8,
    ) {
        assert(*c.planet_sign.span().at(0) == s0, 'sun sign');
        assert(*c.planet_sign.span().at(1) == s1, 'moon sign');
        assert(*c.planet_sign.span().at(2) == s2, 'mercury sign');
        assert(*c.planet_sign.span().at(3) == s3, 'venus sign');
        assert(*c.planet_sign.span().at(4) == s4, 'mars sign');
        assert(*c.planet_sign.span().at(5) == s5, 'jupiter sign');
        assert(*c.planet_sign.span().at(6) == s6, 'saturn sign');
    }

    #[test]
    fn end_to_end_chart_smoke() {
        let c = compute_chart(ChartInput {
            time_minute_since_1900: 66_348_000,
            lat_bin: 377,
            lon_bin: -1224,
        });

        assert(c.asc_sign < 12, 'asc range');
    }

    #[test]
    fn end_to_end_sign_fixtures() {
        let c0 = compute_chart(ChartInput { time_minute_since_1900: 89_835_270, lat_bin: 472, lon_bin: -847 });
        assert(c0.asc_sign == 7, 'asc0');
        assert_planet_signs(c0, 6, 1, 7, 7, 7, 0, 6);

        let c1 = compute_chart(ChartInput { time_minute_since_1900: 98_162_895, lat_bin: -561, lon_bin: -385 });
        assert(c1.asc_sign == 9, 'asc1');
        assert_planet_signs(c1, 4, 9, 5, 4, 2, 4, 1);

        let c2 = compute_chart(ChartInput { time_minute_since_1900: 74_902_020, lat_bin: 180, lon_bin: -227 });
        assert(c2.asc_sign == 2, 'asc2');
        assert_planet_signs(c2, 2, 6, 1, 3, 5, 7, 7);

        let c3 = compute_chart(ChartInput { time_minute_since_1900: 10_899_690, lat_bin: -769, lon_bin: -1774 });
        assert(c3.asc_sign == 11, 'asc3');
        assert_planet_signs(c3, 5, 9, 6, 6, 8, 5, 5);

        let c4 = compute_chart(ChartInput { time_minute_since_1900: 29_922_045, lat_bin: 622, lon_bin: 1790 });
        assert(c4.asc_sign == 3, 'asc4');
        assert_planet_signs(c4, 7, 3, 8, 6, 11, 5, 8);

        let c5 = compute_chart(ChartInput { time_minute_since_1900: 36_299_925, lat_bin: 418, lon_bin: -90 });
        assert(c5.asc_sign == 8, 'asc5');
        assert_planet_signs(c5, 9, 4, 10, 11, 7, 6, 0);

        let c6 = compute_chart(ChartInput { time_minute_since_1900: 60_518_580, lat_bin: -95, lon_bin: -928 });
        assert(c6.asc_sign == 1, 'asc6');
        assert_planet_signs(c6, 10, 0, 10, 10, 11, 4, 8);

        let c7 = compute_chart(ChartInput { time_minute_since_1900: 65_568_030, lat_bin: -94, lon_bin: 400 });
        assert(c7.asc_sign == 8, 'asc7');
        assert_planet_signs(c7, 5, 4, 4, 6, 2, 2, 11);

        let c8 = compute_chart(ChartInput { time_minute_since_1900: 56_621_595, lat_bin: 630, lon_bin: -79 });
        assert(c8.asc_sign == 7, 'asc8');
        assert_planet_signs(c8, 5, 11, 5, 4, 2, 8, 4);

        let c9 = compute_chart(ChartInput { time_minute_since_1900: 93_121_320, lat_bin: 814, lon_bin: -1418 });
        assert(c9.asc_sign == 6, 'asc9');
        assert_planet_signs(c9, 10, 7, 9, 9, 10, 7, 9);
    }

    #[test]
    fn out_of_range_warning_trips_after_2100() {
        let c = compute_chart(ChartInput {
            time_minute_since_1900: 105_190_560,
            lat_bin: 0,
            lon_bin: 0,
        });
        assert(c.out_of_range_warning, 'warning expected');
    }

}

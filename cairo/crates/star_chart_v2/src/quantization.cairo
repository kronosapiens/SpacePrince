/// Deterministically quantize minute-resolution input into 15-minute slots.
pub fn floor_to_15m_slot(minute_since_1900: u32) -> u32 {
    minute_since_1900 / 15
}

#[cfg(test)]
mod tests {
    use super::floor_to_15m_slot;

    #[test]
    fn floors_to_15m_boundaries() {
        assert(floor_to_15m_slot(0) == 0, '0 should map to slot 0');
        assert(floor_to_15m_slot(14) == 0, '14 should map to slot 0');
        assert(floor_to_15m_slot(15) == 1, '15 should map to slot 1');
        assert(floor_to_15m_slot(29) == 1, '29 should map to slot 1');
        assert(floor_to_15m_slot(30) == 2, '30 should map to slot 2');
    }
}

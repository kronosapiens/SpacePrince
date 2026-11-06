/// Deterministically quantize minute-resolution input into 5-minute slots.
pub fn floor_to_5m_slot(minute_since_1900: u32) -> u32 {
    minute_since_1900 / 5
}

#[cfg(test)]
mod tests {
    use super::floor_to_5m_slot;

    #[test]
    fn floors_to_5m_boundaries() {
        assert(floor_to_5m_slot(0) == 0, '0 should map to slot 0');
        assert(floor_to_5m_slot(4) == 0, '4 should map to slot 0');
        assert(floor_to_5m_slot(5) == 1, '5 should map to slot 1');
        assert(floor_to_5m_slot(9) == 1, '9 should map to slot 1');
        assert(floor_to_5m_slot(10) == 2, '10 should map to slot 2');
    }
}

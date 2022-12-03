use crate::*;

#[derive(Default, Debug, Serialize, Deserialize, Clone)]
pub enum SwipeGroup {
    #[default] Makerspace,
    Studio,
    Laser3D,
    SprayPaint,
    Composite,
}

#[derive(Default, Debug, Serialize, Deserialize, Clone)]
pub struct AccessRule {
    pub swipe_group: SwipeGroup,
    pub auth_level: AuthLevel,
    pub timestamp_start: u64,
    pub timestamp_end: u64,
}
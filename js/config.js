// ============================================
// Supabase 联机配置（已填入用户提供的密钥）
// ============================================
window.BEDWARS_CONFIG = {
  supabaseUrl: 'https://brmzwybbgikvhfddhawx.supabase.co',
  supabaseAnonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJybXp3eWJiZ2lrdmhmZGRoYXd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4OTE0MTksImV4cCI6MjA5ODQ2NzQxOX0.dzMcbZl-gwnALCfhJJQHegTNBO58gkGZen-VmFQzrBI',
  hostTimeoutMs: 15000,
  heartbeatIntervalMs: 5000,
  reconnectIntervalMs: 3000,
  maxReconnectAttempts: 5,
  enableMultiplayer: true,
};

const SUPABASE_CONFIG = window.BEDWARS_CONFIG;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SUPABASE_CONFIG, BEDWARS_CONFIG: window.BEDWARS_CONFIG };
}

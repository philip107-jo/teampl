const fs = require('fs');

const cssContent = `
:root {
  --theme-bg: #F8FAFF;
  --theme-card: #FFFFFF;
  --theme-card-hover: #F9FAFB;
  --theme-border: #E7EAF3;
  --theme-border-strong: #D9E1F2;
  
  --theme-text-title: #101828;
  --theme-text-body: #344054;
  --theme-text-sub: #667085;
  --theme-text-label: #98A2B3;
  
  --theme-hero: #FFFFFF;
  --theme-hero-glow: radial-gradient(circle at 85% 20%, rgba(124,108,255,.22), transparent 32%);
  --theme-hero-shadow: 0 8px 24px rgba(16,24,40,.06);
  
  --theme-progress-track: #EEF2FF;
  --theme-progress-fill: linear-gradient(90deg, #7C6CFF 0%, #4D8DFF 100%);
  
  --theme-overlay: rgba(255, 255, 255, 0.9);
  --theme-shadow: 0 8px 24px rgba(16,24,40,.06);
  --theme-shadow-hover: 0 12px 32px rgba(16,24,40,.1);
  --theme-icon-shadow: none;

  /* Soft Tinted Rows */
  --tint-purple-bg: #F4F0FF;
  --tint-purple-text: #7C6CFF;
  --tint-purple-icon-bg: #FFFFFF;
  
  --tint-orange-bg: #FFF6E8;
  --tint-orange-text: #F5A623;
  --tint-orange-icon-bg: #FFFFFF;
  
  --tint-blue-bg: #EEF4FF;
  --tint-blue-text: #4D8DFF;
  --tint-blue-icon-bg: #FFFFFF;
  
  --tint-green-bg: #E6F8F3;
  --tint-green-text: #27D7A1;
  --tint-green-icon-bg: #FFFFFF;
  
  --tint-red-bg: #FDF2F4;
  --tint-red-text: #FF6B7A;
  --tint-red-icon-bg: #FFFFFF;
}

.dark {
  --theme-bg: #0B1020;
  --theme-card: #151C31;
  --theme-card-hover: #1A2340;
  --theme-border: rgba(255, 255, 255, 0.05);
  --theme-border-strong: rgba(255, 255, 255, 0.1);
  
  --theme-text-title: #F5F7FF;
  --theme-text-body: #D1D5DB;
  --theme-text-sub: #7D879C;
  --theme-text-label: rgba(255, 255, 255, 0.4);
  
  --theme-hero: linear-gradient(135deg, #151C31 70%, #252552 100%);
  --theme-hero-glow: radial-gradient(circle at center, rgba(111, 99, 255, 0.85), transparent 70%);
  --theme-hero-shadow: 0 10px 30px rgba(0,0,0,0.3);
  
  --theme-progress-track: rgba(255, 255, 255, 0.05);
  --theme-progress-fill: linear-gradient(90deg, #7C6CFF, #3B82F6);
  
  --theme-overlay: rgba(11, 16, 32, 0.8);
  --theme-shadow: 0 10px 30px rgba(0,0,0,0.3);
  --theme-shadow-hover: 0 15px 40px rgba(0,0,0,0.4);
  --theme-icon-shadow: 0 0 15px rgba(255,255,255,0.2);

  /* Dark mode keeps the existing schedule blocks */
  --tint-purple-bg: #251B45;
  --tint-purple-text: #B598FF;
  --tint-purple-icon-bg: #B598FF;
  
  --tint-orange-bg: #3D3428;
  --tint-orange-text: #FFB547;
  --tint-orange-icon-bg: #FFB547;
  
  --tint-blue-bg: #1E2C4A;
  --tint-blue-text: #7C6CFF;
  --tint-blue-icon-bg: #7C6CFF;
  
  --tint-green-bg: #152B24;
  --tint-green-text: #27D7A1;
  --tint-green-icon-bg: #27D7A1;
  
  --tint-red-bg: #3D222A;
  --tint-red-text: #FF6B7A;
  --tint-red-icon-bg: #FF6B7A;
}

.dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem;
  padding-bottom: 6rem;
  max-width: 64rem;
  margin: 0 auto;
  color: var(--theme-text-body);
  position: relative;
}

.card {
  background: var(--theme-card);
  border-radius: 20px;
  padding: 1.5rem;
  border: 1px solid var(--theme-border);
  box-shadow: var(--theme-shadow);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

/* Hero Card */
.hero-card {
  background: var(--theme-hero);
  box-shadow: var(--theme-hero-shadow);
  padding: 2rem 3rem;
  border-radius: 24px;
}

.hero-card::after {
  content: '';
  position: absolute;
  top: -30%;
  right: -10%;
  width: 60%;
  height: 150%;
  background: var(--theme-hero-glow);
  pointer-events: none;
}

.hero-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
  z-index: 10;
}

.hero-meta {
  color: var(--theme-text-sub);
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.hero-title {
  color: var(--theme-text-title);
  font-size: 1.875rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.025em;
}

.hero-action {
  background: var(--theme-card);
  border: 1px solid var(--theme-border);
  border-radius: 14px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s, background 0.2s;
  color: var(--theme-text-title);
}

.hero-action:hover {
  transform: scale(1.05);
  background: var(--theme-card-hover);
}

.hero-bottom {
  margin-top: 3rem;
  position: relative;
  z-index: 10;
}

.hero-progress-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 0.5rem;
}

.hero-progress-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--theme-text-sub);
}

.hero-progress-value {
  color: var(--theme-text-title);
  font-size: 1.25rem;
  font-weight: 900;
}

.progress-track {
  width: 100%;
  background: var(--theme-progress-track);
  height: 10px;
  border-radius: 999px;
  border: 1px solid var(--theme-border);
  overflow: hidden;
}

.progress-fill {
  width: 33%;
  height: 100%;
  background: var(--theme-progress-fill);
  border-radius: 999px;
  position: relative;
}

/* Schedule Card */
.schedule-card {
  padding: 1.5rem 2rem;
  border-radius: 24px;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.head-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.icon-chip {
  background: var(--theme-bg);
  border: 1px solid var(--theme-border-strong);
  border-radius: 12px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-title {
  color: var(--theme-text-title);
  font-size: 1.25rem;
  font-weight: 900;
  margin: 0;
}

.badge {
  background: rgba(124, 108, 255, 0.1);
  color: #7C6CFF;
  border: 1px solid rgba(124, 108, 255, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 800;
}

.schedule-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.schedule-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-radius: 16px;
  border: 1px solid transparent; /* Replaced by tint border if needed or var(--theme-border) */
}
.dark .schedule-item {
  border: 1px solid var(--theme-border);
}

.schedule-main {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.schedule-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.1rem;
  box-shadow: var(--theme-icon-shadow);
}
.dark .schedule-icon { color: white; }

.schedule-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--theme-text-title);
}

.schedule-date {
  margin: 0;
  margin-top: 0.2rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--theme-text-sub);
}

.schedule-status {
  font-size: 0.65rem;
  font-weight: 900;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  background: var(--theme-card);
  border: 1px solid var(--theme-border);
}
.dark .schedule-status {
  background: var(--theme-border);
}

/* Tint assignments */
.schedule-item.purple { background: var(--tint-purple-bg); }
.schedule-item.purple .schedule-icon { background: var(--tint-purple-icon-bg); color: var(--tint-purple-text); }
.schedule-item.purple .schedule-status { color: var(--tint-purple-text); }
.dark .schedule-item.purple .schedule-icon { box-shadow: 0 0 15px rgba(181, 152, 255, 0.5); }

.schedule-item.orange { background: var(--tint-orange-bg); }
.schedule-item.orange .schedule-icon { background: var(--tint-orange-icon-bg); color: var(--tint-orange-text); }
.schedule-item.orange .schedule-status { color: var(--tint-orange-text); }
.dark .schedule-item.orange .schedule-icon { box-shadow: 0 0 15px rgba(255, 181, 71, 0.5); }

.schedule-item.blue { background: var(--tint-blue-bg); }
.schedule-item.blue .schedule-icon { background: var(--tint-blue-icon-bg); color: var(--tint-blue-text); }
.schedule-item.blue .schedule-status { color: var(--tint-blue-text); }
.dark .schedule-item.blue .schedule-icon { box-shadow: 0 0 15px rgba(124, 108, 255, 0.5); }

.schedule-item.green { background: var(--tint-green-bg); }
.schedule-item.green .schedule-icon { background: var(--tint-green-icon-bg); color: var(--tint-green-text); }
.schedule-item.green .schedule-status { color: var(--tint-green-text); }
.dark .schedule-item.green .schedule-icon { box-shadow: 0 0 15px rgba(39, 215, 161, 0.5); }

.schedule-item.red { background: var(--tint-red-bg); }
.schedule-item.red .schedule-icon { background: var(--tint-red-icon-bg); color: var(--tint-red-text); }
.schedule-item.red .schedule-status { color: var(--tint-red-text); }
.dark .schedule-item.red .schedule-icon { box-shadow: 0 0 15px rgba(255, 107, 122, 0.5); }

/* Section Head */
.section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: 0.5rem;
}

.section-kicker {
  font-size: 1.1rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--theme-text-title);
}
.dark .section-kicker {
  text-shadow: 0 0 8px rgba(124, 108, 255, 0.4);
}

.section-sub {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--theme-text-sub);
  margin-top: 0.25rem;
}

.filter-btn {
  background: #FFFFFF;
  color: #344054;
  border: 1px solid #D9E1F2;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}
.filter-btn:hover {
  background: #F8FAFF;
}
.filter-btn:focus {
  box-shadow: 0 0 0 4px rgba(124,108,255,.12);
  outline: none;
}
.dark .filter-btn {
  background: var(--theme-card);
  color: white;
  border: 1px solid var(--theme-border-strong);
}
.dark .filter-btn:hover {
  background: var(--theme-card-hover);
}
.dark .filter-btn:focus {
  box-shadow: none;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

@media (max-width: 768px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}

.stat-card {
  background: var(--theme-card);
  border-radius: 24px;
  padding: 1.5rem;
  border: 1px solid var(--theme-border);
  box-shadow: var(--theme-shadow);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}
.stat-card .top-row {
  display: flex;
  justify-content: space-between;
  width: 100%;
  align-items: center;
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--theme-text-sub);
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 900;
  line-height: 1;
  color: var(--theme-text-title);
  margin-bottom: 0.25rem;
}

.stat-delta {
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.stat-delta.positive { color: #27D7A1; }
.stat-delta.negative { color: #FF6B7A; }
.stat-delta.neutral { color: var(--theme-text-sub); }
.stat-delta-date {
  color: var(--theme-text-label);
  font-weight: 600;
  font-size: 0.7rem;
  margin-left: 0.25rem;
}

.stat-card.orange .stat-icon { background: var(--tint-orange-bg); color: var(--tint-orange-text); }
.stat-card.green .stat-icon { background: var(--tint-green-bg); color: var(--tint-green-text); }
.stat-card.red .stat-icon { background: var(--tint-red-bg); color: var(--tint-red-text); }
.stat-card.purple .stat-icon { background: var(--tint-purple-bg); color: var(--tint-purple-text); }

.dark .stat-card.orange .stat-icon { background: rgba(255, 181, 71, 0.2); box-shadow: 0 0 20px rgba(255, 181, 71, 0.4); text-shadow: 0 0 10px #FFB547;}
.dark .stat-card.green .stat-icon { background: rgba(39, 215, 161, 0.2); box-shadow: 0 0 20px rgba(39, 215, 161, 0.4); text-shadow: 0 0 10px #27D7A1;}
.dark .stat-card.red .stat-icon { background: rgba(255, 107, 122, 0.2); box-shadow: 0 0 20px rgba(255, 107, 122, 0.4); text-shadow: 0 0 10px #FF6B7A;}
.dark .stat-card.purple .stat-icon { background: rgba(124, 108, 255, 0.2); box-shadow: 0 0 20px rgba(124, 108, 255, 0.4); text-shadow: 0 0 10px #7C6CFF;}

/* Analysis Grid */
.analysis-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .analysis-grid { grid-template-columns: 1fr; }
}

.analysis-card {
  background: var(--theme-card);
  padding: 2rem;
  border-radius: 32px;
}

.analysis-title {
  font-size: 0.8rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  margin-top: 0;
  color: var(--theme-text-title);
}

.analysis-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #7C6CFF;
}
.dark .analysis-dot {
  box-shadow: 0 0 8px rgba(124, 108, 255, 0.8);
}

.donut-card .analysis-dot {
  background: #27D7A1;
}
.dark .donut-card .analysis-dot {
  box-shadow: 0 0 8px rgba(39, 215, 161, 0.8);
}

.contribution-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.member-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.member-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.member-name {
  font-size: 0.8rem;
  font-weight: 800;
  color: var(--theme-text-body);
}

.member-count {
  font-size: 0.65rem;
  font-weight: 600;
  background: var(--theme-border);
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  color: var(--theme-text-sub);
}

.member-tag {
  font-size: 0.6rem;
  font-weight: 900;
  background: rgba(124, 108, 255, 0.1);
  color: #7C6CFF;
  border: 1px solid rgba(124, 108, 255, 0.2);
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
}

.member-percent {
  font-size: 0.85rem;
  font-weight: 900;
  text-align: right;
  margin-top: -1.4rem;
  color: var(--theme-text-title);
}

.bar {
  width: 100%;
  height: 10px;
  background: #EEF2F7;
  border-radius: 999px;
  overflow: hidden;
}
.dark .bar {
  background: var(--theme-border);
}

.bar span {
  display: block;
  height: 100%;
  border-radius: 999px;
}

.bar.purple span { width: 38%; background: #7C6CFF; }
.bar.green span { width: 28%; background: #27D7A1; }
.bar.orange span { width: 20%; background: #F5A623; }
.bar.red span { width: 14%; background: #FF6B7A; }

.dark .bar.purple span { box-shadow: 0 0 10px #7C6CFF; }
.dark .bar.green span { box-shadow: 0 0 10px #27D7A1; }
.dark .bar.orange span { background: #FFB547; box-shadow: 0 0 10px #FFB547; }
.dark .bar.red span { box-shadow: 0 0 10px #FF6B7A; }

/* Donut Chart Mock */
.donut-card {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.donut-wrap {
  position: relative;
  width: 180px;
  height: 180px;
  margin: 1rem 0;
}

.donut {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: conic-gradient(
    #27D7A1 0% 34%,
    #7C6CFF 34% 52%,
    #E7EAF3 52% 60%,
    #FF6B7A 60% 63%,
    #F3F4F6 63% 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
}
.dark .donut {
  background: conic-gradient(
    #27D7A1 0% 34%,
    #7C6CFF 34% 52%,
    var(--theme-text-muted) 52% 60%,
    #FF6B7A 60% 63%,
    var(--theme-border) 63% 100%
  );
}

.donut-center {
  width: 125px;
  height: 125px;
  background: var(--theme-card);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.donut-value {
  font-size: 2rem;
  font-weight: 900;
  line-height: 1;
  color: var(--theme-text-title);
}

.donut-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--theme-text-sub);
  margin-top: 0.25rem;
}

.legend {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 100%;
  max-width: 280px;
  gap: 1.25rem 2rem;
  margin-top: 1.5rem;
}

.legend-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  font-weight: 800;
}

.legend-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--theme-text-sub);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend-dot.done { background: #27D7A1; }
.legend-dot.progress { background: #7C6CFF; }
.legend-dot.waiting { background: #E7EAF3; }
.legend-dot.delay { background: #FF6B7A; }

.dark .legend-dot.done { box-shadow: 0 0 8px #27D7A1; }
.dark .legend-dot.progress { box-shadow: 0 0 8px #7C6CFF; }
.dark .legend-dot.waiting { background: var(--theme-text-muted); box-shadow: 0 0 8px var(--theme-text-muted); }
.dark .legend-dot.delay { box-shadow: 0 0 8px #FF6B7A; }

.legend-value {
  color: var(--theme-text-title);
  font-size: 0.85rem;
}
`

fs.writeFileSync('c:\\Users\\kjhn3\\OneDrive\\Desktop\\tp\\teampl\\src\\styles\\midnight-theme.css', cssContent);
console.log('updated midnight-theme.css');

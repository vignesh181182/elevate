import { type CSSProperties, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Trophy, Ruler, ChartColumn, ChevronRight } from 'lucide-react';
import { useClientExercises } from '../hooks/useData';
import { muscleColor } from '../lib/muscleColors';
import { fmtPayDate } from '../lib/format';
import {
  progressSummary,
  muscleGroupProgress,
  exerciseProgression,
  detectPRs,
  defaultProgressExercise,
  hasProgressData,
  strengthToBodyweight,
} from '../domain/progress';
import Sparkline from './charts/Sparkline';
import ProgressionChart from './charts/ProgressionChart';
import LineChart from './charts/LineChart';
import type { Client } from '../domain/types';

const arrow = (v: number) => (v > 0 ? '↑' : v < 0 ? '↓' : '');

export default function ProgressCard({ client }: { client: Client }) {
  const navigate = useNavigate();
  const { data: exercises = [], isLoading } = useClientExercises(client.id);

  const exWithLogs = useMemo(() => exercises.filter((e) => e.logs && Object.keys(e.logs).length), [exercises]);
  const [selName, setSelName] = useState<string | null>(null);
  const measureKeys = Object.keys(client.measures || {});
  const [measureKey, setMeasureKey] = useState<string>(measureKeys[0] ?? '');

  if (isLoading) return <div className="cp-card"><div className="cl-loading">Loading progress…</div></div>;
  if (!hasProgressData(exercises)) return null; // no logged data → omit the section entirely

  const summary = progressSummary(exercises, client.programStartDate, client.sessions);
  const groups = muscleGroupProgress(exercises);
  const prs = detectPRs(exercises, client.programStartDate).slice(0, 8);
  const selected = selName && exWithLogs.some((e) => e.name === selName) ? selName : defaultProgressExercise(exercises);
  const pts = selected ? exerciseProgression(exercises, selected) : [];
  const selEx = exWithLogs.find((e) => e.name === selected);
  const mk = measureKey && measureKeys.includes(measureKey) ? measureKey : measureKeys[0];
  const mdata = mk ? client.measures[mk] ?? [] : [];
  const s2bw = strengthToBodyweight(exercises, client.measures?.Weight ?? []);

  const gain = summary.avgGain == null ? '—' : arrow(summary.avgGain) + Math.abs(summary.avgGain) + '%';
  const vol = summary.volChange == null ? '—' : arrow(summary.volChange) + Math.abs(summary.volChange) + '%';

  return (
    <>
      {client.goals && client.goals !== '—' && <div className="tab-cap">{client.goals}</div>}
      <div className="cp-card">
        <div className="cp-sec">
          <div className="cp-sec-t">
            <TrendingUp size={16} className="t-accent" />
            Strength progress
          </div>
        </div>
        <div className="pg-tiles">
          <div className="pg-tile">
            <div className="pg-tile-l">Est. 1RM gain</div>
            <div className={`pg-tile-v ${summary.avgGain && summary.avgGain > 0 ? 'pos' : ''}`}>{gain}</div>
          </div>
          <div className="pg-tile">
            <div className="pg-tile-l">Total volume</div>
            <div className={`pg-tile-v ${summary.volChange && summary.volChange > 0 ? 'pos' : ''}`}>{vol}</div>
          </div>
          <div className="pg-tile">
            <div className="pg-tile-l">New PRs</div>
            <div className={`pg-tile-v ${summary.prCount > 0 ? 'pos' : ''}`}>{summary.prCount}</div>
          </div>
          <div className="pg-tile">
            <div className="pg-tile-l">Sessions</div>
            <div className="pg-tile-v">{summary.sessions}</div>
          </div>
        </div>

        {groups.length > 0 && (
          <div className="pg-mg-grid cp-hist-h">
            {groups.map((g) => {
              const col = muscleColor(g.group);
              const tagStyle = { '--c-fg': col.c, '--c-bg': col.b } as CSSProperties;
              return (
                <div className="pg-mg" key={g.group}>
                  <div className="pg-mg-top">
                    <span className="pg-mg-tag tint-cat" style={tagStyle}>
                      {g.group}
                    </span>
                    <span className={`pg-mg-gain ${g.gainPct != null && g.gainPct > 0 ? 'pos' : 'flat'}`}>
                      {g.gainPct == null ? '—' : `${arrow(g.gainPct)}${Math.abs(g.gainPct)}%`}
                    </span>
                  </div>
                  <div className="pg-mg-spark">
                    <Sparkline vals={g.sparkline} stroke={col.c} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="cp-card">
        <div className="cp-sec">
          <div className="cp-sec-t">Exercise progression</div>
        </div>
        <div className="pg-exsel">
          {exWithLogs
            .slice()
            .sort((a, b) => (a.group ?? '~').localeCompare(b.group ?? '~') || a.name.localeCompare(b.name))
            .map((e) => {
              const col = muscleColor(e.group ?? '');
              const dotStyle = { '--c-bg': col.c } as CSSProperties;
              return (
                <button
                  key={e.name}
                  className={`pg-exchip ${e.name === selected ? 'on' : ''}`}
                  onClick={() => setSelName(e.name)}
                >
                  <i className="pg-exchip-dot swatch" style={dotStyle} />
                  {e.name}
                </button>
              );
            })}
        </div>
        <div className="chart-wrap flush">
          <ProgressionChart pts={pts} />
        </div>
        {pts.length > 1 && (
          <div className="pg-legend">
            <span className="pg-leg">
              <i className="pg-leg-l" />
              Est. 1RM
            </span>
            <span className="pg-leg">
              <i className="pg-leg-l dash" />
              Weight lifted
            </span>
          </div>
        )}
        {selEx && (
          <div className="tab-cap center-pt">
            {selEx.name}
            {selEx.target ? ` · target ${selEx.target}` : ''}
          </div>
        )}
      </div>

      <div className="cp-card">
        <div className="cp-sec">
          <div className="cp-sec-t">
            <Trophy size={16} className="t-amber" />
            PR timeline
          </div>
        </div>
        {prs.length ? (
          prs.map((p) => {
            const col = muscleColor(p.group ?? '');
            const tagStyle = { '--c-fg': col.c, '--c-bg': col.b } as CSSProperties;
            return (
              <div className="pg-pr" key={`${p.exName}-${p.week}`}>
                <div className="pg-pr-ic">🏆</div>
                <div className="pg-pr-main">
                  <div className="pg-pr-name">
                    {p.exName}
                    {p.group && (
                      <span className="pg-mg-tag tint-cat" style={tagStyle}>
                        {p.group}
                      </span>
                    )}
                  </div>
                  <div className="pg-pr-sub">
                    {p.date ? `${fmtPayDate(p.date)} · ` : ''}Week {p.week}
                  </div>
                </div>
                <div className="pg-pr-wt">
                  {p.weight}
                  <small> kg</small>
                </div>
              </div>
            );
          })
        ) : (
          <div className="pg-empty">No PRs logged yet — they'll appear as weights climb.</div>
        )}
      </div>

      {measureKeys.length > 0 && (
        <div className="cp-card">
          <div className="cp-sec">
            <div className="cp-sec-t">
              <Ruler size={16} className="t-blue" />
              Body measurements
            </div>
          </div>
          <div className="measure-pick">
            {measureKeys.map((k) => (
              <button key={k} className={`mp ${mk === k ? 'on' : ''}`} onClick={() => setMeasureKey(k)}>
                {k}
              </button>
            ))}
          </div>
          <div className="chart-wrap">
            <LineChart data={mdata} />
          </div>
          {mdata.length > 1 && (
            <div className="tab-cap center">
              {mk}: {mdata[0]} → {mdata[mdata.length - 1]}
            </div>
          )}
          {s2bw.length > 0 && (
            <div className="pg-sbw">
              <div className="pg-sbw-h">Strength-to-bodyweight</div>
              {s2bw.map((r) => (
                <div className="pg-sbw-row" key={r.name}>
                  <div className="pg-sbw-main">
                    <div className="pg-sbw-name">{r.name}</div>
                    <div className="pg-sbw-spark">
                      <Sparkline vals={r.series} />
                    </div>
                  </div>
                  <div className="pg-sbw-v">
                    {r.first.toFixed(1)}× → <b>{r.last.toFixed(1)}×</b>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="report-row" onClick={() => navigate(`/clients/${client.id}/report`)}>
        <div className="ac-ic abg ic-42">
          <ChartColumn />
        </div>
        <div className="ac-main">
          <div className="ac-title">Program completion report</div>
          <div className="ac-sub">Generate when block ends</div>
        </div>
        <div className="cr-chev">
          <ChevronRight />
        </div>
      </div>
      <div className="sp14" />
    </>
  );
}

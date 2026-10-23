/**
 * Scoring Format Picker
 * Preset formats as tappable cards, plus a custom builder (points per set,
 * number of sets, deuce and cap) with a plain-language summary of the rules.
 */

import React, { useState } from 'react';
import { Minus, Plus, Info } from 'lucide-react';
import { SCORING_TYPES } from '../lib/constants';
import {
    SET_OPTIONS,
    POINT_PRESETS,
    MIN_POINTS,
    MAX_POINTS,
    MAX_CAP,
    defaultCap,
    describeFormat,
    pickerToConfig
} from '../lib/scoringFormat';

const PRESET_CARDS = [
    { type: SCORING_TYPES.STANDARD_21, title: 'Best of 3', sub: '21 pts · deuce' },
    { type: SCORING_TYPES.SINGLE_21, title: '1 set · 21', sub: 'deuce to 30' },
    { type: SCORING_TYPES.SINGLE_30, title: '1 set · 30', sub: 'no deuce' },
    { type: SCORING_TYPES.CUSTOM, title: 'Custom', sub: 'your own rules' }
];

/**
 * Number field with big − / + buttons. Typing is free-form; the value is
 * clamped when the field loses focus.
 */
const Stepper = ({ value, min, max, onChange, label }) => {
    // Draft text only while the field is being typed in
    const [text, setText] = useState(null);

    const commit = (raw) => {
        const n = parseInt(raw, 10);
        const next = Number.isFinite(n) ? Math.min(Math.max(n, min), max) : value;
        setText(null);
        if (next !== value) onChange(next);
    };

    return (
        <div className="stepper">
            <button type="button" onClick={() => commit(value - 1)} disabled={value <= min} aria-label={`Decrease ${label}`}>
                <Minus size={18} />
            </button>
            <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                aria-label={label}
                value={text ?? String(value)}
                onFocus={(e) => { setText(String(value)); e.target.select(); }}
                onChange={(e) => setText(e.target.value.replace(/\D/g, '').slice(0, 2))}
                onBlur={(e) => commit(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }}
            />
            <button type="button" onClick={() => commit(value + 1)} disabled={value >= max} aria-label={`Increase ${label}`}>
                <Plus size={18} />
            </button>
        </div>
    );
};

const ScoringFormatPicker = ({ value, onChange }) => {
    const { scoringType, custom } = value;
    const isCustom = scoringType === SCORING_TYPES.CUSTOM;

    const setCustom = (patch) => {
        const next = { ...custom, ...patch };
        // Keep the cap in step with the target until the user sets it themselves
        if ('winPoints' in patch && !next.capEdited) next.cap = Math.min(defaultCap(next.winPoints), MAX_CAP);
        if (next.cap <= next.winPoints) next.cap = Math.min(next.winPoints + 1, MAX_CAP);
        onChange({ ...value, custom: next });
    };

    return (
        <div>
            <div className="choice-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                {PRESET_CARDS.map(card => (
                    <button
                        key={card.type}
                        type="button"
                        className={`choice ${scoringType === card.type ? 'choice-active' : ''}`}
                        onClick={() => onChange({ ...value, scoringType: card.type })}
                    >
                        {card.title}
                        <small>{card.sub}</small>
                    </button>
                ))}
            </div>

            {isCustom && (
                <div className="format-panel">
                    <div className="format-field">
                        <div className="format-label">Points to win a set</div>
                        <div className="chip-grid" style={{ marginBottom: '10px' }}>
                            {POINT_PRESETS.map(p => (
                                <button
                                    key={p}
                                    type="button"
                                    className={`chip ${custom.winPoints === p ? 'chip-active' : ''}`}
                                    style={{ minWidth: '52px', justifyContent: 'center', padding: '8px 12px' }}
                                    onClick={() => setCustom({ winPoints: p })}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                        <Stepper
                            label="points to win a set"
                            value={custom.winPoints}
                            min={MIN_POINTS}
                            max={MAX_POINTS}
                            onChange={(winPoints) => setCustom({ winPoints })}
                        />
                    </div>

                    <div className="format-field">
                        <div className="format-label">Number of sets</div>
                        <div className="choice-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                            {SET_OPTIONS.map(n => (
                                <button
                                    key={n}
                                    type="button"
                                    className={`choice ${custom.maxSets === n ? 'choice-active' : ''}`}
                                    onClick={() => setCustom({ maxSets: n })}
                                >
                                    {n === 1 ? '1 set' : `Best of ${n}`}
                                    <small>{n === 1 ? 'one game' : `first to ${Math.ceil(n / 2)} sets`}</small>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="format-field">
                        <label className="toggle-row">
                            <span>
                                <span className="format-label" style={{ marginBottom: 0 }}>Deuce (win by 2)</span>
                                <span className="format-hint">
                                    {custom.deuce
                                        ? `At ${custom.winPoints - 1}-all, play on until someone leads by 2`
                                        : `First to ${custom.winPoints} wins, even at ${custom.winPoints}–${custom.winPoints - 1}`}
                                </span>
                            </span>
                            <input
                                type="checkbox"
                                className="toggle"
                                checked={custom.deuce}
                                onChange={(e) => setCustom({ deuce: e.target.checked })}
                            />
                        </label>

                        {custom.deuce && (
                            <div style={{ marginTop: '12px' }}>
                                <div className="format-label">Maximum score (cap)</div>
                                <div className="format-hint" style={{ marginBottom: '8px' }}>
                                    At {custom.cap - 1}-all the next point wins, so a set can't go past {custom.cap}
                                </div>
                                <Stepper
                                    label="maximum score"
                                    value={custom.cap}
                                    min={custom.winPoints + 1}
                                    max={MAX_CAP}
                                    onChange={(cap) => setCustom({ cap, capEdited: true })}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="notice" style={{ marginTop: '12px', background: 'var(--accent-light)', color: 'var(--text-primary)' }}>
                <Info size={18} style={{ flexShrink: 0, color: 'var(--accent-primary)' }} />
                <span>{describeFormat(pickerToConfig(value))}</span>
            </div>
        </div>
    );
};

export default ScoringFormatPicker;

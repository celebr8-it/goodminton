/**
 * Score Input Component
 * Reusable component for inputting match scores
 * Follows Component Composition pattern
 */

import React, { useState, useEffect } from 'react';
import { Plus, Minus, Check, X } from 'lucide-react';

/**
 * Score Input Component
 * Provides increment/decrement controls for score entry
 */
export function ScoreInput({
    label,
    value = 0,
    onChange,
    max = 99,
    min = 0,
    disabled = false,
    teamColor = 'var(--accent-primary)'
}) {
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleIncrement = () => {
        const newValue = Math.min(localValue + 1, max);
        setLocalValue(newValue);
        onChange?.(newValue);
    };

    const handleDecrement = () => {
        const newValue = Math.max(localValue - 1, min);
        setLocalValue(newValue);
        onChange?.(newValue);
    };

    const handleInputChange = (e) => {
        const newValue = parseInt(e.target.value, 10);
        if (isNaN(newValue)) {
            setLocalValue(0);
            onChange?.(0);
        } else {
            const clampedValue = Math.min(Math.max(newValue, min), max);
            setLocalValue(clampedValue);
            onChange?.(clampedValue);
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
        }}>
            {label && (
                <label style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    textAlign: 'center'
                }}>
                    {label}
                </label>
            )}

            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-secondary)',
                border: '2px solid var(--border-color)'
            }}>
                <button
                    type="button"
                    onClick={handleDecrement}
                    disabled={disabled || localValue <= min}
                    style={{
                        padding: '8px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        cursor: disabled || localValue <= min ? 'not-allowed' : 'pointer',
                        opacity: disabled || localValue <= min ? 0.5 : 1,
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        if (!disabled && localValue > min) {
                            e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
                            e.currentTarget.style.color = 'white';
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                >
                    <Minus size={20} />
                </button>

                <input
                    type="number"
                    value={localValue}
                    onChange={handleInputChange}
                    disabled={disabled}
                    min={min}
                    max={max}
                    style={{
                        width: '50px',
                        padding: '6px 2px',
                        fontSize: '20px',
                        fontWeight: 700,
                        textAlign: 'center',
                        border: 'none',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-primary)',
                        color: teamColor,
                        outline: 'none'
                    }}
                />

                <button
                    type="button"
                    onClick={handleIncrement}
                    disabled={disabled || localValue >= max}
                    style={{
                        padding: '8px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        cursor: disabled || localValue >= max ? 'not-allowed' : 'pointer',
                        opacity: disabled || localValue >= max ? 0.5 : 1,
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        if (!disabled && localValue < max) {
                            e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
                            e.currentTarget.style.color = 'white';
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                >
                    <Plus size={20} />
                </button>
            </div>
        </div>
    );
}

/**
 * Set Score Card Component
 * Displays score input for both teams in a set
 */
export function SetScoreCard({
    setNumber,
    teamAName,
    teamBName,
    scoreTeamA = 0,
    scoreTeamB = 0,
    onScoreChange,
    onSave,
    onCancel,
    disabled = false,
    winPoints = 21
}) {
    const [localScoreA, setLocalScoreA] = useState(scoreTeamA);
    const [localScoreB, setLocalScoreB] = useState(scoreTeamB);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        setLocalScoreA(scoreTeamA);
        setLocalScoreB(scoreTeamB);
        setHasChanges(false);
    }, [scoreTeamA, scoreTeamB]);

    const handleScoreAChange = (newScore) => {
        setLocalScoreA(newScore);
        setHasChanges(true);
        onScoreChange?.(newScore, localScoreB);
    };

    const handleScoreBChange = (newScore) => {
        setLocalScoreB(newScore);
        setHasChanges(true);
        onScoreChange?.(localScoreA, newScore);
    };

    const handleSave = () => {
        onSave?.(localScoreA, localScoreB);
        setHasChanges(false);
    };

    const handleCancel = () => {
        setLocalScoreA(scoreTeamA);
        setLocalScoreB(scoreTeamB);
        setHasChanges(false);
        onCancel?.();
    };

    const handleIncrement = (team) => {
        if (team === 'A') {
            const newValue = Math.min(localScoreA + 1, 99);
            handleScoreAChange(newValue);
        } else {
            const newValue = Math.min(localScoreB + 1, 99);
            handleScoreBChange(newValue);
        }
    };

    const handleDecrement = (team) => {
        if (team === 'A') {
            const newValue = Math.max(localScoreA - 1, 0);
            handleScoreAChange(newValue);
        } else {
            const newValue = Math.max(localScoreB - 1, 0);
            handleScoreBChange(newValue);
        }
    };

    const winner = localScoreA > localScoreB ? 'A' : localScoreB > localScoreA ? 'B' : null;

    const ScoreButton = ({ onClick, disabled: btnDisabled, children }) => (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled || btnDisabled}
            style={{
                width: '44px',
                height: '44px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                cursor: disabled || btnDisabled ? 'not-allowed' : 'pointer',
                opacity: disabled || btnDisabled ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                fontSize: '20px',
                fontWeight: 'bold'
            }}
        >
            {children}
        </button>
    );

    return (
        <div className="card" style={{
            padding: '20px',
            border: '2px solid var(--border-color)'
        }}>
            <h3 style={{
                fontSize: '16px',
                fontWeight: 700,
                marginBottom: '16px',
                textAlign: 'center',
                color: 'var(--text-primary)'
            }}>
                Set {setNumber}
            </h3>

            {/* Team Names Row */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '12px',
                padding: '0 8px'
            }}>
                <span style={{
                    flex: 1,
                    textAlign: 'center',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: winner === 'A' ? 'var(--success-color)' : 'var(--text-primary)'
                }}>
                    {teamAName}
                </span>
                <span style={{ width: '40px' }}></span>
                <span style={{
                    flex: 1,
                    textAlign: 'center',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: winner === 'B' ? 'var(--success-color)' : 'var(--text-primary)'
                }}>
                    {teamBName}
                </span>
            </div>

            {/* Score Inputs Row - All in one line */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-secondary)'
            }}>
                {/* Team A Controls */}
                <ScoreButton onClick={() => handleDecrement('A')} disabled={localScoreA <= 0}>
                    −
                </ScoreButton>
                <input
                    type="number"
                    value={localScoreA}
                    onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val >= 0 && val <= 99) {
                            handleScoreAChange(val);
                        } else if (e.target.value === '') {
                            handleScoreAChange(0);
                        }
                    }}
                    disabled={disabled}
                    min="0"
                    max="99"
                    style={{
                        width: '60px',
                        height: '44px',
                        textAlign: 'center',
                        fontSize: '24px',
                        fontWeight: 700,
                        color: winner === 'A' ? 'var(--success-color)' : 'var(--text-primary)',
                        backgroundColor: 'var(--bg-primary)',
                        borderRadius: '8px',
                        border: 'none',
                        outline: 'none',
                        MozAppearance: 'textfield'
                    }}
                />
                <ScoreButton onClick={() => handleIncrement('A')} disabled={localScoreA >= 99}>
                    +
                </ScoreButton>

                {/* Separator */}
                <div style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    padding: '0 8px'
                }}>
                    :
                </div>

                {/* Team B Controls */}
                <ScoreButton onClick={() => handleDecrement('B')} disabled={localScoreB <= 0}>
                    −
                </ScoreButton>
                <input
                    type="number"
                    value={localScoreB}
                    onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val >= 0 && val <= 99) {
                            handleScoreBChange(val);
                        } else if (e.target.value === '') {
                            handleScoreBChange(0);
                        }
                    }}
                    disabled={disabled}
                    min="0"
                    max="99"
                    style={{
                        width: '60px',
                        height: '44px',
                        textAlign: 'center',
                        fontSize: '24px',
                        fontWeight: 700,
                        color: winner === 'B' ? 'var(--success-color)' : 'var(--text-primary)',
                        backgroundColor: 'var(--bg-primary)',
                        borderRadius: '8px',
                        border: 'none',
                        outline: 'none',
                        MozAppearance: 'textfield'
                    }}
                />
                <ScoreButton onClick={() => handleIncrement('B')} disabled={localScoreB >= 99}>
                    +
                </ScoreButton>
            </div>

            {hasChanges && (
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'center',
                    marginTop: '16px'
                }}>
                    <button
                        onClick={handleCancel}
                        className="btn-secondary"
                        disabled={disabled}
                    >
                        <X size={16} />
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="btn-primary"
                        disabled={disabled}
                    >
                        <Check size={16} />
                        Save Set
                    </button>
                </div>
            )}
        </div>
    );
}

/**
 * Team Builder
 * Two skill buckets (strong / moderate-developing) ranked by drag and drop,
 * then paired so teammates come from different buckets wherever possible.
 * Drag uses pointer events so it works with touch on phones.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    GripVertical,
    ArrowLeftRight,
    X,
    Shuffle,
    Scale,
    Loader2,
    Users,
    AlertTriangle,
    RefreshCw
} from 'lucide-react';
import { TournamentService } from '../services/TournamentService';
import { loadBuckets, saveBuckets } from '../lib/buckets';
import { autoTeamName, playerDisplayName } from '../lib/names';

const LISTS = [
    { id: 'strong', title: 'Bucket 1 · Strong', hint: 'Drag to rank, best player on top' },
    { id: 'weak', title: 'Bucket 2 · Moderate / developing', hint: 'Drag to rank, best player on top' },
    { id: 'pool', title: 'Not placed', hint: 'Players here sit out. Tap 1 or 2 to place them.' }
];

const OTHER = { strong: 'weak', weak: 'strong' };

const TeamBuilder = ({ groupId, members, existingTeamCount, busy, onCreate }) => {
    const [buckets, setBuckets] = useState(() => loadBuckets(groupId));
    const [mode, setMode] = useState('balanced');
    const [preview, setPreview] = useState(null);
    const [drag, setDrag] = useState(null);
    const [over, setOver] = useState(null);

    const listRefs = useRef({});
    const itemRefs = useRef({});
    const overRef = useRef(null);

    const membersById = useMemo(() => new Map(members.map(m => [m.id, m])), [members]);

    // Drop players who left the group; everyone not in a bucket is in the pool
    const lists = useMemo(() => {
        const strong = buckets.strong.filter(id => membersById.has(id));
        const weak = buckets.weak.filter(id => membersById.has(id));
        const placed = new Set([...strong, ...weak]);
        const pool = members
            .filter(m => !placed.has(m.id))
            .sort((a, b) => playerDisplayName(a).localeCompare(playerDisplayName(b)))
            .map(m => m.id);
        return { strong, weak, pool };
    }, [buckets, members, membersById]);

    useEffect(() => {
        saveBuckets(groupId, buckets);
    }, [groupId, buckets]);

    const moveItem = (id, toList, index) => {
        setPreview(null);
        setBuckets(prev => {
            const next = {
                strong: prev.strong.filter(x => x !== id),
                weak: prev.weak.filter(x => x !== id)
            };
            if (toList !== 'pool') {
                const list = [...next[toList]];
                list.splice(index ?? list.length, 0, id);
                next[toList] = list;
            }
            return next;
        });
    };

    // ---------- pointer drag & drop ----------

    const startDrag = (e, id, from) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        const el = itemRefs.current[id];
        if (!el) return;
        e.preventDefault();
        const rect = el.getBoundingClientRect();
        const start = { list: from, index: lists[from].indexOf(id) };
        overRef.current = start;
        setOver(start);
        setDrag({
            id,
            x: e.clientX,
            y: e.clientY,
            dx: e.clientX - rect.left,
            dy: e.clientY - rect.top,
            width: rect.width
        });
    };

    const dragId = drag?.id;
    useEffect(() => {
        if (!dragId) return;

        const findTarget = (x, y) => {
            for (const { id: listId } of LISTS) {
                const el = listRefs.current[listId];
                if (!el) continue;
                const r = el.getBoundingClientRect();
                if (x < r.left || x > r.right || y < r.top - 24 || y > r.bottom + 24) continue;

                const ids = lists[listId].filter(i => i !== dragId);
                let index = ids.length;
                for (let i = 0; i < ids.length; i++) {
                    const itemRect = itemRefs.current[ids[i]]?.getBoundingClientRect();
                    if (itemRect && y < itemRect.top + itemRect.height / 2) {
                        index = i;
                        break;
                    }
                }
                return { list: listId, index };
            }
            return null;
        };

        const onMove = (e) => {
            setDrag(d => (d ? { ...d, x: e.clientX, y: e.clientY } : d));
            const target = findTarget(e.clientX, e.clientY);
            if (target) {
                overRef.current = target;
                setOver(target);
            }
            // Auto-scroll near the screen edges (bottom nav takes ~90px)
            if (e.clientY < 90) window.scrollBy(0, -14);
            else if (e.clientY > window.innerHeight - 130) window.scrollBy(0, 14);
        };

        const onUp = () => {
            const target = overRef.current;
            if (target) moveItem(dragId, target.list, target.index);
            overRef.current = null;
            setDrag(null);
            setOver(null);
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
        return () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onUp);
        };
        // lists don't change during a drag, the drag id is what matters
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dragId]);

    // ---------- generation ----------

    const placedCount = lists.strong.length + lists.weak.length;

    const generate = () => {
        const toPlayers = ids => ids.map(id => membersById.get(id));
        setPreview(TournamentService.buildBucketPairs(
            toPlayers(lists.strong),
            toPlayers(lists.weak),
            { shuffle: mode === 'random' }
        ));
    };

    const create = () => {
        if (existingTeamCount > 0 && !confirm(`Replace the ${existingTeamCount} existing teams?`)) return;
        onCreate(preview.pairs);
    };

    const bucketOf = (id) => (lists.strong.includes(id) ? 1 : 2);

    // ---------- render ----------

    const renderItem = (id, listId, rank) => {
        const player = membersById.get(id);
        const isDragging = drag?.id === id;
        return (
            <div
                key={id}
                ref={el => { itemRefs.current[id] = el; }}
                className="bucket-item"
                style={{ opacity: isDragging ? 0.3 : 1 }}
            >
                <span
                    className="drag-handle"
                    onPointerDown={(e) => startDrag(e, id, listId)}
                    aria-label={`Drag ${playerDisplayName(player)}`}
                >
                    <GripVertical size={18} />
                </span>
                {rank && <span className="seed" style={{ marginRight: 0 }}>{rank}</span>}
                <span className="bucket-name">{playerDisplayName(player)}</span>
                {listId === 'pool' ? (
                    <>
                        <button type="button" className="icon-btn" onClick={() => moveItem(id, 'strong')} aria-label="Add to bucket 1">1</button>
                        <button type="button" className="icon-btn" onClick={() => moveItem(id, 'weak')} aria-label="Add to bucket 2">2</button>
                    </>
                ) : (
                    <>
                        <button type="button" className="icon-btn" onClick={() => moveItem(id, OTHER[listId])} aria-label="Move to other bucket">
                            <ArrowLeftRight size={15} />
                        </button>
                        <button type="button" className="icon-btn" onClick={() => moveItem(id, 'pool')} aria-label="Remove from bucket">
                            <X size={15} />
                        </button>
                    </>
                )}
            </div>
        );
    };

    const renderList = ({ id: listId, title, hint }) => {
        const ids = lists[listId];
        const isOver = drag && over?.list === listId;
        // The dragged item stays (dimmed) in its slot so the layout doesn't jump;
        // the drop line is placed by index among the other items
        const showLine = isOver && listId !== 'pool';
        const dropLine = <div key="drop" className="drop-line" />;
        const items = [];
        let visibleIndex = 0;
        ids.forEach((itemId, i) => {
            if (itemId !== drag?.id) {
                if (showLine && over.index === visibleIndex) items.push(dropLine);
                visibleIndex++;
            }
            items.push(renderItem(itemId, listId, listId === 'pool' ? null : i + 1));
        });
        if (showLine && over.index >= visibleIndex) items.push(dropLine);

        return (
            <div key={listId} className={`bucket ${listId === 'pool' ? 'bucket-pool' : ''} ${isOver ? 'bucket-over' : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>{title}</span>
                    <span className="eyebrow">{ids.length}</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>{hint}</div>
                <div ref={el => { listRefs.current[listId] = el; }} className="bucket-list">
                    {items}
                    {ids.length === 0 && !isOver && (
                        <div className="bucket-empty">
                            {listId === 'pool' ? 'Everyone is placed' : 'Drag players here'}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const ghostPlayer = drag ? membersById.get(drag.id) : null;
    const sameBucketPairs = preview ? preview.pairs.filter(([a, b]) => bucketOf(a.id) === bucketOf(b.id)).length : 0;
    const diff = Math.abs(lists.strong.length - lists.weak.length);

    return (
        <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
            <h3 className="section-title" style={{ fontSize: '16px', marginBottom: '4px' }}>
                <Users size={18} /> Team builder
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Each team gets one player from each bucket, so the teams come out even. Buckets are saved on this phone for next time.
            </p>

            {!preview ? (
                <>
                    <div className="list-gap" style={{ gap: '12px' }}>
                        {LISTS.map(renderList)}
                    </div>

                    <div className="eyebrow" style={{ margin: '16px 0 8px' }}>Pairing</div>
                    <div className="choice-grid">
                        <button type="button" className={`choice ${mode === 'balanced' ? 'choice-active' : ''}`} onClick={() => setMode('balanced')}>
                            <Scale size={16} style={{ display: 'inline', verticalAlign: '-3px', marginRight: '4px' }} />
                            Balanced
                            <small>#1 of bucket 1 + last of bucket 2</small>
                        </button>
                        <button type="button" className={`choice ${mode === 'random' ? 'choice-active' : ''}`} onClick={() => setMode('random')}>
                            <Shuffle size={16} style={{ display: 'inline', verticalAlign: '-3px', marginRight: '4px' }} />
                            Random
                            <small>Random, one from each bucket</small>
                        </button>
                    </div>

                    {placedCount >= 4 && (diff > 1 || placedCount % 2 === 1) && (
                        <div className="notice notice-warning" style={{ marginTop: '12px', fontSize: '13px' }}>
                            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                            <span>
                                {diff > 1 && `Buckets differ by ${diff}, so ${Math.floor(diff / 2)} team${diff >= 4 ? 's' : ''} will have two players from the same bucket. `}
                                {placedCount % 2 === 1 && 'Odd number of players: one will sit out.'}
                            </span>
                        </div>
                    )}

                    <button
                        type="button"
                        className="btn-primary btn-lg btn-block"
                        style={{ marginTop: '14px' }}
                        onClick={generate}
                        disabled={placedCount < 4}
                    >
                        {mode === 'random' ? <Shuffle size={18} /> : <Scale size={18} />}
                        {placedCount < 4 ? 'Place at least 4 players' : `Generate ${Math.floor(placedCount / 2)} teams`}
                    </button>
                </>
            ) : (
                <>
                    <div className="list-gap" style={{ gap: '8px' }}>
                        {preview.pairs.map(([a, b], i) => {
                            const same = bucketOf(a.id) === bucketOf(b.id);
                            return (
                                <div key={`${a.id}-${b.id}`} className="item-row" style={{ padding: '10px 12px', gap: '10px' }}>
                                    <span className="seed" style={{ marginRight: 0 }}>{i + 1}</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>{autoTeamName([a, b])}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            B{bucketOf(a.id)} #{lists[bucketOf(a.id) === 1 ? 'strong' : 'weak'].indexOf(a.id) + 1}
                                            {' + '}
                                            B{bucketOf(b.id)} #{lists[bucketOf(b.id) === 1 ? 'strong' : 'weak'].indexOf(b.id) + 1}
                                        </div>
                                    </div>
                                    {same && <span className="badge badge-draft" style={{ padding: '2px 8px', fontSize: '11px' }}>Same bucket</span>}
                                </div>
                            );
                        })}
                    </div>

                    {preview.sittingOut && (
                        <div className="notice notice-warning" style={{ marginTop: '12px', fontSize: '13px' }}>
                            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                            <span>{playerDisplayName(preview.sittingOut)} sits out (odd number of players).</span>
                        </div>
                    )}
                    {sameBucketPairs > 0 && (
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                            Uneven buckets, so {sameBucketPairs} team{sameBucketPairs > 1 ? 's share' : ' shares'} a bucket.
                        </p>
                    )}

                    <div className="list-gap" style={{ marginTop: '14px' }}>
                        <button type="button" className="btn-success btn-lg btn-block" onClick={create} disabled={busy}>
                            {busy ? <Loader2 className="animate-spin" size={18} /> : <Users size={18} />}
                            {busy ? 'Creating…' : `Create these ${preview.pairs.length} teams`}
                        </button>
                        <div style={{ display: 'grid', gridTemplateColumns: mode === 'random' ? '1fr 1fr' : '1fr', gap: '10px' }}>
                            {mode === 'random' && (
                                <button type="button" className="btn-secondary" onClick={generate} disabled={busy}>
                                    <RefreshCw size={16} /> Reshuffle
                                </button>
                            )}
                            <button type="button" className="btn-secondary" onClick={() => setPreview(null)} disabled={busy}>
                                Edit buckets
                            </button>
                        </div>
                    </div>
                </>
            )}

            {drag && ghostPlayer && (
                <div
                    className="bucket-item drag-ghost"
                    style={{ left: drag.x - drag.dx, top: drag.y - drag.dy, width: drag.width }}
                >
                    <span className="drag-handle"><GripVertical size={18} /></span>
                    <span className="bucket-name">{playerDisplayName(ghostPlayer)}</span>
                </div>
            )}
        </div>
    );
};

export default TeamBuilder;
